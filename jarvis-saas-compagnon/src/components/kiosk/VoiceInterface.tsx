"use client"
import { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Button, Text, VStack, HStack, Spinner } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '@/hooks/useVoiceChat'
// import { useGoodbyeDetection } from '@/hooks/useGoodbyeDetection' // 🗑️ SUPPRIMÉ
import AudioVisualizer from './AudioVisualizer'
// import { whisperParallelTracker } from '@/lib/whisper-parallel-tracker' // 🗑️ SUPPRIMÉ
import { kioskLogger } from '@/lib/kiosk-logger'

interface VoiceInterfaceProps {
  gymSlug: string
  currentMember: any
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void
}

export default function VoiceInterface({ 
  gymSlug, 
  currentMember, 
  isActive, 
  onActivate, 
  onDeactivate,
  onTranscriptUpdate 
}: VoiceInterfaceProps) {

  const {
    audioState,
    isConnected,
    status,
    currentTranscript,
    connectionQuality,
    reconnectAttempts,
    connect,
    disconnect,
    sendTextMessage,
    forceReconnect,
    getCurrentSessionId
  } = useVoiceChat({
    gymSlug,
    memberId: currentMember?.id,
    language: currentMember?.member_preferences?.language || 'fr',
    memberData: currentMember ? {
      first_name: currentMember.first_name,
      last_name: currentMember.last_name,
      member_preferences: {
        goals: currentMember.member_preferences?.goals || [],
        favorite_activities: currentMember.member_preferences?.favorite_activities || [],
      },
      last_visit: currentMember.last_visit || '',
      membership_type: currentMember.membership_type,
      total_visits: currentMember.total_visits
    } : undefined,
    onStatusChange: useCallback((newStatus) => {
      console.log('[VOICE UI] Status:', newStatus)
    }, []),
    onTranscriptUpdate: useCallback((text, isFinal) => {
      onTranscriptUpdate?.(text, isFinal)
    }, [onTranscriptUpdate]),
    onError: useCallback((errorMessage) => {
      if (errorMessage === 'GOODBYE_DETECTED') {
        // 🎯 Au revoir détecté via OpenAI transcript
        kioskLogger.session('Au revoir détecté via OpenAI transcript', 'info')
        onDeactivate() // Désactiver le membre
      } else {
        console.error('Voice error:', errorMessage)
      }
    }, [onDeactivate])
  })

  // ✅ NOUVEAU: Activation directe du microphone
  useEffect(() => {
    if (isActive && !isConnected && status !== 'connecting' && currentMember) {
      console.log('🎤 Activation directe du microphone pour:', currentMember.first_name)
      connect()
    }
  }, [isActive, isConnected, status, connect, currentMember])

  useEffect(() => {
    if (!isActive && isConnected) {
      disconnect().catch(console.error)
    }
  }, [isActive, isConnected, disconnect])

  // 🎯 Configurer l'intercepteur quand la connexion est établie
  useEffect(() => {
    if (status === 'connected' && currentMember && getCurrentSessionId) {
      const sessionId = getCurrentSessionId()
      if (sessionId) {
        // Configuration du logger avec session
        kioskLogger.setSession(sessionId, currentMember.first_name || 'Membre')
        kioskLogger.session('Connexion WebRTC établie', 'success')
        
        // 🎙️ [OPENAI REALTIME] Tout est intégré dans OpenAI maintenant !
        kioskLogger.tracking('Session OpenAI configurée avec transcripts USER + IA', 'success', { sessionId: sessionId.slice(-6) })
      }
    }
  }, [status, currentMember, getCurrentSessionId])

  // 🎯 DÉTECTION "AU REVOIR" VIA OPENAI TRANSCRIPTS (plus de Speech Recognition)
  const handleGoodbyeDetected = useCallback(async () => {
    kioskLogger.session('Au revoir détecté - Fermeture session', 'info')
    try {
      const sessionId = getCurrentSessionId?.()
      if (sessionId) {
        // Fermer côté serveur (idempotent)
        await fetch('/api/voice/session/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, reason: 'user_goodbye' }),
          keepalive: true
        }).catch(() => {})
      }
    } finally {
      // Déconnecter et empêcher reconnexion automatique
      await disconnect()
    }
    // IMPORTANT: Désactiver le membre pour empêcher reconnexion
    onDeactivate()
  }, [disconnect, onDeactivate, getCurrentSessionId])

  // 🗑️ SPEECH RECOGNITION SUPPRIMÉ - Detection via OpenAI transcripts maintenant
  
  // 🎯 [OPENAI REALTIME] Détection "au revoir" via transcripts OpenAI intégrée dans useVoiceChat

  const getJarvisStatus = () => {
    switch (status) {
      case 'connecting': return 'Connexion...'
      case 'connected': return 'JARVIS vous écoute'
      case 'listening': return 'Je vous écoute...'
      case 'speaking': return 'Je réponds...'
      case 'error': return 'Erreur'
      default: return 'Initialisation...'
    }
  }

  if (!isActive) {
    return null
  }

  return (
    <Box position="relative">
      {/* Interface principale */}
      <VStack spacing={4}>
        {isConnected && (
          <HStack spacing={4}>
            <AudioVisualizer 
              isActive={isConnected}
              isListening={status === 'listening'}
              isSpeaking={status === 'speaking'}
              color={status === 'listening' ? '#22c55e' : status === 'speaking' ? '#3b82f6' : '#6366f1'}
              size="sm"
              style="bars"
            />
            <VStack spacing={1} align="start">
              <Text color="white" fontSize="sm">
                Status: {getJarvisStatus()}
              </Text>
              {/* 🎯 [OPENAI REALTIME] Détection "au revoir" intégrée */}
              <Text 
                color="green.300" 
                fontSize="xs" 
                display="flex" 
                alignItems="center" 
                gap={1}
              >
                🎯 Détection "au revoir" via OpenAI Realtime
              </Text>
            </VStack>
          </HStack>
        )}
        
        {currentTranscript && (
          <Text color="white" fontSize="sm" bg="rgba(0,0,0,0.5)" p={2} borderRadius="md">
            "{currentTranscript}"
          </Text>
        )}
        
        {status === 'connecting' && (
          <VStack spacing={2}>
            <Text color="blue.300" fontSize="sm" textAlign="center">
              🎤 Connexion à JARVIS...
            </Text>
            <HStack spacing={1}>
              <Spinner size="xs" color="blue.400" />
              <Text color="blue.400" fontSize="xs">
                Initialisation de l'IA
              </Text>
            </HStack>
          </VStack>
        )}
        
        {!isConnected && status !== 'connecting' && status !== 'error' && (
          <Text color="gray.400" fontSize="sm" textAlign="center">
            Prêt à se connecter...
          </Text>
        )}
        
        {status === 'error' && (
          <VStack spacing={2}>
            <Text color="red.300" fontSize="sm" textAlign="center">
              ❌ Erreur de connexion audio
            </Text>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={forceReconnect}
            >
              🔄 Réessayer
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  )
} 