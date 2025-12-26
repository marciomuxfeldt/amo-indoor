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

// CORREÇÃO 1: Ordenar por updated_at ascendente
const readyOrders = computed(() => 
  ordersStore.orders
    .filter(order => order.status === 'READY')
    .sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
)

const preparingOrders = computed(() => 
  ordersStore.orders
    .filter(order => order.status === 'PREPARING')
    .sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
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
  padding: 2vh;
  overflow: hidden;
  box-sizing: border-box;
}

.kanban-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2vh;
  height: 100%;
  max-height: 100%;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1.5vh;
  padding: 2vh;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2vh;
  padding-bottom: 1.5vh;
  border-bottom: 3px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.column-header h2 {
  font-size: clamp(24px, 4vh, 48px);
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.column-header .count {
  font-size: clamp(24px, 4vh, 48px);
  font-weight: 800;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  padding: 1vh 2vh;
  border-radius: 1vh;
  min-width: 60px;
  text-align: center;
}

.orders-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1.5vh;
  padding-right: 0.5vh;
}

.orders-list::-webkit-scrollbar {
  width: 8px;
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
  gap: 1.5vh;
  border-radius: 1vh;
  padding: 1.5vh 2vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease;
  flex-shrink: 0;
  min-height: 0;
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
  border-left: 6px solid #27ae60;
}

.order-card.preparing {
  background: #fff3cd;
  border-left: 6px solid #f39c12;
}

.order-number {
  font-size: clamp(28px, 4.5vh, 56px);
  font-weight: 900;
  color: #2c3e50;
  min-width: clamp(60px, 10vw, 120px);
  text-align: left;
  flex-shrink: 0;
}

.customer-name {
  font-size: clamp(28px, 4.5vh, 56px);
  font-weight: 900;
  color: #2c3e50;
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-name {
  font-size: clamp(20px, 3vh, 36px);
  font-weight: 700;
  color: #7f8c8d;
  text-align: right;
  min-width: clamp(80px, 12vw, 150px);
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preparing-column {
  border: 3px solid #f39c12;
}

.ready-column {
  border: 3px solid #27ae60;
}

/* CORREÇÃO 4: Media queries para navegadores TCI e telas menores */
@media (max-height: 768px) {
  .orders-kanban {
    padding: 1.5vh;
  }
  
  .kanban-container {
    gap: 1.5vh;
  }
  
  .kanban-column {
    padding: 1.5vh;
  }
  
  .column-header {
    margin-bottom: 1.5vh;
    padding-bottom: 1vh;
  }
  
  .orders-list {
    gap: 1vh;
  }
  
  .order-card {
    padding: 1vh 1.5vh;
    gap: 1vh;
  }
}

@media (max-width: 1024px) {
  .order-number {
    font-size: clamp(24px, 3.5vh, 48px);
  }
  
  .customer-name {
    font-size: clamp(24px, 3.5vh, 48px);
  }
  
  .store-name {
    font-size: clamp(18px, 2.5vh, 32px);
  }
}
</style>