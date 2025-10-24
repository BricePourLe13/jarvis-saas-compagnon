'use client'

import { useEffect, useState } from 'react'
import { 
  Card, 
  Metric, 
  Text, 
  BadgeDelta, 
  Grid,
  Flex,
  Icon,
  Title,
  Bold,
  Button,
  Callout
} from '@tremor/react'
import { 
  UsersIcon, 
  ChartBarIcon, 
  CurrencyEuroIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

/**
 * 🏠 DASHBOARD OVERVIEW - Version Tremor Enterprise
 * Vue d'ensemble avec vraies données API
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
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
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
        console.error('[OVERVIEW] Erreur:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Chargement des métriques...</Text>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Callout
          title="Erreur de chargement"
          icon={ExclamationTriangleIcon}
          color="red"
        >
          {error || 'Impossible de charger les données'}
        </Callout>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Title>Vue d'ensemble</Title>
          <Text>Performance temps réel de votre salle</Text>
        </div>

        {/* KPIs Grid */}
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
          {/* Membres actifs */}
          <Card decoration="top" decorationColor="blue">
            <Flex justifyContent="start" className="space-x-4">
              <Icon
                icon={UsersIcon}
                variant="light"
                size="xl"
                color="blue"
              />
              <div className="truncate">
                <Text>Membres actifs</Text>
                <Metric>{stats.membres_actifs}</Metric>
              </div>
            </Flex>
            {stats.trends.membres !== 0 && (
              <Flex className="mt-4">
                <BadgeDelta
                  deltaType={stats.trends.membres > 0 ? 'increase' : 'decrease'}
                >
                  {stats.trends.membres > 0 ? '+' : ''}{stats.trends.membres}%
                </BadgeDelta>
                <Text className="text-xs text-gray-500">vs mois dernier</Text>
              </Flex>
            )}
          </Card>

          {/* Sessions mensuelles */}
          <Card decoration="top" decorationColor="emerald">
            <Flex justifyContent="start" className="space-x-4">
              <Icon
                icon={ChartBarIcon}
                variant="light"
                size="xl"
                color="emerald"
              />
              <div className="truncate">
                <Text>Sessions ce mois</Text>
                <Metric>{stats.sessions_mensuelles}</Metric>
              </div>
            </Flex>
            {stats.trends.sessions !== 0 && (
              <Flex className="mt-4">
                <BadgeDelta
                  deltaType={stats.trends.sessions > 0 ? 'increase' : 'decrease'}
                >
                  {stats.trends.sessions > 0 ? '+' : ''}{stats.trends.sessions}%
                </BadgeDelta>
                <Text className="text-xs text-gray-500">vs mois dernier</Text>
              </Flex>
            )}
          </Card>

          {/* Revenus mensuels */}
          <Card decoration="top" decorationColor="emerald">
            <Flex justifyContent="start" className="space-x-4">
              <Icon
                icon={CurrencyEuroIcon}
                variant="light"
                size="xl"
                color="emerald"
              />
              <div className="truncate">
                <Text>Revenus mensuels</Text>
                <Metric>{stats.revenus_mensuels.toLocaleString('fr-FR')}€</Metric>
              </div>
            </Flex>
            {stats.trends.revenus !== 0 && (
              <Flex className="mt-4">
                <BadgeDelta
                  deltaType={stats.trends.revenus > 0 ? 'increase' : 'decrease'}
                >
                  {stats.trends.revenus > 0 ? '+' : ''}{stats.trends.revenus}%
                </BadgeDelta>
                <Text className="text-xs text-gray-500">vs mois dernier</Text>
              </Flex>
            )}
          </Card>

          {/* Taux de rétention */}
          <Card 
            decoration="top" 
            decorationColor={stats.taux_retention >= 90 ? 'emerald' : stats.taux_retention >= 70 ? 'amber' : 'rose'}
          >
            <Flex justifyContent="start" className="space-x-4">
              <Icon
                icon={ArrowTrendingUpIcon}
                variant="light"
                size="xl"
                color={stats.taux_retention >= 90 ? 'emerald' : stats.taux_retention >= 70 ? 'amber' : 'rose'}
              />
              <div className="truncate">
                <Text>Taux de rétention</Text>
                <Metric>{stats.taux_retention}%</Metric>
              </div>
            </Flex>
            {stats.taux_retention < 80 && (
              <Flex className="mt-4">
                <BadgeDelta deltaType="moderateDecrease">
                  Attention
                </BadgeDelta>
              </Flex>
            )}
          </Card>
        </Grid>

        {/* Alertes prioritaires */}
        {alerts.length > 0 && (
          <div className="space-y-4">
            <Title>Alertes prioritaires</Title>
            {alerts.map((alert) => (
              <Callout
                key={alert.id}
                title={alert.title}
                icon={alert.priority === 'high' ? ExclamationTriangleIcon : InformationCircleIcon}
                color={
                  alert.priority === 'high' ? 'rose' :
                  alert.priority === 'medium' ? 'amber' :
                  'blue'
                }
              >
                <div className="mt-2">
                  <Text>{alert.description}</Text>
                  {alert.action && (
                    <Button
                      size="xs"
                      variant="light"
                      className="mt-3"
                      onClick={() => router.push(alert.action!.href)}
                    >
                      {alert.action.label}
                    </Button>
                  )}
                </div>
              </Callout>
            ))}
          </div>
        )}

        {/* Actions rapides */}
        <Card>
          <Title>Actions rapides</Title>
          <Flex className="mt-4 space-x-2">
            <Button
              size="sm"
              onClick={() => router.push('/dashboard/members-v2')}
            >
              Voir tous les membres
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push('/dashboard/sessions-v2')}
            >
              Sessions JARVIS
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push('/dashboard/analytics-v2')}
            >
              Analytics détaillés
            </Button>
          </Flex>
        </Card>
      </div>
    </div>
  )
}
