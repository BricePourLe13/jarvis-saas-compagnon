'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2, MapPin, User, Monitor, Users, Calendar, ArrowLeft, Activity, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface GymDetails {
  id: string
  name: string
  city: string
  address: string
  postal_code: string
  status: 'active' | 'maintenance' | 'suspended'
  legacy_franchise_name?: string
  manager_id?: string
  manager_name?: string
  manager_email?: string
  total_members?: number
  total_kiosks?: number
  total_sessions?: number
  created_at: string
  last_activity?: string
  kiosks?: Array<{
    id: string
    name: string
    status: string
    last_heartbeat?: string
  }>
}

export default function GymDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const gymId = params.id as string
  
  const [gym, setGym] = useState<GymDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGymDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/dashboard/admin/gyms/${gymId}`)
        if (!response.ok) throw new Error('Failed to fetch gym details')
        const data = await response.json()
        setGym(data.gym)
      } catch (error) {
        console.error('Error fetching gym details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (gymId) {
      fetchGymDetails()
    }
  }, [gymId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border border-neutral-200 border-t-neutral-900"></div>
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 text-neutral-300 mx-auto" />
          <div>
            <h2 className="text-xl font-medium text-neutral-900">Salle non trouvée</h2>
            <p className="text-sm text-neutral-500 mt-2">Cette salle n'existe pas ou a été supprimée.</p>
          </div>
          <Link
            href="/dashboard/admin/gyms"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux salles
          </Link>
        </div>
      </div>
    )
  }

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
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/gyms"
            className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" strokeWidth={1.5} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-neutral-900 tracking-tight">{gym.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">{gym.city} · {gym.postal_code}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-md text-xs font-light border ${getStatusStyle(gym.status)}`}>
            {getStatusLabel(gym.status)}
          </span>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 grid-cols-4">
          {[
            { label: 'Membres', value: gym.total_members || 0, icon: Users, color: 'neutral' },
            { label: 'Kiosks', value: gym.total_kiosks || 0, icon: Monitor, color: 'neutral' },
            { label: 'Sessions JARVIS', value: gym.total_sessions || 0, icon: Activity, color: 'neutral' },
            { label: 'Jours actifs', value: Math.floor((Date.now() - new Date(gym.created_at).getTime()) / (1000 * 60 * 60 * 24)), icon: Calendar, color: 'neutral' }
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

        {/* Main Content - 2 columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informations générales */}
          <div className="border border-neutral-100 rounded-lg p-6 space-y-6">
            <h2 className="text-sm font-normal text-neutral-900 uppercase tracking-wider">Informations générales</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-neutral-400 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 font-light mb-1">Adresse</p>
                  <p className="text-sm text-neutral-900 font-light">{gym.address}</p>
                  <p className="text-sm text-neutral-600 font-light">{gym.postal_code} {gym.city}</p>
                </div>
              </div>

              {gym.manager_name && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-neutral-400 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 font-light mb-1">Gérant</p>
                    <p className="text-sm text-neutral-900 font-light">{gym.manager_name}</p>
                    {gym.manager_email && (
                      <p className="text-sm text-neutral-600 font-light">{gym.manager_email}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-neutral-400 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 font-light mb-1">Date de création</p>
                  <p className="text-sm text-neutral-900 font-light">
                    {new Date(gym.created_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {gym.last_activity && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-neutral-400 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 font-light mb-1">Dernière activité</p>
                    <p className="text-sm text-neutral-900 font-light">
                      {new Date(gym.last_activity).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kiosks */}
          <div className="border border-neutral-100 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-normal text-neutral-900 uppercase tracking-wider">Kiosks</h2>
              <span className="text-xs text-neutral-500 font-light">{gym.total_kiosks || 0} kiosk(s)</span>
            </div>

            {gym.kiosks && gym.kiosks.length > 0 ? (
              <div className="space-y-3">
                {gym.kiosks.map((kiosk) => (
                  <div key={kiosk.id} className="flex items-center gap-3 p-3 border border-neutral-100 rounded-md hover:border-neutral-200 transition-colors">
                    <div className="w-8 h-8 rounded-md border border-neutral-200 flex items-center justify-center">
                      <Monitor className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-light text-neutral-900">{kiosk.name}</p>
                      {kiosk.last_heartbeat && (
                        <p className="text-xs text-neutral-500 font-light mt-0.5">
                          Dernier signal: {new Date(kiosk.last_heartbeat).toLocaleDateString('fr-FR', { 
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border font-light ${
                      kiosk.status === 'online' 
                        ? 'text-neutral-900 bg-neutral-50 border-neutral-200' 
                        : 'text-neutral-400 bg-neutral-50 border-neutral-200'
                    }`}>
                      {kiosk.status === 'online' ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Monitor className="h-8 w-8 text-neutral-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-neutral-400 font-light">Aucun kiosk provisionné</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights (placeholder pour futures métriques) */}
        <div className="border border-neutral-100 rounded-lg p-6">
          <h2 className="text-sm font-normal text-neutral-900 uppercase tracking-wider mb-6">Insights & Performance</h2>
          <div className="text-center py-12">
            <TrendingUp className="h-8 w-8 text-neutral-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-neutral-400 font-light">Analytics disponibles prochainement</p>
            <p className="text-xs text-neutral-400 font-light mt-1">Churn risk, satisfaction, utilisation JARVIS...</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-md hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-sm font-light">
            Éditer la salle
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-md hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-sm font-light">
            Provisionner un kiosk
          </button>
          <button className="px-4 py-2 border border-red-200 text-red-600 rounded-md hover:border-red-300 hover:bg-red-50 transition-colors text-sm font-light">
            Suspendre la salle
          </button>
        </div>
      </div>
    </div>
  )
}
