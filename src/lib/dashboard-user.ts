import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * 🔐 HELPER: Get authenticated user + profile + gym name
 * 
 * Centralisé pour toutes les pages dashboard
 * Gère automatiquement :
 * - Redirection si non authentifié
 * - Redirection onboarding si manager sans salle
 * - Fetch gym name pour managers
 */
export async function getDashboardUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component, ignore
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email, gym_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.role) {
    redirect('/login')
  }

  // ✅ ONBOARDING CHECK : Si manager sans salle -> Redirection création
  if (profile.role === 'gym_manager' && !profile.gym_id) {
    redirect('/dashboard/onboarding')
  }

  // Fetch gym name for managers
  let gymName: string | null = null
  if (profile.role === 'gym_manager' && profile.gym_id) {
    const { data: gym } = await supabase
      .from('gyms')
      .select('name')
      .eq('id', profile.gym_id)
      .single()
    gymName = gym?.name || null
  }

  return { 
    user, 
    profile: {
      ...profile,
      role: profile.role as 'super_admin' | 'gym_manager'
    }, 
    gymName 
  }
}

