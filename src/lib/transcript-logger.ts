/**
 * 🎯 TRANSCRIPT LOGGER - Plan B
 * Utilise les transcripts existants au lieu des événements OpenAI
 */

import { simpleLogger } from './jarvis-simple-logger'

interface TranscriptLoggerConfig {
  sessionId: string
  memberId?: string
  gymId?: string
}

class TranscriptLogger {
  private static instance: TranscriptLogger
  private config: TranscriptLoggerConfig | null = null
  private turnCounter = 0
  
  static getInstance(): TranscriptLogger {
    if (!TranscriptLogger.instance) {
      TranscriptLogger.instance = new TranscriptLogger()
    }
    return TranscriptLogger.instance
  }

  /**
   * 🔧 Configurer le logger pour une session
   */
  configure(config: TranscriptLoggerConfig) {
    this.config = config
    this.turnCounter = 0
    console.log('🎯 [TRANSCRIPT LOGGER] Configuré pour session:', config.sessionId)
  }

  /**
   * 📝 Logger un transcript utilisateur (depuis Speech Recognition)
   */
  async logUserTranscript(transcript: string) {
    if (!this.config || !transcript.trim()) return

    console.log('')
    console.log('🎤 [TRANSCRIPT LOGGER] ===== USER MESSAGE =====')
    console.log('👤 UTILISATEUR:', `"${transcript}"`)
    console.log('🔄 Tour:', ++this.turnCounter)
    console.log('=======================================')

    try {
      const success = await simpleLogger.logMessage({
        session_id: this.config.sessionId,
        member_id: this.config.memberId,
        gym_id: this.config.gymId,
        speaker: 'user',
        message_text: transcript.trim(),
        turn_number: this.turnCounter,
        timestamp: new Date()
      })

      if (success) {
        console.log('✅ [TRANSCRIPT LOGGER] Message utilisateur sauvé!')
      }
    } catch (error) {
      console.error('❌ [TRANSCRIPT LOGGER] Erreur user:', error)
    }
  }

  /**
   * 🤖 Logger un transcript JARVIS (depuis Transcript final)
   */
  async logJarvisTranscript(transcript: string) {
    if (!this.config || !transcript.trim()) return

    console.log('')
    console.log('🎤 [TRANSCRIPT LOGGER] ===== JARVIS RESPONSE =====')
    console.log('🤖 JARVIS:', `"${transcript}"`)
    console.log('🔄 Tour:', ++this.turnCounter)
    console.log('==========================================')

    try {
      const success = await simpleLogger.logMessage({
        session_id: this.config.sessionId,
        member_id: this.config.memberId,
        gym_id: this.config.gymId,
        speaker: 'jarvis',
        message_text: transcript.trim(),
        turn_number: this.turnCounter,
        timestamp: new Date()
      })

      if (success) {
        console.log('✅ [TRANSCRIPT LOGGER] Réponse JARVIS sauvée!')
      }
    } catch (error) {
      console.error('❌ [TRANSCRIPT LOGGER] Erreur jarvis:', error)
    }
  }

  /**
   * 🧹 Nettoyer la session
   */
  clear() {
    console.log('🧹 [TRANSCRIPT LOGGER] Session nettoyée')
    this.config = null
    this.turnCounter = 0
  }
}

export const transcriptLogger = TranscriptLogger.getInstance()
export default transcriptLogger

