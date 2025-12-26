<template>
  <div 
    class="products-carousel"
    :style="{ background: backgroundColor }"
  >
    <div
      v-if="activeProducts.length === 0"
      class="no-products"
    >
      <p>Nenhum produto em destaque</p>
    </div>
    <div
      v-else
      class="carousel-container"
    >
      <transition
        name="slide"
        mode="out-in"
      >
        <div
          v-if="currentProduct"
          :key="currentIndex"
          class="product-card"
        >
          <div class="product-image">
            <img
              :src="currentProduct.image_url"
              :alt="currentProduct.name"
              @load="onImageLoad"
              @error="onImageError"
            >
            <img
              v-if="currentProduct.logo_url"
              :src="currentProduct.logo_url"
              alt="Logo"
              class="restaurant-logo"
            >
          </div>
          <div class="product-info">
            <h2 class="product-name">
              {{ currentProduct.name }}
            </h2>
            <p class="product-price">
              R$ {{ formatPrice(currentProduct.price) }}
            </p>
          </div>
        </div>
      </transition>
      <div class="carousel-indicators">
        <span
          v-for="(_, index) in activeProducts"
          :key="index"
          class="indicator"
          :class="{ active: index === currentIndex }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useMediaStore } from '@/stores/mediaStore'
import { useDevicesStore } from '@/stores/devicesStore'
import { storage } from '@/services/storage'

const mediaStore = useMediaStore()
const devicesStore = useDevicesStore()

const currentIndex = ref(0)
let intervalId: number | null = null

const activeProducts = computed(() => mediaStore.activeProducts)

const currentProduct = computed(() => {
  if (activeProducts.value.length === 0) return null
  return activeProducts.value[currentIndex.value]
})

const deviceId = computed(() => storage.getLocalStorage<string>('deviceId'))

const deviceSettings = computed(() => {
  if (!deviceId.value) return null
  return devicesStore.getDeviceSettings(deviceId.value)
})

const backgroundColor = computed(() => {
  // Usar a cor predominante configurada no device
  const primaryColor = deviceSettings.value?.primary_color
  if (primaryColor) {
    return primaryColor
  }
  // Cor padrão se não houver configuração
  return '#3b82f6'
})

function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',')
}

function nextProduct(): void {
  if (activeProducts.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % activeProducts.value.length
}

function onImageLoad(): void {
  console.log('Imagem do produto carregada:', currentProduct.value?.name)
}

function onImageError(event: Event): void {
  console.error('Erro ao carregar imagem do produto:', currentProduct.value?.image_url, event)
}

// Pré-carregar todas as imagens ao montar
function preloadAllImages(): void {
  console.log('Pré-carregando', activeProducts.value.length, 'imagens de produtos...')
  
  activeProducts.value.forEach((product, index) => {
    if (product.image_url) {
      const img = new Image()
      img.onload = () => console.log(`Produto ${index + 1} imagem carregada:`, product.name)
      img.onerror = (err) => console.error(`Erro ao carregar produto ${index + 1}:`, product.name, err)
      img.src = product.image_url
    }
    if (product.logo_url) {
      const logo = new Image()
      logo.src = product.logo_url
    }
  })
}

watch(activeProducts, (newProducts) => {
  if (newProducts.length > 0) {
    console.log('Produtos atualizados, pré-carregando imagens...')
    preloadAllImages()
  }
}, { immediate: true })

onMounted(() => {
  if (activeProducts.value.length > 0) {
    preloadAllImages()
  }
  intervalId = window.setInterval(nextProduct, 5000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.products-carousel {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  transition: background 0.3s ease;
}

.no-products {
  text-align: center;
  color: white;
  font-size: 48px;
  font-weight: 300;
}

.carousel-container {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.product-card {
  background: white;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.product-image {
  width: 100%;
  flex: 0 0 auto;
  max-height: 60vh;
  overflow: hidden;
  position: relative;
  background: #f0f0f0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.restaurant-logo {
  position: absolute !important;
  bottom: 20px;
  right: 20px;
  width: 120px !important;
  height: 120px !important;
  object-fit: contain !important;
  background: white;
  border-radius: 20px;
  padding: 15px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.product-info {
  padding: 40px 50px;
  text-align: center;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 180px;
}

.product-name {
  font-size: 56px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-size: 64px;
  font-weight: 800;
  color: #27ae60;
  line-height: 1;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
  flex-shrink: 0;
}

.indicator {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.indicator.active {
  background: white;
  transform: scale(1.3);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.5s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

/* Ajustes para telas menores */
@media (max-height: 900px) {
  .product-image {
    max-height: 55vh;
  }
  
  .product-name {
    font-size: 48px;
  }
  
  .product-price {
    font-size: 56px;
  }
  
  .product-info {
    padding: 30px 40px;
    min-height: 160px;
  }
}

@media (max-height: 768px) {
  .product-image {
    max-height: 50vh;
  }
  
  .product-name {
    font-size: 42px;
  }
  
  .product-price {
    font-size: 48px;
  }
  
  .product-info {
    padding: 25px 35px;
    min-height: 140px;
  }
  
  .restaurant-logo {
    width: 100px !important;
    height: 100px !important;
  }
}
</style>