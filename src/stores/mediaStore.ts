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

  function detectMediaType(url: string | undefined): 'video' | 'image' {
    if (!url) return 'image'
    
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
      const { data, error: fetchError } = await supabaseAdmin
        .from('app_8c186_products')
        .select('*')
        .order('order_index', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      products.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch products'
    } finally {
      loading.value = false
    }
  }

  async function fetchMedia(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from('app_8c186_media')
        .select('*')
        .order('order_index', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      mediaItems.value = (data || []).map(item => {
        const url = item.video_url || item.image_url || ''
        const type = detectMediaType(url)
        const active = item.active ?? item.is_active ?? true
        
        return {
          ...item,
          type,
          url,
          active,
          video_url: item.video_url,
          image_url: item.image_url
        }
      })
      
      console.log('Media carregada:', mediaItems.value.length, 'itens')
      console.log('Media ativa:', mediaItems.value.filter(m => m.active).length, 'itens')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch media'
      console.error('Erro ao carregar media:', err)
    } finally {
      loading.value = false
    }
  }

  async function createProduct(productData: Partial<Product>): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      const insertData = {
        name: productData.name,
        price: productData.price,
        image_url: productData.image_url,
        logo_url: productData.logo_url,
        active: productData.active ?? true,
        order_index: productData.order_index ?? products.value.length
      }
      
      const { data, error: createError } = await supabaseAdmin
        .from('app_8c186_products')
        .insert([insertData])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      if (!data) {
        throw new Error('No data returned from Supabase')
      }

      products.value.push(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    loading.value = true
    try {
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
        throw updateError
      }

      if (data) {
        const index = products.value.findIndex(p => p.id === productId)
        if (index !== -1) {
          products.value[index] = data
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(productId: string): Promise<void> {
    loading.value = true
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('app_8c186_products')
        .delete()
        .eq('id', productId)

      if (deleteError) {
        throw deleteError
      }

      products.value = products.value.filter(p => p.id !== productId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createMedia(mediaData: Partial<Media>): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      const detectedType = detectMediaType(mediaData.url)
      const isVideo = detectedType === 'video'
      
      const insertData = {
        title: mediaData.title,
        image_url: !isVideo ? (mediaData.url || '') : null,
        video_url: isVideo ? (mediaData.url || '') : null,
        duration: mediaData.duration ?? 5,
        active: mediaData.active ?? true,
        order_index: mediaData.order_index ?? mediaItems.value.length
      }
      
      const response = await supabaseAdmin
        .from('app_8c186_media')
        .insert([insertData])
        .select()
        .single()

      const { data, error: createError } = response

      if (createError) {
        throw createError
      }

      if (!data) {
        throw new Error('No data returned from Supabase')
      }

      const url = data.video_url || data.image_url || ''
      const type = detectMediaType(url)
      const active = data.active ?? data.is_active ?? true
      
      const mediaItem = {
        ...data,
        type,
        url,
        active
      }
      
      mediaItems.value.push(mediaItem)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create media'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateMedia(mediaId: string, updates: Partial<Media>): Promise<void> {
    loading.value = true
    try {
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
        throw updateError
      }

      if (data) {
        const index = mediaItems.value.findIndex((m: Media) => m.id === mediaId)
        if (index !== -1) {
          const url = data.video_url || data.image_url || ''
          const type = detectMediaType(url)
          const active = data.active ?? data.is_active ?? true
          
          mediaItems.value[index] = {
            ...data,
            type,
            url,
            active
          }
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update media'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteMedia(mediaId: string): Promise<void> {
    loading.value = true
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('app_8c186_media')
        .delete()
        .eq('id', mediaId)

      if (deleteError) {
        throw deleteError
      }

      mediaItems.value = mediaItems.value.filter((m: Media) => m.id !== mediaId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete media'
      throw err
    } finally {
      loading.value = false
    }
  }

  function subscribeToProducts(): void {
    supabaseAdmin
      .channel('products-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'app_8c186_products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const product = payload.new as Product
            products.value.push(product)
          } else if (payload.eventType === 'UPDATE') {
            const product = payload.new as Product
            const index = products.value.findIndex(p => p.id === product.id)
            if (index !== -1) {
              products.value[index] = product
            }
          } else if (payload.eventType === 'DELETE') {
            products.value = products.value.filter(p => p.id !== payload.old.id)
          }
        }
      )
      .subscribe()
  }

  function subscribeToMedia(): void {
    supabaseAdmin
      .channel('media-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'app_8c186_media' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const item = payload.new as Media
            const url = (item.video_url || item.image_url) ?? ''
            const type = detectMediaType(url)
            const active = item.active ?? item.is_active ?? true
            mediaItems.value.push({ ...item, type, url, active })
          } else if (payload.eventType === 'UPDATE') {
            const item = payload.new as Media
            const index = mediaItems.value.findIndex((m: Media) => m.id === item.id)
            if (index !== -1) {
              const url = (item.video_url || item.image_url) ?? ''
              const type = detectMediaType(url)
              const active = item.active ?? item.is_active ?? true
              mediaItems.value[index] = { ...item, type, url, active }
            }
          } else if (payload.eventType === 'DELETE') {
            mediaItems.value = mediaItems.value.filter((m: Media) => m.id !== payload.old.id)
          }
        }
      )
      .subscribe()
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
    deleteMedia,
    subscribeToProducts,
    subscribeToMedia
  }
})