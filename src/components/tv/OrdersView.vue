<template>
  <div
    class="orders-view"
    :style="{ background: backgroundGradient }"
  >
    <h1 class="page-title">
      Pedidos
    </h1>
    
    <div
      v-if="displayOrders.length === 0"
      class="no-orders"
    >
      <p>Nenhum pedido no momento</p>
    </div>
    <div
      v-else
      class="orders-container"
    >
      <div
        v-for="order in displayOrders"
        :key="order.id"
        class="order-card"
        :class="{ 
          'new-order': isNewOrder(order.id),
          'ready': order.status === 'READY',
          'preparing': order.status === 'PREPARING'
        }"
        :style="getCardStyle(order.status)"
      >
        <div class="order-number">
          Pedido {{ order.order_number }}
        </div>
        <div class="customer-name">
          {{ getDisplayName(order) }}
        </div>
        <div
          class="order-status"
          :style="getStatusStyle(order.status)"
        >
          {{ getStatusText(order.status) }}
        </div>
      </div>
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

function getCardStyle(status: string) {
  if (status === 'READY') {
    return {
      background: 'white',
      border: '3px solid #27ae60'
    }
  } else {
    return {
      background: '#fff9e6',
      border: '3px solid #f39c12'
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
  return status === 'READY' ? 'PRONTO PARA RETIRAR' : 'PREPARANDO'
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
.orders-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  overflow: hidden;
  position: relative;
}

.page-title {
  font-size: 56px;
  font-weight: 700;
  color: white;
  margin: 0 0 30px 0;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.no-orders {
  text-align: center;
  color: white;
  font-size: 48px;
  font-weight: 300;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orders-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  flex: 1;
  max-width: 100%;
  overflow-y: auto;
  padding: 10px;
  align-content: start;
  margin-bottom: 100px;
}

/* Scrollbar personalizada */
.orders-container::-webkit-scrollbar {
  width: 8px;
}

.orders-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.orders-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.orders-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.order-card {
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.order-card.new-order {
  animation: pulse 2s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(255, 215, 0, 0.5);
  }
}

.order-number {
  font-size: 28px;
  font-weight: 700;
  color: #1e3c72;
  margin-bottom: 12px;
}

.customer-name {
  font-size: 36px;
  font-weight: 800;
  color: #2a5298;
  margin-bottom: 15px;
  word-break: break-word;
  flex: 1;
  display: flex;
  align-items: center;
}

.order-status {
  font-size: 20px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
}

.logo-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.company-logo {
  max-height: 80px;
  max-width: 300px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* Responsividade para telas menores */
@media (max-width: 1200px) {
  .page-title {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .orders-container {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 15px;
  }

  .order-number {
    font-size: 24px;
  }

  .customer-name {
    font-size: 30px;
  }

  .order-status {
    font-size: 18px;
    padding: 10px 16px;
  }

  .company-logo {
    max-height: 60px;
    max-width: 200px;
  }
}

/* Para telas muito grandes */
@media (min-width: 1920px) {
  .page-title {
    font-size: 64px;
    margin-bottom: 40px;
  }

  .orders-container {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 25px;
  }

  .order-number {
    font-size: 32px;
  }

  .customer-name {
    font-size: 42px;
  }

  .order-status {
    font-size: 24px;
  }

  .company-logo {
    max-height: 100px;
    max-width: 400px;
  }
}
</style>