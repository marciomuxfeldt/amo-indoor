<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="header-left">
        <h1>Amo Indoor</h1>
        <span class="header-subtitle">Painel Administrativo</span>
      </div>

      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <div class="user-details">
            <span class="user-email">{{ authStore.user?.email }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </div>
        </div>

        <button
          class="btn-logout"
          :disabled="loggingOut"
          @click="handleLogout"
        >
          {{ loggingOut ? 'Saindo...' : 'Sair' }}
        </button>
      </div>
    </header>

    <div class="admin-content">
      <aside class="admin-sidebar">
        <nav class="sidebar-nav">
          <router-link
            to="/admin"
            class="nav-item"
            exact-active-class="active"
          >
            <span class="nav-icon">🏠</span>
            <span class="nav-label">Dashboard</span>
          </router-link>

          <router-link
            to="/admin/orders"
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">📋</span>
            <span class="nav-label">Pedidos</span>
          </router-link>

          <router-link
            to="/admin/devices"
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">📺</span>
            <span class="nav-label">Dispositivos</span>
          </router-link>

          <router-link
            to="/admin/media"
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">🎬</span>
            <span class="nav-label">Mídias</span>
          </router-link>

          <router-link
            to="/admin/products"
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">🛍️</span>
            <span class="nav-label">Produtos</span>
          </router-link>

          <router-link
            to="/admin/tv-settings"
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Config. TV</span>
          </router-link>
        </nav>
      </aside>

      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const loggingOut = ref(false)

const userInitials = computed(() => {
  const email = authStore.user?.email || ''
  return email.charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return 'Administrador'
  if (role === 'coordinator') return 'Coordenador'
  return 'Usuário'
})

async function handleLogout(): Promise<void> {
  if (loggingOut.value) return

  loggingOut.value = true

  try {
    await authStore.logout()
    router.push('/admin/login')
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.admin-header {
  background: white;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 15px;
}

.header-left h1 {
  font-size: 28px;
  font-weight: 800;
  color: #2c3e50;
  margin: 0;
}

.header-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-email {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.user-role {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

.btn-logout {
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-logout:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
}

.btn-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-content {
  display: flex;
  flex: 1;
}

.admin-sidebar {
  width: 250px;
  background: white;
  padding: 30px 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 30px;
  color: #7f8c8d;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #2c3e50;
}

.nav-item.active {
  background: #f0f4ff;
  color: #667eea;
  border-left-color: #667eea;
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 15px;
}

.admin-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-header {
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
  }

  .header-left {
    flex-direction: column;
    gap: 5px;
    align-items: center;
  }

  .header-left h1 {
    font-size: 24px;
  }

  .user-details {
    display: none;
  }

  .admin-sidebar {
    width: 80px;
    padding: 20px 0;
  }

  .nav-item {
    flex-direction: column;
    gap: 5px;
    padding: 15px 10px;
    text-align: center;
  }

  .nav-label {
    font-size: 11px;
  }

  .admin-main {
    padding: 20px;
  }
}
</style>