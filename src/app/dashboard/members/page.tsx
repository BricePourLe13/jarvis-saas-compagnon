import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import { getDashboardUser } from '@/lib/dashboard-user'
import ImportMembersDialog from '@/components/dashboard/ImportMembersDialog'
import MembersList from '@/components/dashboard/MembersList'
import { createAdminClient } from '@/lib/supabase-admin'

async function getMembers(gymId: string | null) {
  if (!gymId) return []

  // Utilisation de admin client pour bypasser RLS au cas où
  // Mais en théorie le user connecté devrait pouvoir lire ses membres via RLS
  // On reste safe avec createAdminClient pour l'affichage serveur
  const supabase = createAdminClient()

  const { data: members } = await supabase
    .from('gym_members_v2')
    .select('id, first_name, last_name, email, badge_id, is_active, member_since, last_visit')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })
    .limit(100) // Pagination à venir

  return members || []
}

export default async function MembersPage() {
  const { user, profile, gymName } = await getDashboardUser()

  // Redirection si pas de gym (sauf super admin qui peut voir vide)
  if (profile.role === 'gym_manager' && !profile.gym_id) {
    redirect('/dashboard/onboarding')
  }

  const members = await getMembers(profile.gym_id)

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Utilisateur'}
      userEmail={profile.email}
      gymName={gymName || undefined}
    >
      <PageHeader
        title="Adhérents"
        description={`Gérez les adhérents de ${gymName || 'votre salle'}`}
      >
        {profile.gym_id && (
          <ImportMembersDialog 
            gymId={profile.gym_id} 
            onSuccess={async () => {
              'use server'
              // Server action pattern ou simple refresh client
            }} 
          />
        )}
      </PageHeader>

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <MembersList initialMembers={members} />
        </div>
      </div>
    </DashboardLayout>
  )
}
