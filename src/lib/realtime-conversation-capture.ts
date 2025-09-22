/**
 * 🎙️ CAPTURE CONVERSATIONS REALTIME
 * Système pour capturer automatiquement toutes les interactions OpenAI via Supabase Realtime
 */

import { createClient } from '@supabase/supabase-js'
import { conversationLogger } from './conversation-logger'

interface RealtimeAudioEvent {
  id: string
  session_id: string
  gym_id: string
  member_id: string
  event_type: 'user_speech_start' | 'user_speech_end' | 'user_transcript' | 'jarvis_response_start' | 'jarvis_response_end' | 'jarvis_transcript'
  event_timestamp: string
  user_transcript?: string
  jarvis_transcript?: string
  audio_duration_ms?: number
  confidence_score?: number
  turn_number: number
}

class RealtimeConversationCapture {
  private supabase: any = null
  private activeSubscriptions = new Map<string, any>()
  private sessionData = new Map<string, { member_id: string; gym_id: string }>()

  constructor() {
    this.initializeSupabase()
  }

  /**
   * 🚀 Initialiser Supabase client
   */
  private initializeSupabase(): void {
    if (typeof window === 'undefined') return // Server-side uniquement

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [REALTIME] Variables Supabase manquantes')
      return
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ [REALTIME] Client Supabase initialisé')
  }

  /**
   * 🎯 Démarrer l'écoute pour une session
   */
  startListening(sessionId: string, memberId: string, gymId: string): void {
    if (!this.supabase) {
      console.error('❌ [REALTIME] Client Supabase non initialisé')
      return
    }

    // Stocker les données de session
    this.sessionData.set(sessionId, { member_id: memberId, gym_id: gymId })

    // Créer la subscription Realtime
    const subscription = this.supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'openai_realtime_audio_events',
          filter: `session_id=eq.${sessionId}`
        },
        (payload: { new: RealtimeAudioEvent }) => {
          this.handleRealtimeEvent(payload.new)
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [REALTIME] Écoute démarrée pour session ${sessionId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [REALTIME] Erreur subscription pour ${sessionId}`)
        }
      })

    this.activeSubscriptions.set(sessionId, subscription)
  }

  /**
   * 📨 Traiter un événement Realtime
   */
  private async handleRealtimeEvent(event: RealtimeAudioEvent): Promise<void> {
    console.log(`🎙️ [REALTIME] Événement reçu: ${event.event_type} pour session ${event.session_id}`)

    try {
      // Convertir les événements audio en messages de conversation
      switch (event.event_type) {
        case 'user_transcript':
          if (event.user_transcript?.trim()) {
            await conversationLogger.logUserMessage(
              event.session_id,
              event.member_id,
              event.gym_id,
              event.user_transcript,
              {
                confidence_score: event.confidence_score,
                user_engagement_level: this.calculateEngagementLevel(event.user_transcript)
              }
            )
            console.log(`💬 [REALTIME] Message utilisateur capturé: ${event.user_transcript.substring(0, 30)}...`)
          }
          break

        case 'jarvis_transcript':
          if (event.jarvis_transcript?.trim()) {
            await conversationLogger.logJarvisResponse(
              event.session_id,
              event.member_id,
              event.gym_id,
              event.jarvis_transcript,
              {
                response_time_ms: event.audio_duration_ms,
                topic_category: this.detectTopicCategory(event.jarvis_transcript),
                requires_follow_up: this.detectFollowUpNeeded(event.jarvis_transcript),
                contains_feedback: this.detectFeedback(event.jarvis_transcript)
              }
            )
            console.log(`🤖 [REALTIME] Réponse JARVIS capturée: ${event.jarvis_transcript.substring(0, 30)}...`)
          }
          break

        case 'user_speech_start':
          console.log(`🎤 [REALTIME] Utilisateur commence à parler`)
          break

        case 'jarvis_response_start':
          console.log(`🗣️ [REALTIME] JARVIS commence à répondre`)
          break
      }

    } catch (error) {
      console.error('❌ [REALTIME] Erreur traitement événement:', error)
    }
  }

  /**
   * 🏁 Arrêter l'écoute pour une session
   */
  stopListening(sessionId: string): void {
    const subscription = this.activeSubscriptions.get(sessionId)
    
    if (subscription) {
      subscription.unsubscribe()
      this.activeSubscriptions.delete(sessionId)
      console.log(`🏁 [REALTIME] Écoute arrêtée pour session ${sessionId}`)
    }

    // Nettoyer les données de session
    this.sessionData.delete(sessionId)

    // Finaliser le logging
    conversationLogger.finalizeSession(sessionId)
  }

  /**
   * 🎯 Calculer le niveau d'engagement
   */
  private calculateEngagementLevel(text: string): string {
    const length = text.length
    const questionMarks = (text.match(/\?/g) || []).length
    const exclamations = (text.match(/!/g) || []).length
    
    if (length > 100 || questionMarks > 1 || exclamations > 1) return 'high'
    if (length > 30 || questionMarks > 0 || exclamations > 0) return 'medium'
    return 'low'
  }

  /**
   * 🏷️ Détecter la catégorie du sujet
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
   * ❓ Détecter si un suivi est nécessaire
   */
  private detectFollowUpNeeded(text: string): boolean {
    return text.includes('?') || 
           text.includes('comment') || 
           text.includes('veux-tu') ||
           text.includes('aimerais-tu') ||
           text.includes('penses-tu')
  }

  /**
   * 👏 Détecter les feedbacks positifs
   */
  private detectFeedback(text: string): boolean {
    const lowerText = text.toLowerCase()
    return lowerText.includes('bravo') || 
           lowerText.includes('excellent') || 
           lowerText.includes('bien joué') ||
           lowerText.includes('félicitations') ||
           lowerText.includes('super')
  }

  /**
   * 📊 Obtenir les statistiques des sessions actives
   */
  getActiveSessionsStats(): { total: number; sessions: string[] } {
    return {
      total: this.activeSubscriptions.size,
      sessions: Array.from(this.activeSubscriptions.keys())
    }
  }

  /**
   * 🧹 Nettoyage complet
   */
  cleanup(): void {
    // Arrêter toutes les subscriptions
    for (const [sessionId] of this.activeSubscriptions) {
      this.stopListening(sessionId)
    }

    console.log('🧹 [REALTIME] Nettoyage complet effectué')
  }
}

// Instance singleton
export const realtimeConversationCapture = new RealtimeConversationCapture()

// Nettoyage automatique à l'arrêt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeConversationCapture.cleanup()
  })
}



