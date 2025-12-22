<template>
  <div class="media-management">
    <div class="page-header">
      <h2>Gerenciamento de Mídia Publicitária</h2>
      <button
        class="btn-primary"
        @click="showCreateDialog = true"
      >
        <span class="icon">+</span>
        Nova Mídia
      </button>
    </div>

    <div class="info-box">
      <h3>📐 Tamanhos Recomendados</h3>
      <ul>
        <li><strong>Imagens:</strong> 1920x1080 pixels (Full HD 16:9)</li>
        <li><strong>Vídeos:</strong> 1920x1080 pixels, máximo 10 segundos, formato MP4</li>
      </ul>
      <h3 style="margin-top: 15px;">
        🌐 Como Adicionar Imagens/Vídeos
      </h3>
      <p style="margin: 5px 0; color: #424242;">
        Faça upload em serviços gratuitos como <strong>Imgur</strong>, <strong>Cloudinary</strong> ou <strong>ImgBB</strong> e cole a URL direta aqui.
      </p>
    </div>

    <div
      v-if="mediaStore.loading"
      class="loading"
    >
      Carregando...
    </div>

    <div
      v-else-if="mediaStore.error"
      class="error-state"
    >
      <p>❌ Erro ao carregar mídias: {{ mediaStore.error }}</p>
      <button
        class="btn-primary"
        @click="reloadMedia"
      >
        Tentar Novamente
      </button>
    </div>

    <div
      v-else-if="mediaStore.mediaItems.length === 0"
      class="empty-state"
    >
      <p>Nenhuma mídia cadastrada</p>
    </div>

    <div
      v-else
      class="media-grid"
    >
      <div
        v-for="media in mediaStore.mediaItems"
        :key="media.id"
        class="media-card"
      >
        <div class="media-preview">
          <!-- Vídeos do YouTube -->
          <iframe
            v-if="isYouTubeVideo(media)"
            :src="getYouTubeEmbedUrl(media.url)"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="media-video"
          />
          
          <!-- Vídeos do Vimeo -->
          <iframe
            v-else-if="isVimeoVideo(media)"
            :src="getVimeoEmbedUrl(media.url)"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            class="media-video"
          />
          
          <!-- Vídeos diretos (MP4, WebM, etc) -->
          <video
            v-else-if="media.type === 'video'"
            :src="media.url"
            controls
            class="media-video"
          />
          
          <!-- Imagens -->
          <img
            v-else
            :src="media.image_url || media.url"
            :alt="media.title"
            class="media-image"
            @error="handleImageError"
          >
        </div>
        <div class="media-info">
          <h3>{{ media.title }}</h3>
          <p class="media-type">
            {{ media.type === 'video' ? '🎥 Vídeo' : '🖼️ Imagem' }} - {{ media.duration }}s
          </p>
          <p
            v-if="media.url"
            class="media-url"
          >
            {{ truncateUrl(media.url) }}
          </p>
          <div class="media-status">
            <span
              class="status-badge"
              :class="{ active: media.active }"
            >
              {{ media.active ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
        </div>
        <div class="media-actions">
          <button
            class="btn-secondary"
            @click="editMedia(media)"
          >
            Editar
          </button>
          <button
            class="btn-danger"
            @click="confirmDelete(media)"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <div
      v-if="showCreateDialog || showEditDialog"
      class="modal-overlay"
      @mousedown.self="closeDialogs"
    >
      <div class="modal-content">
        <h3>{{ showEditDialog ? 'Editar Mídia' : 'Nova Mídia' }}</h3>
        <form @submit.prevent="saveMedia">
          <div class="form-group">
            <label>Título</label>
            <input
              v-model="formData.title"
              type="text"
              required
            >
          </div>

          <div class="form-group">
            <label>Tipo</label>
            <select
              v-model="formData.type"
              required
            >
              <option value="image">
                Imagem
              </option>
              <option value="video">
                Vídeo
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ formData.type === 'video' ? 'URL do Vídeo' : 'URL da Imagem' }}</label>
            <input
              v-model="formData.url"
              type="url"
              :placeholder="formData.type === 'video' ? 'https://www.youtube.com/watch?v=...' : '/images/photo1766156774.jpg'"
              required
            >
            <p class="help-text">
              {{ formData.type === 'video' 
                ? 'Cole a URL do YouTube, Vimeo ou vídeo direto (MP4). Tamanho recomendado: 1920x1080 pixels' 
                : 'Cole a URL direta da imagem. Tamanho recomendado: 1920x1080 pixels (16:9)' 
              }}
            </p>
            <p class="help-text">
              <strong>Serviços gratuitos:</strong> 
              {{ formData.type === 'video' 
                ? 'YouTube, Vimeo, Streamable' 
                : 'Imgur, Cloudinary, ImgBB, Postimages' 
              }}
            </p>
          </div>

          <div class="form-group">
            <label>Duração (segundos)</label>
            <input
              v-model.number="formData.duration"
              type="number"
              min="1"
              :max="formData.type === 'video' ? 30 : 60"
              required
            >
            <p
              v-if="formData.type === 'video'"
              class="help-text"
            >
              Tempo de exibição do vídeo na tela (máximo 30 segundos)
            </p>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="formData.active"
                type="checkbox"
              >
              <span>Ativo</span>
            </label>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="closeDialogs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="saving"
            >
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div
      v-if="showDeleteDialog"
      class="modal-overlay"
      @mousedown.self="showDeleteDialog = false"
    >
      <div class="modal-content modal-small">
        <h3>Confirmar Exclusão</h3>
        <p>Tem certeza que deseja excluir esta mídia?</p>
        <div class="form-actions">
          <button
            class="btn-secondary"
            @click="showDeleteDialog = false"
          >
            Cancelar
          </button>
          <button
            class="btn-danger"
            @click="deleteMedia"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useMediaStore } from '@/stores/mediaStore'
import type { Media } from '@/types'

const mediaStore = useMediaStore()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedMedia = ref<Media | null>(null)
const saving = ref(false)

const formData = reactive({
  title: '',
  type: 'image' as 'image' | 'video',
  url: '',
  duration: 5,
  active: true
})

// Load data on mount
onMounted(async () => {
  console.log('🎬 [MediaManagement] Componente montado, carregando mídias...')
  await reloadMedia()
})

async function reloadMedia(): Promise<void> {
  try {
    await mediaStore.fetchMedia()
    console.log('✅ [MediaManagement] Mídias carregadas:', {
      total: mediaStore.mediaItems.length,
      items: mediaStore.mediaItems.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        url: m.url
      }))
    })
  } catch (error) {
    console.error('❌ [MediaManagement] Erro ao carregar mídias:', error)
  }
}

function isYouTubeVideo(media: Media): boolean {
  return media.type === 'video' && (
    media.url.includes('youtube.com') || 
    media.url.includes('youtu.be')
  )
}

function isVimeoVideo(media: Media): boolean {
  return media.type === 'video' && media.url.includes('vimeo.com')
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url
}

function truncateUrl(url: string): string {
  return url.length > 50 ? url.substring(0, 47) + '...' : url
}

function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement
  console.error('❌ Erro ao carregar imagem:', img.src)
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagem indisponível%3C/text%3E%3C/svg%3E'
}

function resetForm(): void {
  formData.title = ''
  formData.type = 'image'
  formData.url = ''
  formData.duration = 5
  formData.active = true
}

function closeDialogs(): void {
  showCreateDialog.value = false
  showEditDialog.value = false
  resetForm()
  selectedMedia.value = null
}

function editMedia(media: Media): void {
  selectedMedia.value = media
  formData.title = media.title
  formData.type = media.type
  formData.url = media.url
  formData.duration = media.duration
  formData.active = media.active ?? true
  showEditDialog.value = true
}

function confirmDelete(media: Media): void {
  selectedMedia.value = media
  showDeleteDialog.value = true
}

async function saveMedia(): Promise<void> {
  if (saving.value) return
  
  saving.value = true
  try {
    console.log('💾 [MediaManagement] Salvando mídia:', formData)
    
    if (showEditDialog.value && selectedMedia.value) {
      // Editar mídia existente
      await mediaStore.updateMedia(selectedMedia.value.id, {
        title: formData.title,
        type: formData.type,
        url: formData.url,
        duration: formData.duration,
        active: formData.active
      })
      console.log('✅ [MediaManagement] Mídia atualizada com sucesso')
    } else {
      // Criar nova mídia
      await mediaStore.createMedia({
        title: formData.title,
        type: formData.type,
        url: formData.url,
        duration: formData.duration,
        active: formData.active
      })
      console.log('✅ [MediaManagement] Mídia criada com sucesso')
    }
    closeDialogs()
  } catch (error) {
    console.error('❌ [MediaManagement] Erro ao salvar mídia:', error)
    alert(`Erro ao salvar mídia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  } finally {
    saving.value = false
  }
}

async function deleteMedia(): Promise<void> {
  if (!selectedMedia.value) return
  
  try {
    console.log('🗑️ [MediaManagement] Deletando mídia:', selectedMedia.value.id)
    await mediaStore.deleteMedia(selectedMedia.value.id)
    console.log('✅ [MediaManagement] Mídia deletada com sucesso')
    showDeleteDialog.value = false
    selectedMedia.value = null
  } catch (error) {
    console.error('❌ [MediaManagement] Erro ao excluir mídia:', error)
    alert(`Erro ao excluir mídia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}
</script>

<style scoped>
.media-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.info-box {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 8px;
}

.info-box h3 {
  margin: 0 0 10px 0;
  color: #1976d2;
  font-size: 18px;
}

.info-box ul {
  margin: 0;
  padding-left: 20px;
}

.info-box li {
  margin: 5px 0;
  color: #424242;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.media-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.media-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.media-preview {
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-image,
.media-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-info {
  padding: 20px;
}

.media-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #2c3e50;
}

.media-type {
  color: #7f8c8d;
  font-size: 14px;
  margin: 5px 0;
}

.media-url {
  color: #95a5a6;
  font-size: 12px;
  margin: 5px 0;
  font-family: monospace;
}

.media-status {
  margin-top: 10px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #e0e0e0;
  color: #757575;
}

.status-badge.active {
  background: #c8e6c9;
  color: #2e7d32;
}

.media-actions {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #9ca3db;
  cursor: not-allowed;
}

.btn-primary .icon {
  margin-right: 8px;
  font-size: 18px;
}

.btn-secondary {
  background: #e0e0e0;
  color: #424242;
  flex: 1;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.btn-danger {
  background: #ef5350;
  color: white;
  flex: 1;
}

.btn-danger:hover {
  background: #e53935;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.help-text {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.form-actions button {
  flex: 1;
}

.loading,
.empty-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 18px;
}

.error-state {
  color: #e53935;
}

.error-state button {
  margin-top: 20px;
}
</style>