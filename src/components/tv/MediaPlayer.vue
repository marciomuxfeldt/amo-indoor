<template>
  <div class="media-player">
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="currentMedia"
        :key="currentMedia.id"
        class="media-container"
      >
        <!-- Imagem -->
        <img
          v-if="currentMedia.type === 'image'"
          :src="currentMedia.url"
          :alt="currentMedia.title"
          class="media-image"
          @load="onMediaLoad"
          @error="onMediaError"
        >
        
        <!-- Vídeo -->
        <video
          v-else-if="currentMedia.type === 'video' && !isYouTube(currentMedia.url) && !isVimeo(currentMedia.url)"
          ref="videoRef"
          :src="currentMedia.url"
          class="media-video"
          autoplay
          muted
          loop
          playsinline
          @loadeddata="onMediaLoad"
          @error="onMediaError"
          @canplay="onVideoCanPlay"
        />
        
        <!-- YouTube -->
        <iframe
          v-else-if="isYouTube(currentMedia.url)"
          :src="getYouTubeEmbedUrl(currentMedia.url)"
          class="media-iframe"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        />
        
        <!-- Vimeo -->
        <iframe
          v-else-if="isVimeo(currentMedia.url)"
          :src="getVimeoEmbedUrl(currentMedia.url)"
          class="media-iframe"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        />
      </div>
      
      <div
        v-else
        class="no-media"
      >
        <p>Nenhuma mídia disponível</p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMediaStore } from '@/stores/mediaStore'
import type { Media } from '@/types'

const mediaStore = useMediaStore()
const currentIndex = ref(0)
const intervalId = ref<number | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

const currentMedia = computed<Media | null>(() => {
  const media = mediaStore.activeMedia
  if (!media || media.length === 0) return null
  return media[currentIndex.value] || null
})

function isYouTube(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isVimeo(url: string): boolean {
  return url.includes('vimeo.com')
}

function getYouTubeEmbedUrl(url: string): string {
  let videoId = ''
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  }
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.split('vimeo.com/')[1]?.split('?')[0] || ''
  return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1`
}

function onMediaLoad(): void {
  console.log('Mídia carregada com sucesso:', currentMedia.value?.title)
}

function onMediaError(event: Event): void {
  console.error('Erro ao carregar mídia:', currentMedia.value?.url, event)
}

function onVideoCanPlay(): void {
  console.log('Vídeo pronto para reproduzir:', currentMedia.value?.title)
  // Forçar play caso o autoplay falhe
  if (videoRef.value) {
    videoRef.value.play().catch(err => {
      console.error('Erro ao iniciar vídeo:', err)
    })
  }
}

function nextMedia(): void {
  const media = mediaStore.activeMedia
  if (!media || media.length === 0) return
  
  currentIndex.value = (currentIndex.value + 1) % media.length
}

function startRotation(): void {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
  
  const duration = (currentMedia.value?.duration || 5) * 1000
  intervalId.value = window.setInterval(nextMedia, duration)
}

watch(currentMedia, (newMedia) => {
  if (newMedia) {
    console.log('Mudando para mídia:', newMedia.type, newMedia.title)
    startRotation()
  }
})

onMounted(async () => {
  await mediaStore.fetchMedia()
  
  if (currentMedia.value) {
    startRotation()
  }
})

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
</script>

<style scoped>
.media-player {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #000;
}

.media-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-image,
.media-video,
.media-iframe {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-media {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 1.5rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>