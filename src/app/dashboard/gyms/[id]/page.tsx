import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GymDetailsView from '@/components/dashboard/GymDetailsView'
import { logger } from '@/lib/production-logger'

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
  // ✅ Utiliser Admin Client pour bypasser RLS et garantir l'accès aux données
  const supabaseAdmin = createAdminClient()

  // 1. Fetch gym details
  const { data: gym, error: gymError } = await supabaseAdmin
    .from('gyms')
    .select('*')
    .eq('id', gymId)
    .single()

  if (gymError || !gym) {
    logger.error(`❌ [GYM_DETAILS] Erreur fetching gym ${gymId}:`, { error: gymError?.message }, { component: 'GymDetailsPage' })
    redirect('/dashboard/gyms')
  }

  // 2. Fetch manager details separately if manager_id exists
  let manager = null
  if (gym.manager_id) {
    console.log(`🔍 [GYM_DETAILS] Recherche manager pour gym ${gym.name} (ID: ${gym.manager_id})`)
    
    const { data: managerData, error: managerError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, is_active, created_at')
      .eq('id', gym.manager_id)
      .single()

    if (managerError) {
      console.error(`⚠️ [GYM_DETAILS] Erreur fetching manager ${gym.manager_id}:`, managerError)
      logger.warn(`⚠️ [GYM_DETAILS] Erreur fetching manager ${gym.manager_id}:`, { error: managerError?.message }, { component: 'GymDetailsPage' })
    } else {
      manager = managerData
      console.log(`✅ [GYM_DETAILS] Manager trouvé:`, managerData)
      logger.info(`✅ [GYM_DETAILS] Manager trouvé: ${managerData.email}`, {}, { component: 'GymDetailsPage' })
    }
  } else {
    console.warn(`⚠️ [GYM_DETAILS] Aucun manager_id défini pour la gym ${gym.name}`)
    logger.warn(`⚠️ [GYM_DETAILS] Aucun manager_id défini pour la gym ${gym.name}`, {}, { component: 'GymDetailsPage' })
  }

  // Fetch stats
  const { count: membersCount } = await supabaseAdmin
    .from('gym_members_v2')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .eq('is_active', true)

  const { count: kiosksCount } = await supabaseAdmin
    .from('kiosks')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: sessionsCount } = await supabaseAdmin
    .from('openai_realtime_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .gte('session_started_at', thirtyDaysAgo.toISOString())

  // Fetch kiosks
  const { data: kiosks } = await supabaseAdmin
    .from('kiosks')
    .select('*')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })

  // Fetch members (Initial load - 20 latest)
  const { data: members } = await supabaseAdmin
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
    manager: manager, // Pass manager data
  }
}

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getUser()
  const resolvedParams = await params
  const { gym, stats, kiosks, members, manager } = await getGymDetails(resolvedParams.id)

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
        manager={manager} // Pass manager data
      />
    </DashboardLayout>
  )
}
