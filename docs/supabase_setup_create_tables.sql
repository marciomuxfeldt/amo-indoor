-- ============================================
-- CONFIGURAÇÃO COMPLETA DO SUPABASE
-- (CRIA TABELAS SE NÃO EXISTIREM)
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. CRIAR TABELA DE PRODUTOS (SE NÃO EXISTIR)
-- ============================================
CREATE TABLE IF NOT EXISTS app_8c186_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Adicionar campo logo_url se a tabela já existe mas o campo não
ALTER TABLE app_8c186_products 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. CRIAR TABELA DE MÍDIA (SE NÃO EXISTIR)
-- ============================================
CREATE TABLE IF NOT EXISTS app_8c186_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  duration INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CRIAR TABELA DE CONFIGURAÇÕES DA TV (SE NÃO EXISTIR)
-- ============================================
CREATE TABLE IF NOT EXISTS app_8c186_tv_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID,
  primary_color TEXT DEFAULT '#667eea',
  logo_url TEXT,
  store_name TEXT,
  orders_percentage INTEGER DEFAULT 70,
  products_percentage INTEGER DEFAULT 10,
  media_percentage INTEGER DEFAULT 20,
  auto_rotate_interval INTEGER DEFAULT 10,
  show_full_name BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Adicionar campo store_name se a tabela já existe mas o campo não
ALTER TABLE app_8c186_tv_settings 
ADD COLUMN IF NOT EXISTS store_name TEXT;

-- 4. CRIAR TABELA DE DISPOSITIVOS (SE NÃO EXISTIR)
-- ============================================
CREATE TABLE IF NOT EXISTS app_8c186_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  layout_type TEXT DEFAULT 'default' CHECK (layout_type IN ('default', 'orders-list', 'media-carousel', 'product-showcase')),
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. CRIAR TABELA DE PEDIDOS (SE NÃO EXISTIR)
-- ============================================
CREATE TABLE IF NOT EXISTS app_8c186_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PREPARING', 'READY', 'DELIVERED')),
  store_id TEXT,
  kitchen_id TEXT,
  channel TEXT DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_active ON app_8c186_products(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_media_active ON app_8c186_media(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_orders_status ON app_8c186_orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_devices_code ON app_8c186_devices(code);

-- 7. HABILITAR RLS (ROW LEVEL SECURITY)
-- ============================================
ALTER TABLE app_8c186_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_tv_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_orders ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR POLÍTICAS RLS (PERMITIR LEITURA PÚBLICA E ESCRITA AUTENTICADA)
-- ============================================

-- Produtos
DROP POLICY IF EXISTS "allow_public_read_products" ON app_8c186_products;
CREATE POLICY "allow_public_read_products" ON app_8c186_products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_authenticated_all_products" ON app_8c186_products;
CREATE POLICY "allow_authenticated_all_products" ON app_8c186_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Mídia
DROP POLICY IF EXISTS "allow_public_read_media" ON app_8c186_media;
CREATE POLICY "allow_public_read_media" ON app_8c186_media FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_authenticated_all_media" ON app_8c186_media;
CREATE POLICY "allow_authenticated_all_media" ON app_8c186_media FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Configurações
DROP POLICY IF EXISTS "allow_public_read_settings" ON app_8c186_tv_settings;
CREATE POLICY "allow_public_read_settings" ON app_8c186_tv_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_authenticated_all_settings" ON app_8c186_tv_settings;
CREATE POLICY "allow_authenticated_all_settings" ON app_8c186_tv_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dispositivos
DROP POLICY IF EXISTS "allow_public_read_devices" ON app_8c186_devices;
CREATE POLICY "allow_public_read_devices" ON app_8c186_devices FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_authenticated_all_devices" ON app_8c186_devices;
CREATE POLICY "allow_authenticated_all_devices" ON app_8c186_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pedidos
DROP POLICY IF EXISTS "allow_public_read_orders" ON app_8c186_orders;
CREATE POLICY "allow_public_read_orders" ON app_8c186_orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_authenticated_all_orders" ON app_8c186_orders;
CREATE POLICY "allow_authenticated_all_orders" ON app_8c186_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. DESABILITAR RLS NA TABELA admin_users (RESOLVER PROBLEMA DE LOGIN)
-- ============================================
ALTER TABLE IF EXISTS admin_users DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se tudo foi criado:

-- Listar todas as tabelas criadas
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'app_8c186_%' ORDER BY table_name;

-- Verificar colunas da tabela de produtos
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_8c186_products' ORDER BY ordinal_position;

-- Verificar colunas da tabela de configurações
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_8c186_tv_settings' ORDER BY ordinal_position;