import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

/**
 * Navigation guard to protect admin routes
 * Redirects to login if user is not authenticated
 */
export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  // Allow access to login page and TV pages without authentication
  if (to.path === '/admin/login' || to.path.startsWith('/tv')) {
    next()
    return
  }

  const authStore = useAuthStore()

  // Wait for auth initialization with timeout
  if (authStore.initializing) {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000))
    const authReady = new Promise<void>((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.initializing) {
          unwatch()
          resolve()
        }
      })
    })
    
    await Promise.race([authReady, timeout])
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login with return URL
    next({
      name: 'admin-login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // Check if route requires specific role
  const requiredRole = to.meta.role as 'admin' | 'coordinator' | undefined

  if (requiredRole && !authStore.hasRole(requiredRole)) {
    // User doesn't have required role
    console.warn(`Access denied: User role '${authStore.userRole}' does not have access to '${to.path}'`)
    next({
      name: 'admin-home',
      query: { error: 'insufficient_permissions' }
    })
    return
  }

  // User is authenticated and has required role
  next()
}

/**
 * Navigation guard for login page
 * Redirects to dashboard if user is already authenticated
 */
export async function loginGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const authStore = useAuthStore()

  // Wait for auth initialization with timeout
  if (authStore.initializing) {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000))
    const authReady = new Promise<void>((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.initializing) {
          unwatch()
          resolve()
        }
      })
    })
    
    await Promise.race([authReady, timeout])
  }

  // If user is already authenticated, redirect to dashboard or return URL
  if (authStore.isAuthenticated) {
    const redirectTo = (to.query.redirect as string) || '/admin'
    next(redirectTo)
    return
  }

  // User is not authenticated, allow access to login page
  next()
}