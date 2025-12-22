# Amo Indoor - Sistema de Chamador de Pedidos para TVs

Sistema completo de exibição de pedidos em TVs Samsung (modo kiosk) com painel administrativo web.

## 🚀 Funcionalidades

### Tela de TV (`/tv`)
- Exibição de pedidos com status "PRONTO PARA RETIRADA"
- Carrossel de produtos em destaque
- Player de imagens publicitárias
- Alternância inteligente de conteúdo (prioridade para pedidos prontos)
- Som e animação ao novo pedido pronto
- Fullscreen automático
- Cache offline (IndexedDB)
- Watchdog para auto-reload
- Heartbeat periódico
- Tela de reconexão

### Painel Administrativo (`/admin`)
- Cadastro e gerenciamento de TVs
- Pareamento via QR Code
- CRUD de pedidos (modo teste)
- CRUD de produtos em destaque
- CRUD de mídia publicitária
- Monitor em tempo real das TVs
- Configuração de layout por TV
- Configuração de proporção de conteúdo
- Privacidade configurável (nome mascarado)

## 🛠️ Tecnologias

- **Vue 3** com Composition API (`<script setup>`)
- **TypeScript** para type safety
- **Vite** para build rápido
- **Pinia** para gerenciamento de estado
- **Vue Router** para navegação
- **Supabase** para backend (Auth, Database, Real-time)
- **IndexedDB** para cache offline

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase
```

## 🗄️ Configuração do Supabase

### 1. Criar Tabelas

Execute os seguintes comandos SQL no Supabase SQL Editor:

```sql
-- Tabela de Dispositivos (TVs)
CREATE TABLE app_8c186_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_online BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  layout_type VARCHAR(50) DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações de Dispositivos
CREATE TABLE app_8c186_device_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES app_8c186_devices(id) ON DELETE CASCADE,
  orders_percentage INTEGER DEFAULT 70,
  media_percentage INTEGER DEFAULT 20,
  products_percentage INTEGER DEFAULT 10,
  show_full_name BOOLEAN DEFAULT false,
  auto_rotate_interval INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos
CREATE TABLE app_8c186_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  store_id VARCHAR(255),
  kitchen_id VARCHAR(255),
  channel VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE app_8c186_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mídia
CREATE TABLE app_8c186_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  duration INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE app_8c186_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_device_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_media ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público
CREATE POLICY "Allow public access" ON app_8c186_devices FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_device_settings FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_orders FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_products FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_media FOR ALL USING (true);
```

### 2. Criar Edge Function para Webhook

Crie uma Edge Function chamada `app_8c186_webhook_orders`:

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      }
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const expectedToken = Deno.env.get('API_BEARER_TOKEN')

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const payload = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const statusMap: Record<string, string> = {
      'READY': 'READY',
      'PREPARING': 'PREPARING',
      'PENDING': 'PENDING',
      'DELIVERED': 'DELIVERED'
    }

    const status = statusMap[payload.status] || 'PENDING'

    const { data, error } = await supabase
      .from('app_8c186_orders')
      .upsert({
        order_number: payload.order_number,
        customer_name: payload.customer_name,
        status: status,
        store_id: payload.store_id,
        kitchen_id: payload.kitchen_id,
        channel: payload.channel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_number'
      })
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})
```

## 🚀 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm run dev

# Build para produção
pnpm run build

# Preview do build
pnpm run preview

# Lint do código
pnpm run lint
```

## 📱 Uso

### 1. Configurar TVs

1. Acesse `/admin/devices`
2. Clique em "+ Nova TV"
3. Preencha o nome e tipo de layout
4. Clique em "QR Code" para exibir o código de pareamento

### 2. Parear TV

1. Na TV, acesse `/tv/pairing`
2. Digite o código de 6 dígitos ou escaneie o QR Code
3. A TV será redirecionada automaticamente para `/tv`

### 3. Gerenciar Conteúdo

- **Pedidos**: Acesse `/admin/orders` para criar pedidos de teste
- **Produtos**: Acesse `/admin/products` para adicionar produtos em destaque
- **Mídia**: Acesse `/admin/media` para adicionar imagens publicitárias

### 4. Monitorar TVs

- Acesse `/admin/monitor` para visualizar todas as TVs em tempo real
- Veja status online/offline e configurações de cada TV

## 🔧 Configurações por TV

Cada TV pode ter configurações individuais:

- **Proporção de Conteúdo**: Ajuste a porcentagem de tempo para pedidos, produtos e mídia
- **Intervalo de Rotação**: Tempo em segundos entre cada mudança de conteúdo
- **Privacidade**: Mostrar nome completo ou mascarado dos clientes
- **Tipo de Layout**: Padrão, apenas pedidos ou apenas mídia

## 📡 Integração via API

### Webhook de Pedidos

Envie pedidos para a plataforma via webhook:

```bash
POST https://seu-projeto.supabase.co/functions/v1/app_8c186_webhook_orders
Authorization: Bearer SEU_TOKEN

{
  "order_number": "132",
  "customer_name": "Marcio Silva",
  "status": "READY",
  "store_id": "uuid",
  "kitchen_id": "uuid",
  "channel": "local",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Status Disponíveis

- `PENDING`: Pedido pendente
- `PREPARING`: Pedido em preparo
- `READY`: Pedido pronto para retirada (exibido na TV)
- `DELIVERED`: Pedido entregue (removido da TV)

## 🎨 Personalização

### Cores e Estilos

Edite os arquivos `.vue` em `src/components/` para personalizar:
- Cores do tema
- Tipografia
- Animações
- Layout

### Sons

Substitua o arquivo `public/assets/sounds/notification.mp3` por seu próprio som de notificação.

## 📦 Deploy

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte aplicações Vue/Vite:
- Netlify
- AWS Amplify
- Firebase Hosting
- GitHub Pages

## 🔒 Segurança

- Use variáveis de ambiente para credenciais
- Configure RLS (Row Level Security) no Supabase
- Use HTTPS em produção
- Proteja o Bearer Token da API

## 📄 Licença

Este projeto é proprietário e confidencial.

## 🤝 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.