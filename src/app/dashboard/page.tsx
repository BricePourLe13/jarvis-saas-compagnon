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

      {/* Alertes Actionnables */}
      {alerts.length > 0 && (
        <div>
          <h2 className={mono.h2 + " text-xl mb-4"}>🚨 Alertes & Actions Prioritaires</h2>
          <div className="space-y-4">
            {alerts.map((alert) => {
              const alertStyles = {
                warning: {
                  bg: 'bg-yellow-500/5 border-yellow-500/20',
                  icon: 'text-yellow-500/80',
                  badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                },
                error: {
                  bg: 'bg-red-500/5 border-red-500/20',
                  icon: 'text-red-500/80',
                  badge: 'bg-red-500/10 text-red-500 border-red-500/30'
                },
                info: {
                  bg: 'bg-blue-500/5 border-blue-500/20',
                  icon: 'text-blue-500/80',
                  badge: 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                }
              }[alert.type]

              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-5 backdrop-blur-xl ${alertStyles.bg}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertTriangle className={`h-6 w-6 mt-0.5 ${alertStyles.icon}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={mono.h3 + " text-base font-semibold"}>{alert.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${alertStyles.badge}`}>
                            {alert.type === 'warning' ? 'URGENT' : alert.type === 'error' ? 'CRITIQUE' : 'INFO'}
                          </span>
                        </div>
                        <p className={mono.description + " mb-3"}>{alert.message}</p>
                        
                        {/* Détails spécifiques selon le type d'alerte */}
                        {alert.metadata?.membersAtRisk && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-white/60 mb-2">Membres les plus à risque :</p>
                            {alert.metadata.membersAtRisk.slice(0, 3).map((member: any) => (
                              <div 
                                key={member.id}
                                className="flex items-center justify-between text-sm bg-white/5 rounded p-2"
                              >
                                <span className="text-white/90">{member.name}</span>
                                <span className="text-white/60">{member.daysInactive} jours d'inactivité</span>
                              </div>
                            ))}
                            {alert.metadata.totalCount > 3 && (
                              <p className="text-xs text-white/50 mt-1">
                                +{alert.metadata.totalCount - 3} autre{alert.metadata.totalCount - 3 > 1 ? 's' : ''} membre{alert.metadata.totalCount - 3 > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        )}

                        {alert.metadata?.negativeFeedbacks && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-white/60 mb-2">Derniers feedbacks négatifs :</p>
                            {alert.metadata.negativeFeedbacks.slice(0, 2).map((feedback: any, i: number) => (
                              <div 
                                key={i}
                                className="text-sm bg-white/5 rounded p-2"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white/90 font-medium">{feedback.memberName}</span>
                                  <span className="text-xs text-white/50">
                                    {new Date(feedback.date).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                                <p className="text-white/70 text-xs">Sujet : {feedback.topic}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions disponibles */}
                        {alert.actions && alert.actions.length > 0 && (
                          <div className="flex gap-2 mt-4">
                            {alert.actions.map((action: any, i: number) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (action.href) {
                                    window.location.href = action.href
                                  }
                                  // TODO: Handle action.action (send email, etc.)
                                }}
                                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded text-sm text-white/90 transition-colors border border-white/10"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
