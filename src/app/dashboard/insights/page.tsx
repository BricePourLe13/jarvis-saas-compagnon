'use client'

import { useEffect, useState } from 'react'
import { useGymContext } from '@/contexts/GymContext'
import { 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  MessageSquare,
  Users,
  Heart,
  Target,
  Award,
  ThumbsUp,
  ThumbsDown,
  Bell
} from 'lucide-react'

interface Alert {
  id: string
  type: 'churn_risk' | 'negative_feedback' | 'achievement' | 'info'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  member_id?: string
  member_name?: string
  action_url?: string
  created_at: string
  is_read: boolean
}

interface Insight {
  category: string
  title: string
  description: string
  value: string | number
  trend?: number
  icon: any
  color: string
}

export default function InsightsPage() {
  const { selectedGymId, userRole } = useGymContext()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (!selectedGymId) return

    async function fetchInsights() {
      try {
        setLoading(true)
        const [alertsRes, insightsRes] = await Promise.all([
          fetch(`/api/dashboard/insights/alerts?gym_id=${selectedGymId}`),
          fetch(`/api/dashboard/insights/summary?gym_id=${selectedGymId}`)
        ])

        const alertsData = await alertsRes.json()
        const insightsData = await insightsRes.json()

        setAlerts(alertsData.alerts || [])
        setInsights(insightsData.insights || [])
      } catch (error) {
        console.error('Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [selectedGymId])

  const markAlertAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/dashboard/insights/alerts/${alertId}/read`, {
        method: 'POST'
      })
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a))
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  if (!selectedGymId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Aucune salle sélectionnée</h2>
          <p className="text-muted-foreground">
            Sélectionnez une salle pour voir vos insights
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

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => !a.is_read)

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'churn_risk':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'negative_feedback':
        return <ThumbsDown className="h-5 w-5 text-orange-500" />
      case 'achievement':
        return <Award className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-500/10 text-red-500 border-red-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }[priority] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles}`}>
        {priority === 'high' ? 'Urgent' : priority === 'medium' ? 'Important' : 'Info'}
      </span>
    )
  }

  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Insights & Recommandations</h1>
        <p className="text-muted-foreground mt-2">
          Analyse IA de vos interactions JARVIS et alertes proactives
        </p>
      </div>

      {/* Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${insight.color}`}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{insight.category}</p>
                <h3 className="text-lg font-bold text-foreground">{insight.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground">{insight.value}</p>
              {insight.trend !== undefined && (
                <div className={`flex items-center gap-1 ${insight.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {insight.trend > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{Math.abs(insight.trend)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Alertes */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Alertes & Actions Recommandées
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Toutes ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredAlerts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' ? 'Aucune alerte pour le moment' : 'Toutes les alertes sont lues'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`px-6 py-4 hover:bg-muted/50 transition-colors ${
                  !alert.is_read ? 'bg-blue-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getPriorityBadge(alert.priority)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {!alert.is_read && (
                        <span className="text-xs text-primary font-medium">Nouveau</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">{alert.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                    {alert.member_name && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Membre concerné : <span className="font-medium text-foreground">{alert.member_name}</span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      {!alert.is_read && (
                        <button
                          onClick={() => markAlertAsRead(alert.id)}
                          className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      {alert.action_url && (
                        <a
                          href={alert.action_url}
                          className="px-3 py-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                        >
                          Voir détails
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

