import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { loadMockData } from './data/mockData'
import { isSupabaseConfigured } from './services/supabase'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store
const authStore = useAuthStore()
authStore.initialize()

// Carregar dados de exemplo se Supabase não estiver configurado
if (!isSupabaseConfigured) {
  loadMockData().then(() => {
    console.log('✅ Dados de exemplo carregados com sucesso!')
  })
}

app.mount('#app')