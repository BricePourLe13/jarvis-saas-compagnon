"use client"
import { useState, useEffect } from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'

// Composant Avatar JARVIS simplifié pour démo
const JarvisAvatar = ({ status, size = 280 }: { status: string, size?: number }) => {
  const [rotation, setRotation] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  
  // Rotation lente continue
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.15)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Clignements naturels
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, 2000 + Math.random() * 3000)
    return () => clearInterval(blinkInterval)
  }, [])

  // Couleurs selon le statut
  const getColors = () => {
    switch (status) {
      case 'listening':
        return {
          primary: '#3b82f6',
          secondary: '#1d4ed8',
          accent: '#60a5fa',
          glow: '59, 130, 246'
        }
      case 'speaking':
        return {
          primary: '#10b981',
          secondary: '#059669',
          accent: '#34d399',
          glow: '16, 185, 129'
        }
      case 'thinking':
        return {
          primary: '#8b5cf6',
          secondary: '#7c3aed',
          accent: '#a78bfa',
          glow: '139, 92, 246'
        }
      default:
        return {
          primary: '#6b7280',
          secondary: '#4b5563',
          accent: '#9ca3af',
          glow: '107, 114, 128'
        }
    }
  }

  const colors = getColors()

  return (
    <motion.div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative'
      }}
      animate={{
        y: [-8, 8, -8],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Halo extérieur animé */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-20%',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${colors.glow}, 0.1) 0%, rgba(${colors.glow}, 0.05) 40%, transparent 70%)`,
          filter: 'blur(20px)'
        }}
        animate={{
          scale: status === 'listening' ? [1, 1.3, 1] : status === 'speaking' ? [1, 1.4, 1] : [1, 1.1, 1],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{
          duration: status === 'speaking' ? 0.5 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Corps principal de l'avatar */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `
            radial-gradient(ellipse at 30% 30%, 
              rgba(255, 255, 255, 0.4) 0%, 
              ${colors.primary}dd 25%, 
              ${colors.secondary}cc 70%, 
              ${colors.primary}aa 100%
            )
          `,
          boxShadow: `
            0 0 40px rgba(${colors.glow}, 0.4),
            inset -20px -20px 60px rgba(0, 0, 0, 0.2),
            inset 20px 20px 60px rgba(255, 255, 255, 0.1)
          `,
          transform: `rotateY(${rotation * 0.2}deg) rotateX(${Math.sin(rotation * 0.01) * 5}deg)`
        }}
        animate={{
          boxShadow: status === 'listening' 
            ? `0 0 60px rgba(${colors.glow}, 0.6), inset -20px -20px 60px rgba(0, 0, 0, 0.2), inset 20px 20px 60px rgba(255, 255, 255, 0.1)`
            : status === 'speaking'
            ? `0 0 80px rgba(${colors.glow}, 0.8), inset -20px -20px 60px rgba(0, 0, 0, 0.2), inset 20px 20px 60px rgba(255, 255, 255, 0.1)`
            : `0 0 40px rgba(${colors.glow}, 0.4), inset -20px -20px 60px rgba(0, 0, 0, 0.2), inset 20px 20px 60px rgba(255, 255, 255, 0.1)`
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Reflet principal */}
        <motion.div
          style={{
            position: 'absolute',
            top: '15%',
            left: '25%',
            width: '40%',
            height: '35%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)',
            filter: 'blur(8px)',
            transform: 'rotate(-15deg)'
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Yeux avec clignements */}
        <AnimatePresence>
          {!isBlinking && (
            <motion.div
              initial={{ scaleY: 1 }}
              exit={{ scaleY: 0.1 }}
              transition={{ duration: 0.1 }}
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '24px'
              }}
            >
              {/* Œil gauche */}
              <motion.div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `rgba(${colors.glow}, 0.9)`,
                  boxShadow: `0 0 16px rgba(${colors.glow}, 0.8)`
                }}
                animate={{
                  opacity: status === 'listening' ? [0.7, 1, 0.7] : [0.8, 1, 0.8],
                  scale: status === 'speaking' ? [1, 1.3, 1] : [1, 1.1, 1]
                }}
                transition={{
                  duration: status === 'speaking' ? 0.3 : 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Œil droit */}
              <motion.div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `rgba(${colors.glow}, 0.9)`,
                  boxShadow: `0 0 16px rgba(${colors.glow}, 0.8)`
                }}
                animate={{
                  opacity: status === 'listening' ? [0.7, 1, 0.7] : [0.8, 1, 0.8],
                  scale: status === 'speaking' ? [1, 1.3, 1] : [1, 1.1, 1]
                }}
                transition={{
                  duration: status === 'speaking' ? 0.3 : 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.1
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particules internes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            style={{
              position: 'absolute',
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: `rgba(${colors.glow}, 0.6)`,
              boxShadow: `0 0 8px rgba(${colors.glow}, 0.4)`
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.2, 0.5],
              x: [0, Math.random() * 20 - 10, 0],
              y: [0, Math.random() * 20 - 10, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </motion.div>

      {/* Anneaux de résonance */}
      {(status === 'listening' || status === 'speaking') && (
        <motion.div
          style={{
            position: 'absolute',
            inset: '-10%',
            borderRadius: '50%',
            border: `2px solid rgba(${colors.glow}, 0.3)`,
            pointerEvents: 'none'
          }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.div>
  )
}

// Composant d'espace avec étoiles
const SpaceBackground = () => {
  return (
    <Box position="absolute" inset={0} overflow="hidden">
      {/* Étoiles lointaines */}
      {Array.from({ length: 80 }).map((_, i) => {
        const x = Math.random() * 100
        const y = Math.random() * 100
        const size = Math.random() * 0.8 + 0.2
        const opacity = Math.random() * 0.4 + 0.1
        const colors = ['#ffffff', '#93c5fd', '#c4b5fd', '#a7f3d0']
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        return (
          <motion.div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 ${size * 4}px ${color}`,
            }}
            animate={{
              opacity: [opacity * 0.7, opacity, opacity * 0.7],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 4
            }}
          />
        )
      })}

      {/* Particules cosmiques */}
      {Array.from({ length: 8 }).map((_, i) => {
        const colors = [
          { bg: 'rgba(59, 130, 246, 0.6)', glow: 'rgba(59, 130, 246, 0.4)' },
          { bg: 'rgba(147, 51, 234, 0.6)', glow: 'rgba(147, 51, 234, 0.4)' },
          { bg: 'rgba(255, 255, 255, 0.4)', glow: 'rgba(255, 255, 255, 0.2)' }
        ]
        const color = colors[i % colors.length]
        const size = Math.random() * 2 + 1
        return (
          <motion.div
            key={`cosmic-particle-${i}`}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: color.bg,
              boxShadow: `0 0 ${size * 6}px ${color.glow}`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 10, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.7, 1.2, 0.7]
            }}
            transition={{
              duration: 15 + (i * 1.5),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )
      })}
    </Box>
  )
}

// Composant principal JarvisDemo
export default function JarvisDemo() {
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle')
  const [currentMessage, setCurrentMessage] = useState("JARVIS Assistant IA")
  
  // Cycle de démonstration automatique
  useEffect(() => {
    const demoSequence = [
      { status: 'idle', message: "JARVIS Assistant IA", duration: 3000 },
      { status: 'listening', message: "Je vous écoute...", duration: 2500 },
      { status: 'thinking', message: "Analyse en cours...", duration: 2000 },
      { status: 'speaking', message: "Voici mes recommandations", duration: 3000 },
      { status: 'idle', message: "Session terminée", duration: 2000 },
    ]
    
    let currentIndex = 0
    
    const runDemo = () => {
      const step = demoSequence[currentIndex]
      setCurrentStatus(step.status as any)
      setCurrentMessage(step.message)
      
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % demoSequence.length
        runDemo()
      }, step.duration)
    }
    
    // Démarrer la démo après 2 secondes
    const initialDelay = setTimeout(runDemo, 2000)
    
    return () => clearTimeout(initialDelay)
  }, [])

  return (
    <Box 
      position="relative" 
      w="full" 
      h="full" 
      overflow="hidden"
      bg="linear-gradient(135deg, #000000 0%, #0a0a0f 20%, #0f0f1a 60%, #000000 100%)"
    >
      {/* Background d'espace */}
      <SpaceBackground />
      
      {/* Gradient overlay */}
      <Box
        position="absolute"
        inset={0}
        background="radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0.6) 100%)"
        pointerEvents="none"
      />
      
      {/* Contenu principal */}
      <Box
        position="relative"
        zIndex={10}
        h="full"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={8}
      >
        <VStack spacing={12}>
          {/* Avatar JARVIS principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <JarvisAvatar status={currentStatus} size={280} />
          </motion.div>
          
          {/* Message de démonstration */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <VStack spacing={4} textAlign="center">
                <Text
                  fontSize="2xl"
                  fontWeight="300"
                  color="rgba(255, 255, 255, 0.95)"
                  letterSpacing="0.02em"
                  lineHeight="1.3"
                  maxW="350px"
                >
                  {currentMessage}
                </Text>
                
                <Text
                  fontSize="sm"
                  color="rgba(255, 255, 255, 0.6)"
                  fontWeight="400"
                  letterSpacing="0.01em"
                >
                  Démo interactive en cours
                </Text>
              </VStack>
            </motion.div>
          </AnimatePresence>
          
          {/* Logo JARVIS en bas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <Text
              fontSize="4xl"
              fontWeight="900"
              color="rgba(255, 255, 255, 0.8)"
              letterSpacing="8px"
              textAlign="center"
            >
              JARVIS
            </Text>
          </motion.div>
        </VStack>
      </Box>
    </Box>
  )
} 