/**
 * 🎙️ CORE COMMUN - VOICE REALTIME SYSTEM
 * 
 * Hook React réutilisable pour la gestion WebRTC avec OpenAI Realtime API
 * 
 * Ce hook gère uniquement la couche WebRTC commune (kiosk + vitrine)
 * La logique métier (function calling, timeouts, logging) reste dans les hooks spécifiques
 * 
 * @version 1.0.0
 * @date 2025-01-XX
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  VoiceRealtimeCoreConfig,
  VoiceRealtimeCoreReturn,
  VoiceStatus,
  VoiceAudioState,
  FunctionCallEvent,
  AudioConfig
} from './types'
import { getRealtimeURL } from '@/lib/openai-config'

/**
 * Hook core pour la gestion WebRTC avec OpenAI Realtime
 * 
 * @param config Configuration du core
 * @returns Interface pour contrôler la connexion WebRTC
 */
export function useVoiceRealtimeCore(
  config: VoiceRealtimeCoreConfig
): VoiceRealtimeCoreReturn {
  // États
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<VoiceStatus>('idle')
  
  // Refs pour ressources WebRTC
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<{ session_id: string } | null>(null)
  const isConnectingRef = useRef(false)
  const audioStreamRef = useRef<MediaStream | null>(null)

  // Mettre à jour le statut et notifier
  const updateStatus = useCallback((newStatus: VoiceStatus) => {
    setStatus(newStatus)
    config.onStatusChange?.(newStatus)
  }, [config])

  // Mettre à jour l'état audio (pour kiosk)
  const updateAudioState = useCallback((updates: Partial<VoiceAudioState>) => {
    if (config.onAudioStateChange) {
      // On ne maintient pas l'état ici, c'est le hook parent qui le fait
      // On appelle juste le callback avec les updates
      config.onAudioStateChange(updates as VoiceAudioState)
    }
  }, [config])

  /**
   * Vérifier les permissions microphone
   */
  const checkMicrophonePermissions = useCallback(async (): Promise<void> => {
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        })
        if (permission.state === 'denied') {
          throw new Error('MICROPHONE_PERMISSION_DENIED')
        }
      } catch (permError) {
        // Permissions API non supportée ou erreur - continuer quand même
      }
    }
  }, [])

  /**
   * Obtenir le stream microphone avec configuration
   */
  const getMicrophoneStream = useCallback(async (
    audioConfig?: AudioConfig
  ): Promise<MediaStream> => {
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: audioConfig?.echoCancellation ?? true,
      noiseSuppression: audioConfig?.noiseSuppression ?? true,
      autoGainControl: audioConfig?.autoGainControl ?? true,
      sampleRate: audioConfig?.sampleRate ?? 16000,
    }

    // Ajouter options optionnelles si présentes
    if (audioConfig?.channelCount !== undefined) {
      audioConstraints.channelCount = audioConfig.channelCount
    }
    if (audioConfig?.latency !== undefined) {
      audioConstraints.latency = audioConfig.latency
    }
    if (audioConfig?.volume !== undefined) {
      audioConstraints.volume = audioConfig.volume
    }

    // Timeout pour getUserMedia (10 secondes)
    const streamPromise = navigator.mediaDevices.getUserMedia({
      audio: audioConstraints
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MICROPHONE_TIMEOUT')), 10000)
    )

    const stream = await Promise.race([streamPromise, timeoutPromise])
    audioStreamRef.current = stream
    return stream
  }, [])

  /**
   * Initialiser WebRTC avec OpenAI Realtime
   */
  const initializeWebRTC = useCallback(async (
    session: { client_secret: { value: string } | string; session_id: string },
    realtimeContext: 'production' | 'vitrine' = 'production'
  ): Promise<void> => {
    try {
      // 1. Vérifier support WebRTC
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC non supporté par ce navigateur')
      }

      // 2. Vérifier permissions microphone
      await checkMicrophonePermissions()

      // 3. Créer PeerConnection avec STUN servers configurables
      const stunServers = [
        process.env.WEBRTC_STUN_SERVER_1 || 'stun:stun.l.google.com:19302',
        process.env.WEBRTC_STUN_SERVER_2 || 'stun:stun1.l.google.com:19302'
      ].filter(Boolean).map(url => ({ urls: url }))
      
      const pc = new RTCPeerConnection({
        iceServers: stunServers
      })
      peerConnectionRef.current = pc

      // ✅ GESTION ERREURS ICE (connexion WebRTC)
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState
        console.log(`🔌 [WebRTC] ICE Connection State: ${state}`)
        
        switch (state) {
          case 'failed':
            config.onError?.(new Error('Échec connexion réseau. Vérifiez votre connexion internet.'))
            updateStatus('error')
            // Tentative de récupération automatique
            setTimeout(() => {
              if (peerConnectionRef.current?.iceConnectionState === 'failed') {
                console.log('🔄 [WebRTC] Tentative récupération connexion...')
                // Le core hook gérera la reconnexion si nécessaire
              }
            }, 2000)
            break
          case 'disconnected':
            console.log('⚠️ [WebRTC] Connexion interrompue')
            updateStatus('error')
            config.onError?.(new Error('Connexion interrompue'))
            break
          case 'closed':
            setIsConnected(false)
            updateStatus('idle')
            break
          case 'connected':
          case 'completed':
            setIsConnected(true)
            updateStatus('connected')
            break
        }
      }

      // ✅ GESTION ERREURS ICE CANDIDATES
      pc.onicecandidateerror = (event) => {
        console.error('❌ [WebRTC] Erreur ICE candidate:', event)
        // Ne pas bloquer la connexion pour erreurs mineures
        if (event.errorCode === 701 || event.errorCode === 702) {
          // Erreurs STUN/TURN - continuer quand même
          console.warn('⚠️ [WebRTC] Erreur STUN/TURN (non bloquant)')
        } else {
          config.onError?.(new Error(`Erreur réseau: ${event.errorText || 'Erreur inconnue'}`))
        }
      }

      // 4. Obtenir stream microphone
      const stream = await getMicrophoneStream(config.audioConfig)
      
      // Ajouter les tracks audio
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // 5. Créer élément audio pour playback
      if (!audioElementRef.current) {
        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioElementRef.current = audioEl
      }

      // 6. Gérer audio entrant (réponses JARVIS)
      pc.ontrack = (event) => {
        if (audioElementRef.current && event.streams[0]) {
          audioElementRef.current.srcObject = event.streams[0]
          updateAudioState({ isPlaying: true })
        }
      }

      // 7. Créer data channel pour événements OpenAI
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc

      // 8. Gérer événements data channel
      dc.onopen = () => {
        setIsConnected(true)
        updateStatus('connected')
        config.onSessionCreated?.(session.session_id)
      }

      dc.onmessage = (event) => {
        try {
          const serverEvent = JSON.parse(event.data)
          handleServerEvent(serverEvent, dc)
        } catch (error) {
          config.onError?.(new Error(`Erreur parsing événement: ${error}`))
        }
      }

      dc.onerror = (error) => {
        config.onError?.(new Error('Erreur de communication data channel'))
      }

      dc.onclose = () => {
        setIsConnected(false)
        updateStatus('idle')
      }

      // 9. Créer et envoyer offre WebRTC
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 10. Envoyer à OpenAI Realtime
      const ephemeralKey = typeof session.client_secret === 'string' 
        ? session.client_secret 
        : session.client_secret.value

      // ✅ FORMAT GA : Pas de header Beta pour modèles GA
      const realtimeResponse = await fetch(getRealtimeURL(realtimeContext), {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
          // ❌ SUPPRIMÉ: Header Beta (nécessaire uniquement pour modèles beta)
        },
      })

      if (!realtimeResponse.ok) {
        throw new Error(`WebRTC setup failed: ${realtimeResponse.status}`)
      }

      const answerSdp = await realtimeResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      // Stocker la session
      sessionRef.current = { session_id: session.session_id }

    } catch (error: any) {
      // Gérer erreurs avec messages détaillés
      let errorMessage = 'Erreur de connexion'
      
      switch (error.message) {
        case 'MICROPHONE_PERMISSION_DENIED':
          errorMessage = 'Permissions microphone refusées'
          break
        case 'MICROPHONE_TIMEOUT':
          errorMessage = 'Timeout microphone'
          break
        case 'WebRTC non supporté par ce navigateur':
          errorMessage = 'Navigateur incompatible'
          break
        default:
          switch (error.name) {
            case 'NotAllowedError':
              errorMessage = 'Microphone bloqué'
              break
            case 'NotFoundError':
              errorMessage = 'Microphone introuvable'
              break
            case 'NotReadableError':
              errorMessage = 'Microphone occupé'
              break
            case 'OverconstrainedError':
              errorMessage = 'Configuration microphone incompatible'
              break
            case 'SecurityError':
              errorMessage = 'Erreur de sécurité'
              break
            default:
              errorMessage = error.message || 'Erreur inconnue'
          }
      }
      
      config.onError?.(new Error(errorMessage))
      throw error
    }
  }, [config, checkMicrophonePermissions, getMicrophoneStream, updateStatus, updateAudioState])

  /**
   * Gérer événements serveur OpenAI
   */
  const handleServerEvent = useCallback((
    event: any,
    dataChannel: RTCDataChannel
  ) => {
    switch (event.type) {
      case 'session.created':
        // Session créée - déjà géré dans onopen
        break

      case 'input_audio_buffer.speech_started':
        updateStatus('listening')
        updateAudioState({ isListening: true })
        config.onActivity?.()
        config.onSpeechStarted?.()
        break

      case 'input_audio_buffer.speech_stopped':
        updateStatus('connected')
        updateAudioState({ isListening: false })
        config.onActivity?.()
        config.onSpeechStopped?.()
        break

      case 'conversation.item.input_audio_transcription.completed':
        const transcript = event.transcript || ''
        config.onTranscriptUpdate?.(transcript, true)
        updateAudioState({ transcript, isFinal: true })
        config.onActivity?.() // Transcription = activité
        break

      case 'response.created':
        updateStatus('speaking')
        break

      case 'response.audio.delta':
        updateStatus('speaking')
        updateAudioState({ isPlaying: true })
        config.onActivity?.() // Réponse = activité
        break

      case 'response.audio.done':
        updateStatus('connected')
        updateAudioState({ isPlaying: false })
        config.onActivity?.() // Fin réponse = activité
        break

      case 'response.done':
        // Détecter function calls si présents
        if (event.response?.output?.[0]?.type === 'function_call') {
          const functionCall = event.response.output[0]
          if (config.onFunctionCall) {
            config.onFunctionCall(
              {
                call_id: functionCall.call_id,
                name: functionCall.name,
                arguments: functionCall.arguments || '{}'
              },
              dataChannel
            )
          }
        }
        break

      case 'error':
        config.onError?.(new Error(event.error?.message || 'Erreur OpenAI'))
        updateStatus('error')
        break

      default:
        // Événements non gérés - laisser les hooks spécifiques les gérer
        break
    }
  }, [config, updateStatus, updateAudioState])

  /**
   * Connexion complète
   */
  const connect = useCallback(async () => {
    if (isConnectingRef.current || isConnected) {
      return
    }

    isConnectingRef.current = true
    updateStatus('connecting')

    try {
      // 1. Créer session via factory
      const session = await config.sessionFactory.createSession()
      
      // 2. Déterminer le contexte (production ou vitrine)
      const realtimeContext = config.context === 'vitrine' ? 'vitrine' : 'production'
      
      // 3. Initialiser WebRTC
      await initializeWebRTC(session, realtimeContext)
      
    } catch (error: any) {
      updateStatus('error')
      config.onError?.(error)
      throw error
    } finally {
      isConnectingRef.current = false
    }
  }, [isConnected, config, updateStatus, initializeWebRTC])

  /**
   * Déconnexion complète
   */
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

      // Arrêter stream microphone
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }

      // Arrêter audio playback
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null
      }

      // Réinitialiser états
      setIsConnected(false)
      updateStatus('idle')
      sessionRef.current = null
      isConnectingRef.current = false

    } catch (error: any) {
      config.onError?.(error)
    }
  }, [config, updateStatus])

  /**
   * Nettoyage au démontage
   */
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    status,
    connect,
    disconnect,
    getDataChannel: () => dataChannelRef.current,
    getPeerConnection: () => peerConnectionRef.current,
    getSessionId: () => sessionRef.current?.session_id || null
  }
}

