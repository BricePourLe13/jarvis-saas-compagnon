import { createClient } from '@supabase/supabase-js'

// Client simple pour l'authentification et les requêtes de base
function createSimpleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export { createSimpleClient }
