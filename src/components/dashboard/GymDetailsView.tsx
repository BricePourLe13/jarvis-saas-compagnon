'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Monitor, 
  Activity, 
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/dashboard/PageHeader'
import KPICard from '@/components/dashboard/KPICard'
import { Badge } from '@/components/ui/badge'
import CreateKioskDialog from '@/components/dashboard/CreateKioskDialog'

interface GymDetailsViewProps {
  gym: any
  stats: {
    members: number
    kiosks: number
    sessions: number
  }
  kiosks: any[]
  members: any[] // Initial members
}

export default function GymDetailsView({ gym, stats, kiosks, members }: GymDetailsViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const getKioskStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'default' // bg-primary
      case 'offline': return 'destructive'
      case 'provisioning': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <>
      <PageHeader
        title={gym.name}
        description={`${gym.address}, ${gym.postal_code} ${gym.city}`}
        actions={
          <Link href="/dashboard/gyms">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />

      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="kiosks">Kiosks ({kiosks.length})</TabsTrigger>
              <TabsTrigger value="members">Adhérents ({stats.members})</TabsTrigger>
            </TabsList>

            {/* ONGLET VUE D'ENSEMBLE */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                  label="Adhérents"
                  value={stats.members}
                  icon={Users}
                  description="Actifs"
                />
                <KPICard
                  label="Kiosks"
                  value={stats.kiosks}
                  icon={Monitor}
                  description="Déployés"
                />
                <KPICard
                  label="Sessions (30j)"
                  value={stats.sessions}
                  icon={Activity}
                  description="Vocales"
                />
              </div>
              
              <div className="bg-white border border-border rounded-lg p-6">
                 <h3 className="text-lg font-medium mb-4">Informations</h3>
                 <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email Gérant</dt>
                      <dd className="mt-1 text-sm text-gray-900">{gym.manager?.email || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{gym.phone || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                      <dd className="mt-1 text-sm text-gray-900">{new Date(gym.created_at).toLocaleDateString('fr-FR')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Statut</dt>
                      <dd className="mt-1">
                         <Badge variant={gym.status === 'active' ? 'default' : 'secondary'}>
                           {gym.status}
                         </Badge>
                      </dd>
                    </div>
                 </dl>
              </div>
            </TabsContent>

            {/* ONGLET KIOSKS */}
            <TabsContent value="kiosks">
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-medium text-foreground">Kiosks</h3>
                  <CreateKioskDialog gymId={gym.id} gymName={gym.name} />
                </div>
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dernière activité</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {kiosks.map((kiosk) => (
                      <tr key={kiosk.id}>
                        <td className="px-6 py-4 text-sm font-medium">{kiosk.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{kiosk.slug}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant={getKioskStatusBadge(kiosk.status) as any}>{kiosk.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {kiosk.last_heartbeat ? new Date(kiosk.last_heartbeat).toLocaleString('fr-FR') : 'Jamais'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/kiosk/${kiosk.slug}`} target="_blank">
                            <Button variant="ghost" size="sm"><Monitor className="w-4 h-4" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {kiosks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          Aucun kiosk configuré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ONGLET MEMBRES */}
            <TabsContent value="members">
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center gap-4">
                  <h3 className="text-lg font-medium text-foreground whitespace-nowrap">Liste des adhérents</h3>
                  <div className="flex items-center gap-2 w-full max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un adhérent..." className="h-9" />
                  </div>
                </div>
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Badge ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 text-sm font-medium">
                          {member.first_name} {member.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{member.badge_id}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant={member.is_active ? 'default' : 'secondary'}>
                            {member.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          Aucun adhérent trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </>
  )
}

