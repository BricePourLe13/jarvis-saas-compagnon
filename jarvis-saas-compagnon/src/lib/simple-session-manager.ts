/**
 * 🎯 SIMPLE SESSION MANAGER
 * Une seule responsabilité : Gérer le cycle de vie des sessions
 * Principe : Ouvrir proprement, fermer proprement
 */

import { getSupabaseService } from './supabase-service'

export interface SessionData {
  session_id: string
  gym_id: string
  member_id?: string
  member_name?: string
  started_at: Date
}

class SimpleSessionManager {
  private supabase = getSupabaseService()
  private activeSessions = new Map<string, SessionData>()

  /**
   * 🚀 Démarrer une nouvelle session
   * @param data - Données de la session
   * @returns Promise<boolean> - true si succès
   */
  async startSession(data: SessionData): Promise<boolean> {
    try {
      // Log supprimé pour production

      // Sauver en BDD
      const { error } = await this.supabase
        .from('openai_realtime_sessions')
        .insert({
          session_id: data.session_id,
          gym_id: data.gym_id,
          member_name: data.member_name,
          session_started_at: data.started_at.toISOString(),
          // Valeurs par défaut
          ai_model: 'gpt-4o-mini-realtime-preview-2024-12-17',
          voice_model: 'verse',
          connection_type: 'webrtc',
          turn_detection_type: 'server_vad',
          total_input_tokens: 0,
          total_output_tokens: 0,
          total_input_audio_tokens: 0,
          total_output_audio_tokens: 0,
          total_user_turns: 0,
          total_ai_turns: 0,
          total_interruptions: 0,
          total_cost_usd: 0,
          session_metadata: {
            started_by: 'simple_session_manager',
            member_id: data.member_id
          }
        })

      if (error) {
        // Log supprimé pour production
        return false
      }

      // Mémoriser en local
      this.activeSessions.set(data.session_id, data)
      // Log supprimé pour production
      return true

    } catch (error) {
      // Log supprimé pour production
      return false
    }
  }

  /**
   * 🏁 Terminer une session
   * @param sessionId - ID de la session
   * @param reason - Raison de fermeture
   * @returns Promise<boolean> - true si succès
   */
  async endSession(sessionId: string, reason: string = 'user_goodbye'): Promise<boolean> {
    try {
      // Log supprimé pour production

      const sessionData = this.activeSessions.get(sessionId)
      if (!sessionData) {
        // Log supprimé pour production
        return false
      }

      const duration = Math.floor((Date.now() - sessionData.started_at.getTime()) / 1000)

      // Mettre à jour en BDD
      const { error } = await this.supabase
        .from('openai_realtime_sessions')
        .update({
          session_ended_at: new Date().toISOString(),
          session_duration_seconds: duration,
          end_reason: reason
        })
        .eq('session_id', sessionId)

      if (error) {
        // Log supprimé pour production
        return false
      }

      // Supprimer de la mémoire locale
      this.activeSessions.delete(sessionId)
      // Log supprimé pour production
      return true

    } catch (error) {
      // Log supprimé pour production
      return false
    }
  }

  /**
   * 📊 Obtenir les sessions actives
   * @returns SessionData[] - Liste des sessions actives
   */
  getActiveSessions(): SessionData[] {
    return Array.from(this.activeSessions.values())
  }

  /**
   * 🔍 Vérifier si une session est active
   * @param sessionId - ID de la session
   * @returns boolean - true si active
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId)
  }
}

// Export singleton
export const sessionManager = new SimpleSessionManager()
export default sessionManager

