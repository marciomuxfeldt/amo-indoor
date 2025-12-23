-- ============================================
-- CONFIGURAÇÃO FINAL DO SUPABASE
-- (BASEADO NAS TABELAS EXISTENTES)
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. ADICIONAR CAMPO logo_url NA TABELA DE PRODUTOS
-- ============================================
ALTER TABLE app_8c186_products 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. ADICIONAR CAMPO store_name NA TABELA DE CONFIGURAÇÕES DOS DISPOSITIVOS
-- ============================================
ALTER TABLE app_8c186_device_settings 
ADD COLUMN IF NOT EXISTS store_name TEXT;

-- 3. DESABILITAR RLS NA TABELA admin_users (RESOLVER PROBLEMA DE LOGIN)
-- ============================================
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se tudo foi criado corretamente:

-- Verificar campo logo_url adicionado
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_8c186_products' AND column_name = 'logo_url';

-- Verificar campo store_name adicionado
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_8c186_device_settings' AND column_name = 'store_name';

-- Verificar RLS desabilitado
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'admin_users';