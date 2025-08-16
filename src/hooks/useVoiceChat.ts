/**
 * 🎤 HOOK VOICE CHAT AVEC LOGGING AUTOMATIQUE
 * Gère la connexion OpenAI Realtime + logging des conversations temps réel
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioState } from '@/types/kiosk'
import { simpleLogger } from '@/lib/jarvis-simple-logger'

interface VoiceChatConfig {
  gymSlug: string
  memberId?: string
  language?: 'fr' | 'en' | 'es'
  memberData?: {
    first_name: string
    last_name: string
    badge_id?: string
    fitness_goals?: string[]
    favorite_activities?: string[]
    fitness_level?: string
    communication_style?: string
    last_visit?: string
    total_visits?: number
    medical_conditions?: string[]
  }
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'reconnecting') => void
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

interface VoiceChatSession {
  client_secret: { value: string }
  session_id: string
  openai_session_id: string
  expires_at: string
  gym_id: string
  member_id?: string
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

  // Refs pour la session
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<VoiceChatSession | null>(null)
  const isConnectingRef = useRef(false)
  
  // Refs pour le logging
  const conversationTurnRef = useRef(0)
  const lastUserTranscriptRef = useRef('')
  const lastJarvisResponseRef = useRef('')

  // Mettre à jour le status avec callback
  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus)
    config.onStatusChange?.(newStatus)
  }, [config])

  /**
   * 📝 Logger une interaction utilisateur ou JARVIS
   */
  const logInteraction = useCallback(async (speaker: 'user' | 'jarvis', message: string) => {
    // 🚨 FORCE LOGGING TEST
    console.log('🔥 [LOG INTERACTION] APPELÉ !', { speaker, message, sessionExists: !!sessionRef.current })
    
    if (!sessionRef.current || !message.trim()) {
      console.log('❌ [LOG INTERACTION] ABANDONNÉ - Session ou message manquant:', {
        hasSession: !!sessionRef.current,
        messageLength: message?.length || 0,
        sessionId: sessionRef.current?.session_id || 'AUCUN'
      })
      return
    }

    // 🎯 CONSOLE DEBUG DÉTAILLÉ
    console.log('')
    console.log('🎤 [VOICE CHAT] ================================')
    console.log('🎯 CAPTURE:', speaker === 'user' ? '👤 UTILISATEUR' : '🤖 JARVIS')
    console.log('💬 TEXTE COMPLET:', `"${message}"`)
    console.log('📊 LONGUEUR:', message.length, 'caractères')
    console.log('🔗 SESSION ID:', sessionRef.current.session_id)
    console.log('===============================================')

    const success = await simpleLogger.logMessage({
      session_id: sessionRef.current.session_id,
      member_id: config.memberId,
      gym_id: sessionRef.current.gym_id,
      speaker,
      message_text: message.trim(),
      turn_number: ++conversationTurnRef.current,
      timestamp: new Date()
    })

    if (success) {
      console.log('✅ [VOICE CHAT] Interaction envoyée au logger avec succès')
    } else {
      console.error('❌ [VOICE CHAT] Échec envoi au logger')
    }
  }, [config.memberId])

  /**
   * 🎤 Créer une session OpenAI
   */
  const createSession = useCallback(async (): Promise<VoiceChatSession> => {
    console.log('🎤 [CREATE SESSION] Début création session')

    const response = await fetch('/api/voice/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymSlug: config.gymSlug,
        memberId: config.memberId,
        memberData: config.memberData
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Session creation failed: ${error}`)
    }

    const session = await response.json()
    console.log('✅ [CREATE SESSION] Session créée:', session.session_id)
    
    return session
  }, [config])

  /**
   * 🌐 Initialiser la connexion WebRTC
   */
  const initializeWebRTC = useCallback(async (session: VoiceChatSession) => {
    console.log('🌐 [WebRTC] Initialisation connexion')

    // 1. Créer PeerConnection
    const pc = new RTCPeerConnection()
    peerConnectionRef.current = pc

    // 2. Gestion de l'audio entrant (JARVIS)
    const audioElement = new Audio()
    audioElement.autoplay = true
    audioElementRef.current = audioElement

    pc.ontrack = (event) => {
      console.log('🔊 [WebRTC] Stream audio reçu de JARVIS')
      audioElement.srcObject = event.streams[0]
      setAudioState(prev => ({ ...prev, isPlaying: true }))
    }

    // 3. Ajouter microphone utilisateur
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        }
      })

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
        console.log('🎤 [WebRTC] Microphone ajouté')
      })

      setAudioState(prev => ({ 
        ...prev, 
        isRecording: true,
        micPermission: 'granted'
      }))

    } catch (error) {
      console.error('❌ [WebRTC] Erreur microphone:', error)
      setAudioState(prev => ({ ...prev, micPermission: 'denied' }))
      throw error
    }

    // 4. Créer data channel pour événements
    const dataChannel = pc.createDataChannel('oai-events')
    dataChannelRef.current = dataChannel

    dataChannel.addEventListener('open', () => {
      console.log('📡 [WebRTC] Data channel ouvert')
      setIsConnected(true)
      updateStatus('connected')
      setConnectionQuality('excellent')
    })

    dataChannel.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data)
        handleOpenAIEvent(message)
      } catch (error) {
        console.error('❌ [WebRTC] Erreur parsing message:', error)
      }
    })

    dataChannel.addEventListener('close', () => {
      console.log('📡 [WebRTC] Data channel fermé')
      setIsConnected(false)
      updateStatus('idle')
    })

    dataChannel.addEventListener('error', (error) => {
      console.error('❌ [WebRTC] Erreur data channel:', error)
      updateStatus('error')
    })

    // 5. Négociation WebRTC
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const sdpResponse = await fetch(`https://api.openai.com/v1/realtime/sessions/${session.openai_session_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.client_secret.value}`,
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp
    })

    if (!sdpResponse.ok) {
      throw new Error('Échec négociation WebRTC')
    }

    const answerSdp = await sdpResponse.text()
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    })

    console.log('✅ [WebRTC] Connexion établie')
  }, [updateStatus])

  /**
   * 🧠 Gérer les événements OpenAI
   */
  const handleOpenAIEvent = useCallback((event: any) => {
    console.log('📨 [OpenAI Event]:', event.type)

    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // ✅ TRANSCRIPTION UTILISATEUR REÇUE
        const userTranscript = event.transcript?.trim()
        if (userTranscript && userTranscript !== lastUserTranscriptRef.current) {
          console.log('👤 [USER TRANSCRIPT]:', userTranscript)
          lastUserTranscriptRef.current = userTranscript
          
          // Logger l'interaction utilisateur
          logInteraction('user', userTranscript)
          
          // Notifier l'interface
          setCurrentTranscript(userTranscript)
          config.onTranscriptUpdate?.(userTranscript, true)
        }
        break

      case 'response.audio_transcript.done':
        // ✅ RÉPONSE JARVIS TRANSCRITE
        const jarvisResponse = event.transcript?.trim()
        if (jarvisResponse && jarvisResponse !== lastJarvisResponseRef.current) {
          console.log('🤖 [JARVIS RESPONSE]:', jarvisResponse)
          lastJarvisResponseRef.current = jarvisResponse
          
          // Logger la réponse JARVIS
          logInteraction('jarvis', jarvisResponse)
        }
        break

      case 'conversation.item.input_audio_transcription.delta':
        // Transcription partielle en cours
        if (event.delta) {
          const partialTranscript = lastUserTranscriptRef.current + event.delta
          setCurrentTranscript(partialTranscript)
          config.onTranscriptUpdate?.(partialTranscript, false)
        }
        break

      case 'conversation.item.created':
        if (event.item?.type === 'message' && event.item?.role === 'user') {
          updateStatus('listening')
        }
        break

      case 'response.created':
        updateStatus('speaking')
        break

      case 'response.done':
        updateStatus('connected')
        setAudioState(prev => ({ ...prev, isPlaying: false }))
        break

      case 'error':
        console.error('❌ [OpenAI Error]:', event.error)
        config.onError?.(event.error?.message || 'Erreur OpenAI')
        updateStatus('error')
        break

      default:
        // 🔍 DEBUG : Montrer TOUS les événements transcription
        if (event.type.includes('transcript') || event.type.includes('audio')) {
          console.log('🎯 [TRANSCRIPT EVENT]:', event.type, event)
        }
        console.log('📨 [OpenAI] Événement non géré:', event.type)
    }
  }, [config, updateStatus, logInteraction])

  /**
   * 🚀 Connecter au service vocal
   */
  const connect = useCallback(async () => {
    if (isConnectingRef.current || isConnected) {
      console.log('⚠️ Connexion déjà en cours ou établie')
      return
    }

    isConnectingRef.current = true
    updateStatus('connecting')
    conversationTurnRef.current = 0

    try {
      const session = await createSession()
      sessionRef.current = session
      
      await initializeWebRTC(session)
      
      console.log('🚀 Connexion voice chat établie avec succès')
      
      // 🧪 TEST IMMEDIAT DU LOGGING
      console.log('🧪 [DEBUG] Test immediat logging...')
      await logInteraction('user', 'Test de connexion - message utilisateur')
      await logInteraction('jarvis', 'Test de connexion - réponse JARVIS')
      
    } catch (error) {
      console.error('❌ Erreur connexion voice chat:', error)
      config.onError?.(error instanceof Error ? error.message : 'Erreur de connexion')
      updateStatus('error')
    } finally {
      isConnectingRef.current = false
    }
  }, [isConnected, createSession, initializeWebRTC, updateStatus, config])

  /**
   * 🔌 Déconnecter du service vocal
   */
  const disconnect = useCallback(async () => {
    console.log('🔌 Déconnexion voice chat')

    // Fermer la session en DB
    if (sessionRef.current) {
      try {
        await fetch('/api/voice/session/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionRef.current.session_id,
            reason: 'user_disconnect'
          })
        })
        
        // Nettoyer le cache du logger
        simpleLogger.clearSession(sessionRef.current.session_id)
      } catch (error) {
        console.error('❌ Erreur fermeture session:', error)
      }
    }

    // Nettoyer WebRTC
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }

    // Réinitialiser les états
    setIsConnected(false)
    setCurrentTranscript('')
    setAudioState({
      isRecording: false,
      isPlaying: false,
      micPermission: 'prompt',
      audioLevel: 0
    })
    updateStatus('idle')
    sessionRef.current = null
    conversationTurnRef.current = 0
    lastUserTranscriptRef.current = ''
    lastJarvisResponseRef.current = ''

    console.log('✅ Déconnexion voice chat terminée')
  }, [updateStatus])

  /**
   * 💬 Envoyer un message texte (si nécessaire)
   */
  const sendTextMessage = useCallback(async (message: string) => {
    if (!dataChannelRef.current || !message.trim()) return

    try {
      const event = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: message.trim() }]
        }
      }

      dataChannelRef.current.send(JSON.stringify(event))
      
      // Logger le message texte
      await logInteraction('user', message.trim())
      
      console.log('💬 Message texte envoyé:', message)
    } catch (error) {
      console.error('❌ Erreur envoi message texte:', error)
    }
  }, [logInteraction])

  /**
   * 🔄 Forcer une reconnexion
   */
  const forceReconnect = useCallback(async () => {
    updateStatus('reconnecting')
    await disconnect()
    setTimeout(() => {
      connect()
    }, 1000)
  }, [disconnect, connect, updateStatus])

  /**
   * 📊 Récupérer l'ID de session actuelle
   */
  const getCurrentSessionId = useCallback(() => {
    return sessionRef.current?.session_id || null
  }, [])

  // Nettoyage à la fermeture du composant
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // États
    audioState,
    isConnected,
    status,
    currentTranscript,
    connectionQuality,
    reconnectAttempts: 0, // Pour compatibilité

    // Actions
    connect,
    disconnect,
    sendTextMessage,
    forceReconnect,
    getCurrentSessionId
  }
}
