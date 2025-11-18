'use client'

import { Box, VStack, Flex, Heading, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import Avatar3D from '@/components/kiosk/Avatar3D'

interface JarvisAvatarProps {
  size?: number
  showText?: boolean
  title?: string
  description?: string
  variant?: 'default' | 'compact' | 'minimal'
  status?: 'idle' | 'listening' | 'speaking' | 'thinking'
  eyeScale?: number
}

const JarvisAvatar = ({ 
  size = 200, 
  showText = true, 
  title = "Intelligence Platform",
  description = "Analyse conversationnelle et insights analytiques pour salles de sport",
  variant = 'default',
  status = 'idle',
  eyeScale = 1
}: JarvisAvatarProps) => {
  
  // Animations selon la variante
  const getAnimationProps = () => {
    switch (variant) {
      case 'compact':
        return {
          animate: {
            y: [-3, 3, -3],
            rotateY: [0, 0.5, 0],
          },
          transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      case 'minimal':
        return {
          animate: {
            scale: [1, 1.02, 1],
          },
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      default:
        return {
          animate: {
            y: [-6, 6, -6],
            rotateY: [0, 1, 0],
          },
          transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
    }
  }

  const animationProps = getAnimationProps()

  return (
    <Flex align="center" justify="flex-start" h="full" position="relative" pt="20vh">
      <VStack spacing={variant === 'minimal' ? 4 : 8}>
        {/* Avatar JARVIS avec animation */}
        <Box position="relative">
          <motion.div {...animationProps}>
            <Avatar3D 
              status={status}
              size={size}
              eyeScale={eyeScale}
            />
          </motion.div>
        </Box>
        
        {/* Texte descriptif optionnel */}
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <VStack spacing={variant === 'minimal' ? 2 : 3} textAlign="center">
              <Heading 
                size={variant === 'minimal' ? 'md' : 'lg'} 
                color="#374151" 
                fontWeight="700"
              >
                {title}
              </Heading>
              {description && variant !== 'minimal' && (
                <Text 
                  color="#6b7280" 
                  fontSize={variant === 'compact' ? 'md' : 'lg'} 
                  maxW={variant === 'compact' ? '250px' : '300px'}
                >
                  {description}
                </Text>
              )}
            </VStack>
          </motion.div>
        )}
      </VStack>
    </Flex>
  )
}

export default JarvisAvatar