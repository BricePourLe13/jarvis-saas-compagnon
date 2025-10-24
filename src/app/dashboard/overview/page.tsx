'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { MetricCard } from '@/components/dashboard-v2/MetricCard'
import { AlertCard } from '@/components/dashboard-v2/AlertCard'
import { PageLoader } from '@/components/dashboard-v2/PageLoader'
import { Users, Activity, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * PAGE OVERVIEW - Dashboard principal
 * Vue d'ensemble d'une salle avec vraies données
 */

interface Stats {
  membres_actifs: number
  sessions_mensuelles: number
  revenus_mensuels: number
  taux_retention: number
  trends: {
    membres: number
    sessions: number
    revenus: number
    retention: number
  }
}

interface Alert {
  id: string
  type: 'urgent' | 'warning' | 'info'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Charger stats et alertes en parallèle
        const [statsRes, alertsRes] = await Promise.all([
          fetch('/api/dashboard/overview/stats'),
          fetch('/api/dashboard/overview/alerts')
        ])

        if (!statsRes.ok || !alertsRes.ok) {
          throw new Error('Erreur chargement données')
        }

        const statsData = await statsRes.json()
        const alertsData = await alertsRes.json()

        setStats(statsData)
        setAlerts(alertsData.alerts || [])
      } catch (err) {
        console.error('Erreur:', err)
        setError('Impossible de charger les données')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <DashboardShell>
        <PageLoader message="Chargement des métriques..." />
      </DashboardShell>
    )
  }

  if (error || !stats) {
    return (
      <DashboardShell>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || 'Erreur de chargement'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </DashboardShell>
    )
  }

  // Formater les métriques pour les cards
  const metrics = [
    {
      label: 'Membres actifs',
      value: stats.membres_actifs.toString(),
      icon: Users,
      iconColor: 'primary' as const,
      trend: stats.trends.membres !== 0 ? {
        value: `${stats.trends.membres > 0 ? '+' : ''}${stats.trends.membres}%`,
        direction: (stats.trends.membres > 0 ? 'up' : 'down') as const,
        isPositive: stats.trends.membres > 0
      } : undefined,
    },
    {
      label: 'Sessions ce mois',
      value: stats.sessions_mensuelles.toString(),
      icon: Activity,
      iconColor: 'success' as const,
      trend: stats.trends.sessions !== 0 ? {
        value: `${stats.trends.sessions > 0 ? '+' : ''}${stats.trends.sessions}%`,
        direction: (stats.trends.sessions > 0 ? 'up' : 'down') as const,
        isPositive: stats.trends.sessions > 0
      } : undefined,
    },
    {
      label: 'Revenus mensuels',
      value: `${stats.revenus_mensuels.toLocaleString('fr-FR')}€`,
      icon: DollarSign,
      iconColor: 'success' as const,
      trend: stats.trends.revenus !== 0 ? {
        value: `${stats.trends.revenus > 0 ? '+' : ''}${stats.trends.revenus}%`,
        direction: (stats.trends.revenus > 0 ? 'up' : 'down') as const,
        isPositive: stats.trends.revenus > 0
      } : undefined,
    },
    {
      label: 'Taux de rétention',
      value: `${stats.taux_retention}%`,
      icon: TrendingUp,
      iconColor: stats.taux_retention >= 90 ? 'success' as const : 'warning' as const,
      badge: stats.taux_retention < 80 ? { label: 'Attention', variant: 'warning' as const } : undefined,
    },
  ]

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vue d'ensemble</h1>
        <p className="text-gray-600">Performance temps réel de votre salle</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertes prioritaires</h2>
          <div className="space-y-4 mb-8">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                priority={alert.priority}
                title={alert.title}
                description={alert.description}
                timestamp={new Date()}
                actions={alert.action ? [
                  {
                    label: alert.action.label,
                    onClick: () => window.location.href = alert.action!.href,
                    variant: 'primary' as const
                  }
                ] : []}
              />
            ))}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.location.href = '/dashboard/members-v2'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voir tous les membres
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/sessions-v2'}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sessions JARVIS
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/analytics-v2'}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Analytics détaillés
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}
