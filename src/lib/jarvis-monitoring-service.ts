/**
 * 🤖 Service de Monitoring JARVIS - Métriques IA & Sessions
 * Focus sur OpenAI, WebRTC, interactions utilisateurs
 */

import { createBrowserClientWithConfig } from './supabase-admin'

// ====================================
// 🏷️ Types JARVIS Spécifiques
// ====================================

export interface JarvisAIMetrics {
  id: string
  gym_id: string
  kiosk_slug: string
  session_id: string | null
  ai_model: string // 'gpt-4o-realtime', 'gpt-4o', etc.
  ai_provider: string
  api_response_time_ms: number | null
  tokens_input: number | null
  tokens_output: number | null
  cost_usd: number | null
  response_quality: 'excellent' | 'good' | 'fair' | 'poor' | null
  user_satisfaction: number | null
  conversation_success: boolean | null
  error_occurred: boolean
  error_type: string | null
  error_message: string | null
  retry_count: number
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  request_metadata: Record<string, any>
  response_metadata: Record<string, any>
  created_at: string
}

export interface JarvisWebRTCMetrics {
  id: string
  gym_id: string
  kiosk_slug: string
  session_id: string | null
  audio_input_level: number | null
  audio_output_level: number | null
  audio_quality_score: number | null
  connection_quality: 'excellent' | 'good' | 'fair' | 'poor' | null
  ice_connection_state: string | null
  peer_connection_state: string | null
  rtt_ms: number | null
  packets_lost: number | null
  jitter_ms: number | null
  bandwidth_kbps: number | null
  speech_recognition_accuracy: number | null
  speech_interruptions: number | null
  silence_detection_quality: 'excellent' | 'good' | 'fair' | 'poor' | null
  audio_dropouts: number | null
  echo_detected: boolean | null
  noise_level: 'low' | 'medium' | 'high' | null
  session_duration_ms: number | null
  active_talk_time_ms: number | null
  browser_info: Record<string, any>
  device_info: Record<string, any>
  measured_at: string
  created_at: string
}

export interface JarvisUserInteraction {
  id: string
  gym_id: string
  kiosk_slug: string
  session_id: string | null
  member_badge_id: string | null
  member_type: 'member' | 'visitor' | 'staff' | 'unknown' | null
  is_returning_user: boolean | null
  interaction_type: string
  intent_detected: string[]
  conversation_topic: string[]
  session_started_at: string
  session_ended_at: string | null
  total_duration_seconds: number | null
  user_talk_time_seconds: number | null
  jarvis_talk_time_seconds: number | null
  initial_sentiment: number | null
  final_sentiment: number | null
  satisfaction_rating: number | null
  nps_score: number | null
  session_completed: boolean | null
  user_goal_achieved: boolean | null
  escalation_required: boolean | null
  end_reason: 'user_satisfied' | 'user_left' | 'timeout' | 'technical_error' | 'escalated_to_staff' | 'jarvis_error' | 'user_frustrated' | null
  user_feedback: string | null
  issue_resolved: boolean | null
  conversation_summary: string | null
  action_items: string[]
  member_info: Record<string, any>
  created_at: string
  updated_at: string
}

export interface JarvisCostSummary {
  gym_name: string
  kiosk_slug: string
  sessions_count: number
  total_cost_usd: number
  avg_cost_per_session: number
  total_input_tokens: number
  total_output_tokens: number
  avg_response_time_ms: number
  errors_count: number
  models_used: string
}

export interface JarvisPerformanceByModel {
  ai_model: string
  sessions_count: number
  kiosks_using: number
  avg_response_time_ms: number
  p95_response_time_ms: number
  total_cost_usd: number
  avg_cost_per_session: number
  avg_output_input_ratio: number
  success_rate: number
  errors_count: number
  error_rate: number
}

export interface JarvisAudioQuality {
  gym_name: string
  kiosk_slug: string
  avg_audio_quality: number
  avg_input_level: number
  avg_output_level: number
  avg_rtt_ms: number
  avg_packets_lost: number
  avg_jitter_ms: number
  avg_speech_accuracy: number
  avg_interruptions: number
  echo_sessions: number
  avg_dropouts: number
  excellent_connections: number
  good_connections: number
  fair_connections: number
  poor_connections: number
}

export interface JarvisUserBehavior {
  gym_name: string
  kiosk_slug: string
  total_interactions: number
  unique_users: number
  returning_users: number
  member_interactions: number
  visitor_interactions: number
  staff_interactions: number
  avg_duration_seconds: number
  median_duration_seconds: number
  avg_user_talk_time: number
  avg_jarvis_talk_time: number
  avg_satisfaction: number
  avg_nps: number
  avg_final_sentiment: number
  completion_rate: number
  goal_achievement_rate: number
  escalations_needed: number
  ended_satisfied: number
  ended_frustrated: number
  ended_technical_error: number
}

export interface JarvisAIStatus {
  gym_id: string
  gym_name: string
  kiosk_slug: string
  sessions_last_hour: number
  avg_response_time_ms: number
  cost_today_usd: number
  success_rate_24h: number
  errors_last_hour: number
  avg_audio_quality: number
  avg_satisfaction_24h: number
}

// ====================================
// 🚀 Service JARVIS Monitoring
// ====================================

export class JarvisMonitoringService {
  private supabase = createBrowserClientWithConfig()

  /**
   * 🤖 Vue d'ensemble IA temps réel
   */
  async getJarvisAIStatus(): Promise<JarvisAIStatus[]> {
    try {
      const { data, error } = await this.supabase
        .from('v_jarvis_ai_status')
        .select('*')
        .order('gym_name')
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur statut IA:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur statut IA:', error)
      return []
    }
  }

  /**
   * 💰 Analyse coûts OpenAI aujourd'hui
   */
  async getTodayCosts(): Promise<JarvisCostSummary[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_jarvis_costs_today')
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur coûts:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur coûts:', error)
      return []
    }
  }

  /**
   * 📊 Performance par modèle IA
   */
  async getPerformanceByModel(days = 7): Promise<JarvisPerformanceByModel[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_performance_by_model', {
        days_back: days
      })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur performance modèles:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur performance modèles:', error)
      return []
    }
  }

  /**
   * 🎙️ Qualité audio/WebRTC
   */
  async getAudioQuality(hours = 24): Promise<JarvisAudioQuality[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_audio_quality_analysis', {
        hours_back: hours
      })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur qualité audio:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur qualité audio:', error)
      return []
    }
  }

  /**
   * 👥 Comportement utilisateurs
   */
  async getUserBehaviorAnalysis(days = 7): Promise<JarvisUserBehavior[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_behavior_analysis', {
        days_back: days
      })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur comportement utilisateurs:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur comportement utilisateurs:', error)
      return []
    }
  }

  /**
   * 🚨 Top erreurs IA
   */
  async getTopAIErrors(days = 7, limit = 10): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('jarvis_ai_metrics')
        .select('error_type, error_message, started_at, gym_id, kiosk_slug')
        .eq('error_occurred', true)
        .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur erreurs IA:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur erreurs IA:', error)
      return []
    }
  }

  /**
   * 🎯 Intents populaires
   */
  async getPopularIntents(days = 7): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_popular_intents', {
        days_back: days
      })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur intents:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur intents:', error)
      return []
    }
  }

  /**
   * 📈 Trends journaliers
   */
  async getDailyTrends(days = 7): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_daily_trends', {
        days_back: days
      })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur trends:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur trends:', error)
      return []
    }
  }

  /**
   * 📊 Métriques kiosk spécifique
   */
  async getKioskJarvisMetrics(gymId: string, hours = 24): Promise<{
    ai_metrics: JarvisAIMetrics[]
    webrtc_metrics: JarvisWebRTCMetrics[]
    user_interactions: JarvisUserInteraction[]
  }> {
    try {
      const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      
      // Métriques IA
      const { data: aiMetrics, error: aiError } = await this.supabase
        .from('jarvis_ai_metrics')
        .select('*')
        .eq('gym_id', gymId)
        .gte('started_at', timeThreshold)
        .order('started_at', { ascending: false })
        .limit(50)
      
      if (aiError) {
        console.error('❌ [JARVIS MONITORING] Erreur métriques IA:', aiError)
      }
      
      // Métriques WebRTC
      const { data: webrtcMetrics, error: webrtcError } = await this.supabase
        .from('jarvis_webrtc_metrics')
        .select('*')
        .eq('gym_id', gymId)
        .gte('measured_at', timeThreshold)
        .order('measured_at', { ascending: false })
        .limit(50)
      
      if (webrtcError) {
        console.error('❌ [JARVIS MONITORING] Erreur métriques WebRTC:', webrtcError)
      }
      
      // Interactions utilisateurs
      const { data: userInteractions, error: userError } = await this.supabase
        .from('jarvis_user_interactions')
        .select('*')
        .eq('gym_id', gymId)
        .gte('session_started_at', timeThreshold)
        .order('session_started_at', { ascending: false })
        .limit(50)
      
      if (userError) {
        console.error('❌ [JARVIS MONITORING] Erreur interactions:', userError)
      }
      
      return {
        ai_metrics: aiMetrics || [],
        webrtc_metrics: webrtcMetrics || [],
        user_interactions: userInteractions || []
      }
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur métriques kiosk:', error)
      return {
        ai_metrics: [],
        webrtc_metrics: [],
        user_interactions: []
      }
    }
  }

  /**
   * 📝 Enregistrer métriques IA
   */
  async recordAIMetrics(metrics: Partial<JarvisAIMetrics>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('jarvis_ai_metrics')
        .insert({
          ...metrics,
          started_at: metrics.started_at || new Date().toISOString()
        })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur enregistrement IA:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur enregistrement IA:', error)
      return false
    }
  }

  /**
   * 🎙️ Enregistrer métriques WebRTC
   */
  async recordWebRTCMetrics(metrics: Partial<JarvisWebRTCMetrics>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('jarvis_webrtc_metrics')
        .insert({
          ...metrics,
          measured_at: metrics.measured_at || new Date().toISOString()
        })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur enregistrement WebRTC:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur enregistrement WebRTC:', error)
      return false
    }
  }

  /**
   * 👥 Enregistrer interaction utilisateur
   */
  async recordUserInteraction(interaction: Partial<JarvisUserInteraction>): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('jarvis_user_interactions')
        .insert({
          ...interaction,
          session_started_at: interaction.session_started_at || new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur enregistrement interaction:', error)
        return null
      }
      
      return data?.id || null
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur enregistrement interaction:', error)
      return null
    }
  }

  /**
   * 📊 Statistiques rapides kiosk
   */
  async getKioskQuickStats(gymId: string): Promise<{
    sessions_today: number
    cost_today_usd: number
    avg_satisfaction: number
    errors_count: number
    success_rate: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase.rpc('get_kiosk_quick_stats', {
        gym_id: gymId,
        target_date: today
      })
      
      if (error) {
        console.error('❌ [JARVIS MONITORING] Erreur stats rapides:', error)
        return {
          sessions_today: 0,
          cost_today_usd: 0,
          avg_satisfaction: 0,
          errors_count: 0,
          success_rate: 0
        }
      }
      
      return data?.[0] || {
        sessions_today: 0,
        cost_today_usd: 0,
        avg_satisfaction: 0,
        errors_count: 0,
        success_rate: 0
      }
    } catch (error) {
      console.error('❌ [JARVIS MONITORING] Erreur stats rapides:', error)
      return {
        sessions_today: 0,
        cost_today_usd: 0,
        avg_satisfaction: 0,
        errors_count: 0,
        success_rate: 0
      }
    }
  }
}

// ====================================
// 📤 Export instance singleton
// ====================================

export const jarvisMonitoringService = new JarvisMonitoringService()