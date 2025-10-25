'use client'

import { useEffect, useState } from 'react'
import { useGymContext } from '@/contexts/GymContext'
import { Building2, MapPin, Users, Dumbbell, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Franchise {
  id: string
  name: string
  city: string
  country: string
  status: 'active' | 'inactive'
  total_gyms: number
  total_members: number
  created_at: string
}

interface FranchiseMetrics {
  totalFranchises: number
  activeFranchises: number
  totalGyms: number
  totalMembers: number
}

export default function FranchisesPage() {
  const { userRole } = useGymContext()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [metrics, setMetrics] = useState<FranchiseMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFranchises() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/admin/franchises')
        const data = await response.json()
        
        setFranchises(data.franchises || [])
        setMetrics(data.metrics || null)
      } catch (error) {
        console.error('Error fetching franchises:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFranchises()
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

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
          Actif
        </span>
      )
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
        Inactif
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Franchises</h1>
          <p className="text-muted-foreground mt-2">
            Gestion globale des franchises JARVIS
          </p>
        </div>
        <Link
          href="/dashboard/admin/franchises/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Nouvelle Franchise
        </Link>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Total Franchises</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalFranchises}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Franchises Actives</span>
            </div>
            <p className="text-3xl font-bold text-green-500">{metrics.activeFranchises}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Dumbbell className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Salles</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalGyms}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Total Membres</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalMembers}</p>
          </div>
        </div>
      )}

      {/* Franchises Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {franchises.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune franchise trouvée</p>
            </div>
          </div>
        ) : (
          franchises.map((franchise) => (
            <Link
              key={franchise.id}
              href={`/dashboard/admin/franchises/${franchise.id}`}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {franchise.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{franchise.city}, {franchise.country}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(franchise.status)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Dumbbell className="h-4 w-4" />
                    <span>Salles</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{franchise.total_gyms}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span>Membres</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{franchise.total_members}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Créée le {new Date(franchise.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

