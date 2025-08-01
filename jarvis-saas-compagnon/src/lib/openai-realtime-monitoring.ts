/**
 * 🎯 Service Monitoring OpenAI Realtime API
 * Basé sur les métriques techniques RÉELLES de l'API
 */

import { getSupabaseSingleton } from './supabase-singleton'

// ====================================
// 🏷️ Types basés sur OpenAI Realtime API
// ====================================

export interface OpenAIRealtimeSession {
  id: string
  session_id: string // OpenAI session ID
  gym_id: string
  kiosk_slug: string
  session_started_at: string
  session_ended_at: string | null
  session_duration_seconds: number | null
  connection_type: 'websocket' | 'webrtc'
  connection_established_at: string | null
  connection_closed_at: string | null
  disconnect_reason: string | null
  input_audio_format: string
  output_audio_format: string
  voice_model: string | null
  turn_detection_type: string
  vad_threshold: number | null
  vad_prefix_padding_ms: number | null
  vad_silence_duration_ms: number | null
  total_audio_input_duration_ms: number | null
  total_audio_output_duration_ms: number | null
  total_user_turns: number
  total_ai_turns: number
  total_interruptions: number
  total_input_tokens: number
  total_output_tokens: number
  total_input_audio_tokens: number
  total_output_audio_tokens: number
  total_cost_usd: number | null
  had_errors: boolean
  error_count: number
  critical_errors: string[]
  session_instructions: string | null
  temperature: number | null
  max_response_output_tokens: string | null
  tools_used: string[]
  session_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface OpenAIRealtimeAudioEvent {
  id: string
  session_id: string
  gym_id: string
  event_type: string
  event_id: string | null
  event_timestamp: string
  speech_started_at: string | null
  speech_stopped_at: string | null
  speech_duration_ms: number | null
  user_transcript: string | null
  ai_transcript_partial: string | null
  ai_transcript_final: string | null
  audio_bytes_received: number | null
  audio_generation_duration_ms: number | null
  response_id: string | null
  response_status: string | null
  response_latency_ms: number | null
  function_name: string | null
  function_arguments: Record<string, any> | null
  function_call_id: string | null
  error_type: string | null
  error_message: string | null
  error_code: string | null
  buffer_size_bytes: number | null
  processing_time_ms: number | null
  raw_event_data: Record<string, any> | null
  created_at: string
}

export interface OpenAIRealtimeWebRTCStats {
  id: string
  session_id: string
  gym_id: string
  measured_at: string
  stats_interval_seconds: number
  connection_state: string | null
  ice_connection_state: string | null
  ice_gathering_state: string | null
  rtt_ms: number | null
  packets_sent: number | null
  packets_received: number | null
  packets_lost: number | null
  packet_loss_rate: number | null
  audio_level_input: number | null
  audio_level_output: number | null
  jitter_ms: number | null
  bytes_sent: number | null
  bytes_received: number | null
  bitrate_kbps: number | null
  audio_codec: string | null
  sample_rate: number | null
  channels: number | null
  echo_cancellation_enabled: boolean | null
  noise_suppression_enabled: boolean | null
  auto_gain_control_enabled: boolean | null
  user_agent: string | null
  browser_name: string | null
  device_type: string | null
  os_name: string | null
  raw_webrtc_stats: Record<string, any> | null
  created_at: string
}

export interface OpenAIRealtimeCostTracking {
  id: string
  session_id: string
  gym_id: string
  hour_bucket: string
  total_sessions: number
  total_session_duration_seconds: number
  total_input_tokens: number
  total_output_tokens: number
  total_input_audio_tokens: number
  total_output_audio_tokens: number
  input_text_tokens_cost_usd: number
  output_text_tokens_cost_usd: number
  input_audio_tokens_cost_usd: number
  output_audio_tokens_cost_usd: number
  total_cost_usd: number
  avg_session_duration_seconds: number | null
  avg_response_latency_ms: number | null
  avg_turn_count: number | null
  successful_sessions: number
  failed_sessions: number
  success_rate: number | null
  webrtc_sessions: number
  websocket_sessions: number
  total_connection_failures: number
  created_at: string
  updated_at: string
}

export interface ActiveRealtimeSession {
  id: string
  session_id: string
  gym_id: string
  gym_name: string
  kiosk_slug: string
  session_started_at: string
  connection_type: string
  voice_model: string | null
  turn_detection_type: string
  total_user_turns: number
  total_ai_turns: number
  total_interruptions: number
  total_cost_usd: number | null
  current_duration_seconds: number
  last_audio_activity: string | null
  current_connection_state: string | null
}

export interface KioskRealtimeStats24h {
  gym_id: string
  gym_name: string
  kiosk_slug: string | null
  sessions_24h: number
  completed_sessions: number
  active_sessions: number
  avg_session_duration_seconds: number | null
  total_session_duration_seconds: number | null
  avg_user_turns: number | null
  avg_ai_turns: number | null
  avg_interruptions: number | null
  total_cost_24h_usd: number | null
  avg_cost_per_session_usd: number | null
  total_input_tokens: number | null
  total_output_tokens: number | null
  total_input_audio_tokens: number | null
  total_output_audio_tokens: number | null
  sessions_with_errors: number
  error_rate_percent: number | null
  webrtc_sessions: number
  websocket_sessions: number
  voice_models_used: string | null
  last_session_at: string | null
}

// ====================================
// 🚀 Service OpenAI Realtime Monitoring
// ====================================

export class OpenAIRealtimeMonitoringService {
  private supabase = getSupabaseSingleton()

  /**
   * 📊 Sessions actives en temps réel
   */
  async getActiveSessions(): Promise<ActiveRealtimeSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('v_openai_realtime_active_sessions')
        .select('*')
        .order('session_started_at', { ascending: false })
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur sessions actives:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur sessions actives:', error)
      return []
    }
  }

  /**
   * 📊 Statistiques kiosks dernières 24h
   */
  async getKioskStats24h(): Promise<KioskRealtimeStats24h[]> {
    try {
      const { data, error } = await this.supabase
        .from('v_openai_realtime_kiosk_stats_24h')
        .select('*')
        .order('sessions_24h', { ascending: false })
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur stats kiosks 24h:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur stats kiosks 24h:', error)
      return []
    }
  }

  /**
   * 🎙️ Événements audio session spécifique
   */
  async getSessionAudioEvents(sessionId: string, limit = 50): Promise<OpenAIRealtimeAudioEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from('openai_realtime_audio_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('event_timestamp', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur événements audio:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur événements audio:', error)
      return []
    }
  }

  /**
   * 🌐 Stats WebRTC session spécifique
   */
  async getSessionWebRTCStats(sessionId: string, hours = 1): Promise<OpenAIRealtimeWebRTCStats[]> {
    try {
      const sinceTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await this.supabase
        .from('openai_realtime_webrtc_stats')
        .select('*')
        .eq('session_id', sessionId)
        .gte('measured_at', sinceTime)
        .order('measured_at', { ascending: false })
        .limit(100)
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur stats WebRTC:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur stats WebRTC:', error)
      return []
    }
  }

  /**
   * 💰 Coûts par heure derniers jours
   */
  async getCostTrends(days = 7): Promise<OpenAIRealtimeCostTracking[]> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await this.supabase
        .from('openai_realtime_cost_tracking')
        .select('*')
        .gte('hour_bucket', sinceDate)
        .order('hour_bucket', { ascending: false })
        .limit(days * 24) // Max une entrée par heure
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur trends coûts:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur trends coûts:', error)
      return []
    }
  }

  /**
   * 📊 Sessions récentes par kiosk
   */
  async getKioskRecentSessions(gymId: string, limit = 20): Promise<OpenAIRealtimeSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('openai_realtime_sessions')
        .select('*')
        .eq('gym_id', gymId)
        .order('session_started_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur sessions récentes:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur sessions récentes:', error)
      return []
    }
  }

  /**
   * 🎙️ Top événements audio par type
   */
  async getTopAudioEventTypes(days = 7): Promise<Array<{
    event_type: string
    event_count: number
    unique_sessions: number
    avg_processing_time_ms: number | null
    error_count: number
    last_occurrence: string
  }>> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await this.supabase.rpc('get_top_audio_event_types', {
        since_date: sinceDate
      })
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur top événements:', error)
        
        // Fallback: requête manuelle
        const { data: fallbackData } = await this.supabase
          .from('openai_realtime_audio_events')
          .select('event_type, processing_time_ms, error_type, event_timestamp, session_id')
          .gte('event_timestamp', sinceDate)
        
        if (!fallbackData) return []
        
        // Grouper manuellement
        const grouped = fallbackData.reduce((acc, event) => {
          const type = event.event_type
          if (!acc[type]) {
            acc[type] = {
              event_type: type,
              events: [],
              sessions: new Set()
            }
          }
          acc[type].events.push(event)
          acc[type].sessions.add(event.session_id)
          return acc
        }, {} as Record<string, any>)
        
        return Object.values(grouped).map((group: any) => ({
          event_type: group.event_type,
          event_count: group.events.length,
          unique_sessions: group.sessions.size,
          avg_processing_time_ms: group.events
            .filter((e: any) => e.processing_time_ms)
            .reduce((sum: number, e: any, _, arr: any[]) => 
              sum + e.processing_time_ms / arr.length, 0) || null,
          error_count: group.events.filter((e: any) => e.error_type).length,
          last_occurrence: Math.max(...group.events.map((e: any) => 
            new Date(e.event_timestamp).getTime()))
        })).sort((a, b) => b.event_count - a.event_count)
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur top événements:', error)
      return []
    }
  }

  /**
   * 🌐 Qualité connexion WebRTC par kiosk
   */
  async getWebRTCQualityByKiosk(hours = 24): Promise<Array<{
    gym_id: string
    gym_name: string
    kiosk_slug: string
    measurements_count: number
    avg_rtt_ms: number | null
    avg_packet_loss_rate: number | null
    avg_jitter_ms: number | null
    avg_audio_level_input: number | null
    avg_audio_level_output: number | null
    connection_failures: number
    last_measurement: string | null
  }>> {
    try {
      const sinceTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await this.supabase.rpc('get_webrtc_quality_by_kiosk', {
        since_time: sinceTime
      })
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur qualité WebRTC:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur qualité WebRTC:', error)
      return []
    }
  }

  /**
   * 💰 Analyse coûts détaillée par type
   */
  async getCostBreakdown(days = 7): Promise<{
    total_cost_usd: number
    input_text_cost: number
    output_text_cost: number
    input_audio_cost: number
    output_audio_cost: number
    total_sessions: number
    avg_cost_per_session: number
    cost_by_voice_model: Array<{
      voice_model: string
      sessions: number
      total_cost: number
      avg_cost: number
    }>
    cost_by_connection_type: Array<{
      connection_type: string
      sessions: number
      total_cost: number
      avg_cost: number
    }>
  }> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      // Coûts totaux
      const { data: totalCosts } = await this.supabase
        .from('openai_realtime_cost_tracking')
        .select('*')
        .gte('hour_bucket', sinceDate)
      
      // Sessions pour analyse détaillée
      const { data: sessions } = await this.supabase
        .from('openai_realtime_sessions')
        .select('voice_model, connection_type, total_cost_usd')
        .gte('session_started_at', sinceDate)
        .not('total_cost_usd', 'is', null)
      
      if (!totalCosts || !sessions) {
        return {
          total_cost_usd: 0,
          input_text_cost: 0,
          output_text_cost: 0,
          input_audio_cost: 0,
          output_audio_cost: 0,
          total_sessions: 0,
          avg_cost_per_session: 0,
          cost_by_voice_model: [],
          cost_by_connection_type: []
        }
      }
      
      // Calculs totaux
      const totalCost = totalCosts.reduce((sum, cost) => sum + (cost.total_cost_usd || 0), 0)
      const inputTextCost = totalCosts.reduce((sum, cost) => sum + (cost.input_text_tokens_cost_usd || 0), 0)
      const outputTextCost = totalCosts.reduce((sum, cost) => sum + (cost.output_text_tokens_cost_usd || 0), 0)
      const inputAudioCost = totalCosts.reduce((sum, cost) => sum + (cost.input_audio_tokens_cost_usd || 0), 0)
      const outputAudioCost = totalCosts.reduce((sum, cost) => sum + (cost.output_audio_tokens_cost_usd || 0), 0)
      const totalSessions = totalCosts.reduce((sum, cost) => sum + (cost.total_sessions || 0), 0)
      
      // Coûts par modèle voix
      const voiceModelCosts = sessions.reduce((acc, session) => {
        const model = session.voice_model || 'unknown'
        if (!acc[model]) {
          acc[model] = { sessions: 0, total_cost: 0 }
        }
        acc[model].sessions++
        acc[model].total_cost += session.total_cost_usd || 0
        return acc
      }, {} as Record<string, any>)
      
      // Coûts par type connexion
      const connectionTypeCosts = sessions.reduce((acc, session) => {
        const type = session.connection_type
        if (!acc[type]) {
          acc[type] = { sessions: 0, total_cost: 0 }
        }
        acc[type].sessions++
        acc[type].total_cost += session.total_cost_usd || 0
        return acc
      }, {} as Record<string, any>)
      
      return {
        total_cost_usd: totalCost,
        input_text_cost: inputTextCost,
        output_text_cost: outputTextCost,
        input_audio_cost: inputAudioCost,
        output_audio_cost: outputAudioCost,
        total_sessions: totalSessions,
        avg_cost_per_session: totalSessions > 0 ? totalCost / totalSessions : 0,
        cost_by_voice_model: Object.entries(voiceModelCosts).map(([model, data]: [string, any]) => ({
          voice_model: model,
          sessions: data.sessions,
          total_cost: data.total_cost,
          avg_cost: data.sessions > 0 ? data.total_cost / data.sessions : 0
        })).sort((a, b) => b.total_cost - a.total_cost),
        cost_by_connection_type: Object.entries(connectionTypeCosts).map(([type, data]: [string, any]) => ({
          connection_type: type,
          sessions: data.sessions,
          total_cost: data.total_cost,
          avg_cost: data.sessions > 0 ? data.total_cost / data.sessions : 0
        })).sort((a, b) => b.total_cost - a.total_cost)
      }
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur analyse coûts:', error)
      return {
        total_cost_usd: 0,
        input_text_cost: 0,
        output_text_cost: 0,
        input_audio_cost: 0,
        output_audio_cost: 0,
        total_sessions: 0,
        avg_cost_per_session: 0,
        cost_by_voice_model: [],
        cost_by_connection_type: []
      }
    }
  }

  /**
   * 📝 Enregistrer une nouvelle session
   */
  async createSession(session: Partial<OpenAIRealtimeSession>): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('openai_realtime_sessions')
        .insert({
          ...session,
          session_started_at: session.session_started_at || new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur création session:', error)
        return null
      }
      
      return data?.id || null
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur création session:', error)
      return null
    }
  }

  /**
   * 🔄 Mettre à jour session existante
   */
  async updateSession(sessionId: string, updates: Partial<OpenAIRealtimeSession>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('openai_realtime_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur mise à jour session:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur mise à jour session:', error)
      return false
    }
  }

  /**
   * 🎙️ Enregistrer événement audio
   */
  async recordAudioEvent(event: Partial<OpenAIRealtimeAudioEvent>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('openai_realtime_audio_events')
        .insert({
          ...event,
          event_timestamp: event.event_timestamp || new Date().toISOString()
        })
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur enregistrement événement audio:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur enregistrement événement audio:', error)
      return false
    }
  }

  /**
   * 🌐 Enregistrer stats WebRTC
   */
  async recordWebRTCStats(stats: Partial<OpenAIRealtimeWebRTCStats>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('openai_realtime_webrtc_stats')
        .insert({
          ...stats,
          measured_at: stats.measured_at || new Date().toISOString()
        })
      
      if (error) {
        console.error('❌ [OPENAI REALTIME] Erreur enregistrement stats WebRTC:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur enregistrement stats WebRTC:', error)
      return false
    }
  }

  /**
   * ⚡ Résumé rapide monitoring
   */
  async getQuickSummary(): Promise<{
    active_sessions: number
    sessions_today: number
    cost_today_usd: number
    avg_session_duration_minutes: number
    top_voice_model: string | null
    webrtc_vs_websocket_ratio: string
    error_rate_24h: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Sessions actives
      const { data: activeSessions } = await this.supabase
        .from('openai_realtime_sessions')
        .select('id')
        .is('session_ended_at', null)
      
      // Sessions aujourd'hui
      const { data: todaySessions } = await this.supabase
        .from('openai_realtime_sessions')
        .select('session_duration_seconds, total_cost_usd, voice_model, connection_type, had_errors')
        .gte('session_started_at', today)
      
      const activeCount = activeSessions?.length || 0
      const todayCount = todaySessions?.length || 0
      const todayCost = todaySessions?.reduce((sum, s) => sum + (s.total_cost_usd || 0), 0) || 0
      const avgDuration = todaySessions?.length ? 
        todaySessions.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0) / todaySessions.length / 60 : 0
      
      // Modèle voix populaire
      const voiceModelCounts = todaySessions?.reduce((acc, s) => {
        const model = s.voice_model || 'unknown'
        acc[model] = (acc[model] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      const topVoiceModel = Object.entries(voiceModelCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null
      
      // Ratio WebRTC vs WebSocket
      const webrtcCount = todaySessions?.filter(s => s.connection_type === 'webrtc').length || 0
      const websocketCount = todaySessions?.filter(s => s.connection_type === 'websocket').length || 0
      const ratio = todayCount > 0 ? `${Math.round(webrtcCount / todayCount * 100)}% WebRTC` : 'N/A'
      
      // Taux d'erreur
      const errorCount = todaySessions?.filter(s => s.had_errors).length || 0
      const errorRate = todayCount > 0 ? (errorCount / todayCount) * 100 : 0
      
      return {
        active_sessions: activeCount,
        sessions_today: todayCount,
        cost_today_usd: todayCost,
        avg_session_duration_minutes: Math.round(avgDuration * 100) / 100,
        top_voice_model: topVoiceModel,
        webrtc_vs_websocket_ratio: ratio,
        error_rate_24h: Math.round(errorRate * 100) / 100
      }
    } catch (error) {
      console.error('❌ [OPENAI REALTIME] Erreur résumé rapide:', error)
      return {
        active_sessions: 0,
        sessions_today: 0,
        cost_today_usd: 0,
        avg_session_duration_minutes: 0,
        top_voice_model: null,
        webrtc_vs_websocket_ratio: 'N/A',
        error_rate_24h: 0
      }
    }
  }
}

// ====================================
// 📤 Export instance singleton
// ====================================

export const openaiRealtimeMonitoringService = new OpenAIRealtimeMonitoringService()