"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { executeJarvisFunction } from '@/lib/jarvis-expert-functions'

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

  // 🎯 Handler pour les function calls (ROI, success stories, etc.)
  const handleFunctionCall = useCallback(async (message: any, dataChannel: RTCDataChannel) => {
    try {
      const { call_id, name, arguments: argsString } = message
      console.log(`🔧 Exécution function: ${name}`)
      console.log(`📊 Arguments:`, argsString)
      
      // Parser les arguments
      const args = JSON.parse(argsString)
      
      // Exécuter la fonction experte
      const result = await executeJarvisFunction(name, args)
      console.log(`✅ Résultat function ${name}:`, result)
      
      // Renvoyer le résultat à l'IA
      dataChannel.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: call_id,
          output: JSON.stringify(result)
        }
      }))
      
      // Demander à l'IA de répondre avec ce résultat
      dataChannel.send(JSON.stringify({
        type: 'response.create'
      }))
      
      console.log('📤 Résultat envoyé à JARVIS pour formulation')
      
    } catch (error) {
      console.error('❌ Erreur exécution function call:', error)
      
      // En cas d'erreur, informer l'IA
      if (message.call_id) {
        dataChannel.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: message.call_id,
            output: JSON.stringify({ 
              error: 'Erreur lors du calcul, je vais vous donner une estimation générale.' 
            })
          }
        }))
        
        dataChannel.send(JSON.stringify({
          type: 'response.create'
        }))
      }
    }
  }, [])

  // Créer une session éphémère pour la démo
  const createDemoSession = useCallback(async () => {
    // L'API attend maintenant directement la config sans wrapper "session"
    const response = await fetch('/api/voice/vitrine/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // L'API crée la config elle-même maintenant
    })

    if (!response.ok) {
      // 🔒 NOUVEAU : Gérer les erreurs de limitation
      const errorData = await response.json().catch(() => ({}))
      
      const error: any = new Error(errorData.error || `Erreur session: ${response.status}`)
      error.statusCode = response.status
      error.hasActiveSession = errorData.hasActiveSession
      error.remainingCredits = errorData.remainingCredits
      error.isBlocked = errorData.isBlocked
      
      throw error
    }

    const sessionData = await response.json()
    console.log('✅ Session créée:', sessionData)
    console.log('🔍 Structure session:', JSON.stringify(sessionData.session, null, 2))
    console.log('🔍 client_secret:', sessionData.session?.client_secret)
    
    // 💳 Retourner aussi les crédits restants
    if (sessionData.remainingCredits !== undefined) {
      console.log(`💳 Crédits restants: ${sessionData.remainingCredits} minutes`)
    }
    
    return sessionData
  }, [])

  // Initialiser WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Vérifier support WebRTC
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC non supporté par ce navigateur')
      }

      // Créer session démo
      const sessionResponse = await createDemoSession()
      const session = sessionResponse.session
      console.log('🔍 Session utilisée:', session)
      
      // Configurer peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      peerConnectionRef.current = pc

      // Créer l'élément audio pour le playback (COMME LE KIOSK)
      if (!audioElementRef.current) {
        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioElementRef.current = audioEl
      }

      // Gérer l'audio entrant (réponses de JARVIS) - COMME LE KIOSK
      pc.ontrack = (event) => {
        console.log('🔊 Audio entrant reçu (style kiosk)')
        if (audioElementRef.current && event.streams[0]) {
          audioElementRef.current.srcObject = event.streams[0]
          console.log('✅ Audio srcObject défini')
        }
      }

      // Demander accès microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000, // Qualité HD pour meilleur rendu
            channelCount: 1,
            latency: 0.01, // Faible latence
            volume: 1.0
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
        
        // ✅ CORRECTION : Ne pas écraser le prompt serveur !
        // Le prompt commercial expert est déjà configuré dans /api/voice/vitrine/session
        // avec toutes les instructions détaillées, function calling, etc.
        console.log('🎯 Utilisation du prompt commercial serveur (expert JARVIS-GROUP)')
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
              
            case 'response.audio.delta':
              console.log('🎤 Chunk audio reçu de JARVIS')
              // Audio chunks from BETA API - traitement immédiat
              break
              
            case 'conversation.item.input_audio_transcription.completed':
              if (message.transcript) {
                updateTranscript(message.transcript)
              }
              break
              
            case 'response.output_text.delta':
              // Text chunks from GA API
              break
            
            // 🎯 NOUVEAU : Function calling pour JARVIS VITRINE (commercial expert)
            case 'response.function_call_arguments.delta':
              // Arguments de fonction reçus progressivement
              console.log('🔧 Function call arguments delta:', message)
              break
            
            case 'response.function_call_arguments.done':
              // Function call complet - EXÉCUTER
              console.log('🎯 Function call complet:', message)
              handleFunctionCall(message, dc)
              break
            
            case 'response.output_item.done':
              // Item terminé (peut contenir un function call)
              if (message.item?.type === 'function_call') {
                console.log('✅ Function call item done:', message.item.name)
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

      // Envoyer à OpenAI (format BETA comme le kiosk)
      const ephemeralKey = session.client_secret.value
      console.log('🔑 Token utilisé:', ephemeralKey?.substring(0, 20) + '...')
      const realtimeResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1'
        },
      })

      if (!realtimeResponse.ok) {
        throw new Error(`WebRTC setup failed: ${realtimeResponse.status}`)
      }

      const answerSdp = await realtimeResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      console.log('✅ WebRTC initialisé avec succès')
      
      // 💳 Retourner les données de session
      return sessionResponse
      
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
      const sessionData = await initializeWebRTC()
      // 💳 Retourner les données de session (incluant remainingCredits)
      return sessionData
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
      // 🔒 NOUVEAU : Comptabiliser le temps de session
      if (sessionStartTimeRef.current) {
        const durationSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        console.log(`⏱️ Durée session: ${durationSeconds}s (${Math.ceil(durationSeconds / 60)} crédits)`)
        
        // Appeler l'API pour enregistrer la durée
        try {
          const response = await fetch('/api/voice/vitrine/end-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationSeconds })
          })
          
          if (response.ok) {
            console.log('✅ Durée session enregistrée')
          }
        } catch (error) {
          console.error('❌ Erreur enregistrement durée:', error)
        }
      }
      
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

      // Arrêter audio et nettoyer DOM
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null
        // Retirer du DOM
        if (audioElementRef.current.parentNode) {
          audioElementRef.current.parentNode.removeChild(audioElementRef.current)
        }
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
