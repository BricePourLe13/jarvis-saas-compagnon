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
      bg="linear-gradient(135deg, #0a0a0f 0%, #151520 30%, #1a1a2a 70%, #0f0f1a 100%)"
      suppressHydrationWarning
    >
      {/* 🌌 COSMOS BACKGROUND SUBTIL - DERNIER PLAN */}
      <Box
        position="absolute"
        inset="0"
        zIndex={1}
        opacity={0.3}
      >
        {/* Nébuleuses lointaines très subtiles */}
        <motion.div
          style={{
            position: 'absolute',
            top: '10%',
            right: '20%',
            width: '200px',
            height: '150px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '15%',
            width: '180px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
            filter: 'blur(35px)'
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.08, 0.15, 0.08]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />

        {/* Étoiles lointaines */}
        {[
          { left: '20%', top: '25%', delay: 0 },
          { left: '80%', top: '30%', delay: 1 },
          { left: '15%', top: '70%', delay: 2 },
          { left: '85%', top: '75%', delay: 3 },
          { left: '50%', top: '15%', delay: 4 },
          { left: '70%', top: '60%', delay: 5 },
          { left: '30%', top: '85%', delay: 6 },
          { left: '90%', top: '45%', delay: 7 }
        ].map((star, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: star.left,
              top: star.top,
              width: '1px',
              height: '1px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.6)',
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)'
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 3 + star.delay,
              repeat: Infinity,
              ease: "easeInOut",
              delay: star.delay * 0.5
            }}
          />
        ))}
      </Box>

      {/* 🎆 PARTICULES FLOTTANTES MOTION GRAPHICS */}
      {[
        { left: '10%', top: '20%', delay: 0, size: 2 },
        { left: '85%', top: '35%', delay: 2, size: 1.5 },
        { left: '25%', top: '80%', delay: 4, size: 1.8 },
        { left: '75%', top: '15%', delay: 6, size: 1.2 },
        { left: '90%', top: '70%', delay: 8, size: 1.6 }
      ].map((particle, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.4)',
            zIndex: 2
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 6 + particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay * 0.3
          }}
        />
      ))}

      {/* 🎯 JARVIS AVATAR CENTRAL - SEULEMENT L'AVATAR */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={10}
      >
        {/* Avatar principal centré */}
        <Avatar3D 
          status={getJarvisStatus()}
          size={400}
        />

        {/* Logique voice cachée (pas d'interface visuelle) */}
        <Box display="none">
          <VoiceInterface
            gymSlug={slug}
            currentMember={currentMember}
            isActive={voiceActive}
            onActivate={() => setVoiceActive(true)}
            onDeactivate={() => setVoiceActive(false)}
          />
        </Box>
      </Box>

      {/* 💬 MESSAGE MINIMAL À GAUCHE DE LA SPHÈRE */}
      <AnimatePresence>
        <motion.div
          key={getStatusMessage()}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 15,
            maxWidth: '300px'
          }}
        >
          <Text 
            fontSize="lg" 
            color="rgba(255, 255, 255, 0.9)"
            fontWeight="200"
            letterSpacing="0.05em"
            lineHeight="1.4"
            fontFamily="system-ui, -apple-system, sans-serif"
            filter="drop-shadow(0 0 20px rgba(255,255,255,0.1))"
            _before={{
              content: '""',
              position: 'absolute',
              left: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '2px',
              height: '20px',
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              borderRadius: '1px'
            }}
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