/**
 * 🏠 DASHBOARD PRINCIPAL
 * Vue d'ensemble avec KPIs et alertes
 * ✅ DESIGN MONOCHROME STRICT (blanc/gris/noir)
 */

'use client'

import { useEffect, useState } from 'react'
import { Activity, Users, MessageSquare, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { mono, kpiCard } from '@/lib/dashboard-design'

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

export default function DashboardPage() {
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
      trend: stats.membersTrend
    },
    {
      label: 'Sessions JARVIS',
      value: stats.sessionsToday,
      total: stats.totalSessions,
      icon: MessageSquare,
      trend: stats.sessionsTrend
    },
    {
      label: 'Sentiment Moyen',
      value: `${(stats.avgSentiment * 100).toFixed(0)}%`,
      icon: Activity,
      trend: 0
    },
    {
      label: 'Risque Churn',
      value: stats.churnRisk,
      icon: AlertTriangle,
      trend: 0
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={mono.h1 + " text-3xl"}>Vue d'ensemble</h1>
        <p className={mono.description + " mt-2"}>
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
              className={kpiCard.container}
            >
              <div className={kpiCard.header}>
                <div className="p-3 rounded-lg bg-white/5">
                  <Icon className={kpiCard.icon} />
                </div>
                {metric.trend !== 0 && (
                  <div className="flex items-center gap-1 text-sm text-white/70">
                    <TrendIcon className="h-4 w-4" />
                    <span>{Math.abs(metric.trend)}%</span>
                  </div>
                )}
              </div>
              <div>
                <p className={kpiCard.label + " mb-1"}>{metric.label}</p>
                <p className={kpiCard.value}>
                  {metric.value}
                  {metric.total && <span className={mono.description + " text-lg"}>/{metric.total}</span>}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className={mono.h2 + " text-xl mb-4"}>Alertes récentes</h2>
          <div className="space-y-3">
            {alerts.map((alert) => {
              // MONOCHROME : Nuances de gris selon sévérité
              const alertStyles = {
                warning: {
                  bg: 'bg-white/5 border-white/10',
                  icon: 'text-white/70'
                },
                error: {
                  bg: 'bg-white/10 border-white/15',
                  icon: 'text-white/90'
                },
                info: {
                  bg: 'bg-black/40 border-white/5',
                  icon: 'text-white/60'
                }
              }[alert.type]

              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 backdrop-blur-xl ${alertStyles.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${alertStyles.icon}`} />
                    <div className="flex-1">
                      <h3 className={mono.h3 + " text-base"}>{alert.title}</h3>
                      <p className={mono.description + " mt-1"}>{alert.message}</p>
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
