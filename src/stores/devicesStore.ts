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
    if (!isSupabaseConfigured) {
      error.value = 'Supabase não configurado'
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('app_8c186_devices')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      devices.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch devices'
      devices.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchSettings(): Promise<void> {
    if (!isSupabaseConfigured) {
      error.value = 'Supabase não configurado'
      return
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('app_8c186_device_settings')
        .select('*')

      if (fetchError) {
        throw fetchError
      }

      settings.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch settings'
      settings.value = []
    } finally {
      loading.value = false
    }
  }

  async function createDevice(deviceData: Partial<Device>): Promise<Device | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado')
    }

    // Gerar código único
    let code = ''
    let isUnique = false
    
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // Verificar se o código já existe
      const { data: existingDevice } = await supabase
        .from('app_8c186_devices')
        .select('id')
        .eq('code', code)
        .single()
      
      if (!existingDevice) {
        isUnique = true
      }
    }

    try {
      const { data, error: createError } = await supabase
        .from('app_8c186_devices')
        .insert([{
          code,
          name: deviceData.name || `TV ${code}`,
          layout_type: deviceData.layout_type || 'orders-list',
          is_active: true
        }])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      if (data) {
        devices.value.unshift(data)
        await createDeviceSettings(data.id)
        return data
      }
      
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create device'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  async function createDeviceSettings(deviceId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado')
    }

    try {
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

      if (createError) {
        throw createError
      }

      if (data) {
        settings.value.push(data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create settings'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  async function updateDevice(deviceId: string, updates: Partial<Device>): Promise<void> {
    if (!isSupabaseConfigured) {
      return
    }

    try {
      const { data, error: updateError } = await supabase
        .from('app_8c186_devices')
        .update(updates)
        .eq('id', deviceId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const index = devices.value.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        devices.value[index] = data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update device'
      throw err
    }
  }

  async function updateDeviceSettings(deviceId: string, updates: Partial<DeviceSettings>): Promise<void> {
    if (!isSupabaseConfigured) {
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
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update settings'
    }
  }

  // NOVA FUNÇÃO: Remover token (limpar deviceId de TVs pareadas)
  async function removeToken(deviceId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      return
    }

    try {
      // Gerar novo código único
      let newCode = ''
      let isUnique = false
      
      while (!isUnique) {
        newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        
        const { data: existingDevice } = await supabase
          .from('app_8c186_devices')
          .select('id')
          .eq('code', newCode)
          .single()
        
        if (!existingDevice) {
          isUnique = true
        }
      }

      // Atualizar device com novo código
      const { error: updateError } = await supabase
        .from('app_8c186_devices')
        .update({ 
          code: newCode,
          is_online: false
        })
        .eq('id', deviceId)

      if (updateError) throw updateError

      // Atualizar localmente
      const index = devices.value.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        devices.value[index].code = newCode
        devices.value[index].is_online = false
      }

      // Broadcast para forçar TVs a desconectar
      await supabase
        .channel('device-token-removal')
        .send({
          type: 'broadcast',
          event: 'token-removed',
          payload: { deviceId }
        })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove token'
      throw err
    }
  }

  async function deleteDevice(deviceId: string): Promise<void> {
    if (!isSupabaseConfigured) {
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
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete device'
    }
  }

  function getDeviceSettings(deviceId: string): DeviceSettings | undefined {
    const result = settings.value.find((s: DeviceSettings) => s.device_id === deviceId)
    return result
  }

  async function pairDevice(code: string): Promise<Device | null> {
    if (!isSupabaseConfigured) {
      return null
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('app_8c186_devices')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError) throw fetchError

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Device not found'
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
    removeToken,
    deleteDevice,
    getDeviceSettings,
    pairDevice
  }
})