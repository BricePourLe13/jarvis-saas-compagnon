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
    // Mapper les contrôles existants avec le système de synchronisation
    const syncedSphereControls = voiceSync.sphereControls
    const syncedEyeControls = voiceSync.eyeControls
    
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

  // ⚡ MEMORY MANAGEMENT SYSTEM
  const activeTimers = useRef<Set<NodeJS.Timeout>>(new Set())
  const activeIntervals = useRef<Set<NodeJS.Timeout>>(new Set())
  const activeAnimationFrames = useRef<Set<number>>(new Set())

  // Gestionnaire universel de cleanup
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
    // Cleanup timers
    activeTimers.current.forEach(timer => {
      clearTimeout(timer)
    })
    activeTimers.current.clear()

    // Cleanup intervals
    activeIntervals.current.forEach(interval => {
      clearInterval(interval)
    })
    activeIntervals.current.clear()

    // Cleanup animation frames
    activeAnimationFrames.current.forEach(frame => {
      cancelAnimationFrame(frame)
    })
    activeAnimationFrames.current.clear()

    // Cleanup refs
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])
  
  // COSMOS INTÉRIEUR COMPLEXE - comme dans les comics
  const cosmicElements = {
    // Couche lointaine - Micro-galaxies et étoiles distantes
    farStars: [
      { x: 15, y: 20, size: 0.8, type: 'micro', color: 'rgba(255,255,255,0.3)', opacity: 0.4 },
      { x: 85, y: 25, size: 1, type: 'distant', color: 'rgba(147,197,253,0.4)', opacity: 0.5 },
      { x: 25, y: 70, size: 0.9, type: 'micro', color: 'rgba(255,255,255,0.3)', opacity: 0.3 },
      { x: 75, y: 75, size: 1.1, type: 'distant', color: 'rgba(196,181,253,0.4)', opacity: 0.6 },
      { x: 45, y: 15, size: 0.7, type: 'micro', color: 'rgba(253,224,71,0.3)', opacity: 0.4 },
      { x: 65, y: 80, size: 1, type: 'distant', color: 'rgba(147,197,253,0.3)', opacity: 0.5 },
      { x: 35, y: 85, size: 0.8, type: 'micro', color: 'rgba(255,255,255,0.4)', opacity: 0.3 },
      { x: 80, y: 35, size: 1.2, type: 'distant', color: 'rgba(196,181,253,0.5)', opacity: 0.4 },
      { x: 20, y: 60, size: 0.9, type: 'micro', color: 'rgba(253,224,71,0.4)', opacity: 0.5 },
      { x: 90, y: 45, size: 1, type: 'distant', color: 'rgba(255,255,255,0.4)', opacity: 0.4 }
    ],
    
    // Couche moyenne - Étoiles normales colorées
    midStars: [
      { x: 30, y: 30, size: 1.5, type: 'normal', color: 'rgba(255,255,255,0.8)', opacity: 0.7 },
      { x: 70, y: 40, size: 1.8, type: 'colored', color: 'rgba(147,197,253,0.7)', opacity: 0.8 },
      { x: 40, y: 65, size: 1.6, type: 'normal', color: 'rgba(255,255,255,0.7)', opacity: 0.6 },
      { x: 60, y: 25, size: 2, type: 'colored', color: 'rgba(196,181,253,0.8)', opacity: 0.8 },
      { x: 25, y: 45, size: 1.7, type: 'colored', color: 'rgba(253,224,71,0.6)', opacity: 0.7 },
      { x: 75, y: 60, size: 1.4, type: 'normal', color: 'rgba(255,255,255,0.8)', opacity: 0.7 },
      { x: 50, y: 80, size: 1.9, type: 'colored', color: 'rgba(147,197,253,0.6)', opacity: 0.6 },
      { x: 80, y: 20, size: 1.5, type: 'normal', color: 'rgba(255,255,255,0.7)', opacity: 0.8 }
    ],
    
    // Couche proche - Étoiles brillantes et mini-nébuleuses
    nearStars: [
      { x: 35, y: 35, size: 2.5, type: 'bright', color: 'rgba(255,255,255,0.9)', opacity: 0.9 },
      { x: 65, y: 50, size: 3, type: 'nebula', color: 'rgba(147,197,253,0.6)', opacity: 0.7 },
      { x: 45, y: 70, size: 2.8, type: 'bright', color: 'rgba(253,224,71,0.8)', opacity: 0.8 },
      { x: 55, y: 25, size: 2.2, type: 'bright', color: 'rgba(255,255,255,0.9)', opacity: 0.9 },
      { x: 25, y: 55, size: 3.2, type: 'nebula', color: 'rgba(196,181,253,0.5)', opacity: 0.6 },
      { x: 75, y: 35, size: 2.6, type: 'bright', color: 'rgba(147,197,253,0.8)', opacity: 0.8 }
    ],
    
    // Poussière stellaire ultra-fine
    starDust: [
      { x: 20, y: 40, size: 0.5, opacity: 0.2 },
      { x: 60, y: 15, size: 0.4, opacity: 0.3 },
      { x: 40, y: 90, size: 0.6, opacity: 0.2 },
      { x: 85, y: 55, size: 0.4, opacity: 0.3 },
      { x: 15, y: 75, size: 0.5, opacity: 0.2 },
      { x: 70, y: 85, size: 0.4, opacity: 0.3 },
      { x: 50, y: 10, size: 0.6, opacity: 0.2 },
      { x: 90, y: 30, size: 0.4, opacity: 0.3 },
      { x: 30, y: 95, size: 0.5, opacity: 0.2 },
      { x: 10, y: 50, size: 0.4, opacity: 0.3 }
    ]
  }

  // ⚡ GLOBAL CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      cleanupResources()
    }
  }, [cleanupResources])

  // Animation de rotation - OPTIMISÉE
  useEffect(() => {
    if (typeof window === 'undefined') return

    const rotationInterval = addInterval(setInterval(() => {
      setRotation(prev => prev + 0.05)
    }, 120))

    return () => {
      activeIntervals.current.delete(rotationInterval)
      clearInterval(rotationInterval)
    }
  }, [addInterval])

  // Animation de clignement naturel - OPTIMISÉE  
  useEffect(() => {
    if (typeof window === 'undefined') return

    const blinkTimer = addTimer(setTimeout(() => {
      const scheduleNextBlink = () => {
        setIsBlinking(true)
        const openTimer = addTimer(setTimeout(() => {
          setIsBlinking(false)
          const nextBlinkTimer = addTimer(setTimeout(scheduleNextBlink, 3000 + Math.random() * 5000))
        }, 120))
      }
      scheduleNextBlink()
    }, 4000))

    return () => {
      activeTimers.current.delete(blinkTimer)
      clearTimeout(blinkTimer)
    }
  }, [addTimer])

  // Mouvement des yeux/regard environnant - OPTIMISÉ
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const eyeMovementInterval = addInterval(setInterval(() => {
      const newPosition = {
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8
      }
      setEyePosition(newPosition)
    }, Math.random() * 1500 + 2000))
    
    return () => {
      activeIntervals.current.delete(eyeMovementInterval)
      clearInterval(eyeMovementInterval)
    }
  }, [addInterval])

  // Animations selon le statut - OPTIMISÉES ET HARMONISÉES
  useEffect(() => {
    switch (status) {
      case 'listening':
        sphereControls.start({
          scale: [1, 1.03, 1], // Respiration plus subtile
          y: [0, -6, 0], // Flottement harmonieux
          rotateX: [0, 1.5, 0], // Rotation plus douce
          filter: [
            'brightness(1) saturate(1)',
            'brightness(1.2) saturate(1.3)',
            'brightness(1) saturate(1)'
          ],
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        })
        linesControls.start({
          opacity: [0.8, 1, 0.8],
          scaleY: [1, 1.15, 1], // Moins extrême
          filter: 'brightness(1.3) drop-shadow(0 0 12px #22c55e)',
          transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        })
        break
      case 'speaking':
        sphereControls.start({
          scale: [1, 1.02, 1.04, 1.02, 1], // Pulsation plus naturelle
          y: [0, -4, -8, -4, 0], // Flottement progressif
          rotateX: [0, 0.8, -0.8, 0],
          filter: [
            'brightness(1) saturate(1)',
            'brightness(1.25) saturate(1.4)',
            'brightness(1) saturate(1)'
          ],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        })
        linesControls.start({
          opacity: [0.7, 1, 0.7],
          scaleY: [1, 0.9, 1.2, 0.9, 1], // Animation plus fluide
          filter: 'brightness(1.6) drop-shadow(0 0 16px #3b82f6)',
          transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        })
        break
      case 'thinking':
        sphereControls.start({
          scale: [1, 1.015, 1], // Très subtile
          y: [0, -2, 0],
          rotateY: [0, 3, -3, 0], // Balancement pensif
          filter: 'brightness(1.15) saturate(1.2)',
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        })
        linesControls.start({
          opacity: [0.6, 0.85, 0.6],
          scaleY: [1, 1.08, 1],
          rotate: [0, 1.5, -1.5, 0], // Mouvement pensif
          filter: 'brightness(1.2) drop-shadow(0 0 10px #f59e0b)',
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        })
        break
      case 'connecting':
        sphereControls.start({
          scale: [0.98, 1.02, 0.98], // Pulsation seulement
          y: [0, -5, 0],
          filter: 'brightness(1.1) saturate(1.15)',
          transition: { 
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }
        })
        linesControls.start({
          opacity: [0.5, 1, 0.5],
          scaleX: [0.9, 1.1, 0.9],
          filter: 'brightness(1.3) drop-shadow(0 0 14px #8b5cf6)',
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        })
        break
      default:
        sphereControls.start({
          scale: [1, 1.008, 1], // Respiration très subtile
          y: [0, -3, 0], // Flottement minimal
          rotateX: [0, 0.5, 0],
          filter: 'brightness(1) saturate(1)',
          transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        })
        linesControls.start({
          opacity: [0.75, 0.9, 0.75],
          filter: 'brightness(1.1) drop-shadow(0 0 8px rgba(255,255,255,0.7))',
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        })
    }
  }, [status, sphereControls, linesControls])

  const getSphereGradient = () => {
    switch (status) {
      case 'listening': 
        return `
          radial-gradient(circle at 30% 25%, rgba(34, 197, 94, 0.35) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      case 'speaking': 
        return `
          radial-gradient(circle at 30% 25%, rgba(59, 130, 246, 0.35) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      case 'thinking': 
        return `
          radial-gradient(circle at 30% 25%, rgba(245, 158, 11, 0.3) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(251, 191, 36, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(239, 68, 68, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      case 'connecting': 
        return `
          radial-gradient(circle at 30% 25%, rgba(139, 92, 246, 0.35) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      default: 
        return `
          radial-gradient(circle at 30% 25%, rgba(99, 102, 241, 0.25) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)
        `
    }
  }

  const getGlow = () => {
    switch (status) {
      case 'listening': return '0 0 100px rgba(34, 197, 94, 0.6), 0 0 150px rgba(34, 197, 94, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      case 'speaking': return '0 0 100px rgba(59, 130, 246, 0.6), 0 0 150px rgba(59, 130, 246, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      case 'thinking': return '0 0 100px rgba(245, 158, 11, 0.6), 0 0 150px rgba(245, 158, 11, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      case 'connecting': return '0 0 100px rgba(139, 92, 246, 0.6), 0 0 150px rgba(139, 92, 246, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      default: return '0 0 80px rgba(99, 102, 241, 0.4), 0 0 120px rgba(99, 102, 241, 0.2), 0 15px 30px rgba(0,0,0,0.2)'
    }
  }

  const getLinesColor = () => {
    switch (status) {
      case 'listening': return '#22c55e'
      case 'speaking': return '#3b82f6'
      case 'thinking': return '#f59e0b'
      case 'connecting': return '#8b5cf6'
      default: return '#ffffff'
    }
  }

  const getMotionDesignGradient = () => {
    switch (status) {
      case 'listening': 
        return `
          radial-gradient(circle at 30% 25%, rgba(34, 197, 94, 0.35) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      case 'speaking': 
        return `
          radial-gradient(circle at 30% 25%, rgba(59, 130, 246, 0.35) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      case 'thinking': 
        return `
          radial-gradient(circle at 30% 25%, rgba(245, 158, 11, 0.3) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(251, 191, 36, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(239, 68, 68, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      case 'connecting': 
        return `
          radial-gradient(circle at 30% 25%, rgba(139, 92, 246, 0.35) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)
        `
      default: 
        return `
          radial-gradient(circle at 30% 25%, rgba(99, 102, 241, 0.25) 0%, transparent 45%),
          radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 45% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 55%),
          linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)
        `
    }
  }

  const getMotionDesignGlow = () => {
    switch (status) {
      case 'listening': return '0 0 100px rgba(34, 197, 94, 0.6), 0 0 150px rgba(34, 197, 94, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      case 'speaking': return '0 0 100px rgba(59, 130, 246, 0.6), 0 0 150px rgba(59, 130, 246, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      case 'thinking': return '0 0 100px rgba(245, 158, 11, 0.6), 0 0 150px rgba(245, 158, 11, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      case 'connecting': return '0 0 100px rgba(139, 92, 246, 0.6), 0 0 150px rgba(139, 92, 246, 0.3), 0 20px 40px rgba(0,0,0,0.3)'
      default: return '0 0 80px rgba(99, 102, 241, 0.4), 0 0 120px rgba(99, 102, 241, 0.2), 0 15px 30px rgba(0,0,0,0.2)'
    }
  }

  const getEyeColor = () => {
    switch (status) {
      case 'listening': return '#22c55e'
      case 'speaking': return '#3b82f6'
      case 'thinking': return '#f59e0b'
      case 'connecting': return '#8b5cf6'
      default: return '#ffffff'
    }
  }

  // ⚡ LAZY LOADING SYSTEM
  const [cosmicElementsLoaded, setCosmicElementsLoaded] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 0, renderTime: 0 })
  const lastFrameTime = useRef(performance.now())
  const frameCount = useRef(0)

  // ⚡ PERFORMANCE MONITORING
  useEffect(() => {
    if (typeof window === 'undefined') return

    const monitorPerformance = () => {
      const now = performance.now()
      frameCount.current++
      
      if (frameCount.current % 60 === 0) { // Toutes les 60 frames
        const fps = 1000 / (now - lastFrameTime.current) * 60
        setPerformanceMetrics(prev => ({ ...prev, fps: Math.round(fps) }))
      }
      
      lastFrameTime.current = now
      const frameId = addAnimationFrame(requestAnimationFrame(monitorPerformance))
    }

    const frameId = addAnimationFrame(requestAnimationFrame(monitorPerformance))

    return () => {
      activeAnimationFrames.current.delete(frameId)
      cancelAnimationFrame(frameId)
    }
  }, [addAnimationFrame])

  // ⚡ LAZY LOADING DES ÉLÉMENTS COSMIQUES
  useEffect(() => {
    const loadTimer = addTimer(setTimeout(() => {
      setCosmicElementsLoaded(true)
    }, 100)) // Délai minimal pour éviter les blocages

    return () => {
      activeTimers.current.delete(loadTimer)
      clearTimeout(loadTimer)
    }
  }, [addTimer])

  return (
    <div className={`avatar-hologram ${className}`} style={{ perspective: '1000px' }}>
      {/* SPHÈRE PRINCIPALE MOTION DESIGN */}
      <motion.div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: getMotionDesignGradient(),
          boxShadow: getMotionDesignGlow(),
          backdropFilter: 'blur(2px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          overflow: 'hidden',
          // ⚡ OPTIMISATIONS PERFORMANCES
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)', // Force hardware acceleration
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
        animate={{
          scale: status === 'speaking' ? [1, 1.005, 1] : [1, 1.002, 1],
          rotate: rotation * 0.05
        }}
        transition={{
          scale: { 
            duration: status === 'speaking' ? 0.8 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          rotate: { 
            duration: 60,
            repeat: Infinity,
            ease: "linear"
          }
        }}
      >
        {/* Reflet glassmorphism principal */}
        <motion.div
          style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }}
          animate={{
            opacity: [0.6, 0.9, 0.6],
            scale: [1, 1.1, 1],
            x: [0, 10, 0],
            y: [0, -5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Reflet secondaire mobile */}
        <motion.div
          style={{
            position: 'absolute',
            top: '60%',
            right: '25%',
            width: '30%',
            height: '40%',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
            filter: 'blur(15px)',
            pointerEvents: 'none'
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* YEUX STYLE MOTION DESIGN - BARRES VERTICALES LUMINIEUSES */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          display: 'flex',
          gap: `${size * 0.14}px`,
          // ⚡ OPTIMISATIONS PERFORMANCES
          willChange: 'transform',
          transform: 'translate3d(-50%, -50%, 0)'
        }}>
          {/* ŒIL GAUCHE */}
          <motion.div
            style={{
              width: `${size * 0.02}px`,
              height: isBlinking ? '1px' : `${size * 0.22}px`,
              background: getEyeColor(),
              borderRadius: `${size * 0.01}px`,
              boxShadow: `
                0 0 8px ${getEyeColor()},
                0 0 16px ${getEyeColor()},
                0 0 24px ${getEyeColor()}
              `,
              filter: 'brightness(1.2)',
              // ⚡ OPTIMISATIONS PERFORMANCES
              willChange: 'transform, height',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
            animate={{
              scaleY: isBlinking ? 0.05 : 1,
              opacity: [0.9, 1, 0.9],
              x: eyePosition.x * 2.5,
              y: eyePosition.y * 2.5
            }}
            transition={{ 
              scaleY: { 
                duration: isBlinking ? 0.12 : 0.3, 
                ease: isBlinking ? "circOut" : "easeInOut" 
              },
              x: { duration: isBlinking ? 0.12 : 1.0, ease: "circOut" },
              y: { duration: isBlinking ? 0.12 : 1.0, ease: "circOut" },
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* ŒIL DROIT */}
          <motion.div
            style={{
              width: `${size * 0.02}px`,
              height: isBlinking ? '1px' : `${size * 0.22}px`,
              background: getEyeColor(),
              borderRadius: `${size * 0.01}px`,
              boxShadow: `
                0 0 8px ${getEyeColor()},
                0 0 16px ${getEyeColor()},
                0 0 24px ${getEyeColor()}
              `,
              filter: 'brightness(1.2)',
              // ⚡ OPTIMISATIONS PERFORMANCES
              willChange: 'transform, height',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
            animate={{
              scaleY: isBlinking ? 0.05 : 1,
              opacity: [0.9, 1, 0.9],
              x: eyePosition.x * 2.5,
              y: eyePosition.y * 2.5
            }}
            transition={{ 
              scaleY: { 
                duration: isBlinking ? 0.12 : 0.3, 
                ease: isBlinking ? "circOut" : "easeInOut" 
              },
              x: { duration: isBlinking ? 0.12 : 1.0, ease: "circOut" },
              y: { duration: isBlinking ? 0.12 : 1.0, ease: "circOut" },
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </div>

        {/* COSMOS INTÉRIEUR AVEC PARALLAXE - Couche lointaine SIMPLIFIÉE */}
        {cosmicElementsLoaded && (
          <motion.div
            style={{
              position: 'absolute',
              inset: '20px',
              // ⚡ OPTIMISATIONS PERFORMANCES
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              contain: 'layout style paint'
            }}
            animate={{
              rotateY: rotation * 0.2,
              rotateX: Math.sin(rotation * 0.01) * 1,
              x: eyePosition.x * 0.3,
              y: eyePosition.y * 0.3
            }}
          >
            {cosmicElements.farStars.slice(0, performanceMetrics.fps > 30 ? 12 : 6).map((star, i) => (
              <motion.div
                key={`far-${i}`}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  background: `rgba(${star.color}, 0.3)`,
                  borderRadius: '50%',
                  boxShadow: `0 0 ${star.size * 2}px rgba(${star.color}, 0.2)`,
                  // ⚡ OPTIMISATIONS PERFORMANCES
                  willChange: 'opacity',
                  transform: 'translate3d(0, 0, 0)'
                }}
                animate={{
                  opacity: [0.2, 0.6, 0.2]
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        )}

        {/* COSMOS INTÉRIEUR AVEC PARALLAXE - Couche moyenne SIMPLIFIÉE */}
        {cosmicElementsLoaded && performanceMetrics.fps > 45 && (
          <motion.div
            style={{
              position: 'absolute',
              inset: '30px',
              // ⚡ OPTIMISATIONS PERFORMANCES
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              contain: 'layout style paint'
            }}
            animate={{
              rotateY: rotation * 0.4,
              rotateX: Math.sin(rotation * 0.015) * 1.5,
              x: eyePosition.x * 0.3,
              y: eyePosition.y * 0.3
            }}
          >
            {cosmicElements.midStars.slice(0, 8).map((star, i) => (
              <motion.div
                key={`mid-${i}`}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  background: `rgba(${star.color}, 0.4)`,
                  borderRadius: '50%',
                  boxShadow: `0 0 ${star.size * 3}px rgba(${star.color}, 0.3)`,
                  // ⚡ OPTIMISATIONS PERFORMANCES
                  willChange: 'opacity',
                  transform: 'translate3d(0, 0, 0)'
                }}
                animate={{
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 3 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        )}

        {/* COSMOS INTÉRIEUR - Couche proche FLUIDE */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden'
          }}
          animate={{
            rotateY: rotation * 0.4, // Parallaxe modéré
            rotateX: Math.sin(rotation * 0.01) * 1.5,
            x: eyePosition.x * 0.3, // Réduit pour plus de fluidité
            y: eyePosition.y * 0.3
          }}
        >
          {cosmicElements.nearStars.map((star, i) => (
            <motion.div
              key={`near-${i}`}
              style={{
                position: 'absolute',
                width: `${star.size}px`,
                height: `${star.size}px`,
                borderRadius: '50%',
                background: star.type === 'nebula' ? 
                  `radial-gradient(circle, ${star.color} 0%, transparent 70%)` : 
                  star.color,
                left: `${star.x}%`,
                top: `${star.y}%`,
                boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
                filter: star.type === 'nebula' ? 'blur(0.5px)' : 'none' // Blur réduit
              }}
              animate={{
                opacity: [star.opacity * 0.6, star.opacity, star.opacity * 0.6],
                scale: [0.9, 1.3, 0.9]
              }}
              transition={{
                duration: 4 + i * 0.8, // Plus fluide
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* POUSSIÈRE STELLAIRE */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden'
          }}
          animate={{
            rotateY: rotation * 0.2,
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            opacity: { duration: 8, repeat: Infinity }
          }}
        >
          {cosmicElements.starDust.map((dust, i) => (
            <motion.div
              key={`dust-${i}`}
              style={{
                position: 'absolute',
                width: `${dust.size}px`,
                height: `${dust.size}px`,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                left: `${dust.x}%`,
                top: `${dust.y}%`,
                filter: 'blur(0.8px)'
              }}
              animate={{
                opacity: [dust.opacity * 0.5, dust.opacity, dust.opacity * 0.5],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 6 + i * 1.2,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* Ondulations externes pour les états actifs */}
        {(status === 'listening' || status === 'speaking') && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={`ripple-${i}`}
                style={{
                  position: 'absolute',
                  inset: `-${25 + i * 15}px`,
                  border: `2px solid ${getLinesColor()}`,
                  borderRadius: '50%',
                  opacity: 0.3,
                  pointerEvents: 'none'
                }}
                animate={{
                  scale: [0.8, 1.3, 0.8],
                  opacity: [0.6, 0.1, 0.6]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </div>
  )
} 