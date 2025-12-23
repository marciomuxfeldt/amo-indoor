-- Desabilitar RLS em todas as tabelas
ALTER TABLE app_8c186_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_device_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_8c186_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "allow_all" ON app_8c186_devices;
DROP POLICY IF EXISTS "allow_all" ON app_8c186_device_settings;
DROP POLICY IF EXISTS "allow_all" ON app_8c186_products;
DROP POLICY IF EXISTS "allow_all" ON app_8c186_media;
DROP POLICY IF EXISTS "allow_all" ON app_8c186_orders;
DROP POLICY IF EXISTS "allow_all" ON admin_users;

-- Verificar estrutura da tabela app_8c186_media
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'app_8c186_media'
ORDER BY ordinal_position;

-- Testar inserção manual
INSERT INTO app_8c186_media (title, type, url, duration, is_active, order_index)
VALUES ('Teste Manual', 'image', 'https://i.imgur.com/test.jpg', 5, true, 0)
RETURNING *;
