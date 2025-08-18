/**
 * 🎯 REALTIME INTERACTION TRACKER
 * Solution experte pour tracking d'interactions en temps réel
 * Intégration directe dans les événements WebRTC/OpenAI
 */

interface InteractionEvent {
  session_id: string
  member_id: string
  gym_id: string
  type: 'user_speech' | 'ai_response' | 'session_start' | 'session_end'
  content: string
  turn_number: number
  metadata?: {
    duration_ms?: number
    confidence_score?: number
    audio_quality?: string
    latency_ms?: number
  }
}

class RealtimeInteractionTracker {
  private supabase: any = null
  private currentSession: {
    id: string
    member_id: string
    gym_id: string
    turn_counter: number
  } | null = null
  private pendingEvents: InteractionEvent[] = []
  private batchTimer: NodeJS.Timeout | null = null

  /**
   * 🔧 Initialiser Supabase si pas encore fait
   */
  private async initSupabase() {
    if (!this.supabase) {
      try {
        const { getSupabaseService } = await import('./supabase-service')
        this.supabase = getSupabaseService()
        console.log('✅ [REALTIME TRACKER] Supabase initialisé')
      } catch (error) {
        console.error('❌ [REALTIME TRACKER] Erreur init Supabase:', error)
        return false
      }
    }
    return true
  }

  /**
   * 🎯 Initialiser une session de tracking
   */
  async initSession(sessionId: string, memberId: string, gymId: string) {
    const supabaseReady = await this.initSupabase()
    if (!supabaseReady) {
      console.warn('⚠️ [REALTIME TRACKER] Supabase non disponible - tracking désactivé')
      return
    }

    this.currentSession = {
      id: sessionId,
      member_id: memberId,
      gym_id: gymId,
      turn_counter: 0
    }
    
    // Log session start
    this.trackEvent({
      session_id: sessionId,
      member_id: memberId,
      gym_id: gymId,
      type: 'session_start',
      content: `Session démarrée pour ${memberId}`,
      turn_number: 0
    })
    
    console.log('🎯 [REALTIME TRACKER] Session initialisée:', sessionId)
  }

  /**
   * 👤 Tracker un message utilisateur
   */
  trackUserSpeech(transcript: string, metadata?: { confidence_score?: number, duration_ms?: number }) {
    if (!this.currentSession || !this.supabase) return

    this.currentSession.turn_counter++
    
    this.trackEvent({
      session_id: this.currentSession.id,
      member_id: this.currentSession.member_id,
      gym_id: this.currentSession.gym_id,
      type: 'user_speech',
      content: transcript,
      turn_number: this.currentSession.turn_counter,
      metadata
    })
  }

  /**
   * 🤖 Tracker une réponse IA
   */
  trackAIResponse(transcript: string, metadata?: { latency_ms?: number, audio_quality?: string }) {
    if (!this.currentSession || !this.supabase) return

    this.currentSession.turn_counter++
    
    this.trackEvent({
      session_id: this.currentSession.id,
      member_id: this.currentSession.member_id,
      gym_id: this.currentSession.gym_id,
      type: 'ai_response',
      content: transcript,
      turn_number: this.currentSession.turn_counter,
      metadata
    })
  }

  /**
   * 🔚 Finaliser une session
   */
  endSession(reason: string = 'user_goodbye') {
    if (!this.currentSession || !this.supabase) return

    this.trackEvent({
      session_id: this.currentSession.id,
      member_id: this.currentSession.member_id,
      gym_id: this.currentSession.gym_id,
      type: 'session_end',
      content: `Session terminée: ${reason}`,
      turn_number: this.currentSession.turn_counter + 1
    })

    // Forcer l'envoi des événements en attente
    this.flushPendingEvents()
    
    console.log('🏁 [REALTIME TRACKER] Session terminée:', this.currentSession.id)
    this.currentSession = null
  }

  /**
   * 📊 Tracker un événement (méthode privée)
   */
  private trackEvent(event: InteractionEvent) {
    this.pendingEvents.push(event)
    
    // Batch les événements pour optimiser les performances
    if (this.batchTimer) clearTimeout(this.batchTimer)
    
    this.batchTimer = setTimeout(() => {
      this.flushPendingEvents()
    }, 1000) // Envoi par batch toutes les secondes
  }

  /**
   * 🚀 Envoyer les événements en attente à la DB
   */
  private async flushPendingEvents() {
    if (this.pendingEvents.length === 0 || !this.supabase) return

    const events = [...this.pendingEvents]
    this.pendingEvents = []

    try {
      // Convertir au format DB
      const dbRecords = events.map(event => ({
        session_id: event.session_id,
        member_id: event.member_id,
        gym_id: event.gym_id,
        speaker: event.type === 'user_speech' ? 'user' : 'jarvis',
        content: event.content,
        conversation_turn_number: event.turn_number,
        timestamp: new Date().toISOString(),
        metadata: event.metadata || {}
      }))

      const { error } = await this.supabase
        .from('jarvis_conversation_logs')
        .insert(dbRecords)

      if (error) {
        console.error('❌ [REALTIME TRACKER] Erreur DB:', error)
        // Remettre les événements en queue en cas d'erreur
        this.pendingEvents.unshift(...events)
      } else {
        console.log(`✅ [REALTIME TRACKER] ${events.length} événements sauvés`)
      }
    } catch (error) {
      console.error('❌ [REALTIME TRACKER] Erreur flush:', error)
      // Remettre en queue
      this.pendingEvents.unshift(...events)
    }
  }

  /**
   * 📈 Obtenir les stats de la session actuelle
   */
  getCurrentSessionStats() {
    return this.currentSession ? {
      session_id: this.currentSession.id,
      turn_count: this.currentSession.turn_counter,
      pending_events: this.pendingEvents.length
    } : null
  }
}

// Instance singleton
export const realtimeTracker = new RealtimeInteractionTracker()

// Export pour debug
export { RealtimeInteractionTracker, type InteractionEvent }
