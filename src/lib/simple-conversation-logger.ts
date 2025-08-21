/**
 * 💬 SIMPLE CONVERSATION LOGGER
 * Une seule responsabilité : Logger les conversations USER ↔ JARVIS
 * Principe : Simple, fiable, debuggable
 */

import { getSupabaseService } from './supabase-service'

export interface ConversationMessage {
  session_id: string
  speaker: 'user' | 'jarvis'
  message: string
  member_id?: string
  gym_id?: string
}

class SimpleConversationLogger {
  private supabase = getSupabaseService()

  /**
   * 💾 Logger un message de conversation
   * @param message - Le message à logger
   * @returns Promise<boolean> - true si succès, false sinon
   */
  async logMessage(message: ConversationMessage): Promise<boolean> {
    try {
      // Log supprimé pour production

      const { error } = await this.supabase
        .from('jarvis_conversation_logs')
        .insert({
          session_id: message.session_id,
          member_id: message.member_id,
          gym_id: message.gym_id,
          speaker: message.speaker,
          message_text: message.message,
          timestamp: new Date().toISOString(),
          // Colonnes optionnelles avec valeurs par défaut
          conversation_turn_number: 1, // TODO: Implémenter compteur si nécessaire
          detected_intent: null,
          sentiment_score: null,
          topic_category: null,
          mentioned_equipment: [],
          mentioned_activities: [],
          contains_complaint: false,
          contains_feedback: false,
          needs_human_review: false,
          user_engagement_level: null
        })

      if (error) {
        // Log supprimé pour production
        return false
      }

      // Log supprimé pour production
      return true

    } catch (error) {
      // Log supprimé pour production
      return false
    }
  }

  /**
   * 📋 Récupérer l'historique d'une session
   * @param sessionId - ID de la session
   * @returns Promise<ConversationMessage[]> - Historique des messages
   */
  async getSessionHistory(sessionId: string): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('jarvis_conversation_logs')
        .select('session_id, speaker, message_text, member_id, gym_id, timestamp')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (error) {
        // Log supprimé pour production
        return []
      }

      return data.map(row => ({
        session_id: row.session_id,
        speaker: row.speaker as 'user' | 'jarvis',
        message: row.message_text,
        member_id: row.member_id,
        gym_id: row.gym_id
      }))

    } catch (error) {
      // Log supprimé pour production
      return []
    }
  }
}

// Export singleton
export const conversationLogger = new SimpleConversationLogger()
export default conversationLogger

