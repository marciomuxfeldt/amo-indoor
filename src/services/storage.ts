import type { Order, Product, Media, Device, DeviceSettings } from '@/types'

const DB_NAME = 'AmoIndoorDB'
const DB_VERSION = 1

interface CacheData {
  orders: Order[]
  products: Product[]
  media: Media[]
  devices: Device[]
  settings: DeviceSettings[]
}

class StorageService {
  private db: IDBDatabase | null = null
  private useLocalStorageFallback = false

  async init(): Promise<void> {
    // Tentar usar IndexedDB primeiro
    try {
      return await new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          console.warn('IndexedDB falhou, usando localStorage como fallback')
          this.useLocalStorageFallback = true
          resolve()
        }
        
        request.onsuccess = () => {
          this.db = request.result
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          if (!db.objectStoreNames.contains('orders')) {
            db.createObjectStore('orders', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('media')) {
            db.createObjectStore('media', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('devices')) {
            db.createObjectStore('devices', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' })
          }
        }
      })
    } catch (error) {
      console.warn('IndexedDB não disponível, usando localStorage:', error)
      this.useLocalStorageFallback = true
    }
  }

  // Serializa dados para remover referências circulares
  private serializeData<T>(data: T[]): T[] {
    try {
      return JSON.parse(JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao serializar dados:', error)
      return data
    }
  }

  async save<T>(storeName: keyof CacheData, data: T[]): Promise<void> {
    // Serializar dados para remover referências circulares
    const serializedData = this.serializeData(data)

    // Usar localStorage se IndexedDB falhar
    if (this.useLocalStorageFallback || !this.db) {
      try {
        localStorage.setItem(`amo_indoor_${storeName}`, JSON.stringify(serializedData))
        return
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error)
        throw error
      }
    }

    // Tentar IndexedDB
    try {
      if (!this.db) await this.init()
      
      return await new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([storeName], 'readwrite')
          const store = transaction.objectStore(storeName)
          
          store.clear()
          serializedData.forEach(item => {
            try {
              store.add(item)
            } catch (addError) {
              console.warn('Erro ao adicionar item no IndexedDB:', addError)
            }
          })
          
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => {
            console.warn('Erro no IndexedDB, tentando localStorage')
            this.useLocalStorageFallback = true
            localStorage.setItem(`amo_indoor_${storeName}`, JSON.stringify(serializedData))
            resolve()
          }
        } catch (error) {
          console.warn('Erro ao usar IndexedDB, usando localStorage:', error)
          this.useLocalStorageFallback = true
          localStorage.setItem(`amo_indoor_${storeName}`, JSON.stringify(serializedData))
          resolve()
        }
      })
    } catch (error) {
      // Fallback final para localStorage
      console.warn('Fallback para localStorage devido a erro:', error)
      localStorage.setItem(`amo_indoor_${storeName}`, JSON.stringify(serializedData))
    }
  }

  async load<T>(storeName: keyof CacheData): Promise<T[]> {
    // Usar localStorage se IndexedDB falhar
    if (this.useLocalStorageFallback || !this.db) {
      try {
        const data = localStorage.getItem(`amo_indoor_${storeName}`)
        return data ? JSON.parse(data) as T[] : []
      } catch (error) {
        console.error('Erro ao carregar do localStorage:', error)
        return []
      }
    }

    // Tentar IndexedDB
    try {
      if (!this.db) await this.init()
      
      return await new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([storeName], 'readonly')
          const store = transaction.objectStore(storeName)
          const request = store.getAll()
          
          request.onsuccess = () => resolve(request.result as T[])
          request.onerror = () => {
            console.warn('Erro no IndexedDB, tentando localStorage')
            this.useLocalStorageFallback = true
            const data = localStorage.getItem(`amo_indoor_${storeName}`)
            resolve(data ? JSON.parse(data) as T[] : [])
          }
        } catch (error) {
          console.warn('Erro ao usar IndexedDB, usando localStorage:', error)
          this.useLocalStorageFallback = true
          const data = localStorage.getItem(`amo_indoor_${storeName}`)
          resolve(data ? JSON.parse(data) as T[] : [])
        }
      })
    } catch (error) {
      // Fallback final para localStorage
      console.warn('Fallback para localStorage devido a erro:', error)
      const data = localStorage.getItem(`amo_indoor_${storeName}`)
      return data ? JSON.parse(data) as T[] : []
    }
  }

  setLocalStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error)
    }
  }

  getLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) as T : null
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error)
      return null
    }
  }

  removeLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error)
    }
  }
}

export const storage = new StorageService()
export default storage