-- Adicionar campo products_background_color na tabela app_8c186_tv_settings
-- Este campo permite configurar a cor de fundo da tela de produtos

BEGIN;

-- Adicionar coluna se não existir
ALTER TABLE app_8c186_tv_settings 
ADD COLUMN IF NOT EXISTS products_background_color TEXT;

-- Comentário explicativo
COMMENT ON COLUMN app_8c186_tv_settings.products_background_color IS 
'Cor de fundo da tela de produtos. Pode ser: cor sólida (#667eea), gradiente (linear-gradient(135deg, #667eea 0%, #764ba2 100%)), ou imagem (url(https://...))';

COMMIT;