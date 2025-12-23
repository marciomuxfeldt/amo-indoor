-- ============================================
-- CONFIGURAÇÃO DO SUPABASE PARA O SISTEMA DE TV
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. CRIAR STORAGE BUCKET PARA ARQUIVOS DE MÍDIA
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app_8c186_media_files',
  'app_8c186_media_files',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS RLS PARA O STORAGE BUCKET
-- ============================================

-- Permitir leitura pública
CREATE POLICY "allow_public_read_media_files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'app_8c186_media_files');

-- Permitir upload para usuários autenticados
CREATE POLICY "allow_authenticated_upload_media_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app_8c186_media_files');

-- Permitir atualização para usuários autenticados
CREATE POLICY "allow_authenticated_update_media_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'app_8c186_media_files')
WITH CHECK (bucket_id = 'app_8c186_media_files');

-- Permitir exclusão para usuários autenticados
CREATE POLICY "allow_authenticated_delete_media_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'app_8c186_media_files');

-- 3. ADICIONAR CAMPO logo_url NA TABELA DE PRODUTOS
-- ============================================
ALTER TABLE app_8c186_products 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 4. ADICIONAR CAMPO store_name NA TABELA DE CONFIGURAÇÕES
-- ============================================
ALTER TABLE app_8c186_tv_settings 
ADD COLUMN IF NOT EXISTS store_name TEXT;

-- 5. DESABILITAR RLS NA TABELA admin_users (para resolver o problema de login)
-- ============================================
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se tudo foi criado corretamente:

-- Verificar bucket criado
-- SELECT * FROM storage.buckets WHERE id = 'app_8c186_media_files';

-- Verificar políticas do storage
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%media_files%';

-- Verificar campos adicionados
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_8c186_products' AND column_name = 'logo_url';

-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_8c186_tv_settings' AND column_name = 'store_name';