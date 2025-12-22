<template>
  <AdminLayout>
    <SupabaseWarning />
    
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">
            {{ onlineDevices }}
          </div>
          <div class="stat-label">
            TVs Online
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ readyOrders }}
          </div>
          <div class="stat-label">
            Pedidos Prontos
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ activeProducts }}
          </div>
          <div class="stat-label">
            Produtos Ativos
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <router-view />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useOrdersStore } from '@/stores/ordersStore'
import { useMediaStore } from '@/stores/mediaStore'
import { useDevicesStore } from '@/stores/devicesStore'
import AdminLayout from '@/layouts/AdminLayout.vue'
import SupabaseWarning from '@/components/SupabaseWarning.vue'

const ordersStore = useOrdersStore()
const mediaStore = useMediaStore()
const devicesStore = useDevicesStore()

const onlineDevices = computed(() => devicesStore.onlineDevices.length)
const readyOrders = computed(() => ordersStore.readyOrders.length)
const activeProducts = computed(() => mediaStore.activeProducts.length)

onMounted(async () => {
  await Promise.all([
    ordersStore.fetchOrders(),
    mediaStore.fetchProducts(),
    mediaStore.fetchMedia(),
    devicesStore.fetchDevices(),
    devicesStore.fetchSettings()
  ])
})
</script>

<style scoped>
.dashboard-header {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.dashboard-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 30px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 15px;
  color: white;
  text-align: center;
}

.stat-value {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  opacity: 0.9;
}

.dashboard-content {
  /* Content will be rendered here by router-view */
}
</style>