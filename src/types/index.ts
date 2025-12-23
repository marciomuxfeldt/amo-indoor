export type DeviceLayoutType = 'orders-list' | 'orders-kanban' | 'orders-only' | 'orders-only-kanban' | 'media-only' | 'default'

export interface Device {
  id: string
  code: string
  name: string
  password: string
  layout_type: DeviceLayoutType
  is_active: boolean
  is_online?: boolean
  last_heartbeat?: string
  created_at: string
  updated_at: string
}

export interface MediaItem {
  id: string
  title: string
  type: 'image' | 'video'
  url: string
  duration: number
  is_active: boolean
  image_url?: string
  video_url?: string
  active?: boolean
  order_index?: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  image_url: string
  logo_url?: string
  is_active: boolean
  active?: boolean
  order_index?: number
  created_at: string
  updated_at: string
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED'

export interface Order {
  id: string
  order_number: string
  customer_name: string
  store_name: string
  status: OrderStatus
  store_id: string
  kitchen_id: string
  channel: string
  created_at: string
  updated_at: string
}

export interface TvSettings {
  id?: string
  primary_color: string
  logo_url: string
  store_name?: string
  orders_percentage?: number
  products_percentage?: number
  media_percentage?: number
  auto_rotate_interval?: number
  show_full_name?: boolean
  products_background_color?: string
  device_id?: string
  updated_at?: string
}

// Auth types
export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export type UserRole = 'admin' | 'coordinator'

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  session: AuthSession | null
  loading: boolean
  error: string | null
}

// Legacy type aliases for backward compatibility
export type Media = MediaItem
export type DeviceSettings = TvSettings