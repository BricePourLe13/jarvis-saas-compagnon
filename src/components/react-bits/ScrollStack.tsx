'use client'

import { Box } from '@chakra-ui/react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface ScrollStackItem {
  id: string
  content: ReactNode
  color?: string
}

interface ScrollStackProps {
  items: ScrollStackItem[]
  spacing?: number
}

export default function ScrollStack({ items, spacing = 100 }: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  return (
    <Box ref={containerRef} position="relative" h={`${items.length * spacing}vh`}>
      {items.map((item, index) => {
        // Calculate scroll progress for this item
        const start = index / items.length
        const end = (index + 1) / items.length

        // Transform values
        const y = useTransform(
          scrollYProgress,
          [start, end],
          [0, -spacing]
        )

        const scale = useTransform(
          scrollYProgress,
          [start, start + 0.1, end - 0.1, end],
          [0.8, 1, 1, 0.8]
        )

        const opacity = useTransform(
          scrollYProgress,
          [start, start + 0.1, end - 0.1, end],
          [0, 1, 1, 0]
        )

        const rotateX = useTransform(
          scrollYProgress,
          [start, end],
          [15, -15]
        )

        return (
          <motion.div
            key={item.id}
            style={{
              position: 'sticky',
              top: '50vh',
              transform: 'translateY(-50%)',
              y,
              scale,
              opacity,
              rotateX,
              transformStyle: 'preserve-3d'
            }}
          >
            <Box
              bg={item.color || 'white'}
              borderRadius="2xl"
              p={8}
              mx="auto"
              maxW="4xl"
              border="1px solid"
              borderColor="gray.200"
              shadow="2xl"
              style={{
                transform: `translateZ(${index * 20}px)`
              }}
            >
              {/* Background glow */}
              <Box
                position="absolute"
                inset={-4}
                bg={`radial-gradient(circle, ${item.color || '#ffffff'}40, transparent)`}
                borderRadius="2xl"
                filter="blur(20px)"
                zIndex={-1}
              />

              {/* Content */}
              <Box position="relative" zIndex={1}>
                {item.content}
              </Box>

              {/* Floating particles */}
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  style={{
                    position: 'absolute',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    backgroundColor: item.color || '#3b82f6',
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.5, 1]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </Box>
          </motion.div>
        )
      })}
    </Box>
  )
}
