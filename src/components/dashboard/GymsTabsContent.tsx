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
import { Building2, Eye, AlertCircle, MapPin, Calendar, Mail, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import EmptyState from './EmptyState'
import GymApprovalActions from './GymApprovalActions'
import InviteManagerDialog from './InviteManagerDialog'

interface GymsTabsContentProps {
  allGyms: any[]
  pendingGyms: any[]
  invitations: any[]
}

export default function GymsTabsContent({ allGyms, pendingGyms, invitations }: GymsTabsContentProps) {
  const activeGyms = allGyms.filter(g => g.status === 'active')
  const pendingInvitations = invitations.filter(inv => 
    inv.status === 'pending' && new Date(inv.expires_at) > new Date()
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
      case 'pending_approval':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspendue</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInvitationStatusBadge = (status: string, expiresAt: string) => {
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
    return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En attente</Badge>
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <TabsList>
          <TabsTrigger value="all">
            Toutes
            {activeGyms.length > 0 && (
              <Badge variant="outline" className="ml-2 px-2 py-0 text-xs">
                {activeGyms.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente
            {pendingGyms.length > 0 && (
              <Badge className="ml-2 px-2 py-0 text-xs bg-orange-500 hover:bg-orange-600">
                {pendingGyms.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations
            {pendingInvitations.length > 0 && (
              <Badge variant="outline" className="ml-2 px-2 py-0 text-xs">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <InviteManagerDialog />
      </div>

      {/* TAB 1: Toutes les salles */}
      <TabsContent value="all">
        {activeGyms.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucune salle active"
            description="Les salles approuvées apparaîtront ici."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Salles actives ({activeGyms.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Kiosks</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeGyms.map((gym) => {
                    const kioskCount = Array.isArray(gym.kiosks) ? gym.kiosks.length : (gym.kiosks as any)?.count || 0
                    return (
                      <TableRow key={gym.id} className="table-row">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {gym.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {gym.city}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{kioskCount} kiosk{kioskCount > 1 ? 's' : ''}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(gym.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/gyms/${gym.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </Button>
                          </Link>
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

      {/* TAB 2: Salles en attente */}
      <TabsContent value="pending">
        {pendingGyms.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Aucune salle en attente"
            description="Les nouvelles salles créées par les gérants apparaîtront ici."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                {pendingGyms.length} salle{pendingGyms.length > 1 ? 's' : ''} en attente d'approbation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom de la salle</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Gérant</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingGyms.map((gym) => {
                    const manager = Array.isArray(gym.users) ? gym.users[0] : gym.users
                    return (
                      <TableRow key={gym.id} className="table-row">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
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
        )}
      </TabsContent>

      {/* TAB 3: Invitations */}
      <TabsContent value="invitations">
        {invitations.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Aucune invitation"
            description="Commencez par inviter un gérant de salle."
          >
            <InviteManagerDialog />
          </EmptyState>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En attente</p>
                      <p className="text-2xl font-bold">{pendingInvitations.length}</p>
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
                      <p className="text-2xl font-bold">
                        {invitations.filter(inv => inv.status === 'accepted').length}
                      </p>
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
                      <p className="text-2xl font-bold">{invitations.length}</p>
                    </div>
                    <Mail className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Historique des invitations</CardTitle>
              </CardHeader>
              <CardContent>
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
                            {getInvitationStatusBadge(invitation.status, invitation.expires_at)}
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
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>
    </Tabs>
  )
}

