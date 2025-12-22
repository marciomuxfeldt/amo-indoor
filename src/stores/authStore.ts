import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials } from '@/types'
import { signIn, signOut, getCurrentUser, getSession, onAuthStateChange } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initializing = ref(true)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isCoordinator = computed(() => user.value?.role === 'coordinator')

  /**
   * Initialize auth state on app load
   */
  async function initialize(): Promise<void> {
    initializing.value = true
    error.value = null

    try {
      // Check for existing session
      const { session, error: sessionError } = await getSession()
      
      if (sessionError) throw sessionError

      if (session) {
        // Get user with role
        const { user: currentUser, error: userError } = await getCurrentUser()
        
        if (userError) throw userError
        
        user.value = currentUser
      }

      // Listen to auth state changes
      onAuthStateChange((newUser) => {
        user.value = newUser
      })
    } catch (err) {
      console.error('Auth initialization error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to initialize authentication'
      user.value = null
    } finally {
      initializing.value = false
    }
  }

  /**
   * Login with email and password
   */
  async function login(credentials: LoginCredentials): Promise<{ success: boolean; error: string | null }> {
    loading.value = true
    error.value = null

    try {
      const { user: loggedInUser, error: loginError } = await signIn(credentials)

      if (loginError) throw loginError
      if (!loggedInUser) throw new Error('Login failed: No user returned')

      user.value = loggedInUser
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      error.value = errorMessage
      console.error('Login error:', err)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout current user
   */
  async function logout(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await signOut()
      
      if (signOutError) throw signOutError

      user.value = null
    } catch (err) {
      console.error('Logout error:', err)
      error.value = err instanceof Error ? err.message : 'Logout failed'
      // Clear user anyway on logout error
      user.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user has required role
   */
  function hasRole(requiredRole: 'admin' | 'coordinator'): boolean {
    if (!user.value) return false
    
    // Admin has access to everything
    if (user.value.role === 'admin') return true
    
    // Check specific role
    return user.value.role === requiredRole
  }

  /**
   * Clear error message
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    user,
    loading,
    initializing,
    error,
    
    // Computed
    isAuthenticated,
    userRole,
    isAdmin,
    isCoordinator,
    
    // Actions
    initialize,
    login,
    logout,
    hasRole,
    clearError
  }
})