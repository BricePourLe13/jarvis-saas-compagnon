"use client"
import { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Button, Text, VStack, HStack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import AudioVisualizer from './AudioVisualizer'

interface VoiceInterfaceProps {
  gymSlug: string
  currentMember: any
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onTranscriptUpdate?: (transcript: string) => void
}

// ✅ SOLUTION 2: Google Meet Method - Pre-prompt Strategy
const PERMISSION_PRE_PROMPT_TIMEOUT = 30000 // 30 secondes

export default function VoiceInterface({ 
  gymSlug, 
  currentMember, 
  isActive, 
  onActivate, 
  onDeactivate,
  onTranscriptUpdate 
}: VoiceInterfaceProps) {
  // ✅ Google Meet pre-prompt states
  const [showPermissionPrePrompt, setShowPermissionPrePrompt] = useState(false)
  const [permissionIntention, setPermissionIntention] = useState<'unknown' | 'allow' | 'skip'>('unknown')
  const [userGestureReceived, setUserGestureReceived] = useState(false)
  const prePromptTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      if (isFinal) {
        onTranscriptUpdate?.(text)
      }
    }, [onTranscriptUpdate]),
    onError: useCallback((errorMessage) => {
      console.error('Voice error:', errorMessage)
    }, [])
  })

  // ✅ Google Meet approach: Ask user intention before permissions
  const handleUserWantsToTalk = useCallback(() => {
    console.log('🎤 User wants to talk - will request microphone')
    setPermissionIntention('allow')
    setUserGestureReceived(true)
    setShowPermissionPrePrompt(false)
    
    // Clear timeout
    if (prePromptTimeoutRef.current) {
      clearTimeout(prePromptTimeoutRef.current)
    }
    
    // Now proceed with microphone permissions
    onActivate()
    connect()
  }, [connect, onActivate])

  const handleUserSkipsTalking = useCallback(() => {
    console.log('🤐 User prefers not to talk')
    setPermissionIntention('skip')
    setShowPermissionPrePrompt(false)
    
    // Clear timeout
    if (prePromptTimeoutRef.current) {
      clearTimeout(prePromptTimeoutRef.current)
    }
  }, [])

  // ✅ Show pre-prompt when member is scanned (like Google Meet)
  useEffect(() => {
    if (currentMember && !userGestureReceived && permissionIntention === 'unknown') {
      console.log('👋 Member detected - showing permission pre-prompt (Google Meet style)')
      setShowPermissionPrePrompt(true)
      
      // Auto-hide pre-prompt after timeout
      prePromptTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Pre-prompt timeout - hiding')
        setShowPermissionPrePrompt(false)
        setPermissionIntention('skip')
      }, PERMISSION_PRE_PROMPT_TIMEOUT)
    }
  }, [currentMember, userGestureReceived, permissionIntention])

  // ✅ Handle normal flow for users who already expressed intention
  useEffect(() => {
    if (isActive && permissionIntention === 'allow' && userGestureReceived && !isConnected && status !== 'connecting') {
      connect()
    }
  }, [isActive, permissionIntention, userGestureReceived, isConnected, status, connect])

  useEffect(() => {
    if (!isActive && isConnected) {
      disconnect()
    }
  }, [isActive, isConnected, disconnect])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (prePromptTimeoutRef.current) {
        clearTimeout(prePromptTimeoutRef.current)
      }
    }
  }, [])

  const getJarvisStatus = () => {
    switch (status) {
      case 'connecting': return 'Connexion...'
      case 'connected': return 'Prêt'
      case 'listening': return 'Écoute'
      case 'speaking': return 'Parle'
      case 'error': return 'Erreur'
      default: return 'Idle'
    }
  }

  return (
    <Box position="relative">
      {/* ✅ SOLUTION 2: Google Meet Pre-prompt Modal */}
      <AnimatePresence>
        {showPermissionPrePrompt && currentMember && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '32px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              maxWidth: '480px',
              width: '90vw'
            }}
          >
            <VStack spacing={6} align="center" textAlign="center">
              {/* Avatar ou icône */}
              <Box
                w="80px"
                h="80px"
                borderRadius="50%"
                bg="linear-gradient(135deg, #3b82f6, #8b5cf6)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="3xl"
              >
                🎤
              </Box>

              {/* Message principal */}
              <VStack spacing={2}>
                <Text 
                  fontSize="xl" 
                  fontWeight="600" 
                  color="white"
                  lineHeight="1.3"
                >
                  Bonjour {currentMember.first_name} !
                </Text>
                <Text 
                  fontSize="lg" 
                  color="rgba(255, 255, 255, 0.8)"
                  lineHeight="1.4"
                >
                  Voulez-vous discuter avec JARVIS vocalement ?
                </Text>
                <Text 
                  fontSize="sm" 
                  color="rgba(255, 255, 255, 0.6)"
                  maxW="380px"
                  lineHeight="1.4"
                >
                  JARVIS peut répondre à vos questions et vous accompagner. Vous pourrez activer/désactiver le microphone à tout moment.
                </Text>
              </VStack>

              {/* Boutons d'action */}
              <HStack spacing={4} w="full" justify="center">
                <Button
                  onClick={handleUserWantsToTalk}
                  bg="linear-gradient(135deg, #3b82f6, #8b5cf6)"
                  color="white"
                  px={8}
                  py={3}
                  borderRadius="12px"
                  fontSize="md"
                  fontWeight="600"
                  border="none"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
                  }}
                  _active={{
                    transform: 'translateY(0px)'
                  }}
                >
                  🎤 Oui, discutons !
                </Button>
                
                <Button
                  onClick={handleUserSkipsTalking}
                  bg="rgba(255, 255, 255, 0.1)"
                  color="rgba(255, 255, 255, 0.8)"
                  px={6}
                  py={3}
                  borderRadius="12px"
                  fontSize="md"
                  fontWeight="500"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  ✋ Pas maintenant
                </Button>
              </HStack>

              {/* Note de confidentialité */}
              <Text 
                fontSize="xs" 
                color="rgba(255, 255, 255, 0.4)"
                textAlign="center"
                maxW="360px"
                lineHeight="1.3"
              >
                💡 Vous conservez le contrôle total de vos permissions microphone et pouvez les modifier à tout moment.
              </Text>
            </VStack>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Background overlay for pre-prompt */}
      <AnimatePresence>
        {showPermissionPrePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998
            }}
            onClick={handleUserSkipsTalking}
          />
        )}
      </AnimatePresence>

      {/* ✅ Existing interface - only show if user has expressed intention */}
      {(permissionIntention === 'allow' || (isActive && userGestureReceived)) && (
        <Box>
          {isConnected && (
            <VStack spacing={4}>
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
              
              {currentTranscript && (
                <Text color="white" fontSize="sm" bg="rgba(0,0,0,0.5)" p={2} borderRadius="md">
                  "{currentTranscript}"
                </Text>
              )}
            </VStack>
          )}
          
          {status === 'error' && (
            <Text color="red.300" fontSize="sm" textAlign="center">
              Erreur de connexion
            </Text>
          )}
        </Box>
      )}

      {/* ✅ Alternative option for users who skipped */}
      {permissionIntention === 'skip' && !showPermissionPrePrompt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <VStack spacing={3}>
            <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm" textAlign="center">
              Pas de problème ! JARVIS reste disponible.
            </Text>
            <Button
              onClick={() => {
                setPermissionIntention('unknown')
                setUserGestureReceived(false)
                setShowPermissionPrePrompt(true)
              }}
              size="sm"
              variant="outline"
              borderColor="rgba(255, 255, 255, 0.3)"
              color="white"
              _hover={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bg: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              🎤 Finalement, parlons !
            </Button>
          </VStack>
        </motion.div>
      )}
    </Box>
  )
} 