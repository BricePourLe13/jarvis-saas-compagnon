"use client"
import { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioVisualizerProps {
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
  color?: string
  size?: 'sm' | 'md' | 'lg'
  style?: 'bars' | 'circle' | 'wave'
}

export default function AudioVisualizer({
  isActive,
  isListening,
  isSpeaking,
  color = '#3b82f6',
  size = 'md',
  style = 'bars'
}: AudioVisualizerProps) {
  
  const [animationData, setAnimationData] = useState<number[]>([])
  
  // Configuration selon la taille
  const config = {
    sm: { width: 120, height: 40, barCount: 16 },
    md: { width: 200, height: 60, barCount: 24 },
    lg: { width: 300, height: 80, barCount: 32 }
  }[size]

  // Simulation d'animation pour les barres
  useEffect(() => {
    if (!isActive) return

    const generateRandomData = () => {
      const data = []
      for (let i = 0; i < config.barCount; i++) {
        // Générer des valeurs d'animation selon l'état
        let value = Math.random() * 0.3 // Base noise
        
        if (isListening) {
          value += Math.random() * 0.6 + 0.2 // Plus d'activité en écoute
        } else if (isSpeaking) {
          value += Math.random() * 0.8 + 0.3 // Maximum d'activité en parlant
        }
        
        // Ajouter des pics occasionnels
        if (Math.random() > 0.8) {
          value += Math.random() * 0.4
        }
        
        data.push(Math.min(value, 1))
      }
      return data
    }

    let animationId: number

    const animate = () => {
      setAnimationData(generateRandomData())
      animationId = requestAnimationFrame(animate)
    }

    if (isListening || isSpeaking) {
      animate()
    } else {
      // Données statiques en idle
      setAnimationData(new Array(config.barCount).fill(0.1))
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isActive, isListening, isSpeaking, config.barCount])

  // Rendu des barres
  const renderBars = () => (
    <Box
      width={`${config.width}px`}
      height={`${config.height}px`}
      display="flex"
      alignItems="end"
      justifyContent="center"
      gap="2px"
    >
      {animationData.map((value, index) => {
        const height = Math.max(3, value * config.height)
        const delay = index * 0.02
        
        return (
          <motion.div
            key={index}
            style={{
              width: `${Math.max(2, config.width / config.barCount - 2)}px`,
              backgroundColor: color,
              borderRadius: '2px',
              opacity: isListening ? 0.9 : isSpeaking ? 0.8 : 0.4
            }}
            animate={{
              height: height,
              backgroundColor: [
                color,
                isListening ? '#22c55e' : isSpeaking ? '#3b82f6' : color,
                color
              ]
            }}
            transition={{
              height: { duration: 0.15, ease: "easeOut" },
              backgroundColor: { duration: 2, repeat: Infinity, delay }
            }}
          />
        )
      })}
    </Box>
  )

  const renderCircle = () => {
    const radius = config.width / 4
    const centerX = config.width / 2
    const centerY = config.height / 2
    
    return (
      <svg width={config.width} height={config.height}>
        {animationData.slice(0, 24).map((value, index) => {
          const angle = (index / 24) * 2 * Math.PI
          const intensity = value * radius * 0.6
          const x1 = centerX + Math.cos(angle) * radius
          const y1 = centerY + Math.sin(angle) * radius
          const x2 = centerX + Math.cos(angle) * (radius + intensity)
          const y2 = centerY + Math.sin(angle) * (radius + intensity)
          
          return (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              animate={{
                opacity: isListening ? 0.9 : isSpeaking ? 0.8 : 0.4,
                stroke: [
                  color,
                  isListening ? '#22c55e' : isSpeaking ? '#3b82f6' : color,
                  color
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.05
              }}
            />
          )
        })}
      </svg>
    )
  }

  const renderWave = () => {
    const points = animationData.slice(0, 30).map((value, index) => {
      const x = (index / 29) * config.width
      const y = config.height / 2 + (value - 0.5) * config.height * 0.8
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={config.width} height={config.height}>
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            opacity: isListening ? 0.9 : isSpeaking ? 0.8 : 0.4,
            stroke: [
              color,
              isListening ? '#22c55e' : isSpeaking ? '#3b82f6' : color,
              color
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        />
      </svg>
    )
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          {style === 'bars' && renderBars()}
          {style === 'circle' && renderCircle()}
          {style === 'wave' && renderWave()}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 