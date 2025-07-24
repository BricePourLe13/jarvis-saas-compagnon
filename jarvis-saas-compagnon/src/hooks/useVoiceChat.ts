import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioState } from '@/types/kiosk'

interface VoiceChatConfig {
  gymSlug: string
  memberId?: string
  language?: 'fr' | 'en' | 'es'
  // 🔧 BUGFIX: Ajouter memberData pour contourner le getMemberData hardcodé
  memberData?: {
    first_name: string
    last_name: string
    member_preferences?: {
      goals: string[]
      favorite_activities: string[]
    }
    last_visit?: string
    membership_type?: string
    total_visits?: number
  }
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'reconnecting') => void
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

interface VoiceChatSession {
  client_secret: { value: string }
  session_id: string
  expires_at: string
}

// Configuration de reconnexion
const RECONNECT_CONFIG = {
  maxAttempts: 5,
  baseDelay: 1000, // 1 seconde
  maxDelay: 30000, // 30 secondes
  backoffMultiplier: 2
}

export function useVoiceChat(config: VoiceChatConfig) {
  
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    isPlaying: false,
    micPermission: 'prompt',
    audioLevel: 0
  })
  
  const [isConnected, setIsConnected] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'reconnecting'>('idle')
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown')
  
  // Refs pour éviter les re-créations
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<VoiceChatSession | null>(null)
  const isConnectingRef = useRef(false)
  const configRef = useRef(config)
  
  // Refs pour la reconnexion
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Buffer pour les transcripts partiels
  const transcriptBufferRef = useRef('')
  
  // Mettre à jour la config de référence
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Fonction utilitaire pour changer le status
  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus)
    configRef.current.onStatusChange?.(newStatus)
  }, [])

  // 🔧 BUGFIX: Utiliser les données membre passées directement au lieu du hardcodé
  const getMemberData = useCallback(async () => {
    // Si on a les données membre directement, les utiliser
    if (config.memberData) {
      console.log(`📋 Utilisation des données membre pour: ${config.memberData.first_name} ${config.memberData.last_name}`)
      return config.memberData
    }
    
    // Sinon, fallback sur memberId (pour compatibilité future avec Supabase)
    if (!config.memberId) return null
    
    try {
      // TODO: Intégrer avec Supabase pour récupérer les vraies données depuis la BDD
      console.warn('⚠️ Fallback vers données hardcodées - intégration Supabase requise')
      return {
        first_name: 'Pierre',
        last_name: 'Martin',
        member_preferences: {
          goals: ['Perte de poids', 'Renforcement musculaire'],
          favorite_activities: ['Entraînement du matin'],
        },
        last_visit: '2024-01-20'
      }
    } catch (error) {
      console.warn('Impossible de récupérer les données membre:', error)
      return null
    }
  }, [config.memberId, config.memberData])

  // Créer une session OpenAI Realtime avec token ephémère
  const createSession = useCallback(async () => {
    try {
      const memberData = await getMemberData()
      
      const response = await fetch('/api/voice/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: config.memberId,
          gymSlug: config.gymSlug,
          memberData,
          voice: 'verse' // Voix recommandée pour français
        }),
      })

      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.status}`)
      }

      const data = await response.json()
      return data.session
    } catch (error) {
      console.error('Erreur création session:', error)
      throw error
    }
  }, [config.memberId, config.gymSlug, getMemberData])

  // Initialiser la connexion WebRTC
  const initializeWebRTC = useCallback(async (session: VoiceChatSession) => {
    try {
      // Créer la peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      peerConnectionRef.current = pc

      // Demander permission micro et ajouter le track audio
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      // Ajouter le track audio local
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      setAudioState(prev => ({ ...prev, micPermission: 'granted' }))

      // Créer l'élément audio pour le playback
      if (!audioElementRef.current) {
        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioElementRef.current = audioEl
      }

      // Gérer les tracks audio distants (réponses IA)
      pc.ontrack = (event) => {
        console.log('🎵 Track audio reçu depuis OpenAI')
        if (audioElementRef.current && event.streams[0]) {
          audioElementRef.current.srcObject = event.streams[0]
          setAudioState(prev => ({ ...prev, isPlaying: true }))
        }
      }

      // Créer le data channel pour les événements
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc

      // Gérer les messages du data channel
      dc.onopen = () => {
        console.log('📡 Data channel ouvert')
        setIsConnected(true)
        updateStatus('connected')
        reconnectAttempts.current = 0
      }

      dc.onmessage = (event) => {
        try {
          const serverEvent = JSON.parse(event.data)
          handleServerEvent(serverEvent)
        } catch (error) {
          console.error('Erreur parsing événement serveur:', error)
        }
      }

      dc.onerror = (error) => {
        console.error('Erreur data channel:', error)
        configRef.current.onError?.('Erreur de communication')
      }

      dc.onclose = () => {
        console.log('📡 Data channel fermé')
        setIsConnected(false)
        if (status !== 'idle') {
          updateStatus('error')
        }
      }

      // Créer l'offre WebRTC
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Envoyer l'offre à OpenAI Realtime API
      const ephemeralKey = session.client_secret.value
      const realtimeResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
      })

      if (!realtimeResponse.ok) {
        throw new Error(`WebRTC handshake failed: ${realtimeResponse.status}`)
      }

      // Recevoir et appliquer la réponse
      const answerSdp = await realtimeResponse.text()
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: answerSdp,
      }
      await pc.setRemoteDescription(answer)

      sessionRef.current = session
      console.log('✅ Connexion WebRTC établie avec OpenAI Realtime')

    } catch (error) {
      console.error('Erreur initialisation WebRTC:', error)
      throw error
    }
  }, [status, updateStatus])

  // Gérer les événements du serveur OpenAI
  const handleServerEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'session.created':
        console.log('🎯 Session OpenAI créée')
        break
        
      case 'session.updated':
        console.log('🔄 Session OpenAI mise à jour')
        break

      case 'input_audio_buffer.speech_started':
        console.log('🎤 Début de parole détecté')
        updateStatus('listening')
        setAudioState(prev => ({ ...prev, isRecording: true }))
        break

      case 'input_audio_buffer.speech_stopped':
        console.log('🤐 Fin de parole détectée')
        setAudioState(prev => ({ ...prev, isRecording: false }))
        break

      case 'response.created':
        console.log('💭 Réponse IA en cours de génération')
        updateStatus('speaking')
        break

      case 'response.audio_transcript.delta':
        if (event.delta) {
          transcriptBufferRef.current += event.delta
          configRef.current.onTranscriptUpdate?.(transcriptBufferRef.current, false)
          setCurrentTranscript(transcriptBufferRef.current)
        }
        break

      case 'response.audio_transcript.done':
        console.log('📝 Transcript final:', event.transcript)
        configRef.current.onTranscriptUpdate?.(event.transcript || transcriptBufferRef.current, true)
        setCurrentTranscript(event.transcript || transcriptBufferRef.current)
        transcriptBufferRef.current = ''
        break

      case 'response.audio.done':
        console.log('🔊 Audio de réponse terminé')
        setAudioState(prev => ({ ...prev, isPlaying: false }))
        break

      case 'response.done':
        console.log('✅ Réponse complète')
        updateStatus('connected')
        break

      case 'error':
        console.error('❌ Erreur serveur OpenAI:', event)
        configRef.current.onError?.(event.error?.message || 'Erreur serveur')
        updateStatus('error')
        break

      case 'rate_limits.updated':
        console.log('⚡ Limites de taux mises à jour:', event.rate_limits)
        break

      default:
        console.log('📨 Événement serveur non géré:', event.type)
    }
  }, [updateStatus])

  // Fonction principale de connexion
  const connect = useCallback(async () => {
    if (isConnectingRef.current || isConnected) {
      console.log('⚠️ Connexion déjà en cours ou établie')
      return
    }

    isConnectingRef.current = true
    updateStatus('connecting')

    try {
      // 1. Créer la session OpenAI avec token ephémère
      const session = await createSession()
      
      // 2. Initialiser WebRTC avec la session
      await initializeWebRTC(session)
      
      console.log('🚀 Connexion voice chat établie avec succès')
      
    } catch (error) {
      console.error('Erreur connexion voice chat:', error)
      configRef.current.onError?.(error instanceof Error ? error.message : 'Erreur de connexion')
      updateStatus('error')
      
      // Tentative de reconnexion automatique
      if (reconnectAttempts.current < RECONNECT_CONFIG.maxAttempts) {
        scheduleReconnect()
      }
    } finally {
      isConnectingRef.current = false
    }
  }, [isConnected, createSession, initializeWebRTC, updateStatus])

  // Programmer une reconnexion avec backoff exponentiel
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return

    reconnectAttempts.current++
    const delay = Math.min(
      RECONNECT_CONFIG.baseDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, reconnectAttempts.current - 1),
      RECONNECT_CONFIG.maxDelay
    )

    console.log(`🔄 Reconnexion programmée dans ${delay}ms (tentative ${reconnectAttempts.current}/${RECONNECT_CONFIG.maxAttempts})`)
    updateStatus('reconnecting')

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null
      connect()
    }, delay)
  }, [connect, updateStatus])

  // Forcer une reconnexion
  const forceReconnect = useCallback(() => {
    console.log('🔄 Reconnexion forcée demandée')
    disconnect()
    reconnectAttempts.current = 0
    setTimeout(() => connect(), 1000)
  }, [connect])

  // Déconnexion propre
  const disconnect = useCallback(() => {
    console.log('🔌 Déconnexion voice chat')
    
    // Nettoyer les timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Fermer la peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Fermer le data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    // Arrêter l'audio
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null
    }

    // Reset states
    setIsConnected(false)
    setCurrentTranscript('')
    setAudioState({
      isRecording: false,
      isPlaying: false,
      micPermission: 'prompt',
      audioLevel: 0
    })
    
    sessionRef.current = null
    isConnectingRef.current = false
    reconnectAttempts.current = 0
    transcriptBufferRef.current = ''
    
    updateStatus('idle')
  }, [updateStatus])

  // Envoyer un message texte (optionnel)
  const sendTextMessage = useCallback((text: string) => {
    if (!dataChannelRef.current || !isConnected) {
      console.warn('⚠️ Pas de connexion pour envoyer le message')
      return
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          }
        ]
      }
    }

    dataChannelRef.current.send(JSON.stringify(event))
    
    // Déclencher une réponse
    const responseEvent = {
      type: 'response.create'
    }
    dataChannelRef.current.send(JSON.stringify(responseEvent))
  }, [isConnected])

  // Nettoyage à la déconnexion du composant
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    audioState,
    isConnected,
    status,
    currentTranscript,
    connectionQuality,
    reconnectAttempts: reconnectAttempts.current,
    connect,
    disconnect,
    sendTextMessage,
    forceReconnect
  }
} 