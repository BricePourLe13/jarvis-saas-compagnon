/**
 * 🎯 Service Monitoring OpenAI Realtime SIMPLIFIÉ
 * Version corrigée qui utilise directement nos tables et fonctions SQL
 */

import { getSupabaseSingleton } from './supabase-singleton'

export interface SimpleKioskStats {
  gym_id: string
  sessions_24h: number
  active_sessions: number
  total_cost_24h_usd: number
  avg_session_duration: number
  total_user_turns: number
  total_ai_turns: number
  last_session_time: string | null
  error_rate_percent: number
}

export interface SimpleActiveSession {
  session_id: string
  kiosk_slug: string
  member_name: string | null
  duration_seconds: number
  user_turns: number
  ai_turns: number
  current_cost_usd: number
  started_at: string
}

export interface SimpleAudioEvent {
  id: string
  session_id: string
  event_type: string
  event_timestamp: string
  user_transcript: string | null
  ai_transcript_final: string | null
}

export class OpenAIRealtimeMonitoringServiceFixed {
  private supabase = getSupabaseSingleton()

  /**
   * 📊 Obtenir les stats simplifiées d'un gym
   */
  async getGymStats(gymId: string): Promise<SimpleKioskStats | null> {
    try {
      console.log('🔍 [MONITORING] Récupération stats pour gym:', gymId)

      // Utiliser notre fonction SQL directement
      const { data, error } = await this.supabase
        .rpc('get_kiosk_realtime_metrics', { p_gym_id: gymId, p_hours_back: 24 })

      if (error) {
        console.error('❌ [MONITORING] Erreur fonction SQL:', error)
        return null
      }

      if (!data || data.length === 0) {
        console.log('⚠️ [MONITORING] Aucune donnée retournée par la fonction SQL')
        return {
          gym_id: gymId,
          sessions_24h: 0,
          active_sessions: 0,
          total_cost_24h_usd: 0,
          avg_session_duration: 0,
          total_user_turns: 0,
          total_ai_turns: 0,
          last_session_time: null,
          error_rate_percent: 0
        }
      }

      const stats = data[0]
      console.log('✅ [MONITORING] Stats récupérées:', stats)

      return {
        gym_id: gymId,
        sessions_24h: stats.total_sessions || 0,
        active_sessions: stats.active_sessions || 0,
        total_cost_24h_usd: stats.total_cost_24h || 0,
        avg_session_duration: stats.avg_session_duration || 0,
        total_user_turns: stats.total_user_interactions || 0,
        total_ai_turns: stats.total_ai_responses || 0,
        last_session_time: stats.last_session_time,
        error_rate_percent: 0 // TODO: Calculer taux erreur
      }

    } catch (error) {
      console.error('❌ [MONITORING] Erreur getGymStats:', error)
      return null
    }
  }

  /**
   * 📊 Sessions actives d'un gym
   */
  async getGymActiveSessions(gymId: string): Promise<SimpleActiveSession[]> {
    try {
      console.log('🔍 [MONITORING] Récupération sessions actives pour gym:', gymId)

      const { data, error } = await this.supabase
        .rpc('get_gym_active_sessions', { p_gym_id: gymId })

      if (error) {
        console.error('❌ [MONITORING] Erreur sessions actives:', error)
        return []
      }

      console.log('✅ [MONITORING] Sessions actives récupérées:', data?.length || 0)
      return data || []

    } catch (error) {
      console.error('❌ [MONITORING] Erreur getGymActiveSessions:', error)
      return []
    }
  }

  /**
   * 🎙️ Événements audio récents
   */
  async getRecentAudioEvents(gymId: string, limit = 10): Promise<SimpleAudioEvent[]> {
    try {
      console.log('🔍 [MONITORING] Récupération événements audio pour gym:', gymId)

      const { data, error } = await this.supabase
        .from('openai_realtime_audio_events')
        .select(`
          id,
          session_id,
          event_type,
          event_timestamp,
          user_transcript,
          ai_transcript_final
        `)
        .eq('gym_id', gymId)
        .order('event_timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ [MONITORING] Erreur événements audio:', error)
        return []
      }

      console.log('✅ [MONITORING] Événements audio récupérés:', data?.length || 0)
      return data || []

    } catch (error) {
      console.error('❌ [MONITORING] Erreur getRecentAudioEvents:', error)
      return []
    }
  }

  /**
   * 🔍 Diagnostic: Vérifier si on a des données
   */
  async diagnosticData(): Promise<{
    sessions_count: number
    audio_events_count: number
    webrtc_stats_count: number
    functions_available: string[]
  }> {
    try {
      console.log('🔍 [MONITORING] Diagnostic des données...')

      // Compter les sessions
      const { count: sessionsCount } = await this.supabase
        .from('openai_realtime_sessions')
        .select('*', { count: 'exact', head: true })

      // Compter les événements audio
      const { count: audioCount } = await this.supabase
        .from('openai_realtime_audio_events')
        .select('*', { count: 'exact', head: true })

      // Compter les stats WebRTC
      const { count: webrtcCount } = await this.supabase
        .from('openai_realtime_webrtc_stats')
        .select('*', { count: 'exact', head: true })

      const result = {
        sessions_count: sessionsCount || 0,
        audio_events_count: audioCount || 0,
        webrtc_stats_count: webrtcCount || 0,
        functions_available: [
          'get_kiosk_realtime_metrics',
          'get_gym_active_sessions',
          'increment_session_user_turns',
          'increment_session_ai_turns'
        ]
      }

      console.log('📊 [MONITORING] Diagnostic:', result)
      return result

    } catch (error) {
      console.error('❌ [MONITORING] Erreur diagnostic:', error)
      return {
        sessions_count: 0,
        audio_events_count: 0,
        webrtc_stats_count: 0,
        functions_available: []
      }
    }
  }

  /**
   * 🧪 Test de la fonction SQL
   */
  async testSQLFunction(gymId: string): Promise<any> {
    try {
      console.log('🧪 [MONITORING] Test fonction SQL pour gym:', gymId)

      const { data, error } = await this.supabase
        .rpc('get_kiosk_realtime_metrics', { 
          p_gym_id: gymId, 
          p_hours_back: 24 
        })

      if (error) {
        console.error('❌ [MONITORING] Erreur test fonction:', error)
        return { error: error.message }
      }

      console.log('✅ [MONITORING] Test fonction réussi:', data)
      return { success: true, data }

    } catch (error) {
      console.error('❌ [MONITORING] Erreur test fonction:', error)
      return { error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }
}

// Instance singleton
export const openaiRealtimeMonitoringServiceFixed = new OpenAIRealtimeMonitoringServiceFixed()