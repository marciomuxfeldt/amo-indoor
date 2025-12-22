<template>
  <div class="tv-monitor">
    <div class="section-header">
      <h2>Monitor de TVs em Tempo Real</h2>
      <button
        class="btn-primary"
        @click="refreshAll"
      >
        🔄 Atualizar Tudo
      </button>
    </div>

    <div class="monitor-grid">
      <div
        v-for="device in devices"
        :key="device.id"
        class="monitor-card"
      >
        <div class="monitor-header">
          <div>
            <h3>{{ device.name }}</h3>
            <span class="device-code">{{ device.code }}</span>
          </div>
          <div
            class="status-badge"
            :class="{ online: device.is_online }"
          >
            <span class="status-dot" />
            {{ device.is_online ? 'Online' : 'Offline' }}
          </div>
        </div>

        <div class="monitor-preview">
          <div
            v-if="!device.is_online"
            class="offline-overlay"
          >
            <p>TV Offline</p>
          </div>
          <div
            v-else
            class="preview-placeholder"
          >
            <p>📺</p>
            <p>Visualização em tempo real</p>
            <p class="preview-info">
              Layout: {{ device.layout_type }}<br>
              Último heartbeat: {{ formatDate(device.last_heartbeat || '') }}
            </p>
          </div>
        </div>

        <div class="monitor-actions">
          <a
            :href="`/tv?deviceId=${device.id}`"
            target="_blank"
            class="btn-view-tv"
            @click.prevent="openTvDisplay(device.id)"
          >
            📺 Ver Tela da TV
          </a>
        </div>

        <div
          v-if="getDeviceSettings(device.id)"
          class="monitor-settings"
        >
          <div class="settings-header">
            <h4>Configurações</h4>
            <button
              class="btn-edit"
              @click="editSettings(device.id)"
            >
              ✏️ Editar
            </button>
          </div>
          <div class="setting-row">
            <span>Pedidos:</span>
            <strong>{{ getDeviceSettings(device.id)?.orders_percentage ?? 70 }}%</strong>
          </div>
          <div class="setting-row">
            <span>Produtos:</span>
            <strong>{{ getDeviceSettings(device.id)?.products_percentage ?? 10 }}%</strong>
          </div>
          <div class="setting-row">
            <span>Mídia:</span>
            <strong>{{ getDeviceSettings(device.id)?.media_percentage ?? 20 }}%</strong>
          </div>
          <div class="setting-row">
            <span>Intervalo:</span>
            <strong>{{ getDeviceSettings(device.id)?.auto_rotate_interval ?? 10 }}s</strong>
          </div>
          <div class="setting-row">
            <span>Nome completo:</span>
            <strong>{{ getDeviceSettings(device.id)?.show_full_name ?? false ? 'Sim' : 'Não' }}</strong>
          </div>
          <div class="setting-row">
            <span>Cor predominante:</span>
            <strong>
              <span 
                class="color-preview" 
                :style="{ background: getDeviceSettings(device.id)?.primary_color || '#3b82f6' }"
              />
              {{ getDeviceSettings(device.id)?.primary_color || '#3b82f6' }}
            </strong>
          </div>
          <div class="setting-row">
            <span>Logo:</span>
            <strong>{{ getDeviceSettings(device.id)?.logo_url ? '✓ Configurada' : '✗ Não configurada' }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edição de Configurações -->
    <div
      v-if="editingDeviceId"
      class="modal"
      @click.self="cancelEdit"
    >
      <div class="modal-content">
        <h3>Configurações da TV</h3>
        <form @submit.prevent="saveSettings">
          <div class="form-group">
            <label>Percentual de Pedidos (%)</label>
            <input
              v-model.number="editingSettings.orders_percentage"
              type="number"
              min="0"
              max="100"
              required
            >
          </div>
          <div class="form-group">
            <label>Percentual de Produtos (%)</label>
            <input
              v-model.number="editingSettings.products_percentage"
              type="number"
              min="0"
              max="100"
              required
            >
          </div>
          <div class="form-group">
            <label>Percentual de Mídia (%)</label>
            <input
              v-model.number="editingSettings.media_percentage"
              type="number"
              min="0"
              max="100"
              required
            >
          </div>
          <div
            v-if="percentageError"
            class="error-message"
          >
            ⚠️ {{ percentageError }}
          </div>
          <div class="percentage-total">
            Total: {{ totalPercentage }}%
          </div>
          <div class="form-group">
            <label>Intervalo de Rotação (segundos)</label>
            <input
              v-model.number="editingSettings.auto_rotate_interval"
              type="number"
              min="1"
              required
            >
          </div>
          <div class="form-group">
            <label>Cor Predominante dos Pedidos</label>
            <div class="color-input-group">
              <input
                v-model="editingSettings.primary_color"
                type="color"
                class="color-picker"
              >
              <input
                v-model="editingSettings.primary_color"
                type="text"
                placeholder="#3b82f6"
                pattern="^#[0-9A-Fa-f]{6}$"
                class="color-text"
              >
            </div>
            <p class="field-hint">
              Escolha a cor de fundo da tela de pedidos
            </p>
          </div>
          <div class="form-group">
            <label>URL da Logo da Empresa</label>
            <input
              v-model="editingSettings.logo_url"
              type="url"
              placeholder="/images/CompanyLogo.jpg"
              class="url-input"
            >
            <p class="field-hint">
              Logo será exibida centralizada na parte inferior da tela de pedidos
            </p>
            <div
              v-if="editingSettings.logo_url"
              class="logo-preview"
            >
              <img
                :src="editingSettings.logo_url"
                alt="Preview da logo"
                @error="handleImageError"
              >
            </div>
          </div>
          <div class="form-group">
            <label>
              <input
                v-model="editingSettings.show_full_name"
                type="checkbox"
              >
              Mostrar nome completo do cliente
            </label>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="cancelEdit"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSaving || !!percentageError"
            >
              {{ isSaving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDevicesStore } from '@/stores/devicesStore'
import type { DeviceSettings } from '@/types'

const devicesStore = useDevicesStore()

let refreshInterval: number | null = null

const editingDeviceId = ref<string | null>(null)
const isSaving = ref(false)
const editingSettings = ref({
  orders_percentage: 70,
  media_percentage: 20,
  products_percentage: 10,
  show_full_name: false,
  auto_rotate_interval: 10,
  primary_color: '#3b82f6',
  logo_url: ''
})

const devices = computed(() => devicesStore.devices)

const totalPercentage = computed(() => {
  return editingSettings.value.orders_percentage + 
         editingSettings.value.products_percentage + 
         editingSettings.value.media_percentage
})

const percentageError = computed(() => {
  const total = totalPercentage.value
  if (total !== 100) {
    return `A soma dos percentuais deve ser 100%. Atualmente: ${total}%`
  }
  return null
})

function getDeviceSettings(deviceId: string): DeviceSettings | undefined {
  return devicesStore.getDeviceSettings(deviceId)
}

function openTvDisplay(deviceId: string): void {
  console.log('🔵 [TvMonitor] Abrindo tela da TV para device:', deviceId)
  
  // Salvar deviceId temporariamente no localStorage
  localStorage.setItem('deviceId', deviceId)
  
  // Abrir em nova aba
  window.open('/tv', '_blank')
}

function editSettings(deviceId: string): void {
  const settings = getDeviceSettings(deviceId)
  if (settings) {
    editingDeviceId.value = deviceId
    editingSettings.value = {
      orders_percentage: settings.orders_percentage ?? 70,
      media_percentage: settings.media_percentage ?? 20,
      products_percentage: settings.products_percentage ?? 10,
      show_full_name: settings.show_full_name ?? false,
      auto_rotate_interval: settings.auto_rotate_interval ?? 10,
      primary_color: settings.primary_color || '#3b82f6',
      logo_url: settings.logo_url || ''
    }
  }
}

function cancelEdit(): void {
  editingDeviceId.value = null
  isSaving.value = false
}

function handleImageError(event: Event): void {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  alert('Erro ao carregar a imagem. Verifique se a URL está correta.')
}

async function saveSettings(): Promise<void> {
  if (isSaving.value || !editingDeviceId.value) return

  if (totalPercentage.value !== 100) {
    alert('A soma dos percentuais deve ser exatamente 100%')
    return
  }
  
  isSaving.value = true
  try {
    await devicesStore.updateDeviceSettings(editingDeviceId.value, editingSettings.value)
    cancelEdit()
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    alert('Erro ao salvar configurações. Tente novamente.')
  } finally {
    isSaving.value = false
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([
    devicesStore.fetchDevices(),
    devicesStore.fetchSettings()
  ])
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Nunca'
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR')
}

onMounted(() => {
  refreshAll()
  refreshInterval = window.setInterval(refreshAll, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.tv-monitor {
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 25px;
}

.monitor-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.monitor-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.device-code {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  letter-spacing: 1px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: #fee;
  color: #e74c3c;
}

.status-badge.online {
  background: #d4edda;
  color: #27ae60;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.monitor-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f5f7fa;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.offline-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
}

.preview-placeholder > p:first-child {
  font-size: 64px;
  margin-bottom: 10px;
}

.preview-placeholder > p:nth-child(2) {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.preview-info {
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
}

.monitor-actions {
  margin-bottom: 20px;
}

.btn-view-tv {
  display: block;
  width: 100%;
  padding: 12px;
  background: #27ae60;
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-view-tv:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
}

.monitor-settings {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 15px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.settings-header h4 {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
}

.btn-edit {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #667eea;
  color: white;
}

.btn-edit:hover {
  background: #5568d3;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #2c3e50;
}

.setting-row:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.setting-row strong {
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #e0e0e0;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f7fa;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #e0e5ec;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-group input[type="number"],
.form-group input[type="url"] {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.form-group input[type="checkbox"] {
  margin-right: 8px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.color-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.color-picker {
  width: 60px;
  height: 45px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
}

.color-text {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-family: monospace;
}

.url-input {
  width: 100%;
}

.field-hint {
  margin-top: 6px;
  font-size: 13px;
  color: #7f8c8d;
  font-style: italic;
}

.logo-preview {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.logo-preview img {
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
}

.error-message {
  padding: 12px;
  background: #fee;
  border: 2px solid #e74c3c;
  border-radius: 8px;
  color: #c0392b;
  font-weight: 600;
  margin-bottom: 15px;
}

.percentage-total {
  padding: 12px;
  background: #e8f8f5;
  border: 2px solid #27ae60;
  border-radius: 8px;
  color: #27ae60;
  font-weight: 700;
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}
</style>