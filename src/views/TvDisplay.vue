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
        v-if="currentContentType === 'orders' && !configError"
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
import OrdersViewList from '@/components/tv/OrdersViewList.vue'
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
  console.log('🎨 [TvDisplay] OrdersComponent - layout_type:', layoutType)
  
  // SEMPRE usar OrdersViewList (formato de lista) para todos os layouts
  // Removemos o OrdersView (cards) completamente
  return OrdersViewList
})

const rotationSequence = computed(() => {
  // Não calcular sequência até que os dados sejam carregados
  if (!isInitialized.value) {
    console.log('⏳ [TvDisplay] Aguardando inicialização para calcular sequência')
    return []
  }

  const layoutType = device.value?.layout_type || 'orders-list'
  console.log('🔍 [TvDisplay] Calculando sequência para layout_type:', layoutType)

  const sequence: ContentType[] = []
  
  // LÓGICA BASEADA NO LAYOUT_TYPE
  switch (layoutType) {
    case 'media-only':
      // APENAS MÍDIA
      console.log('📺 [TvDisplay] Layout: APENAS MÍDIA')
      if (hasMedia.value) {
        sequence.push('media')
        console.log('  ✅ Adicionando media à sequência')
      } else {
        console.warn('  ⚠️ Nenhuma mídia disponível para layout media-only')
      }
      break

    case 'orders-only':
      // APENAS PEDIDOS
      console.log('📋 [TvDisplay] Layout: APENAS PEDIDOS')
      if (hasOrders.value) {
        sequence.push('orders')
        console.log('  ✅ Adicionando orders à sequência')
      } else {
        console.warn('  ⚠️ Nenhum pedido disponível para layout orders-only')
      }
      break

    case 'orders-list':
    case 'default':
    default:
      // PEDIDOS + MÍDIA (com produtos opcionais)
      console.log('🔄 [TvDisplay] Layout: PEDIDOS/MÍDIA')
      
      if (!deviceSettings.value) {
        console.warn('⚠️ [TvDisplay] Sem configurações, usando sequência padrão')
        if (hasOrders.value) {
          sequence.push('orders')
          console.log('  ✅ Adicionando orders à sequência')
        }
        if (hasProducts.value) {
          sequence.push('products')
          console.log('  ✅ Adicionando products à sequência')
        }
        if (hasMedia.value) {
          sequence.push('media')
          console.log('  ✅ Adicionando media à sequência')
        }
      } else {
        const settings = deviceSettings.value

        // Adicionar pedidos se existirem
        if (hasOrders.value) {
          const ordersCount = Math.ceil((settings.orders_percentage ?? 70) / 10)
          for (let i = 0; i < ordersCount; i++) sequence.push('orders')
          console.log(`  ✅ Adicionando ${ordersCount}x orders à sequência`)
        }

        // Adicionar produtos se existirem
        if (hasProducts.value) {
          const productsCount = Math.ceil((settings.products_percentage ?? 10) / 10)
          for (let i = 0; i < productsCount; i++) sequence.push('products')
          console.log(`  ✅ Adicionando ${productsCount}x products à sequência`)
        }

        // Adicionar mídia se existir
        if (hasMedia.value) {
          const mediaCount = Math.ceil((settings.media_percentage ?? 20) / 10)
          for (let i = 0; i < mediaCount; i++) sequence.push('media')
          console.log(`  ✅ Adicionando ${mediaCount}x media à sequência`)
        }
      }
      break
  }

  console.log('📋 [TvDisplay] Sequência final:', sequence)
  return sequence
})

function rotateContent(): void {
  if (rotationSequence.value.length === 0) {
    currentContentType.value = null
    return
  }

  rotationIndex.value = (rotationIndex.value + 1) % rotationSequence.value.length
  currentContentType.value = rotationSequence.value[rotationIndex.value]
  
  console.log('🔄 [TvDisplay] Rotacionando para:', currentContentType.value)
}

function startRotation(): void {
  if (rotationInterval) clearInterval(rotationInterval)
  
  // Se não houver conteúdo, não iniciar rotação
  if (rotationSequence.value.length === 0) {
    currentContentType.value = null
    console.warn('⚠️ [TvDisplay] Sequência vazia, não iniciando rotação')
    return
  }

  // Se houver apenas 1 item na sequência, não precisa rotacionar
  if (rotationSequence.value.length === 1) {
    currentContentType.value = rotationSequence.value[0]
    console.log('ℹ️ [TvDisplay] Apenas 1 item na sequência, sem rotação')
    return
  }

  const interval = (deviceSettings.value?.auto_rotate_interval || 10) * 1000
  rotationInterval = window.setInterval(rotateContent, interval)
  
  console.log('⏰ [TvDisplay] Rotação iniciada com intervalo de', interval / 1000, 'segundos')
}

function enterFullscreen(): void {
  const elem = document.documentElement
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(err => {
      console.warn('Failed to enter fullscreen:', err)
    })
  }
}

async function retryConfiguration(): Promise<void> {
  configError.value = null
  isInitialized.value = false
  await initialize()
}

function unpairDevice(): void {
  console.log('🧹 [TvDisplay] Despareaando device e limpando localStorage...')
  storage.removeLocalStorage('deviceId')
  router.push({ name: 'tv-pairing' })
}

// Função para redirecionar para admin
function goToAdmin(): void {
  console.log('🔐 [TvDisplay] Redirecionando para admin...')
  router.push({ name: 'admin-login' })
}

// Função auxiliar para validar UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Listener para atalho de teclado Ctrl+Shift+A
function handleKeyPress(event: KeyboardEvent): void {
  // Ctrl+Shift+A
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault()
    console.log('⌨️ [TvDisplay] Atalho Ctrl+Shift+A detectado!')
    goToAdmin()
  }
}

async function initialize(): Promise<void> {
  const storedDeviceId = storage.getLocalStorage<string>('deviceId')
  
  if (!storedDeviceId) {
    console.warn('⚠️ [TvDisplay] Nenhum deviceId encontrado, redirecionando para pareamento')
    router.push({ name: 'tv-pairing' })
    return
  }

  // VALIDAÇÃO AUTOMÁTICA: Verificar se o deviceId é um UUID válido
  if (!isValidUUID(storedDeviceId)) {
    console.error('❌ [TvDisplay] DeviceId inválido detectado:', storedDeviceId)
    console.log('🧹 [TvDisplay] Limpando deviceId inválido do localStorage...')
    storage.removeLocalStorage('deviceId')
    console.log('🔄 [TvDisplay] Redirecionando para página de pareamento...')
    router.push({ name: 'tv-pairing' })
    return
  }

  console.log('🚀 [TvDisplay] Inicializando com deviceId:', storedDeviceId)

  try {
    // Aumentar timeout para 30 segundos
    const TIMEOUT_MS = 30000
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout: carregamento demorou mais de ${TIMEOUT_MS / 1000} segundos`)), TIMEOUT_MS)
    })

    const startTime = Date.now()

    console.log('📥 [TvDisplay] Iniciando fetchOrders...')
    const ordersPromise = ordersStore.fetchOrders().then(() => {
      const elapsed = Date.now() - startTime
      console.log(`✅ [TvDisplay] fetchOrders completou em ${elapsed}ms`)
    }).catch(err => {
      const elapsed = Date.now() - startTime
      console.error(`❌ [TvDisplay] fetchOrders falhou em ${elapsed}ms:`, err)
      throw err
    })

    console.log('📥 [TvDisplay] Iniciando fetchProducts...')
    const productsPromise = mediaStore.fetchProducts().then(() => {
      const elapsed = Date.now() - startTime
      console.log(`✅ [TvDisplay] fetchProducts completou em ${elapsed}ms`)
    }).catch(err => {
      const elapsed = Date.now() - startTime
      console.error(`❌ [TvDisplay] fetchProducts falhou em ${elapsed}ms:`, err)
      throw err
    })

    console.log('📥 [TvDisplay] Iniciando fetchMedia...')
    const mediaPromise = mediaStore.fetchMedia().then(() => {
      const elapsed = Date.now() - startTime
      console.log(`✅ [TvDisplay] fetchMedia completou em ${elapsed}ms`)
    }).catch(err => {
      const elapsed = Date.now() - startTime
      console.error(`❌ [TvDisplay] fetchMedia falhou em ${elapsed}ms:`, err)
      throw err
    })

    console.log('📥 [TvDisplay] Iniciando fetchDevices...')
    const devicesPromise = devicesStore.fetchDevices().then(() => {
      const elapsed = Date.now() - startTime
      console.log(`✅ [TvDisplay] fetchDevices completou em ${elapsed}ms`)
    }).catch(err => {
      const elapsed = Date.now() - startTime
      console.error(`❌ [TvDisplay] fetchDevices falhou em ${elapsed}ms:`, err)
      throw err
    })

    console.log('📥 [TvDisplay] Iniciando fetchSettings...')
    const settingsPromise = devicesStore.fetchSettings().then(() => {
      const elapsed = Date.now() - startTime
      console.log(`✅ [TvDisplay] fetchSettings completou em ${elapsed}ms`)
    }).catch(err => {
      const elapsed = Date.now() - startTime
      console.error(`❌ [TvDisplay] fetchSettings falhou em ${elapsed}ms:`, err)
      throw err
    })

    // Executar todas as promises com timeout
    await Promise.race([
      Promise.all([ordersPromise, productsPromise, mediaPromise, devicesPromise, settingsPromise]),
      timeoutPromise
    ])

    const totalElapsed = Date.now() - startTime
    console.log(`✅ [TvDisplay] Promise.all completou com sucesso em ${totalElapsed}ms`)

    // Marcar como inicializado APÓS carregar todos os dados
    isInitialized.value = true

    // Aguardar o próximo tick para garantir que os computed sejam recalculados
    await nextTick()

    console.log('📊 [TvDisplay] Dados carregados:', {
      deviceId: storedDeviceId,
      devicesCount: devicesStore.devices.length,
      settingsCount: devicesStore.settings.length,
      deviceFound: !!device.value,
      deviceLayoutType: device.value?.layout_type,
      settingsFound: !!deviceSettings.value,
      orders: hasOrders.value,
      products: hasProducts.value,
      media: hasMedia.value,
      sequence: rotationSequence.value
    })

    // Verificar se o device existe
    if (!device.value) {
      console.error('❌ [TvDisplay] PONTO DE FALHA 1: Device não encontrado')
      const availableDevices = devicesStore.devices.map(d => `${d.name} (${d.id})`).join(', ')
      
      // LIMPEZA AUTOMÁTICA: Device não existe no banco
      console.log('🧹 [TvDisplay] Device não encontrado no banco, limpando localStorage...')
      storage.removeLocalStorage('deviceId')
      console.log('🔄 [TvDisplay] Redirecionando para página de pareamento...')
      
      // Mostrar mensagem temporária antes de redirecionar
      configError.value = `Device com ID "${storedDeviceId}" não encontrado no banco de dados.\n\nDevices disponíveis: ${availableDevices || 'nenhum'}\n\nRedirecionando para pareamento em 3 segundos...`
      
      setTimeout(() => {
        router.push({ name: 'tv-pairing' })
      }, 3000)
      return
    }

    console.log('✅ [TvDisplay] Device encontrado:', device.value.name, 'Layout:', device.value.layout_type)

    // Verificar se as configurações existem (apenas para layouts que precisam de settings)
    const layoutType = device.value.layout_type
    if ((layoutType === 'orders-list' || layoutType === 'default') && !deviceSettings.value) {
      console.error('❌ [TvDisplay] PONTO DE FALHA 2: Settings não encontrados para layout', layoutType)
      configError.value = `Configurações não encontradas para o device "${device.value.name}" (${storedDeviceId}).\n\nPor favor, configure a TV no painel admin ou recrie o device.`
      console.error('❌ [TvDisplay] Settings disponíveis:', devicesStore.settings)
      await nextTick()
      console.error('❌ [TvDisplay] configError setado:', configError.value)
      return
    }

    console.log('✅ [TvDisplay] Configuração válida para layout:', layoutType)

    // Verificar se há conteúdo para exibir
    if (rotationSequence.value.length === 0) {
      console.error('❌ [TvDisplay] PONTO DE FALHA 3: Nenhum conteúdo disponível')
      configError.value = 'Nenhum conteúdo disponível para exibir.\n\nPor favor, adicione pedidos, produtos ou mídias no painel admin.'
      await nextTick()
      console.error('❌ [TvDisplay] configError setado:', configError.value)
      return
    }

    console.log('✅ [TvDisplay] Sequência válida:', rotationSequence.value)

    // Definir o conteúdo inicial
    currentContentType.value = rotationSequence.value[0]
    rotationIndex.value = 0
    console.log('✅ [TvDisplay] Conteúdo inicial definido:', currentContentType.value)

    ordersStore.subscribeToOrders()

    heartbeat.start(storedDeviceId)
    watchdog.start()

    enterFullscreen()
    startRotation()
    
    console.log('✅ [TvDisplay] Inicialização completa!')
  } catch (err) {
    console.error('❌ [TvDisplay] PONTO DE FALHA 4: Erro durante inicialização:', err)
    configError.value = `Erro ao carregar dados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
    await nextTick()
    console.error('❌ [TvDisplay] configError setado:', configError.value)
  }
}

watch(rotationSequence, () => {
  console.log('🔄 [TvDisplay] Sequência de rotação mudou:', rotationSequence.value)
  
  // Se a sequência mudou, reiniciar do primeiro item
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
  }
})

// Watch para mudanças no device (incluindo layout_type)
watch(() => device.value?.layout_type, (newLayout, oldLayout) => {
  if (newLayout !== oldLayout && isInitialized.value) {
    console.log('🔄 [TvDisplay] Layout mudou de', oldLayout, 'para', newLayout)
    console.log('🔄 [TvDisplay] Recalculando sequência...')
    
    // Forçar recálculo da sequência
    if (rotationSequence.value.length > 0) {
      currentContentType.value = rotationSequence.value[0]
      rotationIndex.value = 0
      startRotation()
    }
  }
})

onMounted(() => {
  initialize()
  // Adicionar listener para atalho de teclado
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
  heartbeat.stop()
  watchdog.stop()
  // Remover listener para atalho de teclado
  window.removeEventListener('keydown', handleKeyPress)
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

/* Botão Admin - Discreto, aparece ao passar o mouse */
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

/* Mostrar o botão quando o mouse está no canto inferior direito */
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