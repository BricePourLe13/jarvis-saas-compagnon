'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  direction: number
  color: string
}

export default function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Créer les particules initiales
    const initialParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.5 + 0.1,
      direction: Math.random() * Math.PI * 2,
      color: `hsl(0, 0%, ${60 + Math.random() * 30}%)`
    }))
    
    setParticles(initialParticles)

    // Suivre la souris
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
      position="absolute"
      inset={0}
      overflow="hidden"
      pointerEvents="none"
      zIndex={0}
    >
      {/* Particules flottantes */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          animate={{
            x: [
              0,
              Math.cos(particle.direction) * 50,
              Math.cos(particle.direction + Math.PI) * 30,
              0
            ],
            y: [
              0,
              Math.sin(particle.direction) * 30,
              Math.sin(particle.direction + Math.PI) * 50,
              0
            ],
            scale: [1, 1.5, 0.8, 1],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity * 0.5, particle.opacity]
          }}
          transition={{
            duration: 8 + particle.speed * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.id * 0.1
          }}
        />
      ))}

      {/* Connexions entre particules */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {particles.slice(0, 20).map((particle, i) => (
          <motion.line
            key={`line-${particle.id}`}
            x1={`${particle.x}%`}
            y1={`${particle.y}%`}
            x2={`${particles[(i + 1) % particles.length]?.x || 0}%`}
            y2={`${particles[(i + 1) % particles.length]?.y || 0}%`}
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0], 
              opacity: [0, 0.3, 0] 
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>

      {/* Effet de souris */}
      <motion.div
        style={{
          position: 'absolute',
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100, 116, 139, 0.1) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Grille de fond subtile */}
      <Box
        position="absolute"
        inset={0}
        opacity={0.1}
        backgroundImage="linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px)"
        backgroundSize="50px 50px"
      />
    </Box>
  )
}
