/**
 * ⚡ SUPABASE SINGLETON - Fix pour "Multiple GoTrueClient instances"
 * 
 * Ce singleton garantit qu'une seule instance de Supabase Client
 * est créée dans toute l'application, évitant les conflits.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// 🔒 Instance singleton
let supabaseInstance: SupabaseClient | null = null

/**
 * Obtenir l'instance Supabase unique (côté client)
 */
export function getSupabaseSingleton(): SupabaseClient {
  if (!supabaseInstance) {
    // ✅ Créer une seule fois
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('🔒 [SUPABASE] Instance singleton créée')
  }
  
  return supabaseInstance
}

/**
 * Forcer la recréation de l'instance (pour les tests)
 */
export function resetSupabaseSingleton(): void {
  supabaseInstance = null
  console.log('🔄 [SUPABASE] Singleton reset')
}

/**
 * Vérifier si l'instance existe
 */
export function hasSupabaseInstance(): boolean {
  return supabaseInstance !== null
}