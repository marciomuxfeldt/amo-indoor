import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Device, DeviceSettings } from '@/types'
import { supabase, isSupabaseConfigured } from '@/services/supabase'

export const useDevicesStore = defineStore('devices', () => {
  const devices = ref<Device[]>([])
  const settings = ref<DeviceSettings[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const onlineDevices = computed(() => 
    devices.value.filter(d => d.is_online)
  )

  async function fetchDevices(): Promise<void> {
    console.log('🔵 [devicesStore] fetchDevices iniciado')
    
    if (!isSupabaseConfigured) {
      console.error('❌ [devicesStore] Supabase não configurado')
      error.value = 'Supabase não configurado'
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('📡 [devicesStore] Chamando Supabase.from(app_8c186_devices)...')
      
      const { data, error: fetchError } = await supabase
        .from('app_8c186_devices')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📡 [devicesStore] Resposta do Supabase recebida')

      if (fetchError) {
        console.error('❌ [devicesStore] Erro do Supabase:', fetchError)
        throw fetchError
      }

      devices.value = data || []
      console.log('✅ [devicesStore] Devices carregados:', devices.value.length)
    } catch (err) {
      console.error('❌ [devicesStore] Erro no catch:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch devices'
      devices.value = []
    } finally {
      loading.value = false
      console.log('🏁 [devicesStore] fetchDevices finalizado')
    }
  }

  async function fetchSettings(): Promise<void> {
    console.log('🔵 [devicesStore] fetchSettings iniciado')
    
    if (!isSupabaseConfigured) {
      console.error('❌ [devicesStore] Supabase não configurado')
      error.value = 'Supabase não configurado'
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('📡 [devicesStore] Chamando Supabase.from(app_8c186_device_settings)...')
      
      const { data, error: fetchError } = await supabase
        .from('app_8c186_device_settings')
        .select('*')

      console.log('📡 [devicesStore] Resposta do Supabase recebida')

      if (fetchError) {
        console.error('❌ [devicesStore] Erro do Supabase:', fetchError)
        throw fetchError
      }

      settings.value = data || []
      console.log('✅ [devicesStore] Settings carregados:', settings.value.length)
    } catch (err) {
      console.error('❌ [devicesStore] Erro no catch:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch settings'
      settings.value = []
    } finally {
      loading.value = false
      console.log('🏁 [devicesStore] fetchSettings finalizado')
    }
  }

  async function createDevice(deviceData: Partial<Device>): Promise<Device | null> {
    console.log('🔵 [devicesStore] createDevice iniciado')
    console.log('📝 [devicesStore] Device data:', deviceData)
    
    if (!isSupabaseConfigured) {
      console.error('❌ [devicesStore] Supabase não configurado')
      throw new Error('Supabase não configurado')
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('🔑 [devicesStore] Código gerado:', code)

    try {
      console.log('📡 [devicesStore] Inserindo device no Supabase...')
      
      // Inserir apenas code, name e layout_type (colunas que existem na tabela)
      const { data, error: createError } = await supabase
        .from('app_8c186_devices')
        .insert([{
          code,
          name: deviceData.name || `TV ${code}`,
          layout_type: deviceData.layout_type || 'orders-list'
        }])
        .select()
        .single()

      console.log('📡 [devicesStore] Resposta do insert:', data)

      if (createError) {
        console.error('❌ [devicesStore] Erro ao inserir device:', createError)
        throw createError
      }

      if (data) {
        console.log('✅ [devicesStore] Device criado com sucesso:', data.id)
        devices.value.unshift(data)
        
        console.log('📝 [devicesStore] Criando settings para o device...')
        await createDeviceSettings(data.id)
        
        console.log('✅ [devicesStore] Device e settings criados com sucesso!')
        return data
      }
      
      console.warn('⚠️ [devicesStore] Nenhum dado retornado após insert')
      return null
    } catch (err) {
      console.error('❌ [devicesStore] Erro ao criar device:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create device'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  async function createDeviceSettings(deviceId: string): Promise<void> {
    console.log('🔵 [devicesStore] createDeviceSettings iniciado para:', deviceId)
    
    if (!isSupabaseConfigured) {
      console.error('❌ [devicesStore] Supabase não configurado')
      throw new Error('Supabase não configurado')
    }

    try {
      console.log('📡 [devicesStore] Inserindo settings no Supabase...')
      
      const { data, error: createError } = await supabase
        .from('app_8c186_device_settings')
        .insert([{
          device_id: deviceId,
          orders_percentage: 70,
          media_percentage: 20,
          products_percentage: 10,
          show_full_name: false,
          auto_rotate_interval: 10,
          primary_color: '#3b82f6',
          logo_url: ''
        }])
        .select()
        .single()

      console.log('📡 [devicesStore] Resposta do insert settings:', data)

      if (createError) {
        console.error('❌ [devicesStore] Erro ao inserir settings:', createError)
        throw createError
      }

      if (data) {
        settings.value.push(data)
        console.log('✅ [devicesStore] Settings criados para device:', deviceId)
      }
    } catch (err) {
      console.error('❌ [devicesStore] Erro ao criar settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create settings'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  async function updateDevice(deviceId: string, updates: Partial<Device>): Promise<void> {
    if (!isSupabaseConfigured) {
      console.error('❌ [devicesStore] Supabase não configurado')
      return
    }

    console.log('🔵 [devicesStore] updateDevice iniciado')
    console.log('📝 [devicesStore] Device ID:', deviceId)
    console.log('📝 [devicesStore] Updates:', JSON.stringify(updates, null, 2))

    try {
      const { data, error: updateError } = await supabase
        .from('app_8c186_devices')
        .update(updates)
        .eq('id', deviceId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ [devicesStore] Erro do Supabase ao atualizar:', updateError)
        throw updateError
      }

      console.log('✅ [devicesStore] Resposta do Supabase:', data)

      // Atualizar o device no array local
      const index = devices.value.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        devices.value[index] = data
        console.log('✅ [devicesStore] Device atualizado no array local:', devices.value[index])
      } else {
        console.warn('⚠️ [devicesStore] Device não encontrado no array local')
      }
      
      console.log('✅ [devicesStore] Device atualizado com sucesso:', deviceId)
    } catch (err) {
      console.error('❌ [devicesStore] Erro ao atualizar device:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update device'
      throw err
    }
  }

  async function updateDeviceSettings(deviceId: string, updates: Partial<DeviceSettings>): Promise<void> {
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase não configurado')
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('app_8c186_device_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', deviceId)

      if (updateError) throw updateError

      const index = settings.value.findIndex((s: DeviceSettings) => s.device_id === deviceId)
      if (index !== -1) {
        settings.value[index] = { 
          ...settings.value[index], 
          ...updates,
          updated_at: new Date().toISOString()
        }
      }
      console.log('✅ Settings atualizados para device:', deviceId)
    } catch (err) {
      console.error('❌ Erro ao atualizar settings:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update settings'
    }
  }

  async function deleteDevice(deviceId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase não configurado')
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('app_8c186_devices')
        .delete()
        .eq('id', deviceId)

      if (deleteError) throw deleteError

      devices.value = devices.value.filter(d => d.id !== deviceId)
      settings.value = settings.value.filter((s: DeviceSettings) => s.device_id !== deviceId)
      console.log('✅ Device deletado:', deviceId)
    } catch (err) {
      console.error('❌ Erro ao deletar device:', err)
      error.value = err instanceof Error ? err.message : 'Failed to delete device'
    }
  }

  function getDeviceSettings(deviceId: string): DeviceSettings | undefined {
    const result = settings.value.find((s: DeviceSettings) => s.device_id === deviceId)
    console.log('🔍 Buscando settings para device:', deviceId, 'Encontrado:', !!result)
    if (result) {
      console.log('📋 Settings encontrados:', {
        primary_color: result.primary_color,
        orders_percentage: result.orders_percentage,
        products_percentage: result.products_percentage,
        media_percentage: result.media_percentage
      })
    }
    return result
  }

  async function pairDevice(code: string): Promise<Device | null> {
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase não configurado')
      return null
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('app_8c186_devices')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError) throw fetchError

      console.log('✅ Device pareado:', data.id)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Device not found'
      console.error('❌ Erro ao parear device:', error.value)
      return null
    }
  }

  return {
    devices,
    settings,
    loading,
    error,
    onlineDevices,
    fetchDevices,
    fetchSettings,
    createDevice,
    updateDevice,
    updateDeviceSettings,
    deleteDevice,
    getDeviceSettings,
    pairDevice
  }
})