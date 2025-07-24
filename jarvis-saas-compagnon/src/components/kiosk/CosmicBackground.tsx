"use client"
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CosmicBackgroundProps {
  className?: string
}

export default function CosmicBackground({ className }: CosmicBackgroundProps) {
  const [isClient, setIsClient] = useState(false)

  // S'assurer que c'est bien côté client pour éviter l'hydratation mismatch
  useEffect(() => {
    setIsClient(true)
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
        background: 'radial-gradient(ellipse at center, rgba(8, 12, 35, 1) 0%, rgba(3, 6, 20, 1) 50%, rgba(1, 2, 8, 1) 100%)'
      }}
    >
      {/* ✨ COSMOS ULTRA-SIMPLIFIÉ - Statique avec animation minimale */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-10%',
          background: `
            radial-gradient(ellipse 800px 400px at 20% 30%, rgba(59, 130, 246, 0.02) 0%, transparent 70%),
            radial-gradient(ellipse 600px 600px at 80% 20%, rgba(139, 92, 246, 0.015) 0%, transparent 80%)
          `,
          filter: 'blur(4px)'
        }}
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* ⭐ Étoiles statiques simples */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle 1px at 15% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
          radial-gradient(circle 1px at 85% 15%, rgba(147, 197, 253, 0.4) 0%, transparent 50%),
          radial-gradient(circle 1px at 45% 75%, rgba(196, 181, 253, 0.3) 0%, transparent 50%),
          radial-gradient(circle 0.5px at 75% 85%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
          radial-gradient(circle 0.5px at 25% 65%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
          radial-gradient(circle 0.5px at 65% 45%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)
        `
      }} />

      {/* 🌟 Étoiles scintillantes - Animation simple */}
      {[
        { left: '10%', top: '20%', delay: 0 },
        { left: '90%', top: '30%', delay: 1 },
        { left: '30%', top: '80%', delay: 2 },
        { left: '70%', top: '60%', delay: 3 },
        { left: '50%', top: '15%', delay: 4 }
      ].map((star, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: '2px',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)'
          }}
          animate={{
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
} 