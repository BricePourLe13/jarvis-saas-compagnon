/**
 * 🎤 WHISPER PARALLEL INTERACTION TRACKER
 * Solution alternative avec Whisper en parallèle pour capture audio
 */

interface WhisperConfig {
  enabled: boolean
  api_key: string
  model: 'whisper-1'
  language: 'fr'
  response_format: 'json'
}

class WhisperInteractionTracker {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private isRecording = false
  private config: WhisperConfig

  constructor(config: WhisperConfig) {
    this.config = config
  }

  /**
   * 🎤 Démarrer l'enregistrement audio en parallèle
   */
  async startParallelRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.processAudioChunk()
      }

      // Enregistrer par chunks de 5 secondes
      this.mediaRecorder.start(5000)
      this.isRecording = true

      console.log('🎤 [WHISPER TRACKER] Enregistrement parallèle démarré')
    } catch (error) {
      console.error('❌ [WHISPER TRACKER] Erreur démarrage:', error)
    }
  }

  /**
   * 🔄 Traiter un chunk audio avec Whisper
   */
  private async processAudioChunk() {
    if (this.audioChunks.length === 0) return

    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
      
      // Convertir en format acceptable par Whisper
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      formData.append('model', this.config.model)
      formData.append('language', this.config.language)
      formData.append('response_format', this.config.response_format)

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`
        },
        body: formData
      })

      const result = await response.json()
      
      if (result.text && result.text.trim()) {
        // Envoyer la transcription au tracker principal
        this.onTranscriptionReceived(result.text.trim(), {
          confidence: result.confidence || 0.9,
          duration_ms: audioBlob.size,
          source: 'whisper'
        })
      }

    } catch (error) {
      console.error('❌ [WHISPER TRACKER] Erreur traitement audio:', error)
    }

    // Reset pour le prochain chunk
    this.audioChunks = []
    
    // Continuer l'enregistrement si actif
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.start(5000)
    }
  }

  /**
   * 📝 Callback quand une transcription est reçue
   */
  private onTranscriptionReceived(transcript: string, metadata: any) {
    console.log('🎤 [WHISPER TRACKER] Transcription reçue:', transcript)
    
    // Intégration avec le tracker principal
    // realtimeTracker.trackUserSpeech(transcript, metadata)
  }

  /**
   * 🛑 Arrêter l'enregistrement
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      
      // Arrêter les tracks
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
      
      console.log('🛑 [WHISPER TRACKER] Enregistrement arrêté')
    }
  }
}

export { WhisperInteractionTracker, type WhisperConfig }
