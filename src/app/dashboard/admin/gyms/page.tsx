'use client'

import { useEffect, useState } from 'react'
import { useGymContext } from '@/contexts/GymContext'
import { Building2, MapPin, Users, Monitor, AlertCircle, Settings, Eye, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import GymCreateWizard from '@/components/admin/GymCreateWizard'

interface Gym {
  id: string
  name: string
  city: string
  address: string
  postal_code: string
  status: 'active' | 'maintenance' | 'suspended'
  legacy_franchise_name?: string // Display only
  manager_id?: string
  manager_name?: string
  kiosks?: Array<{
    id: string
    name: string
    status: string
  }>
  total_members?: number
  total_kiosks?: number
  created_at: string
}

interface GymsMetrics {
  totalGyms: number
  activeGyms: number
  suspendedGyms: number
  totalMembers: number
}

export default function GymsAdminPage() {
  const { userRole } = useGymContext()
  const [gyms, setGyms] = useState<Gym[]>([])
  const [metrics, setMetrics] = useState<GymsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchGyms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/admin/gyms')
      const data = await response.json()
      
      setGyms(data.gyms || [])
      setMetrics(data.metrics || null)
    } catch (error) {
      console.error('Error fetching gyms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGyms()
  }, [])

  // Vérifier les permissions
  if (userRole !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">
            Cette page est réservée aux super administrateurs.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Filtrer les gyms
  const filteredGyms = filter === 'all' 
    ? gyms 
    : gyms.filter(g => g.status === filter)

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      maintenance: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      suspended: 'bg-red-500/10 text-red-500 border-red-500/20'
    }[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

    const labels = {
      active: 'Actif',
      maintenance: 'Maintenance',
      suspended: 'Suspendu'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salles de Sport</h1>
          <p className="text-muted-foreground mt-2">
            Gestion globale des salles JARVIS
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Créer une salle
        </button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Salles</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalGyms}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Salles Actives</span>
            </div>
            <p className="text-3xl font-bold text-green-500">{metrics.activeGyms}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Suspendues</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{metrics.suspendedGyms}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Total Membres</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalMembers}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Toutes ({gyms.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Actives ({gyms.filter(g => g.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('suspended')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'suspended'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Suspendues ({gyms.filter(g => g.status === 'suspended').length})
        </button>
      </div>

      {/* Gyms Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Salle</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Franchise</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Localisation</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Kiosks</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Membres</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGyms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune salle trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredGyms.map((gym) => (
                  <tr key={gym.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-foreground">{gym.name}</p>
                          <p className="text-sm text-muted-foreground">{gym.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{gym.franchise_name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{gym.postal_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(gym.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{gym.total_kiosks || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{gym.total_members || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/gyms/${gym.id}`}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/gyms/${gym.id}/settings`}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Paramètres"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création Salle */}
      <GymCreateWizard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchGyms() // Recharger la liste
        }}
      />
    </div>
  )
}


