'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { MetricCard } from '@/components/dashboard-v2/MetricCard'
import { Users, Activity, TrendingUp, Clock } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

/**
 * PAGE ANALYTICS - Graphiques et insights
 */

export default function AnalyticsPage() {
  // Données mock pour les graphiques
  const sessionsData = [
    { day: 'Lun', sessions: 42, membres: 35 },
    { day: 'Mar', sessions: 38, membres: 32 },
    { day: 'Mer', sessions: 51, membres: 41 },
    { day: 'Jeu', sessions: 48, membres: 39 },
    { day: 'Ven', sessions: 68, membres: 52 },
    { day: 'Sam', sessions: 72, membres: 58 },
    { day: 'Dim', sessions: 45, membres: 38 },
  ]
  
  const sentimentData = [
    { sentiment: 'Positif', count: 245 },
    { sentiment: 'Neutre', count: 89 },
    { sentiment: 'Négatif', count: 23 },
  ]
  
  const topicsData = [
    { topic: 'Perte de poids', count: 156 },
    { topic: 'Prise de muscle', count: 134 },
    { topic: 'Nutrition', count: 98 },
    { topic: 'Cardio', count: 87 },
    { topic: 'Programme', count: 76 },
  ]
  
  const metrics = [
    {
      label: 'Durée moyenne',
      value: '3min 24s',
      icon: Clock,
      iconColor: 'primary' as const,
      trend: { value: '+15s', direction: 'up' as const, isPositive: true },
    },
    {
      label: 'Taux satisfaction',
      value: '92%',
      icon: TrendingUp,
      iconColor: 'success' as const,
      trend: { value: '+3%', direction: 'up' as const, isPositive: true },
    },
    {
      label: 'Sessions/jour',
      value: '52',
      icon: Activity,
      iconColor: 'info' as const,
      trend: { value: '+8', direction: 'up' as const, isPositive: true },
    },
    {
      label: 'Utilisateurs uniques',
      value: '245',
      icon: Users,
      iconColor: 'primary' as const,
      trend: { value: '+12', direction: 'up' as const, isPositive: true },
    },
  ]
  
  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Performance JARVIS - Derniers 7 jours</p>
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sessions par jour</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
              <option>90 derniers jours</option>
            </select>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sessionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                stroke="rgb(37, 99, 235)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'rgb(37, 99, 235)' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Moyenne</p>
              <p className="text-lg font-semibold text-gray-900">52 sessions/jour</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pic</p>
              <p className="text-lg font-semibold text-gray-900">72 (Samedi)</p>
            </div>
          </div>
        </div>
        
        {/* Sentiment Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sentiment conversations</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="sentiment" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="rgb(37, 99, 235)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Taux de satisfaction global</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: '92%' }}
                />
              </div>
              <span className="text-lg font-semibold text-green-600">92%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Topics Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sujets les plus discutés</h3>
        
        <div className="space-y-3">
          {topicsData.map((topic, index) => (
            <div key={topic.topic} className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                  <span className="text-sm font-semibold text-gray-600">{topic.count} fois</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(topic.count / topicsData[0].count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}

