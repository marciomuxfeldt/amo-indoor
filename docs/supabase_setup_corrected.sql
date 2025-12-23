-- ============================================
-- CONFIGURAÇÃO CORRIGIDA DO SUPABASE
-- (COM NOMES DE TABELAS CORRETOS)
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. CRIAR TABELAS COM O APP_ID CORRETO (606d387553)
-- ============================================

-- Tabela de Dispositivos
CREATE TABLE IF NOT EXISTS app_606d387553_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    layout_type TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Configurações dos Dispositivos
CREATE TABLE IF NOT EXISTS app_606d387553_device_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES app_606d387553_devices(id) ON DELETE CASCADE,
    orders_percentage INTEGER DEFAULT 70,
    media_percentage INTEGER DEFAULT 20,
    products_percentage INTEGER DEFAULT 10,
    show_full_name BOOLEAN DEFAULT false,
    auto_rotate_interval INTEGER DEFAULT 10,
    primary_color TEXT DEFAULT '#3b82f6',
    logo_url TEXT,
    store_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS app_606d387553_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Mídia
CREATE TABLE IF NOT EXISTS app_606d387553_media (
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

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS app_606d387553_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devices_code ON app_606d387553_devices(code);
CREATE INDEX IF NOT EXISTS idx_device_settings_device_id ON app_606d387553_device_settings(device_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON app_606d387553_products(is_active);
CREATE INDEX IF NOT EXISTS idx_media_active ON app_606d387553_media(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON app_606d387553_orders(status);

-- 3. DESABILITAR RLS (Row Level Security) PARA TODAS AS TABELAS
-- ============================================

ALTER TABLE app_606d387553_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_606d387553_device_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_606d387553_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_606d387553_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_606d387553_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se tudo foi criado corretamente:

-- Listar todas as tabelas criadas
-- SELECT tablename FROM pg_tables WHERE tablename LIKE 'app_606d387553_%';

-- Verificar estrutura da tabela de produtos
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_606d387553_products';

-- Verificar estrutura da tabela de mídia
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_606d387553_media';

-- Verificar RLS desabilitado
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE 'app_606d387553_%';