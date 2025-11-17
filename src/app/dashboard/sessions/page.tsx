import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
import { Activity } from 'lucide-react'

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

  if (!profile || !profile.role) {
    redirect('/login')
  }

  return { user, profile }
}

export default async function SessionsPage() {
  const { profile } = await getUser()

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Utilisateur'}
      userEmail={profile.email}
    >
      <PageHeader
        title="Sessions"
        description="Consultez l'historique des sessions vocales JARVIS"
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={Activity}
            title="Page en développement"
            description="L'historique complet des sessions avec transcriptions sera bientôt disponible"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

