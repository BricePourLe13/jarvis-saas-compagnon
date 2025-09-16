'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function SimpleLiquidBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <Box
      position="fixed"
      inset={0}
      overflow="hidden"
      pointerEvents="none"
      zIndex={-1}
    >
      {/* Gradient de base */}
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)"
      />

      {/* Formes liquides animées */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: `${300 + i * 100}px`,
            height: `${300 + i * 100}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, rgba(59, 130, 246, ${0.1 - i * 0.02}), transparent)`,
            filter: 'blur(40px)',
            left: `${20 + i * 15}%`,
            top: `${10 + i * 20}%`,
          }}
          animate={{
            x: [
              0,
              Math.sin(i * 0.5) * 100 + (mousePosition.x - 50) * 0.2,
              Math.cos(i * 0.7) * 80,
              0
            ],
            y: [
              0,
              Math.cos(i * 0.3) * 80 + (mousePosition.y - 50) * 0.2,
              Math.sin(i * 0.9) * 100,
              0
            ],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 15 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2
          }}
        />
      ))}

      {/* Particules flottantes */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#64748b',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.sin(i) * 30, 0],
            opacity: [0.1, 0.6, 0.1],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Effet de souris */}
      <motion.div
        style={{
          position: 'absolute',
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          filter: 'blur(30px)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Vagues subtiles */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '200px',
          opacity: 0.1
        }}
      >
        <motion.path
          d="M0,100 Q250,50 500,100 T1000,100 T1500,100 V200 H0 Z"
          fill="url(#waveGradient)"
          animate={{
            d: [
              "M0,100 Q250,50 500,100 T1000,100 T1500,100 V200 H0 Z",
              "M0,120 Q250,80 500,120 T1000,120 T1500,120 V200 H0 Z",
              "M0,100 Q250,50 500,100 T1000,100 T1500,100 V200 H0 Z"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  )
}
