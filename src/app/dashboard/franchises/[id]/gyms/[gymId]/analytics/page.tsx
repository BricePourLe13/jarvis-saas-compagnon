/**
 * 📈 GYM ANALYTICS - INSIGHTS & TENDANCES
 * Analytics avec nouvelle architecture Sentry
 */

'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

interface AnalyticsPageProps {
  params: Promise<{ id: string; gymId: string }>
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; gymId: string } | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params
        setResolvedParams(resolved)
      } catch (error) {
        console.error('Error resolving params:', error)
      }
    }
    resolveParams()
  }, [params])

  if (!resolvedParams) {
    return (
      <DashboardShell>
        <div>Chargement...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Analyse détaillée - Salle {resolvedParams.gymId}</p>
        </div>
        <div className="chart-container">
          <p className="text-muted-foreground">Module analytics en cours de migration...</p>
        </div>
      </div>
    </DashboardShell>
  )
}



