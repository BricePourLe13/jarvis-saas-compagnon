"use client"

import { useState, useCallback, useRef, useEffect } from 'react'

interface VoiceVitrineConfig {
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error') => void
  onTranscriptUpdate?: (transcript: string) => void
  maxDuration?: number // en secondes
}

export function useVoiceVitrineChat({
  onStatusChange,
  onTranscriptUpdate,
  maxDuration = 120
}: VoiceVitrineConfig) {
  // États
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  
  // Refs pour WebRTC
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const sessionStartTimeRef = useRef<number | null>(null)
  const maxDurationRef = useRef(maxDuration)

  // Mettre à jour maxDuration
  useEffect(() => {
    maxDurationRef.current = maxDuration
  }, [maxDuration])

  const updateStatus = useCallback((status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error') => {
    onStatusChange?.(status)
  }, [onStatusChange])

  const updateTranscript = useCallback((transcript: string) => {
    setCurrentTranscript(transcript)
    onTranscriptUpdate?.(transcript)
  }, [onTranscriptUpdate])

  // Créer une session éphémère pour la démo
  const createDemoSession = useCallback(async () => {
    const sessionConfig = {
      session: {
        type: "realtime",
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
        audio: {
          input: {
            format: {
              type: "audio/pcm",
              rate: 24000,
            },
            turn_detection: {
              type: "semantic_vad"
            }
          },
          output: {
            format: {
              type: "audio/pcm",
            },
            voice: "nova",
          }
        },
        instructions: `Tu es JARVIS, l'assistant IA de notre plateforme fitness révolutionnaire.

CONTEXTE DÉMO VITRINE:
- C'est une démonstration de 2 minutes pour les visiteurs du site
- Tu représentes notre solution complète pour les salles de sport
- Sois enthousiaste mais concis

PERSONNALITÉ:
- Accueillant et énergique
- Expert en fitness et technologie IA
- Passionné par l'innovation dans le sport

RÉPONSES:
- Garde tes réponses courtes (15-30 secondes max)
- Mets en avant les bénéfices concrets de notre solution
- Invite à découvrir nos offres personnalisées
- Utilise des exemples concrets et inspirants

SUJETS À ABORDER SI PERTINENT:
- Analyse personnalisée des performances
- Recommandations d'entraînement intelligentes  
- Motivation adaptative basée sur l'IA
- Suivi de progression en temps réel
- Interface vocale dans les salles de sport

IMPORTANT: Cette démo se termine automatiquement après 2 minutes.`,
        output_modalities: ["audio", "text"]
      }
    }

    const response = await fetch('/api/voice/vitrine/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig),
    })

    if (!response.ok) {
      throw new Error(`Erreur session: ${response.status}`)
    }

    return await response.json()
  }, [])

  // Initialiser WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Vérifier support WebRTC
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC non supporté par ce navigateur')
      }

      // Créer session démo
      const session = await createDemoSession()
      
      // Configurer peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      peerConnectionRef.current = pc

      // Configurer audio output
      const audioElement = document.createElement('audio')
      audioElement.autoplay = true
      audioElement.playsInline = true
      audioElementRef.current = audioElement
      
      pc.ontrack = (event) => {
        if (audioElement) {
          audioElement.srcObject = event.streams[0]
        }
      }

      // Demander accès microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        
        // Ajouter track audio
        const audioTrack = stream.getAudioTracks()[0]
        pc.addTrack(audioTrack, stream)
      } catch (micError) {
        throw new Error('MICROPHONE_PERMISSION_DENIED')
      }

      // Configurer data channel
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc

      dc.onopen = () => {
        console.log('✅ Data channel ouvert')
        setIsConnected(true)
        updateStatus('connected')
        sessionStartTimeRef.current = Date.now()
        
        // Configuration de session
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            type: "realtime",
            instructions: session.session.instructions,
            output_modalities: ["audio", "text"]
          }
        }))
      }

      dc.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 Message reçu:', message.type)
          
          switch (message.type) {
            case 'input_audio_buffer.speech_started':
              updateStatus('listening')
              break
              
            case 'input_audio_buffer.speech_stopped':
              updateStatus('connected')
              break
              
            case 'response.created':
              updateStatus('speaking')
              setIsAISpeaking(true)
              break
              
            case 'response.done':
              updateStatus('connected')
              setIsAISpeaking(false)
              break
              
            case 'conversation.item.input_audio_transcription.completed':
              if (message.transcript) {
                updateTranscript(message.transcript)
              }
              break
              
            case 'error':
              console.error('❌ Erreur OpenAI:', message)
              setError(message.error?.message || 'Erreur de conversation')
              updateStatus('error')
              break
          }
        } catch (parseError) {
          console.error('❌ Erreur parsing message:', parseError)
        }
      }

      dc.onclose = () => {
        console.log('📡 Data channel fermé')
        setIsConnected(false)
        updateStatus('idle')
      }

      dc.onerror = (error) => {
        console.error('❌ Erreur data channel:', error)
        setError('Erreur de communication')
        updateStatus('error')
      }

      // Créer et envoyer offre
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Envoyer à OpenAI (format kiosk)
      const realtimeResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${session.client_secret.value}`,
          'Content-Type': 'application/sdp'
        },
      })

      if (!realtimeResponse.ok) {
        throw new Error(`WebRTC setup failed: ${realtimeResponse.status}`)
      }

      const answerSdp = await realtimeResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      console.log('✅ WebRTC initialisé avec succès')
      
    } catch (error: any) {
      console.error('❌ Erreur WebRTC:', error)
      
      let errorMessage = 'Erreur de connexion'
      
      switch (error.message) {
        case 'MICROPHONE_PERMISSION_DENIED':
          errorMessage = 'Veuillez autoriser l\'accès au microphone'
          break
        case 'WebRTC non supporté par ce navigateur':
          errorMessage = 'Navigateur incompatible. Utilisez Chrome, Firefox ou Safari récent'
          break
        default:
          if (error.name === 'NotAllowedError') {
            errorMessage = 'Accès microphone refusé'
          }
          break
      }
      
      setError(errorMessage)
      updateStatus('error')
      throw error
    }
  }, [createDemoSession, updateStatus, updateTranscript])

  // Connexion
  const connect = useCallback(async () => {
    if (isConnected) return
    
    setError(null)
    updateStatus('connecting')
    
    try {
      await initializeWebRTC()
    } catch (error) {
      console.error('Erreur de connexion:', error)
      // Réinitialiser l'état en cas d'erreur pour éviter la boucle
      updateStatus('error')
      setIsConnected(false)
      throw error
    }
  }, [isConnected, initializeWebRTC, updateStatus])

  // Déconnexion
  const disconnect = useCallback(async () => {
    try {
      // Fermer data channel
      if (dataChannelRef.current) {
        dataChannelRef.current.close()
        dataChannelRef.current = null
      }

      // Fermer peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      // Arrêter audio
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null
        audioElementRef.current = null
      }

      setIsConnected(false)
      setCurrentTranscript('')
      setIsAISpeaking(false)
      sessionStartTimeRef.current = null
      updateStatus('idle')
      
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    }
  }, [updateStatus])

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Vérification timeout de session
  useEffect(() => {
    if (!isConnected || !sessionStartTimeRef.current) return

    const checkTimeout = () => {
      if (sessionStartTimeRef.current) {
        const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000
        if (elapsed >= maxDurationRef.current) {
          disconnect()
        }
      }
    }

    const interval = setInterval(checkTimeout, 1000)
    return () => clearInterval(interval)
  }, [isConnected, disconnect])

  return {
    // États
    isConnected,
    error,
    currentTranscript,
    isAISpeaking,
    
    // Actions
    connect,
    disconnect
  }
}
