/**
 * 🎙️ WHISPER CONVERSATION TRACKER
 * Approche moderne et professionnelle pour tracker les conversations
 * Utilise Web Speech API + Direct API calls (comme pour "au revoir")
 */

import { getSupabaseService } from './supabase-service'

interface ConversationTurn {
  session_id: string
  member_id: string
  gym_id: string
  speaker: 'user' | 'jarvis'
  content: string
  conversation_turn_number: number
  confidence?: number
  timestamp?: string
}

export class WhisperConversationTracker {
  private recognition: SpeechRecognition | null = null
  private isActive = false
  private config: {
    session_id: string
    member_id: string
    gym_id: string
    kiosk_slug: string
  } | null = null
  private turnCounter = 0
  private isJarvisSpeaking = false

  constructor() {
    this.setupSpeechRecognition()
  }

  /**
   * 🎯 Configuration du tracker
   */
  configure(config: {
    session_id: string
    member_id: string
    gym_id: string
    kiosk_slug: string
  }) {
    this.config = config
    this.turnCounter = 0
    console.log('🎙️ [WHISPER TRACKER] Configuré pour session:', config.session_id)
  }

  /**
   * 🎤 Setup Web Speech Recognition (comme pour "au revoir")
   */
  private setupSpeechRecognition() {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('🎙️ [WHISPER TRACKER] Speech Recognition non supporté')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'fr-FR'

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim()
        const confidence = event.results[i][0].confidence
        const isFinal = event.results[i].isFinal

        if (isFinal && transcript && !this.isJarvisSpeaking) {
          console.log('🎙️ [WHISPER TRACKER] USER:', transcript)
          this.logUserMessage(transcript, confidence)
        }
      }
    }

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('🎙️ [WHISPER TRACKER] Erreur:', event.error)
      }
      
      // Redémarrage automatique
      if (this.isActive) {
        setTimeout(() => this.startTracking(), 1000)
      }
    }

    this.recognition.onend = () => {
      if (this.isActive) {
        // Redémarrage automatique
        setTimeout(() => this.startTracking(), 500)
      }
    }
  }

  /**
   * 🚀 Démarrer le tracking
   */
  startTracking() {
    if (!this.recognition || !this.config) {
      console.warn('🎙️ [WHISPER TRACKER] Configuration manquante')
      return false
    }

    if (this.isActive) return true

    try {
      this.isActive = true
      this.recognition.start()
      console.log('🎙️ [WHISPER TRACKER] Tracking démarré')
      return true
    } catch (error) {
      console.error('🎙️ [WHISPER TRACKER] Erreur démarrage:', error)
      return false
    }
  }

  /**
   * ⏹️ Arrêter le tracking
   */
  stopTracking() {
    if (!this.recognition) return

    this.isActive = false
    try {
      this.recognition.stop()
      console.log('🎙️ [WHISPER TRACKER] Tracking arrêté')
    } catch (error) {
      console.error('🎙️ [WHISPER TRACKER] Erreur arrêt:', error)
    }
  }

  /**
   * 🎯 Notifier que JARVIS parle (pour éviter de tracker sa voix)
   */
  setJarvisSpeaking(speaking: boolean) {
    this.isJarvisSpeaking = speaking
    if (speaking) {
      console.log('🤐 [WHISPER TRACKER] JARVIS parle - pause tracking USER')
    } else {
      console.log('🎤 [WHISPER TRACKER] JARVIS fini - reprise tracking USER')
    }
  }

  /**
   * 🤖 Logger manuellement une réponse JARVIS (appelé depuis VoiceInterface)
   */
  logJarvisMessage(content: string) {
    if (!this.config) return
    
    this.turnCounter++
    console.log('🤖 [WHISPER TRACKER] JARVIS:', content)
    
    this.logConversationTurn({
      ...this.config,
      speaker: 'jarvis',
      content,
      conversation_turn_number: this.turnCounter
    })
  }

  /**
   * 👤 Logger un message utilisateur
   */
  private logUserMessage(content: string, confidence?: number) {
    if (!this.config) return
    
    this.turnCounter++
    
    this.logConversationTurn({
      ...this.config,
      speaker: 'user',
      content,
      conversation_turn_number: this.turnCounter,
      confidence
    })
  }

  /**
   * 💾 Logger dans la base de données (Direct API call)
   */
  private async logConversationTurn(turn: ConversationTurn) {
    try {
      const response = await fetch(`/api/kiosk/${this.config?.kiosk_slug}/log-interaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: turn.session_id,
          member_id: turn.member_id,
          gym_id: turn.gym_id,
          speaker: turn.speaker,
          content: turn.content,
          conversation_turn_number: turn.conversation_turn_number,
          confidence: turn.confidence,
          timestamp: new Date().toISOString()
        }),
        keepalive: true
      })

      if (response.ok) {
        console.log(`✅ [WHISPER TRACKER] ${turn.speaker.toUpperCase()} T${turn.conversation_turn_number} loggé`)
      } else {
        console.error('❌ [WHISPER TRACKER] Erreur logging:', response.status)
      }
    } catch (error) {
      console.error('❌ [WHISPER TRACKER] Erreur API:', error)
    }
  }

  /**
   * 🧹 Cleanup complet
   */
  cleanup() {
    this.stopTracking()
    this.config = null
    this.turnCounter = 0
    console.log('🧹 [WHISPER TRACKER] Cleanup terminé')
  }
}

// Singleton global
let whisperTracker: WhisperConversationTracker | null = null

export function getWhisperTracker(): WhisperConversationTracker {
  if (!whisperTracker) {
    whisperTracker = new WhisperConversationTracker()
  }
  return whisperTracker
}
