<template>
  <div class="tv-pairing">
    <div class="pairing-container">
      <h1>Pareamento de TV</h1>
      <p class="instruction">
        Digite o código fornecido pelo administrador
      </p>
      
      <div class="code-input">
        <input
          v-model="code"
          type="text"
          placeholder="CÓDIGO"
          maxlength="6"
          @input="code = code.toUpperCase()"
          @keyup.enter="pairDevice"
        >
      </div>

      <button
        class="pair-button"
        :disabled="loading || code.length < 6"
        @click="pairDevice"
      >
        {{ loading ? 'Pareando...' : 'Parear TV' }}
      </button>

      <div
        v-if="error"
        class="error-message"
      >
        {{ error }}
      </div>

      <div
        v-if="success"
        class="success-message"
      >
        Pareamento realizado com sucesso! Redirecionando...
      </div>

      <!-- Modal de confirmação de troca de device -->
      <div
        v-if="showConfirmModal"
        class="modal-overlay"
        @click="cancelRepair"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <h2>⚠️ TV Já Pareada</h2>
          <p class="modal-text">
            Esta TV já está pareada com outro device.
          </p>
          <div class="current-device-info">
            <p><strong>Device Atual:</strong> {{ currentDeviceId }}</p>
            <p><strong>Novo Device:</strong> {{ pendingDeviceId }}</p>
          </div>
          <p class="modal-text">
            Deseja trocar para o novo device?
          </p>
          <div class="modal-actions">
            <button
              class="modal-button cancel"
              @click="cancelRepair"
            >
              ❌ Cancelar
            </button>
            <button
              class="modal-button confirm"
              @click="confirmRepair"
            >
              ✅ Trocar Device
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDevicesStore } from '@/stores/devicesStore'
import { storage } from '@/services/storage'
import type { Device } from '@/types'

const router = useRouter()
const devicesStore = useDevicesStore()

const code = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const showConfirmModal = ref(false)
const pendingDeviceId = ref<string | null>(null)
const pendingDeviceCode = ref<string | null>(null)

// Informações do device atual
const currentDeviceId = computed(() => storage.getLocalStorage<string>('deviceId'))

async function pairDevice(): Promise<void> {
  if (code.value.length < 6) return

  loading.value = true
  error.value = ''

  console.log('🔄 Iniciando pareamento com código:', code.value)

  try {
    // Timeout de 30 segundos (aumentado de 10s)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: pareamento demorou mais de 30 segundos')), 30000)
    })

    console.log('📡 Buscando device no Supabase...')
    
    // Buscar o device pelo código com timeout
    const device = await Promise.race<Device | null>([
      devicesStore.pairDevice(code.value),
      timeoutPromise
    ])

    console.log('✅ Device encontrado:', device)

    if (!device) {
      console.error('❌ Código inválido:', code.value)
      error.value = 'Código inválido. Verifique e tente novamente.'
      loading.value = false
      return
    }

    // Verificar se a TV já está pareada
    const existingDeviceId = storage.getLocalStorage<string>('deviceId')
    
    console.log('🔍 Device atual na TV:', existingDeviceId)
    console.log('🆕 Novo device ID:', device.id)
    
    if (existingDeviceId && existingDeviceId !== device.id) {
      // TV já pareada com outro device - mostrar modal de confirmação
      console.log('⚠️ TV já pareada com outro device, mostrando modal...')
      
      pendingDeviceId.value = device.id
      pendingDeviceCode.value = device.code
      showConfirmModal.value = true
      loading.value = false
      return
    }

    // Pareamento normal (primeira vez ou mesmo device)
    console.log('✅ Pareamento direto (primeira vez ou mesmo device)')
    await completePairing(device.id, device.code)
  } catch (err) {
    console.error('❌ Erro no pareamento:', err)
    
    if (err instanceof Error) {
      if (err.message.includes('Timeout')) {
        error.value = 'Pareamento demorou muito tempo. Verifique sua conexão e tente novamente.'
      } else if (err.message.includes('Failed to fetch')) {
        error.value = 'Erro de conexão. Verifique sua internet e tente novamente.'
      } else {
        error.value = `Erro: ${err.message}`
      }
    } else {
      error.value = 'Erro desconhecido ao parear dispositivo. Tente novamente.'
    }
    
    loading.value = false
  }
}

async function completePairing(deviceId: string, deviceCode: string): Promise<void> {
  console.log('💾 Salvando pareamento:', { deviceId, deviceCode })
  
  // Limpar qualquer estado anterior
  storage.removeLocalStorage('deviceId')
  storage.removeLocalStorage('deviceCode')
  
  console.log('🗑️ Estado anterior limpo')
  
  // Aguardar um momento para garantir que o localStorage foi limpo
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Salvar novo deviceId e deviceCode
  storage.setLocalStorage('deviceId', deviceId)
  storage.setLocalStorage('deviceCode', deviceCode)
  
  console.log('✅ Novo estado salvo')
  
  success.value = true
  loading.value = false
  
  // Aguardar 2 segundos antes de redirecionar
  setTimeout(() => {
    console.log('🔄 Redirecionando para /tv...')
    router.push('/tv')
  }, 2000)
}

function confirmRepair(): void {
  console.log('✅ Usuário confirmou troca de device')
  showConfirmModal.value = false
  loading.value = true
  
  if (pendingDeviceId.value && pendingDeviceCode.value) {
    completePairing(pendingDeviceId.value, pendingDeviceCode.value)
  }
}

function cancelRepair(): void {
  console.log('❌ Usuário cancelou troca de device')
  showConfirmModal.value = false
  pendingDeviceId.value = null
  pendingDeviceCode.value = null
  code.value = ''
  loading.value = false
  error.value = 'Pareamento cancelado. A TV permanece com o device atual.'
}
</script>

<style scoped>
.tv-pairing {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pairing-container {
  background: white;
  border-radius: 30px;
  padding: 80px;
  max-width: 700px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 56px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
}

.instruction {
  font-size: 28px;
  color: #7f8c8d;
  margin-bottom: 50px;
}

.code-input input {
  width: 100%;
  padding: 30px;
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  border: 3px solid #e0e0e0;
  border-radius: 15px;
  letter-spacing: 10px;
  transition: border-color 0.3s ease;
}

.code-input input:focus {
  outline: none;
  border-color: #667eea;
}

.pair-button {
  width: 100%;
  padding: 25px;
  margin-top: 30px;
  font-size: 32px;
  font-weight: 700;
  color: white;
  background: #667eea;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pair-button:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.pair-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 30px;
  padding: 20px;
  background: #fee;
  color: #c0392b;
  border-radius: 10px;
  font-size: 24px;
}

.success-message {
  margin-top: 30px;
  padding: 20px;
  background: #d4edda;
  color: #155724;
  border-radius: 10px;
  font-size: 24px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 50px;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  font-size: 42px;
  color: #e74c3c;
  margin-bottom: 20px;
}

.modal-text {
  font-size: 24px;
  color: #2c3e50;
  margin: 20px 0;
  line-height: 1.6;
}

.current-device-info {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
}

.current-device-info p {
  font-size: 20px;
  margin: 10px 0;
  color: #495057;
}

.current-device-info strong {
  color: #212529;
}

.modal-actions {
  display: flex;
  gap: 20px;
  margin-top: 30px;
}

.modal-button {
  flex: 1;
  padding: 20px;
  font-size: 24px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-button.cancel {
  background: #95a5a6;
  color: white;
}

.modal-button.cancel:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(149, 165, 166, 0.3);
}

.modal-button.confirm {
  background: #e74c3c;
  color: white;
}

.modal-button.confirm:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
}
</style>