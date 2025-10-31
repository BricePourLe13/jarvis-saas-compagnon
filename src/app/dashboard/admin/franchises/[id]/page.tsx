'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGymContext } from '@/contexts/GymContext'
import { 
  Building2, 
  MapPin, 
  Users, 
  Dumbbell, 
  ArrowLeft, 
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

interface Gym {
  id: string
  name: string
  city: string
  status: string
  total_members: number
  total_kiosks: number
}

interface Franchise {
  id: string
  name: string
  city: string
  country: string
  status: string
  contact_email?: string
  contact_phone?: string
  created_at: string
  gyms: Gym[]
}

export default function FranchiseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { userRole } = useGymContext()
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFranchise() {
      try {
        setLoading(true)
        const response = await fetch(`/api/dashboard/admin/franchises/${resolvedParams.id}`)
        
        if (!response.ok) {
          throw new Error('Franchise not found')
        }
        
        const data = await response.json()
        setFranchise(data)
      } catch (error) {
        console.error('Error fetching franchise:', error)
        router.push('/dashboard/admin/franchises')
      } finally {
        setLoading(false)
      }
    }

    fetchFranchise()
  }, [resolvedParams.id, router])

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

  if (!franchise) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Franchise introuvable</h2>
          <Link
            href="/dashboard/admin/franchises"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Retour aux franchises
          </Link>
        </div>
      </div>
    )
  }

  const totalMembers = franchise.gyms.reduce((sum, gym) => sum + gym.total_members, 0)
  const totalKiosks = franchise.gyms.reduce((sum, gym) => sum + gym.total_kiosks, 0)

  return (
    <div className="space-y-8">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/franchises"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{franchise.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <MapPin className="h-4 w-4" />
            <span>{franchise.city}, {franchise.country}</span>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
          franchise.status === 'active'
            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
            : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
        }`}>
          {franchise.status === 'active' ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {/* Métriques globales */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Salles</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{franchise.gyms.length}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Membres Total</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalMembers}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Kiosks Total</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalKiosks}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">Moy. / Salle</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {franchise.gyms.length > 0 ? Math.round(totalMembers / franchise.gyms.length) : 0}
          </p>
        </div>
      </div>

      {/* Informations contact */}
      {(franchise.contact_email || franchise.contact_phone) && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {franchise.contact_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">{franchise.contact_email}</p>
                </div>
              </div>
            )}
            {franchise.contact_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="text-foreground">{franchise.contact_phone}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Créée le {new Date(franchise.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      )}

      {/* Liste des salles */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Salles de Sport ({franchise.gyms.length})</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {franchise.gyms.length === 0 ? (
            <div className="col-span-full bg-card border border-border rounded-lg p-12 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune salle associée à cette franchise</p>
            </div>
          ) : (
            franchise.gyms.map((gym) => (
              <Link
                key={gym.id}
                href={`/dashboard/admin/gyms/${gym.id}`}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Building2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {gym.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{gym.city}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gym.status === 'active'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-gray-500/10 text-gray-500'
                  }`}>
                    {gym.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      <span>Membres</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{gym.total_members}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-3 w-3" />
                      <span>Kiosks</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{gym.total_kiosks}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

