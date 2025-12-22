<template>
  <transition name="fade">
    <div
      v-if="isOffline"
      class="reconnecting-overlay"
    >
      <div class="reconnecting-content">
        <div class="spinner" />
        <h2>Reconectando...</h2>
        <p>Aguarde enquanto restabelecemos a conexão</p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOffline = ref(false)

function handleOnline(): void {
  isOffline.value = false
}

function handleOffline(): void {
  isOffline.value = true
}

onMounted(() => {
  isOffline.value = !navigator.onLine
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.reconnecting-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.reconnecting-content {
  text-align: center;
  color: white;
}

.spinner {
  width: 80px;
  height: 80px;
  border: 8px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

h2 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 15px;
}

p {
  font-size: 28px;
  font-weight: 300;
  opacity: 0.8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>