/**
 * 💬 ENREGISTREMENT CONVERSATIONS PRODUCTION
 * Système complet pour logger toutes les interactions adhérent ↔ JARVIS
 */

import { getSupabaseService } from './supabase-service'

export interface ConversationEntry {
  session_id: string
  member_id: string
  gym_id: string
  speaker: 'user' | 'jarvis'
  message_text: string
  conversation_turn_number: number
  timestamp?: string
  
  // Métadonnées optionnelles
  confidence_score?: number
  detected_intent?: string
  sentiment_score?: number
  emotion_detected?: string
  topic_category?: string
  mentioned_equipment?: string[]
  mentioned_activities?: string[]
  mentioned_goals?: string[]
  mentioned_issues?: string[]
  response_time_ms?: number
  user_engagement_level?: string
  requires_follow_up?: boolean
  contains_feedback?: boolean
  contains_complaint?: boolean
  contains_goal_update?: boolean
  needs_human_review?: boolean
}

class ConversationLogger {
  private pendingLogs: ConversationEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL = 2000 // 2 secondes
  private readonly MAX_BATCH_SIZE = 50
  private turnCounters = new Map<string, number>() // session_id -> turn_number

  constructor() {
    this.startFlushTimer()
  }

  /**
   * 📝 Logger un message de conversation
   */
  async logMessage(entry: Omit<ConversationEntry, 'conversation_turn_number' | 'timestamp'>): Promise<boolean> {
    try {
      // Incrémenter le compteur de tour pour cette session
      const currentTurn = this.turnCounters.get(entry.session_id) || 0
      const newTurn = currentTurn + 1
      this.turnCounters.set(entry.session_id, newTurn)

      const completeEntry: ConversationEntry = {
        ...entry,
        conversation_turn_number: newTurn,
        timestamp: new Date().toISOString()
      }

      // Ajouter à la queue
      this.pendingLogs.push(completeEntry)

      console.log(`💬 [CONV] ${entry.speaker}: ${entry.message_text.substring(0, 50)}... (tour ${newTurn})`)

      // Flush immédiat si batch plein
      if (this.pendingLogs.length >= this.MAX_BATCH_SIZE) {
        await this.flushPendingLogs()
      }

      return true

    } catch (error) {
      console.error('❌ [CONV] Erreur log message:', error)
      return false
    }
  }

  /**
   * 🎯 Logger spécifiquement un message utilisateur
   */
  async logUserMessage(
    session_id: string,
    member_id: string,
    gym_id: string,
    message: string,
    metadata?: {
      confidence_score?: number
      detected_intent?: string
      sentiment_score?: number
      emotion_detected?: string
      mentioned_equipment?: string[]
      mentioned_activities?: string[]
      user_engagement_level?: string
    }
  ): Promise<boolean> {
    return this.logMessage({
      session_id,
      member_id,
      gym_id,
      speaker: 'user',
      message_text: message,
      ...metadata
    })
  }

  /**
   * 🤖 Logger spécifiquement une réponse JARVIS
   */
  async logJarvisResponse(
    session_id: string,
    member_id: string,
    gym_id: string,
    response: string,
    metadata?: {
      response_time_ms?: number
      topic_category?: string
      mentioned_goals?: string[]
      requires_follow_up?: boolean
      contains_feedback?: boolean
      needs_human_review?: boolean
    }
  ): Promise<boolean> {
    return this.logMessage({
      session_id,
      member_id,
      gym_id,
      speaker: 'jarvis',
      message_text: response,
      ...metadata
    })
  }

  /**
   * 🔄 Démarrer le timer de flush automatique
   */
  private startFlushTimer(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }

    this.flushInterval = setInterval(async () => {
      if (this.pendingLogs.length > 0) {
        await this.flushPendingLogs()
      }
    }, this.FLUSH_INTERVAL)
  }

  /**
   * 💾 Envoyer les logs en attente vers la base de données
   */
  private async flushPendingLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return

    const logsToFlush = [...this.pendingLogs]
    this.pendingLogs = []

    try {
      const supabase = getSupabaseService()

      const { error } = await supabase
        .from('jarvis_conversation_logs')
        .insert(logsToFlush)

      if (error) {
        console.error('❌ [CONV] Erreur flush DB:', error)
        // Remettre les logs en queue en cas d'erreur
        this.pendingLogs.unshift(...logsToFlush)
      } else {
        console.log(`✅ [CONV] ${logsToFlush.length} messages sauvés en DB`)
      }

    } catch (error) {
      console.error('❌ [CONV] Erreur flush:', error)
      // Remettre en queue
      this.pendingLogs.unshift(...logsToFlush)
    }
  }

  /**
   * 🏁 Finaliser une session (flush forcé + nettoyage)
   */
  async finalizeSession(session_id: string): Promise<void> {
    // Flush immédiat des logs en attente
    await this.flushPendingLogs()
    
    // Nettoyer le compteur de tours
    this.turnCounters.delete(session_id)
    
    console.log(`🏁 [CONV] Session ${session_id} finalisée`)
  }

  /**
   * 📊 Obtenir les statistiques d'une session
   */
  getSessionStats(session_id: string): { turn_count: number; pending_logs: number } {
    return {
      turn_count: this.turnCounters.get(session_id) || 0,
      pending_logs: this.pendingLogs.filter(log => log.session_id === session_id).length
    }
  }

  /**
   * 🧹 Nettoyage à l'arrêt
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    // Flush final
    await this.flushPendingLogs()
    
    console.log('🧹 [CONV] Logger arrêté proprement')
  }
}

// Instance singleton
export const conversationLogger = new ConversationLogger()

// Nettoyage automatique à l'arrêt du processus
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await conversationLogger.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await conversationLogger.shutdown()
    process.exit(0)
  })
}



