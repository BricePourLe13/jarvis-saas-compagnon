'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
}

export default function ScrollReveal({ 
  children, 
  direction = 'up', 
  delay = 0,
  duration = 0.8 
}: ScrollRevealProps) {
  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return { y: 60, opacity: 0 }
      case 'down': return { y: -60, opacity: 0 }
      case 'left': return { x: 60, opacity: 0 }
      case 'right': return { x: -60, opacity: 0 }
      default: return { y: 60, opacity: 0 }
    }
  }

  return (
    <Box overflow="hidden">
      <motion.div
        initial={getInitialTransform()}
        whileInView={{ 
          y: 0, 
          x: 0, 
          opacity: 1 
        }}
        transition={{ 
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        viewport={{ 
          once: true, 
          margin: "-100px",
          amount: 0.3
        }}
      >
        {children}
      </motion.div>
    </Box>
  )
}
