'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { vitrineTheme } from './VitrineDesignSystem'

interface JarvisLogoSphereProps {
  size?: number
  animated?: boolean
}

export default function JarvisLogoSphere({ size = 200, animated = true }: JarvisLogoSphereProps) {
  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`}>
      {/* Sphère principale avec dégradé monochrome élégant */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${vitrineTheme.colors.gray[600]} 0%, ${vitrineTheme.colors.gray[800]} 50%, ${vitrineTheme.colors.gray[900]} 100%)`,
          boxShadow: `
            0 0 ${size * 0.3}px rgba(100, 116, 139, 0.3),
            inset 0 0 ${size * 0.2}px rgba(255, 255, 255, 0.1),
            inset 0 ${size * 0.1}px ${size * 0.2}px rgba(255, 255, 255, 0.2)
          `,
          overflow: 'hidden'
        }}
        animate={animated ? {
          rotateY: [0, 360],
        } : {}}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Reflet principal */}
        <Box
          position="absolute"
          top={`${size * 0.15}px`}
          left={`${size * 0.2}px`}
          w={`${size * 0.3}px`}
          h={`${size * 0.4}px`}
          borderRadius="50%"
          bg="rgba(255, 255, 255, 0.4)"
          filter="blur(8px)"
          transform="rotate(-20deg)"
        />
        
        {/* Reflet secondaire */}
        <Box
          position="absolute"
          top={`${size * 0.6}px`}
          right={`${size * 0.25}px`}
          w={`${size * 0.15}px`}
          h={`${size * 0.2}px`}
          borderRadius="50%"
          bg="rgba(255, 255, 255, 0.2)"
          filter="blur(4px)"
        />

        {/* Logo JARVIS au centre */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w={`${size * 0.4}px`}
          h={`${size * 0.4}px`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize={`${size * 0.08}px`}
          fontWeight="800"
          color="white"
          textShadow="0 2px 4px rgba(0,0,0,0.5)"
          letterSpacing="2px"
        >
          J
        </Box>

        {/* Anneaux internes */}
        <Box
          position="absolute"
          top={`${size * 0.2}px`}
          left={`${size * 0.2}px`}
          w={`${size * 0.6}px`}
          h={`${size * 0.6}px`}
          borderRadius="50%"
          border="1px solid rgba(255, 255, 255, 0.1)"
        />
        
        <Box
          position="absolute"
          top={`${size * 0.3}px`}
          left={`${size * 0.3}px`}
          w={`${size * 0.4}px`}
          h={`${size * 0.4}px`}
          borderRadius="50%"
          border="1px solid rgba(255, 255, 255, 0.05)"
        />
      </motion.div>

      {/* Anneaux orbitaux externes (seulement si animé) */}
      {animated && Array.from({ length: 2 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            inset: `-${20 + i * 15}px`,
            borderRadius: '50%',
            border: `1px solid ${vitrineTheme.colors.gray[400]}`,
            opacity: 0.2 - i * 0.05,
          }}
          animate={{
            rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            rotate: {
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 4 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }
          }}
        />
      ))}

      {/* Particules orbitales (seulement si animé) */}
      {animated && Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            backgroundColor: vitrineTheme.colors.gray[500],
            boxShadow: `0 0 6px ${vitrineTheme.colors.gray[500]}`,
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI * 2) / 6) * (size * 0.7),
              Math.cos((i * Math.PI * 2) / 6 + Math.PI * 2) * (size * 0.7)
            ],
            y: [
              Math.sin((i * Math.PI * 2) / 6) * (size * 0.7),
              Math.sin((i * Math.PI * 2) / 6 + Math.PI * 2) * (size * 0.7)
            ],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.2
          }}
        />
      ))}

      {/* Effet de glow externe */}
      {animated && (
        <motion.div
          style={{
            position: 'absolute',
            inset: `-${size * 0.3}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${vitrineTheme.colors.accent.glow} 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </Box>
  )
}
