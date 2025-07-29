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

  // 👋 DÉTECTION "AU REVOIR" utilisateur pour fermeture forcée - VERSION CORRIGÉE
  const lastGoodbyeRef = useRef<string>('')
  
  useEffect(() => {
    if (currentTranscript && isConnected) {
      const transcript = currentTranscript.toLowerCase().trim()
      
      // Éviter les redéclenchements sur le même transcript
      if (transcript === lastGoodbyeRef.current) return
      
      if (transcript === 'au revoir' || 
          transcript === 'au revoir.' ||
          transcript.endsWith(' au revoir') ||
          transcript.endsWith(' au revoir.')) {
        
        lastGoodbyeRef.current = transcript
        console.log('👋 [USER GOODBYE] Utilisateur a dit "Au revoir", fermeture session...')
        
        // Fermeture immédiate et propre
        disconnect()
        onDeactivate()
      }
    }
  }, [currentTranscript, isConnected, disconnect, onDeactivate])
  
  // Nettoyer la référence quand déconnecté
  useEffect(() => {
    if (!isConnected) {
      lastGoodbyeRef.current = ''
    }
  }, [isConnected])

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