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

      // Construire la requête selon le niveau
      let sessionsQuery = supabase
        .from('openai_realtime_sessions')
        .select(`
          id,
          session_start,
          session_end,
          cost_usd,
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
        .order('session_start', { ascending: false })

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
        console.warn('Erreur sessions:', sessionsResponse.error)
      }
      if (gymsResponse.error) {
        console.error('Erreur gyms:', gymsResponse.error)
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

      // Transformer les données sessions
      const transformedSessions: SessionData[] = sessionsData.map(session => ({
        id: session.id,
        gym_id: session.gym_id,
        gym_name: (session.gyms as any)?.name || 'Salle inconnue',
        franchise_id: (session.gyms as any)?.franchise_id,
        franchise_name: (session.gyms as any)?.franchises?.name || 'Franchise inconnue',
        session_start: session.session_start,
        session_end: session.session_end,
        cost_usd: session.cost_usd || 0,
        status: session.session_end ? 'completed' : 'active',
        duration_minutes: session.session_end ? 
          Math.round((new Date(session.session_end).getTime() - new Date(session.session_start).getTime()) / 60000) : 
          undefined
      }))

      // Transformer les données kiosks
      const transformedKiosks: KioskData[] = gymsData.map(gym => {
        const gymSessions = transformedSessions.filter(s => s.gym_id === gym.id)
        const activeSessions = gymSessions.filter(s => s.status === 'active').length
        const dailyCost = gymSessions.reduce((sum, s) => sum + s.cost_usd, 0)

        return {
          gym_id: gym.id,
          gym_name: gym.name,
          franchise_id: gym.franchise_id,
          franchise_name: (gym.franchises as any)?.name || 'Franchise inconnue',
          kiosk_url: gym.kiosk_config?.kiosk_url || '',
          status: gym.kiosk_config?.is_provisioned ? 'online' : 'offline',
          active_sessions: activeSessions,
          daily_sessions: gymSessions.length,
          daily_cost: Math.round(dailyCost * 100) / 100
        }
      })

      // Calculer les métriques consolidées
      const activeSessions = transformedSessions.filter(s => s.status === 'active').length
      const totalSessions = transformedSessions.length
      const todayCosts = transformedSessions.reduce((sum, s) => sum + s.cost_usd, 0)
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
      console.error('Erreur loadData:', err)
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