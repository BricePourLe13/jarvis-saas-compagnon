'use client'

import { useEffect, useState } from 'react'
import { useGymContext } from '@/contexts/GymContext'
import { Monitor, Wifi, WifiOff, Activity, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import Link from 'next/link'

interface Kiosk {
  id: string
  gym_id: string
  gym_name: string
  slug: string
  name: string
  status: 'online' | 'offline' | 'error'
  last_heartbeat: string | null
  version: string | null
  device_info: any
}

interface KioskMetrics {
  totalKiosks: number
  onlineKiosks: number
  offlineKiosks: number
  errorKiosks: number
  avgUptime: number
}

export default function KioskPage() {
  const { selectedGymId, userRole, availableGyms } = useGymContext()
  const [kiosks, setKiosks] = useState<Kiosk[]>([])
  const [metrics, setMetrics] = useState<KioskMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKiosks() {
      try {
        setLoading(true)
        
        // Construire l'URL avec le filtre gym si nécessaire
        const params = new URLSearchParams()
        if (selectedGymId) {
          params.set('gym_id', selectedGymId)
        }
        
        const response = await fetch(`/api/dashboard/kiosk?${params}`)
        const data = await response.json()
        
        setKiosks(data.kiosks || [])
        setMetrics(data.metrics || null)
      } catch (error) {
        console.error('Error fetching kiosks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKiosks()
    
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchKiosks, 30000)
    return () => clearInterval(interval)
  }, [selectedGymId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'offline':
        return <WifiOff className="h-5 w-5 text-gray-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Monitor className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      online: 'bg-green-500/10 text-green-500 border-green-500/20',
      offline: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      error: 'bg-red-500/10 text-red-500 border-red-500/20'
    }[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

    const labels = {
      online: 'En ligne',
      offline: 'Hors ligne',
      error: 'Erreur'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getLastHeartbeatText = (lastHeartbeat: string | null) => {
    if (!lastHeartbeat) return 'Jamais'
    
    const now = new Date()
    const last = new Date(lastHeartbeat)
    const diffMs = now.getTime() - last.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    
    const diffDays = Math.floor(diffHours / 24)
    return `Il y a ${diffDays}j`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interface Kiosk</h1>
          <p className="text-muted-foreground mt-2">
            Monitoring et gestion des interfaces JARVIS
          </p>
        </div>
        {userRole === 'super_admin' && (
          <Link
            href="/dashboard/admin/kiosk/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Nouveau Kiosk
          </Link>
        )}
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Kiosks</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalKiosks}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">En ligne</span>
            </div>
            <p className="text-3xl font-bold text-green-500">{metrics.onlineKiosks}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <WifiOff className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-muted-foreground">Hors ligne</span>
            </div>
            <p className="text-3xl font-bold text-gray-500">{metrics.offlineKiosks}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Uptime Moyen</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.avgUptime.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Kiosks List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Kiosk</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Salle</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Dernier signal</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Version</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {kiosks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun kiosk trouvé</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedGymId ? 'Pour cette salle' : 'Contactez un administrateur'}
                    </p>
                  </td>
                </tr>
              ) : (
                kiosks.map((kiosk) => (
                  <tr key={kiosk.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(kiosk.status)}
                        <div>
                          <p className="font-medium text-foreground">{kiosk.name}</p>
                          <p className="text-sm text-muted-foreground">/{kiosk.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{kiosk.gym_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(kiosk.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{getLastHeartbeatText(kiosk.last_heartbeat)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">{kiosk.version || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/kiosk/${kiosk.slug}`}
                          target="_blank"
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Ouvrir le kiosk"
                        >
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        {(userRole === 'super_admin' || userRole === 'gym_manager') && (
                          <Link
                            href={`/dashboard/kiosk/${kiosk.id}/settings`}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Paramètres"
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

