'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { Box, VStack, Text, Button, HStack, Badge, Alert, AlertIcon, Divider } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import VoiceInterface from '@/components/kiosk/VoiceInterface'
import RFIDSimulator from '@/components/kiosk/RFIDSimulator'
import CosmicBackground from '@/components/kiosk/CosmicBackground'
import Avatar3D from '@/components/kiosk/Avatar3D'
import { KioskValidationResponse, GymMember, MemberLookupResponse, KioskState, HardwareStatus, ExtendedKioskValidationResponse } from '@/types/kiosk'
import { useSoundEffects } from '@/hooks/useSoundEffects'

export default function KioskPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = use(props.params)
  
  const [kioskData, setKioskData] = useState<ExtendedKioskValidationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [currentMember, setCurrentMember] = useState<GymMember | null>(null)
  
  const [kioskState, setKioskState] = useState<KioskState>({
    status: 'idle',
    currentMember: null,
    lastActivity: Date.now(),
    sessionDuration: 0,
    hardware: {
      rfid_reader: 'connected',
      microphone: 'available',
      speakers: 'available',
      network: 'online'
    },
    isOnline: true,
    audioEnabled: true,
    rfidEnabled: true
  })

  const { sounds, hapticFeedback } = useSoundEffects({ enabled: true, volume: 0.1 })

  // Gestionnaire de scan RFID (réel ou simulé)
  const handleMemberScanned = useCallback((member: GymMember) => {
    console.log(`🏷️ Membre scanné: ${member.first_name} ${member.last_name}`)
    
    // Effets sonores/haptiques pour le scan
    sounds.notification()
    hapticFeedback('medium')
    
    // Mettre à jour l'état
    setCurrentMember(member)
    setKioskState(prev => ({
      ...prev,
      status: 'authenticated',
      currentMember: member,
      lastActivity: Date.now()
    }))
    
    // Déclencher automatiquement la session vocale
    setTimeout(() => {
      setVoiceActive(true)
      sounds.connect()
      console.log(`🎤 Session vocale automatique démarrée pour ${member.first_name}`)
    }, 1000) // Petit délai pour l'effet
    
  }, [sounds, hapticFeedback])

  // Gérer la fin de session
  const handleSessionEnd = useCallback(() => {
    console.log('🔚 Fin de session kiosque')
    
    setVoiceActive(false)
    setCurrentMember(null)
    setKioskState(prev => ({
      ...prev,
      status: 'idle',
      currentMember: null,
      lastActivity: Date.now(),
      sessionDuration: 0
    }))
    
    sounds.disconnect()
    hapticFeedback('light')
  }, [sounds, hapticFeedback])

  // Auto-déconnexion après inactivité (5 minutes)
  useEffect(() => {
    if (!voiceActive || !currentMember) return

    const timeout = setTimeout(() => {
      console.log('⏰ Session expirée par inactivité')
      handleSessionEnd()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearTimeout(timeout)
  }, [voiceActive, currentMember, handleSessionEnd])

  // Validation du slug kiosque
  useEffect(() => {
    const validateKiosk = async () => {
      try {
        // TODO: Remplacer par vraie validation via Supabase
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Données simulées
        setKioskData({
          gym: {
            name: `Fitness ${slug.charAt(0).toUpperCase() + slug.slice(1)}`,
            slug: slug,
            location: '123 Rue du Sport, 75001 Paris',
            status: 'active',
            opening_hours: '6h00 - 23h00',
            phone: '+33 1 23 45 67 89'
          },
          kiosk: {
            id: `kiosk_${slug}_001`,
            name: `Kiosk Principal ${slug}`,
            status: 'active',
            location: 'Entrée principale',
            version: '2.1.0'
          }
        })
      } catch (err) {
        setError('Kiosque introuvable ou hors service')
        console.error('Erreur validation kiosque:', err)
      }
    }

    validateKiosk()
  }, [slug])

  if (error) {
    return (
      <Box 
        minH="100vh" 
        bg="linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={8}
      >
        <Alert status="error" maxW="400px">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    )
  }

  if (!kioskData) {
    return (
      <Box 
        minH="100vh" 
        bg="linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Text fontSize="4xl">🤖</Text>
          </motion.div>
          <Text color="white" fontSize="lg">
            Initialisation JARVIS...
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      bg="linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)"
      suppressHydrationWarning
    >
      {/* Background cosmique */}
      <CosmicBackground />
      
      {/* Interface principale */}
      <Box
        position="relative"
        zIndex={2}
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={8}
        suppressHydrationWarning
      >
        <VStack spacing={12} align="center" w="full" maxW="800px">
          
          {/* En-tête gym */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <VStack spacing={2} textAlign="center">
              <Text 
                color="rgba(255,255,255,0.95)" 
                fontSize="2xl" 
                fontWeight="600"
                letterSpacing="wide"
              >
                {kioskData.gym.name}
              </Text>
              <Badge 
                colorScheme="blue" 
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
              >
                {kioskData.kiosk.name} • v{kioskData.kiosk.version}
              </Badge>
            </VStack>
          </motion.div>

          {/* Interface unifiée - Avatar toujours présent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%' }}
          >
            <VStack spacing={8} align="center">
              
              {/* Informations membre si connecté */}
              <AnimatePresence>
                {currentMember && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <VStack spacing={2} textAlign="center">
                      <Text color="rgba(255,255,255,0.9)" fontSize="lg" fontWeight="600">
                        Bonjour {currentMember.first_name} ! 👋
                      </Text>
                      <HStack spacing={3}>
                        <Badge colorScheme="green" borderRadius="full">
                          {currentMember.membership_type}
                        </Badge>
                        <Badge colorScheme="blue" borderRadius="full">
                          {currentMember.total_visits} visites
                        </Badge>
                      </HStack>
                    </VStack>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AVATAR PRINCIPAL - Toujours présent, change juste de statut */}
              <Box position="relative">
                <VoiceInterface
                  gymSlug={slug}
                  currentMember={currentMember}
                  isActive={voiceActive}
                  onActivate={() => setVoiceActive(true)}
                  onDeactivate={handleSessionEnd}
                />
              </Box>

              {/* Message d'accueil ou status */}
              <VStack spacing={4} textAlign="center">
                {!currentMember ? (
                  <Text 
                    color="rgba(255,255,255,0.8)" 
                    fontSize="lg" 
                    fontWeight="400"
                  >
                    JARVIS
                  </Text>
                ) : (
                  <Text 
                    color="rgba(255,255,255,0.6)" 
                    fontSize="sm"
                  >
                    {voiceActive ? "●" : "○"}
                  </Text>
                )}
              </VStack>

              {/* Simulateur RFID - Plus discret, toujours visible */}
              {!voiceActive && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: currentMember ? 0.3 : 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ width: '100%' }}
                >
                  <Divider opacity={0.2} maxW="300px" mb={4} />
                  <RFIDSimulator 
                    onMemberScanned={handleMemberScanned}
                    isActive={voiceActive}
                  />
                </motion.div>
              )}

              {/* Bouton de fin de session - Discret */}
              <AnimatePresence>
                {currentMember && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 2 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      colorScheme="red"
                      onClick={handleSessionEnd}
                      _hover={{ bg: 'rgba(220, 38, 38, 0.1)' }}
                      opacity={0.6}
                    >
                      Terminer la session
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </VStack>
          </motion.div>
        </VStack>
      </Box>
    </Box>
  )
} 