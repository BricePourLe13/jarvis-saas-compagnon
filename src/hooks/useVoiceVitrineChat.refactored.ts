/**
 * 🎙️ HOOK VOICE VITRINE CHAT (REFACTORED)
 * 
 * Version refactorée utilisant useVoiceRealtimeCore
 * 
 * ⚠️ FICHIER TEMPORAIRE POUR VALIDATION
 * Une fois validé, remplacer useVoiceVitrineChat.ts
 */

"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { executeJarvisFunction } from '@/lib/jarvis-expert-functions'
import { useVoiceRealtimeCore } from '@/lib/voice/useVoiceRealtimeCore'
import { VitrineSessionFactory } from '@/lib/voice/voice-session-factory'

interface VoiceVitrineConfig {
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error') => void
  onTranscriptUpdate?: (transcript: string) => void
  maxDuration?: number // en secondes
}

export function useVoiceVitrineChat({
  onStatusChange,
  onTranscriptUpdate,
  maxDuration = 300 // 5 minutes par défaut
}: VoiceVitrineConfig) {
  // États locaux (spécifiques vitrine)
  const [error, setError] = useState<string | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [resetTime, setResetTime] = useState<Date | null>(null) // ✅ Pour afficher quand la limite se réinitialise
  
  // Refs pour timeout et session
  const sessionStartTimeRef = useRef<number | null>(null)
  const maxDurationRef = useRef(maxDuration)
  const sessionFactoryRef = useRef<VitrineSessionFactory | null>(null)

  // Initialiser factory
  useEffect(() => {
    sessionFactoryRef.current = new VitrineSessionFactory()
  }, [])

  // Mettre à jour maxDuration
  useEffect(() => {
    maxDurationRef.current = maxDuration
  }, [maxDuration])

  // 🎯 Handler pour les function calls (ROI, success stories, etc.)
  const handleFunctionCall = useCallback(async (
    call: { call_id: string; name: string; arguments: string },
    dataChannel: RTCDataChannel
  ) => {
    try {
      const { call_id, name, arguments: argsString } = call
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
      if (call.call_id) {
        dataChannel.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call.call_id,
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

  // Core WebRTC (réutilisable)
  const core = useVoiceRealtimeCore({
    sessionFactory: {
      createSession: async () => {
        if (!sessionFactoryRef.current) {
          throw new Error('Session factory non initialisée')
        }
        try {
          const sessionData = await sessionFactoryRef.current.createSession()
          // VitrineSessionFactory retourne déjà la session correctement formatée
          return sessionData
        } catch (error: any) {
          // Gérer les erreurs de limitation spécifiques à la vitrine
          if (error.hasActiveSession) {
            const err: any = new Error('Session déjà active')
            err.hasActiveSession = true
            throw err
          } else if (error.remainingCredits === 0) {
            const err: any = new Error('Temps de démo épuisé')
            err.remainingCredits = 0
            throw err
          } else if (error.isBlocked) {
            const err: any = new Error('IP bloquée')
            err.isBlocked = true
            throw err
          }
          throw error
        }
      }
    },
    audioConfig: {
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      latency: 0.01,
      volume: 1.0
    },
    context: 'vitrine',
    onStatusChange: (status) => {
      onStatusChange?.(status)
      
      // Gérer isAISpeaking
      if (status === 'speaking') {
        setIsAISpeaking(true)
      } else if (status === 'connected' || status === 'listening') {
        setIsAISpeaking(false)
      }
    },
    onTranscriptUpdate: (transcript) => {
      setCurrentTranscript(transcript)
      onTranscriptUpdate?.(transcript)
    },
    onError: (error) => {
      const errorMessage = error.message
      setError(errorMessage)
      // Si l'erreur contient resetTime, le stocker pour affichage
      if ((error as any).resetTime) {
        setResetTime(new Date((error as any).resetTime))
      }
      onStatusChange?.('error')
    },
    onFunctionCall: (call, dataChannel) => {
      handleFunctionCall(call, dataChannel)
    },
    onSessionCreated: (sessionId) => {
      sessionStartTimeRef.current = Date.now()
    }
  })

  // Gérer timeout de session (spécifique vitrine)
  useEffect(() => {
    if (!core.isConnected || !sessionStartTimeRef.current) return

    const checkTimeout = () => {
      if (sessionStartTimeRef.current) {
        const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000
        if (elapsed >= maxDurationRef.current) {
          core.disconnect()
        }
      }
    }

    const interval = setInterval(checkTimeout, 1000)
    return () => clearInterval(interval)
  }, [core.isConnected, core])

  // Gérer déconnexion avec comptabilisation durée (spécifique vitrine)
  const disconnectWithCleanup = useCallback(async () => {
    try {
      // 🔒 Comptabiliser le temps de session
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
      
      // Déconnecter core
      await core.disconnect()
      
      // Réinitialiser états
      setError(null)
      setCurrentTranscript('')
      setIsAISpeaking(false)
      setResetTime(null)
      sessionStartTimeRef.current = null
      
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    }
  }, [core])

  // 🧹 CLEANUP AU DÉMONTAGE
  useEffect(() => {
    return () => {
      disconnectWithCleanup()
    }
  }, [disconnectWithCleanup])

  // Ref pour stocker les données de session (remainingCredits)
  const sessionDataRef = useRef<{ remainingCredits?: number } | null>(null)

  // Connexion avec gestion erreurs spécifiques vitrine
  const connect = useCallback(async () => {
    if (core.isConnected) return sessionDataRef.current || {}
    
    setError(null)
    onStatusChange?.('connecting')
    
    try {
      // Créer session via factory pour récupérer remainingCredits AVANT connexion core
      if (!sessionFactoryRef.current) {
        throw new Error('Session factory non initialisée')
      }
      
      // Créer session et récupérer données (incluant remainingCredits)
      const sessionData = await sessionFactoryRef.current.createSession()
      sessionDataRef.current = { remainingCredits: (sessionData as any).remainingCredits }
      
      // Connecter core (il utilisera la session déjà créée via la factory)
      // Note: Le core va recréer la session via la factory, mais c'est OK car
      // la factory gère le cache côté serveur
      await core.connect()
      
      // Retourner les données de session (pour remainingCredits)
      return sessionDataRef.current || {}
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      
      // Gérer les erreurs spécifiques vitrine
      if (error.hasActiveSession) {
        const err: any = new Error('Session déjà active. Fermez les autres onglets.')
        err.hasActiveSession = true
        err.remainingCredits = error.remainingCredits
        throw err
      } else if (error.isBlocked) {
        const err: any = new Error('Accès bloqué. Contactez-nous si vous pensez qu\'il s\'agit d\'une erreur.')
        err.isBlocked = true
        throw err
      } else if (error.message?.includes('Limite quotidienne') || error.message?.includes('Limite totale') || error.statusCode === 429) {
        // Erreur de limite (quotidienne ou totale)
        const err: any = new Error(error.message || 'Limite d\'utilisation atteinte')
        err.remainingCredits = error.remainingCredits || 0
        err.resetTime = error.resetTime
        err.isLimitReached = true
        setResetTime(error.resetTime ? new Date(error.resetTime) : null)
        throw err
      } else if (error.remainingCredits === 0) {
        const err: any = new Error('Temps de démo épuisé')
        err.remainingCredits = 0
        throw err
      }
      
      // Erreur générique - propager le message d'erreur de l'API
      const errorMessage = error.message || error.error || 'Erreur de connexion'
      const err: any = new Error(errorMessage)
      err.remainingCredits = error.remainingCredits
      err.resetTime = error.resetTime
      onStatusChange?.('error')
      throw err
    }
  }, [core.isConnected, core, onStatusChange])

  // Retourner interface identique à l'original
  return {
    // États
    isConnected: core.isConnected,
    error,
    currentTranscript,
    isAISpeaking,
    
    // Actions
    connect,
    disconnect: disconnectWithCleanup
  }
}

