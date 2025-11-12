'use client'

import { useEffect, useState } from 'react'
import { useGymContext } from '@/contexts/GymContext'
import { Building2, MapPin, Users, Monitor, AlertCircle, Plus, Search, Eye, Settings, Trash2 } from 'lucide-react'
import Link from 'next/link'
import GymCreateWizard from '@/components/admin/GymCreateWizard'

interface Gym {
  id: string
  name: string
  city: string
  address: string
  postal_code: string
  status: 'active' | 'maintenance' | 'suspended'
  legacy_franchise_name?: string
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
  const [searchQuery, setSearchQuery] = useState('')
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

  // Permissions check
  if (userRole !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto" />
          <div>
            <h2 className="text-xl font-medium text-neutral-900">Accès refusé</h2>
            <p className="text-sm text-neutral-500 mt-2">
              Cette page est réservée aux super administrateurs.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border border-neutral-200 border-t-neutral-900"></div>
      </div>
    )
  }

  // Filter and search
  const filteredGyms = gyms
    .filter(g => filter === 'all' || g.status === filter)
    .filter(g => 
      searchQuery === '' || 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.city.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const getStatusStyle = (status: string) => {
    const styles = {
      active: 'text-neutral-900 bg-neutral-50 border-neutral-200',
      maintenance: 'text-neutral-600 bg-neutral-50 border-neutral-200',
      suspended: 'text-neutral-400 bg-neutral-50 border-neutral-200'
    }
    return styles[status as keyof typeof styles] || 'text-neutral-600 bg-neutral-50 border-neutral-200'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Actif',
      maintenance: 'Maintenance',
      suspended: 'Suspendu'
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-neutral-900 tracking-tight">Salles de Sport</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Gestion globale des salles JARVIS
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-2 text-sm font-light"
          >
            <Plus className="h-4 w-4" />
            Créer une salle
          </button>
        </div>

        {/* Metrics - Monochrome minimalist */}
        {metrics && (
          <div className="grid gap-4 grid-cols-4">
            {[
              { label: 'Total Salles', value: metrics.totalGyms, icon: Building2 },
              { label: 'Salles Actives', value: metrics.activeGyms, icon: Building2 },
              { label: 'Suspendues', value: metrics.suspendedGyms, icon: AlertCircle },
              { label: 'Total Membres', value: metrics.totalMembers, icon: Users }
            ].map((metric, i) => (
              <div key={i} className="border border-neutral-100 rounded-lg p-4 hover:border-neutral-200 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <metric.icon className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                  <span className="text-xs text-neutral-500 font-light">{metric.label}</span>
                </div>
                <p className="text-2xl font-light text-neutral-900">{metric.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Rechercher une salle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors font-light"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Toutes', count: gyms.length },
              { key: 'active', label: 'Actives', count: gyms.filter(g => g.status === 'active').length },
              { key: 'suspended', label: 'Suspendues', count: gyms.filter(g => g.status === 'suspended').length }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-3 py-2 rounded-md text-sm font-light transition-colors ${
                  filter === f.key
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Table - Ultra minimalist */}
        <div className="border border-neutral-100 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-3 text-xs font-normal text-neutral-500 uppercase tracking-wider">Salle</th>
                <th className="text-left px-6 py-3 text-xs font-normal text-neutral-500 uppercase tracking-wider">Localisation</th>
                <th className="text-left px-6 py-3 text-xs font-normal text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-normal text-neutral-500 uppercase tracking-wider">Kiosks</th>
                <th className="text-left px-6 py-3 text-xs font-normal text-neutral-500 uppercase tracking-wider">Membres</th>
                <th className="text-right px-6 py-3 text-xs font-normal text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Building2 className="h-8 w-8 text-neutral-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-neutral-400 font-light">
                      {searchQuery ? 'Aucune salle trouvée pour cette recherche' : 'Aucune salle trouvée'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGyms.map((gym) => (
                  <tr key={gym.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md border border-neutral-200 flex items-center justify-center group-hover:border-neutral-300 transition-colors">
                          <Building2 className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-light text-neutral-900">{gym.name}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{gym.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-neutral-500 font-light">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>{gym.postal_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-light border ${getStatusStyle(gym.status)}`}>
                        {getStatusLabel(gym.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                        <span className="text-sm font-light text-neutral-600">{gym.total_kiosks || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                        <span className="text-sm font-light text-neutral-600">{gym.total_members || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/admin/gyms/${gym.id}`}
                          className="p-2 hover:bg-neutral-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4 text-neutral-600" strokeWidth={1.5} />
                        </Link>
                        <button
                          className="p-2 hover:bg-neutral-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Paramètres"
                        >
                          <Settings className="h-4 w-4 text-neutral-600" strokeWidth={1.5} />
                        </button>
                        <button
                          className="p-2 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats footer */}
        {filteredGyms.length > 0 && (
          <div className="text-xs text-neutral-400 font-light text-center">
            Affichage de {filteredGyms.length} salle{filteredGyms.length > 1 ? 's' : ''} sur {gyms.length}
          </div>
        )}
      </div>

      {/* Modal Création Salle */}
      <GymCreateWizard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchGyms()
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
