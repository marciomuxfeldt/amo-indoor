import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, Media } from '@/types'
import { supabaseAdmin } from '@/services/supabase'

export const useMediaStore = defineStore('media', () => {
  const products = ref<Product[]>([])
  const mediaItems = ref<Media[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeProducts = computed(() => 
    products.value.filter(p => p.active).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  )

  const activeMedia = computed(() => 
    mediaItems.value.filter(m => m.active).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  )

  // Função auxiliar para detectar tipo de mídia baseado na URL
  function detectMediaType(url: string | undefined): 'video' | 'image' {
    if (!url) return 'image'
    
    // Prioridade 1: Verificar se é vídeo pela URL
    const isVideoUrl = url.includes('youtube') ||
                       url.includes('youtu.be') ||
                       url.includes('vimeo') ||
                       url.match(/\.(mp4|webm|ogg)$/i)
    
    return isVideoUrl ? 'video' : 'image'
  }

  async function fetchProducts(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      console.log('📥 Buscando produtos...')
      const { data, error: fetchError } = await supabaseAdmin
        .from('app_8c186_products')
        .select('*')
        .order('order_index', { ascending: true })

      if (fetchError) {
        console.error('❌ Erro ao buscar produtos:', fetchError)
        throw fetchError
      }

      console.log('📦 Dados brutos do Supabase (produtos):', data)
      products.value = data || []
      console.log('✅ Produtos carregados:', products.value.length)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch products'
      console.error('❌ Erro ao buscar produtos:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchMedia(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      console.log('📥 Buscando mídias...')
      const { data, error: fetchError } = await supabaseAdmin
        .from('app_8c186_media')
        .select('*')
        .order('order_index', { ascending: true })

      if (fetchError) {
        console.error('❌ Erro ao buscar mídias:', fetchError)
        throw fetchError
      }

      console.log('📦 Dados brutos do Supabase:', data)

      // Mapear dados do Supabase para o formato esperado pelo frontend
      mediaItems.value = (data || []).map(item => {
        const url = item.video_url || item.image_url
        const type = detectMediaType(url)
        
        const mappedItem = {
          ...item,
          type,
          url
        }
        console.log('🔄 Item mapeado:', {
          id: mappedItem.id,
          title: mappedItem.title,
          type: mappedItem.type,
          url: mappedItem.url,
          video_url: item.video_url,
          image_url: item.image_url
        })
        return mappedItem
      })
      console.log('✅ Mídias carregadas:', mediaItems.value.length)
      console.log('📊 Resumo:', {
        total: mediaItems.value.length,
        videos: mediaItems.value.filter(m => m.type === 'video').length,
        images: mediaItems.value.filter(m => m.type === 'image').length
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch media'
      console.error('❌ Erro ao buscar mídia:', err)
    } finally {
      loading.value = false
    }
  }

  async function createProduct(productData: Partial<Product>): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      console.log('🔧 [DEBUG] Usando cliente supabaseAdmin (sem sessão persistente)')
      console.log('📤 [INÍCIO] Criando produto:', productData)
      
      const insertData = {
        name: productData.name,
        price: productData.price,
        image_url: productData.image_url,
        logo_url: productData.logo_url,
        active: productData.active ?? true,
        order_index: productData.order_index ?? products.value.length
      }
      
      console.log('📦 Dados preparados para inserção:', JSON.stringify(insertData, null, 2))
      console.log('⏳ Iniciando requisição ao Supabase...')
      
      const startTime = Date.now()
      
      const { data, error: createError } = await supabaseAdmin
        .from('app_8c186_products')
        .insert([insertData])
        .select()
        .single()
      
      const duration = Date.now() - startTime
      console.log(`⏱️ Tempo de resposta: ${duration}ms`)
      console.log('📨 Resposta completa do Supabase:', JSON.stringify({ data, error: createError }, null, 2))

      if (createError) {
        console.error('❌ Erro do Supabase:', createError)
        console.error('❌ Código do erro:', createError.code)
        console.error('❌ Mensagem:', createError.message)
        console.error('❌ Detalhes:', createError.details)
        console.error('❌ Hint:', createError.hint)
        
        throw createError
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado do Supabase')
        throw new Error('No data returned from Supabase')
      }

      products.value.push(data)
      console.log('✅ Produto criado com sucesso:', data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product'
      error.value = errorMessage
      console.error('❌ ERRO CAPTURADO:', err)
      console.error('❌ Tipo do erro:', typeof err)
      console.error('❌ Nome do erro:', err instanceof Error ? err.name : 'N/A')
      console.error('❌ Mensagem:', errorMessage)
      console.error('❌ Stack trace:', err instanceof Error ? err.stack : 'N/A')
      
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    loading.value = true
    try {
      console.log('📤 Atualizando produto:', productId, updates)
      
      const { data, error: updateError } = await supabaseAdmin
        .from('app_8c186_products')
        .update({
          name: updates.name,
          price: updates.price,
          image_url: updates.image_url,
          logo_url: updates.logo_url,
          active: updates.active
        })
        .eq('id', productId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erro do Supabase:', updateError)
        throw updateError
      }

      if (data) {
        const index = products.value.findIndex(p => p.id === productId)
        if (index !== -1) {
          products.value[index] = data
          console.log('✅ Produto atualizado com sucesso:', data)
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update product'
      console.error('❌ Erro ao atualizar produto:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(productId: string): Promise<void> {
    loading.value = true
    try {
      console.log('📤 Deletando produto:', productId)
      
      const { error: deleteError } = await supabaseAdmin
        .from('app_8c186_products')
        .delete()
        .eq('id', productId)

      if (deleteError) {
        console.error('❌ Erro do Supabase:', deleteError)
        throw deleteError
      }

      products.value = products.value.filter(p => p.id !== productId)
      console.log('✅ Produto deletado com sucesso')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete product'
      console.error('❌ Erro ao deletar produto:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createMedia(mediaData: Partial<Media>): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      console.log('📤 [INÍCIO] Criando mídia:', mediaData)
      console.log('🔍 Tipo recebido do formulário:', mediaData.type)
      console.log('🔍 URL recebida:', mediaData.url)
      
      // IMPORTANTE: Detectar tipo baseado na URL, não no tipo selecionado
      const detectedType = detectMediaType(mediaData.url)
      const isVideo = detectedType === 'video'
      
      console.log('🎬 Tipo detectado pela URL:', detectedType)
      console.log('🎬 É vídeo?', isVideo)
      
      const insertData = {
        title: mediaData.title,
        // Para imagens: salvar em image_url
        // Para vídeos: deixar image_url como null
        image_url: !isVideo ? (mediaData.url || '') : null,
        // Para vídeos: salvar em video_url
        // Para imagens: deixar video_url como null
        video_url: isVideo ? (mediaData.url || '') : null,
        duration: mediaData.duration ?? 5,
        active: mediaData.active ?? true,
        order_index: mediaData.order_index ?? mediaItems.value.length
      }
      
      console.log('📦 Dados preparados para inserção:', JSON.stringify(insertData, null, 2))
      
      const response = await supabaseAdmin
        .from('app_8c186_media')
        .insert([insertData])
        .select()
        .single()

      console.log('📨 Resposta completa do Supabase:', JSON.stringify(response, null, 2))
      
      const { data, error: createError } = response

      if (createError) {
        console.error('❌ Erro do Supabase:', createError)
        console.error('❌ Detalhes do erro:', JSON.stringify(createError, null, 2))
        throw createError
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado do Supabase')
        throw new Error('No data returned from Supabase')
      }

      // Adicionar tipo e url para compatibilidade com o frontend
      const url = data.video_url || data.image_url
      const type = detectMediaType(url)
      
      const mediaItem = {
        ...data,
        type,
        url
      }
      
      mediaItems.value.push(mediaItem)
      console.log('✅ Mídia criada com sucesso:', mediaItem)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create media'
      console.error('❌ ERRO CAPTURADO:', err)
      console.error('❌ Stack trace:', err instanceof Error ? err.stack : 'N/A')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateMedia(mediaId: string, updates: Partial<Media>): Promise<void> {
    loading.value = true
    try {
      console.log('📤 Atualizando mídia:', mediaId, updates)
      
      // Detectar tipo baseado na URL
      const detectedType = detectMediaType(updates.url)
      const isVideo = detectedType === 'video'
      
      const { data, error: updateError } = await supabaseAdmin
        .from('app_8c186_media')
        .update({
          title: updates.title,
          image_url: !isVideo ? (updates.url || '') : null,
          video_url: isVideo ? (updates.url || '') : null,
          duration: updates.duration,
          active: updates.active
        })
        .eq('id', mediaId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erro do Supabase:', updateError)
        throw updateError
      }

      if (data) {
        const index = mediaItems.value.findIndex((m: Media) => m.id === mediaId)
        if (index !== -1) {
          const url = data.video_url || data.image_url
          const type = detectMediaType(url)
          
          mediaItems.value[index] = {
            ...data,
            type,
            url
          }
          console.log('✅ Mídia atualizada com sucesso:', data)
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update media'
      console.error('❌ Erro ao atualizar mídia:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteMedia(mediaId: string): Promise<void> {
    loading.value = true
    try {
      console.log('📤 Deletando mídia:', mediaId)
      
      const { error: deleteError } = await supabaseAdmin
        .from('app_8c186_media')
        .delete()
        .eq('id', mediaId)

      if (deleteError) {
        console.error('❌ Erro do Supabase:', deleteError)
        throw deleteError
      }

      mediaItems.value = mediaItems.value.filter((m: Media) => m.id !== mediaId)
      console.log('✅ Mídia deletada com sucesso')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete media'
      console.error('❌ Erro ao deletar mídia:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    mediaItems,
    loading,
    error,
    activeProducts,
    activeMedia,
    fetchProducts,
    fetchMedia,
    createProduct,
    updateProduct,
    deleteProduct,
    createMedia,
    updateMedia,
    deleteMedia
  }
})