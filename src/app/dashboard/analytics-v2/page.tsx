'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { MetricCard } from '@/components/dashboard-v2/MetricCard'
import { PageLoader } from '@/components/dashboard-v2/PageLoader'
import { Users, Activity, TrendingUp, MessageSquare } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useEffect, useState } from 'react'

/**
 * PAGE ANALYTICS-V2 - Graphiques et insights avec vraies données
 */

interface AnalyticsData {
  period: string
  visitsTrend: Array<{ date: string; visits: number }>
  sessionsPerDay: Array<{ date: string; sessions: number }>
  topMembers: Array<{ name: string; sessions: number }>
  sentimentDistribution: { positive: number; neutral: number; negative: number }
  topicsDistribution: Array<{ topic: string; count: number }>
}

export default function AnalyticsV2Page() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('7d')

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)
        
        const res = await fetch(`/api/dashboard/analytics-v2?period=${period}`)
        
        if (!res.ok) {
          throw new Error('Erreur chargement analytics')
        }

        const data: AnalyticsData = await res.json()
        setAnalytics(data)
      } catch (err) {
        console.error('Erreur:', err)
        setError('Impossible de charger les analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [period])

  if (loading) {
    return (
      <DashboardShell>
        <PageLoader message="Chargement des analytics..." />
      </DashboardShell>
    )
  }

  if (error || !analytics) {
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

  // Préparer les données pour les graphiques
  const totalSessions = analytics.sessionsPerDay.reduce((acc, item) => acc + item.sessions, 0)
  const avgSessionsPerDay = analytics.sessionsPerDay.length > 0 
    ? Math.round(totalSessions / analytics.sessionsPerDay.length) 
    : 0

  const totalVisits = analytics.visitsTrend.reduce((acc, item) => acc + item.visits, 0)
  
  const totalSentiment = analytics.sentimentDistribution.positive + 
                         analytics.sentimentDistribution.neutral + 
                         analytics.sentimentDistribution.negative
  
  const satisfactionRate = totalSentiment > 0
    ? Math.round((analytics.sentimentDistribution.positive / totalSentiment) * 100)
    : 0

  const metrics = [
    {
      label: 'Total sessions',
      value: totalSessions.toString(),
      icon: Activity,
      iconColor: 'primary' as const,
    },
    {
      label: 'Sessions/jour (moy.)',
      value: avgSessionsPerDay.toString(),
      icon: MessageSquare,
      iconColor: 'info' as const,
    },
    {
      label: 'Taux satisfaction',
      value: `${satisfactionRate}%`,
      icon: TrendingUp,
      iconColor: satisfactionRate >= 80 ? 'success' as const : 'warning' as const,
    },
    {
      label: 'Total visites',
      value: totalVisits.toString(),
      icon: Users,
      iconColor: 'primary' as const,
    },
  ]

  // Données pour le pie chart sentiment
  const sentimentData = [
    { name: 'Positif', value: analytics.sentimentDistribution.positive, color: '#10b981' },
    { name: 'Neutre', value: analytics.sentimentDistribution.neutral, color: '#6b7280' },
    { name: 'Négatif', value: analytics.sentimentDistribution.negative, color: '#ef4444' },
  ].filter(item => item.value > 0)

  // Formater les dates pour affichage
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  const sessionsChartData = analytics.sessionsPerDay.map(item => ({
    date: formatDate(item.date),
    sessions: item.sessions
  }))

  const visitsChartData = analytics.visitsTrend.map(item => ({
    date: formatDate(item.date),
    visits: item.visits
  }))

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Performance JARVIS détaillée</p>
        </div>

        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
          <option value="1y">1 année</option>
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sessions Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sessions par jour</h3>
          
          {sessionsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sessionsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Aucune donnée
            </div>
          )}
        </div>

        {/* Visits Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Visites par jour</h3>
          
          {visitsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visitsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Aucune donnée
            </div>
          )}
        </div>

        {/* Sentiment Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribution sentiment</h3>
          
          {sentimentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Aucune donnée
            </div>
          )}
        </div>

        {/* Top Topics */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Topics les plus discutés</h3>
          
          {analytics.topicsDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topicsDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="topic" 
                  stroke="#6b7280" 
                  style={{ fontSize: '10px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Top Members */}
      {analytics.topMembers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top 5 membres actifs</h3>
          
          <div className="space-y-3">
            {analytics.topMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{member.name}</span>
                </div>
                <span className="text-sm text-gray-600">{member.sessions} sessions</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
