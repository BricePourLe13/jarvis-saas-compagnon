/**
 * 🔗 INTÉGRATION CONVERSATIONS WEBRTC
 * Système pour capturer automatiquement les conversations OpenAI Realtime
 */

interface ConversationCapture {
  sessionId: string
  memberId: string
  gymId: string
  isActive: boolean
}

class ConversationIntegration {
  private activeCaptures = new Map<string, ConversationCapture>()

  /**
   * 🚀 Démarrer la capture pour une session
   */
  startCapture(sessionId: string, memberId: string, gymId: string): void {
    this.activeCaptures.set(sessionId, {
      sessionId,
      memberId,
      gymId,
      isActive: true
    })
    
    console.log(`💬 [INTEGRATION] Capture démarrée pour session ${sessionId}`)
  }

  /**
   * 👤 Capturer un message utilisateur
   */
  async captureUserMessage(sessionId: string, transcript: string, metadata?: any): Promise<void> {
    const capture = this.activeCaptures.get(sessionId)
    if (!capture || !capture.isActive) return

    try {
      await fetch('/api/conversations/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          member_id: capture.memberId,
          gym_id: capture.gymId,
          speaker: 'user',
          message_text: transcript,
          metadata: {
            confidence_score: metadata?.confidence_score,
            user_engagement_level: transcript.length > 50 ? 'high' : transcript.length > 20 ? 'medium' : 'low',
            ...metadata
          }
        })
      })
      
      console.log(`💬 [INTEGRATION] Message utilisateur capturé: ${transcript.substring(0, 30)}...`)
      
    } catch (error) {
      console.error('❌ [INTEGRATION] Erreur capture utilisateur:', error)
    }
  }

  /**
   * 🤖 Capturer une réponse JARVIS
   */
  async captureJarvisResponse(sessionId: string, response: string, metadata?: any): Promise<void> {
    const capture = this.activeCaptures.get(sessionId)
    if (!capture || !capture.isActive) return

    try {
      await fetch('/api/conversations/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          member_id: capture.memberId,
          gym_id: capture.gymId,
          speaker: 'jarvis',
          message_text: response,
          metadata: {
            response_time_ms: metadata?.response_time_ms,
            topic_category: this.detectTopicCategory(response),
            requires_follow_up: response.includes('?') || response.includes('comment') || response.includes('veux-tu'),
            contains_feedback: response.includes('bravo') || response.includes('excellent') || response.includes('bien joué'),
            ...metadata
          }
        })
      })
      
      console.log(`💬 [INTEGRATION] Réponse JARVIS capturée: ${response.substring(0, 30)}...`)
      
    } catch (error) {
      console.error('❌ [INTEGRATION] Erreur capture JARVIS:', error)
    }
  }

  /**
   * 🏁 Arrêter la capture pour une session
   */
  async stopCapture(sessionId: string): Promise<void> {
    const capture = this.activeCaptures.get(sessionId)
    if (!capture) return

    capture.isActive = false
    
    // Flush final des conversations en attente
    try {
      await fetch('/api/conversations/log', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('❌ [INTEGRATION] Erreur flush final:', error)
    }

    this.activeCaptures.delete(sessionId)
    console.log(`💬 [INTEGRATION] Capture arrêtée pour session ${sessionId}`)
  }

  /**
   * 🎯 Détecter la catégorie du sujet
   */
  private detectTopicCategory(text: string): string {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('exercice') || lowerText.includes('entraînement') || lowerText.includes('musculation')) {
      return 'fitness'
    }
    if (lowerText.includes('nutrition') || lowerText.includes('alimentation') || lowerText.includes('protéine')) {
      return 'nutrition'
    }
    if (lowerText.includes('motivation') || lowerText.includes('encouragement') || lowerText.includes('bravo')) {
      return 'motivation'
    }
    if (lowerText.includes('objectif') || lowerText.includes('but') || lowerText.includes('goal')) {
      return 'goals'
    }
    if (lowerText.includes('équipement') || lowerText.includes('machine') || lowerText.includes('matériel')) {
      return 'equipment'
    }
    
    return 'general'
  }

  /**
   * 📊 Obtenir les statistiques d'une session
   */
  async getSessionStats(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/conversations/log?session_id=${sessionId}`)
      const result = await response.json()
      return result.success ? result.stats : null
    } catch (error) {
      console.error('❌ [INTEGRATION] Erreur stats:', error)
      return null
    }
  }

  /**
   * 🧹 Nettoyage des captures inactives
   */
  cleanup(): void {
    for (const [sessionId, capture] of this.activeCaptures.entries()) {
      if (!capture.isActive) {
        this.activeCaptures.delete(sessionId)
      }
    }
  }
}

// Instance singleton
export const conversationIntegration = new ConversationIntegration()

// Nettoyage périodique
if (typeof window !== 'undefined') {
  setInterval(() => {
    conversationIntegration.cleanup()
  }, 5 * 60 * 1000) // 5 minutes
}



