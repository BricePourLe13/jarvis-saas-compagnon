/**
 * 🎯 CONSOLE TRANSCRIPT INTERCEPTOR
 * Intercepte les logs console existants pour capturer les transcripts
 */

import { simpleLogger } from '@/lib/jarvis-simple-logger'

interface SessionConfig {
  sessionId: string
  memberId?: string
  gymId?: string
}

class ConsoleTranscriptInterceptor {
  private static instance: ConsoleTranscriptInterceptor
  private config: SessionConfig | null = null
  private turnCounter = 0
  private originalConsoleLog: typeof console.log
  
  static getInstance(): ConsoleTranscriptInterceptor {
    if (!ConsoleTranscriptInterceptor.instance) {
      ConsoleTranscriptInterceptor.instance = new ConsoleTranscriptInterceptor()
    }
    return ConsoleTranscriptInterceptor.instance
  }

  constructor() {
    this.originalConsoleLog = console.log.bind(console)
    this.setupInterceptor()
  }

  /**
   * 🔧 Configurer l'intercepteur pour une session
   */
  configure(config: SessionConfig) {
    this.config = config
    this.turnCounter = 0
    console.log('🎯 [CONSOLE INTERCEPTOR] Configuré pour session:', config.sessionId)
  }

  /**
   * 🔄 Nettoyer la session
   */
  clear() {
    this.config = null
    this.turnCounter = 0
  }

  /**
   * 🎯 Intercepter les console.log pour capturer les transcripts
   */
  private setupInterceptor() {
    console.log = (...args: any[]) => {
      // Appeler le log original
      this.originalConsoleLog(...args)

      // Analyser pour les transcripts
      if (this.config && args.length > 0) {
        const message = args.join(' ')

        // Messages utilisateur depuis Speech Recognition
        if (message.includes('🎯 [GOODBYE] Speech Recognition:')) {
          const transcript = message.replace('🎯 [GOODBYE] Speech Recognition:', '').trim()
          if (transcript && transcript !== 'au revoir') {
            this.logUserMessage(transcript)
          }
        }

        // Réponses JARVIS depuis Transcript final
        if (message.includes('📝 Transcript final:')) {
          const transcript = message.replace('📝 Transcript final:', '').trim()
          if (transcript) {
            this.logJarvisMessage(transcript)
          }
        }
      }
    }
  }

  /**
   * 📝 Logger un message utilisateur
   */
  private async logUserMessage(transcript: string) {
    if (!this.config) return

    console.log('')
    console.log('🎤 [CONSOLE INTERCEPTOR] ===== USER MESSAGE =====')
    console.log('👤 UTILISATEUR:', `"${transcript}"`)
    console.log('🔄 Tour:', ++this.turnCounter)
    console.log('=============================================')

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
        console.log('✅ [CONSOLE INTERCEPTOR] Message utilisateur sauvé!')
      }
    } catch (error) {
      console.error('❌ [CONSOLE INTERCEPTOR] Erreur user:', error)
    }
  }

  /**
   * 🤖 Logger un message JARVIS
   */
  private async logJarvisMessage(transcript: string) {
    if (!this.config) return

    console.log('')
    console.log('🎤 [CONSOLE INTERCEPTOR] ===== JARVIS RESPONSE =====')
    console.log('🤖 JARVIS:', `"${transcript}"`)
    console.log('🔄 Tour:', ++this.turnCounter)
    console.log('================================================')

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
        console.log('✅ [CONSOLE INTERCEPTOR] Réponse JARVIS sauvée!')
      }
    } catch (error) {
      console.error('❌ [CONSOLE INTERCEPTOR] Erreur jarvis:', error)
    }
  }
}

export const consoleTranscriptInterceptor = ConsoleTranscriptInterceptor.getInstance()
export default consoleTranscriptInterceptor
