import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import { getDashboardUser } from '@/lib/dashboard-user'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfileSettings from '@/components/dashboard/settings/ProfileSettings'
import SecuritySettings from '@/components/dashboard/settings/SecuritySettings'
import NotificationSettings from '@/components/dashboard/settings/NotificationSettings'

export default async function SettingsPage() {
  const { user, profile, gymName } = await getDashboardUser()

  return (
    <DashboardLayout
      userRole={profile.role}
      userName={profile.full_name || 'Utilisateur'}
      userEmail={profile.email}
      gymName={gymName || undefined}
    >
      <PageHeader
        title="Paramètres"
        description="Gérez votre profil, sécurité et préférences"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white border border-border">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings
            user={user}
            profile={profile}
            gymName={gymName}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings
            userId={user.id}
            userRole={profile.role}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings
            userId={user.id}
            userEmail={profile.email}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

