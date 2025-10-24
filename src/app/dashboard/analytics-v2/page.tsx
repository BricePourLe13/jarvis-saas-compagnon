'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  Title,
  Text,
  AreaChart,
  BarChart,
  DonutChart,
  Grid,
  Flex,
  Metric,
  BadgeDelta,
  Legend
} from '@tremor/react'
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'

/**
 * 📊 DASHBOARD ANALYTICS - Version Tremor Enterprise
 * Graphiques et insights avancés
 */

interface AnalyticsData {
  sessionsData: Array<{
    day: string
    sessions: number
    membres: number
  }>
  sentimentData: Array<{
    sentiment: string
    count: number
  }>
  topicsData: Array<{
    topic: string
    count: number
  }>
  metrics: {
    average_duration_seconds: number
    average_satisfaction_score: number
    average_sessions_per_day: number
    unique_members_count: number
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/dashboard/analytics-v2')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setAnalyticsData(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Chargement des analytics...</Text>
        </div>
      </div>
    )
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <Title>Erreur de chargement</Title>
          <Text>{error || 'Impossible de charger les analytics'}</Text>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Title>Analytics Avancés</Title>
          <Text>Insights et tendances détaillés</Text>
        </div>

        {/* KPIs Summary */}
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
          <Card decoration="top" decorationColor="blue">
            <Flex alignItems="center" className="space-x-2">
              <ClockIcon className="h-6 w-6 text-blue-600" />
              <Text>Durée moyenne</Text>
            </Flex>
            <Metric className="mt-2">
              {formatDuration(analyticsData.metrics.average_duration_seconds)}
            </Metric>
          </Card>

          <Card decoration="top" decorationColor="emerald">
            <Flex alignItems="center" className="space-x-2">
              <FaceSmileIcon className="h-6 w-6 text-emerald-600" />
              <Text>Satisfaction moyenne</Text>
            </Flex>
            <Metric className="mt-2">
              {analyticsData.metrics.average_satisfaction_score.toFixed(1)}/5
            </Metric>
          </Card>

          <Card decoration="top" decorationColor="amber">
            <Flex alignItems="center" className="space-x-2">
              <ChartBarIcon className="h-6 w-6 text-amber-600" />
              <Text>Sessions/jour</Text>
            </Flex>
            <Metric className="mt-2">
              {analyticsData.metrics.average_sessions_per_day.toFixed(1)}
            </Metric>
          </Card>

          <Card decoration="top" decorationColor="violet">
            <Flex alignItems="center" className="space-x-2">
              <UsersIcon className="h-6 w-6 text-violet-600" />
              <Text>Membres uniques</Text>
            </Flex>
            <Metric className="mt-2">
              {analyticsData.metrics.unique_members_count}
            </Metric>
          </Card>
        </Grid>

        {/* Sessions Timeline */}
        <Card>
          <Title>Évolution des sessions (7 derniers jours)</Title>
          <AreaChart
            className="mt-4 h-72"
            data={analyticsData.sessionsData}
            index="day"
            categories={["sessions", "membres"]}
            colors={["blue", "emerald"]}
            valueFormatter={(value) => `${value}`}
            showLegend={true}
            showGridLines={true}
            showAnimation={true}
          />
        </Card>

        {/* Grid with 2 charts */}
        <Grid numItems={1} numItemsLg={2} className="gap-6">
          {/* Sentiment Distribution */}
          <Card>
            <Title>Distribution des sentiments</Title>
            <DonutChart
              className="mt-4 h-60"
              data={analyticsData.sentimentData.map(s => ({
                name: s.sentiment === 'positive' ? 'Positif' :
                      s.sentiment === 'negative' ? 'Négatif' : 'Neutre',
                value: s.count
              }))}
              category="value"
              index="name"
              colors={["emerald", "rose", "gray"]}
              showAnimation={true}
              valueFormatter={(value) => `${value} sessions`}
            />
            <Legend
              className="mt-4"
              categories={["Positif", "Négatif", "Neutre"]}
              colors={["emerald", "rose", "gray"]}
            />
          </Card>

          {/* Top Topics */}
          <Card>
            <Title>Top 5 sujets de conversation</Title>
            <BarChart
              className="mt-4 h-60"
              data={analyticsData.topicsData}
              index="topic"
              categories={["count"]}
              colors={["blue"]}
              valueFormatter={(value) => `${value} mentions`}
              showAnimation={true}
              showLegend={false}
              layout="vertical"
            />
          </Card>
        </Grid>

        {/* Insights Summary */}
        <Card>
          <Title>Insights clés</Title>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Text className="font-semibold text-blue-900">Engagement</Text>
              <Text className="text-sm text-blue-700 mt-2">
                {analyticsData.metrics.unique_members_count} membres uniques ont utilisé JARVIS ces 7 derniers jours, 
                avec une moyenne de {analyticsData.metrics.average_sessions_per_day.toFixed(1)} sessions par jour.
              </Text>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg">
              <Text className="font-semibold text-emerald-900">Satisfaction</Text>
              <Text className="text-sm text-emerald-700 mt-2">
                Le score de satisfaction moyen est de {analyticsData.metrics.average_satisfaction_score.toFixed(1)}/5,
                avec {analyticsData.sentimentData.find(s => s.sentiment === 'positive')?.count || 0} sessions positives.
              </Text>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <Text className="font-semibold text-amber-900">Durée moyenne</Text>
              <Text className="text-sm text-amber-700 mt-2">
                Les conversations durent en moyenne {formatDuration(analyticsData.metrics.average_duration_seconds)},
                indiquant un bon niveau d'engagement des membres.
              </Text>
            </div>

            <div className="bg-violet-50 p-4 rounded-lg">
              <Text className="font-semibold text-violet-900">Sujets populaires</Text>
              <Text className="text-sm text-violet-700 mt-2">
                Les sujets les plus discutés sont : {analyticsData.topicsData.slice(0, 3).map(t => t.topic).join(', ')}.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
