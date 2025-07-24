"use client"
import { motion } from 'framer-motion'
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
  const [isClient, setIsClient] = useState(false)
  
  const animationFrameRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 🎭 HOOK DE SYNCHRONISATION AUDIO-VISUELLE
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
  }, [status, voiceSync])

  // ⚡ MEMORY MANAGEMENT
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
  
  // 🔄 ROTATION FLUIDE
  useEffect(() => {
    const interval = addInterval(setInterval(() => {
      setRotation(prev => prev + 0.1)
    }, 100))
    return () => clearInterval(interval)
  }, [addInterval])

  // 👁️ CLIGNEMENTS NATURELS
  useEffect(() => {
    const blinkInterval = addInterval(setInterval(() => {
      setIsBlinking(true)
      const timer = addTimer(setTimeout(() => setIsBlinking(false), 150))
    }, 3000 + Math.random() * 2000))
    return () => clearInterval(blinkInterval)
  }, [addInterval, addTimer])

  // 🎨 COULEURS INTÉRIEURES SELON STATUS
  const getInnerColors = () => {
    switch (status) {
      case 'listening': 
        return {
          primary: 'rgba(34, 197, 94, 0.6)', // Vert
          secondary: 'rgba(59, 130, 246, 0.4)', // Bleu
          accent: 'rgba(168, 85, 247, 0.3)' // Violet
        }
      case 'speaking': 
        return {
          primary: 'rgba(59, 130, 246, 0.6)', // Bleu dominant
          secondary: 'rgba(239, 68, 68, 0.4)', // Rouge
          accent: 'rgba(34, 197, 94, 0.3)' // Vert
        }
      case 'thinking': 
        return {
          primary: 'rgba(168, 85, 247, 0.6)', // Violet dominant
          secondary: 'rgba(59, 130, 246, 0.4)', // Bleu
          accent: 'rgba(239, 68, 68, 0.3)' // Rouge
        }
      case 'connecting': 
        return {
          primary: 'rgba(251, 191, 36, 0.6)', // Orange
          secondary: 'rgba(239, 68, 68, 0.4)', // Rouge
          accent: 'rgba(59, 130, 246, 0.3)' // Bleu
        }
      default: // idle
        return {
          primary: 'rgba(59, 130, 246, 0.4)', // Bleu doux
          secondary: 'rgba(168, 85, 247, 0.3)', // Violet
          accent: 'rgba(34, 197, 94, 0.2)' // Vert subtle
        }
    }
  }

  // Ne rien rendre côté serveur pour éviter l'hydratation mismatch
  if (!isClient) {
    return (
      <div 
        className={`relative ${className}`}
        style={{ width: size, height: size }}
        suppressHydrationWarning
      />
    )
  }

  const colors = getInnerColors()

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      suppressHydrationWarning
    >
      {/* 🔮 SPHÈRE TRANSPARENTE COMME TON IMAGE */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 20%, 
              rgba(255, 255, 255, 0.3) 0%, 
              rgba(255, 255, 255, 0.1) 30%, 
              rgba(255, 255, 255, 0.05) 60%, 
              transparent 100%)
          `,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `
            inset 0 0 60px rgba(255, 255, 255, 0.15),
            0 0 40px rgba(255, 255, 255, 0.1),
            0 20px 40px rgba(0, 0, 0, 0.1)
          `,
          backdropFilter: 'blur(2px)',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)'
        }}
        animate={{
          scale: status === 'speaking' ? [1, 1.02, 1] : [1, 1.005, 1],
        }}
        transition={{
          scale: { 
            duration: status === 'speaking' ? 1 : 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }
        }}
      >
        {/* ✨ REFLET PRINCIPAL COMME DU VERRE */}
        <motion.div
          style={{
            position: 'absolute',
            top: '5%',
            left: '10%',
            width: '50%',
            height: '40%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
            filter: 'blur(12px)',
            transform: 'rotate(-20deg)'
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

        {/* 🌈 COULEURS FLUIDES INTÉRIEURES - EXACTEMENT COMME TON IMAGE */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '15%',
            borderRadius: '50%',
            overflow: 'hidden'
          }}
          animate={{
            rotateZ: rotation * 0.5
          }}
        >
          {/* Couleur primaire fluide */}
          <motion.div
            style={{
              position: 'absolute',
              top: '10%',
              left: '20%',
              width: '60%',
              height: '80%',
              background: `radial-gradient(ellipse, ${colors.primary} 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(15px)'
            }}
            animate={{
              x: [0, 10, -5, 0],
              y: [0, -8, 12, 0],
              scale: [1, 1.2, 0.9, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Couleur secondaire fluide */}
          <motion.div
            style={{
              position: 'absolute',
              top: '30%',
              right: '10%',
              width: '50%',
              height: '60%',
              background: `radial-gradient(ellipse, ${colors.secondary} 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(20px)'
            }}
            animate={{
              x: [0, -15, 8, 0],
              y: [0, 10, -6, 0],
              scale: [1, 0.8, 1.3, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />

          {/* Couleur d'accent fluide */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '30%',
              width: '40%',
              height: '50%',
              background: `radial-gradient(ellipse, ${colors.accent} 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(18px)'
            }}
            animate={{
              x: [0, 12, -10, 0],
              y: [0, -12, 8, 0],
              scale: [1, 1.1, 0.85, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
        </motion.div>

        {/* 👁️ YEUX BARRES VERTICALES BLANCHES - EXACTEMENT COMME TON IMAGE */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Oeil gauche - Barre verticale blanche */}
          <motion.div
            style={{
              position: 'absolute',
              left: '32%',
              top: '45%',
              width: '3px',
              height: isBlinking ? '2px' : '24px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 100%)',
              borderRadius: '2px',
              boxShadow: `
                0 0 20px rgba(255, 255, 255, 0.8),
                0 0 40px rgba(255, 255, 255, 0.4),
                inset 0 0 8px rgba(255, 255, 255, 0.6)
              `,
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.9, 1, 0.9],
              boxShadow: `
                0 0 ${status === 'speaking' ? '30px' : '20px'} rgba(255, 255, 255, 0.8),
                0 0 ${status === 'speaking' ? '50px' : '40px'} rgba(255, 255, 255, 0.4),
                inset 0 0 8px rgba(255, 255, 255, 0.6)
              `
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.2 },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 0.3 }
            }}
          />
          
          {/* Oeil droit - Barre verticale blanche */}
          <motion.div
            style={{
              position: 'absolute',
              left: '68%',
              top: '45%',
              width: '3px',
              height: isBlinking ? '2px' : '24px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 100%)',
              borderRadius: '2px',
              boxShadow: `
                0 0 20px rgba(255, 255, 255, 0.8),
                0 0 40px rgba(255, 255, 255, 0.4),
                inset 0 0 8px rgba(255, 255, 255, 0.6)
              `,
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.9, 1, 0.9],
              boxShadow: `
                0 0 ${status === 'speaking' ? '30px' : '20px'} rgba(255, 255, 255, 0.8),
                0 0 ${status === 'speaking' ? '50px' : '40px'} rgba(255, 255, 255, 0.4),
                inset 0 0 8px rgba(255, 255, 255, 0.6)
              `
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.2 },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.1 },
              boxShadow: { duration: 0.3 }
            }}
          />
        </div>

        {/* 💫 PARTICULES LUMINEUSES SUBTILES */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '25%',
            opacity: 0.6
          }}
          animate={{
            rotateZ: rotation * 0.2
          }}
        >
          {[
            { left: '20%', top: '30%', size: 1.5, delay: 0 },
            { left: '80%', top: '25%', size: 1, delay: 1 },
            { left: '30%', top: '80%', size: 1.2, delay: 2 },
            { left: '70%', top: '75%', size: 1, delay: 3 }
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
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)'
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 4 + particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay * 0.5
              }}
            />
          ))}
        </motion.div>

        {/* 🌟 EFFET DE HALO SELON STATUS */}
        {status !== 'idle' && (
          <motion.div
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              opacity: 0.5
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
    </div>
  )
} 