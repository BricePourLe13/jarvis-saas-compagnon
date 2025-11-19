import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GymDetailsView from '@/components/dashboard/GymDetailsView'

async function getUser() {
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
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return { user, profile }
}

async function getGymDetails(gymId: string) {
  // Utilisation du client Admin pour contourner les RLS sur la table users (manager)
  // car nous avons déjà validé que l'utilisateur est super_admin dans getUser()
  const supabase = createAdminClient()

  // Fetch gym avec informations manager complètes
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('*, manager:users!manager_id(id, email, full_name, phone, is_active, created_at)')
    .eq('id', gymId)
    .single()

  if (gymError || !gym) {
    redirect('/dashboard/gyms')
  }

  // Fetch stats
  const { count: membersCount } = await supabase
    .from('gym_members_v2')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .eq('is_active', true)

  const { count: kiosksCount } = await supabase
    .from('kiosks')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: sessionsCount } = await supabase
    .from('openai_realtime_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .gte('session_started_at', thirtyDaysAgo.toISOString())

  // Fetch kiosks
  const { data: kiosks } = await supabase
    .from('kiosks')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })

  // Fetch members (Initial load - 20 latest)
  const { data: members } = await supabase
    .from('gym_members_v2')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    gym,
    stats: {
      members: membersCount || 0,
      kiosks: kiosksCount || 0,
      sessions: sessionsCount || 0,
    },
    kiosks: kiosks || [],
    members: members || [],
  }
}

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getUser()
  const resolvedParams = await params
  const { gym, stats, kiosks, members } = await getGymDetails(resolvedParams.id)

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Admin'}
      userEmail={profile.email}
    >
      <GymDetailsView
        gym={gym}
        stats={stats}
        kiosks={kiosks}
        members={members}
        manager={gym.manager || null}
      />
    </DashboardLayout>
  )
}
