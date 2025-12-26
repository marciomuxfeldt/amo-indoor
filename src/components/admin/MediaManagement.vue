<template>
  <div class="media-management">
    <div class="section-header">
      <h2>Mídia Publicitária</h2>
      <button
        class="btn-primary"
        @click="showCreateModal = true"
      >
        + Nova Mídia
      </button>
    </div>

    <!-- CORREÇÃO 3 e 4: Separar ativos e inativos -->
    <div class="media-section">
      <h3 class="section-title active-title">
        ✅ Mídias Ativas
      </h3>
      <div class="media-grid">
        <div
          v-for="media in activeMedia"
          :key="media.id"
          class="media-card active"
        >
          <div class="media-preview">
            <img
              v-if="media.type === 'image'"
              :src="media.url"
              :alt="media.title"
            >
            <video
              v-else-if="media.type === 'video' && !isYouTubeOrVimeo(media.url)"
              :src="media.url"
              muted
            />
            <div
              v-else
              class="video-placeholder"
            >
              🎥 {{ getVideoSource(media.url) }}
            </div>
          </div>
          <div class="media-info">
            <h4>{{ media.title }}</h4>
            <p class="media-duration">
              Duração: {{ media.duration }}s
            </p>
            <p class="media-type">
              Tipo: {{ media.type === 'video' ? 'Vídeo' : 'Imagem' }}
            </p>
            <div class="media-actions">
              <button
                class="btn-secondary"
                @click="editMedia(media)"
              >
                ✏️ Editar
              </button>
              <button
                class="btn-secondary"
                @click="toggleActive(media)"
              >
                Desativar
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
        <div
          v-if="activeMedia.length === 0"
          class="empty-state"
        >
          <p>Nenhuma mídia ativa</p>
        </div>
      </div>
    </div>

    <div class="media-section inactive-section">
      <h3 class="section-title inactive-title">
        ⏸️ Mídias Inativas
      </h3>
      <div class="media-grid">
        <div
          v-for="media in inactiveMedia"
          :key="media.id"
          class="media-card inactive"
        >
          <div class="media-preview">
            <img
              v-if="media.type === 'image'"
              :src="media.url"
              :alt="media.title"
            >
            <video
              v-else-if="media.type === 'video' && !isYouTubeOrVimeo(media.url)"
              :src="media.url"
              muted
            />
            <div
              v-else
              class="video-placeholder"
            >
              🎥 {{ getVideoSource(media.url) }}
            </div>
          </div>
          <div class="media-info">
            <h4>{{ media.title }}</h4>
            <p class="media-duration">
              Duração: {{ media.duration }}s
            </p>
            <p class="media-type">
              Tipo: {{ media.type === 'video' ? 'Vídeo' : 'Imagem' }}
            </p>
            <div class="media-actions">
              <button
                class="btn-secondary"
                @click="editMedia(media)"
              >
                ✏️ Editar
              </button>
              <button
                class="btn-secondary"
                @click="toggleActive(media)"
              >
                Ativar
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
        <div
          v-if="inactiveMedia.length === 0"
          class="empty-state"
        >
          <p>Nenhuma mídia inativa</p>
        </div>
      </div>
    </div>

    <!-- Modal de Criação -->
    <div
      v-if="showCreateModal"
      class="modal"
      @click.self="showCreateModal = false"
    >
      <div class="modal-content">
        <h3>Nova Mídia</h3>
        <form @submit.prevent="createMedia">
          <div class="form-group">
            <label>Título</label>
            <input
              v-model="newMedia.title"
              type="text"
              required
            >
          </div>
          <div class="form-group">
            <label>URL (Imagem ou Vídeo)</label>
            <input
              v-model="newMedia.url"
              type="url"
              required
              placeholder="https://... (suporta YouTube, Vimeo, MP4, imagens)"
            >
          </div>
          <div class="form-group">
            <label>Duração (segundos)</label>
            <input
              v-model.number="newMedia.duration"
              type="number"
              min="1"
              required
            >
          </div>
          <div class="form-group">
            <label>
              <input
                v-model="newMedia.active"
                type="checkbox"
              >
              Ativo
            </label>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="showCreateModal = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Edição -->
    <div
      v-if="editingMedia"
      class="modal"
      @click.self="cancelEdit"
    >
      <div class="modal-content">
        <h3>Editar Mídia</h3>
        <form @submit.prevent="updateMedia">
          <div class="form-group">
            <label>Título</label>
            <input
              v-model="editingMedia.title"
              type="text"
              required
            >
          </div>
          <div class="form-group">
            <label>URL (Imagem ou Vídeo)</label>
            <input
              v-model="editingMedia.url"
              type="url"
              required
              placeholder="https://... (suporta YouTube, Vimeo, MP4, imagens)"
            >
          </div>
          <div class="form-group">
            <label>Duração (segundos)</label>
            <input
              v-model.number="editingMedia.duration"
              type="number"
              min="1"
              required
            >
          </div>
          <div class="form-group">
            <label>
              <input
                v-model="editingMedia.active"
                type="checkbox"
              >
              Ativo
            </label>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="cancelEdit"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMediaStore } from '@/stores/mediaStore'
import type { Media } from '@/types'

const mediaStore = useMediaStore()

const showCreateModal = ref(false)
const editingMedia = ref<Media | null>(null)
const isSaving = ref(false)

const newMedia = ref({
  title: '',
  url: '',
  duration: 5,
  active: true
})

// CORREÇÃO 3: Filtrar mídias ativas e inativas
const activeMedia = computed(() => 
  mediaStore.mediaItems.filter(m => m.active)
)

const inactiveMedia = computed(() => 
  mediaStore.mediaItems.filter(m => !m.active)
)

function isYouTubeOrVimeo(url: string): boolean {
  return url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo')
}

function getVideoSource(url: string): string {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube'
  if (url.includes('vimeo')) return 'Vimeo'
  return 'Vídeo'
}

async function createMedia(): Promise<void> {
  try {
    await mediaStore.createMedia(newMedia.value)
    showCreateModal.value = false
    newMedia.value = {
      title: '',
      url: '',
      duration: 5,
      active: true
    }
  } catch (error) {
    console.error('Erro ao criar mídia:', error)
    alert('Erro ao criar mídia. Tente novamente.')
  }
}

function editMedia(media: Media): void {
  editingMedia.value = { ...media }
}

function cancelEdit(): void {
  editingMedia.value = null
  isSaving.value = false
}

async function updateMedia(): Promise<void> {
  if (!editingMedia.value || isSaving.value) return

  isSaving.value = true
  try {
    await mediaStore.updateMedia(editingMedia.value.id, {
      title: editingMedia.value.title,
      url: editingMedia.value.url,
      duration: editingMedia.value.duration,
      active: editingMedia.value.active
    })
    cancelEdit()
  } catch (error) {
    console.error('Erro ao atualizar mídia:', error)
    alert('Erro ao atualizar mídia. Tente novamente.')
  } finally {
    isSaving.value = false
  }
}

async function toggleActive(media: Media): Promise<void> {
  try {
    await mediaStore.updateMedia(media.id, { active: !media.active })
  } catch (error) {
    console.error('Erro ao atualizar mídia:', error)
    alert('Erro ao atualizar mídia. Tente novamente.')
  }
}

function confirmDelete(media: Media): void {
  if (confirm(`Deseja realmente excluir a mídia ${media.title}?`)) {
    mediaStore.deleteMedia(media.id)
  }
}
</script>

<style scoped>
.media-management {
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.media-section {
  margin-bottom: 50px;
}

.inactive-section {
  opacity: 0.7;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  padding: 15px 20px;
  border-radius: 10px;
}

.active-title {
  background: #d4edda;
  color: #155724;
}

.inactive-title {
  background: #f8d7da;
  color: #721c24;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.media-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 3px solid transparent;
}

.media-card.active {
  border-color: #27ae60;
}

.media-card.inactive {
  border-color: #e74c3c;
  opacity: 0.6;
}

.media-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.media-preview {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f0f0f0;
}

.media-preview img,
.media-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #7f8c8d;
  background: #ecf0f1;
}

.media-info {
  padding: 20px;
}

.media-info h4 {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.media-duration,
.media-type {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.media-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 18px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 80px;
  font-size: 14px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f7fa;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #e0e5ec;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="url"] {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.form-group input[type="checkbox"] {
  margin-right: 8px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}
</style>