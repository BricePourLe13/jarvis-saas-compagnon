'use client'

import { Box } from '@chakra-ui/react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface GradualBlurProps {
  children: ReactNode
  intensity?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

export default function GradualBlur({ 
  children, 
  intensity = 5, 
  direction = 'up',
  className 
}: GradualBlurProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  // Transform blur based on scroll position
  const blur = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [intensity, 0, 0, intensity]
  )

  // Transform position based on direction
  const getTransform = () => {
    switch (direction) {
      case 'up':
        return useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [50, 0, 0, -50])
      case 'down':
        return useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [-50, 0, 0, 50])
      case 'left':
        return useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [50, 0, 0, -50])
      case 'right':
        return useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [-50, 0, 0, 50])
      default:
        return useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [50, 0, 0, -50])
    }
  }

  const transform = getTransform()
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3])

  return (
    <Box ref={ref} className={className}>
      <motion.div
        style={{
          filter: blur.get() ? `blur(${blur.get()}px)` : 'none',
          y: direction === 'up' || direction === 'down' ? transform : 0,
          x: direction === 'left' || direction === 'right' ? transform : 0,
          opacity
        }}
      >
        {children}
      </motion.div>
    </Box>
  )
}
