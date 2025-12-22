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

    <div class="media-grid">
      <div
        v-for="media in mediaItems"
        :key="media.id"
        class="media-card"
      >
        <div class="media-image">
          <img
            :src="media.image_url"
            :alt="media.title"
          >
          <div
            class="media-status"
            :class="{ active: media.active }"
          >
            {{ media.active ? 'Ativo' : 'Inativo' }}
          </div>
        </div>
        <div class="media-info">
          <h3>{{ media.title }}</h3>
          <p class="media-duration">
            Duração: {{ media.duration }}s
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
              {{ media.active ? 'Desativar' : 'Ativar' }}
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
            <label>URL da Imagem</label>
            <input
              v-model="newMedia.image_url"
              type="url"
              required
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
            <label>URL da Imagem</label>
            <input
              v-model="editingMedia.image_url"
              type="url"
              required
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
  image_url: '',
  duration: 5,
  active: true
})

const mediaItems = computed(() => mediaStore.mediaItems)

async function createMedia(): Promise<void> {
  try {
    await mediaStore.createMedia(newMedia.value)
    showCreateModal.value = false
    newMedia.value = {
      title: '',
      image_url: '',
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
      image_url: editingMedia.value.image_url,
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
}

.media-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.media-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.media-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-status {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: #e74c3c;
  color: white;
}

.media-status.active {
  background: #27ae60;
}

.media-info {
  padding: 20px;
}

.media-info h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.media-duration {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 20px;
}

.media-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  min-width: 100px;
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