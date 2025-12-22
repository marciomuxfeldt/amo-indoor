<template>
  <div class="order-management">
    <div class="section-header">
      <h2>Gerenciamento de Pedidos (Modo Teste)</h2>
      <button
        class="btn-primary"
        @click="openCreateModal"
      >
        + Novo Pedido
      </button>
    </div>

    <div class="orders-table">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Loja</th>
            <th>Status</th>
            <th>Canal</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in orders"
            :key="order.id"
          >
            <td><strong>{{ order.order_number }}</strong></td>
            <td>{{ order.customer_name }}</td>
            <td>{{ order.store_name }}</td>
            <td>
              <select
                :value="order.status"
                class="status-select"
                :class="order.status.toLowerCase()"
                :disabled="isUpdating === order.id"
                @change="updateStatus(order.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="PENDING">
                  Pendente
                </option>
                <option value="PREPARING">
                  Preparando
                </option>
                <option value="READY">
                  Pronto
                </option>
                <option value="DELIVERED">
                  Entregue
                </option>
              </select>
            </td>
            <td>{{ order.channel }}</td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn-edit-small"
                  @click="openEditModal(order)"
                >
                  Editar
                </button>
                <button
                  class="btn-danger-small"
                  @click="confirmDelete(order)"
                >
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Criação -->
    <div
      v-if="showCreateModal"
      class="modal"
      @click.self="closeCreateModal"
    >
      <div class="modal-content">
        <h3>Novo Pedido (Teste)</h3>
        <form @submit.prevent="createOrder">
          <div class="form-group">
            <label>Número do Pedido</label>
            <input
              v-model="newOrder.order_number"
              type="text"
              required
              placeholder="Ex: 101"
            >
          </div>
          <div class="form-group">
            <label>Nome do Cliente</label>
            <input
              v-model="newOrder.customer_name"
              type="text"
              required
              placeholder="Ex: João Silva"
            >
          </div>
          <div class="form-group">
            <label>Nome da Loja</label>
            <input
              v-model="newOrder.store_name"
              type="text"
              required
              placeholder="Ex: Tokyo Sushi, Hakalu Poke, Usina de Massas"
            >
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="newOrder.status">
              <option value="PENDING">
                Pendente
              </option>
              <option value="PREPARING">
                Preparando
              </option>
              <option value="READY">
                Pronto
              </option>
              <option value="DELIVERED">
                Entregue
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Canal</label>
            <input
              v-model="newOrder.channel"
              type="text"
              placeholder="Ex: local, delivery"
            >
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
      v-if="showEditModal"
      class="modal"
      @click.self="closeEditModal"
    >
      <div class="modal-content">
        <h3>Editar Pedido</h3>
        <form @submit.prevent="updateOrder">
          <div class="form-group">
            <label>Número do Pedido</label>
            <input
              v-model="editingOrder.order_number"
              type="text"
              required
              placeholder="Ex: 101"
            >
          </div>
          <div class="form-group">
            <label>Nome do Cliente</label>
            <input
              v-model="editingOrder.customer_name"
              type="text"
              required
              placeholder="Ex: João Silva"
            >
          </div>
          <div class="form-group">
            <label>Nome da Loja</label>
            <input
              v-model="editingOrder.store_name"
              type="text"
              required
              placeholder="Ex: Tokyo Sushi, Hakalu Poke, Usina de Massas"
            >
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="editingOrder.status">
              <option value="PENDING">
                Pendente
              </option>
              <option value="PREPARING">
                Preparando
              </option>
              <option value="READY">
                Pronto
              </option>
              <option value="DELIVERED">
                Entregue
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Canal</label>
            <input
              v-model="editingOrder.channel"
              type="text"
              placeholder="Ex: local, delivery"
            >
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
              :disabled="isEditing"
            >
              {{ isEditing ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOrdersStore } from '@/stores/ordersStore'
import type { Order, OrderStatus } from '@/types'

const ordersStore = useOrdersStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const isCreating = ref(false)
const isEditing = ref(false)
const isUpdating = ref<string | null>(null)

const newOrder = ref({
  order_number: '',
  customer_name: '',
  store_name: '',
  status: 'PENDING' as OrderStatus,
  channel: 'local',
  store_id: 'test-store',
  kitchen_id: 'test-kitchen'
})

const editingOrder = ref({
  id: '',
  order_number: '',
  customer_name: '',
  store_name: '',
  status: 'PENDING' as OrderStatus,
  channel: 'local',
  store_id: 'test-store',
  kitchen_id: 'test-kitchen'
})

const orders = computed(() => ordersStore.orders)

function openCreateModal(): void {
  showCreateModal.value = true
  newOrder.value = {
    order_number: '',
    customer_name: '',
    store_name: '',
    status: 'PENDING',
    channel: 'local',
    store_id: 'test-store',
    kitchen_id: 'test-kitchen'
  }
  isCreating.value = false
}

function closeCreateModal(): void {
  showCreateModal.value = false
  isCreating.value = false
}

function openEditModal(order: Order): void {
  showEditModal.value = true
  editingOrder.value = {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    store_name: order.store_name,
    status: order.status,
    channel: order.channel,
    store_id: order.store_id,
    kitchen_id: order.kitchen_id
  }
  isEditing.value = false
}

function closeEditModal(): void {
  showEditModal.value = false
  isEditing.value = false
}

async function createOrder(): Promise<void> {
  if (isCreating.value) return
  
  isCreating.value = true
  try {
    await ordersStore.createOrder(newOrder.value)
    closeCreateModal()
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    alert('Erro ao criar pedido. Tente novamente.')
  } finally {
    isCreating.value = false
  }
}

async function updateOrder(): Promise<void> {
  if (isEditing.value) return
  
  isEditing.value = true
  try {
    await ordersStore.updateOrder(editingOrder.value.id, {
      order_number: editingOrder.value.order_number,
      customer_name: editingOrder.value.customer_name,
      store_name: editingOrder.value.store_name,
      status: editingOrder.value.status,
      channel: editingOrder.value.channel
    })
    closeEditModal()
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    alert('Erro ao atualizar pedido. Tente novamente.')
  } finally {
    isEditing.value = false
  }
}

async function updateStatus(orderId: string, status: string): Promise<void> {
  if (isUpdating.value) return
  
  isUpdating.value = orderId
  try {
    await ordersStore.updateOrderStatus(orderId, status as OrderStatus)
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    alert('Erro ao atualizar status. Tente novamente.')
  } finally {
    isUpdating.value = null
  }
}

function confirmDelete(order: Order): void {
  if (confirm(`Deseja realmente excluir o pedido ${order.order_number}?`)) {
    ordersStore.deleteOrder(order.id)
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR')
}
</script>

<style scoped>
.order-management {
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

.orders-table {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  border-bottom: 2px solid #e0e0e0;
}

th {
  text-align: left;
  padding: 15px;
  font-weight: 700;
  color: #2c3e50;
}

td {
  padding: 15px;
  border-bottom: 1px solid #f5f7fa;
}

tbody tr:hover {
  background: #f5f7fa;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.status-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.status-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-select.pending {
  background: #fff3cd;
  color: #856404;
}

.status-select.preparing {
  background: #cce5ff;
  color: #004085;
}

.status-select.ready {
  background: #d4edda;
  color: #155724;
}

.status-select.delivered {
  background: #d1ecf1;
  color: #0c5460;
}

.btn-primary,
.btn-secondary,
.btn-danger-small,
.btn-edit-small {
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

.btn-edit-small {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  font-size: 14px;
}

.btn-edit-small:hover {
  background: #2980b9;
}

.btn-danger-small {
  padding: 6px 12px;
  background: #e74c3c;
  color: white;
  font-size: 14px;
}

.btn-danger-small:hover {
  background: #c0392b;
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
</style>