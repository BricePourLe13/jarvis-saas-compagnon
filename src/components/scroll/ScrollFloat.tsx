'use client'

import { Box } from '@chakra-ui/react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, ReactNode } from 'react'

interface ScrollFloatProps {
  children: ReactNode
  speed?: number
  rotate?: boolean
  scale?: boolean
}

export default function ScrollFloat({ 
  children, 
  speed = 0.5,
  rotate = false,
  scale = false
}: ScrollFloatProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed])
  const rotateValue = useTransform(scrollYProgress, [0, 1], [0, rotate ? 180 : 0])
  const scaleValue = useTransform(scrollYProgress, [0, 0.5, 1], [
    scale ? 0.9 : 1, 
    scale ? 1.1 : 1, 
    scale ? 0.9 : 1
  ])

  return (
    <Box ref={ref}>
      <motion.div
        style={{
          y,
          rotate: rotateValue,
          scale: scaleValue
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-50px" }}
      >
        {children}
      </motion.div>
    </Box>
  )
}
