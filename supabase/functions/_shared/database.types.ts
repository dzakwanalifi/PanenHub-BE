export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      group_buy_campaigns: {
        Row: {
          id: string
          product_id: string
          store_id: string
          group_price: number
          target_quantity: number
          current_quantity: number
          start_date: string
          end_date: string
          status: 'active' | 'successful' | 'failed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          store_id: string
          group_price: number
          target_quantity: number
          current_quantity?: number
          start_date?: string
          end_date: string
          status?: 'active' | 'successful' | 'failed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          store_id?: string
          group_price?: number
          target_quantity?: number
          current_quantity?: number
          start_date?: string
          end_date?: string
          status?: 'active' | 'successful' | 'failed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      group_buy_participants: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          quantity: number
          total_price: number
          payment_status: 'pending' | 'paid' | 'refunded'
          tripay_reference: string | null
          order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          quantity: number
          total_price: number
          payment_status?: 'pending' | 'paid' | 'refunded'
          tripay_reference?: string | null
          order_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          quantity?: number
          total_price?: number
          payment_status?: 'pending' | 'paid' | 'refunded'
          tripay_reference?: string | null
          order_id?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          store_id: string
          status: string
          total_amount: number
          payment_status: string
          payment_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id: string
          status: string
          total_amount: number
          payment_status: string
          payment_reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string
          status?: string
          total_amount?: number
          payment_status?: string
          payment_reference?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
    }
  }
} 