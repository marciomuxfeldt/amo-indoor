import { createRouter, createWebHistory } from 'vue-router'
import TvDisplay from '@/views/TvDisplay.vue'
import TvPairing from '@/views/TvPairing.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import AdminLogin from '@/views/admin/AdminLogin.vue'
import MediaManagement from '@/views/admin/MediaManagement.vue'
import ProductsManagement from '@/views/admin/ProductsManagement.vue'
import { authGuard, loginGuard } from '@/router/guards/authGuard'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        // Se houver deviceId no localStorage, redirecionar para TV
        const deviceId = localStorage.getItem('deviceId')
        if (deviceId) {
          console.log('🔄 [Router] Redirecionando para /tv (deviceId encontrado)')
          return '/tv'
        }
        // Caso contrário, redirecionar para admin login
        console.log('🔄 [Router] Redirecionando para /admin/login (sem deviceId)')
        return '/admin/login'
      }
    },
    {
      path: '/tv',
      name: 'tv',
      component: TvDisplay
    },
    {
      path: '/tv/pairing',
      name: 'tv-pairing',
      component: TvPairing
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLogin,
      beforeEnter: loginGuard
    },
    {
      path: '/admin',
      component: AdminDashboard,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-home',
          component: () => import('@/components/admin/Home.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'devices',
          name: 'admin-devices',
          component: () => import('@/components/admin/DeviceManagement.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/components/admin/OrderManagement.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'products',
          name: 'admin-products',
          component: ProductsManagement,
          meta: { requiresAuth: true }
        },
        {
          path: 'media',
          name: 'admin-media',
          component: MediaManagement,
          meta: { requiresAuth: true }
        },
        {
          path: 'tv-settings',
          name: 'admin-tv-settings',
          component: () => import('@/components/admin/TvMonitor.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// Apply global auth guard
router.beforeEach(authGuard)

export default router