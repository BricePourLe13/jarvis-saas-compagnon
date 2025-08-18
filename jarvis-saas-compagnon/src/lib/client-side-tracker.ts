/**
 * 🎯 CLIENT-SIDE TRACKER
 * Solution de fallback qui utilise les APIs publiques au lieu du service role
 */

interface TrackingEvent {
  session_id: string
  member_id: string
  gym_id: string
  speaker: 'user' | 'ai'
  transcript: string
  conversation_turn_number: number
  metadata?: {
    confidence_score?: number
    duration_ms?: number
    latency_ms?: number
    audio_quality?: string
  }
}

class ClientSideTracker {
  private currentSession: {
    id: string
    member_id: string
    gym_id: string
    turn_counter: number
  } | null = null
  private pendingEvents: TrackingEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null

  /**
   * 🎯 Initialiser une session de tracking
   */
  async initSession(sessionId: string, memberId: string, gymId: string) {
    this.currentSession = {
      id: sessionId,
      member_id: memberId,
      gym_id: gymId,
      turn_counter: 0
    }
    
    console.log('🎯 [CLIENT TRACKER] Session initialisée:', sessionId)
    this.scheduleFlush()
  }

  /**
   * 👤 Tracker un message utilisateur
   */
  trackUserSpeech(transcript: string, metadata?: { confidence_score?: number, duration_ms?: number }) {
    if (!this.currentSession) return

    this.currentSession.turn_counter++
    
    this.pendingEvents.push({
      session_id: this.currentSession.id,
      member_id: this.currentSession.member_id,
      gym_id: this.currentSession.gym_id,
      speaker: 'user',
      transcript,
      conversation_turn_number: this.currentSession.turn_counter,
      metadata
    })

    console.log(`👤 [CLIENT TRACKER] User Speech buffered (turn ${this.currentSession.turn_counter}):`, transcript.substring(0, 50) + '...')
  }

  /**
   * 🤖 Tracker une réponse IA
   */
  trackAIResponse(transcript: string, metadata?: { latency_ms?: number, audio_quality?: string }) {
    if (!this.currentSession) return

    this.currentSession.turn_counter++
    
    this.pendingEvents.push({
      session_id: this.currentSession.id,
      member_id: this.currentSession.member_id,
      gym_id: this.currentSession.gym_id,
      speaker: 'ai',
      transcript,
      conversation_turn_number: this.currentSession.turn_counter,
      metadata
    })

    console.log(`🤖 [CLIENT TRACKER] AI Response buffered (turn ${this.currentSession.turn_counter}):`, transcript.substring(0, 50) + '...')
  }

  /**
   * 🔚 Finaliser une session
   */
  endSession(reason: string = 'user_goodbye') {
    if (!this.currentSession) return

    console.log(`🏁 [CLIENT TRACKER] Session ended: ${this.currentSession.id} (Reason: ${reason})`)
    this.flushPendingEvents() // Flush immédiat
    this.currentSession = null
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * ⏰ Programmer le flush automatique
   */
  private scheduleFlush() {
    if (this.flushTimer) clearTimeout(this.flushTimer)
    
    this.flushTimer = setTimeout(() => {
      this.flushPendingEvents()
      this.scheduleFlush() // Re-programmer
    }, 2000) // Flush toutes les 2 secondes
  }

  /**
   * 🚀 Envoyer les événements en attente via API publique
   */
  private async flushPendingEvents() {
    if (this.pendingEvents.length === 0) return

    const events = [...this.pendingEvents]
    this.pendingEvents = []

    console.log(`📊 [CLIENT TRACKER] Flushing ${events.length} interactions...`)

    for (const event of events) {
      try {
        const response = await fetch('/api/debug/log-interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        })

        if (!response.ok) {
          console.error(`❌ [CLIENT TRACKER] Failed to log interaction:`, event)
        }
      } catch (error) {
        console.error('❌ [CLIENT TRACKER] Error logging interaction:', error)
      }
    }

    console.log(`✅ [CLIENT TRACKER] ${events.length} interactions flushed.`)
  }
}

export const clientSideTracker = new ClientSideTracker()
