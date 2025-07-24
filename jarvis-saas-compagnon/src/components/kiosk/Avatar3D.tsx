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
      setRotation(prev => prev + 0.2)
    }, 100))
    return () => clearInterval(interval)
  }, [addInterval])

  // 👁️ CLIGNEMENTS TECH
  useEffect(() => {
    const blinkInterval = addInterval(setInterval(() => {
      setIsBlinking(true)
      const timer = addTimer(setTimeout(() => setIsBlinking(false), 100))
    }, 3000 + Math.random() * 1000))
    return () => clearInterval(blinkInterval)
  }, [addInterval, addTimer])

  // 🎨 COULEURS TECH SELON STATUS
  const getTechColor = () => {
    switch (status) {
      case 'listening': return '#00ff88' // Vert tech
      case 'speaking': return '#0099ff' // Bleu électrique
      case 'thinking': return '#aa66ff' // Violet néon
      case 'connecting': return '#ffaa00' // Orange tech
      default: return '#6699ff' // Bleu par défaut
    }
  }

  const getGlowColor = () => {
    const color = getTechColor()
    return `${color}80` // Ajout d'alpha pour le glow
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

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      suppressHydrationWarning
    >
      {/* 🤖 SPHÈRE TECH PRINCIPALE */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 20%, 
              rgba(255, 255, 255, 0.2) 0%, 
              rgba(102, 153, 255, 0.3) 20%, 
              rgba(51, 102, 204, 0.4) 50%, 
              rgba(25, 51, 102, 0.6) 80%, 
              rgba(0, 0, 0, 0.8) 100%)
          `,
          border: `2px solid ${getTechColor()}`,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `
            inset 0 0 60px rgba(255, 255, 255, 0.1),
            0 0 40px ${getGlowColor()},
            0 0 80px ${getGlowColor()}40,
            0 10px 30px rgba(0, 0, 0, 0.3)
          `,
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)'
        }}
        animate={{
          scale: status === 'speaking' ? [1, 1.03, 1] : [1, 1.01, 1],
          rotateZ: [0, 0.5, 0]
        }}
        transition={{
          scale: { 
            duration: status === 'speaking' ? 0.4 : 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          },
          rotateZ: { 
            duration: 15, 
            repeat: Infinity, 
            ease: "linear" 
          }
        }}
      >
        {/* ✨ REFLETS TECH */}
        <motion.div
          style={{
            position: 'absolute',
            top: '8%',
            left: '12%',
            width: '40%',
            height: '25%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
            filter: 'blur(8px)'
          }}
          animate={{
            opacity: [0.6, 0.9, 0.6],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* 👁️ YEUX TECH RECTANGULAIRES */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Oeil gauche - Style tech/robotique */}
          <motion.div
            style={{
              position: 'absolute',
              left: '30%',
              top: '38%',
              width: isBlinking ? '20px' : '20px',
              height: isBlinking ? '2px' : '14px',
              background: `linear-gradient(90deg, ${getTechColor()} 0%, #ffffff 50%, ${getTechColor()} 100%)`,
              borderRadius: isBlinking ? '2px' : '2px',
              boxShadow: `
                0 0 20px ${getTechColor()},
                inset 0 0 10px rgba(255, 255, 255, 0.5)
              `,
              transform: 'translate(-50%, -50%)',
              border: `1px solid ${getTechColor()}`
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.9, 1, 0.9],
              boxShadow: `
                0 0 ${status === 'speaking' ? '30px' : '20px'} ${getTechColor()},
                inset 0 0 10px rgba(255, 255, 255, 0.5)
              `
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.2 },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 0.3 }
            }}
          />
          
          {/* Oeil droit - Style tech/robotique */}
          <motion.div
            style={{
              position: 'absolute',
              left: '70%',
              top: '38%',
              width: isBlinking ? '20px' : '20px',
              height: isBlinking ? '2px' : '14px',
              background: `linear-gradient(90deg, ${getTechColor()} 0%, #ffffff 50%, ${getTechColor()} 100%)`,
              borderRadius: isBlinking ? '2px' : '2px',
              boxShadow: `
                0 0 20px ${getTechColor()},
                inset 0 0 10px rgba(255, 255, 255, 0.5)
              `,
              transform: 'translate(-50%, -50%)',
              border: `1px solid ${getTechColor()}`
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.9, 1, 0.9],
              boxShadow: `
                0 0 ${status === 'speaking' ? '30px' : '20px'} ${getTechColor()},
                inset 0 0 10px rgba(255, 255, 255, 0.5)
              `
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.2 },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.1 },
              boxShadow: { duration: 0.3 }
            }}
          />
        </div>

        {/* 💫 ÉLÉMENTS TECH INTÉRIEURS */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '20%',
            opacity: 0.4
          }}
          animate={{
            rotateZ: rotation * 0.03
          }}
        >
          {/* Particules tech minimalistes */}
          {[
            { left: '25%', top: '25%', size: 2 },
            { left: '75%', top: '30%', size: 1.5 },
            { left: '35%', top: '75%', size: 2 },
            { left: '65%', top: '70%', size: 1.5 }
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
                background: getTechColor(),
                boxShadow: `0 0 8px ${getTechColor()}`
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
            />
          ))}
        </motion.div>

        {/* 🔷 ANNEAUX TECH QUAND ACTIF */}
        {(status === 'listening' || status === 'speaking') && (
          <>
            <motion.div
              style={{
                position: 'absolute',
                inset: '-15px',
                borderRadius: '50%',
                border: `1px solid ${getTechColor()}`,
                opacity: 0.6
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.9, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              style={{
                position: 'absolute',
                inset: '-25px',
                borderRadius: '50%',
                border: `1px solid ${getTechColor()}`,
                opacity: 0.3
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </>
        )}

        {/* ⚡ LIGNES TECH DYNAMIQUES */}
        {status === 'thinking' && (
          <motion.div
            style={{
              position: 'absolute',
              inset: '35%',
              borderRadius: '50%',
              border: `1px dashed ${getTechColor()}`,
              opacity: 0.7
            }}
            animate={{
              rotateZ: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotateZ: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        )}
      </motion.div>
    </div>
  )
} 