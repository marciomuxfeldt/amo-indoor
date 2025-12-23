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
  padding: 20px;
  overflow: hidden;
  position: relative;
}

.no-orders {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  font-size: 48px;
  font-weight: 300;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  flex: 1;
  max-width: 1800px;
  margin: 0 auto;
  overflow-y: auto;
  padding-right: 10px;
  margin-bottom: 100px;
}

/* Scrollbar personalizada */
.orders-list::-webkit-scrollbar {
  width: 8px;
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
  border-radius: 12px;
  padding: 15px 25px;
  text-align: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.list-header h1 {
  font-size: 40px;
  font-weight: 800;
  color: white;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.order-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr 240px;
  gap: 20px;
  align-items: center;
  border-radius: 12px;
  padding: 16px 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  flex-shrink: 0;
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
  height: 20px;
  flex-shrink: 0;
}

.order-number-col,
.store-name-col,
.customer-name-col,
.status-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 22px;
  font-weight: 600;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 56px;
  font-weight: 800;
  color: #2c3e50;
  line-height: 1;
}

.order-number-col .value {
  color: #1e3c72;
}

.customer-name-col .value {
  color: #2a5298;
  word-break: break-word;
}

.store-name-col .value {
  color: #2a5298;
  word-break: break-word;
}

.status-col {
  align-items: flex-end;
  justify-content: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 36px;
  font-weight: 700;
  padding: 12px 20px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.logo-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.company-logo {
  max-height: 70px;
  max-width: 250px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@media (max-width: 1400px) {
  .order-row {
    grid-template-columns: 120px 1fr 1fr 200px;
    gap: 15px;
    padding: 14px 20px;
  }

  .list-header h1 {
    font-size: 36px;
  }

  .label {
    font-size: 18px;
  }

  .value {
    font-size: 48px;
  }

  .status-badge {
    font-size: 32px;
    padding: 10px 18px;
  }

  .status-separator {
    height: 15px;
  }

  .company-logo {
    max-height: 60px;
    max-width: 200px;
  }
}

@media (max-width: 1000px) {
  .order-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .status-col {
    align-items: flex-start;
  }

  .list-header h1 {
    font-size: 32px;
  }

  .label {
    font-size: 16px;
  }

  .value {
    font-size: 44px;
  }

  .status-badge {
    font-size: 30px;
    padding: 10px 16px;
  }

  .status-separator {
    height: 12px;
  }
}

/* Para telas muito grandes */
@media (min-width: 1920px) {
  .list-header h1 {
    font-size: 48px;
  }

  .order-row {
    padding: 18px 30px;
    grid-template-columns: 160px 1fr 1fr 280px;
  }

  .label {
    font-size: 24px;
  }

  .value {
    font-size: 64px;
  }

  .status-badge {
    font-size: 40px;
    padding: 14px 24px;
  }

  .status-separator {
    height: 25px;
  }

  .company-logo {
    max-height: 80px;
    max-width: 300px;
  }
}
</style>