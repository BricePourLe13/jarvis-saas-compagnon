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
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
  const [isBlinking, setIsBlinking] = useState(false)
  
  const animationFrameRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sphereControls = useAnimationControls()
  const linesControls = useAnimationControls()
  
  // 🎭 HOOK DE SYNCHRONISATION AUDIO-VISUELLE - PHASE 6
  const voiceSync = useVoiceVisualSync()
  
  // Synchroniser les contrôles d'animation avec le système vocal
  useEffect(() => {
    // Adapter le status JARVIS pour les états de voix
    if (status === 'listening') {
      voiceSync.setListeningState(true)
    } else if (status === 'speaking') {
      voiceSync.setSpeakingState(true)
    } else {
      voiceSync.setListeningState(false)
      voiceSync.setSpeakingState(false)
    }
  }, [status, voiceSync])

  // ⚡ MEMORY MANAGEMENT SYSTEM - SIMPLIFIÉ
  const activeTimers = useRef<Set<NodeJS.Timeout>>(new Set())
  const activeIntervals = useRef<Set<NodeJS.Timeout>>(new Set())
  const activeAnimationFrames = useRef<Set<number>>(new Set())

  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    activeTimers.current.add(timer)
    return timer
  }, [])

  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    activeIntervals.current.add(interval)
    return interval
  }, [])

  const addAnimationFrame = useCallback((frame: number) => {
    activeAnimationFrames.current.add(frame)
    return frame
  }, [])

  const cleanupResources = useCallback(() => {
    activeTimers.current.forEach(timer => clearTimeout(timer))
    activeTimers.current.clear()

    activeIntervals.current.forEach(interval => clearInterval(interval))
    activeIntervals.current.clear()

    activeAnimationFrames.current.forEach(frame => cancelAnimationFrame(frame))
    activeAnimationFrames.current.clear()

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // ⚡ GLOBAL CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      cleanupResources()
    }
  }, [cleanupResources])
  
  // 🔄 ROTATION SIMPLIFIÉE
  useEffect(() => {
    const interval = addInterval(setInterval(() => {
      setRotation(prev => prev + 0.5) // Ralenti
    }, 200)) // Plus lent
    
    return () => clearInterval(interval)
  }, [addInterval])

  // 👁️ SIMPLE BLINKING
  useEffect(() => {
    const blinkInterval = addInterval(setInterval(() => {
      setIsBlinking(true)
      const timer = addTimer(setTimeout(() => setIsBlinking(false), 150))
    }, 3000))
    
    return () => clearInterval(blinkInterval)
  }, [addInterval, addTimer])

  // 🎯 COULEUR DES YEUX SELON STATUS
  const getEyeColor = () => {
    switch (status) {
      case 'listening': return 'rgba(34, 197, 94, 0.9)' // Vert
      case 'speaking': return 'rgba(59, 130, 246, 0.9)' // Bleu
      case 'thinking': return 'rgba(139, 92, 246, 0.9)' // Violet
      case 'connecting': return 'rgba(251, 191, 36, 0.9)' // Orange
      default: return 'rgba(156, 163, 175, 0.8)' // Gris
    }
  }

  // 🎨 COULEUR SPHÈRE SELON STATUS
  const getSphereColor = () => {
    switch (status) {
      case 'listening': return 'rgba(34, 197, 94, 0.1)'
      case 'speaking': return 'rgba(59, 130, 246, 0.1)'
      case 'thinking': return 'rgba(139, 92, 246, 0.1)'
      case 'connecting': return 'rgba(251, 191, 36, 0.1)'
      default: return 'rgba(156, 163, 175, 0.05)'
    }
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 🌐 SPHÈRE PRINCIPALE SIMPLIFIÉE */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.3) 0%, 
            ${getSphereColor()} 40%, 
            rgba(0, 0, 0, 0.1) 100%)`,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `
            inset 0 0 60px rgba(255, 255, 255, 0.1),
            0 0 60px ${getSphereColor()},
            0 0 100px rgba(0, 0, 0, 0.1)
          `,
          // ⚡ OPTIMISATION GPU MINIMALE
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)'
        }}
        animate={{
          scale: status === 'speaking' ? [1, 1.02, 1] : [1, 1.005, 1],
          rotateZ: [0, 0.5, 0]
        }}
        transition={{
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          rotateZ: { duration: 8, repeat: Infinity, ease: "linear" }
        }}
      >
        {/* 👁️ YEUX SIMPLIFIÉS */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Oeil gauche */}
          <motion.div
            style={{
              position: 'absolute',
              left: '35%',
              top: '42%',
              width: '8px',
              height: '12px',
              background: getEyeColor(),
              borderRadius: '50%',
              boxShadow: `0 0 10px ${getEyeColor()}`,
              transform: 'translate3d(-50%, -50%, 0)'
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.3 },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* Oeil droit */}
          <motion.div
            style={{
              position: 'absolute',
              left: '65%',
              top: '42%',
              width: '8px',
              height: '12px',
              background: getEyeColor(),
              borderRadius: '50%',
              boxShadow: `0 0 10px ${getEyeColor()}`,
              transform: 'translate3d(-50%, -50%, 0)'
            }}
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              scaleY: { duration: isBlinking ? 0.1 : 0.3 },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </div>

        {/* ✨ COSMOS ULTRA-SIMPLIFIÉ - Seulement 3 étoiles */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '30px'
          }}
          animate={{
            rotateZ: rotation * 0.1
          }}
        >
          {/* Étoile 1 */}
          <motion.div
            style={{
              position: 'absolute',
              left: '25%',
              top: '25%',
              width: '2px',
              height: '2px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%'
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Étoile 2 */}
          <motion.div
            style={{
              position: 'absolute',
              left: '70%',
              top: '35%',
              width: '1.5px',
              height: '1.5px',
              background: 'rgba(147, 197, 253, 0.7)',
              borderRadius: '50%'
            }}
            animate={{
              opacity: [0.4, 0.9, 0.4]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* Étoile 3 */}
          <motion.div
            style={{
              position: 'absolute',
              left: '45%',
              top: '65%',
              width: '1px',
              height: '1px',
              background: 'rgba(196, 181, 253, 0.5)',
              borderRadius: '50%'
            }}
            animate={{
              opacity: [0.2, 0.7, 0.2]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
} 