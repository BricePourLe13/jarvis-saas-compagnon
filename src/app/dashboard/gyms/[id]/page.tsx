import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import KPICard from '@/components/dashboard/KPICard'
import { Button } from '@/components/ui/button'
import { Users, Monitor, Activity, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

  // Fetch gym
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('*')
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

  return {
    gym,
    stats: {
      members: membersCount || 0,
      kiosks: kiosksCount || 0,
      sessions: sessionsCount || 0,
    },
    kiosks: kiosks || [],
  }
}

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getUser()
  const resolvedParams = await params
  const { gym, stats, kiosks } = await getGymDetails(resolvedParams.id)

  const getKioskStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return 'badge-success'
      case 'offline':
        return 'badge-error'
      case 'provisioning':
        return 'badge-info'
      case 'maintenance':
        return 'badge-warning'
      default:
        return 'badge-neutral'
    }
  }

  const getKioskStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'En ligne'
      case 'offline':
        return 'Hors ligne'
      case 'provisioning':
        return 'Provisioning'
      case 'maintenance':
        return 'Maintenance'
      default:
        return status
    }
  }

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Admin'}
      userEmail={profile.email}
    >
      <PageHeader
        title={gym.name}
        description={`${gym.address}, ${gym.postal_code} ${gym.city}`}
        actions={
          <Link href="/dashboard/gyms">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              label="Adhérents"
              value={stats.members}
              icon={Users}
              description="Adhérents actifs"
            />
            <KPICard
              label="Kiosks"
              value={stats.kiosks}
              icon={Monitor}
              description="Kiosks déployés"
            />
            <KPICard
              label="Sessions (30j)"
              value={stats.sessions}
              icon={Activity}
              description="Sessions vocales"
            />
          </div>

          {/* Kiosks List */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">
                Kiosks JARVIS
              </h3>
            </div>
            {kiosks.length === 0 ? (
              <div className="p-8 text-center">
                <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Aucun kiosk déployé pour cette salle
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Dernière activité
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kiosks.map((kiosk: any) => (
                    <tr key={kiosk.id} className="table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {kiosk.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {kiosk.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getKioskStatusBadge(kiosk.status)}>
                          {getKioskStatusLabel(kiosk.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {kiosk.last_heartbeat
                            ? new Date(kiosk.last_heartbeat).toLocaleString('fr-FR')
                            : 'Jamais'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

