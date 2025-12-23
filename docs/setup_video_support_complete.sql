-- ============================================
-- SCRIPT COMPLETO PARA SUPORTE A VÍDEO
-- Execute este script no Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. Adicionar coluna video_url se não existir
ALTER TABLE app_8c186_media 
ADD COLUMN IF NOT EXISTS video_url text;

-- 2. Permitir NULL na coluna image_url (para vídeos)
ALTER TABLE app_8c186_media 
ALTER COLUMN image_url DROP NOT NULL;

-- 3. Verificar a estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'app_8c186_media'
ORDER BY ordinal_position;

COMMIT;

-- ============================================
-- Após executar este script, você poderá:
-- 1. Adicionar vídeos (YouTube, Vimeo, MP4)
-- 2. Adicionar imagens normalmente
-- 3. Ver todas as mídias cadastradas
-- ============================================
