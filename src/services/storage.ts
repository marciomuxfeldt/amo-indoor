// Storage service with fallback mechanisms for browsers with tracking prevention

interface StorageData {
  [key: string]: unknown
}

class StorageService {
  private memoryStorage: StorageData = {}
  private storageType: 'localStorage' | 'sessionStorage' | 'memory' = 'memory'

  constructor() {
    this.detectBestStorage()
  }

  private detectBestStorage(): void {
    // Try localStorage first
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      this.storageType = 'localStorage'
      console.log('✅ Using localStorage')
      return
    } catch (e) {
      console.warn('⚠️ localStorage blocked, trying sessionStorage')
    }

    // Try sessionStorage as fallback
    try {
      const testKey = '__storage_test__'
      sessionStorage.setItem(testKey, 'test')
      sessionStorage.removeItem(testKey)
      this.storageType = 'sessionStorage'
      console.log('✅ Using sessionStorage')
      return
    } catch (e) {
      console.warn('⚠️ sessionStorage blocked, using memory storage')
    }

    // Use memory storage as last resort
    this.storageType = 'memory'
    console.log('✅ Using memory storage (data will be lost on refresh)')
  }

  private getStorage(): Storage | null {
    if (this.storageType === 'localStorage') {
      return localStorage
    } else if (this.storageType === 'sessionStorage') {
      return sessionStorage
    }
    return null
  }

  setLocalStorage<T>(key: string, value: T): void {
    try {
      const storage = this.getStorage()
      if (storage) {
        storage.setItem(key, JSON.stringify(value))
      } else {
        this.memoryStorage[key] = value
      }
    } catch (error) {
      console.error('Error setting storage:', error)
      this.memoryStorage[key] = value
    }
  }

  getLocalStorage<T>(key: string): T | null {
    try {
      const storage = this.getStorage()
      if (storage) {
        const item = storage.getItem(key)
        return item ? JSON.parse(item) : null
      } else {
        return (this.memoryStorage[key] as T) ?? null
      }
    } catch (error) {
      console.error('Error getting storage:', error)
      return (this.memoryStorage[key] as T) ?? null
    }
  }

  removeLocalStorage(key: string): void {
    try {
      const storage = this.getStorage()
      if (storage) {
        storage.removeItem(key)
      } else {
        delete this.memoryStorage[key]
      }
    } catch (error) {
      console.error('Error removing storage:', error)
      delete this.memoryStorage[key]
    }
  }

  clearLocalStorage(): void {
    try {
      const storage = this.getStorage()
      if (storage) {
        storage.clear()
      } else {
        this.memoryStorage = {}
      }
    } catch (error) {
      console.error('Error clearing storage:', error)
      this.memoryStorage = {}
    }
  }

  getStorageType(): string {
    return this.storageType
  }

  // Legacy methods for backward compatibility (no-op)
  async init(): Promise<void> {
    // No-op: initialization happens in constructor
  }

  async load<T>(key: string): Promise<T[]> {
    const data = this.getLocalStorage<T[]>(key)
    return data || []
  }

  async save<T>(key: string, value: T[]): Promise<void> {
    this.setLocalStorage(key, value)
  }
}

export const storage = new StorageService()