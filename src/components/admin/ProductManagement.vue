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

    <div class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
      >
        <div class="product-image">
          <img
            :src="product.image_url"
            :alt="product.name"
          >
          <div
            class="product-status"
            :class="{ active: product.active }"
          >
            {{ product.active ? 'Ativo' : 'Inativo' }}
          </div>
        </div>
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="product-price">
            R$ {{ formatPrice(product.price) }}
          </p>
          <div class="product-actions">
            <button
              class="btn-edit"
              @click="editProduct(product)"
            >
              ✏️ Alterar
            </button>
            <button
              class="btn-secondary"
              @click="toggleActive(product)"
            >
              {{ product.active ? 'Desativar' : 'Ativar' }}
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
      @click.self="editingProduct = null"
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
              @click="editingProduct = null"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
            >
              Salvar
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

const newProduct = ref({
  name: '',
  price: 0,
  image_url: '',
  active: true
})

const products = computed(() => mediaStore.products)

function editProduct(product: Product): void {
  editingProduct.value = { ...product }
}

async function updateProduct(): Promise<void> {
  if (!editingProduct.value) return

  try {
    await mediaStore.updateProduct(editingProduct.value.id, {
      name: editingProduct.value.name,
      price: editingProduct.value.price,
      image_url: editingProduct.value.image_url,
      active: editingProduct.value.active
    })
    editingProduct.value = null
  } catch (error) {
    alert('Erro ao atualizar produto')
  }
}

async function createProduct(): Promise<void> {
  try {
    await mediaStore.createProduct(newProduct.value)
    showCreateModal.value = false
    newProduct.value = {
      name: '',
      price: 0,
      image_url: '',
      active: true
    }
  } catch (error) {
    alert('Erro ao criar produto')
  }
}

async function toggleActive(product: Product): Promise<void> {
  try {
    await mediaStore.updateProduct(product.id, { active: !product.active })
  } catch (error) {
    alert('Erro ao atualizar produto')
  }
}

function confirmDelete(product: Product): void {
  if (confirm(`Deseja realmente excluir o produto ${product.name}?`)) {
    mediaStore.deleteProduct(product.id)
  }
}

function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',')
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
}

.product-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.product-image {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-status {
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

.product-status.active {
  background: #27ae60;
}

.product-info {
  padding: 20px;
}

.product-info h3 {
  font-size: 20px;
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

.btn-primary,
.btn-secondary,
.btn-danger,
.btn-edit {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 80px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
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

.btn-edit {
  background: #3498db;
  color: white;
}

.btn-edit:hover {
  background: #2980b9;
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