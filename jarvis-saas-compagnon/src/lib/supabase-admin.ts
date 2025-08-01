import { createClient } from '@supabase/supabase-js'
import { createServerClient, createBrowserClient } from '@supabase/ssr'

// ===========================================
// 🔧 CONFIGURATION CENTRALISÉE
// ===========================================

/**
 * Centralisation des variables d'environnement pour éviter les redondances
 */
export const getEnvironmentConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jarvis-group.net'

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables d\'environnement Supabase manquantes: NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis')
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey,
    appUrl
  }
}

// ===========================================
// 🗄️ CLIENTS SUPABASE UNIFIÉS  
// ===========================================

/**
 * Client simple pour l'authentification et les requêtes de base
 */
function createSimpleClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnvironmentConfig()
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Client admin avec privilèges service role pour les opérations administratives
 */
function createAdminClient() {
  const { supabaseUrl, supabaseServiceKey } = getEnvironmentConfig()
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant - requis pour les opérations admin (invitations, etc.)')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Client Server avec gestion des cookies (pour les APIs Next.js)
 */
function createServerClientWithConfig(cookieStore: unknown) {
  const { supabaseUrl, supabaseAnonKey } = getEnvironmentConfig()
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Client Browser pour les composants côté client
 */
function createBrowserClientWithConfig() {
  const { supabaseUrl, supabaseAnonKey } = getEnvironmentConfig()
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}

export { 
  createSimpleClient, 
  createAdminClient, 
  createServerClientWithConfig,
  createBrowserClientWithConfig
}
