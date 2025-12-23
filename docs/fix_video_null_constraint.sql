-- Permitir NULL na coluna image_url (para vídeos)
ALTER TABLE app_8c186_media 
ALTER COLUMN image_url DROP NOT NULL;

-- Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'app_8c186_media'
ORDER BY ordinal_position;
