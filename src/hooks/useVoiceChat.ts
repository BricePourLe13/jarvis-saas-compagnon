import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioState } from '@/types/kiosk'
import { kioskLogger } from '@/lib/kiosk-logger'
import { realtimeClientInjector } from '@/lib/realtime-client-injector'

interface VoiceChatConfig {
  gymSlug: string
  memberId?: string
  language?: 'fr' | 'en' | 'es'
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
  onSessionCreated?: (sessionId: string, memberId?: string, gymId?: string) => void
}

interface VoiceChatSession {
  client_secret: { value: string }
  session_id: string
  expires_at: string
}

const INACTIVITY_TIMEOUT_MS = 45000 // 45 secondes

export function useVoiceChat(config: VoiceChatConfig) {
  // États principaux
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'reconnecting'>('idle')
  const [isConnected, setIsConnected] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>({
    isListening: false,
    isPlaying: false,
    volume: 0,
    transcript: '',
    isFinal: false
  })

  // Refs pour la gestion des ressources
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  
  // 💬 Refs pour logging des conversations
  const currentMemberRef = useRef<{ id: string; gym_id: string } | null>(null)
  const responseStartTimeRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<VoiceChatSession | null>(null)
  const isConnectingRef = useRef(false)
  
  // Refs pour les timeouts
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction utilitaire pour mettre à jour le statut
  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus)
    config.onStatusChange?.(newStatus)
  }, [config])

  // 💬 Initialiser les données membre pour le logging
  useEffect(() => {
    if (config.memberData?.badge_id && config.gymSlug) {
      // Récupérer member_id et gym_id depuis le cache ou l'API
      const fetchMemberData = async () => {
        try {
          const response = await fetch(`/api/kiosk/${config.gymSlug}/members/${config.memberData?.badge_id}`)
          const result = await response.json()
          
          if (result.found && result.member) {
            currentMemberRef.current = {
              id: result.member.id,
              gym_id: result.member.gym_id
            }
            console.log(`💬 [CONV] Membre configuré pour logging: ${result.member.first_name}`)
          }
        } catch (error) {
          console.error('❌ [CONV] Erreur récupération données membre:', error)
        }
      }
      
      fetchMemberData()
    }
  }, [config.memberData?.badge_id, config.gymSlug])

  // 📡 CRÉER SESSION OPENAI AVEC PROFIL RÉEL
  const createSession = useCallback(async (): Promise<VoiceChatSession> => {
    try {
      kioskLogger.session('📡 Création session OpenAI...', 'info')
      
      // Utiliser badge_id au lieu de memberId pour la nouvelle API
      const badge_id = config.memberData?.badge_id || config.memberId
      
      if (!badge_id) {
        throw new Error('Badge ID requis pour créer une session')
      }
      
      const response = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymSlug: config.gymSlug,
          badge_id: badge_id,
          language: config.language || 'fr'
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Session creation failed: ${response.status} - ${errorData}`)
      }

      const responseData = await response.json()
      // L'API retourne { success: true, session: {...} }
      const session = responseData.session || responseData
      sessionRef.current = session
      
      kioskLogger.session(`✅ Session créée: ${session.session_id}`, 'success')
      config.onSessionCreated?.(session.session_id, config.memberId, config.gymSlug)
      
      return session
    } catch (error: any) {
      kioskLogger.session(`❌ Erreur création session: ${error.message}`, 'error')
      throw error
    }
  }, [config])

  // 🌐 INITIALISER WEBRTC - VERSION AMÉLIORÉE AVEC DIAGNOSTIC
  const initializeWebRTC = useCallback(async (session: VoiceChatSession) => {
    try {
      kioskLogger.session('🌐 Initialisation WebRTC...', 'info')

      // 1. Vérifier support WebRTC
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC non supporté par ce navigateur')
      }

      // 2. Vérifier permissions avant getUserMedia
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          if (permission.state === 'denied') {
            throw new Error('MICROPHONE_PERMISSION_DENIED')
          }
          kioskLogger.session(`🔐 Permissions microphone: ${permission.state}`, 'info')
        } catch (permError) {
          kioskLogger.session('⚠️ Impossible de vérifier les permissions', 'warning')
        }
      }

      // 3. Créer PeerConnection avec configuration robuste
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' } // Fallback
        ]
      })
      peerConnectionRef.current = pc

      // 4. Demander microphone avec timeout et gestion d'erreurs améliorée
      kioskLogger.session('🎤 Demande de permissions microphone...', 'info')
      
      // Timeout pour getUserMedia
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000  // ← CLEF ! Comme dans ba8f34a
        }
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MICROPHONE_TIMEOUT')), 10000)
      )

      const stream = await Promise.race([streamPromise, timeoutPromise])

      kioskLogger.session('✅ Permissions microphone accordées', 'success')

      // Ajouter le track audio local
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Créer l'élément audio pour le playback
      if (!audioElementRef.current) {
        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioElementRef.current = audioEl
      }

      // Gérer l'audio entrant (réponses de JARVIS)
      pc.ontrack = (event) => {
        kioskLogger.session('🔊 Audio entrant reçu', 'info')
        if (audioElementRef.current && event.streams[0]) {
          audioElementRef.current.srcObject = event.streams[0]
          setAudioState(prev => ({ ...prev, isPlaying: true }))
        }
      }

      // Créer data channel pour les événements
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc

      dc.onopen = () => {
        kioskLogger.session('📡 Data channel ouvert', 'success')
        setIsConnected(true)
        updateStatus('connected')
        resetInactivityTimeout()
      }

      dc.onmessage = (event) => {
        try {
          const serverEvent = JSON.parse(event.data)
          handleServerEvent(serverEvent)
        } catch (error) {
          kioskLogger.session(`Erreur parsing événement: ${error}`, 'error')
        }
      }

      dc.onerror = (error) => {
        kioskLogger.session(`Erreur data channel: ${error}`, 'error')
        config.onError?.('Erreur de communication')
      }

      dc.onclose = () => {
        kioskLogger.session('📡 Data channel fermé', 'info')
        setIsConnected(false)
        updateStatus('idle')
      }

      // Créer et envoyer l'offre WebRTC
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

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
        throw new Error(`WebRTC setup failed: ${realtimeResponse.status}`)
      }

      const answerSdp = await realtimeResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      kioskLogger.session('✅ WebRTC initialisé', 'success')
      
    } catch (error: any) {
      kioskLogger.session(`❌ Erreur WebRTC: ${error.message}`, 'error')
      
      // 🔧 GESTION D'ERREURS AMÉLIORÉE - Messages détaillés et solutions
      let errorMessage = 'Erreur de connexion'
      let errorDetails = ''
      
      switch (error.message) {
        case 'MICROPHONE_PERMISSION_DENIED':
          errorMessage = 'Permissions microphone refusées'
          errorDetails = 'Cliquez sur l\'icône cadenas dans la barre d\'adresse pour autoriser le microphone'
          break
        case 'MICROPHONE_TIMEOUT':
          errorMessage = 'Timeout microphone'
          errorDetails = 'Le microphone met trop de temps à répondre. Vérifiez qu\'il n\'est pas utilisé par une autre application'
          break
        case 'WebRTC non supporté par ce navigateur':
          errorMessage = 'Navigateur incompatible'
          errorDetails = 'Utilisez Chrome, Firefox ou Safari récent'
          break
        default:
          // Erreurs getUserMedia standards
          switch (error.name) {
            case 'NotAllowedError':
              errorMessage = 'Microphone bloqué'
              errorDetails = 'Autorisez l\'accès au microphone et rechargez la page'
              break
            case 'NotFoundError':
              errorMessage = 'Microphone introuvable'
              errorDetails = 'Branchez un microphone et rechargez la page'
              break
            case 'NotReadableError':
              errorMessage = 'Microphone occupé'
              errorDetails = 'Fermez les autres applications utilisant le microphone'
              break
            case 'OverconstrainedError':
              errorMessage = 'Configuration microphone incompatible'
              errorDetails = 'Votre microphone ne supporte pas les paramètres requis'
              break
            case 'SecurityError':
              errorMessage = 'Erreur de sécurité'
              errorDetails = 'Accédez au site via HTTPS ou localhost'
              break
            default:
              if (error.message.includes('Session creation failed')) {
                errorMessage = 'Erreur serveur OpenAI'
                errorDetails = 'Problème de connexion au serveur. Réessayez dans quelques instants'
              } else {
                errorMessage = error.message || 'Erreur inconnue'
                errorDetails = 'Consultez la console pour plus de détails'
              }
          }
      }
      
      // Log détaillé pour le debugging
      kioskLogger.session(`💡 Solution suggérée: ${errorDetails}`, 'info')
      
      config.onError?.(errorMessage)
      throw error
    }
  }, [updateStatus, config])

  // ⏰ GESTION TIMEOUT INACTIVITÉ
  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }

    if (isConnected) {
      inactivityTimeoutRef.current = setTimeout(() => {
        kioskLogger.session('⏰ Timeout inactivité - Fermeture session', 'info')
        disconnect()
        config.onError?.('INACTIVITY_TIMEOUT')
      }, INACTIVITY_TIMEOUT_MS)
    }
  }, [isConnected, config])

  // 📨 GESTION ÉVÉNEMENTS SERVEUR (comme ba8f34a)
  const handleServerEvent = useCallback((event: any) => {
    resetInactivityTimeout()

    switch (event.type) {
      case 'session.created':
        kioskLogger.session('🎯 Session OpenAI active', 'success')
        break

      case 'input_audio_buffer.speech_started':
        kioskLogger.session('🎤 Début de parole détecté', 'info')
        setAudioState(prev => ({ ...prev, isListening: true }))
        updateStatus('listening')
        
        // 🎙️ INJECTER ÉVÉNEMENT REALTIME
        if (currentMemberRef.current && sessionRef.current) {
          realtimeClientInjector.injectUserSpeechStart(
            sessionRef.current.session_id,
            currentMemberRef.current.gym_id,
            currentMemberRef.current.id
          )
        }
        break

      case 'input_audio_buffer.speech_stopped':
        kioskLogger.session('🤐 Fin de parole détectée', 'info')
        setAudioState(prev => ({ ...prev, isListening: false }))
        
        // 🎙️ INJECTER ÉVÉNEMENT REALTIME
        if (currentMemberRef.current && sessionRef.current) {
          realtimeClientInjector.injectUserSpeechEnd(
            sessionRef.current.session_id,
            currentMemberRef.current.gym_id,
            currentMemberRef.current.id
          )
        }
        break

      case 'conversation.item.input_audio_transcription.completed':
        const transcript = event.transcript || ''
        setAudioState(prev => ({ 
          ...prev, 
          transcript,
          isFinal: true 
        }))
        config.onTranscriptUpdate?.(transcript, true)
        
        // 🎙️ INJECTER TRANSCRIPT UTILISATEUR DANS REALTIME
        if (transcript.trim() && currentMemberRef.current && sessionRef.current) {
          realtimeClientInjector.injectUserTranscript(
            sessionRef.current.session_id,
            currentMemberRef.current.gym_id,
            currentMemberRef.current.id,
            transcript,
            event.confidence_score
          )
        }
        
        // Détection "au revoir" (comme ba8f34a)
        if (transcript.toLowerCase().includes('au revoir') || 
            transcript.toLowerCase().includes('aurevoir') ||
            transcript.toLowerCase().includes('bye') ||
            transcript.toLowerCase().includes('goodbye')) {
          kioskLogger.session('👋 Au revoir détecté', 'info')
          setTimeout(() => {
            config.onError?.('GOODBYE_DETECTED')
          }, 1000) // Délai pour laisser JARVIS répondre
        }
        break

      case 'response.audio.delta':
        updateStatus('speaking')
        setAudioState(prev => ({ ...prev, isPlaying: true }))
        break

      case 'response.audio.done':
        updateStatus('connected')
        setAudioState(prev => ({ ...prev, isPlaying: false }))
        break

      case 'error':
        kioskLogger.session(`❌ Erreur OpenAI: ${event.error?.message}`, 'error')
        config.onError?.(event.error?.message || 'Erreur OpenAI')
        break
    }
  }, [resetInactivityTimeout, updateStatus, config])

  // 🔗 CONNEXION COMPLÈTE (comme ba8f34a mais simplifié)
  const connect = useCallback(async () => {
    if (isConnectingRef.current || isConnected) {
      kioskLogger.session('⚠️ Connexion déjà en cours ou active', 'warning')
      return
    }

    isConnectingRef.current = true
    updateStatus('connecting')

    try {
      kioskLogger.session('🚀 Démarrage session complète...', 'info')

      // 1. Créer la session OpenAI
      const session = await createSession()
      
      // 2. Initialiser WebRTC avec micro intégré
      await initializeWebRTC(session)
      
      kioskLogger.session('✅ Session complète active', 'success')
      
    } catch (error: any) {
      kioskLogger.session(`❌ Erreur connexion: ${error.message}`, 'error')
      updateStatus('error')
      config.onError?.(error.message)
    } finally {
      isConnectingRef.current = false
    }
  }, [isConnected, updateStatus, createSession, initializeWebRTC, config])

  // 🔌 DÉCONNEXION COMPLÈTE
  const disconnect = useCallback(async () => {
    try {
      kioskLogger.session('🔌 Déconnexion session...', 'info')

      // Nettoyer les timeouts
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }

      // Fermer WebRTC
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (dataChannelRef.current) {
        dataChannelRef.current.close()
        dataChannelRef.current = null
      }

      // Arrêter l'audio
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null
      }

      // Fermer la session côté serveur
      if (sessionRef.current) {
        try {
          await fetch('/api/voice/session/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionRef.current.session_id })
          })
        } catch (error) {
          kioskLogger.session(`⚠️ Erreur fermeture session serveur: ${error}`, 'warning')
        }
        sessionRef.current = null
      }

      // Réinitialiser les états
      setIsConnected(false)
      setAudioState({
        isListening: false,
        isPlaying: false,
        volume: 0,
        transcript: '',
        isFinal: false
      })
      updateStatus('idle')
      isConnectingRef.current = false

      kioskLogger.session('✅ Déconnexion terminée', 'success')
      
    } catch (error: any) {
      kioskLogger.session(`❌ Erreur déconnexion: ${error.message}`, 'error')
    }
  }, [updateStatus])

  // 🧹 CLEANUP AU DÉMONTAGE
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    // États
    status,
    isConnected,
    audioState,
    
    // Actions
    connect,
    disconnect,
    
    // Utilitaires
    resetInactivityTimeout
  }
}