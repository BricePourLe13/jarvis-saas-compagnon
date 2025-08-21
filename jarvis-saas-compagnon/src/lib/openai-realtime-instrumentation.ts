/**
 * Service d'instrumentation pour capturer les métriques OpenAI Realtime en temps réel
 * Ce service s'intègre dans le flow existant pour enregistrer automatiquement les données
 */

import { getSupabaseSingleton } from './supabase-singleton'

export interface OpenAIRealtimeSessionStart {
  session_id: string
  gym_id: string
  kiosk_slug: string
  ai_model: string
  voice_model: string
  connection_type: 'webrtc' | 'websocket'
  turn_detection_type: string
  member_badge_id?: string | null
  member_name?: string | null
}

export interface OpenAIRealtimeSessionEnd {
  session_id: string
  total_tokens?: number
  input_tokens?: number
  output_tokens?: number
  total_cost_usd?: number
  input_text_tokens_cost_usd?: number
  input_audio_tokens_cost_usd?: number
  output_text_tokens_cost_usd?: number
  output_audio_tokens_cost_usd?: number
  session_duration_seconds: number
  total_user_turns: number
  total_ai_turns: number
  total_interruptions: number
  // final_transcript?: string  // Retiré - colonne inexistante
  end_reason: 'user_goodbye' | 'timeout' | 'error' | 'manual'
}

export interface OpenAIRealtimeAudioEvent {
  session_id: string
  event_type: 'speech_started' | 'speech_stopped' | 'transcription_completed' | 'audio_delta' | 'response_started' | 'response_completed' | 'function_call'
  user_transcript?: string
  ai_transcript_delta?: string
  ai_transcript_final?: string
  function_name?: string
  function_args?: Record<string, any>
  event_timestamp: Date
}

export interface OpenAIRealtimeWebRTCStats {
  session_id: string
  connection_state: string
  ice_connection_state?: string
  ice_gathering_state?: string
  rtt_ms?: number
  packets_sent?: number
  packets_received?: number
  packets_lost?: number
  packet_loss_rate?: number
  bytes_sent?: number
  bytes_received?: number
  audio_level_input?: number
  audio_level_output?: number
  jitter_ms?: number
  bitrate_kbps?: number
  audio_codec?: string
  sample_rate?: number
  channels?: number
}

class OpenAIRealtimeInstrumentation {
  private supabase: ReturnType<typeof getSupabaseSingleton>
  private firstEventDelayAppliedForSessionIds: Set<string>

  constructor() {
    this.supabase = getSupabaseSingleton()
    this.firstEventDelayAppliedForSessionIds = new Set<string>()
  }

  /**
   * Démarre l'enregistrement d'une session OpenAI Realtime
   */
  async startSession(sessionData: OpenAIRealtimeSessionStart): Promise<boolean> {
    try {
      console.log('🎯 [INSTRUMENTATION] Démarrage session:', sessionData.session_id)
      
      // Ignorer explicitement les sessions de pre-warm (ne pas polluer la DB/monitoring)
      if (sessionData.member_badge_id && sessionData.member_badge_id.startsWith('prewarm')) {
        console.log('⏭️ [INSTRUMENTATION] Session prewarm ignorée')
        return true
      }

      // Vérifier si la session existe déjà pour éviter les doublons
      const { data: existing } = await this.supabase
        .from('openai_realtime_sessions')
        .select('id')
        .eq('session_id', sessionData.session_id)
        .single()

      if (existing) {
        console.log('⚠️ [INSTRUMENTATION] Session déjà enregistrée:', sessionData.session_id)
        return true
      }

      const { error } = await this.supabase
        .from('openai_realtime_sessions')
        .insert({
          session_id: sessionData.session_id,
          gym_id: sessionData.gym_id,
          kiosk_slug: sessionData.kiosk_slug,
          ai_model: sessionData.ai_model,
          voice_model: sessionData.voice_model,
          connection_type: sessionData.connection_type,
          turn_detection_type: sessionData.turn_detection_type,
          member_badge_id: sessionData.member_badge_id,
          session_started_at: new Date().toISOString(),
          state: 'active',
          last_activity_at: new Date().toISOString(),
          // Initialisation avec des valeurs par défaut
          total_user_turns: 0,
          total_ai_turns: 0,
          total_interruptions: 0,
          session_metadata: {
            member_name: sessionData.member_name,
            started_by: 'kiosk_session',
            instrumentation_version: '1.0'
          }
        })

      if (error) {
        console.error('❌ [INSTRUMENTATION] Erreur création session:', error)
        return false
      }

      console.log('✅ [INSTRUMENTATION] Session créée avec succès')
      return true

    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur startSession:', error)
      return false
    }
  }

  /**
   * Termine l'enregistrement d'une session OpenAI Realtime
   */
  async endSession(sessionId: string, endData: OpenAIRealtimeSessionEnd): Promise<boolean> {
    try {
      console.log('🏁 [INSTRUMENTATION] Fin session:', sessionId)

      const { error } = await this.supabase
        .from('openai_realtime_sessions')
        .update({
          session_ended_at: new Date().toISOString(),
          state: 'closed',
          total_tokens: endData.total_tokens,
          input_tokens: endData.input_tokens,
          output_tokens: endData.output_tokens,
          total_cost_usd: endData.total_cost_usd,
          input_text_tokens_cost_usd: endData.input_text_tokens_cost_usd,
          input_audio_tokens_cost_usd: endData.input_audio_tokens_cost_usd,
          output_text_tokens_cost_usd: endData.output_text_tokens_cost_usd,
          output_audio_tokens_cost_usd: endData.output_audio_tokens_cost_usd,
          session_duration_seconds: endData.session_duration_seconds,
          total_user_turns: endData.total_user_turns,
          total_ai_turns: endData.total_ai_turns,
          total_interruptions: endData.total_interruptions,
          // final_transcript retiré - colonne inexistante en DB
          updated_at: new Date().toISOString(),
          session_metadata: {
            end_reason: endData.end_reason,
            ended_by: 'kiosk_session',
            session_completed: true
          }
        })
        .eq('session_id', sessionId)

      if (error) {
        console.error('❌ [INSTRUMENTATION] Erreur fin session:', error)
        return false
      }

      // Mettre à jour le tracking des coûts horaires
      await this.updateHourlyCostTracking(endData.total_cost_usd || 0)

      console.log('✅ [INSTRUMENTATION] Session terminée avec succès')
      return true

    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur endSession:', error)
      return false
    }
  }

  /**
   * Enregistre un événement audio en temps réel
   */
  async recordAudioEvent(eventData: OpenAIRealtimeAudioEvent): Promise<boolean> {
    try {
      // Ignorer les événements pour sessions prewarm (sécurité supplémentaire)
      if (eventData.session_id.startsWith('prewarm')) {
        return false
      }

      // Appliquer un très léger délai sur le tout premier événement d'une session pour absorber la latence PostgREST
      if (!this.firstEventDelayAppliedForSessionIds.has(eventData.session_id)) {
        this.firstEventDelayAppliedForSessionIds.add(eventData.session_id)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Sécurité: ignorer les events arrivés après la fin de session (de-synchronisation client)
      const { data: ended } = await this.supabase
        .from('openai_realtime_sessions')
        .select('session_ended_at')
        .eq('session_id', eventData.session_id)
        .maybeSingle()
      if (ended && (ended as any).session_ended_at) {
        // Session close: on n’essaie pas d’insérer des events tardifs
        return false
      }

      // D'abord récupérer l'UUID de la session et le gym_id
      // Utiliser maybeSingle() + petit retry pour absorber la latence entre startSession() et le premier event
      const fetchSession = async (): Promise<{ id: string; gym_id: string } | null> => {
        const { data } = await this.supabase
          .from('openai_realtime_sessions')
          .select('id, gym_id')
          .eq('session_id', eventData.session_id)
          .maybeSingle()
        return (data as any) || null
      }

      let sessionData = await fetchSession()
      if (!sessionData) {
        // Retry plus tolérant à la latence (jusqu'à ~5s)
        for (let attempt = 0; attempt < 20 && !sessionData; attempt += 1) {
          await new Promise(resolve => setTimeout(resolve, 250))
          sessionData = await fetchSession()
        }
      }

      if (!sessionData) {
        // Session fermée ou pas encore créée - comportement normal, pas d'erreur
        return false
      }

      const { error } = await this.supabase
        .from('openai_realtime_audio_events')
        .insert({
          session_id: sessionData.id, // UUID de la session
          gym_id: sessionData.gym_id,
          event_type: eventData.event_type,
          event_timestamp: eventData.event_timestamp.toISOString(),
          user_transcript: eventData.user_transcript,
          ai_transcript_final: eventData.ai_transcript_final,
          ai_transcript_delta: eventData.ai_transcript_delta
        })

      if (error) {
        console.error('❌ [INSTRUMENTATION] Erreur audio event:', error)
        return false
      }

      // Mise à jour des compteurs & activité si applicable
      if (eventData.event_type === 'transcription_completed' && eventData.user_transcript) {
        await this.incrementUserTurn(eventData.session_id)
        await this.supabase
          .from('openai_realtime_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('session_id', eventData.session_id)
      } else if (eventData.event_type === 'response_completed' && eventData.ai_transcript_final) {
        await this.incrementAITurn(eventData.session_id)
        await this.supabase
          .from('openai_realtime_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('session_id', eventData.session_id)
      }

      return true

    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur recordAudioEvent:', error)
      return false
    }
  }

  /**
   * Enregistre les statistiques WebRTC
   */
  async recordWebRTCStats(sessionId: string, stats: OpenAIRealtimeWebRTCStats): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('openai_realtime_webrtc_stats')
        .insert({
          session_id: sessionId,
          measured_at: new Date().toISOString(),
          connection_state: stats.connection_state,
          ice_connection_state: stats.ice_connection_state,
          ice_gathering_state: stats.ice_gathering_state,
          rtt_ms: stats.rtt_ms,
          packets_sent: stats.packets_sent,
          packets_received: stats.packets_received,
          packets_lost: stats.packets_lost,
          packet_loss_rate: stats.packet_loss_rate,
          bytes_sent: stats.bytes_sent,
          bytes_received: stats.bytes_received,
          audio_level_input: stats.audio_level_input,
          audio_level_output: stats.audio_level_output,
          jitter_ms: stats.jitter_ms,
          bitrate_kbps: stats.bitrate_kbps,
          audio_codec: stats.audio_codec,
          sample_rate: stats.sample_rate,
          channels: stats.channels
        })

      if (error) {
        console.error('❌ [INSTRUMENTATION] Erreur WebRTC stats:', error)
        return false
      }

      return true

    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur recordWebRTCStats:', error)
      return false
    }
  }

  /**
   * Incrémente le compteur de tours utilisateur
   */
  private async incrementUserTurn(sessionId: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_session_user_turns', { 
        p_session_id: sessionId 
      })
    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur increment user turn:', error)
    }
  }

  /**
   * Incrémente le compteur de tours IA
   */
  private async incrementAITurn(sessionId: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_session_ai_turns', { 
        p_session_id: sessionId 
      })
    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur increment AI turn:', error)
    }
  }

  /**
   * Met à jour le tracking des coûts horaires
   */
  private async updateHourlyCostTracking(costUsd: number): Promise<void> {
    try {
      const hourStart = new Date()
      hourStart.setMinutes(0, 0, 0) // Arrondir à l'heure

      const { error } = await this.supabase
        .from('openai_realtime_cost_tracking')
        .upsert({
          hour_start: hourStart.toISOString(),
          total_cost_usd: costUsd,
          total_sessions: 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'hour_start',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('❌ [INSTRUMENTATION] Erreur cost tracking:', error)
      }
    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur updateHourlyCostTracking:', error)
    }
  }

  /**
   * Enregistre une erreur de session
   */
  async recordSessionError(sessionId: string, errorType: string, errorMessage: string, errorDetails?: any): Promise<boolean> {
    try {
      console.log('💥 [INSTRUMENTATION] Erreur session:', { sessionId, errorType, errorMessage })

      // Marquer la session comme ayant eu une erreur
              await this.supabase
        .from('openai_realtime_sessions')
        .update({
          session_metadata: {
            has_error: true,
            error_type: errorType,
            error_message: errorMessage,
            error_details: errorDetails,
            error_timestamp: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      return true

    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur recordSessionError:', error)
      return false
    }
  }

  /**
   * Envoie une notification temps réel pour nouvelle session
   */
  async notifySessionStart(sessionId: string, memberName?: string, gymName?: string): Promise<void> {
    try {
      console.log('📡 [INSTRUMENTATION] Notification session démarrée:', {
        sessionId,
        memberName,
        gymName,
        timestamp: new Date().toISOString()
      })

      // Ici on pourrait intégrer avec un système de notifications temps réel
      // Pour l'instant, on log juste pour le debug
      
    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Erreur notification:', error)
    }
  }
}

// Instance singleton
export const openaiRealtimeInstrumentation = new OpenAIRealtimeInstrumentation()
