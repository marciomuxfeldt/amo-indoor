<template>
  <div
    v-if="!isConfigured"
    class="supabase-warning"
  >
    <div class="warning-content">
      <div class="warning-icon">
        ⚠️
      </div>
      <div class="warning-text">
        <h3>Modo Demonstração</h3>
        <p>
          O Supabase não está configurado. A aplicação está funcionando em modo local com dados de exemplo.
          Para usar todas as funcionalidades, configure as variáveis de ambiente no arquivo <code>.env</code>
        </p>
        <button
          class="dismiss-btn"
          @click="dismiss"
        >
          Entendi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isSupabaseConfigured } from '@/services/supabase'

const isConfigured = ref(true)
const dismissed = ref(false)

onMounted(() => {
  const wasDismissed = localStorage.getItem('supabase-warning-dismissed')
  dismissed.value = wasDismissed === 'true'
  isConfigured.value = isSupabaseConfigured || dismissed.value
})

function dismiss(): void {
  localStorage.setItem('supabase-warning-dismissed', 'true')
  dismissed.value = true
  isConfigured.value = true
}
</script>

<style scoped>
.supabase-warning {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  max-width: 600px;
  width: 90%;
}

.warning-content {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
  color: white;
  padding: 20px 25px;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(255, 107, 107, 0.4);
  display: flex;
  gap: 20px;
  align-items: flex-start;
  animation: slideDown 0.5s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.warning-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.warning-text h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.warning-text p {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
  opacity: 0.95;
}

.warning-text code {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.dismiss-btn {
  background: white;
  color: #ff6b6b;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dismiss-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>