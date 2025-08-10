"use client"
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Badge
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

const MotionBox = motion(Box)

interface UnifiedCardProps {
  metric: string | number
  label: string
  icon: LucideIcon
  trend?: {
    value: number
    period: string
    positive: boolean
  }
  alert?: boolean
  onClick?: () => void
  loading?: boolean
}

export function UnifiedCard({
  metric,
  label,
  icon,
  trend,
  alert = false,
  onClick,
  loading = false
}: UnifiedCardProps) {
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={onClick ? { 
        y: -2,
        transition: { duration: 0.2 }
      } : {}}
    >
      <Box
        bg="white"
        border="1px solid"
        borderColor={alert ? "red.200" : "gray.100"}
        borderRadius="12px"
        p={6}
        shadow={alert ? "0 4px 20px rgba(239, 68, 68, 0.1)" : "0 2px 8px rgba(0, 0, 0, 0.04)"}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick}
        position="relative"
        _hover={onClick ? {
          shadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          borderColor: "gray.200",
          transition: "all 0.2s ease"
        } : {}}
      >
        {/* Alert indicator */}
        {alert && (
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

        <HStack justify="space-between" align="start" spacing={4}>
          {/* Content */}
          <VStack spacing={3} align="start" flex="1">
            <Text 
              fontSize="sm" 
              color="gray.600"
              fontWeight="400"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              {label}
            </Text>
            
            <Text 
              fontSize="3xl" 
              fontWeight="600" 
              color="black"
              lineHeight="1"
              opacity={loading ? 0.5 : 1}
            >
              {loading ? "—" : metric}
            </Text>
            
            {trend && (
              <HStack spacing={1} align="center">
                <Icon 
                  as={trend.positive ? TrendingUp : TrendingDown} 
                  boxSize={3}
                  color={trend.positive ? "green.500" : "red.500"}
                />
                <Text
                  fontSize="xs"
                  color={trend.positive ? "green.600" : "red.600"}
                  fontWeight="500"
                >
                  {trend.positive ? "+" : ""}{trend.value}%
                </Text>
                <Text 
                  fontSize="xs" 
                  color="gray.500"
                >
                  {trend.period}
                </Text>
              </HStack>
            )}
          </VStack>
          
          {/* Icon */}
          <Box
            w={12}
            h={12}
            bg="black"
            borderRadius="8px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Icon as={icon} color="white" boxSize={6} />
          </Box>
        </HStack>
      </Box>
    </MotionBox>
  )
}