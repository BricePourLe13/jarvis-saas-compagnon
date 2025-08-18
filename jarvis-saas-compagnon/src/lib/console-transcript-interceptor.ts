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
    this.originalConsoleLog('🎯 [CONSOLE INTERCEPTOR] Configuré pour session:', config.sessionId)
    this.originalConsoleLog('🎯 [CONSOLE INTERCEPTOR] Member ID:', config.memberId)
    this.originalConsoleLog('🎯 [CONSOLE INTERCEPTOR] Gym ID:', config.gymId)
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
    this.originalConsoleLog('🎯 [CONSOLE INTERCEPTOR] Intercepteur activé!')
    
    console.log = (...args: any[]) => {
      // Appeler le log original
      this.originalConsoleLog(...args)

      // Analyser pour les transcripts
      if (args.length > 0) {
        const message = args.join(' ')

        // Debug: afficher tous les messages qui matchent nos patterns
        if (message.includes('🎯 [GOODBYE] Speech Recognition:') || message.includes('📝 Transcript final:')) {
          this.originalConsoleLog('🔍 [INTERCEPTOR DEBUG] Message capturé:', message.substring(0, 100))
          this.originalConsoleLog('🔍 [INTERCEPTOR DEBUG] Config disponible:', !!this.config)
        }

        if (this.config) {
          // Messages utilisateur depuis Speech Recognition
          if (message.includes('🎯 [GOODBYE] Speech Recognition:')) {
            const transcript = message.replace('🎯 [GOODBYE] Speech Recognition:', '').trim()
            if (transcript && transcript !== 'au revoir') {
              this.originalConsoleLog('🎯 [INTERCEPTOR] Capturing USER message:', transcript)
              this.logUserMessage(transcript)
            }
          }

          // Réponses JARVIS depuis Transcript final
          if (message.includes('📝 Transcript final:')) {
            const transcript = message.replace('📝 Transcript final:', '').trim()
            if (transcript) {
              this.originalConsoleLog('🎯 [INTERCEPTOR] Capturing JARVIS message:', transcript)
              this.logJarvisMessage(transcript)
            }
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
    this.turnCounter++

    // Log plus simple pour éviter le filtrage
    this.originalConsoleLog(`🎤 USER T${this.turnCounter}: "${transcript}"`)

    try {
      // Utiliser l'API kiosk pour la sauvegarde (plus fiable)
      const response = await fetch('/api/kiosk/gym-yatblc8h/log-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.config.sessionId,
          member_id: this.config.memberId,
          gym_id: this.config.gymId,
          speaker: 'user',
          message_text: transcript.trim(),
          conversation_turn_number: this.turnCounter,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        this.originalConsoleLog('✅ USER MESSAGE SAVED TO DB!')
      } else {
        this.originalConsoleLog('❌ Failed to save USER message to DB!')
      }
    } catch (error) {
      this.originalConsoleLog('❌ USER save error:', error)
    }
  }

  /**
   * 🤖 Logger un message JARVIS
   */
  private async logJarvisMessage(transcript: string) {
    if (!this.config) return
    this.turnCounter++

    // Log plus simple pour éviter le filtrage
    this.originalConsoleLog(`🤖 JARVIS T${this.turnCounter}: "${transcript}"`)

    try {
      // Utiliser l'API kiosk pour la sauvegarde (plus fiable)
      const response = await fetch('/api/kiosk/gym-yatblc8h/log-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.config.sessionId,
          member_id: this.config.memberId,
          gym_id: this.config.gymId,
          speaker: 'jarvis',
          message_text: transcript.trim(),
          conversation_turn_number: this.turnCounter,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        this.originalConsoleLog('✅ JARVIS MESSAGE SAVED TO DB!')
      } else {
        this.originalConsoleLog('❌ Failed to save JARVIS message to DB!')
      }
    } catch (error) {
      this.originalConsoleLog('❌ JARVIS save error:', error)
    }
  }
}

export const consoleTranscriptInterceptor = ConsoleTranscriptInterceptor.getInstance()
export default consoleTranscriptInterceptor
