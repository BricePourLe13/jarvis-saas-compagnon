import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioState } from '@/types/kiosk'
import { kioskLogger } from '@/lib/kiosk-logger'
import { realtimeClientInjector } from '@/lib/realtime-client-injector'
import { getRealtimeURL } from '@/lib/openai-config'

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

interface SessionResponse {
  success: boolean
  session: VoiceChatSession
  sessionUpdate?: any  // Config complète pour session.update
  member?: any
  context?: any
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
  const sessionUpdateConfigRef = useRef<any | null>(null)  // Config complète pour session.update
  
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

      const responseData: SessionResponse = await response.json()
      // L'API retourne { success: true, session: {...}, sessionUpdate: {...} }
      const session = responseData.session || responseData
      sessionRef.current = session
      
      // ✅ NOUVEAU : Stocker la config complète pour session.update
      if (responseData.sessionUpdate) {
        sessionUpdateConfigRef.current = responseData.sessionUpdate
        kioskLogger.session('📋 Config complète reçue pour session.update', 'info')
      }
      
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
        audioEl.id = 'jarvis-audio-kiosk'
        audioEl.autoplay = true
        audioEl.controls = false // true pour debug
        audioEl.muted = false  // 🔧 FIX: Explicitement NON muté
        audioEl.volume = 1.0   // 🔧 FIX: Volume à 100%
        audioEl.setAttribute('playsinline', '')  // 🔧 FIX: iOS compatibility
        
        // 🔧 FIX CRITIQUE : Ajouter au DOM pour que autoplay fonctionne
        document.body.appendChild(audioEl)
        
        // 🔧 FIX : Ajouter listeners debug
        audioEl.onloadedmetadata = () => {
          kioskLogger.session('✅ [AUDIO] Metadata chargé - prêt à jouer', 'success')
        }
        audioEl.onerror = (e) => {
          kioskLogger.session(`❌ [AUDIO] Erreur audio element: ${e}`, 'error')
        }
        audioEl.onplay = () => {
          kioskLogger.session('▶️ [AUDIO] Playback démarré', 'info')
        }
        audioEl.onended = () => {
          kioskLogger.session('🏁 [AUDIO] Audio terminé', 'info')
        }
        
        audioElementRef.current = audioEl
      }

      // Gérer l'audio entrant (réponses de JARVIS)
      pc.ontrack = (event) => {
        kioskLogger.session(`🎵 TRACK EVENT FIRED: ${event.track.kind} (streams: ${event.streams.length})`, 'success')
        
        // ✅ CRITICAL: Vérifier que c'est bien un track AUDIO
        if (event.track.kind !== 'audio') {
          kioskLogger.session(`⚠️ Track ignoré (type: ${event.track.kind})`, 'warning')
          return
        }
        
        if (!audioElementRef.current) {
          kioskLogger.session('❌ Audio element n\'existe pas!', 'error')
          return
        }
        
        if (!event.streams[0]) {
          kioskLogger.session('❌ Aucun stream dans l\'event!', 'error')
          return
        }
        
        // Logger l'état AVANT assignation
        kioskLogger.session(`📊 Audio element AVANT - srcObject active: ${audioElementRef.current.srcObject?.active || false}, paused: ${audioElementRef.current.paused}, muted: ${audioElementRef.current.muted}`, 'info')
        
        // ✅ Assigner le stream
        audioElementRef.current.srcObject = event.streams[0]
        
        // Logger l'état APRÈS assignation
        kioskLogger.session(`📊 Audio element APRÈS - srcObject active: ${audioElementRef.current.srcObject?.active || false}`, 'success')
        
        // 🔧 FIX CRITIQUE: Resume AudioContext pour débloquer autoplay
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
              kioskLogger.session('✅ [AUDIO] AudioContext resumed (autoplay débloqué)', 'success')
            })
          }
        } catch (err) {
          kioskLogger.session(`⚠️ [AUDIO] AudioContext non disponible: ${err}`, 'warning')
        }
        
        setAudioState(prev => ({ ...prev, isPlaying: true }))
        
        // ✅ FORCER play() immédiatement
        const playPromise = audioElementRef.current.play()
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              kioskLogger.session('✅ ▶️ Audio playback DÉMARRÉ avec succès!', 'success')
            })
            .catch((err) => {
              kioskLogger.session(`❌ PLAY FAILED: ${err.name} - ${err.message}`, 'error')
              
              if (err.name === 'NotAllowedError') {
                kioskLogger.session('⚠️ Autoplay bloqué par le navigateur - Cliquez pour activer l\'audio', 'warning')
                // Fallback: attendre interaction utilisateur
                document.addEventListener('click', () => {
                  kioskLogger.session('🖱️ Click détecté - Tentative play()...', 'info')
                  audioElementRef.current?.play()
                    .then(() => kioskLogger.session('✅ Audio démarré après click', 'success'))
                    .catch(e => kioskLogger.session(`❌ Échec après click: ${e.message}`, 'error'))
                }, { once: true })
              }
            })
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
        
        // 🎛️ ÉTAPE 3 : Envoyer session.update avec la config COMPLÈTE
        // (instructions personnalisées, tools, etc.)
        if (sessionUpdateConfigRef.current) {
          kioskLogger.session('📡 Envoi session.update avec config complète', 'info')
          dc.send(JSON.stringify({
            type: 'session.update',
            session: sessionUpdateConfigRef.current
          }))
          kioskLogger.session('✅ session.update envoyé', 'success')
        }
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
      // 🔧 FIX: Utiliser le modèle production (mini) au lieu du full
      // Cohérence avec la session créée côté serveur
      const realtimeResponse = await fetch(getRealtimeURL('production'), {
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

  // 🛠️ GESTION FUNCTION CALLS
  const handleFunctionCall = useCallback(async (functionCallItem: any) => {
    const { name, call_id, arguments: argsString } = functionCallItem
    
    kioskLogger.session(`🛠️ Function call détecté: ${name}`, 'info')
    
    try {
      // Parse les arguments
      const args = JSON.parse(argsString || '{}')
      
      // Appeler l'API tool correspondante
      let toolResponse: any
      
      // 🔧 Liste des tools built-in (toujours disponibles)
      const builtInTools = ['get_member_profile', 'update_member_info', 'log_member_interaction', 'manage_session_state']
      const isBuiltInTool = builtInTools.includes(name)
      
      if (isBuiltInTool) {
        // 🏗️ Tools built-in standard
        switch (name) {
          case 'get_member_profile':
            toolResponse = await fetch('/api/jarvis/tools/get-member-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            })
            break
            
          case 'update_member_info':
            toolResponse = await fetch('/api/jarvis/tools/update-member-info', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            })
            break
            
          case 'log_member_interaction':
            toolResponse = await fetch('/api/jarvis/tools/log-member-interaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            })
            break
            
          case 'manage_session_state':
            toolResponse = await fetch('/api/jarvis/tools/manage-session-state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            })
            break
        }
      } else {
        // 🔧 CUSTOM TOOL - Exécution dynamique
        kioskLogger.session(`🔧 [CUSTOM TOOL] Détecté: ${name}`, 'info')
        
        // Récupérer gym_id et member_id depuis la session ou le config
        const member_id = config.memberId || currentMemberRef.current?.id
        const gym_id = currentMemberRef.current?.gym_id
        const session_id = sessionRef.current?.session_id
        
        if (!member_id || !gym_id || !session_id) {
          throw new Error('Contexte session manquant pour exécuter custom tool')
        }
        
        toolResponse = await fetch('/api/jarvis/tools/execute-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gym_id,
            tool_name: name,
            args,
            member_id,
            session_id
          })
        })
      }
      
      if (!toolResponse.ok) {
        throw new Error(`Erreur tool ${name}: ${toolResponse.status}`)
      }
      
      const result = await toolResponse.json()
      kioskLogger.session(`✅ Tool ${name} exécuté avec succès`, 'success')
      
      // 🎭 GESTION SPÉCIALE POUR MANAGE_SESSION_STATE
      if (name === 'manage_session_state') {
        kioskLogger.session(`🎭 Tool manage_session_state traité`, 'info')
        
        // Envoyer le résultat au model pour qu'il utilise le message généré
        if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
          const resultEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: call_id,
              output: JSON.stringify(result)
            }
          }
          
          dataChannelRef.current.send(JSON.stringify(resultEvent))
          kioskLogger.session(`📤 Résultat tool envoyé au model`, 'info')
          
          // Demander réponse avec le message généré par le tool
          setTimeout(() => {
            if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
              const responseEvent = {
                type: 'response.create'
              }
              dataChannelRef.current.send(JSON.stringify(responseEvent))
              kioskLogger.session(`🎯 Demande réponse avec message tool`, 'info')
              
              // Si c'est une action de fermeture, programmer la fermeture après la réponse
              if (result.session_control?.end_session) {
                kioskLogger.session(`👋 Fermeture programmée après réponse JARVIS`, 'info')
                setTimeout(() => {
                  kioskLogger.session(`🔚 Fermeture session après message d'au revoir`, 'info')
                  config.onError?.('GOODBYE_DETECTED')
                }, 4000) // Plus de temps pour la réponse
              }
            }
          }, 100)
        }
        return // Ne pas continuer le flow normal
      }
      
      // Renvoyer le résultat au model via conversation.item.create
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        const resultEvent = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call_id,
            output: JSON.stringify(result)
          }
        }
        
        dataChannelRef.current.send(JSON.stringify(resultEvent))
        kioskLogger.session(`📤 Résultat tool envoyé au model`, 'info')
        
        // Demander une nouvelle réponse du model
        setTimeout(() => {
          if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            const responseEvent = {
              type: 'response.create'
            }
            dataChannelRef.current.send(JSON.stringify(responseEvent))
            kioskLogger.session(`🎯 Nouvelle réponse demandée au model`, 'info')
          }
        }, 100)
      }
      
    } catch (error: any) {
      kioskLogger.session(`❌ Erreur function call ${name}: ${error.message}`, 'error')
      
      // Envoyer erreur au model
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        const errorEvent = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call_id,
            output: JSON.stringify({ 
              error: true, 
              message: `Erreur lors de l'exécution: ${error.message}` 
            })
          }
        }
        
        dataChannelRef.current.send(JSON.stringify(errorEvent))
        
        // Demander réponse même en cas d'erreur
        setTimeout(() => {
          if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }))
          }
        }, 100)
      }
    }
  }, [])

  // 📨 GESTION ÉVÉNEMENTS SERVEUR (comme ba8f34a)
  const handleServerEvent = useCallback((event: any) => {
    resetInactivityTimeout()
    
    // 🔍 LOG TOUS LES ÉVÉNEMENTS POUR DEBUG
    kioskLogger.session(`📨 Événement: ${event.type}`, 'info')

    switch (event.type) {
      case 'session.created':
        kioskLogger.session('🎯 Session OpenAI active', 'success')
        break
      
      case 'session.updated':
        kioskLogger.session('✅ Session mise à jour confirmée', 'success')
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
      
      case 'input_audio_buffer.committed':
        kioskLogger.session('✅ Buffer audio committé', 'info')
        break

      case 'conversation.item.created':
        kioskLogger.session(`💬 Item créé: ${event.item?.type}`, 'info')
        break
      
      case 'response.created':
        kioskLogger.session('🎙️ JARVIS commence à répondre', 'success')
        setAudioState(prev => ({ ...prev, isPlaying: true }))
        updateStatus('speaking')
        break
      
      case 'response.audio.delta':
        kioskLogger.session('🔊 Chunk audio reçu', 'info')
        break
      
      case 'response.audio.done':
        kioskLogger.session('✅ Audio complet reçu', 'success')
        break
      
      case 'response.done':
        kioskLogger.session('✅ Réponse JARVIS terminée', 'success')
        setAudioState(prev => ({ ...prev, isPlaying: false }))
        updateStatus('connected')
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
        
        // 🚫 ANCIENNE DÉTECTION AU REVOIR COMPLÈTEMENT SUPPRIMÉE
        // Maintenant 100% géré par le tool manage_session_state
        break

      case 'response.audio.delta':
        updateStatus('speaking')
        setAudioState(prev => ({ ...prev, isPlaying: true }))
        break

      case 'response.audio.done':
        updateStatus('connected')
        setAudioState(prev => ({ ...prev, isPlaying: false }))
        break

      case 'response.done':
        // 🛠️ DÉTECTER FUNCTION CALLS
        if (event.response?.output?.[0]?.type === 'function_call') {
          kioskLogger.session(`🛠️ Function call détecté dans response.done`, 'info')
          handleFunctionCall(event.response.output[0])
        }
        break

      case 'error':
        kioskLogger.session(`❌ Erreur OpenAI: ${event.error?.message}`, 'error')
        config.onError?.(event.error?.message || 'Erreur OpenAI')
        break
    }
  }, [resetInactivityTimeout, updateStatus, config, handleFunctionCall])

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

      // Arrêter l'audio et nettoyer DOM
      if (audioElementRef.current) {
        // Pause et reset
        audioElementRef.current.pause()
        audioElementRef.current.srcObject = null
        
        // Retirer du DOM
        if (audioElementRef.current.parentNode) {
          audioElementRef.current.parentNode.removeChild(audioElementRef.current)
          kioskLogger.session('🧹 [AUDIO] Audio element retiré du DOM', 'info')
        }
        audioElementRef.current = null
      }

      // 🚨 FERMER LA SESSION OPENAI REALTIME CÔTÉ SERVEUR
      if (sessionRef.current) {
        try {
          // 1. Fermer la session OpenAI Realtime via leur API
          console.log('🔥 [DISCONNECT] Fermeture session OpenAI Realtime...')
          
          // Envoyer un événement de fermeture via le data channel si encore ouvert
          if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            try {
              const closeEvent = {
                type: 'session.update',
                session: {
                  turn_detection: null // Désactiver la détection
                }
              }
              dataChannelRef.current.send(JSON.stringify(closeEvent))
              
              // Attendre un peu pour que l'événement soit traité
              await new Promise(resolve => setTimeout(resolve, 100))
            } catch (dcError) {
              console.log('⚠️ [DISCONNECT] Erreur envoi événement fermeture:', dcError)
            }
          }
          
          // 2. Fermer notre enregistrement en base
          await fetch('/api/voice/session/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sessionId: sessionRef.current.session_id,
              reason: 'user_disconnect'
            })
          })
          
          console.log('✅ [DISCONNECT] Session OpenAI fermée complètement')
        } catch (error) {
          console.error('❌ [DISCONNECT] Erreur fermeture session:', error)
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