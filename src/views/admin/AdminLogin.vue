<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Amo Indoor</h1>
        <p>Painel Administrativo</p>
      </div>

      <form
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="credentials.email"
            type="email"
            required
            placeholder="seu@email.com"
            :disabled="loading"
            autocomplete="email"
          >
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            required
            placeholder="••••••••"
            :disabled="loading"
            autocomplete="current-password"
          >
        </div>

        <div
          v-if="errorMessage"
          class="error-message"
        >
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="loading"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="login-footer">
        <p>Sistema de uso interno</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const credentials = ref({
  email: '',
  password: ''
})

const errorMessage = ref<string | null>(null)
const loading = ref(false)

onMounted(() => {
  // If already authenticated, redirect to admin
  if (authStore.isAuthenticated) {
    router.push('/admin')
  }
})

async function handleLogin(): Promise<void> {
  if (loading.value) return

  errorMessage.value = null
  loading.value = true

  try {
    const { success, error } = await authStore.login(credentials.value)

    if (!success) {
      errorMessage.value = error || 'Falha ao fazer login. Verifique suas credenciais.'
      return
    }

    // Redirect to admin panel
    router.push('/admin')
  } catch (err) {
    console.error('Login error:', err)
    errorMessage.value = 'Erro inesperado ao fazer login. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 50px 40px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 36px;
  font-weight: 800;
  color: #2c3e50;
  margin-bottom: 10px;
}

.login-header p {
  font-size: 18px;
  color: #7f8c8d;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-group input::placeholder {
  color: #bdc3c7;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px 15px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border-left: 4px solid #c33;
}

.btn-login {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 10px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
}

.login-footer p {
  color: #95a5a6;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .login-card {
    padding: 40px 30px;
  }

  .login-header h1 {
    font-size: 28px;
  }

  .login-header p {
    font-size: 16px;
  }
}
</style>