"use client"
import { useState, useEffect, useRef } from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { GymMember } from '@/types/kiosk'
import AudioVisualizer from './AudioVisualizer'
import Avatar3D from './Avatar3D'

interface VoiceInterfaceProps {
  gymSlug: string
  currentMember?: GymMember | null
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

export default function VoiceInterface({
  gymSlug,
  currentMember,
  isActive,
  onActivate,
  onDeactivate
}: VoiceInterfaceProps) {
  
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // PROTECTION : État pour éviter les re-déclenchements
  const hasConnectedRef = useRef(false)
  const previousStatusRef = useRef<string>('idle')
  
  // Effets sonores
  const { sounds, hapticFeedback } = useSoundEffects({ enabled: true, volume: 0.2 })
  
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
    // 🔧 BUGFIX: Passer directement les données membre pour contourner le getMemberData hardcodé
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
    onStatusChange: (newStatus) => {
      console.log('[VOICE UI] Status:', newStatus)
      
      // Jouer les sons selon les changements de statut
      const prevStatus = previousStatusRef.current
      
      if (newStatus === 'connected' && prevStatus === 'connecting') {
        sounds.connect()
        hapticFeedback('light')
      } else if (newStatus === 'listening' && prevStatus !== 'listening') {
        sounds.startListening()
        hapticFeedback('light')
      } else if (newStatus === 'connected' && prevStatus === 'listening') {
        sounds.stopListening()
      } else if (newStatus === 'speaking' && prevStatus !== 'speaking') {
        sounds.startSpeaking()
        hapticFeedback('medium')
      } else if (newStatus === 'error') {
        sounds.error()
        hapticFeedback('heavy')
      } else if (newStatus === 'reconnecting') {
        sounds.notification()
      }
      
      previousStatusRef.current = newStatus
    },
    onTranscriptUpdate: (text, isFinal) => {
      setTranscript(text)
      if (isFinal) {
        sounds.notification()
      }
    },
    onError: (errorMessage) => {
      setError(errorMessage)
      sounds.error()
      hapticFeedback('heavy')
      setTimeout(() => setError(null), 8000)
    }
  })

  // Gérer l'activation/désactivation AVEC PROTECTION SIMPLIFIÉE
  useEffect(() => {
    if (isActive && !isConnected && !hasConnectedRef.current && status !== 'connecting' && status !== 'reconnecting') {
      console.log('[VOICE UI] 🚀 Connexion demandée')
      hasConnectedRef.current = true
      connect().catch(() => {
        hasConnectedRef.current = false
      })
    } else if (!isActive && isConnected) {
      console.log('[VOICE UI] 🔌 Déconnexion demandée')
      sounds.disconnect()
      disconnect()
      hasConnectedRef.current = false
    }
  }, [isActive, isConnected, connect, disconnect, status, sounds])

  // Reset si la connexion se ferme
  useEffect(() => {
    if (!isConnected && hasConnectedRef.current) {
      hasConnectedRef.current = false
    }
  }, [isConnected])

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connexion...'
      case 'reconnecting': return 'Reconnexion...'
      case 'connected': return 'Prêt à vous écouter'
      case 'listening': return 'Je vous écoute'
      case 'speaking': return 'En cours de réponse'
      case 'error': return 'Erreur de connexion'
      default: return 'Cliquez pour commencer'
    }
  }

  const handleToggleVoice = () => {
    if (status === 'connecting' || status === 'reconnecting' || hasConnectedRef.current) {
      return
    }
    
    sounds.click()
    hapticFeedback('light')
    
    if (isActive) {
      onDeactivate()
    } else {
      onActivate()
    }
  }

  const handleHover = (hovered: boolean) => {
    if (hovered && status !== 'connecting' && status !== 'reconnecting') {
      sounds.hover()
      hapticFeedback('light')
    }
  }

  // Mapper le status pour l'avatar
  const getAvatarStatus = () => {
    switch (status) {
      case 'connecting':
      case 'reconnecting':
        return 'connecting'
      case 'listening':
        return 'listening'
      case 'speaking':
        return 'speaking'
      case 'error':
        return 'thinking' // Utiliser thinking pour l'état d'erreur
      default:
        return 'idle'
    }
  }

  return (
    <VStack spacing={8} align="center" w="full" position="relative">
      {/* Message d'erreur ultra-minimal */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20
            }}
          >
            <Box
              bg="rgba(220, 38, 38, 0.1)"
              border="1px solid rgba(220, 38, 38, 0.3)"
              borderRadius="full"
              px={3}
              py={1}
              backdropFilter="blur(10px)"
            >
              <Text color="red.300" fontSize="xs" fontWeight="400">
                Erreur
              </Text>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* L'AVATAR 3D PRINCIPAL - Statique */}
      <Box position="relative">
        <motion.div
          onClick={handleToggleVoice}
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
          whileHover={{ 
            scale: (status === 'connecting' || status === 'reconnecting') ? 1 : 1.02,
            transition: { duration: 0.3 }
          }}
          whileTap={{ 
            scale: (status === 'connecting' || status === 'reconnecting') ? 1 : 0.98,
            transition: { duration: 0.1 }
          }}
          style={{
            cursor: (status === 'connecting' || status === 'reconnecting') ? "wait" : "pointer"
          }}
        >
          <Avatar3D 
            status={getAvatarStatus()}
            size={400}
          />
        </motion.div>

        {/* Visualiseur audio ultra-discret */}
        <Box position="absolute" bottom="-30px" left="50%" transform="translateX(-50%)">
          <AudioVisualizer
            isActive={isConnected}
            isListening={status === 'listening'}
            isSpeaking={status === 'speaking'}
            color={status === 'listening' ? '#22c55e' : status === 'speaking' ? '#3b82f6' : '#6366f1'}
            size="sm"
            style="bars"
          />
        </Box>
      </Box>

      {/* Transcript minimal - Seulement si parlé */}
      <AnimatePresence>
        {transcript && isActive && status === 'listening' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <Box
              bg="rgba(255,255,255,0.03)"
              borderRadius="md"
              p={2}
              maxW="300px"
              border="1px solid rgba(255,255,255,0.08)"
              backdropFilter="blur(20px)"
            >
              <Text fontSize="xs" color="rgba(255,255,255,0.6)" fontStyle="italic" textAlign="center">
                "{transcript}"
              </Text>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </VStack>
  )
} 