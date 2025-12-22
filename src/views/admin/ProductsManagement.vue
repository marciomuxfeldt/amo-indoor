<template>
  <div class="products-management">
    <div class="page-header">
      <h2>Gerenciamento de Produtos em Destaque</h2>
      <button
        class="btn-primary"
        @click="showCreateDialog = true"
      >
        <span class="icon">+</span>
        Novo Produto
      </button>
    </div>

    <div class="info-box">
      <h3>📐 Tamanhos Recomendados</h3>
      <ul>
        <li><strong>Imagem do Produto:</strong> 800x800 pixels (quadrado 1:1)</li>
        <li><strong>Logo do Restaurante:</strong> 200x200 pixels (PNG sem fundo)</li>
      </ul>
      <h3 style="margin-top: 15px;">
        🌐 Como Adicionar Imagens
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
      <p>❌ Erro ao carregar produtos: {{ mediaStore.error }}</p>
      <button
        class="btn-primary"
        @click="reloadProducts"
      >
        Tentar Novamente
      </button>
    </div>

    <div
      v-else-if="mediaStore.products.length === 0"
      class="empty-state"
    >
      <p>Nenhum produto cadastrado</p>
    </div>

    <div
      v-else
      class="products-grid"
    >
      <div
        v-for="product in mediaStore.products"
        :key="product.id"
        class="product-card"
      >
        <div class="product-preview">
          <img
            :src="product.image_url"
            :alt="product.name"
            class="product-image"
            @error="handleImageError"
          >
          <img
            v-if="product.logo_url"
            :src="product.logo_url"
            alt="Logo"
            class="product-logo"
            @error="handleLogoError"
          >
        </div>
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="product-price">
            R$ {{ formatPrice(product.price) }}
          </p>
          <div class="product-status">
            <span
              class="status-badge"
              :class="{ active: product.active }"
            >
              {{ product.active ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
        </div>
        <div class="product-actions">
          <button
            class="btn-secondary"
            @click="editProduct(product)"
          >
            Editar
          </button>
          <button
            class="btn-danger"
            @click="confirmDelete(product)"
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
        <h3>{{ showEditDialog ? 'Editar Produto' : 'Novo Produto' }}</h3>
        <form @submit.prevent="saveProduct">
          <div class="form-group">
            <label>Nome do Produto</label>
            <input
              v-model="formData.name"
              type="text"
              required
            >
          </div>

          <div class="form-group">
            <label>Preço (R$)</label>
            <input
              v-model.number="formData.price"
              type="number"
              step="0.01"
              min="0"
              required
            >
          </div>

          <div class="form-group">
            <label>URL da Imagem do Produto</label>
            <input
              v-model="formData.image_url"
              type="url"
              placeholder="/images/photo1766156811.jpg"
              required
            >
            <p class="help-text">
              Cole a URL direta da imagem. Tamanho recomendado: 800x800 pixels (1:1)
            </p>
            <p class="help-text">
              <strong>Serviços gratuitos:</strong> Imgur, Cloudinary, ImgBB, Postimages
            </p>
            <img
              v-if="formData.image_url"
              :src="formData.image_url"
              alt="Preview"
              class="image-preview"
              @error="() => {}"
            >
          </div>

          <div class="form-group">
            <label>URL do Logo do Restaurante (opcional)</label>
            <input
              v-model="formData.logo_url"
              type="url"
              placeholder="/images/photo1766156811.jpg"
            >
            <p class="help-text">
              Cole a URL direta do logo. Tamanho recomendado: 200x200 pixels (PNG sem fundo)
            </p>
            <img
              v-if="formData.logo_url"
              :src="formData.logo_url"
              alt="Logo Preview"
              class="logo-preview"
              @error="() => {}"
            >
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
        <p>Tem certeza que deseja excluir este produto?</p>
        <div class="form-actions">
          <button
            class="btn-secondary"
            @click="showDeleteDialog = false"
          >
            Cancelar
          </button>
          <button
            class="btn-danger"
            @click="deleteProduct"
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
import type { Product } from '@/types'

const mediaStore = useMediaStore()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedProduct = ref<Product | null>(null)
const saving = ref(false)

const formData = reactive({
  name: '',
  price: 0,
  image_url: '',
  logo_url: '',
  active: true
})

// Load data on mount
onMounted(async () => {
  console.log('🍽️ [ProductsManagement] Componente montado, carregando produtos...')
  await reloadProducts()
})

async function reloadProducts(): Promise<void> {
  try {
    await mediaStore.fetchProducts()
    console.log('✅ [ProductsManagement] Produtos carregados:', {
      total: mediaStore.products.length,
      items: mediaStore.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        active: p.active
      }))
    })
  } catch (error) {
    console.error('❌ [ProductsManagement] Erro ao carregar produtos:', error)
  }
}

function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',')
}

function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement
  console.error('❌ Erro ao carregar imagem do produto:', img.src)
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagem indisponível%3C/text%3E%3C/svg%3E'
}

function handleLogoError(event: Event): void {
  const img = event.target as HTMLImageElement
  console.error('❌ Erro ao carregar logo:', img.src)
  img.style.display = 'none'
}

function resetForm(): void {
  formData.name = ''
  formData.price = 0
  formData.image_url = ''
  formData.logo_url = ''
  formData.active = true
}

function closeDialogs(): void {
  showCreateDialog.value = false
  showEditDialog.value = false
  resetForm()
  selectedProduct.value = null
}

function editProduct(product: Product): void {
  selectedProduct.value = product
  formData.name = product.name
  formData.price = product.price
  formData.image_url = product.image_url
  formData.logo_url = product.logo_url || ''
  formData.active = product.active ?? true
  showEditDialog.value = true
}

function confirmDelete(product: Product): void {
  selectedProduct.value = product
  showDeleteDialog.value = true
}

async function saveProduct(): Promise<void> {
  if (saving.value) return
  
  saving.value = true
  try {
    console.log('💾 [ProductsManagement] Salvando produto:', formData)
    
    if (showEditDialog.value && selectedProduct.value) {
      // Editar produto existente
      await mediaStore.updateProduct(selectedProduct.value.id, {
        name: formData.name,
        price: formData.price,
        image_url: formData.image_url,
        logo_url: formData.logo_url,
        active: formData.active
      })
      console.log('✅ [ProductsManagement] Produto atualizado com sucesso')
    } else {
      // Criar novo produto
      await mediaStore.createProduct({
        name: formData.name,
        price: formData.price,
        image_url: formData.image_url,
        logo_url: formData.logo_url,
        active: formData.active
      })
      console.log('✅ [ProductsManagement] Produto criado com sucesso')
    }
    closeDialogs()
  } catch (error) {
    console.error('❌ [ProductsManagement] Erro ao salvar produto:', error)
    alert(`Erro ao salvar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  } finally {
    saving.value = false
  }
}

async function deleteProduct(): Promise<void> {
  if (!selectedProduct.value) return
  
  try {
    console.log('🗑️ [ProductsManagement] Deletando produto:', selectedProduct.value.id)
    await mediaStore.deleteProduct(selectedProduct.value.id)
    console.log('✅ [ProductsManagement] Produto deletado com sucesso')
    showDeleteDialog.value = false
    selectedProduct.value = null
  } catch (error) {
    console.error('❌ [ProductsManagement] Erro ao excluir produto:', error)
    alert(`Erro ao excluir produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}
</script>

<style scoped>
.products-management {
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.product-preview {
  width: 100%;
  height: 250px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-logo {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 60px;
  height: 60px;
  object-fit: contain;
  background: white;
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.product-info {
  padding: 20px;
}

.product-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #2c3e50;
}

.product-price {
  font-size: 24px;
  font-weight: 700;
  color: #27ae60;
  margin: 10px 0;
}

.product-status {
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

.product-actions {
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
  max-width: 600px;
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
.form-group input[type="number"] {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.help-text {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
}

.image-preview,
.logo-preview {
  margin-top: 15px;
  max-width: 200px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.logo-preview {
  max-width: 100px;
  background: #f5f5f5;
  padding: 10px;
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