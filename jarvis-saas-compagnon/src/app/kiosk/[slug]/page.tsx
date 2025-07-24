'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { Box, Text, VStack, HStack, Badge } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import VoiceInterface from '@/components/kiosk/VoiceInterface'
import RFIDSimulator from '@/components/kiosk/RFIDSimulator'
import Avatar3D from '@/components/kiosk/Avatar3D'
import { KioskValidationResponse, GymMember, MemberLookupResponse, KioskState, HardwareStatus, ExtendedKioskValidationResponse } from '@/types/kiosk'
import { useSoundEffects } from '@/hooks/useSoundEffects'

export default function KioskPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = use(props.params)
  
  const [kioskData, setKioskData] = useState<ExtendedKioskValidationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [currentMember, setCurrentMember] = useState<GymMember | null>(null)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  
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
    
    sounds.notification()
    hapticFeedback('medium')
    
    setCurrentMember(member)
          setKioskState(prev => ({
        ...prev,
        status: 'authenticated',
        currentMember: member,
        lastActivity: Date.now()
      }))

    // Auto-activation voice après scan
    setTimeout(() => setVoiceActive(true), 800)
  }, [sounds, hapticFeedback])

  // Validation initiale du kiosk
  useEffect(() => {
    const validateKiosk = async () => {
      try {
        const response = await fetch(`/api/kiosk/${slug}`)
        
        if (!response.ok) {
          throw new Error(`Kiosk non trouvé: ${response.status}`)
        }
        
        const data = await response.json()
        setKioskData(data)
        console.log('✅ Kiosk validé:', data)
        
      } catch (err) {
        console.error('❌ Erreur validation kiosk:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }

    validateKiosk()
  }, [slug])

  // Auto-reset après inactivité
  useEffect(() => {
    if (currentMember || voiceActive) {
      const timeout = setTimeout(() => {
        setCurrentMember(null)
        setVoiceActive(false)
        setKioskState(prev => ({ ...prev, status: 'idle' }))
      }, 60000) // 1 minute d'inactivité
      
      return () => clearTimeout(timeout)
    }
  }, [currentMember, voiceActive])

  // Menu admin secret (3 clics rapides en bas à droite)
  const [adminClicks, setAdminClicks] = useState(0)
  const handleAdminAccess = () => {
    setAdminClicks(prev => prev + 1)
    if (adminClicks >= 2) {
      setShowAdminMenu(true)
      setAdminClicks(0)
    }
    setTimeout(() => setAdminClicks(0), 2000)
  }

  // Statut pour JARVIS
  const getJarvisStatus = (): 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting' => {
    if (voiceActive) {
      return kioskState.status as any
    }
    if (currentMember) return 'thinking'
    return 'idle'
  }

  // Message minimal selon l'état
  const getStatusMessage = () => {
    if (currentMember && !voiceActive) {
      return `Bonjour ${currentMember.first_name} !`
    }
    if (voiceActive) {
      return "Je vous écoute..."
    }
    return "Présentez votre badge"
  }

  if (error) {
    return (
      <Box 
        h="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
        color="white"
      >
        <VStack spacing={4}>
          <Text fontSize="xl" color="red.300">❌ Erreur Kiosk</Text>
          <Text color="gray.300">{error}</Text>
        </VStack>
      </Box>
    )
  }

  if (!kioskData) {
    return (
      <Box 
        h="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
        color="white"
      >
        <Text fontSize="lg" color="gray.300">⏳ Initialisation...</Text>
      </Box>
    )
  }

  return (
    <Box
      h="100vh"
      position="relative"
      overflow="hidden"
      bg="linear-gradient(135deg, #0f0f23 0%, #1a1a2e 30%, #16213e 70%, #0f3460 100%)"
    >
      {/* 🌌 FOND MOTION GRAPHICS SUBTIL */}
      <Box
        position="absolute"
        inset={0}
        opacity={0.3}
        background={`
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)
        `}
      />

      {/* ✨ Particules flottantes subtiles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            left: `${20 + i * 12}%`,
            top: `${30 + i * 8}%`
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* 🎯 JARVIS AVATAR CENTRAL */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
      >
        <VoiceInterface
          gymSlug={slug}
          currentMember={currentMember}
          isActive={voiceActive}
          onActivate={() => setVoiceActive(true)}
          onDeactivate={() => setVoiceActive(false)}
        />

        {/* Avatar principal par-dessus */}
        <Box position="absolute" top="-200px" left="50%" transform="translateX(-50%)">
          <Avatar3D 
            status={getJarvisStatus()}
            size={400}
          />
        </Box>
      </Box>

      {/* 💬 MESSAGE MINIMAL */}
      <AnimatePresence>
        <motion.div
          key={getStatusMessage()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center'
          }}
        >
          <Text 
            fontSize="2xl" 
            color="white" 
            fontWeight="300"
            letterSpacing="wide"
            filter="drop-shadow(0 0 10px rgba(255,255,255,0.2))"
          >
            {getStatusMessage()}
          </Text>
        </motion.div>
      </AnimatePresence>

      {/* 🔧 MENU ADMIN CACHÉ */}
      <Box
        position="absolute"
        bottom="20px"
        right="20px"
        w="40px"
        h="40px"
        cursor="pointer"
        onClick={handleAdminAccess}
        opacity={showAdminMenu ? 1 : 0.1}
        transition="opacity 0.3s"
        _hover={{ opacity: 0.3 }}
      >
        <Badge colorScheme="blue" variant="subtle" fontSize="xs">
          DEV
        </Badge>
      </Box>

      {/* 🛠️ PANNEAU ADMIN SIMULATEUR */}
      <AnimatePresence>
        {showAdminMenu && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 20 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px',
              zIndex: 1000
            }}
          >
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text color="white" fontWeight="bold">Menu Admin</Text>
                <Box
                  cursor="pointer"
                  onClick={() => setShowAdminMenu(false)}
                  color="gray.400"
                  _hover={{ color: "white" }}
                >
                  ✕
                </Box>
              </HStack>
              
              <Box>
                <Text color="gray.300" fontSize="sm" mb={2}>Simulateur RFID:</Text>
                <RFIDSimulator onMemberScanned={handleMemberScanned} isActive={false} />
              </Box>

              <Box>
                <Text color="gray.300" fontSize="sm" mb={2}>État:</Text>
                <Text color="green.300" fontSize="xs">
                  Kiosk: {kioskData.gym.name}
                </Text>
                <Text color="blue.300" fontSize="xs">
                  Status: {kioskState.status}
                </Text>
                {currentMember && (
                  <Text color="purple.300" fontSize="xs">
                    Membre: {currentMember.first_name}
                  </Text>
                )}
              </Box>
            </VStack>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
} 