'use client'

import { Box } from '@chakra-ui/react'
import { motion, useScroll, useTransform, useVelocity } from 'framer-motion'
import { useRef, ReactNode } from 'react'

interface ScrollVelocityProps {
  children: ReactNode
  factor?: number
  direction?: 'horizontal' | 'vertical'
}

export default function ScrollVelocity({ 
  children, 
  factor = 0.5,
  direction = 'vertical'
}: ScrollVelocityProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  
  const velocityTransform = useTransform(
    scrollVelocity,
    [-1000, 0, 1000],
    direction === 'vertical' ? [-50, 0, 50] : [-50, 0, 50]
  )

  const smoothVelocity = useTransform(
    velocityTransform,
    (value) => value * factor
  )

  return (
    <Box ref={ref} overflow="hidden">
      <motion.div
        style={{
          [direction === 'vertical' ? 'y' : 'x']: smoothVelocity
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {children}
      </motion.div>
    </Box>
  )
}
