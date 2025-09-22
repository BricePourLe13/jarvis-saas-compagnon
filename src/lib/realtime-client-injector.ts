/**
 * 📡 CLIENT REALTIME INJECTOR
 * Helper côté client pour injecter les événements audio via API
 */

interface AudioEventPayload {
  action: 'user_speech_start' | 'user_speech_end' | 'user_transcript' | 'jarvis_response_start' | 'jarvis_response_end' | 'jarvis_transcript'
  sessionId: string
  gymId: string
  memberId: string
  transcript?: string
  confidence?: number
  duration?: number
}

class RealtimeClientInjector {
  private readonly API_ENDPOINT = '/api/realtime/inject-audio-event'

  /**
   * 🎤 Injecter début de parole utilisateur
   */
  async injectUserSpeechStart(sessionId: string, gymId: string, memberId: string): Promise<void> {
    await this.injectEvent({
      action: 'user_speech_start',
      sessionId,
      gymId,
      memberId
    })
  }

  /**
   * 🤐 Injecter fin de parole utilisateur
   */
  async injectUserSpeechEnd(sessionId: string, gymId: string, memberId: string, duration?: number): Promise<void> {
    await this.injectEvent({
      action: 'user_speech_end',
      sessionId,
      gymId,
      memberId,
      duration
    })
  }

  /**
   * 📝 Injecter transcript utilisateur
   */
  async injectUserTranscript(
    sessionId: string, 
    gymId: string, 
    memberId: string, 
    transcript: string, 
    confidence?: number
  ): Promise<void> {
    await this.injectEvent({
      action: 'user_transcript',
      sessionId,
      gymId,
      memberId,
      transcript,
      confidence
    })
  }

  /**
   * 🗣️ Injecter début de réponse JARVIS
   */
  async injectJarvisResponseStart(sessionId: string, gymId: string, memberId: string): Promise<void> {
    await this.injectEvent({
      action: 'jarvis_response_start',
      sessionId,
      gymId,
      memberId
    })
  }

  /**
   * ✅ Injecter fin de réponse JARVIS
   */
  async injectJarvisResponseEnd(sessionId: string, gymId: string, memberId: string, duration?: number): Promise<void> {
    await this.injectEvent({
      action: 'jarvis_response_end',
      sessionId,
      gymId,
      memberId,
      duration
    })
  }

  /**
   * 🤖 Injecter transcript JARVIS
   */
  async injectJarvisTranscript(
    sessionId: string, 
    gymId: string, 
    memberId: string, 
    transcript: string, 
    responseTime?: number
  ): Promise<void> {
    await this.injectEvent({
      action: 'jarvis_transcript',
      sessionId,
      gymId,
      memberId,
      transcript,
      duration: responseTime
    })
  }

  /**
   * 💉 Injecter un événement via l'API
   */
  private async injectEvent(payload: AudioEventPayload): Promise<void> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error(`❌ [CLIENT INJECTOR] Erreur ${payload.action}:`, error)
      } else {
        console.log(`✅ [CLIENT INJECTOR] ${payload.action} injecté pour session ${payload.sessionId}`)
      }

    } catch (error) {
      console.error(`❌ [CLIENT INJECTOR] Erreur réseau:`, error)
    }
  }
}

// Instance singleton
export const realtimeClientInjector = new RealtimeClientInjector()



