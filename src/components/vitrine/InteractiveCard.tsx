'use client'

import { Box, VStack, HStack, Text, Icon } from '@chakra-ui/react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, useRef } from 'react'
import { IconType } from 'react-icons'

interface InteractiveCardProps {
  children: React.ReactNode
  variant?: 'tilt' | 'glow' | 'morph' | 'float'
  glowColor?: string
  className?: string
  onClick?: () => void
  [key: string]: any
}

export default function InteractiveCard({
  children,
  variant = 'tilt',
  glowColor = '#3b82f6',
  className,
  onClick,
  ...props
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Motion values pour l'effet tilt
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-100, 100], [30, -30])
  const rotateY = useTransform(x, [-100, 100], [-30, 30])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    x.set(event.clientX - centerX)
    y.set(event.clientY - centerY)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  const renderVariant = () => {
    switch (variant) {
      case 'tilt':
        return (
          <motion.div
            ref={cardRef}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d'
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={className}
            onClick={onClick}
            {...props}
          >
            <Box
              style={{
                transform: 'translateZ(50px)',
                boxShadow: isHovered 
                  ? `0 25px 50px -12px ${glowColor}40` 
                  : '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
              }}
              transition="box-shadow 0.3s ease"
            >
              {children}
            </Box>
          </motion.div>
        )

      case 'glow':
        return (
          <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={className}
            onClick={onClick}
            {...props}
          >
            <Box
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                inset: '-2px',
                borderRadius: 'inherit',
                padding: '2px',
                background: `linear-gradient(45deg, ${glowColor}, transparent, ${glowColor})`,
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}
              style={{
                boxShadow: isHovered 
                  ? `0 0 30px ${glowColor}60, inset 0 0 30px ${glowColor}20` 
                  : 'none'
              }}
              transition="box-shadow 0.3s ease"
            >
              {children}
            </Box>
          </motion.div>
        )

      case 'morph':
        return (
          <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
              borderRadius: isHovered ? '24px' : '12px',
              scale: isHovered ? 1.05 : 1
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={className}
            onClick={onClick}
            {...props}
          >
            <Box
              style={{
                background: isHovered 
                  ? `linear-gradient(135deg, ${glowColor}10, transparent)`
                  : 'transparent'
              }}
              transition="background 0.3s ease"
            >
              {children}
            </Box>
          </motion.div>
        )

      case 'float':
        return (
          <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
              y: isHovered ? -10 : 0,
              rotateX: isHovered ? 5 : 0,
              rotateY: isHovered ? 5 : 0
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={className}
            onClick={onClick}
            {...props}
          >
            <Box
              style={{
                boxShadow: isHovered 
                  ? `0 20px 40px ${glowColor}30` 
                  : '0 4px 6px rgba(0, 0, 0, 0.1)',
                transform: isHovered ? 'perspective(1000px)' : 'none'
              }}
              transition="all 0.3s ease"
            >
              {children}
            </Box>
          </motion.div>
        )

      default:
        return (
          <Box className={className} onClick={onClick} {...props}>
            {children}
          </Box>
        )
    }
  }

  return renderVariant()
}

// Composant spécialisé pour les solutions
interface SolutionCardProps {
  title: string
  subtitle: string
  description: string
  icon: IconType
  isComingSoon?: boolean
  onClick?: () => void
}

export function InteractiveSolutionCard({
  title,
  subtitle, 
  description,
  icon,
  isComingSoon = false,
  onClick
}: SolutionCardProps) {
  return (
    <InteractiveCard
      variant="tilt"
      glowColor={isComingSoon ? "#8b5cf6" : "#3b82f6"}
      onClick={onClick}
    >
      <VStack
        spacing={6}
        p={8}
        bg="white"
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.200"
        align="start"
        h="full"
        position="relative"
        overflow="hidden"
      >
        {/* Effet de brillance au hover */}
        <Box
          position="absolute"
          top="-50%"
          left="-50%"
          w="200%"
          h="200%"
          bg="linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)"
          transform="rotate(45deg)"
          transition="transform 0.6s ease"
          _groupHover={{
            transform: "rotate(45deg) translate(100%, 100%)"
          }}
        />

        <HStack spacing={4} zIndex={1}>
          <Box
            p={3}
            borderRadius="xl"
            bg={isComingSoon ? "purple.500" : "blue.500"}
            color="white"
          >
            <Icon as={icon} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="800" color="gray.800">
              {title}
            </Text>
            <Text fontSize="sm" color={isComingSoon ? "purple.600" : "blue.600"} fontWeight="600">
              {subtitle}
            </Text>
          </VStack>
        </HStack>

        <Text color="gray.600" lineHeight="1.6" zIndex={1}>
          {description}
        </Text>

        {isComingSoon && (
          <Box
            position="absolute"
            top={4}
            right={4}
            bg="purple.500"
            color="white"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="600"
            zIndex={2}
          >
            Bientôt disponible
          </Box>
        )}
      </VStack>
    </InteractiveCard>
  )
}
