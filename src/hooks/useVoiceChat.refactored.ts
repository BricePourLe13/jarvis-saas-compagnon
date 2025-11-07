/**
 * 🎙️ HOOK VOICE CHAT - KIOSK (REFACTORED)
 * 
 * Version refactorée utilisant useVoiceRealtimeCore
 * 
 * ⚠️ FICHIER TEMPORAIRE POUR VALIDATION
 * Une fois validé, remplacer useVoiceChat.ts
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioState } from '@/types/kiosk'
import { kioskLogger } from '@/lib/kiosk-logger'
import { realtimeClientInjector } from '@/lib/realtime-client-injector'
import { useVoiceRealtimeCore } from '@/lib/voice/useVoiceRealtimeCore'
import { KioskSessionFactory } from '@/lib/voice/voice-session-factory'
import { VoiceAudioState } from '@/lib/voice/types'

interface VoiceChatConfig {
  gymSlug: string
  memberId?: string
  language?: 'fr' | 'en' | 'es'
  memberData?: {
    badge_id?: string
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

const INACTIVITY_TIMEOUT_MS = 45000 // 45 secondes

export function useVoiceChat(config: VoiceChatConfig) {
  // États locaux (spécifiques kiosk)
  const [audioState, setAudioState] = useState<AudioState>({
    isListening: false,
    isPlaying: false,
    volume: 0,
    transcript: '',
    isFinal: false
  })

  // Refs pour logging et tracking
  const currentMemberRef = useRef<{ id: string; gym_id: string } | null>(null)
  const sessionRef = useRef<{ session_id: string } | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Factory pour créer session kiosk
  const sessionFactory = useRef<KioskSessionFactory | null>(null)

  // Initialiser factory
  useEffect(() => {
    const badge_id = config.memberData?.badge_id || config.memberId
    if (badge_id && config.gymSlug) {
      sessionFactory.current = new KioskSessionFactory(
        config.gymSlug,
        badge_id,
        config.language || 'fr'
      )
    }
  }, [config.memberData?.badge_id, config.memberId, config.gymSlug, config.language])

  // 💬 Initialiser les données membre pour le logging
  useEffect(() => {
    if (config.memberData?.badge_id && config.gymSlug) {
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

  // Ref pour stocker la fonction de déconnexion (évite dépendance circulaire)
  const disconnectRef = useRef<() => Promise<void>>()

  // ⏰ GESTION TIMEOUT INACTIVITÉ (spécifique kiosk)
  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
  }, [])

  // 🛠️ GESTION FUNCTION CALLS (spécifique kiosk)
  const handleFunctionCall = useCallback(async (
    call: { call_id: string; name: string; arguments: string },
    dataChannel: RTCDataChannel
  ) => {
    const { name, call_id, arguments: argsString } = call
    
    kioskLogger.session(`🛠️ Function call détecté: ${name}`, 'info')
    
    try {
      const args = JSON.parse(argsString || '{}')
      const sessionId = sessionRef.current?.session_id
      
      // ✅ Ajouter session_id aux arguments pour récupération contexte
      const argsWithSession = { ...args, session_id: sessionId }
      
      let toolResponse: any
      
      switch (name) {
        case 'get_member_profile':
          toolResponse = await fetch('/api/jarvis/tools/get-member-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(argsWithSession)
          })
          break
          
        case 'update_member_info':
          toolResponse = await fetch('/api/jarvis/tools/update-member-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(argsWithSession)
          })
          break
          
        case 'log_member_interaction':
          toolResponse = await fetch('/api/jarvis/tools/log-member-interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(argsWithSession)
          })
          break
          
        case 'manage_session_state':
          toolResponse = await fetch('/api/jarvis/tools/manage-session-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(argsWithSession)
          })
          break
          
        default:
          throw new Error(`Tool non supporté: ${name}`)
      }
      
      if (!toolResponse.ok) {
        throw new Error(`Erreur tool ${name}: ${toolResponse.status}`)
      }
      
      const result = await toolResponse.json()
      kioskLogger.session(`✅ Tool ${name} exécuté avec succès`, 'success')
      
      // 🎭 GESTION SPÉCIALE POUR MANAGE_SESSION_STATE
      if (name === 'manage_session_state') {
        kioskLogger.session(`🎭 Tool manage_session_state traité`, 'info')
        
        if (dataChannel.readyState === 'open') {
          const resultEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: call_id,
              output: JSON.stringify(result)
            }
          }
          
          dataChannel.send(JSON.stringify(resultEvent))
          kioskLogger.session(`📤 Résultat tool envoyé au model`, 'info')
          
          setTimeout(() => {
            if (dataChannel.readyState === 'open') {
              dataChannel.send(JSON.stringify({ type: 'response.create' }))
              kioskLogger.session(`🎯 Demande réponse avec message tool`, 'info')
              
              if (result.session_control?.end_session) {
                kioskLogger.session(`👋 Fermeture programmée après réponse JARVIS`, 'info')
                setTimeout(() => {
                  kioskLogger.session(`🔚 Fermeture session après message d'au revoir`, 'info')
                  config.onError?.('GOODBYE_DETECTED')
                }, 4000)
              }
            }
          }, 100)
        }
        return
      }
      
      // Renvoyer le résultat au model
      if (dataChannel.readyState === 'open') {
        const resultEvent = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call_id,
            output: JSON.stringify(result)
          }
        }
        
        dataChannel.send(JSON.stringify(resultEvent))
        kioskLogger.session(`📤 Résultat tool envoyé au model`, 'info')
        
        setTimeout(() => {
          if (dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'response.create' }))
            kioskLogger.session(`🎯 Nouvelle réponse demandée au model`, 'info')
          }
        }, 100)
      }
      
    } catch (error: any) {
      kioskLogger.session(`❌ Erreur function call ${name}: ${error.message}`, 'error')
      
      if (dataChannel.readyState === 'open') {
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
        
        dataChannel.send(JSON.stringify(errorEvent))
        
        setTimeout(() => {
          if (dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'response.create' }))
          }
        }, 100)
      }
    }
  }, [config])

  // Core WebRTC (réutilisable)
  const core = useVoiceRealtimeCore({
    sessionFactory: {
      createSession: async () => {
        if (!sessionFactory.current) {
          throw new Error('Session factory non initialisée')
        }
        kioskLogger.session('📡 Création session OpenAI...', 'info')
        const session = await sessionFactory.current.createSession()
        sessionRef.current = { session_id: session.session_id }
        kioskLogger.session(`✅ Session créée: ${session.session_id}`, 'success')
        config.onSessionCreated?.(session.session_id, config.memberId, config.gymSlug)
        return session
      }
    },
    audioConfig: {
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    context: 'production',
    onStatusChange: (status) => {
      config.onStatusChange?.(status)
    },
    onActivity: () => {
      // Réinitialiser timeout à chaque activité
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }
      // Réinitialiser le timeout si connecté
      if (core.isConnected) {
        inactivityTimeoutRef.current = setTimeout(() => {
          kioskLogger.session('⏰ Timeout inactivité - Fermeture session', 'info')
          disconnectRef.current?.()
          config.onError?.('INACTIVITY_TIMEOUT')
        }, INACTIVITY_TIMEOUT_MS)
      }
    },
    onSpeechStarted: () => {
      // 🎙️ INJECTER ÉVÉNEMENT REALTIME
      if (currentMemberRef.current && sessionRef.current) {
        realtimeClientInjector.injectUserSpeechStart(
          sessionRef.current.session_id,
          currentMemberRef.current.gym_id,
          currentMemberRef.current.id
        )
      }
    },
    onSpeechStopped: () => {
      // 🎙️ INJECTER ÉVÉNEMENT REALTIME
      if (currentMemberRef.current && sessionRef.current) {
        realtimeClientInjector.injectUserSpeechEnd(
          sessionRef.current.session_id,
          currentMemberRef.current.gym_id,
          currentMemberRef.current.id
        )
      }
    },
    onTranscriptUpdate: (transcript, isFinal) => {
      setAudioState(prev => ({ 
        ...prev, 
        transcript,
        isFinal: isFinal ?? true 
      }))
      config.onTranscriptUpdate?.(transcript, isFinal ?? true)
      
      // 🎙️ INJECTER TRANSCRIPT UTILISATEUR DANS REALTIME
      if (transcript.trim() && currentMemberRef.current && sessionRef.current) {
        realtimeClientInjector.injectUserTranscript(
          sessionRef.current.session_id,
          currentMemberRef.current.gym_id,
          currentMemberRef.current.id,
          transcript,
          1.0 // confidence_score par défaut
        )
      }
    },
    onError: (error) => {
      kioskLogger.session(`❌ Erreur: ${error.message}`, 'error')
      config.onError?.(error.message)
    },
    onAudioStateChange: (state: VoiceAudioState) => {
      setAudioState(prev => ({
        ...prev,
        isListening: state.isListening ?? prev.isListening,
        isPlaying: state.isPlaying ?? prev.isPlaying,
        transcript: state.transcript ?? prev.transcript,
        isFinal: state.isFinal ?? prev.isFinal
      }))
    },
    onFunctionCall: (call, dataChannel) => {
      handleFunctionCall(call, dataChannel)
    },
    onSessionCreated: (sessionId) => {
      sessionRef.current = { session_id: sessionId }
      // 🎙️ INJECTER ÉVÉNEMENTS REALTIME pour tracking
      if (currentMemberRef.current) {
        // Les événements seront injectés dans onStatusChange/onTranscriptUpdate
      }
    }
  })

  // Réinitialiser timeout quand connexion établie
  useEffect(() => {
    if (core.isConnected) {
      // Réinitialiser le timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }
      inactivityTimeoutRef.current = setTimeout(() => {
        kioskLogger.session('⏰ Timeout inactivité - Fermeture session', 'info')
        disconnectRef.current?.()
        config.onError?.('INACTIVITY_TIMEOUT')
      }, INACTIVITY_TIMEOUT_MS)
    } else {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }
    }
  }, [core.isConnected, config])

  // Gérer fermeture session serveur (spécifique kiosk)
  const disconnectWithCleanup = useCallback(async () => {
    // Nettoyer timeout immédiatement
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
    try {
      kioskLogger.session('🔌 Déconnexion session...', 'info')

      // Nettoyer timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }

      // Fermer session serveur
      if (sessionRef.current) {
        const sessionId = sessionRef.current.session_id
        
        const dataChannel = core.getDataChannel()
        if (dataChannel && dataChannel.readyState === 'open') {
          try {
            const closeEvent = {
              type: 'session.update',
              session: {
                turn_detection: null
              }
            }
            dataChannel.send(JSON.stringify(closeEvent))
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (dcError) {
            console.log('⚠️ [DISCONNECT] Erreur envoi événement fermeture:', dcError)
          }
        }

        await fetch('/api/voice/session/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionId: sessionId,
            reason: 'user_disconnect'
          })
        }).catch(() => {})

        // ✅ Nettoyer contexte session du store sécurisé
        const { sessionContextStore } = await import('@/lib/voice/session-context-store')
        sessionContextStore.delete(sessionId)

        sessionRef.current = null
      }

      // Déconnecter core
      await core.disconnect()

      // Réinitialiser états
      setAudioState({
        isListening: false,
        isPlaying: false,
        volume: 0,
        transcript: '',
        isFinal: false
      })

      kioskLogger.session('✅ Déconnexion terminée', 'success')
      
    } catch (error: any) {
      kioskLogger.session(`❌ Erreur déconnexion: ${error.message}`, 'error')
    }
  }, [core])

  // Stocker la fonction de déconnexion dans la ref
  useEffect(() => {
    disconnectRef.current = disconnectWithCleanup
  }, [disconnectWithCleanup])

  // 🧹 CLEANUP AU DÉMONTAGE
  useEffect(() => {
    return () => {
      disconnectWithCleanup()
    }
  }, [disconnectWithCleanup])

  // Retourner interface identique à l'original
  return {
    // États
    status: core.status,
    isConnected: core.isConnected,
    audioState,
    
    // Actions
    connect: core.connect,
    disconnect: disconnectWithCleanup,
    
    // Utilitaires
    resetInactivityTimeout,
    
    // Propriétés manquantes (pour compatibilité avec VoiceInterface.tsx)
    currentTranscript: audioState.transcript,
    connectionQuality: undefined, // Non implémenté pour l'instant
    reconnectAttempts: 0, // Non implémenté pour l'instant
    sendTextMessage: () => {
      console.warn('sendTextMessage non implémenté')
    },
    forceReconnect: async () => {
      await disconnectWithCleanup()
      await new Promise(resolve => setTimeout(resolve, 1000))
      await core.connect()
    },
    getCurrentSessionId: () => sessionRef.current?.session_id
  }
}

