'use client'

import { Box, Grid, VStack, HStack, Text, Icon } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ReactNode, useState } from 'react'
import { IconType } from 'react-icons'

interface BentoItem {
  id: string
  title: string
  description: string
  icon?: IconType
  size: 'small' | 'medium' | 'large'
  color?: string
  children?: ReactNode
}

interface MagicBentoProps {
  items: BentoItem[]
  gap?: number
}

export default function MagicBento({ items, gap = 4 }: MagicBentoProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const getGridArea = (size: string, index: number) => {
    switch (size) {
      case 'large':
        return index === 0 ? "1 / 1 / 3 / 3" : "auto"
      case 'medium':
        return "span 1 / span 2"
      case 'small':
      default:
        return "span 1 / span 1"
    }
  }

  const getColumns = () => {
    const hasLarge = items.some(item => item.size === 'large')
    return hasLarge ? "repeat(4, 1fr)" : "repeat(3, 1fr)"
  }

  return (
    <Grid
      templateColumns={{ base: "1fr", md: getColumns() }}
      gap={gap}
      w="full"
      autoRows="minmax(200px, auto)"
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          style={{
            gridArea: getGridArea(item.size, index)
          }}
          whileHover={{ 
            scale: 1.02,
            zIndex: 10
          }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => setHoveredItem(item.id)}
          onHoverEnd={() => setHoveredItem(null)}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Box
            h="full"
            bg="white"
            borderRadius="2xl"
            p={6}
            position="relative"
            overflow="hidden"
            border="1px solid"
            borderColor="gray.200"
            cursor="pointer"
            _hover={{
              borderColor: item.color || "blue.300",
              shadow: `0 20px 40px ${item.color || '#3b82f6'}20`
            }}
            transition="all 0.3s ease"
          >
            {/* Background gradient */}
            <Box
              position="absolute"
              inset={0}
              bg={`linear-gradient(135deg, ${item.color || '#3b82f6'}05 0%, transparent 50%)`}
              opacity={hoveredItem === item.id ? 1 : 0}
              transition="opacity 0.3s ease"
            />

            {/* Floating orb */}
            <motion.div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${item.color || '#3b82f6'}20, transparent)`,
                filter: 'blur(20px)'
              }}
              animate={{
                scale: hoveredItem === item.id ? [1, 1.5, 1] : 1,
                opacity: hoveredItem === item.id ? [0.5, 1, 0.5] : 0.3
              }}
              transition={{
                duration: 2,
                repeat: hoveredItem === item.id ? Infinity : 0,
                ease: "easeInOut"
              }}
            />

            <VStack align="start" spacing={4} h="full" position="relative" zIndex={1}>
              {/* Icon */}
              {item.icon && (
                <motion.div
                  animate={{
                    rotate: hoveredItem === item.id ? [0, 10, -10, 0] : 0,
                    scale: hoveredItem === item.id ? 1.1 : 1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={`${item.color || '#3b82f6'}10`}
                    color={item.color || 'blue.500'}
                  >
                    <Icon as={item.icon} boxSize={6} />
                  </Box>
                </motion.div>
              )}

              {/* Content */}
              <VStack align="start" spacing={2} flex={1}>
                <motion.div
                  animate={{
                    y: hoveredItem === item.id ? -2 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {item.title}
                  </Text>
                </motion.div>

                <motion.div
                  animate={{
                    opacity: hoveredItem === item.id ? 1 : 0.7
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Text color="gray.600" lineHeight="1.6">
                    {item.description}
                  </Text>
                </motion.div>

                {/* Custom children */}
                {item.children && (
                  <Box mt="auto" w="full">
                    {item.children}
                  </Box>
                )}
              </VStack>
            </VStack>

            {/* Shine effect */}
            <motion.div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                transform: 'rotate(45deg)'
              }}
              animate={{
                x: hoveredItem === item.id ? ['0%', '100%'] : '0%'
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
            />
          </Box>
        </motion.div>
      ))}
    </Grid>
  )
}
