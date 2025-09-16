'use client'

import { Box } from '@chakra-ui/react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface TiltedCardProps {
  children: ReactNode
  tiltIntensity?: number
  glowColor?: string
  className?: string
}

export default function TiltedCard({ 
  children, 
  tiltIntensity = 20, 
  glowColor = '#3b82f6',
  className 
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Motion values for mouse position
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring animations for smooth movement
  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  // Transform mouse position to rotation
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [tiltIntensity, -tiltIntensity])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-tiltIntensity, tiltIntensity])

  // Transform for glow effect
  const glowX = useTransform(mouseXSpring, [-0.5, 0.5], [-100, 100])
  const glowY = useTransform(mouseYSpring, [-0.5, 0.5], [-100, 100])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY: rotateY,
        rotateX: rotateX,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={className}
    >
      <Box
        position="relative"
        borderRadius="2xl"
        overflow="hidden"
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        style={{
          transform: "translateZ(75px)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glow effect */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${glowX.get() + 50}% ${glowY.get() + 50}%, ${glowColor}40, transparent 70%)`,
            opacity: 0,
            zIndex: -1
          }}
          animate={{
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Shine overlay */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
            transform: `translateX(${glowX.get()}px) translateY(${glowY.get()}px)`,
            pointerEvents: 'none'
          }}
        />

        {/* Content */}
        <Box
          style={{
            transform: "translateZ(50px)",
          }}
        >
          {children}
        </Box>

        {/* Floating elements */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: glowColor,
              top: `${20 + i * 30}%`,
              right: `${10 + i * 5}%`,
              transform: `translateZ(${25 + i * 10}px)`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </Box>
    </motion.div>
  )
}
