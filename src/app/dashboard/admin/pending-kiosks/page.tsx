import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
import KioskApprovalActions from '@/components/dashboard/KioskApprovalActions'
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
import { Monitor, AlertCircle, Calendar, MapPin, Building } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PendingKiosksPage() {
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

  // Fetch pending kiosks
  const { data: pendingKiosks, error } = await supabase
    .from('kiosks')
    .select(`
      id,
      name,
      slug,
      location_in_gym,
      provisioning_code_expires_at,
      hardware_info,
      last_heartbeat,
      created_at,
      gym_id,
      gyms!inner(
        id,
        name,
        city,
        manager_id,
        users!gyms_manager_id_fkey(
          full_name,
          email
        )
      )
    `)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending kiosks:', error)
  }

  return (
    <DashboardLayout
      userRole={userProfile.role as 'super_admin' | 'gym_manager'}
      userName={user.user_metadata?.full_name || user.email || 'Utilisateur'}
      userEmail={user.email || ''}
    >
      <PageHeader
        title="Kiosks en attente d'approbation"
        description="Validez les kiosks provisionnés par les gérants."
      />

      {pendingKiosks && pendingKiosks.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                {pendingKiosks.length} kiosk{pendingKiosks.length > 1 ? 's' : ''} en attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du kiosk</TableHead>
                    <TableHead>Salle</TableHead>
                    <TableHead>Emplacement</TableHead>
                    <TableHead>Hardware</TableHead>
                    <TableHead>Dernier heartbeat</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingKiosks.map((kiosk) => {
                    const gym = kiosk.gyms as any
                    const manager = gym?.users
                    const hardwareInfo = kiosk.hardware_info as any
                    const lastHeartbeat = kiosk.last_heartbeat 
                      ? new Date(kiosk.last_heartbeat)
                      : null
                    const isOnline = lastHeartbeat && (Date.now() - lastHeartbeat.getTime()) < 5 * 60 * 1000 // 5min

                    return (
                      <TableRow key={kiosk.id} className="table-row">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div>{kiosk.name}</div>
                              <div className="text-xs text-muted-foreground">{kiosk.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{gym?.name || 'N/A'}</span>
                              <span className="text-xs text-muted-foreground">{gym?.city}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {kiosk.location_in_gym || 'Non spécifié'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {hardwareInfo?.screen_resolution ? (
                            <div className="text-sm">
                              <div className="font-medium">{hardwareInfo.screen_resolution}</div>
                              <div className="text-xs text-muted-foreground">
                                {hardwareInfo.browser_info?.userAgent?.includes('Chrome') ? 'Chrome' : 
                                 hardwareInfo.browser_info?.userAgent?.includes('Firefox') ? 'Firefox' :
                                 hardwareInfo.browser_info?.userAgent?.includes('Safari') ? 'Safari' : 'Browser'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">En attente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isOnline ? (
                            <Badge className="badge-success">
                              🟢 En ligne
                            </Badge>
                          ) : lastHeartbeat ? (
                            <Badge variant="outline" className="text-xs">
                              Il y a {Math.round((Date.now() - lastHeartbeat.getTime()) / 60000)}min
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Jamais</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(kiosk.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <KioskApprovalActions kioskId={kiosk.id} kioskName={kiosk.name} />
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
                <strong>Approuver un kiosk :</strong> Le kiosk passera au statut "online" et sera opérationnel 
                pour les adhérents. Le gérant pourra commencer à l'utiliser.
              </p>
              <p>
                <strong>Rejeter un kiosk :</strong> Le kiosk passera au statut "error" et le gérant devra 
                le reconfigurer. Vérifiez les informations hardware avant de valider.
              </p>
              <p>
                <strong>Heartbeat :</strong> Assurez-vous que le kiosk est bien en ligne (🟢) avant d'approuver. 
                Cela confirme que l'appareil est correctement configuré.
              </p>
              <p className="text-xs text-orange-600">
                ⚠️ Un kiosk approuvé sera immédiatement accessible aux adhérents de la salle.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Monitor}
          title="Aucun kiosk en attente"
          description="Tous les kiosks provisionnés ont été traités."
        />
      )}
    </DashboardLayout>
  )
}

