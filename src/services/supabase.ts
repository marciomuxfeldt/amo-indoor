import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import type { Device, MediaItem, Product, Order, TvSettings, User, LoginCredentials } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validar que as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltando')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurado' : '❌ Faltando')
}

// Validar que os valores não são strings vazias ou inválidas
if (supabaseUrl && (supabaseUrl === 'undefined' || supabaseUrl === 'null')) {
  console.error('❌ ERRO: VITE_SUPABASE_URL tem valor inválido:', supabaseUrl)
}

if (supabaseAnonKey && (supabaseAnonKey === 'undefined' || supabaseAnonKey === 'null')) {
  console.error('❌ ERRO: VITE_SUPABASE_ANON_KEY tem valor inválido:', supabaseAnonKey)
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined')

// Singleton pattern para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

// Cliente principal com autenticação persistente (para login de usuários)
export const supabase: SupabaseClient = (() => {
  if (!supabaseInstance) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente.')
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-wslrbparafkoxahesnjj-auth-token'
      }
    })
    
    console.log('✅ Supabase client inicializado')
  }
  return supabaseInstance
})()

// Cliente administrativo SEM sessão persistente (para operações de CRUD)
// Isso evita conflitos com tokens de autenticação que podem causar timeout
export const supabaseAdmin: SupabaseClient = (() => {
  if (!supabaseAdminInstance) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente.')
    }
    
    supabaseAdminInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
    
    console.log('✅ Supabase admin client inicializado')
  }
  return supabaseAdminInstance
})()

// ============================================
// Authentication Functions
// ============================================

/**
 * Sign in with email and password
 */
export async function signIn(credentials: LoginCredentials): Promise<{ user: User | null; error: Error | null }> {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (error) throw error
    if (!data.user) throw new Error('No user returned from sign in')

    // Fetch user role from admin_users table
    const userWithRole = await getUserWithRole(data.user.id)
    
    return { user: userWithRole, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { user: null, error: error as Error }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error: error as Error }
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<{ session: Session | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session: data.session, error: null }
  } catch (error) {
    console.error('Get session error:', error)
    return { session: null, error: error as Error }
  }
}

/**
 * Get current user with role
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!data.user) return { user: null, error: null }

    const userWithRole = await getUserWithRole(data.user.id)
    return { user: userWithRole, error: null }
  } catch (error) {
    console.error('Get current user error:', error)
    return { user: null, error: error as Error }
  }
}

/**
 * Get user with role from admin_users table
 */
async function getUserWithRole(userId: string): Promise<User> {
  console.log('Fetching user with ID:', userId)
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, user_id, email, role, created_at')
    .eq('user_id', userId)
    .single()

  console.log('Query result:', { data, error })

  if (error) {
    console.error('Database error:', error)
    throw new Error(`Database error: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('User not found in admin_users table. Please contact administrator.')
  }

  return {
    id: data.user_id,
    email: data.email,
    role: data.role,
    created_at: data.created_at
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        const userWithRole = await getUserWithRole(session.user.id)
        callback(userWithRole)
      } catch (error) {
        console.error('Error fetching user role:', error)
        callback(null)
      }
    } else if (event === 'SIGNED_OUT') {
      callback(null)
    }
  })

  return {
    unsubscribe: () => {
      data.subscription.unsubscribe()
    }
  }
}

// ============================================
// Existing Functions (unchanged)
// ============================================

export async function getDevices(): Promise<Device[]> {
  if (!isSupabaseConfigured) return []
  
  const { data, error } = await supabase
    .from('app_8c186_devices')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching devices:', error)
    return []
  }
  
  return data || []
}

export async function getDeviceByCode(code: string): Promise<Device | null> {
  if (!isSupabaseConfigured) return null
  
  const { data, error } = await supabase
    .from('app_8c186_devices')
    .select('*')
    .eq('code', code)
    .single()
  
  if (error) {
    console.error('Error fetching device:', error)
    return null
  }
  
  return data
}

export async function verifyDevicePassword(code: string, password: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  
  const { data, error } = await supabase
    .from('app_8c186_devices')
    .select('password')
    .eq('code', code)
    .single()
  
  if (error || !data) return false
  
  return data.password === password
}

export async function getMediaItems(): Promise<MediaItem[]> {
  if (!isSupabaseConfigured) return []
  
  const { data, error } = await supabase
    .from('app_8c186_media')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching media:', error)
    return []
  }
  
  return data || []
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return []
  
  const { data, error } = await supabase
    .from('app_8c186_products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  
  return data || []
}

export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) return []
  
  const { data, error } = await supabase
    .from('app_8c186_orders')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }
  
  return data || []
}

export async function getTvSettings(): Promise<TvSettings> {
  if (!isSupabaseConfigured) {
    return {
      primary_color: '#2a5298',
      logo_url: ''
    }
  }
  
  const { data, error } = await supabase
    .from('app_8c186_tv_settings')
    .select('*')
    .single()
  
  if (error) {
    console.error('Error fetching TV settings:', error)
    return {
      primary_color: '#2a5298',
      logo_url: ''
    }
  }
  
  return {
    primary_color: data.primary_color || '#2a5298',
    logo_url: data.logo_url || ''
  }
}