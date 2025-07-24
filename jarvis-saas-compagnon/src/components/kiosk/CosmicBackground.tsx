"use client"
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CosmicBackgroundProps {
  className?: string
}

export default function CosmicBackground({ className }: CosmicBackgroundProps) {
  const [isClient, setIsClient] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [time, setTime] = useState(0)

  // S'assurer que c'est bien côté client pour éviter l'hydratation mismatch
  useEffect(() => {
    setIsClient(true)
    
    // Effet parallaxe basé sur le mouvement de la souris
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / window.innerWidth
      const y = (e.clientY - window.innerHeight / 2) / window.innerHeight
      setMousePosition({ x, y })
    }

    // Animation temporelle pour le parallaxe automatique
    const timeInterval = setInterval(() => {
      setTime(prev => prev + 0.1)
    }, 100)

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(timeInterval)
    }
  }, [])

  // Ne rien rendre côté serveur pour éviter l'hydratation mismatch
  if (!isClient) {
    return (
      <div 
        className={`cosmic-background ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          background: 'radial-gradient(ellipse at center, rgba(15, 15, 35, 1) 0%, rgba(8, 8, 20, 1) 70%, rgba(2, 2, 8, 1) 100%)'
        }}
      />
    )
  }

  return (
    <div 
      className={`cosmic-background ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, rgba(8, 12, 35, 1) 0%, rgba(3, 6, 20, 1) 50%, rgba(1, 2, 8, 1) 100%)',
        // ⚡ OPTIMISATIONS PERFORMANCES
        willChange: 'transform',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* ========== COUCHE 1 : NÉBULEUSES ULTRA-LOINTAINES (PARALLAXE x0.1) ========== */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `
            radial-gradient(ellipse 1400px 800px at 15% 25%, rgba(59, 130, 246, 0.03) 0%, transparent 80%),
            radial-gradient(ellipse 1200px 1000px at 85% 15%, rgba(139, 92, 246, 0.025) 0%, transparent 85%),
            radial-gradient(ellipse 1600px 600px at 45% 75%, rgba(99, 102, 241, 0.02) 0%, transparent 90%),
            radial-gradient(ellipse 1000px 1200px at 75% 85%, rgba(168, 85, 247, 0.018) 0%, transparent 95%)
          `,
          filter: 'blur(8px)',
          // ⚡ OPTIMISATIONS PERFORMANCES
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          contain: 'layout style paint'
        }}
        animate={{
          x: mousePosition.x * 10 + Math.sin(time * 0.1) * 15,
          y: mousePosition.y * 8 + Math.cos(time * 0.07) * 10,
          rotate: time * 0.5
        }}
        transition={{ type: "spring", stiffness: 20, damping: 30 }}
      />

      {/* ========== COUCHE 2 : CHAMPS D'ÉTOILES ULTRA-LOINTAINS (PARALLAXE x0.2) ========== */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-10%',
          background: Array.from({ length: 150 }, (_, i) => {
            const x = Math.random() * 100
            const y = Math.random() * 100
            const size = 0.3 + Math.random() * 0.4
            const opacity = 0.2 + Math.random() * 0.3
            const colors = ['255,255,255', '200,220,255', '255,240,220', '220,255,240']
            const color = colors[Math.floor(Math.random() * colors.length)]
            return `radial-gradient(circle ${size}px at ${x}% ${y}%, rgba(${color},${opacity}) 0%, transparent 70%)`
          }).join(','),
          // ⚡ OPTIMISATIONS PERFORMANCES
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          contain: 'layout style paint'
        }}
        animate={{
          x: mousePosition.x * 20 + Math.sin(time * 0.05) * 25,
          y: mousePosition.y * 15 + Math.cos(time * 0.03) * 18
        }}
        transition={{ type: "spring", stiffness: 25, damping: 35 }}
      />

      {/* ========== COUCHE 3 : NÉBULEUSES MOYENNES (PARALLAXE x0.3) ========== */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-5%',
          background: `
            radial-gradient(ellipse 800px 600px at 25% 35%, rgba(99, 102, 241, 0.04) 0%, transparent 75%),
            radial-gradient(ellipse 600px 800px at 75% 25%, rgba(139, 92, 246, 0.035) 0%, transparent 80%),
            radial-gradient(ellipse 1000px 400px at 55% 65%, rgba(59, 130, 246, 0.03) 0%, transparent 85%),
            radial-gradient(ellipse 700px 900px at 35% 85%, rgba(168, 85, 247, 0.025) 0%, transparent 90%)
          `,
          filter: 'blur(6px)',
          // ⚡ OPTIMISATIONS PERFORMANCES
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          contain: 'layout style paint'
        }}
        animate={{
          x: mousePosition.x * 30 + Math.sin(time * 0.08) * 20,
          y: mousePosition.y * 25 + Math.cos(time * 0.06) * 15,
          rotate: -time * 0.3
        }}
        transition={{ type: "spring", stiffness: 30, damping: 40 }}
      />

      {/* Étoiles statiques CSS - Plus simple et stable */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle 2px at 15% 25%, rgba(255,255,255,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.5px at 85% 15%, rgba(200,220,255,0.7) 0%, transparent 50%),
            radial-gradient(circle 2.5px at 25% 75%, rgba(255,240,220,0.6) 0%, transparent 50%),
            radial-gradient(circle 1px at 75% 85%, rgba(220,255,240,0.9) 0%, transparent 50%),
            radial-gradient(circle 1.8px at 45% 35%, rgba(255,255,255,0.7) 0%, transparent 50%),
            radial-gradient(circle 2.2px at 65% 45%, rgba(200,220,255,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.3px at 35% 85%, rgba(255,240,220,0.6) 0%, transparent 50%),
            radial-gradient(circle 2px at 55% 15%, rgba(220,255,240,0.7) 0%, transparent 50%),
            radial-gradient(circle 1.6px at 25% 45%, rgba(255,255,255,0.8) 0%, transparent 50%),
            radial-gradient(circle 2.4px at 85% 65%, rgba(200,220,255,0.6) 0%, transparent 50%),
            radial-gradient(circle 1.2px at 45% 75%, rgba(255,240,220,0.9) 0%, transparent 50%),
            radial-gradient(circle 1.9px at 15% 65%, rgba(220,255,240,0.7) 0%, transparent 50%),
            radial-gradient(circle 2.1px at 75% 25%, rgba(255,255,255,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.4px at 55% 85%, rgba(200,220,255,0.7) 0%, transparent 50%),
            radial-gradient(circle 2.3px at 35% 15%, rgba(255,240,220,0.6) 0%, transparent 50%),
            radial-gradient(circle 1.7px at 65% 75%, rgba(220,255,240,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.1px at 25% 35%, rgba(255,255,255,0.6) 0%, transparent 50%),
            radial-gradient(circle 2px at 85% 45%, rgba(200,220,255,0.9) 0%, transparent 50%),
            radial-gradient(circle 1.5px at 45% 65%, rgba(255,240,220,0.7) 0%, transparent 50%),
            radial-gradient(circle 2.2px at 15% 85%, rgba(220,255,240,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.8px at 75% 35%, rgba(255,255,255,0.7) 0%, transparent 50%),
            radial-gradient(circle 1.3px at 55% 25%, rgba(200,220,255,0.6) 0%, transparent 50%),
            radial-gradient(circle 2.1px at 35% 65%, rgba(255,240,220,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.6px at 65% 15%, rgba(220,255,240,0.7) 0%, transparent 50%),
            radial-gradient(circle 1px at 25% 75%, rgba(255,255,255,0.9) 0%, transparent 50%),
            radial-gradient(circle 2.4px at 85% 25%, rgba(200,220,255,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.7px at 45% 45%, rgba(255,240,220,0.6) 0%, transparent 50%),
            radial-gradient(circle 2px at 15% 55%, rgba(220,255,240,0.8) 0%, transparent 50%),
            radial-gradient(circle 1.4px at 75% 75%, rgba(255,255,255,0.7) 0%, transparent 50%),
            radial-gradient(circle 1.9px at 55% 35%, rgba(200,220,255,0.8) 0%, transparent 50%)
          `
        }}
      />

      {/* Scintillement subtil */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle 1px at 15% 25%, rgba(255,255,255,0.4) 0%, transparent 30%),
            radial-gradient(circle 1px at 85% 15%, rgba(200,220,255,0.3) 0%, transparent 30%),
            radial-gradient(circle 1px at 25% 75%, rgba(255,240,220,0.2) 0%, transparent 30%),
            radial-gradient(circle 1px at 75% 85%, rgba(220,255,240,0.5) 0%, transparent 30%),
            radial-gradient(circle 1px at 45% 35%, rgba(255,255,255,0.3) 0%, transparent 30%),
            radial-gradient(circle 1px at 65% 45%, rgba(200,220,255,0.4) 0%, transparent 30%)
          `
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Étoiles filantes occasionnelles */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
            left: '10%',
            top: '20%'
          }}
          animate={{
            x: [0, window.innerWidth * 0.8],
            y: [0, window.innerHeight * 0.2],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0.5]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            delay: 5,
            ease: "easeOut"
          }}
        />
        
        <motion.div
          style={{
            position: 'absolute',
            width: '1.5px',
            height: '1.5px',
            borderRadius: '50%',
            background: 'rgba(200, 220, 255, 0.7)',
            boxShadow: '0 0 4px rgba(200, 220, 255, 0.5)',
            left: '70%',
            top: '30%'
          }}
          animate={{
            x: [0, window.innerWidth * 0.6],
            y: [0, window.innerHeight * 0.3],
            opacity: [0, 0.8, 0.8, 0],
            scale: [0.3, 0.8, 0.8, 0.3]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            delay: 20,
            ease: "easeOut"
          }}
        />
      </motion.div>
    </div>
  )
} 