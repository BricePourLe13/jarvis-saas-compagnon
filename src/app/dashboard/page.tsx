import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import KPICard from '@/components/dashboard/KPICard'
import { Users, Monitor, Activity, TrendingUp } from 'lucide-react'

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
    .select('role, full_name, email, gym_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.role) {
    redirect('/login')
  }

  return { user, profile }
}

async function getOverviewStats(userId: string, userRole: string, gymId: string | null) {
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

  // Build queries based on role
  const isSuperAdmin = userRole === 'super_admin'

  // Total Gyms (super_admin only)
  let totalGyms = 0
  if (isSuperAdmin) {
    const { count } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    totalGyms = count || 0
  }

  // Total Members
  let membersQuery = supabase
    .from('gym_members_v2')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (!isSuperAdmin && gymId) {
    membersQuery = membersQuery.eq('gym_id', gymId)
  }

  const { count: totalMembers } = await membersQuery
  
  // Total Kiosks
  let kiosksQuery = supabase
    .from('kiosks')
    .select('*', { count: 'exact', head: true })

  if (!isSuperAdmin && gymId) {
    kiosksQuery = kiosksQuery.eq('gym_id', gymId)
  }

  const { count: totalKiosks } = await kiosksQuery

  // Total Sessions (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let sessionsQuery = supabase
    .from('openai_realtime_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('session_started_at', thirtyDaysAgo.toISOString())

  if (!isSuperAdmin && gymId) {
    sessionsQuery = sessionsQuery.eq('gym_id', gymId)
  }

  const { count: totalSessions } = await sessionsQuery

  return {
    totalGyms,
    totalMembers: totalMembers || 0,
    totalKiosks: totalKiosks || 0,
    totalSessions: totalSessions || 0,
  }
}

export default async function DashboardPage() {
  const { user, profile } = await getUser()
  const stats = await getOverviewStats(
    user.id,
    profile.role,
    profile.gym_id
  )

  const isSuperAdmin = profile.role === 'super_admin'

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Utilisateur'}
      userEmail={profile.email}
    >
      <PageHeader
        title="Vue d'ensemble"
        description={`Bienvenue, ${profile.full_name || 'Utilisateur'}`}
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isSuperAdmin && (
              <KPICard
                label="Salles actives"
                value={stats.totalGyms}
                icon={Users}
                description="Salles de sport en activité"
              />
            )}

            <KPICard
              label="Adhérents"
              value={stats.totalMembers}
              icon={Users}
              description="Adhérents actifs"
            />

            <KPICard
              label="Kiosks"
              value={stats.totalKiosks}
              icon={Monitor}
              description="Kiosks déployés"
            />

            <KPICard
              label="Sessions (30j)"
              value={stats.totalSessions}
              icon={Activity}
              description="Sessions vocales"
            />
          </div>

          {/* Placeholder sections */}
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-lg p-8 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Analytics détaillés
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Les graphiques et statistiques avancées seront disponibles prochainement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

