'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface LiquidEtherProps {
  intensity?: 'low' | 'medium' | 'high'
  color?: string
}

export default function LiquidEther({ intensity = 'medium', color = '#64748b' }: LiquidEtherProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

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

  const intensityConfig = {
    low: { count: 3, size: 300, speed: 20 },
    medium: { count: 5, size: 400, speed: 15 },
    high: { count: 8, size: 500, speed: 10 }
  }

  const config = intensityConfig[intensity]

  return (
    <Box
      position="fixed"
      inset={0}
      overflow="hidden"
      pointerEvents="none"
      zIndex={-10}
    >
      {/* Liquid blobs */}
      {Array.from({ length: config.count }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: `${config.size + Math.random() * 200}px`,
            height: `${config.size + Math.random() * 200}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${color}20, ${color}05, transparent)`,
            filter: 'blur(40px)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [
              0,
              Math.sin(i * 0.5) * 200 + (mousePosition.x - 50) * 0.1,
              Math.cos(i * 0.7) * 150,
              0
            ],
            y: [
              0,
              Math.cos(i * 0.3) * 150 + (mousePosition.y - 50) * 0.1,
              Math.sin(i * 0.9) * 200,
              0
            ],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.3, 0.6, 0.2, 0.3]
          }}
          transition={{
            duration: config.speed + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2
          }}
        />
      ))}

      {/* Flowing streams */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.1
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.path
            key={`stream-${i}`}
            d={`M${Math.random() * 100},${Math.random() * 100} Q${Math.random() * 100},${Math.random() * 100} ${Math.random() * 100},${Math.random() * 100}`}
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeDasharray="10,5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0], 
              opacity: [0, 0.3, 0],
              strokeDashoffset: [0, -20]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>

      {/* Ethereal mist */}
      <Box
        position="absolute"
        inset={0}
        background={`
          radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, ${color}10 0%, transparent 50%),
          radial-gradient(ellipse at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, ${color}05 0%, transparent 70%)
        `}
        transition="background 0.3s ease"
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(i) * 50, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 2, 0.5]
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        />
      ))}
    </Box>
  )
}
