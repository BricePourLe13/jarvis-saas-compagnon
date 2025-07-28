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
      franchises: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          postal_code: string
          email: string
          phone: string
          owner_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          postal_code: string
          email: string
          phone: string
          owner_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          postal_code?: string
          email?: string
          phone?: string
          owner_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      gyms: {
        Row: {
          id: string
          franchise_id: string
          name: string
          address: string
          city: string
          postal_code: string
          kiosk_config: Json
          opening_hours: Json
          features: string[]
          manager_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          franchise_id: string
          name: string
          address: string
          city: string
          postal_code: string
          kiosk_config?: Json
          opening_hours?: Json
          features?: string[]
          manager_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          franchise_id?: string
          name?: string
          address?: string
          city?: string
          postal_code?: string
          kiosk_config?: Json
          opening_hours?: Json
          features?: string[]
          manager_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'super_admin' | 'franchise_owner' | 'franchise_admin' | 'user'
          franchise_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'super_admin' | 'franchise_owner' | 'franchise_admin' | 'user'
          franchise_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'super_admin' | 'franchise_owner' | 'franchise_admin' | 'user'
          franchise_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      kiosk_sessions: {
        Row: {
          id: string
          franchise_id: string
          user_email: string | null
          user_name: string | null
          session_type: 'anonymous' | 'registered'
          interaction_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          franchise_id: string
          user_email?: string | null
          user_name?: string | null
          session_type: 'anonymous' | 'registered'
          interaction_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          franchise_id?: string
          user_email?: string | null
          user_name?: string | null
          session_type?: 'anonymous' | 'registered'
          interaction_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
