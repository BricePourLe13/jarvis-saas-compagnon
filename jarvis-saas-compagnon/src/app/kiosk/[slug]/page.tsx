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
      {/* 🌌 COSMOS GALACTIQUE RÉALISTE - INSPIRATION IMAGE */}
      <Box
        position="absolute"
        inset="0"
        zIndex={1}
        opacity={0.9}
      >
        {/* 🌠 NÉBULEUSES PRINCIPALES COLORÉES - COMME L'IMAGE */}
        
        {/* Grande nébuleuse rose-violet centrale */}
        <motion.div
          style={{
            position: 'absolute',
            top: '5%',
            left: '0%',
            width: '70%',
            height: '50%',
            background: `
              radial-gradient(ellipse 80% 60% at 35% 45%, 
                rgba(219, 39, 119, 0.4) 0%,
                rgba(236, 72, 153, 0.35) 20%,
                rgba(147, 51, 234, 0.3) 45%,
                rgba(59, 130, 246, 0.2) 70%,
                transparent 85%
              )
            `,
            filter: 'blur(18px)',
            borderRadius: '40%'
          }}
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.8, 1, 0.8],
            rotate: [0, 1.5, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Nébuleuse bleue-cyan droite */}
        <motion.div
          style={{
            position: 'absolute',
            top: '30%',
            right: '5%',
            width: '55%',
            height: '45%',
            background: `
              radial-gradient(ellipse 75% 85% at 60% 50%, 
                rgba(6, 182, 212, 0.35) 0%,
                rgba(59, 130, 246, 0.3) 30%,
                rgba(147, 51, 234, 0.2) 60%,
                rgba(168, 85, 247, 0.15) 80%,
                transparent 90%
              )
            `,
            filter: 'blur(15px)',
            borderRadius: '50%'
          }}
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.7, 0.95, 0.7],
            rotate: [0, -1, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Nébuleuse orange-rouge en bas */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '15%',
            width: '60%',
            height: '35%',
            background: `
              radial-gradient(ellipse 85% 55% at 45% 65%, 
                rgba(251, 146, 60, 0.3) 0%,
                rgba(239, 68, 68, 0.25) 35%,
                rgba(219, 39, 119, 0.18) 65%,
                rgba(147, 51, 234, 0.12) 85%,
                transparent 95%
              )
            `,
            filter: 'blur(16px)',
            borderRadius: '45%'
          }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.6, 0.85, 0.6],
            rotate: [0, 0.8, 0]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* ⭐ COUCHES D'ÉTOILES MULTIPLES - EFFET GALAXIE */}
        
        {/* Grosses étoiles brillantes principales (8) */}
        {[
          { left: '25%', top: '20%', color: 'rgba(255, 255, 255, 1)' },
          { left: '75%', top: '35%', color: 'rgba(147, 197, 253, 0.9)' },
          { left: '15%', top: '60%', color: 'rgba(255, 255, 255, 0.95)' },
          { left: '85%', top: '75%', color: 'rgba(196, 181, 253, 0.9)' },
          { left: '55%', top: '15%', color: 'rgba(255, 255, 255, 1)' },
          { left: '35%', top: '80%', color: 'rgba(252, 211, 77, 0.9)' },
          { left: '90%', top: '25%', color: 'rgba(255, 255, 255, 0.95)' },
          { left: '10%', top: '40%', color: 'rgba(167, 243, 208, 0.9)' }
        ].map((star, i) => (
          <motion.div
            key={`big-star-${i}`}
            style={{
              position: 'absolute',
              left: star.left,
              top: star.top,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: star.color,
              boxShadow: `
                0 0 15px ${star.color},
                0 0 30px ${star.color.replace('1)', '0.6)')},
                0 0 45px ${star.color.replace('1)', '0.3)')}
              `
            }}
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [0.8, 1.4, 0.8]
            }}
            transition={{
              duration: 4 + (i * 0.3),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Étoiles moyennes (15) */}
        {Array.from({ length: 15 }, (_, i) => {
          const colors = [
            'rgba(255, 255, 255, 0.85)',
            'rgba(147, 197, 253, 0.8)',
            'rgba(196, 181, 253, 0.8)',
            'rgba(252, 211, 77, 0.8)',
            'rgba(167, 243, 208, 0.8)'
          ]
          return (
            <motion.div
              key={`med-star-${i}`}
              style={{
                position: 'absolute',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: '2.5px',
                height: '2.5px',
                borderRadius: '50%',
                background: colors[i % colors.length],
                boxShadow: `0 0 10px ${colors[i % colors.length]}`
              }}
              animate={{
                opacity: [0.5, 0.9, 0.5],
                scale: [0.7, 1.2, 0.7]
              }}
              transition={{
                duration: 3 + (i * 0.15),
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )
        })}

        {/* Petites étoiles nombreuses - poussière d'étoiles (25) */}
        {Array.from({ length: 25 }, (_, i) => (
          <motion.div
            key={`small-star-${i}`}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: '1.5px',
              height: '1.5px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.75)',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.5)'
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.6, 1.1, 0.6]
            }}
            transition={{
              duration: 2 + (i * 0.08),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* 🌟 POUSSIÈRE COSMIQUE COLORÉE FLOTTANTE */}
        {Array.from({ length: 12 }, (_, i) => {
          const colors = [
            { bg: 'rgba(59, 130, 246, 0.7)', glow: 'rgba(59, 130, 246, 0.5)' },
            { bg: 'rgba(147, 51, 234, 0.7)', glow: 'rgba(147, 51, 234, 0.5)' },
            { bg: 'rgba(219, 39, 119, 0.7)', glow: 'rgba(219, 39, 119, 0.5)' },
            { bg: 'rgba(6, 182, 212, 0.7)', glow: 'rgba(6, 182, 212, 0.5)' }
          ]
          const color = colors[i % colors.length]
          return (
            <motion.div
              key={`cosmic-dust-${i}`}
              style={{
                position: 'absolute',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${2 + (i % 3) * 0.5}px`,
                height: `${2 + (i % 3) * 0.5}px`,
                borderRadius: '50%',
                background: color.bg,
                boxShadow: `0 0 12px ${color.glow}`,
                zIndex: 2
              }}
              animate={{
                y: [0, -25, 0],
                x: [0, 12, 0],
                opacity: [0.4, 0.9, 0.4],
                scale: [0.7, 1.3, 0.7]
              }}
              transition={{
                duration: 8 + (i * 0.6),
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )
        })}
      </Box>

      {/* 🎯 JARVIS AVATAR CENTRAL - FLOTTANT DANS LE COSMOS */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}
        animate={{
          y: [-8, 8, -8],
          rotateY: [0, 2, 0],
          rotateX: [0, 1, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
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
      </motion.div>

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
            fontSize="xl" 
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