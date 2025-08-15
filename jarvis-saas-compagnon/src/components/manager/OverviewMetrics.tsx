'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,

  CircularProgress,
  CircularProgressLabel,
  Badge,
  Icon,
  useColorModeValue,
  Flex
} from '@chakra-ui/react'
import { TrendingUpIcon, AlertTriangleIcon, UsersIcon, ActivityIcon } from 'lucide-react'

type OverviewMetricsProps = {
  gymId: string
  overview: any
}

type Metric = {
  label: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: any
  colorScheme: string
  format?: 'number' | 'percentage' | 'currency'
}

export default function OverviewMetrics({ gymId, overview }: OverviewMetricsProps) {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
  )

  useEffect(() => {
    // Simuler des métriques avancées basées sur les données overview
    const calculatedMetrics: Metric[] = [
      {
        label: 'Taux de satisfaction',
        value: overview?.satisfaction_score || 0,
        change: 5.2,
        changeType: 'increase',
        icon: TrendingUpIcon,
        colorScheme: 'green',
        format: 'percentage'
      },
      {
        label: 'Sessions actives',
        value: overview?.active_sessions || 0,
        change: -2,
        changeType: 'decrease',
        icon: ActivityIcon,
        colorScheme: 'blue',
        format: 'number'
      },
      {
        label: 'Alertes critiques',
        value: overview?.alerts_count || 0,
        change: overview?.alerts_count > 0 ? 15 : -8,
        changeType: overview?.alerts_count > 0 ? 'increase' : 'decrease',
        icon: AlertTriangleIcon,
        colorScheme: overview?.alerts_count > 0 ? 'red' : 'green',
        format: 'number'
      },
      {
        label: 'Engagement quotidien',
        value: overview?.sessions_today || 0,
        change: 12.5,
        changeType: 'increase',
        icon: UsersIcon,
        colorScheme: 'purple',
        format: 'number'
      }
    ]

    setMetrics(calculatedMetrics)
    setLoading(false)
  }, [overview])

  const formatValue = (value: string | number, format?: string) => {
    if (format === 'percentage') {
      return `${value}%`
    }
    if (format === 'currency') {
      return `$${value}`
    }
    return value.toString()
  }

  if (loading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {[1, 2, 3, 4].map(i => (
          <Box key={i} p={6} bg={bgColor} borderRadius="16px" border="1px solid" borderColor={borderColor}>
            <CircularProgress isIndeterminate color="blue.300" size="60px" />
          </Box>
        ))}
      </SimpleGrid>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Hero metric - Satisfaction */}
      <Box
        p={8}
        bg={gradientBg}
        borderRadius="20px"
        color="white"
        position="relative"
        overflow="hidden"
      >
        <Box position="relative" zIndex={2}>
          <VStack spacing={6} align="center">
            <VStack spacing={2} align="center">
              <Text fontSize="lg" fontWeight="medium" opacity={0.9}>
                Taux de satisfaction global
              </Text>
              <Heading size="2xl" fontWeight="bold">
                {overview?.satisfaction_score || 0}%
              </Heading>
            </VStack>
            
            <HStack spacing={8}>
              <Stat textAlign="center">
                <StatLabel color="whiteAlpha.800">Cette semaine</StatLabel>
                <StatNumber fontSize="xl">+5.2%</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <StatArrow type="increase" />
                  Amélioration continue
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel color="whiteAlpha.800">Objectif mensuel</StatLabel>
                <StatNumber fontSize="xl">85%</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  Cible réseau
                </StatHelpText>
              </Stat>
            </HStack>

            <CircularProgress 
              value={overview?.satisfaction_score || 0} 
              size="120px" 
              thickness="8px"
              color="whiteAlpha.900"
              trackColor="whiteAlpha.300"
            >
              <CircularProgressLabel 
                fontSize="xl" 
                fontWeight="bold"
                color="white"
              >
                {overview?.satisfaction_score || 0}%
              </CircularProgressLabel>
            </CircularProgress>
          </VStack>
        </Box>

        {/* Gradient overlay pour l'effet premium */}
        <Box
          position="absolute"
          top={0}
          right={0}
          w="50%"
          h="100%"
          bg="radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)"
          zIndex={1}
        />
      </Box>

      {/* Métriques secondaires */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {metrics.slice(1).map((metric, index) => (
          <Box
            key={index}
            p={6}
            bg={bgColor}
            borderRadius="16px"
            border="1px solid"
            borderColor={borderColor}
            position="relative"
            transition="all 0.2s ease"
            _hover={{
              transform: 'translateY(-2px)',
              shadow: 'lg',
              borderColor: `${metric.colorScheme}.200`
            }}
          >
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" align="center">
                <Icon
                  as={metric.icon}
                  w={8}
                  h={8}
                  color={`${metric.colorScheme}.500`}
                  p={2}
                  bg={`${metric.colorScheme}.50`}
                  borderRadius="lg"
                />
                
                {metric.change && (
                  <Badge
                    colorScheme={metric.changeType === 'increase' ? 'green' : 'red'}
                    variant="subtle"
                    borderRadius="full"
                    px={2}
                  >
                    {metric.changeType === 'increase' ? '↗' : '↘'} {Math.abs(metric.change)}%
                  </Badge>
                )}
              </HStack>

              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="text.muted" fontWeight="medium">
                  {metric.label}
                </Text>
                <Heading size="lg" color="text.default">
                  {formatValue(metric.value, metric.format)}
                </Heading>
                <Text fontSize="xs" color="text.muted">
                  vs période précédente
                </Text>
              </VStack>
            </VStack>

            {/* Accent bar */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              height="3px"
              bg={`${metric.colorScheme}.400`}
              borderTopRadius="16px"
            />
          </Box>
        ))}
      </SimpleGrid>

      {/* Métriques d'activité temps réel */}
      <Box
        p={6}
        bg={bgColor}
        borderRadius="16px"
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="md" color="text.default">Activité temps réel</Heading>
            <Badge colorScheme="green" variant="outline">
              LIVE
            </Badge>
          </HStack>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat textAlign="center" p={3} bg="bg.subtle" borderRadius="12px">
              <StatLabel fontSize="xs">Kiosque</StatLabel>
              <StatNumber fontSize="lg" color={overview?.kiosk_status === 'online' ? 'green.500' : 'red.500'}>
                {overview?.kiosk_status?.toUpperCase() || 'OFF'}
              </StatNumber>
            </Stat>

            <Stat textAlign="center" p={3} bg="bg.subtle" borderRadius="12px">
              <StatLabel fontSize="xs">Sessions actives</StatLabel>
              <StatNumber fontSize="lg">{overview?.active_sessions || 0}</StatNumber>
            </Stat>

            <Stat textAlign="center" p={3} bg="bg.subtle" borderRadius="12px">
              <StatLabel fontSize="xs">Aujourd'hui</StatLabel>
              <StatNumber fontSize="lg">{overview?.sessions_today || 0}</StatNumber>
            </Stat>

            <Stat textAlign="center" p={3} bg="bg.subtle" borderRadius="12px">
              <StatLabel fontSize="xs">Alertes</StatLabel>
              <StatNumber fontSize="lg" color={overview?.alerts_count > 0 ? 'red.500' : 'green.500'}>
                {overview?.alerts_count || 0}
              </StatNumber>
            </Stat>
          </SimpleGrid>
        </VStack>
      </Box>
    </VStack>
  )
}
