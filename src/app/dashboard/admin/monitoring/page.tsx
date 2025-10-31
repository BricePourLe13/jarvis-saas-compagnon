'use client'

import { useEffect, useState } from 'react'
import { useGymContext } from '@/contexts/GymContext'
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Server, 
  Database,
  Zap,
  Clock
} from 'lucide-react'

interface MonitoringData {
  system: {
    uptime: number
    health: 'healthy' | 'degraded' | 'down'
    lastCheck: string
    edgeFunctions: {
      total: number
      active: number
      errors24h: number
    }
    database: {
      connections: number
      queries24h: number
      avgResponseTime: number
    }
  }
  costs: {
    currentMonth: {
      total: number
      openai: number
      supabase: number
      vercel: number
    }
    lastMonth: {
      total: number
    }
    breakdown: Array<{
      service: string
      cost: number
      usage: string
      trend: number
    }>
  }
  performance: {
    avgApiResponseTime: number
    avgOpenAILatency: number
    totalRequests24h: number
    errorRate: number
  }
}

export default function MonitoringPage() {
  const { userRole } = useGymContext()
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMonitoring() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/admin/monitoring')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching monitoring data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonitoring()
    
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchMonitoring, 30000)
    return () => clearInterval(interval)
  }, [])

  // Vérifier les permissions
  if (userRole !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">
            Cette page est réservée aux super administrateurs.
          </p>
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getHealthBadge = (health: string) => {
    const styles = {
      healthy: 'bg-green-500/10 text-green-500 border-green-500/20',
      degraded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      down: 'bg-red-500/10 text-red-500 border-red-500/20'
    }[health] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

    const labels = {
      healthy: 'Opérationnel',
      degraded: 'Dégradé',
      down: 'Hors ligne'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
        {labels[health as keyof typeof labels] || health}
      </span>
    )
  }

  const costTrend = ((data.costs.currentMonth.total - data.costs.lastMonth.total) / data.costs.lastMonth.total) * 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monitoring & Coûts</h1>
        <p className="text-muted-foreground mt-2">
          Surveillance système et analyse des coûts d'infrastructure
        </p>
      </div>

      {/* System Health */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Server className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-foreground">État du Système</h2>
              <p className="text-sm text-muted-foreground">Dernière vérification : {new Date(data.system.lastCheck).toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>
          {getHealthBadge(data.system.health)}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uptime</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.system.uptime.toFixed(2)}%</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Edge Functions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.system.edgeFunctions.active}/{data.system.edgeFunctions.total}</p>
            <p className="text-xs text-red-500 mt-1">{data.system.edgeFunctions.errors24h} erreurs (24h)</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Database</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.system.database.connections}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.system.database.queries24h.toLocaleString()} queries/24h</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Response Time</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.system.database.avgResponseTime}ms</p>
          </div>
        </div>
      </div>

      {/* Costs Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Coût Total Mois</span>
          </div>
          <p className="text-3xl font-bold text-foreground">${data.costs.currentMonth.total.toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-2">
            {costTrend > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-green-500 transform rotate-180" />
            )}
            <span className={`text-sm ${costTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {Math.abs(costTrend).toFixed(1)}% vs mois dernier
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">OpenAI</span>
          </div>
          <p className="text-3xl font-bold text-foreground">${data.costs.currentMonth.openai.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {((data.costs.currentMonth.openai / data.costs.currentMonth.total) * 100).toFixed(0)}% du total
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Infrastructure</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${(data.costs.currentMonth.supabase + data.costs.currentMonth.vercel).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supabase + Vercel
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Détail des Coûts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Service</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">Usage</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-foreground">Coût</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-foreground">Tendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.costs.breakdown.map((item, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{item.service}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-muted-foreground">{item.usage}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-medium text-foreground">${item.cost.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm ${item.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Performances (24h)</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">API Response Time</p>
            <p className="text-2xl font-bold text-foreground">{data.performance.avgApiResponseTime}ms</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">OpenAI Latency</p>
            <p className="text-2xl font-bold text-foreground">{data.performance.avgOpenAILatency}ms</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Requests</p>
            <p className="text-2xl font-bold text-foreground">{data.performance.totalRequests24h.toLocaleString()}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Error Rate</p>
            <p className="text-2xl font-bold text-foreground">{data.performance.errorRate.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}



