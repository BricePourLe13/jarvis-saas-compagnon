"use client"
import { 
  SimpleGrid,
  Box,
  HStack,
  VStack,
  Icon,
  Text,
  Badge
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

const MotionBox = motion(Box)

export interface MetricCard {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  highlight?: boolean
  onClick?: () => void
}

interface MetricsGridProps {
  metrics: MetricCard[]
  level: 'global' | 'franchise' | 'gym'
  columns?: { base: number; md: number; lg: number }
}

export function MetricsGrid({ 
  metrics, 
  level,
  columns = { base: 1, md: 2, lg: 4 }
}: MetricsGridProps) {
  
  const getLevelColors = (level: string) => {
    switch (level) {
      case 'global': return { bg: 'blue.50', border: 'blue.100' }
      case 'franchise': return { bg: 'purple.50', border: 'purple.100' }
      case 'gym': return { bg: 'green.50', border: 'green.100' }
      default: return { bg: 'gray.50', border: 'gray.100' }
    }
  }

  const levelColors = getLevelColors(level)

  return (
    <SimpleGrid columns={columns} gap={6}>
      {metrics.map((metric, index) => (
        <MotionBox
          key={metric.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.05,
            ease: "easeOut"
          }}
          whileHover={{ 
            scale: metric.onClick ? 1.02 : 1,
            transition: { duration: 0.15 }
          }}
          cursor={metric.onClick ? "pointer" : "default"}
          onClick={metric.onClick}
        >
          <Box
            bg="white"
            border="1px solid"
            borderColor={metric.highlight ? "red.200" : levelColors.border}
            borderRadius="16px"
            p={6}
            shadow={metric.highlight ? "0 8px 32px rgba(239, 68, 68, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.08)"}
            position="relative"
            _hover={metric.onClick ? {
              shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
              transform: "translateY(-1px)",
              transition: "all 0.3s ease"
            } : {}}
          >
            <HStack justify="space-between" align="start">
              <VStack spacing={2} align="start" flex="1">
                <Text 
                  fontSize="sm" 
                  color="gray.600"
                  fontWeight="400"
                >
                  {metric.label}
                </Text>
                <Text 
                  fontSize="2xl" 
                  fontWeight="600" 
                  color="black"
                  lineHeight="1"
                >
                  {metric.value}
                </Text>
                
                {metric.trend && (
                  <HStack spacing={1}>
                    <Text
                      fontSize="xs"
                      color={metric.trend.positive ? "green.600" : "red.600"}
                      fontWeight="500"
                    >
                      {metric.trend.positive ? "+" : ""}{metric.trend.value}%
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {metric.trend.label}
                    </Text>
                  </HStack>
                )}
              </VStack>
              
              <Box
                w={12}
                h={12}
                bg={`${metric.color}.500`}
                borderRadius="12px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Icon as={metric.icon} color="white" boxSize={6} />
              </Box>
            </HStack>
            
            {metric.highlight && (
              <Box
                position="absolute"
                top={2}
                right={2}
                w={2}
                h={2}
                bg="red.400"
                borderRadius="50%"
                animation="pulse 2s infinite"
              />
            )}

            {/* Badge niveau pour contexte */}
            <Badge
              position="absolute"
              top={2}
              left={2}
              size="sm"
              colorScheme={level === 'global' ? 'blue' : level === 'franchise' ? 'purple' : 'green'}
              variant="subtle"
              fontSize="2xs"
              textTransform="uppercase"
            >
              {level}
            </Badge>
          </Box>
        </MotionBox>
      ))}
    </SimpleGrid>
  )
}