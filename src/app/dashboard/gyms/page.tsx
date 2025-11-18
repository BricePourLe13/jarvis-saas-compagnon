import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import GymsTabsContent from '@/components/dashboard/GymsTabsContent'

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
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return { user, profile }
}

async function getGymsData() {
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

  // Fetch all gyms
  const { data: allGyms } = await supabase
    .from('gyms')
    .select(`
      id,
      name,
      city,
      address,
      postal_code,
      phone,
      status,
      created_at,
      manager_id,
      users!gyms_manager_id_fkey(
        id,
        full_name,
        email
      ),
      kiosks(count)
    `)
    .order('created_at', { ascending: false })

  // Fetch pending gyms
  const { data: pendingGyms } = await supabase
    .from('gyms')
    .select(`
      id,
      name,
      address,
      city,
      postal_code,
      phone,
      created_at,
      manager_id,
      users!gyms_manager_id_fkey(
        id,
        full_name,
        email
      ),
      kiosks(count)
    `)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })

  // Fetch invitations
  const { data: invitations } = await supabase
    .from('manager_invitations')
    .select(`
      id,
      email,
      full_name,
      status,
      expires_at,
      created_at,
      gym_id,
      gyms(name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return {
    allGyms: allGyms || [],
    pendingGyms: pendingGyms || [],
    invitations: invitations || []
  }
}

export default async function GymsPage() {
  const { profile } = await getUser()
  const { allGyms, pendingGyms, invitations } = await getGymsData()

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || profile.email || 'Utilisateur'}
      userEmail={profile.email}
    >
      <PageHeader
        title="Salles de Sport"
        description="Gérez vos salles, approuvez les demandes et envoyez des invitations."
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <GymsTabsContent
            allGyms={allGyms}
            pendingGyms={pendingGyms}
            invitations={invitations}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
