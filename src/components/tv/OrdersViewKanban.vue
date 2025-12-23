<template>
  <div class="orders-kanban">
    <div class="kanban-container">
      <!-- Coluna Em Preparo (Esquerda) -->
      <div class="kanban-column preparing-column">
        <div class="column-header">
          <h2>EM PREPARO</h2>
          <span class="count">{{ preparingOrders.length }}</span>
        </div>
        <div class="orders-list">
          <div
            v-for="order in preparingOrders"
            :key="order.id"
            class="order-card preparing"
          >
            <span class="order-number">{{ order.order_number }}</span>
            <span class="customer-name">{{ formatCustomerName(order.customer_name) }}</span>
            <span class="store-name">{{ order.store_name }}</span>
          </div>
        </div>
      </div>

      <!-- Coluna Prontos (Direita) -->
      <div class="kanban-column ready-column">
        <div class="column-header">
          <h2>PRONTOS</h2>
          <span class="count">{{ readyOrders.length }}</span>
        </div>
        <div class="orders-list">
          <div
            v-for="order in readyOrders"
            :key="order.id"
            class="order-card ready"
          >
            <span class="order-number">{{ order.order_number }}</span>
            <span class="customer-name">{{ formatCustomerName(order.customer_name) }}</span>
            <span class="store-name">{{ order.store_name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOrdersStore } from '@/stores/ordersStore'
import { useDevicesStore } from '@/stores/devicesStore'
import { storage } from '@/services/storage'
import { maskName } from '@/utils/qrcode'

const ordersStore = useOrdersStore()
const devicesStore = useDevicesStore()

const deviceId = computed(() => storage.getLocalStorage<string>('deviceId'))

const deviceSettings = computed(() => {
  if (!deviceId.value) return null
  return devicesStore.getDeviceSettings(deviceId.value)
})

const readyOrders = computed(() => 
  ordersStore.orders
    .filter(order => order.status === 'READY')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
)

const preparingOrders = computed(() => 
  ordersStore.orders
    .filter(order => order.status === 'PREPARING')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
)

function formatCustomerName(name: string): string {
  if (!name) return ''
  if (!deviceSettings.value?.show_full_name) {
    return maskName(name)
  }
  return name
}
</script>

<style scoped>
.orders-kanban {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  overflow: hidden;
}

.kanban-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  height: 100%;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid rgba(255, 255, 255, 0.3);
}

.column-header h2 {
  font-size: 48px;
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.column-header .count {
  font-size: 48px;
  font-weight: 800;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 25px;
  border-radius: 15px;
  min-width: 80px;
  text-align: center;
}

.orders-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.orders-list::-webkit-scrollbar {
  width: 12px;
}

.orders-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.orders-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.orders-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.order-card {
  display: flex;
  align-items: center;
  gap: 20px;
  border-radius: 15px;
  padding: 20px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.order-card.ready {
  background: #e8f8f5;
  border-left: 8px solid #27ae60;
}

.order-card.preparing {
  background: #fff3cd;
  border-left: 8px solid #f39c12;
}

.order-number {
  font-size: 56px;
  font-weight: 900;
  color: #2c3e50;
  min-width: 120px;
  text-align: left;
}

.customer-name {
  font-size: 56px;
  font-weight: 900;
  color: #2c3e50;
  flex: 1;
  text-align: left;
}

.store-name {
  font-size: 36px;
  font-weight: 700;
  color: #7f8c8d;
  text-align: right;
  min-width: 150px;
}

.preparing-column {
  border: 3px solid #f39c12;
}

.ready-column {
  border: 3px solid #27ae60;
}
</style>