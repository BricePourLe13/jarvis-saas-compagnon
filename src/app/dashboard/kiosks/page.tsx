import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
import { Monitor } from 'lucide-react'

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

async function getKiosks(userRole: string, gymId: string | null) {
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

  let query = supabase
    .from('kiosks')
    .select(`
      *,
      gyms (name)
    `)
    .order('created_at', { ascending: false })

  if (userRole !== 'super_admin' && gymId) {
    query = query.eq('gym_id', gymId)
  }

  const { data: kiosks, error } = await query

  if (error) {
    console.error('Error fetching kiosks:', error)
    return []
  }

  return kiosks || []
}

export default async function KiosksPage() {
  const { profile } = await getUser()
  const kiosks = await getKiosks(profile.role, profile.gym_id)

  const getStatusBadgeClass = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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
      userName={profile.full_name || 'Utilisateur'}
      userEmail={profile.email}
    >
      <PageHeader
        title="Kiosks JARVIS"
        description="Gérez et surveillez vos kiosks JARVIS"
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {kiosks.length === 0 ? (
            <EmptyState
              icon={Monitor}
              title="Aucun kiosk"
              description="Les kiosks JARVIS seront listés ici une fois déployés"
            />
          ) : (
            <div className="bg-white border border-border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Slug
                    </th>
                    {profile.role === 'super_admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Salle
                      </th>
                    )}
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
                      {profile.role === 'super_admin' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {kiosk.gyms?.name || 'N/A'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadgeClass(kiosk.status)}>
                          {getStatusLabel(kiosk.status)}
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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

