"use client"
import { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Button, Text, VStack, HStack, Spinner } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import AudioVisualizer from './AudioVisualizer'

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
    forceReconnect
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
      console.error('Voice error:', errorMessage)
    }, [])
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
      disconnect()
    }
  }, [isActive, isConnected, disconnect])

  // 👋 DÉTECTION "AU REVOIR" utilisateur - VERSION ULTRA PRÉCISE
  const lastGoodbyeRef = useRef<string>('')
  const goodbyeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const jarvisSpeakingRef = useRef(false)
  
  // Tracker quand JARVIS parle pour éviter faux positifs
  useEffect(() => {
    jarvisSpeakingRef.current = status === 'speaking'
  }, [status])
  
  useEffect(() => {
    if (currentTranscript && isConnected && !jarvisSpeakingRef.current) {
      const transcript = currentTranscript.toLowerCase().trim()
      
      // Éviter les redéclenchements sur le même transcript
      if (transcript === lastGoodbyeRef.current) return
      
      // ✅ DÉTECTION ULTRA STRICTE - UNIQUEMENT utilisateur qui dit exactement "au revoir"
      const isExactGoodbye = (
        transcript === 'au revoir' || 
        transcript === 'au revoir.' ||
        transcript === 'au revoir !' ||
        transcript === 'au revoir jarvis' ||
        transcript === 'au revoir jarvis.' ||
        transcript === 'au revoir merci'
      )
      
      // ❌ EXCLUSIONS STRICTES - Ne JAMAIS fermer si:
      const shouldIgnore = (
        jarvisSpeakingRef.current ||           // JARVIS parle actuellement
        status === 'speaking' ||              // Status speaking actif
        transcript.length > 15 ||             // Phrase trop longue (réduit à 15)
        transcript.includes('vous') ||         // Contient "vous" (politesse JARVIS)
        transcript.includes('bonne') ||        // "Bonne journée"
        transcript.includes('à bientôt') ||    // "À bientôt"
        transcript.includes('souhaite') ||     // "Je vous souhaite"
        transcript.includes('journée') ||      // "Bonne journée"
        transcript.includes('sport') ||        // "Bon sport" ← CRITICAL !
        transcript.includes('séance') ||       // "Bonne séance"
        transcript.includes('entraînement') || // "Bon entraînement"
        transcript.includes('a plus') ||       // "A plus" ← AJOUTER !
        transcript.includes('à plus') ||       // "À plus" ← AJOUTER !
        transcript.includes('plus !') ||       // "plus !" ← AJOUTER !
        transcript.includes('bon ') ||         // "bon " ← AJOUTER !
        transcript.startsWith('a ') ||         // Commence par "a " ← AJOUTER !
        transcript.startsWith('à ')            // Commence par "à " ← AJOUTER !
      )
      
      if (isExactGoodbye && !shouldIgnore) {
        lastGoodbyeRef.current = transcript
        console.log('👋 [USER GOODBYE] Détection stricte "Au revoir":', transcript)
        console.log('👋 [USER GOODBYE] Status actuel:', status)
        console.log('👋 [USER GOODBYE] JARVIS speaking:', jarvisSpeakingRef.current)
        
        // ✅ DÉLAI DE GRÂCE de 3 secondes pour éviter fermetures accidentelles
        if (goodbyeTimeoutRef.current) {
          clearTimeout(goodbyeTimeoutRef.current)
        }
        
        goodbyeTimeoutRef.current = setTimeout(() => {
          // Double vérification avant fermeture
          if (!jarvisSpeakingRef.current && status !== 'speaking') {
            console.log('👋 [USER GOODBYE] Fermeture session confirmée')
            disconnect()
            onDeactivate()
          } else {
            console.log('👋 [USER GOODBYE] Fermeture annulée - JARVIS parle encore')
          }
        }, 3000)
      } else if (isExactGoodbye && shouldIgnore) {
        console.log('👋 [USER GOODBYE] Détection ignorée (JARVIS response):', transcript)
      }
    }
  }, [currentTranscript, isConnected, disconnect, onDeactivate])
  
  // Nettoyer la référence quand déconnecté
  useEffect(() => {
    if (!isConnected) {
      lastGoodbyeRef.current = ''
      if (goodbyeTimeoutRef.current) {
        clearTimeout(goodbyeTimeoutRef.current)
        goodbyeTimeoutRef.current = null
      }
    }
  }, [isConnected])
  
  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      if (goodbyeTimeoutRef.current) {
        clearTimeout(goodbyeTimeoutRef.current)
      }
    }
  }, [])

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
            <Text color="white" fontSize="sm">
              Status: {getJarvisStatus()}
            </Text>
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