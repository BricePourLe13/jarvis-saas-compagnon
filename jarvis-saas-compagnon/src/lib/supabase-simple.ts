import { createBrowserClient } from '@supabase/ssr'

// Simple client-side Supabase client
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export { createClient }
