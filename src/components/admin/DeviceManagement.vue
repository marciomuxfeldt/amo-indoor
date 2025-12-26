<template>
  <div class="device-management">
    <div class="section-header">
      <h2>Gerenciamento de TVs</h2>
      <button
        class="btn-primary btn-new-tv"
        @click="openCreateModal"
      >
        + Nova TV
      </button>
    </div>

    <div class="devices-grid">
      <div
        v-for="device in devices"
        :key="device.id"
        class="device-card"
        :class="{ online: device.is_online }"
      >
        <div class="device-status">
          <span
            class="status-dot"
            :class="{ online: device.is_online }"
          />
          {{ device.is_online ? 'Online' : 'Offline' }}
        </div>
        <h3>{{ device.name }}</h3>
        <div class="device-code">
          Código: {{ device.code }}
        </div>
        <div class="device-info">
          <div>Layout: {{ getLayoutLabel(device.layout_type) }}</div>
          <div v-if="device.last_heartbeat">
            Último heartbeat: {{ formatDate(device.last_heartbeat) }}
          </div>
        </div>
        <div class="device-actions">
          <button
            class="btn-secondary"
            @click="showQRCode(device)"
          >
            QR Code
          </button>
          <button
            class="btn-secondary"
            @click="editDevice(device)"
          >
            Editar
          </button>
          <button
            class="btn-warning"
            @click="confirmRemoveToken(device)"
          >
            🔓 Remover Token
          </button>
          <button
            class="btn-danger"
            @click="confirmDelete(device)"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Criação -->
    <div
      v-if="showCreateModal"
      class="modal"
      @click.self="closeCreateModal"
    >
      <div class="modal-content">
        <h3>Nova TV</h3>
        <form @submit.prevent="createDevice">
          <div class="form-group">
            <label>Nome da TV</label>
            <input
              v-model="newDevice.name"
              type="text"
              required
              placeholder="Ex: TV Balcão Principal"
            >
          </div>
          <div class="form-group">
            <label>Tipo de Layout</label>
            <select v-model="newDevice.layout_type">
              <option value="orders-list">
                Pedidos/Mídia (Linhas)
              </option>
              <option value="orders-kanban">
                Pedidos/Mídia (Kanban)
              </option>
              <option value="orders-only">
                Apenas Pedidos (Linhas)
              </option>
              <option value="orders-only-kanban">
                Apenas Pedidos (Kanban)
              </option>
              <option value="media-only">
                Apenas Mídia
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="closeCreateModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isCreating"
            >
              {{ isCreating ? 'Criando...' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Edição -->
    <div
      v-if="editingDevice"
      class="modal"
      @click.self="closeEditModal"
    >
      <div class="modal-content">
        <h3>Editar TV</h3>
        <form @submit.prevent="updateDevice">
          <div class="form-group">
            <label>Nome da TV</label>
            <input
              v-model="editingDevice.name"
              type="text"
              required
            >
          </div>
          <div class="form-group">
            <label>Tipo de Layout</label>
            <select v-model="editingDevice.layout_type">
              <option value="orders-list">
                Pedidos/Mídia (Linhas)
              </option>
              <option value="orders-kanban">
                Pedidos/Mídia (Kanban)
              </option>
              <option value="orders-only">
                Apenas Pedidos (Linhas)
              </option>
              <option value="orders-only-kanban">
                Apenas Pedidos (Kanban)
              </option>
              <option value="media-only">
                Apenas Mídia
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="closeEditModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isUpdating"
            >
              {{ isUpdating ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de QR Code -->
    <div
      v-if="qrCodeDevice"
      class="modal"
      @click.self="qrCodeDevice = null"
    >
      <div class="modal-content qr-modal">
        <h3>QR Code - {{ qrCodeDevice.name }}</h3>
        <div class="qr-code">
          <img
            :src="qrCodeUrl"
            alt="QR Code"
          >
        </div>
        <div class="device-code-large">
          {{ qrCodeDevice.code }}
        </div>
        <p>Escaneie o QR Code ou digite o código na TV</p>
        <button
          class="btn-primary"
          @click="qrCodeDevice = null"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDevicesStore } from '@/stores/devicesStore'
import { generateQRCode } from '@/utils/qrcode'
import type { Device } from '@/types'

const devicesStore = useDevicesStore()

const showCreateModal = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const editingDevice = ref<Device | null>(null)
const qrCodeDevice = ref<Device | null>(null)
const qrCodeUrl = ref('')

const newDevice = ref({
  name: '',
  layout_type: 'orders-list' as Device['layout_type']
})

const devices = computed(() => devicesStore.devices)

function getLayoutLabel(layoutType: string): string {
  const labels: Record<string, string> = {
    'default': 'Pedidos/Mídia (Linhas)',
    'orders-list': 'Pedidos/Mídia (Linhas)',
    'orders-kanban': 'Pedidos/Mídia (Kanban)',
    'orders-only': 'Apenas Pedidos (Linhas)',
    'orders-only-kanban': 'Apenas Pedidos (Kanban)',
    'media-only': 'Apenas Mídia'
  }
  return labels[layoutType] || layoutType
}

function openCreateModal(): void {
  showCreateModal.value = true
  newDevice.value = { name: '', layout_type: 'orders-list' }
}

function closeCreateModal(): void {
  showCreateModal.value = false
  isCreating.value = false
}

function closeEditModal(): void {
  editingDevice.value = null
  isUpdating.value = false
}

async function createDevice(): Promise<void> {
  if (isCreating.value) return
  
  isCreating.value = true
  try {
    await devicesStore.createDevice(newDevice.value)
    closeCreateModal()
  } catch (error) {
    alert('Erro ao criar TV. Tente novamente.')
  } finally {
    isCreating.value = false
  }
}

function editDevice(device: Device): void {
  editingDevice.value = { ...device }
}

async function updateDevice(): Promise<void> {
  if (!editingDevice.value || isUpdating.value) return

  isUpdating.value = true
  try {
    await devicesStore.updateDevice(editingDevice.value.id, {
      name: editingDevice.value.name,
      layout_type: editingDevice.value.layout_type
    })
    
    await devicesStore.fetchDevices()
    
    closeEditModal()
  } catch (error) {
    console.error('Erro ao atualizar TV:', error)
    alert('Erro ao atualizar TV. Tente novamente.')
  } finally {
    isUpdating.value = false
  }
}

async function showQRCode(device: Device): Promise<void> {
  qrCodeDevice.value = device
  qrCodeUrl.value = await generateQRCode(device.code)
}

// NOVA FUNÇÃO: Remover token
function confirmRemoveToken(device: Device): void {
  if (confirm(`Deseja remover o token da TV ${device.name}?\n\nIsso irá:\n• Gerar um novo código de pareamento\n• Desconectar imediatamente a TV atual\n• Permitir que este token seja usado em outro dispositivo\n\nA TV precisará ser pareada novamente com o novo código.`)) {
    removeToken(device)
  }
}

async function removeToken(device: Device): Promise<void> {
  try {
    await devicesStore.removeToken(device.id)
    await devicesStore.fetchDevices()
    alert(`Token removido com sucesso!\n\nNovo código: ${devicesStore.devices.find(d => d.id === device.id)?.code}\n\nA TV foi desconectada e precisará ser pareada novamente.`)
  } catch (error) {
    console.error('Erro ao remover token:', error)
    alert('Erro ao remover token. Tente novamente.')
  }
}

function confirmDelete(device: Device): void {
  if (confirm(`Deseja realmente excluir a TV ${device.name}?`)) {
    devicesStore.deleteDevice(device.id)
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR')
}

watch(qrCodeDevice, (newVal) => {
  if (!newVal) {
    qrCodeUrl.value = ''
  }
})
</script>

<style scoped>
.device-management {
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

.btn-new-tv {
  padding: 10px 20px !important;
  white-space: nowrap;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.device-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.device-card.online {
  border-color: #27ae60;
}

.device-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.device-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #7f8c8d;
  margin-bottom: 15px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e74c3c;
}

.status-dot.online {
  background: #27ae60;
}

.device-card h3 {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.device-code {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 15px;
  letter-spacing: 2px;
}

.device-info {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 20px;
}

.device-info div {
  margin-bottom: 5px;
}

.device-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-danger,
.btn-warning {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 80px;
  font-size: 14px;
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

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover {
  background: #e67e22;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.form-group input::placeholder {
  color: #bdc3c7;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.qr-modal {
  text-align: center;
}

.qr-code {
  margin: 30px 0;
}

.qr-code img {
  max-width: 300px;
  width: 100%;
}

.device-code-large {
  font-size: 48px;
  font-weight: 700;
  color: #667eea;
  letter-spacing: 5px;
  margin-bottom: 20px;
}
</style>