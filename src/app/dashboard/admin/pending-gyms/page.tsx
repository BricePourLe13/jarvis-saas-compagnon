import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
import GymApprovalActions from '@/components/dashboard/GymApprovalActions'
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
import { Building, AlertCircle, Calendar, MapPin } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PendingGymsPage() {
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

  const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userProfile?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Fetch pending gyms
  const { data: pendingGyms, error } = await supabase
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

  if (error) {
    console.error('Error fetching pending gyms:', error)
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Salles en attente d'approbation"
        description="Gérez les nouvelles salles créées par les gérants."
      />

      {pendingGyms && pendingGyms.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                {pendingGyms.length} salle{pendingGyms.length > 1 ? 's' : ''} en attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom de la salle</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Gérant</TableHead>
                    <TableHead>Kiosks</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingGyms.map((gym) => {
                    const manager = Array.isArray(gym.users) ? gym.users[0] : gym.users
                    const kioskCount = Array.isArray(gym.kiosks) ? gym.kiosks.length : (gym.kiosks as any)?.count || 0

                    return (
                      <TableRow key={gym.id} className="table-row">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {gym.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {gym.city}, {gym.postal_code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{manager?.full_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{manager?.email || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{kioskCount} kiosk{kioskCount > 1 ? 's' : ''}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(gym.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <GymApprovalActions gymId={gym.id} gymName={gym.name} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Informations complémentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ℹ️ Processus d'approbation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Approuver une salle :</strong> La salle passera au statut "active" et le gérant pourra 
                provisionner ses kiosks et ajouter des adhérents.
              </p>
              <p>
                <strong>Rejeter une salle :</strong> La salle passera au statut "cancelled" et le gérant sera 
                notifié. Vous devrez fournir une raison du rejet.
              </p>
              <p className="text-xs text-orange-600">
                ⚠️ Les actions d'approbation/rejet sont irréversibles. Vérifiez bien les informations avant de valider.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Building}
          title="Aucune salle en attente"
          description="Toutes les salles créées par les gérants ont été traitées."
        />
      )}
    </DashboardLayout>
  )
}

