"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { Box, Button, Text, VStack, HStack, Modal, ModalOverlay, ModalContent, ModalBody, Heading } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMic, FiMicOff, FiX } from 'react-icons/fi'
import Avatar3D from '@/components/kiosk/Avatar3D'
import { useVoiceVitrineChat } from '@/hooks/useVoiceVitrineChat'

interface VoiceVitrineInterfaceProps {
  isOpen: boolean
  onClose: () => void
}

export default function VoiceVitrineInterface({ isOpen, onClose }: VoiceVitrineInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'>('idle')
  const [timeRemaining, setTimeRemaining] = useState(120) // 2 minutes démo
  const [hasStarted, setHasStarted] = useState(false)
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null) // 🔒 NOUVEAU : Crédits restants
  const [limitError, setLimitError] = useState<string | null>(null) // 🔒 NOUVEAU : Erreur de limitation
  
  // Réinitialiser tous les états quand la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      setIsListening(false)
      setTranscript('')
      setStatus('idle')
      setTimeRemaining(120)
      setHasStarted(false)
    }
  }, [isOpen])
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Hook pour l'interface vocale (version vitrine)
  const {
    connect,
    disconnect,
    isConnected,
    error,
    currentTranscript,
    isAISpeaking
  } = useVoiceVitrineChat({
    onStatusChange: setStatus,
    onTranscriptUpdate: setTranscript,
    maxDuration: 120 // 2 minutes maximum
  })

  // Timer de démo
  useEffect(() => {
    if (hasStarted && isConnected) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleEndDemo()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [hasStarted, isConnected])

  // Démarrer démo directement (plus de gate email)
  const handleStartDemo = useCallback(async () => {
    try {
      setLimitError(null) // Reset erreur
      setHasStarted(true)
      setStatus('connecting')
      
      const result = await connect()
      
      // 🔒 NOUVEAU : Récupérer les crédits restants
      if (result && 'remainingCredits' in result) {
        setRemainingCredits(result.remainingCredits)
        console.log(`💳 Crédits restants: ${result.remainingCredits} minutes`)
      }
      
      setStatus('connected')
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      
      // 🔒 NOUVEAU : Gérer les erreurs de limitation
      if (error.hasActiveSession) {
        setLimitError('⚠️ Session déjà active. Fermez les autres onglets.')
      } else if (error.remainingCredits === 0) {
        setLimitError('⏰ Temps de démo épuisé. Revenez demain ou contactez-nous.')
      } else if (error.message) {
        setLimitError(error.message)
      }
      
      setStatus('error')
      setHasStarted(false)
    }
  }, [connect])

  const handleEndDemo = useCallback(async () => {
    try {
      // Déconnexion AVANT fermeture pour éviter les états incohérents
      await disconnect()
      
      // Nettoyage immédiat des états
      setHasStarted(false)
      setTimeRemaining(120)
      setTranscript('')
      setStatus('idle')
      setIsListening(false)
      
      // Nettoyage du timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    } finally {
      // Fermeture forcée même en cas d'erreur
      onClose()
      
      // Double sécurité : forcer fermeture après délai minimal
      setTimeout(() => {
        onClose()
      }, 50)
    }
  }, [onClose, disconnect])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAvatarStatus = () => {
    if (status === 'speaking' || isAISpeaking) return 'speaking'
    if (status === 'listening' || isListening) return 'listening'
    if (status === 'connecting') return 'connecting'
    return 'idle'
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="full" 
      motionPreset="slideInBottom"
      closeOnEsc={true}
      closeOnOverlayClick={true}
      blockScrollOnMount={true}
      preserveScrollBarGap={true}
      isCentered
    >
      <ModalOverlay 
        bg="rgba(0, 0, 0, 0.95)" 
        backdropFilter="blur(10px)"
        onClick={onClose}
      />
      <ModalContent 
        bg="transparent" 
        boxShadow="none" 
        maxW="100vw" 
        maxH="100vh"
        m={0}
        borderRadius={0}
      >
        <ModalBody p={0} display="flex" alignItems="center" justifyContent="center" minH="100vh">
          <VStack spacing={8} maxW="lg" w="full" px={6}>
            {/* Header avec timer et fermeture */}
            <HStack w="full" justify="space-between" align="center">
              <Box>
                <Heading color="white" size="lg">
                  Démo JARVIS
                </Heading>
                {hasStarted && (
                  <Text color="red.400" fontSize="lg" fontWeight="bold">
                    {formatTime(timeRemaining)}
                  </Text>
                )}
                {/* 🔒 NOUVEAU : Afficher crédits restants */}
                {remainingCredits !== null && (
                  <Text color="cyan.400" fontSize="sm" mt={1}>
                    💳 {remainingCredits} minute{remainingCredits > 1 ? 's' : ''} restante{remainingCredits > 1 ? 's' : ''}
                  </Text>
                )}
              </Box>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                color="white"
                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                rightIcon={<FiX />}
              >
                Fermer
              </Button>
            </HStack>

            {/* 🔒 NOUVEAU : Message d'erreur de limitation */}
            {limitError && (
              <Box
                w="full"
                p={4}
                bg="rgba(255, 0, 0, 0.1)"
                border="1px solid rgba(255, 0, 0, 0.3)"
                borderRadius="lg"
              >
                <Text color="red.400" textAlign="center" fontSize="md" fontWeight="medium">
                  {limitError}
                </Text>
                <Text color="red.300" textAlign="center" fontSize="sm" mt={2}>
                  Contactez-nous pour un accès complet : contact@jarvis-group.net
                </Text>
              </Box>
            )}

            {/* Avatar 3D */}
            <Box position="relative" w="300px" h="300px">
              <Avatar3D 
                currentSection="vitrine" 
                status={getAvatarStatus()}
              />
            </Box>

            {/* Zone de transcription */}
            <Box
              w="full"
              minH="120px"
              p={4}
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="lg"
              backdropFilter="blur(10px)"
            >
              <Text color="white" textAlign="center" fontSize="md">
                {transcript || 
                 (status === 'connecting' ? 'Connexion en cours...' :
                  status === 'connected' && !hasStarted ? 'Appuyez sur "Commencer" pour démarrer' :
                  status === 'listening' ? '🎤 JARVIS vous écoute...' :
                  status === 'speaking' ? '🗣️ JARVIS vous répond...' :
                  'Prêt à discuter avec JARVIS')}
              </Text>
            </Box>

            {/* Contrôles */}
            <VStack spacing={4} w="full">
              {!hasStarted ? (
                <Button
                  onClick={handleStartDemo}
                  size="lg"
                  colorScheme="blue"
                  isLoading={status === 'connecting'}
                  loadingText="Connexion..."
                  leftIcon={<FiMic />}
                  borderRadius="full"
                  w="full"
                  maxW="300px"
                >
                  Voir JARVIS en action
                </Button>
              ) : (
                <HStack spacing={4}>
                  <Button
                    onClick={handleEndDemo}
                    leftIcon={<FiMicOff />}
                    borderRadius="full"
                    colorScheme="red"
                    variant="outline"
                  >
                    Terminer
                  </Button>
                </HStack>
              )}

              {/* Message d'erreur */}
              {error && (
                <Box
                  p={3}
                  bg="rgba(239, 68, 68, 0.1)"
                  border="1px solid rgba(239, 68, 68, 0.3)"
                  borderRadius="lg"
                  backdropFilter="blur(10px)"
                >
                  <Text color="red.300" fontSize="sm">
                    {error}
                  </Text>
                </Box>
              )}
            </VStack>

            {/* Footer info */}
            <VStack spacing={2} textAlign="center">
              <Text fontSize="xs" color="rgba(255,255,255,0.5)">
                Cette démo utilise l'intelligence artificielle OpenAI
              </Text>
              <Text fontSize="xs" color="rgba(255,255,255,0.5)">
                Votre voix n'est pas enregistrée • Session temporaire
              </Text>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}