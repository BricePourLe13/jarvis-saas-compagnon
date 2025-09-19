"use client"

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

/**
 * DarkVeilAlternative - Alternative CSS pure qui ressemble exactement au DarkVeil de React Bits
 * Utilise des animations CSS et Framer Motion pour un rendu similaire
 */
type Props = {
  hueShift?: number;
  noiseIntensity?: number;
  speed?: number;
}

export default function DarkVeilAlternative({
  hueShift = 200,
  noiseIntensity = 0.05,
  speed = 0.3
}: Props) {
  // Conversion du hueShift en couleurs CSS
  const getHueColors = (shift: number) => {
    const baseHue = shift;
    return {
      primary: `hsl(${baseHue}, 70%, 50%)`,
      secondary: `hsl(${baseHue + 60}, 60%, 45%)`,
      tertiary: `hsl(${baseHue + 120}, 50%, 40%)`
    }
  }

  const colors = getHueColors(hueShift);

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflow="hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 50%, ${colors.primary}30 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, ${colors.secondary}30 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, ${colors.tertiary}20 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 30%, #16213e 60%, #0a0a0f 100%)
        `
      }}
    >
      {/* Couche animée principale */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 30% 40%, ${colors.primary}40 0%, transparent 60%),
            radial-gradient(circle at 70% 60%, ${colors.secondary}30 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, ${colors.tertiary}25 0%, transparent 55%)
          `
        }}
        animate={{
          background: [
            `
              radial-gradient(circle at 30% 40%, ${colors.primary}40 0%, transparent 60%),
              radial-gradient(circle at 70% 60%, ${colors.secondary}30 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, ${colors.tertiary}25 0%, transparent 55%)
            `,
            `
              radial-gradient(circle at 70% 30%, ${colors.primary}35 0%, transparent 55%),
              radial-gradient(circle at 20% 70%, ${colors.secondary}40 0%, transparent 60%),
              radial-gradient(circle at 80% 20%, ${colors.tertiary}30 0%, transparent 50%)
            `,
            `
              radial-gradient(circle at 50% 70%, ${colors.primary}30 0%, transparent 50%),
              radial-gradient(circle at 80% 40%, ${colors.secondary}35 0%, transparent 55%),
              radial-gradient(circle at 30% 30%, ${colors.tertiary}40 0%, transparent 60%)
            `,
            `
              radial-gradient(circle at 30% 40%, ${colors.primary}40 0%, transparent 60%),
              radial-gradient(circle at 70% 60%, ${colors.secondary}30 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, ${colors.tertiary}25 0%, transparent 55%)
            `
          ]
        }}
        transition={{
          duration: 8 / speed,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Couche de texture/noise */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, ${noiseIntensity * 0.5}) 2px,
              rgba(255, 255, 255, ${noiseIntensity * 0.5}) 4px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 3px,
              rgba(255, 255, 255, ${noiseIntensity * 0.3}) 3px,
              rgba(255, 255, 255, ${noiseIntensity * 0.3}) 6px
            )
          `,
          opacity: noiseIntensity * 2
        }}
        animate={{
          backgroundPosition: ['0px 0px, 0px 0px', '100px 100px, -100px -100px']
        }}
        transition={{
          duration: 20 / speed,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Couche de formes organiques flottantes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 200 + 100}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}${Math.floor(Math.random() * 20 + 10)} 0%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: 'blur(40px)'
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, Math.random() * 0.5 + 0.8, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: (Math.random() * 10 + 15) / speed,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
        />
      ))}

      {/* Overlay de profondeur */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        background="radial-gradient(circle at center, transparent 0%, rgba(10, 10, 15, 0.6) 100%)"
        pointerEvents="none"
      />
    </Box>
  )
}
