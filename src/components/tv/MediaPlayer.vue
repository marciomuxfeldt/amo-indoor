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
        >
        
        <!-- Vídeo -->
        <video
          v-else-if="currentMedia.type === 'video' && !isYouTube(currentMedia.url) && !isVimeo(currentMedia.url)"
          :src="currentMedia.url"
          class="media-video"
          autoplay
          muted
          loop
          playsinline
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
  // Extrair ID do vídeo
  let videoId = ''
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  }
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`
}

function getVimeoEmbedUrl(url: string): string {
  // Extrair ID do vídeo
  const videoId = url.split('vimeo.com/')[1]?.split('?')[0] || ''
  return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1`
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
    console.log('🎬 [MediaPlayer] Mídia atual mudou:', {
      id: newMedia.id,
      title: newMedia.title,
      type: newMedia.type,
      url: newMedia.url,
      duration: newMedia.duration,
      isYouTube: isYouTube(newMedia.url || ''),
      isVimeo: isVimeo(newMedia.url || ''),
      typeCheck: newMedia.type === 'video',
      urlCheck: newMedia.url
    })
    
    // Verificar qual condição será atendida
    if (newMedia.type === 'image') {
      console.log('✅ Vai mostrar IMAGEM')
    } else if (newMedia.type === 'video' && !isYouTube(newMedia.url || '') && !isVimeo(newMedia.url || '')) {
      console.log('✅ Vai mostrar VÍDEO DIRETO (MP4)')
    } else if (isYouTube(newMedia.url || '')) {
      console.log('✅ Vai mostrar YOUTUBE')
      console.log('   URL do embed:', getYouTubeEmbedUrl(newMedia.url || ''))
    } else if (isVimeo(newMedia.url || '')) {
      console.log('✅ Vai mostrar VIMEO')
      console.log('   URL do embed:', getVimeoEmbedUrl(newMedia.url || ''))
    } else {
      console.log('❌ NENHUMA CONDIÇÃO ATENDIDA!')
    }
    
    startRotation()
  }
})

onMounted(async () => {
  console.log('🎬 [MediaPlayer] Componente montado')
  await mediaStore.fetchMedia()
  
  console.log('📊 [MediaPlayer] Mídias carregadas:', {
    total: mediaStore.activeMedia.length,
    mídias: mediaStore.activeMedia.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type,
      url: m.url
    }))
  })
  
  if (currentMedia.value) {
    console.log('🎬 [MediaPlayer] Iniciando com mídia:', currentMedia.value.title)
    startRotation()
  } else {
    console.log('⚠️ [MediaPlayer] Nenhuma mídia disponível para exibir')
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