import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import KiosksTabsContent from '@/components/dashboard/KiosksTabsContent'

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

async function getKiosksData(userRole: string, gymId: string | null) {
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

  // Fetch all kiosks (not pending)
  let allKiosksQuery = supabase
    .from('kiosks')
    .select(`
      *,
      gyms (
        name,
        manager_id,
        users!gyms_manager_id_fkey (
          full_name,
          email
        )
      )
    `)
    .neq('status', 'pending_approval')
    .order('created_at', { ascending: false })

  if (userRole !== 'super_admin' && gymId) {
    allKiosksQuery = allKiosksQuery.eq('gym_id', gymId)
  }

  const { data: allKiosks } = await allKiosksQuery

  // Fetch pending kiosks (super admin only)
  let pendingKiosks: any[] = []
  if (userRole === 'super_admin') {
    const { data } = await supabase
      .from('kiosks')
      .select(`
        *,
        gyms (
          name,
          city,
          manager_id,
          users!gyms_manager_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
    
    pendingKiosks = data || []
  }

  return {
    allKiosks: allKiosks || [],
    pendingKiosks
  }
}

export default async function KiosksPage() {
  const { profile } = await getUser()
  const { allKiosks, pendingKiosks } = await getKiosksData(profile.role, profile.gym_id)

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Utilisateur'}
      userEmail={profile.email}
    >
      <PageHeader
        title="Kiosks JARVIS"
        description="Gérez et surveillez vos kiosks JARVIS."
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <KiosksTabsContent
            allKiosks={allKiosks}
            pendingKiosks={pendingKiosks}
            userRole={profile.role}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
