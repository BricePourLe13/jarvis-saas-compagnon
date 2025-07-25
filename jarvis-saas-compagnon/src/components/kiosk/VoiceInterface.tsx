"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { GymMember } from '@/types/kiosk'
import AudioVisualizer from './AudioVisualizer'
// Avatar3D retiré pour éviter la duplication avec la page principale

interface VoiceInterfaceProps {
  gymSlug: string
  currentMember?: GymMember | null
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
  
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // PROTECTION : État pour éviter les re-déclenchements
  const hasConnectedRef = useRef(false)
  const previousStatusRef = useRef<string>('idle')
  
  // Effets sonores
  const { sounds, hapticFeedback } = useSoundEffects({ enabled: false, volume: 0.2 })
  
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
    onStatusChange: useCallback((newStatus) => {
      console.log('[VOICE UI] Status:', newStatus)
      
      // Jouer les sons selon les changements de statut
      const prevStatus = previousStatusRef.current
      
      if (newStatus === 'connected' && prevStatus === 'connecting') {
        // sounds.connect() - SUPPRIMÉ (trop gênant)
        hapticFeedback('light')
      } else if (newStatus === 'listening' && prevStatus !== 'listening') {
        // sounds.startListening() - SUPPRIMÉ (trop gênant)
        hapticFeedback('light')
      } else if (newStatus === 'connected' && prevStatus === 'listening') {
        // sounds.stopListening() - SUPPRIMÉ (trop gênant)
      } else if (newStatus === 'speaking' && prevStatus !== 'speaking') {
        // sounds.startSpeaking() - SUPPRIMÉ (trop gênant)
        hapticFeedback('medium')
      } else if (newStatus === 'error') {
        sounds.error() // Gardé - utile pour debug
        hapticFeedback('heavy')
      } else if (newStatus === 'reconnecting') {
        // sounds.notification() - SUPPRIMÉ (trop gênant)
      }
      
      previousStatusRef.current = newStatus
    }, [sounds, hapticFeedback]), // Mémorisé pour éviter boucle infinie
    onTranscriptUpdate: useCallback((text, isFinal) => {
      setTranscript(text)
      if (isFinal) {
        // sounds.notification() - SUPPRIMÉ (trop gênant)
      }
      
      // Notifier la page parente pour détection d'intention
      onTranscriptUpdate?.(text, isFinal)
    }, [onTranscriptUpdate]), // Inclure onTranscriptUpdate dans les dépendances
    onError: useCallback((errorMessage) => {
      setError(errorMessage)
      sounds.error()
      hapticFeedback('heavy')
      setTimeout(() => setError(null), 8000)
    }, [sounds, hapticFeedback]) // Mémorisé pour éviter boucle infinie
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
      // sounds.disconnect() - SUPPRIMÉ (trop gênant)
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

  const getButtonBackground = () => {
    switch (status) {
      case 'connecting': return 'linear-gradient(135deg, #f59e0b, #d97706)'
      case 'reconnecting': return 'linear-gradient(135deg, #f59e0b, #d97706)'
      case 'connected': return 'linear-gradient(135deg, #6366f1, #4f46e5)'
      case 'listening': return 'linear-gradient(135deg, #22c55e, #16a34a)'
      case 'speaking': return 'linear-gradient(135deg, #3b82f6, #2563eb)'
      case 'error': return 'linear-gradient(135deg, #ef4444, #dc2626)'
      default: return 'linear-gradient(135deg, #6b7280, #4b5563)'
    }
  }

  const getButtonShadow = () => {
    switch (status) {
      case 'listening': return '0 0 30px rgba(34, 197, 94, 0.4)'
      case 'speaking': return '0 0 30px rgba(59, 130, 246, 0.4)'
      case 'error': return '0 0 30px rgba(239, 68, 68, 0.4)'
      default: return '0 8px 25px rgba(0, 0, 0, 0.15)'
    }
  }

  const getButtonIcon = () => {
    switch (status) {
      case 'connecting': return '⏳'
      case 'reconnecting': return '🔄'
      case 'connected': return '🎤'
      case 'listening': return '👂'
      case 'speaking': return '💬'
      case 'error': return '❌'
      default: return '▶️'
    }
  }

  const handleToggleVoice = () => {
    if (status === 'connecting' || status === 'reconnecting' || hasConnectedRef.current) {
      return
    }
    
    // sounds.click() - SUPPRIMÉ (trop gênant)
    hapticFeedback('light')
    
    if (isActive) {
      onDeactivate()
    } else {
      onActivate()
    }
  }

  const handleHover = (hovered: boolean) => {
    if (hovered && status !== 'connecting' && status !== 'reconnecting') {
      // sounds.hover() - SUPPRIMÉ (trop gênant)
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
          {/* Interface simplifiée sans Avatar3D pour éviter la duplication */}
          <Box
            width="120px"
            height="120px"
            borderRadius="50%"
            bg={getButtonBackground()}
            border="3px solid rgba(255, 255, 255, 0.2)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={getButtonShadow()}
          >
            <Text fontSize="3xl" color="white">
              {getButtonIcon()}
            </Text>
          </Box>
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