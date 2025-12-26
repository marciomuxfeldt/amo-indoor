<template>
  <div class="product-management">
    <div class="section-header">
      <h2>Produtos em Destaque</h2>
      <button
        class="btn-primary"
        @click="showCreateModal = true"
      >
        + Novo Produto
      </button>
    </div>

    <!-- CORREÇÃO 3 e 4: Separar ativos e inativos -->
    <div class="products-section">
      <h3 class="section-title active-title">
        ✅ Produtos Ativos
      </h3>
      <div class="products-grid">
        <div
          v-for="product in activeProducts"
          :key="product.id"
          class="product-card active"
        >
          <div class="product-image">
            <img
              :src="product.image_url"
              :alt="product.name"
            >
            <img
              v-if="product.logo_url"
              :src="product.logo_url"
              alt="Logo"
              class="product-logo"
            >
          </div>
          <div class="product-info">
            <h4>{{ product.name }}</h4>
            <p class="product-price">
              R$ {{ formatPrice(product.price) }}
            </p>
            <div class="product-actions">
              <button
                class="btn-secondary"
                @click="editProduct(product)"
              >
                ✏️ Editar
              </button>
              <button
                class="btn-secondary"
                @click="toggleActive(product)"
              >
                Desativar
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
        <div
          v-if="activeProducts.length === 0"
          class="empty-state"
        >
          <p>Nenhum produto ativo</p>
        </div>
      </div>
    </div>

    <div class="products-section inactive-section">
      <h3 class="section-title inactive-title">
        ⏸️ Produtos Inativos
      </h3>
      <div class="products-grid">
        <div
          v-for="product in inactiveProducts"
          :key="product.id"
          class="product-card inactive"
        >
          <div class="product-image">
            <img
              :src="product.image_url"
              :alt="product.name"
            >
            <img
              v-if="product.logo_url"
              :src="product.logo_url"
              alt="Logo"
              class="product-logo"
            >
          </div>
          <div class="product-info">
            <h4>{{ product.name }}</h4>
            <p class="product-price">
              R$ {{ formatPrice(product.price) }}
            </p>
            <div class="product-actions">
              <button
                class="btn-secondary"
                @click="editProduct(product)"
              >
                ✏️ Editar
              </button>
              <button
                class="btn-secondary"
                @click="toggleActive(product)"
              >
                Ativar
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
        <div
          v-if="inactiveProducts.length === 0"
          class="empty-state"
        >
          <p>Nenhum produto inativo</p>
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
        <h3>Novo Produto</h3>
        <form @submit.prevent="createProduct">
          <div class="form-group">
            <label>Nome do Produto</label>
            <input
              v-model="newProduct.name"
              type="text"
              required
            >
          </div>
          <div class="form-group">
            <label>Preço (R$)</label>
            <input
              v-model.number="newProduct.price"
              type="number"
              step="0.01"
              min="0"
              required
            >
          </div>
          <div class="form-group">
            <label>URL da Imagem</label>
            <input
              v-model="newProduct.image_url"
              type="url"
              required
            >
          </div>
          <div class="form-group">
            <label>URL do Logo (opcional)</label>
            <input
              v-model="newProduct.logo_url"
              type="url"
            >
          </div>
          <div class="form-group">
            <label>
              <input
                v-model="newProduct.active"
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
      v-if="editingProduct"
      class="modal"
      @click.self="cancelEdit"
    >
      <div class="modal-content">
        <h3>Editar Produto</h3>
        <form @submit.prevent="updateProduct">
          <div class="form-group">
            <label>Nome do Produto</label>
            <input
              v-model="editingProduct.name"
              type="text"
              required
            >
          </div>
          <div class="form-group">
            <label>Preço (R$)</label>
            <input
              v-model.number="editingProduct.price"
              type="number"
              step="0.01"
              min="0"
              required
            >
          </div>
          <div class="form-group">
            <label>URL da Imagem</label>
            <input
              v-model="editingProduct.image_url"
              type="url"
              required
            >
          </div>
          <div class="form-group">
            <label>URL do Logo (opcional)</label>
            <input
              v-model="editingProduct.logo_url"
              type="url"
            >
          </div>
          <div class="form-group">
            <label>
              <input
                v-model="editingProduct.active"
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
import type { Product } from '@/types'

const mediaStore = useMediaStore()

const showCreateModal = ref(false)
const editingProduct = ref<Product | null>(null)
const isSaving = ref(false)

const newProduct = ref({
  name: '',
  price: 0,
  image_url: '',
  logo_url: '',
  active: true
})

// CORREÇÃO 3: Filtrar produtos ativos e inativos
const activeProducts = computed(() => 
  mediaStore.products.filter(p => p.active)
)

const inactiveProducts = computed(() => 
  mediaStore.products.filter(p => !p.active)
)

function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',')
}

async function createProduct(): Promise<void> {
  try {
    await mediaStore.createProduct(newProduct.value)
    showCreateModal.value = false
    newProduct.value = {
      name: '',
      price: 0,
      image_url: '',
      logo_url: '',
      active: true
    }
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    alert('Erro ao criar produto. Tente novamente.')
  }
}

function editProduct(product: Product): void {
  editingProduct.value = { ...product }
}

function cancelEdit(): void {
  editingProduct.value = null
  isSaving.value = false
}

async function updateProduct(): Promise<void> {
  if (!editingProduct.value || isSaving.value) return

  isSaving.value = true
  try {
    await mediaStore.updateProduct(editingProduct.value.id, {
      name: editingProduct.value.name,
      price: editingProduct.value.price,
      image_url: editingProduct.value.image_url,
      logo_url: editingProduct.value.logo_url,
      active: editingProduct.value.active
    })
    cancelEdit()
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    alert('Erro ao atualizar produto. Tente novamente.')
  } finally {
    isSaving.value = false
  }
}

async function toggleActive(product: Product): Promise<void> {
  try {
    await mediaStore.updateProduct(product.id, { active: !product.active })
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    alert('Erro ao atualizar produto. Tente novamente.')
  }
}

function confirmDelete(product: Product): void {
  if (confirm(`Deseja realmente excluir o produto ${product.name}?`)) {
    mediaStore.deleteProduct(product.id)
  }
}
</script>

<style scoped>
.product-management {
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

.products-section {
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.product-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 3px solid transparent;
}

.product-card.active {
  border-color: #27ae60;
}

.product-card.inactive {
  border-color: #e74c3c;
  opacity: 0.6;
}

.product-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-logo {
  position: absolute !important;
  bottom: 10px;
  right: 10px;
  width: 60px !important;
  height: 60px !important;
  object-fit: contain !important;
  background: white;
  border-radius: 10px;
  padding: 8px;
}

.product-info {
  padding: 20px;
}

.product-info h4 {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.product-price {
  font-size: 24px;
  font-weight: 700;
  color: #27ae60;
  margin-bottom: 20px;
}

.product-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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