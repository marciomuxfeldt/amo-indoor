import type { Order, Product, Media, Device, DeviceSettings } from '@/types'
import { storage } from '@/services/storage'

export const mockOrders: Order[] = [
  {
    id: '1',
    order_number: '101',
    customer_name: 'João Silva',
    store_name: 'Tokyo Sushi',
    status: 'READY',
    store_id: 'store-1',
    kitchen_id: 'kitchen-1',
    channel: 'local',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    order_number: '102',
    customer_name: 'Maria Santos',
    store_name: 'Hakalu Poke',
    status: 'READY',
    store_id: 'store-1',
    kitchen_id: 'kitchen-1',
    channel: 'local',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    order_number: '103',
    customer_name: 'Pedro Oliveira',
    store_name: 'Usina de Massas',
    status: 'PREPARING',
    store_id: 'store-1',
    kitchen_id: 'kitchen-1',
    channel: 'local',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Pizza Margherita',
    price: 35.90,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    is_active: true,
    active: true,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Hambúrguer Artesanal',
    price: 28.50,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    is_active: true,
    active: true,
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Suco Natural',
    price: 12.00,
    image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800',
    is_active: true,
    active: true,
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockMedia: Media[] = [
  {
    id: '1',
    title: 'Promoção de Verão',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
    image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
    duration: 8,
    is_active: true,
    active: true,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Novo Cardápio',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    duration: 10,
    is_active: true,
    active: true,
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockDevices: Device[] = [
  {
    id: '1',
    code: 'ABC123',
    name: 'TV Principal',
    password: 'password123',
    is_active: true,
    is_online: true,
    last_heartbeat: new Date().toISOString(),
    layout_type: 'default',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockDeviceSettings: DeviceSettings[] = [
  {
    id: '1',
    device_id: '1',
    orders_percentage: 70,
    media_percentage: 20,
    products_percentage: 10,
    show_full_name: false,
    auto_rotate_interval: 10,
    primary_color: '#3b82f6',
    logo_url: '',
    updated_at: new Date().toISOString()
  }
]

export async function loadMockData(): Promise<void> {
  await storage.init()
  
  const existingOrders = await storage.load('orders')
  if (existingOrders.length === 0) {
    await storage.save('orders', mockOrders)
  }
  
  const existingProducts = await storage.load('products')
  if (existingProducts.length === 0) {
    await storage.save('products', mockProducts)
  }
  
  const existingMedia = await storage.load('media')
  if (existingMedia.length === 0) {
    await storage.save('media', mockMedia)
  }
  
  const existingDevices = await storage.load('devices')
  if (existingDevices.length === 0) {
    await storage.save('devices', mockDevices)
  }
  
  const existingSettings = await storage.load('settings')
  if (existingSettings.length === 0) {
    await storage.save('settings', mockDeviceSettings)
  }
}