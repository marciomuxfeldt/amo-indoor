import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order } from '@/types'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { audio } from '@/services/audio'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // CORREÇÃO 1: Ordenar READY e PREPARING primeiro, usando updated_at
  const displayOrders = computed(() => {
    const ready = orders.value
      .filter(order => order.status === 'READY')
      .sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
    
    const preparing = orders.value
      .filter(order => order.status === 'PREPARING')
      .sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
    
    const others = orders.value
      .filter(order => order.status !== 'READY' && order.status !== 'PREPARING')
      .sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
    
    return [...ready, ...preparing, ...others]
  })

  const readyOrders = computed(() => 
    orders.value
      .filter(order => order.status === 'READY')
      .sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
  )

  const pendingOrders = computed(() => 
    orders.value.filter(order => order.status === 'PENDING' || order.status === 'PREPARING')
  )

  async function fetchOrders(): Promise<void> {
    if (!isSupabaseConfigured) {
      orders.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('app_8c186_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      orders.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch orders'
      orders.value = []
    } finally {
      loading.value = false
    }
  }

  async function createOrder(orderData: Partial<Order>): Promise<void> {
    if (!isSupabaseConfigured) {
      return
    }

    const { data, error: createError } = await supabase
      .from('app_8c186_orders')
      .insert([{
        order_number: orderData.order_number,
        customer_name: orderData.customer_name,
        store_name: orderData.store_name,
        status: orderData.status || 'PENDING',
        store_id: orderData.store_id || '',
        kitchen_id: orderData.kitchen_id || '',
        channel: orderData.channel || 'local'
      }])
      .select()
      .single()

    if (createError) throw createError

    if (data) {
      orders.value.unshift(data)
    }
  }

  // CORREÇÃO 5: Recarregar do banco após update para evitar travamento
  async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    if (!isSupabaseConfigured) {
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('app_8c186_orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Recarregar todos os pedidos do banco
      await fetchOrders()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update order'
      throw err
    }
  }

  async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    if (!isSupabaseConfigured) {
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('app_8c186_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Recarregar todos os pedidos do banco
      await fetchOrders()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update order status'
      throw err
    }
  }

  async function deleteOrder(orderId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      return
    }

    const { error: deleteError } = await supabase
      .from('app_8c186_orders')
      .delete()
      .eq('id', orderId)

    if (deleteError) throw deleteError

    orders.value = orders.value.filter(o => o.id !== orderId)
  }

  function handleNewReadyOrder(order: Order): void {
    const existing = orders.value.find(o => o.id === order.id)
    
    if (!existing || existing.status !== 'READY') {
      audio.playNotification()
    }

    if (existing) {
      Object.assign(existing, order)
    } else {
      orders.value.unshift(order)
    }
  }

  function subscribeToOrders(): void {
    if (!isSupabaseConfigured) {
      return
    }

    supabase
      .channel('orders-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'app_8c186_orders' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const order = payload.new as Order
            if (order.status === 'READY') {
              handleNewReadyOrder(order)
            } else {
              const index = orders.value.findIndex(o => o.id === order.id)
              if (index !== -1) {
                orders.value[index] = order
              } else {
                orders.value.unshift(order)
              }
            }
          } else if (payload.eventType === 'DELETE') {
            orders.value = orders.value.filter(o => o.id !== payload.old.id)
          }
        }
      )
      .subscribe()
  }

  return {
    orders,
    loading,
    error,
    displayOrders,
    readyOrders,
    pendingOrders,
    fetchOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    handleNewReadyOrder,
    subscribeToOrders
  }
})