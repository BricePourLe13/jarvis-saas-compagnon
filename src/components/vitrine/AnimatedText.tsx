'use client'

import { Box, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface AnimatedTextProps {
  children: string
  variant?: 'typewriter' | 'reveal' | 'gradient' | 'glitch' | 'wave'
  delay?: number
  className?: string
  [key: string]: any
}

export default function AnimatedText({ 
  children, 
  variant = 'reveal', 
  delay = 0,
  className,
  ...props 
}: AnimatedTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  // Effet typewriter
  useEffect(() => {
    if (variant === 'typewriter') {
      const timer = setTimeout(() => {
        if (currentIndex < children.length) {
          setDisplayText(children.slice(0, currentIndex + 1))
          setCurrentIndex(currentIndex + 1)
        }
      }, 50 + delay * 1000)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, children, variant, delay])

  const renderVariant = () => {
    switch (variant) {
      case 'typewriter':
        return (
          <Text className={className} {...props}>
            {displayText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ borderRight: '2px solid currentColor', paddingRight: '2px' }}
            >
              |
            </motion.span>
          </Text>
        )

      case 'reveal':
        return (
          <Box overflow="hidden" className={className}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay,
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
            >
              <Text {...props}>{children}</Text>
            </motion.div>
          </Box>
        )

      case 'gradient':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay }}
            className={className}
          >
            <Text
              bgGradient="linear(45deg, #3b82f6, #8b5cf6, #06b6d4)"
              bgClip="text"
              backgroundSize="200% 200%"
              animation="gradient 3s ease infinite"
              {...props}
            >
              {children}
              <style jsx>{`
                @keyframes gradient {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}</style>
            </Text>
          </motion.div>
        )

      case 'glitch':
        return (
          <Box position="relative" className={className}>
            <motion.div
              animate={{
                x: [0, -2, 2, 0],
                textShadow: [
                  '0 0 0 transparent',
                  '2px 0 0 #ff0000, -2px 0 0 #00ffff',
                  '0 0 0 transparent'
                ]
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 2 + delay
              }}
            >
              <Text {...props}>{children}</Text>
            </motion.div>
          </Box>
        )

      case 'wave':
        return (
          <Box className={className}>
            {children.split('').map((char, index) => (
              <motion.span
                key={index}
                style={{ display: 'inline-block' }}
                animate={{
                  y: [0, -10, 0],
                  color: [
                    'currentColor',
                    '#3b82f6',
                    'currentColor'
                  ]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: delay + index * 0.1,
                  repeatDelay: 2
                }}
              >
                <Text as="span" {...props}>
                  {char === ' ' ? '\u00A0' : char}
                </Text>
              </motion.span>
            ))}
          </Box>
        )

      default:
        return <Text className={className} {...props}>{children}</Text>
    }
  }

  return renderVariant()
}
