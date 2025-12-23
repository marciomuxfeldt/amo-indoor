-- ============================================
-- FIX: Desabilitar RLS temporariamente para produtos
-- ============================================

-- Passo 1: Verificar políticas atuais
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'app_8c186_products';

-- Passo 2: Desabilitar RLS temporariamente (TESTE)
ALTER TABLE app_8c186_products DISABLE ROW LEVEL SECURITY;

-- Passo 3: Verificar se RLS está desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'app_8c186_products';

-- ============================================
-- APÓS TESTAR E CONFIRMAR QUE FUNCIONA:
-- Habilitar RLS novamente com políticas corretas
-- ============================================

-- Passo 4: Habilitar RLS novamente
-- ALTER TABLE app_8c186_products ENABLE ROW LEVEL SECURITY;

-- Passo 5: Criar políticas para permitir todas as operações
-- (Descomente as linhas abaixo após confirmar que o problema é RLS)

-- DROP POLICY IF EXISTS "allow_all_products" ON app_8c186_products;
-- CREATE POLICY "allow_all_products" ON app_8c186_products
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- ============================================
-- NOTA: Esta política permite acesso total.
-- Para produção, você deve criar políticas mais restritivas
-- baseadas em autenticação de usuário.
-- ============================================