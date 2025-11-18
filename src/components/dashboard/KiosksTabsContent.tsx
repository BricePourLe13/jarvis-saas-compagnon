"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Monitor, ExternalLink, AlertCircle, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import EmptyState from './EmptyState'
import KioskApprovalActions from './KioskApprovalActions'

interface KiosksTabsContentProps {
  allKiosks: any[]
  pendingKiosks: any[]
  userRole: string
}

export default function KiosksTabsContent({ allKiosks, pendingKiosks, userRole }: KiosksTabsContentProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-700 border-green-200">En ligne</Badge>
      case 'offline':
        return <Badge variant="destructive">Hors ligne</Badge>
      case 'provisioning':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Provisioning</Badge>
      case 'maintenance':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Maintenance</Badge>
      case 'pending_approval':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="all">
          Tous
          {allKiosks.length > 0 && (
            <Badge variant="outline" className="ml-2 px-2 py-0 text-xs">
              {allKiosks.length}
            </Badge>
          )}
        </TabsTrigger>
        {userRole === 'super_admin' && (
          <TabsTrigger value="pending">
            À valider
            {pendingKiosks.length > 0 && (
              <Badge className="ml-2 px-2 py-0 text-xs bg-orange-500 hover:bg-orange-600">
                {pendingKiosks.length}
              </Badge>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      {/* TAB 1: Tous les kiosks */}
      <TabsContent value="all">
        {allKiosks.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="Aucun kiosk"
            description="Les kiosks JARVIS seront listés ici une fois déployés."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Kiosks actifs ({allKiosks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    {userRole === 'super_admin' && <TableHead>Salle</TableHead>}
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allKiosks.map((kiosk: any) => (
                    <TableRow key={kiosk.id} className="table-row">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          {kiosk.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground font-mono">
                          {kiosk.slug}
                        </div>
                      </TableCell>
                      {userRole === 'super_admin' && (
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {kiosk.gyms?.name || 'N/A'}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {getStatusBadge(kiosk.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {kiosk.last_heartbeat
                            ? new Date(kiosk.last_heartbeat).toLocaleString('fr-FR')
                            : 'Jamais'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/kiosk/${kiosk.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ouvrir
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* TAB 2: Kiosks à valider (super admin only) */}
      {userRole === 'super_admin' && (
        <TabsContent value="pending">
          {pendingKiosks.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Aucun kiosk en attente"
              description="Les kiosks provisionnés par les gérants apparaîtront ici."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  {pendingKiosks.length} kiosk{pendingKiosks.length > 1 ? 's' : ''} en attente de validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Salle</TableHead>
                      <TableHead>Gérant</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingKiosks.map((kiosk: any) => {
                      const gym = Array.isArray(kiosk.gyms) ? kiosk.gyms[0] : kiosk.gyms
                      const manager = gym?.users ? (Array.isArray(gym.users) ? gym.users[0] : gym.users) : null
                      return (
                        <TableRow key={kiosk.id} className="table-row">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                              {kiosk.name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              {kiosk.slug}
                            </div>
                          </TableCell>
                          <TableCell>
                            {gym ? (
                              <div>
                                <div className="text-sm font-medium">{gym.name}</div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {gym.city}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {manager ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{manager.full_name || 'N/A'}</span>
                                <span className="text-xs text-muted-foreground">{manager.email || 'N/A'}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Aucun gérant</span>
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
          )}
        </TabsContent>
      )}
    </Tabs>
  )
}

