/**
 * 🔍 MONITORING SESSIONS PRODUCTION
 * Surveillance en temps réel des sessions avec nettoyage automatique
 */

import { getSupabaseService } from './supabase-service'

const supabase = getSupabaseService()

export interface SessionStats {
  total_active: number
  total_today: number
  avg_duration_minutes: number
  members_active: number
  gyms_active: number
}

export interface ActiveSession {
  session_id: string
  member_id: string
  member_name: string
  badge_id: string
  gym_id: string
  kiosk_slug: string
  started_at: string
  duration_minutes: number
  last_activity: string
}

class SessionMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  /**
   * Démarrer le monitoring automatique
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('🔍 [MONITOR] Monitoring déjà actif')
      return
    }

    console.log('🔍 [MONITOR] Démarrage monitoring sessions')
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.cleanupOrphanSessions()
        await this.updateSessionActivity()
      } catch (error) {
        console.error('❌ [MONITOR] Erreur monitoring:', error)
      }
    }, this.CLEANUP_INTERVAL)

    // Nettoyage initial
    this.cleanupOrphanSessions()
  }

  /**
   * Arrêter le monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('🔍 [MONITOR] Monitoring arrêté')
    }
  }

  /**
   * Obtenir les statistiques des sessions
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const supabase = getSupabaseService()

      // Sessions actives
      const { data: activeSessions } = await supabase
        .from('openai_realtime_sessions')
        .select('id, session_duration_seconds, member_id, gym_id')
        .eq('state', 'active')
        .is('session_ended_at', null)

      // Sessions d'aujourd'hui
      const { data: todaySessions } = await supabase
        .from('openai_realtime_sessions')
        .select('session_duration_seconds')
        .gte('session_started_at', new Date().toISOString().split('T')[0])

      // Calculer les stats
      const totalActive = activeSessions?.length || 0
      const totalToday = todaySessions?.length || 0
      const avgDuration = todaySessions?.length 
        ? todaySessions.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0) / todaySessions.length / 60
        : 0
      const membersActive = new Set(activeSessions?.map(s => s.member_id).filter(Boolean)).size
      const gymsActive = new Set(activeSessions?.map(s => s.gym_id).filter(Boolean)).size

      return {
        total_active: totalActive,
        total_today: totalToday,
        avg_duration_minutes: Math.round(avgDuration),
        members_active: membersActive,
        gyms_active: gymsActive
      }

    } catch (error) {
      console.error('❌ [MONITOR] Erreur stats:', error)
      return {
        total_active: 0,
        total_today: 0,
        avg_duration_minutes: 0,
        members_active: 0,
        gyms_active: 0
      }
    }
  }

  /**
   * Obtenir les sessions actives détaillées
   */
  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const supabase = getSupabaseService()

      const { data: sessions, error } = await supabase
        .from('openai_realtime_sessions')
        .select(`
          session_id,
          member_id,
          member_badge_id,
          gym_id,
          kiosk_slug,
          session_started_at,
          last_activity_at,
          session_metadata
        `)
        .eq('state', 'active')
        .is('session_ended_at', null)
        .order('session_started_at', { ascending: false })

      if (error || !sessions) {
        console.error('❌ [MONITOR] Erreur sessions actives:', error)
        return []
      }

      // Enrichir avec les infos membres
      const enrichedSessions: ActiveSession[] = []
      
      for (const session of sessions) {
        const memberProfile = session.member_id 
          ? (await supabase
              .from('gym_members_v2')
              .select('first_name, last_name')
              .eq('id', session.member_id)
              .single()).data
          : null

        const startTime = new Date(session.session_started_at)
        const durationMinutes = Math.floor((Date.now() - startTime.getTime()) / (1000 * 60))

        enrichedSessions.push({
          session_id: session.session_id,
          member_id: session.member_id || 'unknown',
          member_name: memberProfile 
            ? `${memberProfile.first_name} ${memberProfile.last_name}`
            : session.session_metadata?.member_name || 'Membre inconnu',
          badge_id: session.member_badge_id || 'unknown',
          gym_id: session.gym_id,
          kiosk_slug: session.kiosk_slug || 'unknown',
          started_at: session.session_started_at,
          duration_minutes: durationMinutes,
          last_activity: session.last_activity_at || session.session_started_at
        })
      }

      return enrichedSessions

    } catch (error) {
      console.error('❌ [MONITOR] Erreur sessions actives:', error)
      return []
    }
  }

  /**
   * Nettoyer les sessions orphelines/expirées
   */
  async cleanupOrphanSessions(): Promise<number> {
    try {
      const supabase = getSupabaseService()

      // Fermer les sessions inactives depuis plus de 30 minutes
      const timeoutThreshold = new Date(Date.now() - this.SESSION_TIMEOUT).toISOString()

      const { data: expiredSessions } = await supabase
        .from('openai_realtime_sessions')
        .select('session_id, member_id')
        .eq('state', 'active')
        .is('session_ended_at', null)
        .lt('last_activity_at', timeoutThreshold)

      if (!expiredSessions || expiredSessions.length === 0) {
        return 0
      }

      console.log(`🧹 [MONITOR] Nettoyage ${expiredSessions.length} sessions expirées`)

      // Fermer chaque session expirée
      let cleanedCount = 0
      for (const session of expiredSessions) {
        const { error } = await supabase.rpc('close_session_robust', {
          p_session_id: session.session_id,
          p_reason: 'inactivity_timeout'
        })

        if (!error) {
          cleanedCount++
        } else {
          console.error(`❌ [MONITOR] Erreur fermeture ${session.session_id}:`, error)
        }
      }

      console.log(`✅ [MONITOR] ${cleanedCount} sessions nettoyées`)
      return cleanedCount

    } catch (error) {
      console.error('❌ [MONITOR] Erreur nettoyage:', error)
      return 0
    }
  }

  /**
   * Mettre à jour l'activité des sessions (heartbeat)
   */
  private async updateSessionActivity(): Promise<void> {
    // Cette fonction pourrait être appelée par le frontend
    // pour maintenir les sessions actives à jour
    console.log('💓 [MONITOR] Heartbeat sessions')
  }

  /**
   * Forcer la fermeture d'une session
   */
  async forceCloseSession(sessionId: string, reason: string = 'admin_force_close'): Promise<boolean> {
    try {
      const supabase = getSupabaseService()

      const { data, error } = await supabase.rpc('close_session_robust', {
        p_session_id: sessionId,
        p_reason: reason
      })

      if (error) {
        console.error(`❌ [MONITOR] Erreur fermeture forcée ${sessionId}:`, error)
        return false
      }

      console.log(`🔨 [MONITOR] Session fermée de force: ${sessionId}`)
      return true

    } catch (error) {
      console.error('❌ [MONITOR] Erreur fermeture forcée:', error)
      return false
    }
  }
}

// Instance singleton
export const sessionMonitor = new SessionMonitor()

// Démarrer automatiquement en production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  sessionMonitor.startMonitoring()
}



