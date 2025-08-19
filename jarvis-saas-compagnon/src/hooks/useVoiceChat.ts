import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioState } from '@/types/kiosk'
// 🗑️ SUPPRIMÉ - Remplacé par Prisma tracking
// import { whisperParallelTracker } from '@/lib/whisper-parallel-tracker' // 🗑️ SUPPRIMÉ - OpenAI fait tout

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
  onSessionCreated?: (sessionId: string, memberId?: string, gymId?: string) => void
}

interface VoiceChatSession {
  client_secret: { value: string }
  session_id: string
  expires_at: string
  member_id?: string
  gym_id?: string
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
  
  // 🔧 STABILITÉ SESSION - Éviter les déconnexions accidentelles  
  const lastActivityRef = useRef<number>(Date.now())
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'reconnecting'>('idle')
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown')

  // 📊 États de tracking de session
  const sessionTrackingRef = useRef<{
    sessionId: string | null
    gymId: string | null
    franchiseId: string | null
    startTime: Date | null
    textInputTokens: number
    textOutputTokens: number
    audioInputSeconds: number
    audioOutputSeconds: number
    currentUserSpeech?: string
    errorOccurred: boolean
    transcriptHistory: string[]
    speechStartTime?: number
  }>({
    sessionId: null,
    gymId: null,
    franchiseId: null,
    startTime: null,
    textInputTokens: 0,
    textOutputTokens: 0,
    audioInputSeconds: 0,
    audioOutputSeconds: 0,
    errorOccurred: false,
    transcriptHistory: []
  })
  
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
    
    // 🔧 STABILITÉ: Marquer l'activité pour éviter les timeouts
    lastActivityRef.current = Date.now()
  }, [])
  
  // 🔧 STABILITÉ SESSION - Fonction de maintien en vie
  const maintainSessionStability = useCallback(() => {
    if (!isConnected) return
    
    const timeSinceActivity = Date.now() - lastActivityRef.current
    
    // Si pas d'activité depuis plus de 45 secondes, marquer l'activité
    if (timeSinceActivity > 45000) {
      console.log('🔧 [STABILITÉ] Maintien session - refresh activité')
      lastActivityRef.current = Date.now()
    }
    
    // Programmer le prochain check dans 20 secondes
    stabilityTimeoutRef.current = setTimeout(maintainSessionStability, 20000)
  }, [isConnected])
  
  // Démarrer le maintien de stabilité quand connecté
  useEffect(() => {
    if (isConnected) {
      lastActivityRef.current = Date.now()
      maintainSessionStability()
    } else if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current)
      stabilityTimeoutRef.current = null
    }
    
    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current)
        stabilityTimeoutRef.current = null
      }
    }
  }, [isConnected, maintainSessionStability])

  // 📊 Fonctions helper pour le tracking de session
  const generateSessionId = useCallback(() => {
    return `jarvis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const initSessionTracking = useCallback(async (gymData?: { gymId?: string; franchiseId?: string }) => {
    const sessionId = generateSessionId()
    
    sessionTrackingRef.current = {
      sessionId,
      gymId: gymData?.gymId || null,
      franchiseId: gymData?.franchiseId || null,
      startTime: new Date(),
      textInputTokens: 0,
      textOutputTokens: 0,
      audioInputSeconds: 0,
      audioOutputSeconds: 0,
      errorOccurred: false,
      transcriptHistory: []
    }

    console.log('📊 [TRACKING] Session initialisée:', sessionId)
  }, [generateSessionId])

     const finalizeSessionTracking = useCallback(async () => {
     const tracking = sessionTrackingRef.current
     
     // ✅ CORRECTION: Ne pas traiter si aucune session n'a jamais été initialisée
     if (!tracking.sessionId) {
       console.log('📊 [TRACKING] Aucune session à finaliser (pas de sessionId)')
       return
     }
     
     console.log('📊 [TRACKING] ===== DÉBUT FINALISATION SESSION =====')
     console.log('📊 [TRACKING] Données de tracking actuelles:', tracking)
     
     if (!tracking.startTime || !tracking.gymId) {
       console.error('📊 [TRACKING] ❌ DONNÉES INCOMPLÈTES:')
       console.error('- sessionId:', tracking.sessionId)
       console.error('- startTime:', tracking.startTime)
       console.error('- gymId:', tracking.gymId)
       console.error('- franchiseId:', tracking.franchiseId)
       return
     }

    try {
      const durationSeconds = Math.floor((Date.now() - tracking.startTime.getTime()) / 1000)
      
      // Calculer approximativement les tokens audio basés sur la durée
      const audioInputTokens = Math.round(tracking.audioInputSeconds * 1667 / 60) // ~1667 tokens/minute
      const audioOutputTokens = Math.round(tracking.audioOutputSeconds * 1667 / 60)

      console.log('📊 [TRACKING] Finalisation session:', {
        sessionId: tracking.sessionId,
        durationSeconds,
        audioInputTokens,
        audioOutputTokens
      })

      await trackSessionCost({
        sessionId: tracking.sessionId,
        gymId: tracking.gymId,
        franchiseId: tracking.franchiseId,
        timestamp: tracking.startTime,
        durationSeconds,
        textInputTokens: tracking.textInputTokens,
        textOutputTokens: tracking.textOutputTokens,
        audioInputTokens,
        audioOutputTokens,
        userSatisfaction: undefined, // TODO: Collecter si nécessaire
        errorOccurred: tracking.errorOccurred,
        endReason: tracking.errorOccurred ? 'error' : 'user_ended',
        audioInputSeconds: tracking.audioInputSeconds,
        audioOutputSeconds: tracking.audioOutputSeconds
      })

      // 🎯 [INSTRUMENTATION] Finaliser la session OpenAI Realtime
      try {
        console.log('🔍 [DEBUG SESSION FINALIZE] sessionRef.current:', sessionRef.current)
        console.log('🔍 [DEBUG SESSION FINALIZE] sessionRef.current?.session_id:', sessionRef.current?.session_id)
        
        if (sessionRef.current?.session_id) {
          const costBreakdown = calculateSessionCost({
            durationSeconds,
            textInputTokens: tracking.textInputTokens,
            textOutputTokens: tracking.textOutputTokens,
            audioInputSeconds: tracking.audioInputSeconds,
            audioOutputSeconds: tracking.audioOutputSeconds
          })

          // TODO: Prisma endSession avec costBreakdown et durationSeconds

          console.log('🎯 [INSTRUMENTATION] Session OpenAI finalisée avec succès')
        }
      } catch (instrumentationError) {
        console.error('❌ [INSTRUMENTATION] Erreur finalisation session:', instrumentationError)
        // Ne pas faire échouer le tracking normal
      }

      console.log('📊 [TRACKING] ✅ SESSION SAUVEGARDÉE AVEC SUCCÈS!')
      console.log('📊 [TRACKING] Session ID final:', tracking.sessionId)
      console.log('📊 [TRACKING] ===== FIN FINALISATION SESSION =====')
     } catch (error) {
       console.error('📊 [TRACKING] ❌ ERREUR CRITIQUE SAUVEGARDE:', error)
       console.error('📊 [TRACKING] Détails erreur:', {
         name: error instanceof Error ? error.name : 'Unknown',
         message: error instanceof Error ? error.message : error,
         stack: error instanceof Error ? error.stack : undefined
       })
     }
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
      
             // 📊 [TRACKING] Récupérer les infos de gym/franchise pour le tracking
       let gymData = null
       try {
         console.log('📊 [TRACKING] Récupération infos gym pour:', config.gymSlug)
         const gymResponse = await fetch(`/api/kiosk/${config.gymSlug}`)
         console.log('📊 [TRACKING] Réponse gym API:', gymResponse.status, gymResponse.ok)
         
                   if (gymResponse.ok) {
            const gymInfo = await gymResponse.json()
            console.log('📊 [TRACKING] Données gym complètes:', gymInfo)
            
            // ✅ CORRECTION: Plusieurs façons d'extraire les IDs pour compatibilité
            const extractedGymId = gymInfo.data?.id || gymInfo.gym?.id || gymInfo.kiosk?.id
            const extractedFranchiseId = gymInfo.data?.franchise_id || gymInfo.gym?.franchise_id
            
            gymData = {
              gymId: extractedGymId,
              franchiseId: extractedFranchiseId
            }
            console.log('📊 [TRACKING] Infos gym extraites:', gymData)
            
            if (!gymData.gymId) {
              console.error('📊 [TRACKING] ❌ PROBLÈME: gymId manquant dans la réponse API')
              console.error('📊 [TRACKING] Structure reçue:', {
                hasData: !!gymInfo.data,
                hasGym: !!gymInfo.gym,
                hasKiosk: !!gymInfo.kiosk,
                dataId: gymInfo.data?.id,
                gymId: gymInfo.gym?.id,
                kioskId: gymInfo.kiosk?.id
              })
            }
         } else {
           console.error('📊 [TRACKING] ❌ Erreur API gym:', gymResponse.status)
         }
       } catch (error) {
         console.error('📊 [TRACKING] ❌ Exception récupération gym:', error)
       }
      
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
      
      console.log('🔍 [DEBUG SESSION] Réponse API complète:', data)
      console.log('🔍 [DEBUG SESSION] data.session:', data.session)
      console.log('🔍 [DEBUG SESSION] data.session?.id:', data.session?.id)
      
      // 📊 [TRACKING] Initialiser le tracking de session
      await initSessionTracking(gymData)
      
      return data.session
    } catch (error) {
      console.error('Erreur création session:', error)
      throw error
    }
  }, [config.memberId, config.gymSlug, getMemberData, initSessionTracking])

  // Programmer une reconnexion avec backoff exponentiel (AVANT connect pour éviter dépendance circulaire)
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
      // Utiliser la référence directe pour éviter dépendance circulaire
      connect()
    }, delay)
  }, [updateStatus])

  // Initialiser la connexion WebRTC
  const initializeWebRTC = useCallback(async (session: VoiceChatSession) => {
    try {
      // Créer la peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      peerConnectionRef.current = pc

      // Demander permission micro et ajouter le track audio
      console.log('🎤 Demande de permissions microphone...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      console.log('✅ Permissions microphone accordées')
      
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
      console.log('🔍 [DEBUG SESSION ASSIGN] sessionRef.current assigné:', session)
      console.log('🔍 [DEBUG SESSION ASSIGN] session.session_id:', session?.session_id)
      console.log('✅ Connexion WebRTC établie avec OpenAI Realtime')

    } catch (error) {
      console.error('Erreur initialisation WebRTC:', error)
      throw error
    }
  }, [status, updateStatus])

  // Gérer les événements du serveur OpenAI
  const handleServerEvent = useCallback((event: { type: string; [key: string]: unknown }) => {
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
        
        // 🔧 STABILITÉ: Activité détectée
        lastActivityRef.current = Date.now()
        
        // 📊 [TRACKING] Marquer le début d'input audio
        if (sessionTrackingRef.current.sessionId) {
          sessionTrackingRef.current.speechStartTime = Date.now()
        }
        
        // 🎯 [INSTRUMENTATION] Enregistrer événement audio
        try {
          if (sessionRef.current?.session_id) {
            // TODO: Prisma recordAudioEvent speech_started
          }
        } catch (error) {
          console.error('❌ [INSTRUMENTATION] Erreur speech_started:', error)
        }
        break

      case 'input_audio_buffer.speech_stopped':
        console.log('🤐 Fin de parole détectée')
        setAudioState(prev => ({ ...prev, isRecording: false }))
        
        // 🔧 STABILITÉ: Activité détectée
        lastActivityRef.current = Date.now()
        
        // 📊 [TRACKING] Calculer la durée d'input audio
        if (sessionTrackingRef.current.sessionId && sessionTrackingRef.current.speechStartTime) {
          const duration = (Date.now() - sessionTrackingRef.current.speechStartTime) / 1000
          sessionTrackingRef.current.audioInputSeconds += duration
          delete sessionTrackingRef.current.speechStartTime
        }
        
        // 🎯 [INSTRUMENTATION] Enregistrer événement audio
        try {
          if (sessionRef.current?.session_id) {
            // TODO: Prisma recordAudioEvent('speech_stopped')
          }
        } catch (error) {
          console.error('❌ [INSTRUMENTATION] Erreur speech_stopped:', error)
        }
        break

      case 'response.created':
        console.log('💭 Réponse IA en cours de génération')
        updateStatus('speaking')
        // 🔧 ACTIVITÉ: JARVIS parle = activité (pas d'inactivité)
        lastActivityRef.current = Date.now()
        break

      case 'response.audio_transcript.delta':
        if (event.delta) {
          transcriptBufferRef.current += event.delta
          configRef.current.onTranscriptUpdate?.(transcriptBufferRef.current, false)
          setCurrentTranscript(transcriptBufferRef.current)
          // 🔧 ACTIVITÉ: JARVIS parle = activité
          lastActivityRef.current = Date.now()
        }
        break

      case 'conversation.item.input_audio_transcription.delta':
        // 🎙️ NOUVEAU: Transcription utilisateur temps réel (deltas)
        const deltaTranscript = (event as any).delta?.transcript as string
        if (deltaTranscript) {
          console.log('🔊 [OPENAI USER] Speech delta:', deltaTranscript.substring(0, 30) + '...')
          
          // 📊 [TRACKING] Ajouter au buffer pour assemblage final
          if (sessionTrackingRef.current.sessionId) {
            // Buffer les deltas pour éviter duplication avec completed
            if (!sessionTrackingRef.current.currentUserSpeech) {
              sessionTrackingRef.current.currentUserSpeech = ''
            }
            sessionTrackingRef.current.currentUserSpeech += deltaTranscript
          }
        }
        break

      case 'conversation.item.input_audio_transcription.completed':
        // 🎙️ TRANSCRIPTION UTILISATEUR FINALE
        const userTranscript = (event as any).transcript as string
        if (userTranscript) {
          console.log('👤 [OPENAI USER] Speech captured FINAL:', userTranscript.substring(0, 50) + '...')
          
          // 📊 [TRACKING] Utiliser transcript final (plus fiable que deltas)
          if (sessionTrackingRef.current.sessionId) {
            sessionTrackingRef.current.transcriptHistory.push(`USER: ${userTranscript}`)
            sessionTrackingRef.current.textInputTokens += Math.ceil(userTranscript.length / 4)
            
            // Reset buffer deltas
            delete sessionTrackingRef.current.currentUserSpeech
          }
          
          // 💾 [LOGGING] Sauver immédiatement en base
          try {
            if (sessionRef.current?.session_id && config.gymSlug) {
              fetch(`/api/kiosk/${config.gymSlug}/log-interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session_id: sessionRef.current.session_id,
                  member_id: sessionRef.current.member_id,
                  gym_id: sessionRef.current.gym_id,
                  speaker: 'user',
                  message_text: userTranscript,
                  conversation_turn_number: sessionTrackingRef.current.transcriptHistory.filter(t => t.startsWith('USER:')).length
                }),
                keepalive: true
              }).catch(error => console.warn('⚠️ Log interaction failed:', error))
            }
          } catch (logError) {
            console.warn('⚠️ Erreur logging transcript user:', logError)
          }
          
          // 🎯 Détection "au revoir" directement depuis OpenAI
          const isGoodbye = userTranscript.toLowerCase().trim().includes('au revoir')
          if (isGoodbye) {
            console.log('👋 [OPENAI USER] AU REVOIR DÉTECTÉ dans transcript OpenAI:', userTranscript)
            
            // 🚀 FERMETURE AUTOMATIQUE DE SESSION
            setTimeout(async () => {
              try {
                // Fermer côté serveur
                if (sessionRef.current?.session_id) {
                  await fetch('/api/voice/session/close', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: sessionRef.current.session_id, reason: 'user_goodbye' }),
                    keepalive: true
                  }).catch(() => {})
                }
                
                // Déclencher déconnexion
                await disconnect()
                
                // Notifier le parent (VoiceInterface) pour désactiver
                if (configRef.current.onError) {
                  configRef.current.onError('GOODBYE_DETECTED')
                }
              } catch (error) {
                console.error('❌ [OPENAI USER] Erreur fermeture au revoir:', error)
              }
            }, 1000) // Délai pour laisser JARVIS répondre "au revoir"
          }
        }
        break

      case 'response.audio_transcript.done':
        console.log('📝 Transcript final:', (event as any).transcript)
        const finalTranscript = ((event as any).transcript as string) || transcriptBufferRef.current
        
        // 🔧 ACTIVITÉ: Fin de réponse JARVIS = activité
        lastActivityRef.current = Date.now()
        
        // 👋 DÉTECTION "AU REVOIR" SUPPRIMÉE - gérée côté VoiceInterface pour éviter conflits
        
        configRef.current.onTranscriptUpdate?.(finalTranscript, true)
        setCurrentTranscript(finalTranscript)
        
        // 📊 [TRACKING] Enregistrer la transcription
        if (finalTranscript && sessionTrackingRef.current.sessionId) {
          sessionTrackingRef.current.transcriptHistory.push(`AI: ${finalTranscript}`)
          // Estimer les tokens de sortie (approximation: 1 token ≈ 4 caractères)
          sessionTrackingRef.current.textOutputTokens += Math.ceil(finalTranscript.length / 4)
        }

              // 🎙️ [OPENAI REALTIME] Logging IA intégré dans le tracking principal
              console.log('🤖 [OPENAI REALTIME] IA Response logged:', finalTranscript.substring(0, 50) + '...')
        
        // 🎯 [INSTRUMENTATION] Enregistrer la transcription IA finale
        try {
          if (sessionRef.current?.session_id && finalTranscript) {
            // TODO: Prisma recordAudioEvent('response_completed', finalTranscript)
          }
        } catch (error) {
          console.error('❌ [INSTRUMENTATION] Erreur response_completed:', error)
        }
        
        transcriptBufferRef.current = ''
        break

      case 'response.audio.done':
        console.log('🔊 Audio de réponse terminé')
        setAudioState(prev => ({ ...prev, isPlaying: false }))
        
        // 📊 [TRACKING] Estimer la durée audio de sortie (approximatif)
        if (sessionTrackingRef.current.sessionId) {
          sessionTrackingRef.current.audioOutputSeconds += 3 // Estimation moyenne
        }
        break

      case 'response.done':
        console.log('✅ Réponse complète')
        updateStatus('connected')
        break

      case 'error':
        console.error('❌ Erreur serveur OpenAI:', event)
        configRef.current.onError?.((event.error as { message?: string })?.message || 'Erreur serveur')
        
        // 📊 [TRACKING] Marquer l'erreur
        if (sessionTrackingRef.current.sessionId) {
          sessionTrackingRef.current.errorOccurred = true
        }
        
        updateStatus('error')
        break

      case 'rate_limits.updated':
        console.log('⚡ Limites de taux mises à jour:', event.rate_limits)
        break

      default:
        // 🔇 Logs événements non critiques silencieux en production
        if (process.env.NODE_ENV === 'development') {
          console.log('📨 Événement serveur non géré:', event.type)
        }
    }
  }, [updateStatus])

  // Fonction principale de connexion
  const connect = useCallback(async () => {
    // 🔇 Debug logs silencieux en production
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 [CONNECT DEBUG] connect() appelée, isConnectingRef.current:', isConnectingRef.current, 'isConnected:', isConnected)
    }
    
    if (isConnectingRef.current || isConnected) {
      console.log('⚠️ Connexion déjà en cours ou établie')
      return
    }

    isConnectingRef.current = true
    updateStatus('connecting')
    console.log('🔥 [CONNECT DEBUG] Début connexion, appel createSession()')

    try {
      // 1. Créer la session OpenAI avec token ephémère
      const session = await createSession()
      console.log('🔥 [CONNECT DEBUG] createSession() réussie, session:', session)
      
      // 2. Initialiser WebRTC avec la session
      console.log('🔥 [CONNECT DEBUG] Appel initializeWebRTC()')
      await initializeWebRTC(session)
      console.log('🔥 [CONNECT DEBUG] initializeWebRTC() réussie')
      
      console.log('🚀 Connexion voice chat établie avec succès')
      
    } catch (error) {
      console.error('Erreur connexion voice chat:', error)
      
      // Messages d'erreur détaillés selon le type
      let errorMessage = 'Erreur de connexion'
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissions microphone refusées. Autorisez le microphone et rechargez la page.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Aucun microphone détecté. Vérifiez votre équipement audio.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone déjà utilisé par une autre application.'
        } else if (error.message.includes('Session creation failed')) {
          errorMessage = 'Erreur serveur. Veuillez réessayer.'
        } else {
          errorMessage = error.message
        }
      }
      
      configRef.current.onError?.(errorMessage)
      updateStatus('error')
      
      // Tentative de reconnexion automatique (sauf pour les erreurs de permissions)
      if (reconnectAttempts.current < RECONNECT_CONFIG.maxAttempts && 
          !(error instanceof Error && error.name === 'NotAllowedError')) {
        scheduleReconnect()
      }
    } finally {
      isConnectingRef.current = false
    }
  }, [isConnected, createSession, initializeWebRTC, updateStatus, scheduleReconnect])

  // Déconnexion propre (DÉCLARÉE EN PREMIER pour éviter erreur hoisting)
  const disconnect = useCallback(async () => {
    console.log('🔌 DÉCONNEXION VOICE CHAT - RAISON:', {
      timestamp: new Date().toISOString(),
      isConnected,
      status,
      lastActivity: new Date(lastActivityRef.current).toISOString(),
      timeSinceActivity: Date.now() - lastActivityRef.current,
      sessionId: sessionTrackingRef.current.sessionId
    })
    
    // Nettoyer les timeouts de stabilité
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current)
      stabilityTimeoutRef.current = null
    }
    
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

    // 📊 [TRACKING] Finaliser le tracking de session AVANT de reset sessionRef
    await finalizeSessionTracking()

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
  }, [updateStatus, finalizeSessionTracking])

  // Forcer une reconnexion
  const forceReconnect = useCallback(async () => {
    console.log('🔄 Reconnexion forcée demandée')
    await disconnect()
    reconnectAttempts.current = 0
    setTimeout(() => connect(), 1000)
  }, [connect, disconnect])

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
      // Note: cleanup function cannot be async, but disconnect should be called
      disconnect().catch(console.error)
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
    forceReconnect,
    getCurrentSessionId: () => sessionRef.current?.session_id || null
  }
} 