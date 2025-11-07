'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGymContext } from '@/contexts/GymContext'
import { 
  Building2, 
  MapPin, 
  Users, 
  Monitor,
  ArrowLeft, 
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Settings,
  Activity,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Kiosk {
  id: string
  slug: string
  name: string
  status: string
  provisioning_code: string
  last_heartbeat: string | null
}

interface Gym {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  phone?: string
  status: string
  franchise_id: string
  franchise_name?: string
  created_at: string
  kiosks: Kiosk[]
  total_members: number
}

export default function GymDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { userRole } = useGymContext()
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGym() {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/gyms/${resolvedParams.id}`)
        
        if (!response.ok) {
          throw new Error('Gym not found')
        }
        
        const data = await response.json()
        setGym(data.data)
      } catch (error) {
        console.error('Error fetching gym:', error)
        router.push('/dashboard/admin/gyms')
      } finally {
        setLoading(false)
      }
    }

    fetchGym()
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

  if (!gym) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Salle introuvable</h2>
          <Link
            href="/dashboard/admin/gyms"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Retour aux salles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/gyms"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{gym.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <MapPin className="h-4 w-4" />
            <span>{gym.address}, {gym.postal_code} {gym.city}</span>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
          gym.status === 'active'
            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
            : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
        }`}>
          {gym.status === 'active' ? 'Actif' : gym.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href={`/dashboard/admin/gyms/${gym.id}/settings`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </Link>
        <Link
          href={`/dashboard?gym_id=${gym.id}`}
          className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          Voir Analytics
        </Link>
      </div>

      {/* Métriques */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Membres Total</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{gym.total_members}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Kiosks Actifs</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {gym.kiosks.filter(k => k.status === 'online').length} / {gym.kiosks.length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Franchise</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {gym.franchise_name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Informations contact */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Informations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {gym.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="text-foreground">{gym.phone}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Créée le</p>
              <p className="text-foreground">{new Date(gym.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des kiosks */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Kiosks ({gym.kiosks.length})</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {gym.kiosks.length === 0 ? (
            <div className="col-span-full bg-card border border-border rounded-lg p-12 text-center">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun kiosk associé à cette salle</p>
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                + Ajouter un Kiosk
              </button>
            </div>
          ) : (
            gym.kiosks.map((kiosk) => (
              <div
                key={kiosk.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      kiosk.status === 'online'
                        ? 'bg-green-500/10'
                        : 'bg-gray-500/10'
                    }`}>
                      <Monitor className={`h-5 w-5 ${
                        kiosk.status === 'online'
                          ? 'text-green-500'
                          : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {kiosk.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {kiosk.slug}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    kiosk.status === 'online'
                      ? 'bg-green-500/10 text-green-500'
                      : kiosk.status === 'offline'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {kiosk.status}
                  </span>
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Code provisioning</span>
                    <span className="font-mono font-bold text-foreground">{kiosk.provisioning_code}</span>
                  </div>
                  {kiosk.last_heartbeat && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dernier signal</span>
                      <span className="text-foreground">
                        {new Date(kiosk.last_heartbeat).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <Link
                    href={`/kiosk/${kiosk.slug}`}
                    target="_blank"
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center text-sm"
                  >
                    Ouvrir Kiosk
                  </Link>
                  <button className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


