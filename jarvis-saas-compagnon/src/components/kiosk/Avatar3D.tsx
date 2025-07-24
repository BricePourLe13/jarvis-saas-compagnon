"use client"
import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useVoiceVisualSync } from '@/hooks/useVoiceVisualSync'

interface Avatar3DProps {
  status: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting'
  size?: number
  className?: string
}

export default function Avatar3D({ status, size = 450, className }: Avatar3DProps) {
  const [rotation, setRotation] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [mood, setMood] = useState<'happy' | 'excited' | 'curious' | 'sleepy'>('happy')
  
  const animationFrameRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 🎭 HOOK DE SYNCHRONISATION AUDIO-VISUELLE
  const voiceSync = useVoiceVisualSync()
  
  // Synchroniser avec le système vocal
  useEffect(() => {
    if (status === 'listening') {
      voiceSync.setListeningState(true)
      setMood('curious')
    } else if (status === 'speaking') {
      voiceSync.setSpeakingState(true)
      setMood('excited')
    } else {
      voiceSync.setListeningState(false)
      voiceSync.setSpeakingState(false)
      setMood(status === 'thinking' ? 'curious' : 'happy')
    }
  }, [status, voiceSync])

  // ⚡ MEMORY MANAGEMENT - Simplifié
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
  
  // 🔄 ROTATION DOUCE
  useEffect(() => {
    const interval = addInterval(setInterval(() => {
      setRotation(prev => prev + 0.3)
    }, 150))
    return () => clearInterval(interval)
  }, [addInterval])

  // 👁️ CLIGNEMENTS MIGNONS
  useEffect(() => {
    const blinkInterval = addInterval(setInterval(() => {
      setIsBlinking(true)
      const timer = addTimer(setTimeout(() => setIsBlinking(false), 120))
    }, 2500 + Math.random() * 2000)) // Variation naturelle
    return () => clearInterval(blinkInterval)
  }, [addInterval, addTimer])

  // 🎨 COULEURS SELON STATUS (plus chaleureuses)
  const getMainColor = () => {
    switch (status) {
      case 'listening': return 'rgba(52, 211, 153, 0.9)' // Vert émeraude
      case 'speaking': return 'rgba(96, 165, 250, 0.9)' // Bleu ciel
      case 'thinking': return 'rgba(168, 85, 247, 0.9)' // Violet magique
      case 'connecting': return 'rgba(251, 191, 36, 0.9)' // Orange chaleureux
      default: return 'rgba(165, 180, 252, 0.8)' // Bleu doux
    }
  }

  const getSecondaryColor = () => {
    switch (status) {
      case 'listening': return 'rgba(52, 211, 153, 0.3)'
      case 'speaking': return 'rgba(96, 165, 250, 0.3)'
      case 'thinking': return 'rgba(168, 85, 247, 0.3)'
      case 'connecting': return 'rgba(251, 191, 36, 0.3)'
      default: return 'rgba(165, 180, 252, 0.2)'
    }
  }

  // 👁️ DESIGN DES YEUX MIGNONS
  const getEyeStyle = () => {
    if (isBlinking) {
      return {
        width: '14px',
        height: '2px',
        borderRadius: '2px'
      }
    }
    
    switch (mood) {
      case 'excited':
        return {
          width: '16px',
          height: '20px',
          borderRadius: '50%'
        }
      case 'curious':
        return {
          width: '12px',
          height: '18px',
          borderRadius: '50%'
        }
      case 'sleepy':
        return {
          width: '14px',
          height: '12px',
          borderRadius: '50%'
        }
      default: // happy
        return {
          width: '14px',
          height: '16px',
          borderRadius: '50%'
        }
    }
  }

  // 😊 EXPRESSION DU VISAGE
  const getFaceExpression = () => {
    switch (mood) {
      case 'excited':
        return [1.02, 1.08, 1.02] // Plus gros quand excité
      case 'curious':
        return [1, 1.04, 1] // Légèrement plus gros
      case 'sleepy':
        return [1, 0.98, 1] // Plus petit
      default:
        return [1, 1.02, 1] // Happy bounce
    }
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 🌟 SPHÈRE PRINCIPALE MIGNONNE */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 35% 25%, 
              rgba(255, 255, 255, 0.4) 0%, 
              ${getMainColor()} 20%, 
              ${getSecondaryColor()} 60%, 
              rgba(0, 0, 0, 0.1) 100%)
          `,
          border: '3px solid rgba(255, 255, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `
            inset 0 0 80px rgba(255, 255, 255, 0.15),
            0 0 60px ${getSecondaryColor()},
            0 20px 40px rgba(0, 0, 0, 0.1)
          `,
          cursor: status === 'idle' ? 'pointer' : 'default',
          willChange: 'transform'
        }}
        animate={{
          scale: getFaceExpression(),
          rotateZ: [0, 1, 0, -1, 0],
        }}
        transition={{
          scale: { 
            duration: status === 'speaking' ? 0.6 : 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          },
          rotateZ: { 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* ✨ REFLET GLASSMORPHISM */}
        <motion.div
          style={{
            position: 'absolute',
            top: '12%',
            left: '15%',
            width: '45%',
            height: '35%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
            filter: 'blur(15px)'
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* 👁️ YEUX MIGNONS EXPRESSIFS */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Oeil gauche */}
          <motion.div
            style={{
              position: 'absolute',
              left: '32%',
              top: '40%',
              background: getMainColor(),
              boxShadow: `0 0 15px ${getMainColor()}`,
              transform: 'translate(-50%, -50%)',
              ...getEyeStyle()
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              y: mood === 'curious' ? [-2, 2, -2] : [0, 0, 0]
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.3 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* Oeil droit */}
          <motion.div
            style={{
              position: 'absolute',
              left: '68%',
              top: '40%',
              background: getMainColor(),
              boxShadow: `0 0 15px ${getMainColor()}`,
              transform: 'translate(-50%, -50%)',
              ...getEyeStyle()
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              y: mood === 'curious' ? [-2, 2, -2] : [0, 0, 0]
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.3 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }
            }}
          />

          {/* 🌟 Petites étincelles dans les yeux quand excité */}
          {mood === 'excited' && (
            <>
              <motion.div
                style={{
                  position: 'absolute',
                  left: '32%',
                  top: '40%',
                  width: '4px',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                style={{
                  position: 'absolute',
                  left: '68%',
                  top: '40%',
                  width: '4px',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </>
          )}
        </div>

        {/* 💫 COSMOS INTÉRIEUR MIGNON - Juste quelques étoiles mignonnes */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '25%',
            opacity: 0.6
          }}
          animate={{
            rotateZ: rotation * 0.05
          }}
        >
          {/* Petites étoiles mignonnes */}
          {[
            { left: '20%', top: '30%', size: 3, delay: 0 },
            { left: '80%', top: '25%', size: 2, delay: 1 },
            { left: '30%', top: '70%', size: 2.5, delay: 2 },
            { left: '70%', top: '75%', size: 2, delay: 3 }
          ].map((star, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)'
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 3 + star.delay,
                repeat: Infinity,
                ease: "easeInOut",
                delay: star.delay * 0.5
              }}
            />
          ))}
        </motion.div>

        {/* 🌈 AURA ÉMOTIONNELLE SELON STATUS */}
        {(status === 'listening' || status === 'speaking') && (
          <motion.div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: `2px solid ${getMainColor()}`,
              opacity: 0.4
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>

      {/* 💕 CŒURS FLOTTANTS QUAND HEUREUX */}
      {mood === 'happy' && status === 'idle' && (
        <motion.div
          style={{
            position: 'absolute',
            top: '10%',
            right: '15%',
            fontSize: '16px',
            opacity: 0.6
          }}
          animate={{
            y: [-10, -30, -10],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          💕
        </motion.div>
      )}
    </div>
  )
} 