"use client"
import { useState, useEffect } from 'react'
import { createBrowserClientWithConfig } from '@/lib/supabase-admin'

export interface MonitoringData {
  level: 'global' | 'franchise' | 'gym'
  activeSessions: number
  totalSessions: number
  todayCosts: number
  onlineKiosks: number
  totalKiosks: number
  avgSessionDuration: number
  recentErrors: number
}

export interface SessionData {
  id: string
  gym_id: string
  gym_name: string
  franchise_id?: string
  franchise_name?: string
  session_start: string
  session_end?: string
  cost_usd: number
  status: 'active' | 'completed' | 'error'
  duration_minutes?: number
}

export interface KioskData {
  gym_id: string
  gym_name: string
  franchise_id: string
  franchise_name: string
  kiosk_url: string
  status: 'online' | 'offline' | 'error'
  active_sessions: number
  daily_sessions: number
  daily_cost: number
}

interface UseMonitoringDataProps {
  level: 'global' | 'franchise' | 'gym'
  franchiseId?: string
  gymId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useMonitoringData({
  level,
  franchiseId,
  gymId,
  autoRefresh = true,
  refreshInterval = 30000
}: UseMonitoringDataProps) {
  const [monitoring, setMonitoring] = useState<MonitoringData>({
    level,
    activeSessions: 0,
    totalSessions: 0,
    todayCosts: 0,
    onlineKiosks: 0,
    totalKiosks: 0,
    avgSessionDuration: 0,
    recentErrors: 0
  })
  
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [kiosks, setKiosks] = useState<KioskData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setError(null)
      const supabase = createBrowserClientWithConfig()

      // Période: aujourd'hui (UTC)
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      // Construire la requête selon le niveau
      let sessionsQuery = supabase
        .from('openai_realtime_sessions')
        .select(`
          session_id,
          session_started_at,
          session_ended_at,
          total_cost_usd,
          gym_id,
          gyms (
            id,
            name,
            franchise_id,
            franchises (
              id,
              name
            )
          )
        `)
        .gte('session_started_at', startOfDay.toISOString())
        .order('session_started_at', { ascending: false })

      let gymsQuery = supabase
        .from('gyms')
        .select(`
          id,
          name,
          kiosk_config,
          franchise_id,
          franchises (
            id,
            name
          )
        `)
        .not('kiosk_config', 'is', null)

      // Filtrage par niveau
      if (level === 'franchise' && franchiseId) {
        // Filtrer par franchise
        gymsQuery = gymsQuery.eq('franchise_id', franchiseId)
        
        // Pour les sessions, on filtrera après avoir récupéré les données
        // car la relation est indirecte (sessions -> gym -> franchise)
      } else if (level === 'gym' && gymId) {
        // Filtrer par gym spécifique
        sessionsQuery = sessionsQuery.eq('gym_id', gymId)
        gymsQuery = gymsQuery.eq('id', gymId)
      }

      // Limiter les sessions pour la performance
      if (level === 'global') {
        sessionsQuery = sessionsQuery.limit(50)
      } else {
        sessionsQuery = sessionsQuery.limit(20)
      }

      const [sessionsResponse, gymsResponse] = await Promise.all([
        sessionsQuery,
        gymsQuery
      ])

      if (sessionsResponse.error) {
        // Warning supprimé pour production
      }
      if (gymsResponse.error) {
        // Erreur supprimée pour production
        throw gymsResponse.error
      }

      let sessionsData = sessionsResponse.data || []
      const gymsData = gymsResponse.data || []

      // Filtrage post-requête pour les franchises (relation indirecte)
      if (level === 'franchise' && franchiseId) {
        const franchiseGymIds = gymsData.map(gym => gym.id)
        sessionsData = sessionsData.filter(session => 
          franchiseGymIds.includes(session.gym_id)
        )
      }

      // Transformer les données sessions (colonnes normalisées)
      const transformedSessions: SessionData[] = sessionsData.map((session: any) => ({
        id: session.session_id,
        gym_id: session.gym_id,
        gym_name: (session.gyms as any)?.name || 'Salle inconnue',
        franchise_id: (session.gyms as any)?.franchise_id,
        franchise_name: (session.gyms as any)?.franchises?.name || 'Franchise inconnue',
        session_start: session.session_started_at,
        session_end: session.session_ended_at,
        cost_usd: session.total_cost_usd || 0,
        status: session.session_ended_at ? 'completed' : 'active',
        duration_minutes: session.session_ended_at ?
          Math.round((new Date(session.session_ended_at).getTime() - new Date(session.session_started_at).getTime()) / 60000) :
          undefined
      }))

      // Récupérer heartbeats pour statut online
      let heartbeatsMap: Record<string, string | null> = {}
      if (gymsData.length > 0) {
        const gymIds = gymsData.map((g: any) => g.id)
        const hbRes = await supabase
          .from('kiosk_heartbeats')
          .select('gym_id,last_heartbeat')
          .in('gym_id', gymIds)
        if (!hbRes.error && hbRes.data) {
          hbRes.data.forEach((h: any) => { heartbeatsMap[h.gym_id] = h.last_heartbeat })
        }
      }

      const ONLINE_THRESHOLD_MS = 2 * 60 * 1000
      const nowTs = Date.now()

      // Transformer les données kiosks (sessions du jour + statut online réel)
      const transformedKiosks: KioskData[] = gymsData.map((gym: any) => {
        const gymSessions = transformedSessions.filter(s => s.gym_id === gym.id)
        const activeSessions = gymSessions.filter(s => s.status === 'active').length
        const dailyCost = gymSessions.reduce((sum, s) => sum + s.cost_usd, 0)
        const lastHb = heartbeatsMap[gym.id]
        const hasRecentHb = lastHb ? (nowTs - new Date(lastHb).getTime() < ONLINE_THRESHOLD_MS) : false
        const isProvisioned = !!gym.kiosk_config?.is_provisioned
        const status: KioskData['status'] = isProvisioned && hasRecentHb ? 'online' : isProvisioned ? 'offline' : 'error'

        return {
          gym_id: gym.id,
          gym_name: gym.name,
          franchise_id: gym.franchise_id,
          franchise_name: (gym.franchises as any)?.name || 'Franchise inconnue',
          kiosk_url: gym.kiosk_config?.kiosk_url || '',
          status,
          active_sessions: activeSessions,
          daily_sessions: gymSessions.length,
          daily_cost: Math.round(dailyCost * 100) / 100
        }
      })

      // Calculer les métriques consolidées
      const activeSessions = transformedSessions.filter(s => s.status === 'active').length
      const totalSessions = transformedSessions.length

      // Coûts du jour: utiliser la vue unifiée jarvis_unified_costs
      let todayCosts = 0
      {
        let costQuery = supabase
          .from('jarvis_unified_costs')
          .select('total_cost, timestamp, gym_id, franchise_id')
          .gte('timestamp', startOfDay.toISOString())
        if (level === 'gym' && gymId) costQuery = costQuery.eq('gym_id', gymId)
        if (level === 'franchise' && franchiseId) costQuery = costQuery.eq('franchise_id', franchiseId)
        const costRes = await costQuery
        if (!costRes.error && costRes.data) {
          todayCosts = (costRes.data as any[]).reduce((sum, r) => sum + (r.total_cost || 0), 0)
        }
      }
      const onlineKiosks = transformedKiosks.filter(k => k.status === 'online').length
      const totalKiosks = transformedKiosks.length

      const completedSessions = transformedSessions.filter(s => s.duration_minutes)
      const avgSessionDuration = completedSessions.length > 0 ?
        completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length :
        0

      setMonitoring({
        level,
        activeSessions,
        totalSessions,
        todayCosts: Math.round(todayCosts * 100) / 100,
        onlineKiosks,
        totalKiosks,
        avgSessionDuration: Math.round(avgSessionDuration * 10) / 10,
        recentErrors: 0 // À implémenter plus tard
      })

      setSessions(transformedSessions)
      setKiosks(transformedKiosks)

    } catch (err) {
      // Erreur supprimée pour production
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [level, franchiseId, gymId, autoRefresh, refreshInterval])

  return {
    monitoring,
    sessions,
    kiosks,
    loading,
    error,
    refresh: loadData
  }
}