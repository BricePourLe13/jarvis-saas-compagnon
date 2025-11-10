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
      gyms: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          postal_code: string
          phone: string | null
          kiosk_config: Json
          opening_hours: Json
          features: string[]
          manager_id: string | null
          status: string
          created_at: string
          updated_at: string
          legacy_franchise_name: string | null
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          postal_code: string
          phone?: string | null
          kiosk_config?: Json
          opening_hours?: Json
          features?: string[]
          manager_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          legacy_franchise_name?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          postal_code?: string
          phone?: string | null
          kiosk_config?: Json
          opening_hours?: Json
          features?: string[]
          manager_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          legacy_franchise_name?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'super_admin' | 'gym_manager' | 'member'
          gym_access: string[] | null
          dashboard_preferences: Json | null
          notification_settings: Json | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'super_admin' | 'gym_manager'
          gym_access?: string[] | null
          dashboard_preferences?: Json | null
          notification_settings?: Json | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'super_admin' | 'gym_manager'
          gym_access?: string[] | null
          dashboard_preferences?: Json | null
          notification_settings?: Json | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      kiosk_sessions: {
        Row: {
          id: string
          gym_id: string
          user_email: string | null
          user_name: string | null
          session_type: 'anonymous' | 'registered'
          interaction_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gym_id: string
          user_email?: string | null
          user_name?: string | null
          session_type: 'anonymous' | 'registered'
          interaction_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gym_id?: string
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
