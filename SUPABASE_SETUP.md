# Configuração do Supabase - Amo Indoor

Este documento contém todas as instruções para configurar o backend Supabase para a plataforma Amo Indoor.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - Project URL
   - Anon/Public Key
   - Service Role Key (mantenha seguro!)

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_API_BEARER_TOKEN=seu-token-secreto-para-webhook
```

## 3. Criar Tabelas no Banco de Dados

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- ============================================
-- TABELAS
-- ============================================

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

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_devices_code ON app_8c186_devices(code);
CREATE INDEX idx_devices_online ON app_8c186_devices(is_online);
CREATE INDEX idx_orders_status ON app_8c186_orders(status);
CREATE INDEX idx_orders_created ON app_8c186_orders(created_at DESC);
CREATE INDEX idx_products_active ON app_8c186_products(active, order_index);
CREATE INDEX idx_media_active ON app_8c186_media(active, order_index);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE app_8c186_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_device_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_media ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (ajuste conforme necessário para produção)
CREATE POLICY "Allow public access" ON app_8c186_devices FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_device_settings FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_orders FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_products FOR ALL USING (true);
CREATE POLICY "Allow public access" ON app_8c186_media FOR ALL USING (true);

-- ============================================
-- REALTIME
-- ============================================

-- Habilitar Realtime para a tabela de pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE app_8c186_orders;
```

## 4. Criar Edge Function para Webhook

### 4.1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 4.2. Fazer Login

```bash
supabase login
```

### 4.3. Criar a Edge Function

Crie o arquivo `supabase/functions/app_8c186_webhook_orders/index.ts`:

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  const requestId = crypto.randomUUID()
  console.log(`[${requestId}] Webhook request received`, {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries())
  })

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    const expectedToken = Deno.env.get('API_BEARER_TOKEN')

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.error(`[${requestId}] Unauthorized request`)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    // Parse do payload
    let payload
    try {
      payload = await req.json()
      console.log(`[${requestId}] Payload received:`, payload)
    } catch (error) {
      console.error(`[${requestId}] Invalid JSON:`, error)
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Validar campos obrigatórios
    if (!payload.order_number || !payload.customer_name || !payload.status) {
      console.error(`[${requestId}] Missing required fields`)
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Mapear status
    const statusMap: Record<string, string> = {
      'READY': 'READY',
      'PREPARING': 'PREPARING',
      'PENDING': 'PENDING',
      'DELIVERED': 'DELIVERED'
    }

    const status = statusMap[payload.status] || 'PENDING'

    // Inserir ou atualizar pedido
    const { data, error } = await supabase
      .from('app_8c186_orders')
      .upsert({
        order_number: payload.order_number,
        customer_name: payload.customer_name,
        status: status,
        store_id: payload.store_id || '',
        kitchen_id: payload.kitchen_id || '',
        channel: payload.channel || 'local',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_number'
      })
      .select()

    if (error) {
      console.error(`[${requestId}] Database error:`, error)
      throw error
    }

    console.log(`[${requestId}] Order processed successfully:`, data)

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      request_id: requestId 
    }), {
      status: 200,
      headers: corsHeaders
    })
  } catch (error) {
    console.error(`[${requestId}] Error:`, error)
    return new Response(JSON.stringify({ 
      error: error.message,
      request_id: requestId 
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
})
```

### 4.4. Deploy da Edge Function

```bash
supabase functions deploy app_8c186_webhook_orders --project-ref seu-project-ref
```

### 4.5. Configurar Variáveis de Ambiente da Edge Function

No painel do Supabase, vá em Edge Functions > app_8c186_webhook_orders > Settings e adicione:

```
API_BEARER_TOKEN=seu-token-secreto
```

## 5. Testar a Configuração

### 5.1. Testar Webhook

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/app_8c186_webhook_orders \
  -H "Authorization: Bearer seu-token-secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "001",
    "customer_name": "João Silva",
    "status": "READY",
    "store_id": "store-1",
    "kitchen_id": "kitchen-1",
    "channel": "local"
  }'
```

### 5.2. Verificar no Banco

Execute no SQL Editor:

```sql
SELECT * FROM app_8c186_orders;
```

## 6. Dados de Exemplo (Opcional)

Para popular o banco com dados de teste:

```sql
-- Inserir produtos de exemplo
INSERT INTO app_8c186_products (name, price, image_url, active, order_index) VALUES
('Pizza Margherita', 35.90, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002', true, 1),
('Hambúrguer Artesanal', 28.50, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', true, 2),
('Suco Natural', 12.00, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba', true, 3);

-- Inserir mídia de exemplo
INSERT INTO app_8c186_media (title, image_url, duration, active, order_index) VALUES
('Promoção de Verão', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da', 8, true, 1),
('Novo Cardápio', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', 10, true, 2);
```

## 7. Segurança em Produção

Para produção, considere:

1. **Restringir políticas RLS**: Ajuste as políticas para permitir apenas operações específicas
2. **Usar autenticação**: Implemente autenticação para o painel admin
3. **Rate limiting**: Configure rate limiting nas Edge Functions
4. **HTTPS**: Use sempre HTTPS em produção
5. **Rotação de tokens**: Rotacione o Bearer Token periodicamente

## 8. Monitoramento

- Acesse Supabase Dashboard > Database > Logs para ver logs das queries
- Acesse Edge Functions > Logs para ver logs da função webhook
- Configure alertas para erros críticos

## Suporte

Para problemas, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)