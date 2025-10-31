"use client"
import { motion } from 'framer-motion'
import { useEffect, useState, useRef, useCallback } from 'react'

interface Avatar3DProps {
  status: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting' | 'contextual'
  size?: number
  className?: string
  eyeScale?: number
  currentSection?: 'hero' | 'social-proof' | 'solutions' | 'benefits'
  isListening?: boolean
  isSpeaking?: boolean
}

/**
 * Avatar3D - Version 2D Motion Graphics Optimisée
 * Design monochrome (blanc, gris, noir) avec performance maximale
 */
export default function Avatar3D({ 
  status: propStatus, 
  size = 450, 
  className, 
  eyeScale = 1, 
  currentSection = 'hero',
  isListening: propIsListening = false,
  isSpeaking: propIsSpeaking = false
}: Avatar3DProps) {
  const status = propIsListening ? 'listening' : 
                 propIsSpeaking ? 'speaking' : 
                 propStatus || 'idle'
  
  const [isBlinking, setIsBlinking] = useState(false)
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
  const [isLookingAround, setIsLookingAround] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeTimers = useRef<Set<NodeJS.Timeout>>(new Set())

  useEffect(() => {
    setIsClient(true)
  }, [])

  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    activeTimers.current.add(timer)
    return timer
  }, [])

  useEffect(() => {
    return () => {
      activeTimers.current.forEach(timer => clearTimeout(timer))
      activeTimers.current.clear()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Clignements optimisés
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true)
      const timer = addTimer(setTimeout(() => setIsBlinking(false), 150))
      const nextBlink = 2000 + Math.random() * 3000
      timeoutRef.current = addTimer(setTimeout(blink, nextBlink))
    }
    timeoutRef.current = addTimer(setTimeout(blink, 2000))
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [addTimer])

  // Mouvement des yeux simplifié
  useEffect(() => {
    let lookSequenceIndex = 0
    let isInSequence = false

    const getLookPatterns = () => {
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
        default: // idle
          return [
            { x: -20, y: -20, duration: 2500 },
            { x: 20, y: -15, duration: 2000 },
            { x: -15, y: 15, duration: 1800 },
            { x: 0, y: 0, duration: 1500 }
          ]
      }
    }

    const executeLook = () => {
      if (isInSequence) return
      isInSequence = true
      const patterns = getLookPatterns()
      lookSequenceIndex = 0

      const performNextLook = () => {
        if (lookSequenceIndex >= patterns.length) {
          isInSequence = false
          lookSequenceIndex = 0
          const pauseTimer = addTimer(setTimeout(executeLook, 4000))
          return
        }

        const pattern = patterns[lookSequenceIndex]
        setIsLookingAround(true)
        setEyePosition({ x: pattern.x, y: pattern.y })
        
        const nextTimer = addTimer(setTimeout(() => {
          lookSequenceIndex++
          performNextLook()
        }, pattern.duration))
      }

      performNextLook()
    }

    const initialTimer = addTimer(setTimeout(executeLook, 1000))
    return () => {
      if (initialTimer) clearTimeout(initialTimer)
      isInSequence = false
    }
  }, [status, addTimer])

  // Couleurs monochrome selon le statut
  const getMonochromeColors = () => {
    switch (status) {
      case 'listening':
        return {
          sphere: 'rgba(255, 255, 255, 0.15)',
          border: 'rgba(255, 255, 255, 0.4)',
          shadow: 'rgba(0, 0, 0, 0.3)',
          glow: 'rgba(255, 255, 255, 0.1)'
        }
      case 'speaking':
        return {
          sphere: 'rgba(255, 255, 255, 0.2)',
          border: 'rgba(255, 255, 255, 0.5)',
          shadow: 'rgba(0, 0, 0, 0.4)',
          glow: 'rgba(255, 255, 255, 0.15)'
        }
      default: // idle
        return {
          sphere: 'rgba(255, 255, 255, 0.12)',
          border: 'rgba(255, 255, 255, 0.3)',
          shadow: 'rgba(0, 0, 0, 0.25)',
          glow: 'rgba(255, 255, 255, 0.08)'
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

  const colors = getMonochromeColors()
  const eyeWidthPx = Math.max(10, Math.round(size * 0.04 * eyeScale))
  const eyeHeightPx = Math.max(28, Math.round(size * 0.21 * eyeScale))
  const blinkHeightPx = Math.max(4, Math.round(eyeHeightPx * 0.1))

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
      {/* SPHÈRE PRINCIPALE - Design 2D optimisé */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 30%,
              ${colors.sphere} 0%,
              rgba(255, 255, 255, 0.05) 50%,
              transparent 80%)
          `,
          border: `1px solid ${colors.border}`,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `
            inset 0 0 40px rgba(255, 255, 255, 0.05),
            0 8px 32px ${colors.shadow},
            0 0 0 1px rgba(0, 0, 0, 0.1)
          `,
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)'
        }}
        animate={{
          scale: status === 'speaking' ? [1, 1.02, 1] : [1, 1.005, 1]
        }}
        transition={{
          duration: status === 'speaking' ? 0.8 : 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Reflet principal (haut-gauche) */}
        <motion.div
          style={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            willChange: 'transform, opacity'
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Pattern subtil interne - monochrome */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '15%',
            borderRadius: '50%',
            background: `
              radial-gradient(circle at 50% 50%,
                rgba(255, 255, 255, 0.08) 0%,
                rgba(200, 200, 200, 0.04) 40%,
                transparent 70%)
            `,
            willChange: 'transform'
          }}
          animate={{
            rotateZ: [0, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* YEUX ANIMÉS - Élément signature conservé */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          {/* Oeil gauche */}
          <motion.div
            style={{
              position: 'absolute',
              left: '35%',
              top: '42%',
              width: `${eyeWidthPx}px`,
              height: isBlinking ? `${blinkHeightPx}px` : `${eyeHeightPx}px`,
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '2px',
              boxShadow: `
                0 0 12px rgba(255, 255, 255, 0.6),
                inset 0 0 6px rgba(255, 255, 255, 0.4)
              `,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.95, 1, 0.95],
              x: eyePosition.x * 1.0,
              y: eyePosition.y * 0.8
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
              }
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
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '2px',
              boxShadow: `
                0 0 12px rgba(255, 255, 255, 0.6),
                inset 0 0 6px rgba(255, 255, 255, 0.4)
              `,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.95, 1, 0.95],
              x: eyePosition.x * 1.0,
              y: eyePosition.y * 0.8
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
              }
            }}
          />
        </div>

        {/* PARTICULES SIMPLIFIÉES - Monochrome */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '20%',
            opacity: 0.5,
            willChange: 'transform',
            zIndex: 0
          }}
        >
          {[
            { left: '20%', top: '25%', size: 1, delay: 0 },
            { left: '80%', top: '30%', size: 0.8, delay: 2 },
            { left: '30%', top: '80%', size: 0.9, delay: 4 },
            { left: '60%', top: '20%', size: 0.7, delay: 6 }
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
                background: 'rgba(255, 255, 255, 0.6)',
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)',
                willChange: 'transform, opacity'
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.3, 0.8]
              }}
              transition={{
                duration: 4 + particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay
              }}
            />
          ))}
        </motion.div>

        {/* HALO SUBTIL selon statut - Monochrome */}
        {status !== 'idle' && (
          <motion.div
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              border: `1px solid ${colors.glow}`,
              opacity: 0.4,
              willChange: 'transform'
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
    </div>
  )
}

