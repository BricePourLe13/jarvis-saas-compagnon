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
    // Vérifier que les variables d'environnement sont disponibles
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('🚨 [SUPABASE SERVICE] Variables d\'environnement manquantes')
    }
    
    // 🔒 Utiliser service_role pour bypasser RLS
    console.log('🔒 [SUPABASE SERVICE] Utilisation service_role pour bypass RLS')
    serviceInstance = createClient(
      supabaseUrl,
      serviceKey,
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
