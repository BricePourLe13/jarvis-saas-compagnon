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
      setHasStarted(true)
      setStatus('connecting')
      await connect()
      setStatus('connected')
    } catch (error) {
      console.error('Erreur de connexion:', error)
      setStatus('error')
    }
  }, [connect])

  const handleEndDemo = useCallback(async () => {
    // Fermeture immédiate de l'interface AVANT tout traitement
    onClose()
    
    try {
      // Réinitialiser les états en arrière-plan
      setHasStarted(false)
      setTimeRemaining(120)
      setTranscript('')
      setStatus('idle')
      
      // Déconnexion en arrière-plan
      setTimeout(async () => {
        try {
          await disconnect()
        } catch (error) {
          console.error('Erreur de déconnexion en arrière-plan:', error)
        }
      }, 100)
    } catch (error) {
      console.error('Erreur de fermeture:', error)
    }
  }, [disconnect, onClose])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connexion à JARVIS...'
      case 'connected': return 'JARVIS vous écoute'
      case 'listening': return 'Je vous écoute...'
      case 'speaking': return 'JARVIS répond...'
      case 'error': return 'Erreur de connexion'
      default: return 'Prêt à démarrer'
    }
  }

  const getAvatarStatus = () => {
    if (isAISpeaking) return 'speaking'
    if (isListening || currentTranscript) return 'listening'
    if (isConnected) return 'idle'
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
      isCentered
    >
      <ModalOverlay 
        bg="rgba(0, 0, 0, 0.95)" 
        backdropFilter="blur(10px)"
      />
      <ModalContent 
        bg="transparent" 
        boxShadow="none"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        zIndex={9999}
      >
        <ModalBody p={0} w="100%" h="100vh" display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={8} textAlign="center" color="white" maxW="600px" px={6}>
            
            {/* Header avec bouton fermer et timer */}
            <HStack w="100%" justify="space-between" align="center">
              <Box />
              <VStack spacing={1}>
                <Text fontSize="sm" color="rgba(255,255,255,0.7)">
                  Démo JARVIS
                </Text>
                {hasStarted && (
                  <Text fontSize="lg" fontWeight="bold" color={timeRemaining <= 30 ? "red.300" : "white"}>
                    {formatTime(timeRemaining)}
                  </Text>
                )}
              </VStack>
              <Button
                variant="ghost"
                color="white"
                onClick={handleEndDemo}
                leftIcon={<FiX />}
                size="sm"
              >
                Fermer
              </Button>
            </HStack>

            {/* Avatar JARVIS */}
            <Box position="relative">
              <Avatar3D 
                status={getAvatarStatus()} 
                size={400}
                currentSection="hero"
              />
              
              {/* Indicateur d'état */}
              <Box
                position="absolute"
                bottom="-20px"
                left="50%"
                transform="translateX(-50%)"
                px={4}
                py={2}
                bg="rgba(0,0,0,0.7)"
                borderRadius="full"
                border="1px solid rgba(255,255,255,0.2)"
                backdropFilter="blur(10px)"
              >
                <Text fontSize="sm" fontWeight="medium">
                  {getStatusText()}
                </Text>
              </Box>
            </Box>

            {/* Transcript en temps réel */}
            <AnimatePresence>
              {(transcript || currentTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ width: '100%' }}
                >
                  <Box
                    p={4}
                    bg="rgba(255,255,255,0.1)"
                    borderRadius="lg"
                    border="1px solid rgba(255,255,255,0.2)"
                    backdropFilter="blur(10px)"
                    minH="60px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="md" textAlign="center" lineHeight="1.5">
                      {currentTranscript || transcript}
                    </Text>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <VStack spacing={4}>
              {!hasStarted ? (
                <VStack spacing={4} textAlign="center">
                  <VStack spacing={2}>
                    <Heading size="lg" color="white">
                      Prêt à commencer ?
                    </Heading>
                    <Text color="rgba(255,255,255,0.8)" maxW="400px">
                      Parlez avec JARVIS pendant 2 minutes. 
                      Posez-lui des questions sur nos solutions !
                    </Text>
                  </VStack>
                  
                  <Button
                    onClick={handleStartDemo}
                    size="lg"
                    colorScheme="blue"
                    leftIcon={<FiMic />}
                    isLoading={status === 'connecting'}
                    loadingText="Connexion..."
                    disabled={status === 'connecting'}
                    px={8}
                    py={6}
                    fontSize="lg"
                    borderRadius="full"
                    bg="linear-gradient(135deg, #3b82f6, #8b5cf6)"
                    _hover={{
                      bg: "linear-gradient(135deg, #2563eb, #7c3aed)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.4)"
                    }}
                    transition="all 0.2s"
                  >
                    Lancer la conversation
                  </Button>
                </VStack>
              ) : (
                <HStack spacing={4}>
                  <Button
                    size="lg"
                    variant="outline"
                    colorScheme="red"
                    onClick={handleEndDemo}
                    leftIcon={<FiMicOff />}
                    borderRadius="full"
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
