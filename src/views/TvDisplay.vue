<template>
  <div class="tv-display">
    <ReconnectingOverlay />
    
    <!-- Botão Admin (discreto, aparece ao passar o mouse) -->
    <button
      class="admin-button"
      title="Acessar Painel Admin (ou pressione Ctrl+Shift+A)"
      @click="goToAdmin"
    >
      ⚙️
    </button>
    
    <!-- Erro de configuração -->
    <div
      v-if="configError"
      class="config-error"
    >
      <div class="error-content">
        <h1>⚠️ Erro de Configuração</h1>
        <p>{{ configError }}</p>
        <div class="debug-info">
          <p><strong>Device ID:</strong> {{ deviceId || 'não encontrado' }}</p>
          <p><strong>Layout Type:</strong> {{ device?.layout_type || 'não encontrado' }}</p>
          <p><strong>Devices no banco:</strong> {{ devicesStore.devices.length }}</p>
          <p><strong>Settings no banco:</strong> {{ devicesStore.settings.length }}</p>
        </div>
        <button
          class="retry-button"
          @click="retryConfiguration"
        >
          🔄 Tentar Novamente
        </button>
        <button
          class="unpair-button"
          @click="unpairDevice"
        >
          🔓 Desparear TV
        </button>
      </div>
    </div>

    <!-- Orders View -->
    <transition
      name="fade"
      mode="out-in"
    >
      <component
        :is="OrdersComponent"
        v-if="currentContentType === 'orders' && !configError && hasOrders"
        key="orders"
      />
    </transition>

    <!-- Products Carousel -->
    <transition
      name="fade"
      mode="out-in"
    >
      <ProductsCarousel
        v-if="currentContentType === 'products' && !configError"
        key="products"
      />
    </transition>

    <!-- Media Player - Mantém estado com v-show -->
    <div
      v-show="currentContentType === 'media' && !configError"
      class="media-container"
    >
      <MediaPlayer ref="mediaPlayerRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/ordersStore'
import { useMediaStore } from '@/stores/mediaStore'
import { useDevicesStore } from '@/stores/devicesStore'
import { storage } from '@/services/storage'
import { watchdog } from '@/services/watchdog'
import { heartbeat } from '@/services/heartbeat'
import { supabase } from '@/services/supabase'
import OrdersViewList from '@/components/tv/OrdersViewList.vue'
import OrdersViewKanban from '@/components/tv/OrdersViewKanban.vue'
import ProductsCarousel from '@/components/tv/ProductsCarousel.vue'
import MediaPlayer from '@/components/tv/MediaPlayer.vue'
import ReconnectingOverlay from '@/components/tv/ReconnectingOverlay.vue'

type ContentType = 'orders' | 'products' | 'media'

const router = useRouter()
const ordersStore = useOrdersStore()
const mediaStore = useMediaStore()
const devicesStore = useDevicesStore()

const currentContentType = ref<ContentType | null>(null)
const rotationIndex = ref(0)
const mediaPlayerRef = ref<InstanceType<typeof MediaPlayer> | null>(null)
const configError = ref<string | null>(null)
const isInitialized = ref(false)
let rotationInterval: number | null = null
let fullscreenCheckInterval: number | null = null
let tokenRemovalChannel: any = null

const deviceId = computed(() => storage.getLocalStorage<string>('deviceId'))

const deviceSettings = computed(() => {
  if (!deviceId.value) return null
  return devicesStore.getDeviceSettings(deviceId.value)
})

const device = computed(() => {
  if (!deviceId.value) return null
  return devicesStore.devices.find(d => d.id === deviceId.value)
})

const hasOrders = computed(() => ordersStore.displayOrders.length > 0)
const hasProducts = computed(() => mediaStore.activeProducts.length > 0)
const hasMedia = computed(() => mediaStore.activeMedia.length > 0)

// Determinar qual componente de pedidos usar baseado no layout_type
const OrdersComponent = computed(() => {
  const layoutType = device.value?.layout_type || 'orders-list'
  return (layoutType === 'orders-kanban' || layoutType === 'orders-only-kanban') ? OrdersViewKanban : OrdersViewList
})

const rotationSequence = computed(() => {
  if (!isInitialized.value) {
    return []
  }

  const layoutType = device.value?.layout_type || 'orders-list'
  const sequence: ContentType[] = []
  
  switch (layoutType) {
    case 'media-only':
      if (hasMedia.value) {
        sequence.push('media')
      }
      break

    case 'orders-only':
    case 'orders-only-kanban':
      if (hasOrders.value) {
        sequence.push('orders')
      }
      break

    case 'orders-kanban':
    case 'orders-list':
    case 'default':
    default:
      // NOVA LÓGICA: Rotação mais equilibrada e rápida
      if (!deviceSettings.value) {
        // Sem configuração: rotação simples 1:1:1
        if (hasOrders.value) sequence.push('orders')
        if (hasProducts.value) sequence.push('products')
        if (hasMedia.value) sequence.push('media')
      } else {
        const settings = deviceSettings.value
        
        // OTIMIZAÇÃO: Limitar repetições para máximo de 3 por tipo
        // Isso garante rotação mais rápida e equilibrada
        
        if (hasOrders.value) {
          const ordersCount = Math.min(3, Math.max(1, Math.ceil((settings.orders_percentage ?? 70) / 30)))
          for (let i = 0; i < ordersCount; i++) sequence.push('orders')
        }

        if (hasProducts.value) {
          const productsCount = Math.min(2, Math.max(1, Math.ceil((settings.products_percentage ?? 10) / 30)))
          for (let i = 0; i < productsCount; i++) sequence.push('products')
        }

        if (hasMedia.value) {
          const mediaCount = Math.min(2, Math.max(1, Math.ceil((settings.media_percentage ?? 20) / 30)))
          for (let i = 0; i < mediaCount; i++) sequence.push('media')
        }
      }
      break
  }

  console.log('🔄 Sequência de rotação:', sequence)
  return sequence
})

function rotateContent(): void {
  if (rotationSequence.value.length === 0) {
    currentContentType.value = null
    return
  }

  rotationIndex.value = (rotationIndex.value + 1) % rotationSequence.value.length
  currentContentType.value = rotationSequence.value[rotationIndex.value]
  
  console.log(`🔄 Rotacionando para: ${currentContentType.value} (${rotationIndex.value + 1}/${rotationSequence.value.length})`)
  
  enterFullscreen()
}

function startRotation(): void {
  if (rotationInterval) clearInterval(rotationInterval)
  
  if (rotationSequence.value.length === 0) {
    currentContentType.value = null
    return
  }

  if (rotationSequence.value.length === 1) {
    currentContentType.value = rotationSequence.value[0]
    enterFullscreen()
    return
  }

  // OTIMIZAÇÃO: Reduzir intervalo padrão de 10s para 8s
  const interval = (deviceSettings.value?.auto_rotate_interval || 8) * 1000
  console.log(`⏱️ Iniciando rotação com intervalo de ${interval / 1000}s`)
  rotationInterval = window.setInterval(rotateContent, interval)
}

function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  )
}

function enterFullscreen(): void {
  if (isFullscreen()) {
    return
  }

  const elem = document.documentElement
  
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(err => {
      console.warn('Failed to enter fullscreen:', err)
    })
  } else if ((elem as any).webkitRequestFullscreen) {
    (elem as any).webkitRequestFullscreen()
  } else if ((elem as any).mozRequestFullScreen) {
    (elem as any).mozRequestFullScreen()
  } else if ((elem as any).msRequestFullscreen) {
    (elem as any).msRequestFullscreen()
  }
}

function startFullscreenMonitor(): void {
  fullscreenCheckInterval = window.setInterval(() => {
    if (!isFullscreen()) {
      console.log('Detectado saída do fullscreen, reativando...')
      enterFullscreen()
    }
  }, 30000)
}

// NOVA FUNÇÃO: Escutar remoção de token
function subscribeToTokenRemoval(): void {
  const currentDeviceId = deviceId.value
  if (!currentDeviceId) return

  tokenRemovalChannel = supabase
    .channel('device-token-removal')
    .on('broadcast', { event: 'token-removed' }, (payload) => {
      if (payload.payload.deviceId === currentDeviceId) {
        console.log('Token removido pelo admin, desconectando...')
        handleTokenRemoved()
      }
    })
    .subscribe()
}

function handleTokenRemoved(): void {
  // Parar todos os serviços
  if (rotationInterval) clearInterval(rotationInterval)
  if (fullscreenCheckInterval) clearInterval(fullscreenCheckInterval)
  heartbeat.stop()
  watchdog.stop()

  // Limpar localStorage
  storage.removeLocalStorage('deviceId')
  storage.removeLocalStorage('deviceCode')

  // Mostrar mensagem de erro
  configError.value = 'Token removido pelo administrador.\n\nEsta TV foi desconectada e precisa ser pareada novamente.\n\nRedirecionando para tela de pareamento em 5 segundos...'

  // Redirecionar para pareamento
  setTimeout(() => {
    router.push({ name: 'tv-pairing' })
  }, 5000)
}

async function retryConfiguration(): Promise<void> {
  configError.value = null
  isInitialized.value = false
  await initialize()
}

function unpairDevice(): void {
  storage.removeLocalStorage('deviceId')
  storage.removeLocalStorage('deviceCode')
  router.push({ name: 'tv-pairing' })
}

function goToAdmin(): void {
  router.push({ name: 'admin-login' })
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

function handleKeyPress(event: KeyboardEvent): void {
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault()
    goToAdmin()
  }
}

function handleFullscreenChange(): void {
  if (!isFullscreen()) {
    setTimeout(() => {
      enterFullscreen()
    }, 2000)
  }
}

async function initialize(): Promise<void> {
  const storedDeviceId = storage.getLocalStorage<string>('deviceId')
  const storedDeviceCode = storage.getLocalStorage<string>('deviceCode')
  
  if (!storedDeviceId) {
    router.push({ name: 'tv-pairing' })
    return
  }

  if (!isValidUUID(storedDeviceId)) {
    storage.removeLocalStorage('deviceId')
    storage.removeLocalStorage('deviceCode')
    router.push({ name: 'tv-pairing' })
    return
  }

  try {
    const TIMEOUT_MS = 30000
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout: carregamento demorou mais de ${TIMEOUT_MS / 1000} segundos`)), TIMEOUT_MS)
    })

    const ordersPromise = ordersStore.fetchOrders()
    const productsPromise = mediaStore.fetchProducts()
    const mediaPromise = mediaStore.fetchMedia()
    const devicesPromise = devicesStore.fetchDevices()
    const settingsPromise = devicesStore.fetchSettings()

    await Promise.race([
      Promise.all([ordersPromise, productsPromise, mediaPromise, devicesPromise, settingsPromise]),
      timeoutPromise
    ])

    isInitialized.value = true
    await nextTick()

    if (!device.value) {
      const availableDevices = devicesStore.devices.map(d => `${d.name} (${d.id})`).join(', ')
      storage.removeLocalStorage('deviceId')
      storage.removeLocalStorage('deviceCode')
      
      configError.value = `Device com ID "${storedDeviceId}" não encontrado no banco de dados.\n\nDevices disponíveis: ${availableDevices || 'nenhum'}\n\nRedirecionando para pareamento em 3 segundos...`
      
      setTimeout(() => {
        router.push({ name: 'tv-pairing' })
      }, 3000)
      return
    }

    // VERIFICAÇÃO CRÍTICA: Comparar código salvo com código atual do device
    if (storedDeviceCode && device.value.code !== storedDeviceCode) {
      console.log(`Token mudou! Salvo: ${storedDeviceCode}, Atual: ${device.value.code}`)
      storage.removeLocalStorage('deviceId')
      storage.removeLocalStorage('deviceCode')
      
      configError.value = `Token desta TV foi alterado pelo administrador.\n\nCódigo anterior: ${storedDeviceCode}\nNovo código: ${device.value.code}\n\nEsta TV precisa ser pareada novamente com o novo código.\n\nRedirecionando para tela de pareamento em 5 segundos...`
      
      setTimeout(() => {
        router.push({ name: 'tv-pairing' })
      }, 5000)
      return
    }

    // Salvar o código atual para verificação futura
    if (!storedDeviceCode) {
      storage.setLocalStorage('deviceCode', device.value.code)
    }

    const layoutType = device.value.layout_type
    if ((layoutType === 'orders-list' || layoutType === 'default' || layoutType === 'orders-kanban') && !deviceSettings.value) {
      configError.value = `Configurações não encontradas para o device "${device.value.name}" (${storedDeviceId}).\n\nPor favor, configure a TV no painel admin ou recrie o device.`
      await nextTick()
      return
    }

    if (rotationSequence.value.length === 0) {
      configError.value = 'Nenhum conteúdo disponível para exibir.\n\nPor favor, adicione pedidos, produtos ou mídias no painel admin.'
      await nextTick()
      return
    }

    currentContentType.value = rotationSequence.value[0]
    rotationIndex.value = 0

    ordersStore.subscribeToOrders()
    mediaStore.subscribeToProducts()
    mediaStore.subscribeToMedia()
    subscribeToTokenRemoval()
    heartbeat.start(storedDeviceId)
    watchdog.start()
    enterFullscreen()
    startFullscreenMonitor()
    startRotation()
  } catch (err) {
    configError.value = `Erro ao carregar dados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
    await nextTick()
  }
}

watch(rotationSequence, () => {
  if (rotationSequence.value.length > 0) {
    currentContentType.value = rotationSequence.value[0]
    rotationIndex.value = 0
  } else {
    currentContentType.value = null
  }
  startRotation()
})

watch(hasOrders, (newValue) => {
  if (newValue && rotationSequence.value.length > 0) {
    currentContentType.value = 'orders'
    rotationIndex.value = 0
    enterFullscreen()
  }
})

watch(() => device.value?.layout_type, (newLayout, oldLayout) => {
  if (newLayout !== oldLayout && isInitialized.value) {
    if (rotationSequence.value.length > 0) {
      currentContentType.value = rotationSequence.value[0]
      rotationIndex.value = 0
      startRotation()
    }
  }
})

onMounted(() => {
  initialize()
  window.addEventListener('keydown', handleKeyPress)
  
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
})

onUnmounted(() => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
  if (fullscreenCheckInterval) {
    clearInterval(fullscreenCheckInterval)
  }
  if (tokenRemovalChannel) {
    tokenRemovalChannel.unsubscribe()
  }
  heartbeat.stop()
  watchdog.stop()
  window.removeEventListener('keydown', handleKeyPress)
  
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})
</script>

<style scoped>
.tv-display {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  position: relative;
}

.admin-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 9999;
  backdrop-filter: blur(10px);
}

.admin-button:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
}

.tv-display:hover .admin-button {
  opacity: 0.3;
}

.config-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
}

.error-content {
  background: white;
  border-radius: 20px;
  padding: 60px;
  max-width: 900px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.error-content h1 {
  font-size: 48px;
  color: #e74c3c;
  margin-bottom: 30px;
}

.error-content p {
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 30px;
  line-height: 1.6;
  white-space: pre-line;
}

.debug-info {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin: 30px 0;
  text-align: left;
}

.debug-info p {
  font-size: 18px;
  margin: 10px 0;
  color: #495057;
}

.debug-info strong {
  color: #212529;
}

.retry-button,
.unpair-button {
  font-size: 20px;
  padding: 15px 40px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  margin: 10px;
}

.retry-button {
  background: #3498db;
  color: white;
}

.retry-button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.unpair-button {
  background: #e74c3c;
  color: white;
}

.unpair-button:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
}

.media-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>