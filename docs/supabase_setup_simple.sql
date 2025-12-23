-- ============================================
-- CONFIGURAÇÃO SIMPLIFICADA DO SUPABASE
-- (SEM STORAGE - USAR URLs EXTERNAS)
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. ADICIONAR CAMPO logo_url NA TABELA DE PRODUTOS
-- ============================================
ALTER TABLE app_8c186_products 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. ADICIONAR CAMPO store_name NA TABELA DE CONFIGURAÇÕES
-- ============================================
ALTER TABLE app_8c186_tv_settings 
ADD COLUMN IF NOT EXISTS store_name TEXT;

-- 3. DESABILITAR RLS NA TABELA admin_users (para resolver o problema de login)
-- ============================================
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se tudo foi criado corretamente:

-- Verificar campos adicionados
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_8c186_products' AND column_name = 'logo_url';

-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'app_8c186_tv_settings' AND column_name = 'store_name';

-- ============================================
-- INSTRUÇÕES PARA UPLOAD DE IMAGENS/VÍDEOS
-- ============================================
-- Como você não tem o Supabase Storage habilitado, use URLs externas:
--
-- OPÇÕES GRATUITAS PARA HOSPEDAR IMAGENS:
-- 1. Imgur (https://imgur.com) - Upload gratuito de imagens
-- 2. Cloudinary (https://cloudinary.com) - Plano gratuito generoso
-- 3. ImgBB (https://imgbb.com) - Upload simples e rápido
-- 4. Postimages (https://postimages.org) - Sem cadastro necessário
--
-- OPÇÕES PARA HOSPEDAR VÍDEOS:
-- 1. YouTube (https://youtube.com) - Use o link direto do vídeo
-- 2. Vimeo (https://vimeo.com) - Qualidade profissional
-- 3. Streamable (https://streamable.com) - Upload rápido
--
-- COMO USAR:
-- 1. Faça upload da imagem/vídeo em um desses serviços
-- 2. Copie a URL direta do arquivo
-- 3. Cole a URL no campo "URL da Imagem" ou "URL do Vídeo" no painel admin
--
-- EXEMPLO DE URL:
-- /images/ImageUpload.jpg
-- https://res.cloudinary.com/demo/image/upload/sample.jpg
-- https://www.youtube.com/watch?v=dQw4w9WgXcQ