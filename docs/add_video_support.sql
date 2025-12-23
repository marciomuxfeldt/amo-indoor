-- Adicionar coluna video_url na tabela app_8c186_media
ALTER TABLE app_8c186_media 
ADD COLUMN IF NOT EXISTS video_url text;

-- Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'app_8c186_media'
ORDER BY ordinal_position;
