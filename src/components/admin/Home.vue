<template>
  <div class="admin-home">
    <div class="welcome-section">
      <h2>Bem-vindo ao Amo Indoor</h2>
      <p>Sistema de gerenciamento de pedidos e mídia para TVs</p>
    </div>

    <div class="quick-actions">
      <div class="action-card">
        <div class="card-icon">
          🎯
        </div>
        <h3>Acesso Rápido</h3>
        <p>Visualize o painel administrativo completo</p>
        <router-link
          to="/admin/devices"
          class="action-button"
        >
          Acessar Painel Admin
        </router-link>
      </div>

      <div class="action-card">
        <div class="card-icon">
          📺
        </div>
        <h3>Tela de TV</h3>
        <p>Visualize como os pedidos aparecem na TV</p>
        <router-link
          to="/tv"
          class="action-button secondary"
        >
          Ver Tela de TV
        </router-link>
      </div>

      <div class="action-card">
        <div class="card-icon">
          🔗
        </div>
        <h3>Parear TV</h3>
        <p>Conecte uma nova TV ao sistema</p>
        <router-link
          to="/tv/pairing"
          class="action-button secondary"
        >
          Parear Dispositivo
        </router-link>
      </div>
    </div>

    <div class="info-section">
      <div class="info-card">
        <h3>📊 Status do Sistema</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">TVs Online:</span>
            <span class="info-value">{{ onlineDevices }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Pedidos Prontos:</span>
            <span class="info-value">{{ readyOrders }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Produtos Ativos:</span>
            <span class="info-value">{{ activeProducts }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Mídias Ativas:</span>
            <span class="info-value">{{ activeMedia }}</span>
          </div>
        </div>
      </div>

      <div class="info-card">
        <h3>📝 Recursos Disponíveis</h3>
        <ul class="features-list">
          <li>✅ Gerenciamento de TVs e dispositivos</li>
          <li>✅ Controle de pedidos em tempo real</li>
          <li>✅ Catálogo de produtos em destaque</li>
          <li>✅ Biblioteca de mídia publicitária</li>
          <li>✅ Monitor de status das TVs</li>
          <li>✅ Configurações personalizadas por TV</li>
        </ul>
      </div>
    </div>

    <div class="help-section">
      <div class="help-card">
        <h3>🚀 Primeiros Passos</h3>
        <ol class="steps-list">
          <li>
            <strong>Cadastre uma TV</strong> - Vá em "TVs" e clique em "Adicionar TV"
          </li>
          <li>
            <strong>Pareie o dispositivo</strong> - Use o código gerado para conectar a TV
          </li>
          <li>
            <strong>Configure produtos</strong> - Adicione produtos em destaque na aba "Produtos"
          </li>
          <li>
            <strong>Adicione mídia</strong> - Carregue imagens publicitárias na aba "Mídia"
          </li>
          <li>
            <strong>Gerencie pedidos</strong> - Crie e atualize pedidos na aba "Pedidos"
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOrdersStore } from '@/stores/ordersStore'
import { useMediaStore } from '@/stores/mediaStore'
import { useDevicesStore } from '@/stores/devicesStore'

const ordersStore = useOrdersStore()
const mediaStore = useMediaStore()
const devicesStore = useDevicesStore()

const onlineDevices = computed(() => devicesStore.onlineDevices.length)
const readyOrders = computed(() => ordersStore.readyOrders.length)
const activeProducts = computed(() => mediaStore.activeProducts.length)
const activeMedia = computed(() => mediaStore.activeMedia.length)
</script>

<style scoped>
.admin-home {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 50px;
}

.welcome-section h2 {
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
}

.welcome-section p {
  font-size: 18px;
  color: #7f8c8d;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.action-card {
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.action-card h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
}

.action-card p {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 25px;
  line-height: 1.6;
}

.action-button {
  display: inline-block;
  padding: 15px 35px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.action-button.secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-button.secondary:hover {
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.info-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.info-card h3 {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 25px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

.info-value {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
}

.features-list {
  list-style: none;
  padding: 0;
}

.features-list li {
  padding: 12px 0;
  font-size: 16px;
  color: #2c3e50;
  border-bottom: 1px solid #ecf0f1;
}

.features-list li:last-child {
  border-bottom: none;
}

.help-section {
  margin-bottom: 30px;
}

.help-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  padding: 40px;
  border-radius: 20px;
  border: 2px solid #667eea30;
}

.help-card h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 25px;
}

.steps-list {
  padding-left: 25px;
}

.steps-list li {
  padding: 15px 0;
  font-size: 16px;
  color: #2c3e50;
  line-height: 1.6;
}

.steps-list strong {
  color: #667eea;
  font-weight: 700;
}

@media (max-width: 768px) {
  .quick-actions,
  .info-section {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>