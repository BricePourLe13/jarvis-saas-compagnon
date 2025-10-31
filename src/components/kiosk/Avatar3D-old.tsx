"use client"
import { motion } from 'framer-motion'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useVoiceVisualSync } from '@/hooks/useVoiceVisualSync'

interface Avatar3DProps {
  status: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting' | 'contextual'
  size?: number
  className?: string
  eyeScale?: number // Permet d'ajuster la taille des yeux selon le contexte (ex: Kiosk)
  currentSection?: 'hero' | 'social-proof' | 'solutions' | 'benefits' // Section actuelle pour comportement contextuel
  isListening?: boolean
  isSpeaking?: boolean
}

export default function Avatar3D({ 
  status: propStatus, 
  size = 450, 
  className, 
  eyeScale = 1, 
  currentSection = 'hero',
  isListening: propIsListening = false,
  isSpeaking: propIsSpeaking = false
}: Avatar3DProps) {
  // Convertir les props isListening/isSpeaking en status si fournis
  const status = propIsListening ? 'listening' : 
                 propIsSpeaking ? 'speaking' : 
                 propStatus || 'idle'
  
  const [rotation, setRotation] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
  const [isLookingAround, setIsLookingAround] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const animationFrameRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 🎤 HOOK DE SYNCHRONISATION AUDIO-VISUELLE
  const voiceSync = useVoiceVisualSync()

  // Assurer le rendu côté client pour éviter l'hydratation mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Synchroniser avec le système vocal
  useEffect(() => {
    if (status === 'listening') {
      voiceSync.setListeningState(true)
    } else if (status === 'speaking') {
      voiceSync.setSpeakingState(true)
    } else {
      voiceSync.setListeningState(false)
      voiceSync.setSpeakingState(false)
    }
  }, [status])

  // 🧹 MEMORY MANAGEMENT
  const activeTimers = useRef<Set<NodeJS.Timeout>>(new Set())
  const activeIntervals = useRef<Set<NodeJS.Timeout>>(new Set())

  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    activeTimers.current.add(timer)
    return timer
  }, [])

  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    activeIntervals.current.add(interval)
    return interval
  }, [])

  const cleanupResources = useCallback(() => {
    activeTimers.current.forEach(timer => clearTimeout(timer))
    activeTimers.current.clear()
    activeIntervals.current.forEach(interval => clearInterval(interval))
    activeIntervals.current.clear()
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => cleanupResources()
  }, [cleanupResources])

  // 🔄 ROTATION LENTE CONTINUE + 👁️ CLIGNEMENTS OPTIMISÉS (RAF unique)
  useEffect(() => {
    let lastRotationTime = 0
    let lastBlinkTime = 0
    let nextBlinkDelay = 2000 + Math.random() * 3000

    const animate = (currentTime: number) => {
      // Rotation optimisée toutes les 100ms (réduit la charge CPU)
      if (currentTime - lastRotationTime > 100) {
        setRotation(prev => prev + 0.15)
        lastRotationTime = currentTime
      }

      // Clignement probabiliste (même comportement visuel)
      if (currentTime - lastBlinkTime > nextBlinkDelay) {
        setIsBlinking(true)
        const blinkTimer = addTimer(setTimeout(() => setIsBlinking(false), 150))
        lastBlinkTime = currentTime
        nextBlinkDelay = 2000 + Math.random() * 3000 // Nouveau délai aléatoire
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [addTimer])


  // 👁️ MOUVEMENT DES YEUX RÉALISTE - OBSERVATION DE L'ENVIRONNEMENT
  useEffect(() => {
    let lookSequenceIndex = 0
    let isInSequence = false

    // Patterns de regard réalistes selon le statut
    const getLookPatterns = () => {
      // 🎯 MODE CONTEXTUEL - Comportements selon la section
      if (status === 'contextual') {
        switch (currentSection) {
          case 'hero':
            return [
              { x: 0, y: 10, duration: 3000 },
              { x: -15, y: 5, duration: 1500 },
              { x: 15, y: 5, duration: 1500 },
              { x: 0, y: 15, duration: 2000 },
              { x: 0, y: -5, duration: 1000 }
            ]
          case 'social-proof':
            return [
              { x: -25, y: -10, duration: 2000 },
              { x: 25, y: -10, duration: 2000 },
              { x: 0, y: -20, duration: 1500 },
              { x: -15, y: 0, duration: 1000 },
              { x: 15, y: 0, duration: 1000 }
            ]
          case 'solutions':
            return [
              { x: -30, y: 5, duration: 2500 },
              { x: 30, y: 5, duration: 2500 },
              { x: 0, y: -15, duration: 1500 },
              { x: -20, y: 15, duration: 1200 },
              { x: 20, y: 15, duration: 1200 }
            ]
          case 'benefits':
            return [
              { x: -25, y: -5, duration: 2000 },
              { x: 0, y: -10, duration: 2000 },
              { x: 25, y: -5, duration: 2000 },
              { x: 0, y: 20, duration: 1500 },
              { x: 0, y: 0, duration: 1000 }
            ]
          default:
            return [{ x: 0, y: 0, duration: 2000 }]
        }
      }

      // Algorithme adapté pour les autres statuts
      switch (status) {
        case 'listening':
          return [
            { x: 0, y: 15, duration: 2000 },
            { x: -8, y: 10, duration: 1000 },
            { x: 8, y: 10, duration: 1000 },
            { x: 0, y: 15, duration: 1500 }
          ]
        case 'speaking':
          return [
            { x: 0, y: -10, duration: 1500 },
            { x: -12, y: -5, duration: 800 },
            { x: 12, y: -5, duration: 800 },
            { x: 0, y: 5, duration: 1200 }
          ]
        case 'thinking':
          return [
            { x: -25, y: -20, duration: 2000 },
            { x: 20, y: -15, duration: 1800 },
            { x: -10, y: 25, duration: 1500 },
            { x: 15, y: -25, duration: 2200 },
            { x: 0, y: 0, duration: 1000 }
          ]
        case 'connecting':
          return [
            { x: -30, y: 0, duration: 1000 },
            { x: -15, y: -20, duration: 800 },
            { x: 15, y: -20, duration: 800 },
            { x: 30, y: 0, duration: 1000 },
            { x: 15, y: 20, duration: 800 },
            { x: -15, y: 20, duration: 800 },
            { x: 0, y: 0, duration: 1200 }
          ]
        default: // idle
          return [
            { x: -20, y: -30, duration: 2500 },
            { x: 25, y: -25, duration: 2000 },
            { x: 30, y: 10, duration: 1800 },
            { x: -15, y: 25, duration: 2200 },
            { x: 0, y: -35, duration: 1500 },
            { x: 0, y: 0, duration: 1000 },
            { x: -25, y: 0, duration: 1800 },
            { x: 25, y: 0, duration: 1800 },
            { x: 0, y: 30, duration: 1500 }
          ]
      }
    }

    const executeSequentialLook = () => {
      if (isInSequence) return

      isInSequence = true
      const patterns = getLookPatterns()
      lookSequenceIndex = 0

      const performNextLook = () => {
        if (lookSequenceIndex >= patterns.length) {
          isInSequence = false
          lookSequenceIndex = 0
          const pauseDuration = status === 'listening' ? 2000 :
                               status === 'speaking' ? 1500 :
                               status === 'thinking' ? 3000 :
                               status === 'connecting' ? 1000 : 4000
          const pauseTimer = addTimer(setTimeout(executeSequentialLook, pauseDuration))
          return
        }

        const currentPattern = patterns[lookSequenceIndex]
        setIsLookingAround(true)
        setEyePosition({ x: currentPattern.x, y: currentPattern.y })
        
        const nextTimer = addTimer(setTimeout(() => {
          lookSequenceIndex++
          performNextLook()
        }, currentPattern.duration))
      }

      performNextLook()
    }

    const initialTimer = addTimer(setTimeout(executeSequentialLook, 1000))
    return () => {
      if (initialTimer) clearTimeout(initialTimer)
      isInSequence = false
    }
  }, [status, currentSection, addTimer])

  // 👁️ MOUVEMENT D'ATTENTION SPONTANÉE (en plus des séquences)
  useEffect(() => {
    if (status === 'listening') {
      const attentionInterval = addInterval(setInterval(() => {
        const microX = (Math.random() - 0.5) * 6
        const microY = (Math.random() - 0.5) * 4

        setEyePosition(prev => ({
          x: prev.x + microX,
          y: prev.y + microY
        }))

        const returnTimer = addTimer(setTimeout(() => {
          setEyePosition(prev => ({
            x: prev.x * 0.9,
            y: prev.y * 0.9
          }))
        }, 200))
      }, 300 + Math.random() * 200))

      return () => clearInterval(attentionInterval)
    }
  }, [status, addInterval, addTimer])

  // 🎆 SUIVI DE PARTICULES COSMIQUES (effet immersif)
  useEffect(() => {
    if (status === 'idle') {
      const particleTrackingInterval = addInterval(setInterval(() => {
        const startX = -35 + Math.random() * 70
        const startY = -35 + Math.random() * 70
        const endX = startX + (Math.random() - 0.5) * 40
        const endY = startY + (Math.random() - 0.5) * 40

        setIsLookingAround(true)
        setEyePosition({ x: startX, y: startY })

        const followTimer = addTimer(setTimeout(() => {
          setEyePosition({ x: endX, y: endY })
          const loseTimer = addTimer(setTimeout(() => {
            setEyePosition({ x: 0, y: 0 })
            setIsLookingAround(false)
          }, 1500))
        }, 500))
      }, 8000 + Math.random() * 5000))

      return () => clearInterval(particleTrackingInterval)
    }
  }, [status, addInterval, addTimer])

  // 🎨 COULEURS MARBRÉES SELON STATUS
  const getMarbleColors = () => {
    if (status === 'contextual') {
      switch (currentSection) {
        case 'hero':
          return {
            primary: '#3b82f6',
            secondary: '#22c55e',
            accent: '#f59e0b',
            warm: '#a855f7'
          }
        case 'social-proof':
          return {
            primary: '#22c55e',
            secondary: '#3b82f6',
            accent: '#f59e0b',
            warm: '#ef4444'
          }
        case 'solutions':
          return {
            primary: '#a855f7',
            secondary: '#3b82f6',
            accent: '#22c55e',
            warm: '#f59e0b'
          }
        case 'benefits':
          return {
            primary: '#f59e0b',
            secondary: '#22c55e',
            accent: '#3b82f6',
            warm: '#a855f7'
          }
        default:
          return {
            primary: '#3b82f6',
            secondary: '#a855f7',
            accent: '#22c55e',
            warm: '#f59e0b'
          }
      }
    }

    switch (status) {
      case 'listening':
        return {
          primary: '#22c55e',
          secondary: '#3b82f6',
          accent: '#a855f7',
          warm: '#f59e0b'
        }
      case 'speaking':
        return {
          primary: '#3b82f6',
          secondary: '#ef4444',
          accent: '#22c55e',
          warm: '#f97316'
        }
      case 'thinking':
        return {
          primary: '#a855f7',
          secondary: '#3b82f6',
          accent: '#ef4444',
          warm: '#f59e0b'
        }
      case 'connecting':
        return {
          primary: '#f59e0b',
          secondary: '#ef4444',
          accent: '#3b82f6',
          warm: '#a855f7'
        }
      default: // idle
        return {
          primary: '#3b82f6',
          secondary: '#a855f7',
          accent: '#22c55e',
          warm: '#f59e0b'
        }
    }
  }

  if (!isClient) {
    return (
      <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
        suppressHydrationWarning
      />
    )
  }

  const colors = getMarbleColors()

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      suppressHydrationWarning
    >
      {/* 🌐 SPHÈRE TRANSLUCIDE RÉALISTE AVEC EFFET MARBRÉ */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 25% 20%,
              rgba(255, 255, 255, 0.4) 0%,
              rgba(255, 255, 255, 0.15) 25%,
              rgba(255, 255, 255, 0.05) 50%,
              transparent 80%)
          `,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `
            inset 0 0 60px rgba(255, 255, 255, 0.08),
            inset 0 0 30px rgba(255, 255, 255, 0.04),
            0 20px 60px rgba(0, 0, 0, 0.3)
          `,
          backdropFilter: 'blur(1px)',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          isolation: 'isolate'
        }}
        animate={{
          scale: status === 'speaking' ? [1, 1.03, 1] : [1, 1.01, 1],
          rotateX: [0, 2, 0],
          rotateY: [0, 1, 0]
        }}
        transition={{
          scale: { 
            duration: status === 'speaking' ? 0.8 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          },
          rotateX: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          },
          rotateY: {
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        {/* 💎 REFLETS HUMIDES/VERRE POLI */}
        <motion.div
          style={{
            position: 'absolute',
            top: '8%',
            left: '15%',
            width: '35%',
            height: '45%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, transparent 80%)',
            filter: 'blur(6px)',
            transform: 'rotate(-25deg)',
            willChange: 'transform, opacity',
            zIndex: 1
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.1, 1],
            x: [0, 5, 0],
            y: [0, -3, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Reflet secondaire - supprimé pour éviter la lueur en bas à droite */}

        {/* 🎨 EFFET MARBRÉ INTÉRIEUR - COULEURS CHAUDES ET FROIDES */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '10%',
            borderRadius: '50%',
            overflow: 'hidden'
          }}
          animate={{
            rotateZ: rotation * 0.3
          }}
        >
          {/* Marbré couche 1 - Couleur chaude (optimisée) */}
          <motion.div
            style={{
              position: 'absolute',
              top: '5%',
              left: '10%',
              width: '70%',
              height: '80%',
              background: `
                radial-gradient(ellipse 80% 60%,
                  ${colors.warm}80 0%,
                  ${colors.primary}60 30%,
                  transparent 70%)
              `,
              borderRadius: '50%',
              filter: 'blur(12px)',
              mixBlendMode: 'screen',
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)'
            }}
            animate={{
              x: [0, 15, -10, 0],
              y: [0, -12, 15, 0],
              scale: [1, 1.2, 0.9, 1],
              rotateZ: [0, 45, -30, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Marbré couche 2 - Couleur froide (optimisée) */}
          <motion.div
            style={{
              position: 'absolute',
              top: '20%',
              right: '5%',
              width: '60%',
              height: '70%',
              background: `
                radial-gradient(ellipse 70% 80%,
                  ${colors.secondary}70 0%,
                  ${colors.accent}50 40%,
                  transparent 75%)
              `,
              borderRadius: '50%',
              filter: 'blur(10px)',
              mixBlendMode: 'multiply',
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)'
            }}
            animate={{
              x: [0, -20, 12, 0],
              y: [0, 18, -8, 0],
              scale: [1, 0.8, 1.2, 1],
              rotateZ: [0, -60, 40, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
        </motion.div>

        {/* 👁️ YEUX ANIMÉS QUI REGARDENT AUTOUR ET CLIGNENT */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          {(() => {
            const eyeWidthPx = Math.max(10, Math.round(size * 0.04 * eyeScale))
            const eyeHeightPx = Math.max(28, Math.round(size * 0.21 * eyeScale))
            const blinkHeightPx = Math.max(4, Math.round(eyeHeightPx * 0.1))
            return (
              <>
                {/* Oeil gauche */}
                <motion.div
                  style={{
                    position: 'absolute',
                    left: '35%',
                    top: '42%',
                    width: `${eyeWidthPx}px`,
                    height: isBlinking ? `${blinkHeightPx}px` : `${eyeHeightPx}px`,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 100%)',
                    borderRadius: '3px',
                    boxShadow: `
                      0 0 15px rgba(255, 255, 255, 0.7),
                      0 0 30px rgba(255, 255, 255, 0.3),
                      inset 0 0 8px rgba(255, 255, 255, 0.5)
                    `,
                    transform: 'translate(-50%, -50%)',
                    willChange: 'transform, opacity'
                  }}
                  animate={{
                    scaleY: isBlinking ? 0.1 : 1,
                    opacity: [0.95, 1, 0.95],
                    x: eyePosition.x * 1.0,
                    y: eyePosition.y * 0.8,
                    boxShadow: `
                      0 0 ${status === 'speaking' ? '20px' : '15px'} rgba(255, 255, 255, 0.7),
                      0 0 ${status === 'speaking' ? '35px' : '25px'} rgba(255, 255, 255, 0.3),
                      inset 0 0 8px rgba(255, 255, 255, 0.5)
                    `
                  }}
                  transition={{
                    scaleY: { duration: isBlinking ? 0.08 : 0.15 },
                    opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    x: {
                      duration: isLookingAround ? 1.2 : 2.5,
                      ease: isLookingAround ? [0.25, 0.46, 0.45, 0.94] : "easeOut"
                    },
                    y: {
                      duration: isLookingAround ? 1.2 : 2.5,
                      ease: isLookingAround ? [0.25, 0.46, 0.45, 0.94] : "easeOut"
                    },
                    boxShadow: { duration: 0.3 }
                  }}
                />
                {/* Oeil droit */}
                <motion.div
                  style={{
                    position: 'absolute',
                    left: '65%',
                    top: '42%',
                    width: `${eyeWidthPx}px`,
                    height: isBlinking ? `${blinkHeightPx}px` : `${eyeHeightPx}px`,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 100%)',
                    borderRadius: '3px',
                    boxShadow: `
                      0 0 15px rgba(255, 255, 255, 0.7),
                      0 0 30px rgba(255, 255, 255, 0.3),
                      inset 0 0 8px rgba(255, 255, 255, 0.5)
                    `,
                    transform: 'translate(-50%, -50%)',
                    willChange: 'transform, opacity'
                  }}
                  animate={{
                    scaleY: isBlinking ? 0.1 : 1,
                    opacity: [0.95, 1, 0.95],
                    x: eyePosition.x * 1.0,
                    y: eyePosition.y * 0.8,
                    boxShadow: `
                      0 0 ${status === 'speaking' ? '20px' : '15px'} rgba(255, 255, 255, 0.7),
                      0 0 ${status === 'speaking' ? '35px' : '25px'} rgba(255, 255, 255, 0.3),
                      inset 0 0 8px rgba(255, 255, 255, 0.5)
                    `
                  }}
                  transition={{
                    scaleY: { duration: isBlinking ? 0.08 : 0.15 },
                    opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 },
                    x: {
                      duration: isLookingAround ? 1.2 : 2.5,
                      ease: isLookingAround ? [0.25, 0.46, 0.45, 0.94] : "easeOut"
                    },
                    y: {
                      duration: isLookingAround ? 1.2 : 2.5,
                      ease: isLookingAround ? [0.25, 0.46, 0.45, 0.94] : "easeOut"
                    },
                    boxShadow: { duration: 0.3 }
                  }}
                />
              </>
            )
          })()}
        </div>

        {/* ✨ PARTICULES LUMINEUSES MYSTÉRIEUSES (optimisées - réduites) */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '20%',
            opacity: 0.6,
            willChange: 'transform',
            zIndex: 0
          }}
          animate={{
            rotateZ: rotation * 0.1
          }}
        >
          {[
            { left: '15%', top: '20%', size: 1.2, delay: 0, color: colors.primary, x: 2, y: -3 },
            { left: '85%', top: '25%', size: 0.8, delay: 1.5, color: colors.secondary, x: -3, y: 2 },
            { left: '25%', top: '85%', size: 1, delay: 3, color: colors.accent, x: 4, y: -2 },
            { left: '50%', top: '15%', size: 0.7, delay: 6, color: colors.primary, x: -2, y: 3 },
            { left: '10%', top: '60%', size: 0.9, delay: 7.5, color: colors.secondary, x: 3, y: 1 }
          ].map((particle, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: particle.left,
                top: particle.top,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                borderRadius: '50%',
                background: `${particle.color}70`,
                boxShadow: `0 0 6px ${particle.color}40`,
                willChange: 'transform, opacity'
              }}
              animate={{
                opacity: [0.2, 0.7, 0.2],
                scale: [0.5, 1.2, 0.5],
                x: [0, particle.x, 0],
                y: [0, particle.y, 0]
              }}
              transition={{
                duration: 5 + particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay * 0.3
              }}
            />
          ))}
        </motion.div>

        {/* 🌟 HALO MYSTÉRIEUX SELON STATUS */}
        {status !== 'idle' && (
          <>
            <motion.div
              style={{
                position: 'absolute',
                inset: '-30px',
                borderRadius: '50%',
                border: `1px solid ${colors.primary}40`,
                opacity: 0.6
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 0.9, 0.6],
                rotateZ: [0, 360, 0]
              }}
              transition={{
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                rotateZ: { duration: 20, repeat: Infinity, ease: "linear" }
              }}
            />

            <motion.div
              style={{
                position: 'absolute',
                inset: '-50px',
                borderRadius: '50%',
                border: `1px solid ${colors.secondary}20`,
                opacity: 0.3
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.7, 0.3],
                rotateZ: [360, 0, 360]
              }}
              transition={{
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                opacity: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                rotateZ: { duration: 25, repeat: Infinity, ease: "linear" }
              }}
            />
          </>
        )}
      </motion.div>
    </div>
  )
}
