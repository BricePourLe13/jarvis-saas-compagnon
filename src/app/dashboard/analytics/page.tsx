'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, MessageSquare } from 'lucide-react'

interface AnalyticsData {
  dailySessions: Array<{ date: string; count: number }>
  sentimentDistribution: Array<{ sentiment: string; count: number }>
  topTopics: Array<{ topic: string; count: number }>
  memberEngagement: {
    active: number
    inactive: number
    atRisk: number
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then(res => res.json())
      .then(analyticsData => {
        setData(analyticsData)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const maxDailySessions = Math.max(...data.dailySessions.map(d => d.count))
  const totalSentiment = data.sentimentDistribution.reduce((sum, s) => sum + s.count, 0)
  const maxTopicCount = Math.max(...data.topTopics.map(t => t.count))

  return (
    <div className="space-y-8">
      {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Analyse détaillée des performances et tendances
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground">Engagement Membres</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actifs</span>
                <span className="font-medium text-green-500">{data.memberEngagement.active}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Inactifs</span>
                <span className="font-medium text-gray-500">{data.memberEngagement.inactive}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">À risque</span>
                <span className="font-medium text-red-500">{data.memberEngagement.atRisk}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <MessageSquare className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground">Sessions Totales</h3>
            </div>
            <p className="text-4xl font-bold text-foreground">
              {data.dailySessions.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Derniers 7 jours</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground">Sentiment Positif</h3>
            </div>
            <p className="text-4xl font-bold text-foreground">
              {totalSentiment > 0 
                ? Math.round((data.sentimentDistribution.find(s => s.sentiment === 'positive')?.count || 0) / totalSentiment * 100)
                : 0}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">Des conversations</p>
          </div>
        </div>

        {/* Daily Sessions Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Sessions quotidiennes</h3>
          <div className="space-y-4">
            {data.dailySessions.map((day) => {
              const percentage = maxDailySessions > 0 ? (day.count / maxDailySessions) * 100 : 0
              return (
                <div key={day.date}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="font-medium text-foreground">{day.count} sessions</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sentiment & Topics Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sentiment Distribution */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Distribution des sentiments</h3>
            <div className="space-y-4">
              {data.sentimentDistribution.map((item) => {
                const percentage = totalSentiment > 0 ? (item.count / totalSentiment) * 100 : 0
                const colors = {
                  positive: { bg: 'bg-green-500', text: 'text-green-500', label: 'Positif' },
                  neutral: { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Neutre' },
                  negative: { bg: 'bg-red-500', text: 'text-red-500', label: 'Négatif' }
                }
                const color = colors[item.sentiment as keyof typeof colors] || { bg: 'bg-gray-500', text: 'text-gray-500', label: item.sentiment }

                return (
                  <div key={item.sentiment}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={`font-medium ${color.text}`}>{color.label}</span>
                      <span className="text-muted-foreground">{item.count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color.bg} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Topics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Sujets les plus discutés</h3>
            <div className="space-y-4">
              {data.topTopics.map((topic, index) => {
                const percentage = maxTopicCount > 0 ? (topic.count / maxTopicCount) * 100 : 0
                return (
                  <div key={topic.topic}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground font-medium">#{index + 1} {topic.topic}</span>
                      <span className="text-muted-foreground">{topic.count} mentions</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
    </div>
  )
}
