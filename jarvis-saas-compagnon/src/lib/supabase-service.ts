/**
 * 🔧 SUPABASE SERVICE ROLE CLIENT
 * 
 * Client spécial avec service_role pour bypasser RLS
 * UNIQUEMENT pour les opérations système (logging, etc.)
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// 🔒 Instance singleton service
let serviceInstance: SupabaseClient | null = null

/**
 * Obtenir l'instance Supabase avec service_role
 */
export function getSupabaseService(): SupabaseClient {
  if (!serviceInstance) {
    // 🔧 TEMP: Utiliser anon en attendant fix RLS
    console.log('🔒 [SUPABASE SERVICE] Utilisation client anon (RLS sera fixé côté Supabase)')
    serviceInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  return serviceInstance!
}
