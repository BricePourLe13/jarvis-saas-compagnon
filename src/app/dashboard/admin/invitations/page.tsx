import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Mail, UserPlus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import InviteManagerDialog from '@/components/dashboard/InviteManagerDialog'

export default async function InvitationsPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: any) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()
    
  if (userProfile?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Fetch all invitations
  const { data: invitations, error } = await supabase
    .from('manager_invitations')
    .select(`
      id,
      email,
      full_name,
      token,
      status,
      expires_at,
      created_at,
      gym_id,
      gyms(name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching invitations:', error)
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const isExpired = expires < now

    if (status === 'accepted') {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Acceptée</Badge>
    }
    if (status === 'revoked') {
      return <Badge variant="destructive">Révoquée</Badge>
    }
    if (status === 'expired' || isExpired) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700">Expirée</Badge>
    }
    return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>
  }

  const pendingCount = invitations?.filter(inv => 
    inv.status === 'pending' && new Date(inv.expires_at) > new Date()
  ).length || 0

  const acceptedCount = invitations?.filter(inv => inv.status === 'accepted').length || 0

  return (
    <DashboardLayout
      userRole={userProfile.role as 'super_admin' | 'gym_manager'}
      userName={userProfile.full_name || userProfile.email || 'Utilisateur'}
      userEmail={userProfile.email || ''}
    >
      <PageHeader
        title="Invitations Gérants"
        description="Invitez et gérez les gérants de salles de sport."
      >
        <InviteManagerDialog />
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acceptées</p>
                <p className="text-2xl font-bold">{acceptedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{invitations?.length || 0}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {invitations && invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Historique des invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gérant</TableHead>
                    <TableHead>Salle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Envoyée le</TableHead>
                    <TableHead>Expire le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => {
                    const gym = Array.isArray(invitation.gyms) ? invitation.gyms[0] : invitation.gyms
                    return (
                      <TableRow key={invitation.id} className="table-row">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{invitation.full_name}</span>
                            <span className="text-xs text-muted-foreground">{invitation.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {gym ? (
                            <span className="text-sm">{gym.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">À définir</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invitation.status, invitation.expires_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Mail}
          title="Aucune invitation"
          description="Commencez par inviter un gérant de salle."
        >
          <InviteManagerDialog />
        </EmptyState>
      )}
    </DashboardLayout>
  )
}


