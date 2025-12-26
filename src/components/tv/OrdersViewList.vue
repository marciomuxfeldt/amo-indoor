<template>
  <div
    class="orders-view-list"
    :style="{ background: backgroundGradient }"
  >
    <div
      v-if="displayOrders.length === 0"
      class="no-orders"
    >
      <p>Nenhum pedido no momento</p>
    </div>
    <div
      v-else
      class="orders-list"
    >
      <div class="list-header">
        <h1>PEDIDOS</h1>
      </div>
      
      <!-- Pedidos PRONTOS e PREPARANDO -->
      <template
        v-for="(order, index) in displayOrders"
        :key="order.id"
      >
        <div
          class="order-row"
          :class="{ 
            'new-order': isNewOrder(order.id),
            'ready': order.status === 'READY',
            'preparing': order.status === 'PREPARING'
          }"
          :style="getRowStyle(order.status)"
        >
          <div class="order-number-col">
            <span class="label">PEDIDO</span>
            <span class="value">{{ order.order_number }}</span>
          </div>
          <div class="customer-name-col">
            <span class="label">CLIENTE</span>
            <span class="value">{{ getDisplayName(order) }}</span>
          </div>
          <div class="store-name-col">
            <span class="label">LOJA</span>
            <span class="value">{{ order.store_name }}</span>
          </div>
          <div class="status-col">
            <span
              class="status-badge"
              :style="getStatusStyle(order.status)"
            >
              {{ getStatusText(order.status) }}
            </span>
          </div>
        </div>
        
        <!-- Espaçamento extra entre PRONTOS e PREPARANDO -->
        <div 
          v-if="shouldShowSeparator(index)" 
          class="status-separator"
        />
      </template>
    </div>

    <div
      v-if="logoUrl"
      class="logo-container"
    >
      <img
        :src="logoUrl"
        alt="Logo"
        class="company-logo"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useOrdersStore } from '@/stores/ordersStore'
import { useDevicesStore } from '@/stores/devicesStore'
import { storage } from '@/services/storage'
import { maskName } from '@/utils/qrcode'
import type { Order } from '@/types'

const ordersStore = useOrdersStore()
const devicesStore = useDevicesStore()

const newOrderIds = ref<Set<string>>(new Set())

const displayOrders = computed(() => ordersStore.displayOrders)

const currentDeviceId = computed(() => storage.getLocalStorage<string>('deviceId'))

const deviceSettings = computed(() => {
  if (!currentDeviceId.value) return null
  return devicesStore.getDeviceSettings(currentDeviceId.value)
})

const primaryColor = computed(() => deviceSettings.value?.primary_color || '#3b82f6')

const logoUrl = computed(() => deviceSettings.value?.logo_url || '')

const backgroundGradient = computed(() => {
  const color = primaryColor.value
  return `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, 20)} 100%)`
})

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

function shouldShowSeparator(index: number): boolean {
  const currentOrder = displayOrders.value[index]
  const nextOrder = displayOrders.value[index + 1]
  
  // Mostrar separador quando o pedido atual é READY e o próximo é PREPARING
  return currentOrder.status === 'READY' && nextOrder?.status === 'PREPARING'
}

function getRowStyle(status: string) {
  if (status === 'READY') {
    return {
      background: 'white',
      borderLeft: '4px solid #27ae60'
    }
  } else {
    return {
      background: '#fff9e6',
      borderLeft: '4px solid #f39c12'
    }
  }
}

function getStatusStyle(status: string) {
  if (status === 'READY') {
    return {
      background: '#e8f8f5',
      color: '#27ae60'
    }
  } else {
    return {
      background: '#fff3cd',
      color: '#f39c12'
    }
  }
}

function getStatusText(status: string): string {
  return status === 'READY' ? '✓ PRONTO PARA RETIRAR' : '⏱ PREPARANDO'
}

function getDisplayName(order: Order): string {
  if (!deviceSettings.value?.show_full_name) {
    return maskName(order.customer_name)
  }
  return order.customer_name
}

function isNewOrder(orderId: string): boolean {
  return newOrderIds.value.has(orderId)
}

watch(() => ordersStore.displayOrders, (newOrders, oldOrders) => {
  const oldIds = new Set(oldOrders.map(o => o.id))
  newOrders.forEach(order => {
    if (!oldIds.has(order.id)) {
      newOrderIds.value.add(order.id)
      setTimeout(() => {
        newOrderIds.value.delete(order.id)
      }, 2000)
    }
  })
})
</script>

<style scoped>
.orders-view-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.5vh 1.5vw;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.no-orders {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  font-size: clamp(32px, 4vh, 48px);
  font-weight: 300;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1vh;
  width: 100%;
  flex: 1;
  max-width: 1800px;
  margin: 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5vw;
  margin-bottom: 8vh;
}

/* Scrollbar personalizada */
.orders-list::-webkit-scrollbar {
  width: 6px;
}

.orders-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.orders-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.orders-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.list-header {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 1vh;
  padding: 1.5vh 2vw;
  text-align: center;
  margin-bottom: 1vh;
  flex-shrink: 0;
}

.list-header h1 {
  font-size: clamp(28px, 3.5vh, 40px);
  font-weight: 800;
  color: white;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.order-row {
  display: grid;
  grid-template-columns: minmax(100px, 140px) minmax(150px, 1fr) minmax(150px, 1fr) minmax(180px, 240px);
  gap: 1.5vw;
  align-items: center;
  border-radius: 1vh;
  padding: 1.5vh 2vw;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  flex-shrink: 0;
  min-height: 0;
}

.order-row:hover {
  transform: translateX(6px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.order-row.new-order {
  animation: slideIn 0.5s ease, pulse 2s ease-in-out;
  border: 2px solid #ffd700;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
  }
}

/* Separador simples entre PRONTOS e PREPARANDO */
.status-separator {
  height: 2vh;
  flex-shrink: 0;
}

.order-number-col,
.store-name-col,
.customer-name-col,
.status-col {
  display: flex;
  flex-direction: column;
  gap: 0.3vh;
  min-width: 0;
}

.label {
  font-size: clamp(14px, 1.8vh, 22px);
  font-weight: 600;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: clamp(32px, 4.5vh, 56px);
  font-weight: 800;
  color: #2c3e50;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-number-col .value {
  color: #1e3c72;
}

.customer-name-col .value {
  color: #2a5298;
}

.store-name-col .value {
  color: #2a5298;
}

.status-col {
  align-items: flex-end;
  justify-content: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5vh;
  font-size: clamp(20px, 3vh, 36px);
  font-weight: 700;
  padding: 1vh 1.5vw;
  border-radius: 1vh;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.logo-container {
  position: fixed;
  bottom: 2vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.company-logo {
  max-height: clamp(50px, 6vh, 70px);
  max-width: clamp(150px, 20vw, 250px);
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* CORREÇÃO 4: Media queries específicas para navegadores TCI e telas menores */
@media (max-height: 768px) {
  .orders-view-list {
    padding: 1vh 1vw;
  }
  
  .orders-list {
    gap: 0.8vh;
    margin-bottom: 6vh;
  }
  
  .list-header {
    padding: 1vh 1.5vw;
    margin-bottom: 0.8vh;
  }
  
  .order-row {
    padding: 1vh 1.5vw;
    gap: 1vw;
  }
  
  .status-separator {
    height: 1.5vh;
  }
}

@media (max-width: 1400px) {
  .order-row {
    grid-template-columns: minmax(80px, 120px) minmax(120px, 1fr) minmax(120px, 1fr) minmax(150px, 200px);
    gap: 1.2vw;
    padding: 1.2vh 1.5vw;
  }
}

@media (max-width: 1000px) {
  .order-row {
    grid-template-columns: 1fr;
    gap: 1vh;
  }

  .status-col {
    align-items: flex-start;
  }
}

/* Para telas muito grandes */
@media (min-width: 1920px) {
  .order-row {
    padding: 1.8vh 2.5vw;
    grid-template-columns: 160px 1fr 1fr 280px;
  }
}
</style>