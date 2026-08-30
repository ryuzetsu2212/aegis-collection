export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'staff' | 'courier' | 'user'
export type OrderStatus = 'pending' | 'pending_confirmation' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
export type PurchaseType = 'direct' | 'online'
export type PaymentMethod = 'cash' | 'cash_store' | 'cod' | 'bank_transfer' | 'dana' | 'ovo' | 'qris' | (string & {})
export type PaymentStatus = 'unpaid' | 'pending_confirmation' | 'paid'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          title: string
          slug: string
          description: string | null
          price: number
          image_url: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          title: string
          slug: string
          description?: string | null
          price: number
          image_url: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          title?: string
          slug?: string
          description?: string | null
          price?: number
          image_url?: string
          is_active?: boolean
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          size: string | null
          color: string
          stock: number
        }
        Insert: {
          id?: string
          product_id: string
          size?: string | null
          color: string
          stock?: number
        }
        Update: {
          id?: string
          product_id?: string
          size?: string | null
          color?: string
          stock?: number
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: OrderStatus
          purchase_type: PurchaseType
          payment_method: PaymentMethod
          payment_proof_url: string | null
          payment_status: PaymentStatus
          tracking_number: string | null
          shipping_address: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status?: OrderStatus
          purchase_type?: PurchaseType
          payment_method?: PaymentMethod
          payment_proof_url?: string | null
          payment_status?: PaymentStatus
          tracking_number?: string | null
          shipping_address: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: OrderStatus
          purchase_type?: PurchaseType
          payment_method?: PaymentMethod
          payment_proof_url?: string | null
          payment_status?: PaymentStatus
          tracking_number?: string | null
          shipping_address?: string
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          variant_id: string
          quantity: number
          price_at_purchase: number
        }
        Insert: {
          id?: string
          order_id: string
          variant_id: string
          quantity: number
          price_at_purchase: number
        }
        Update: {
          id?: string
          order_id?: string
          variant_id?: string
          quantity?: number
          price_at_purchase?: number
        }
      }
    }
  }
}
