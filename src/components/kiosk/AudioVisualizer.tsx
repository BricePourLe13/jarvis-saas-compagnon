"use client"
import { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

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
  
  // Configuration selon la taille
  const config = {
    sm: { width: 120, height: 40, barCount: 8 },
    md: { width: 200, height: 60, barCount: 12 },
    lg: { width: 300, height: 80, barCount: 16 }
  }[size]

  // Générer des hauteurs de barres statiques mais variées
  const generateStaticBars = () => {
    const bars = []
    for (let i = 0; i < config.barCount; i++) {
      // Pattern sinusoïdal pour un aspect plus naturel
      const baseHeight = 0.3 + Math.sin(i * 0.5) * 0.2
      const randomVariation = Math.random() * 0.3
      bars.push(Math.max(0.1, Math.min(1, baseHeight + randomVariation)))
    }
    return bars
  }

  const staticBars = generateStaticBars()

  if (!isActive) {
    return null
  }

  return (
    <Box
      width={`${config.width}px`}
      height={`${config.height}px`}
      display="flex"
      alignItems="end"
      justifyContent="center"
      gap="2px"
    >
      {staticBars.map((baseHeight, index) => (
        <motion.div
          key={index}
          style={{
            width: `${Math.max(2, config.width / config.barCount - 2)}px`,
            backgroundColor: color,
            borderRadius: '2px',
            height: `${baseHeight * config.height * 0.3}px`, // Hauteur de base
            minHeight: '4px'
          }}
          animate={{
            height: [
              `${baseHeight * config.height * 0.3}px`,
              `${baseHeight * config.height * (isListening ? 0.8 : isSpeaking ? 0.9 : 0.4)}px`,
              `${baseHeight * config.height * 0.3}px`
            ],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: isListening ? 0.8 + index * 0.1 : isSpeaking ? 0.5 + index * 0.05 : 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.1
          }}
        />
      ))}
    </Box>
  )
} 