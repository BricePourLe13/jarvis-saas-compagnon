/**
 * 💉 INJECTEUR ÉVÉNEMENTS AUDIO REALTIME
 * Service backend pour injecter les événements OpenAI dans Supabase Realtime
 */

import { getSupabaseService } from './supabase-service'

interface AudioEventData {
  session_id: string
  gym_id: string
  member_id: string
  event_type: 'user_speech_start' | 'user_speech_end' | 'user_transcript' | 'jarvis_response_start' | 'jarvis_response_end' | 'jarvis_transcript'
  user_transcript?: string
  jarvis_transcript?: string
  audio_duration_ms?: number
  confidence_score?: number
  turn_number?: number
}

class RealtimeAudioInjector {
  private supabase = getSupabaseService()
  private turnCounters = new Map<string, number>()

  /**
   * 🎤 Injecter un événement de début de parole utilisateur
   */
  async injectUserSpeechStart(sessionId: string, gymId: string, memberId: string): Promise<void> {
    await this.injectEvent({
      session_id: sessionId,
      gym_id: gymId,
      member_id: memberId,
      event_type: 'user_speech_start'
    })
  }

  /**
   * 🤐 Injecter un événement de fin de parole utilisateur
   */
  async injectUserSpeechEnd(sessionId: string, gymId: string, memberId: string, duration?: number): Promise<void> {
    await this.injectEvent({
      session_id: sessionId,
      gym_id: gymId,
      member_id: memberId,
      event_type: 'user_speech_end',
      audio_duration_ms: duration
    })
  }

  /**
   * 📝 Injecter un transcript utilisateur
   */
  async injectUserTranscript(
    sessionId: string, 
    gymId: string, 
    memberId: string, 
    transcript: string, 
    confidence?: number
  ): Promise<void> {
    const turnNumber = this.incrementTurn(sessionId)
    
    await this.injectEvent({
      session_id: sessionId,
      gym_id: gymId,
      member_id: memberId,
      event_type: 'user_transcript',
      user_transcript: transcript,
      confidence_score: confidence,
      turn_number: turnNumber
    })
  }

  /**
   * 🗣️ Injecter un événement de début de réponse JARVIS
   */
  async injectJarvisResponseStart(sessionId: string, gymId: string, memberId: string): Promise<void> {
    await this.injectEvent({
      session_id: sessionId,
      gym_id: gymId,
      member_id: memberId,
      event_type: 'jarvis_response_start'
    })
  }

  /**
   * ✅ Injecter un événement de fin de réponse JARVIS
   */
  async injectJarvisResponseEnd(sessionId: string, gymId: string, memberId: string, duration?: number): Promise<void> {
    await this.injectEvent({
      session_id: sessionId,
      gym_id: gymId,
      member_id: memberId,
      event_type: 'jarvis_response_end',
      audio_duration_ms: duration
    })
  }

  /**
   * 🤖 Injecter un transcript JARVIS
   */
  async injectJarvisTranscript(
    sessionId: string, 
    gymId: string, 
    memberId: string, 
    transcript: string, 
    responseTime?: number
  ): Promise<void> {
    const turnNumber = this.incrementTurn(sessionId)
    
    await this.injectEvent({
      session_id: sessionId,
      gym_id: gymId,
      member_id: memberId,
      event_type: 'jarvis_transcript',
      jarvis_transcript: transcript,
      audio_duration_ms: responseTime,
      turn_number: turnNumber
    })
  }

  /**
   * 💉 Injecter un événement dans la table Realtime
   */
  private async injectEvent(eventData: AudioEventData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('openai_realtime_audio_events')
        .insert({
          session_id: eventData.session_id,
          gym_id: eventData.gym_id,
          member_id: eventData.member_id,
          event_type: eventData.event_type,
          event_timestamp: new Date().toISOString(),
          user_transcript: eventData.user_transcript,
          jarvis_transcript: eventData.jarvis_transcript,
          audio_duration_ms: eventData.audio_duration_ms,
          confidence_score: eventData.confidence_score,
          turn_number: eventData.turn_number || 1
        })

      if (error) {
        console.error(`❌ [AUDIO INJECTOR] Erreur injection ${eventData.event_type}:`, error)
      } else {
        console.log(`✅ [AUDIO INJECTOR] ${eventData.event_type} injecté pour session ${eventData.session_id}`)
      }

    } catch (error) {
      console.error(`❌ [AUDIO INJECTOR] Erreur système:`, error)
    }
  }

  /**
   * 🔢 Incrémenter le compteur de tours pour une session
   */
  private incrementTurn(sessionId: string): number {
    const currentTurn = this.turnCounters.get(sessionId) || 0
    const newTurn = currentTurn + 1
    this.turnCounters.set(sessionId, newTurn)
    return newTurn
  }

  /**
   * 🏁 Finaliser une session (nettoyer les compteurs)
   */
  finalizeSession(sessionId: string): void {
    this.turnCounters.delete(sessionId)
    console.log(`🏁 [AUDIO INJECTOR] Session ${sessionId} finalisée`)
  }

  /**
   * 📊 Obtenir les statistiques des sessions actives
   */
  getActiveSessionsStats(): { total: number; sessions: string[] } {
    return {
      total: this.turnCounters.size,
      sessions: Array.from(this.turnCounters.keys())
    }
  }
}

// Instance singleton
export const realtimeAudioInjector = new RealtimeAudioInjector()



