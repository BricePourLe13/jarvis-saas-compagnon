/**
 * 📊 METRIC CARD - COMPOSANT STANDARDISÉ SENTRY-STYLE
 * Card métrique réutilisable avec drill-down
 */

'use client'

import {
  Card,
  CardBody,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Box,
  useColorModeValue,
  Skeleton
} from '@chakra-ui/react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ReactElement } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  trendLabel?: string
  status?: 'good' | 'warning' | 'critical' | 'neutral'
  icon?: any
  loading?: boolean
  onClick?: () => void
  badge?: {
    text: string
    colorScheme: string
  }
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  status = 'neutral',
  icon,
  loading = false,
  onClick,
  badge
}: MetricCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'green'
      case 'warning': return 'orange'
      case 'critical': return 'red'
      case 'neutral': return 'blue'
      default: return 'gray'
    }
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'green.500'
    if (trend < 0) return 'red.500'
    return 'gray.500'
  }

  if (loading) {
    return (
      <Card bg={bgColor} borderColor={borderColor} size="sm">
        <CardBody p={4}>
          <VStack spacing={3} align="stretch">
            <Skeleton height="16px" />
            <Skeleton height="32px" />
            <Skeleton height="12px" />
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card 
      bg={bgColor} 
      borderColor={borderColor} 
      size="sm"
      cursor={onClick ? 'pointer' : 'default'}
      _hover={onClick ? { shadow: 'md', transform: 'translateY(-1px)' } : {}}
      transition="all 0.2s"
      onClick={onClick}
    >
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          
          {/* Header */}
          <HStack justify="space-between" align="start">
            <HStack spacing={2}>
              {icon && (
                <Box
                  p={1}
                  borderRadius="md"
                  bg={`${getStatusColor(status)}.100`}
                >
                  <Icon as={icon} size={14} color={`${getStatusColor(status)}.600`} />
                </Box>
              )}
              <Text fontSize="xs" fontWeight="medium" color="gray.600" noOfLines={1}>
                {title}
              </Text>
            </HStack>
            
            {badge && (
              <Badge colorScheme={badge.colorScheme} size="xs">
                {badge.text}
              </Badge>
            )}
          </HStack>

          {/* Value */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900" lineHeight={1}>
              {value}
            </Text>
            {subtitle && (
              <Text fontSize="xs" color="gray.500">
                {subtitle}
              </Text>
            )}
          </Box>

          {/* Trend */}
          {trend !== undefined && (
            <HStack spacing={1}>
              <Icon 
                as={trend >= 0 ? TrendingUp : TrendingDown}
                size={12}
                color={getTrendColor(trend)}
              />
              <Text fontSize="xs" color={getTrendColor(trend)} fontWeight="medium">
                {Math.abs(trend).toFixed(1)}%
              </Text>
              {trendLabel && (
                <Text fontSize="xs" color="gray.500">
                  {trendLabel}
                </Text>
              )}
            </HStack>
          )}

        </VStack>
      </CardBody>
    </Card>
  )
}

