export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'HR' | 'SUPERVISOR' | 'ADMIN_GUDANG' | 'PACKING' | 'MANAGER'
export type UserStatus = 'active' | 'inactive'
export type ProductUnit = 'pcs' | 'dus'

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PACKING' | 'SHIPPED' | 'COMPLETED'
export type OrderType = 'INBOUND' | 'OUTBOUND'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  status: UserStatus
  created_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  stock: number
  unit: ProductUnit
  price_retail: number
  price_wholesale: number
  min_stock_threshold: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  type: OrderType
  status: OrderStatus
  created_by: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  created_at: string
}

export interface Attendance {
  id: string
  user_id: string
  check_in: string | null
  check_out: string | null
  date: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          status?: UserStatus
          created_at?: string
        }
        Update: {
          full_name?: string
          role?: UserRole
          status?: UserStatus
        }
        Relationships: []
      }
      products: {
        Row: Product
        Insert: {
          id?: string
          sku: string
          name: string
          stock?: number
          unit?: ProductUnit
          price_retail?: number
          price_wholesale?: number
          min_stock_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          sku?: string
          name?: string
          stock?: number
          unit?: ProductUnit
          price_retail?: number
          price_wholesale?: number
          min_stock_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: Order
        Insert: {
          id?: string
          type: OrderType
          status?: OrderStatus
          created_by: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: OrderType
          status?: OrderStatus
          created_by?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: OrderItem
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          order_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      attendance: {
        Row: Attendance
        Insert: {
          id?: string
          user_id: string
          check_in?: string | null
          check_out?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      v_product_stock_status: {
        Row: {
          id: string
          sku: string
          name: string
          stock: number
          unit: ProductUnit
          min_stock_threshold: number
          price_retail: number
          price_wholesale: number
          stock_status: string
        }
        Relationships: []
      }
      v_orders_today: {
        Row: {
          id: string
          type: OrderType
          status: OrderStatus
          created_by_name: string | null
          total_items: number
          created_at: string
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      product_unit: ProductUnit
      order_type: OrderType
      order_status: OrderStatus
    }
    CompositeTypes: Record<string, never>
  }
}
