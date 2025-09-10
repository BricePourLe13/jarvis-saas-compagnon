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
    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('🚨 [SUPABASE] Variables d\'environnement manquantes: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    
    // ✅ Créer une seule fois
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
    
    // Supprimer le log en production pour éviter le spam
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 [SUPABASE] Instance singleton créée')
    }
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