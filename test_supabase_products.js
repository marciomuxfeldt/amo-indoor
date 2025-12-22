import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wslrbparafkoxahesnjj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbHJicGFyYWZrb3hhaGVzbmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTUwMTQsImV4cCI6MjA4MTU3MTAxNH0.kLseptoRCC00ol8jGksQIeKaCmFl3ZeIxJIAS79aDzU'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testando conexão com Supabase...\n')

// Test 1: Verificar se a tabela existe
console.log('📋 Teste 1: Listar produtos existentes')
try {
  const { data, error } = await supabase
    .from('app_8c186_products')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('❌ Erro ao listar produtos:', error)
  } else {
    console.log('✅ Produtos encontrados:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('📦 Estrutura do primeiro produto:', Object.keys(data[0]))
      console.log('📦 Dados:', JSON.stringify(data[0], null, 2))
    }
  }
} catch (err) {
  console.error('❌ Exceção ao listar:', err)
}

console.log('\n📝 Teste 2: Tentar inserir um produto de teste')
try {
  const testProduct = {
    name: 'Produto Teste',
    price: 10.00,
    image_url: 'https://via.placeholder.com/800',
    active: true,
    order_index: 999
  }
  
  console.log('📤 Enviando:', JSON.stringify(testProduct, null, 2))
  
  const startTime = Date.now()
  const { data, error } = await supabase
    .from('app_8c186_products')
    .insert([testProduct])
    .select()
    .single()
  
  const duration = Date.now() - startTime
  console.log(`⏱️ Tempo de resposta: ${duration}ms`)
  
  if (error) {
    console.error('❌ Erro ao inserir:', error)
    console.error('❌ Código:', error.code)
    console.error('❌ Mensagem:', error.message)
    console.error('❌ Detalhes:', error.details)
    console.error('❌ Hint:', error.hint)
  } else {
    console.log('✅ Produto inserido com sucesso!')
    console.log('📦 Dados retornados:', JSON.stringify(data, null, 2))
    
    // Limpar o produto de teste
    console.log('\n🧹 Limpando produto de teste...')
    const { error: deleteError } = await supabase
      .from('app_8c186_products')
      .delete()
      .eq('id', data.id)
    
    if (deleteError) {
      console.error('❌ Erro ao deletar:', deleteError)
    } else {
      console.log('✅ Produto de teste removido')
    }
  }
} catch (err) {
  console.error('❌ Exceção ao inserir:', err)
}

console.log('\n✅ Testes concluídos!')