'use client'

import { useEffect, useState } from 'react'
import { Activity, Users, MessageSquare, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface Stats {
  totalMembers: number
  activeMembersToday: number
  totalSessions: number
  sessionsToday: number
  avgSentiment: number
  churnRisk: number
  membersTrend: number
  sessionsTrend: number
}

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  created_at: string
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/overview/stats').then(res => res.json()),
      fetch('/api/dashboard/overview/alerts').then(res => res.json())
    ]).then(([statsData, alertsData]) => {
      setStats(statsData)
      setAlerts(alertsData.alerts || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Membres Actifs',
      value: stats.activeMembersToday,
      total: stats.totalMembers,
      icon: Users,
      trend: stats.membersTrend,
      color: 'text-blue-500'
    },
    {
      label: 'Sessions JARVIS',
      value: stats.sessionsToday,
      total: stats.totalSessions,
      icon: MessageSquare,
      trend: stats.sessionsTrend,
      color: 'text-purple-500'
    },
    {
      label: 'Sentiment Moyen',
      value: `${(stats.avgSentiment * 100).toFixed(0)}%`,
      icon: Activity,
      trend: 0,
      color: 'text-green-500'
    },
    {
      label: 'Risque Churn',
      value: stats.churnRisk,
      icon: AlertTriangle,
      trend: 0,
      color: 'text-red-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vue d'ensemble</h1>
        <p className="text-muted-foreground mt-2">
          Statistiques et performances de votre salle de sport
        </p>
      </div>

        {/* KPIs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const isPositive = metric.trend > 0
            const TrendIcon = isPositive ? TrendingUp : TrendingDown

            return (
              <div
                key={metric.label}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: 'hsl(var(--card))' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-muted ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {metric.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      <TrendIcon className="h-4 w-4" />
                      <span>{Math.abs(metric.trend)}%</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-foreground">
                    {metric.value}
                    {metric.total && <span className="text-lg text-muted-foreground">/{metric.total}</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Alertes récentes</h2>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const bgColor = {
                  warning: 'bg-yellow-500/10 border-yellow-500/20',
                  error: 'bg-red-500/10 border-red-500/20',
                  info: 'bg-blue-500/10 border-blue-500/20'
                }[alert.type]

                const iconColor = {
                  warning: 'text-yellow-500',
                  error: 'text-red-500',
                  info: 'text-blue-500'
                }[alert.type]

                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 ${bgColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
    </div>
  )
}
