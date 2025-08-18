/**
 * 🎯 WHISPER PARALLEL TRACKER
 * 
 * STRATÉGIE EXPERTE:
 * - User Speech → Whisper API (transcription fiable + métadonnées)
 * - AI Responses → OpenAI Realtime transcript (déjà disponible)
 * - Logging direct via API publique (pas de service role)
 * - Session lifecycle complet
 */

interface WhisperTrackingSession {
  session_id: string
  member_id: string
  gym_id: string
  turn_counter: number
  audio_chunks: Blob[]
  is_recording: boolean
}

class WhisperParallelTracker {
  private currentSession: WhisperTrackingSession | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioStream: MediaStream | null = null

  /**
   * 🎯 Initialiser session de tracking Whisper
   */
  async initSession(sessionId: string, memberId: string, gymId: string) {
    this.currentSession = {
      session_id: sessionId,
      member_id: memberId,
      gym_id: gymId,
      turn_counter: 0,
      audio_chunks: [],
      is_recording: false
    }

    console.log('🎙️ [WHISPER TRACKER] Session initialisée:', sessionId)
    
    try {
      // Obtenir accès microphone (si pas déjà fait)
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 // Optimal pour Whisper
        } 
      })
      console.log('🎤 [WHISPER TRACKER] Microphone access obtained')
    } catch (error) {
      console.error('❌ [WHISPER TRACKER] Microphone access failed:', error)
    }
  }

  /**
   * 🎤 Démarrer enregistrement utilisateur
   */
  startUserRecording() {
    if (!this.currentSession || !this.audioStream || this.currentSession.is_recording) return

    try {
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.currentSession.audio_chunks = []
      this.currentSession.is_recording = true

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.currentSession) {
          this.currentSession.audio_chunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.processUserAudio()
      }

      this.mediaRecorder.start()
      console.log('🔴 [WHISPER TRACKER] Recording started')
    } catch (error) {
      console.error('❌ [WHISPER TRACKER] Recording start failed:', error)
    }
  }

  /**
   * 🛑 Arrêter enregistrement utilisateur
   */
  stopUserRecording() {
    if (!this.currentSession || !this.mediaRecorder || !this.currentSession.is_recording) return

    this.currentSession.is_recording = false
    this.mediaRecorder.stop()
    console.log('⏹️ [WHISPER TRACKER] Recording stopped')
  }

  /**
   * 🎵 Traiter audio utilisateur avec Whisper
   */
  private async processUserAudio() {
    if (!this.currentSession || this.currentSession.audio_chunks.length === 0) return

    try {
      // Créer blob audio
      const audioBlob = new Blob(this.currentSession.audio_chunks, { 
        type: 'audio/webm;codecs=opus' 
      })

      // Vérifier taille minimale (éviter silence)
      if (audioBlob.size < 1024) {
        console.log('⚠️ [WHISPER TRACKER] Audio too small, skipping')
        return
      }

      console.log('📤 [WHISPER TRACKER] Sending audio to Whisper API...', {
        size: audioBlob.size,
        duration: 'unknown'
      })

      // Envoyer à Whisper API
      const formData = new FormData()
      formData.append('audio', audioBlob, 'user-speech.webm')
      formData.append('session_id', this.currentSession.session_id)
      formData.append('member_id', this.currentSession.member_id)
      formData.append('gym_id', this.currentSession.gym_id)

      const response = await fetch('/api/whisper/transcribe-user', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [WHISPER TRACKER] User speech transcribed:', result.transcript?.substring(0, 50) + '...')
      } else {
        console.error('❌ [WHISPER TRACKER] Whisper API failed:', response.status)
      }

    } catch (error) {
      console.error('❌ [WHISPER TRACKER] Audio processing failed:', error)
    }
  }

  /**
   * 🤖 Tracker réponse IA (depuis OpenAI Realtime)
   */
  async trackAIResponse(transcript: string, metadata?: { latency_ms?: number, audio_quality?: string }) {
    if (!this.currentSession) return

    this.currentSession.turn_counter++

    try {
      const response = await fetch('/api/debug/log-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.currentSession.session_id,
          member_id: this.currentSession.member_id,
          gym_id: this.currentSession.gym_id,
          speaker: 'ai',
          transcript,
          conversation_turn_number: this.currentSession.turn_counter,
          metadata
        })
      })

      if (response.ok) {
        console.log(`🤖 [WHISPER TRACKER] AI response logged (turn ${this.currentSession.turn_counter}):`, transcript.substring(0, 50) + '...')
      }
    } catch (error) {
      console.error('❌ [WHISPER TRACKER] AI response logging failed:', error)
    }
  }

  /**
   * 🏁 Finaliser session
   */
  endSession(reason: string = 'user_goodbye') {
    if (!this.currentSession) return

    console.log(`🏁 [WHISPER TRACKER] Session ended: ${this.currentSession.session_id} (Reason: ${reason})`)

    // Arrêter enregistrement si actif
    if (this.currentSession.is_recording) {
      this.stopUserRecording()
    }

    // Nettoyer ressources
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }

    this.currentSession = null
    this.mediaRecorder = null
  }
}

export const whisperParallelTracker = new WhisperParallelTracker()
