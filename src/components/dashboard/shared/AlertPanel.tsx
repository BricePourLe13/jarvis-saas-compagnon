/**
 * 🚨 ALERT PANEL - SYSTÈME D'ALERTES SENTRY-STYLE
 * Panel d'alertes standardisé avec drill-down
 */

'use client'

import {
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  Box,
  useColorModeValue,
  Skeleton
} from '@chakra-ui/react'
import { AlertTriangle, CheckCircle, Info, XCircle, ChevronRight } from 'lucide-react'

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  severity: 'critical' | 'high' | 'medium' | 'low'
  component?: string
  actionable?: boolean
}

interface AlertPanelProps {
  alerts: Alert[]
  loading?: boolean
  onAlertClick?: (alert: Alert) => void
  onViewAll?: () => void
  maxVisible?: number
}

export default function AlertPanel({
  alerts,
  loading = false,
  onAlertClick,
  onViewAll,
  maxVisible = 5
}: AlertPanelProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return XCircle
      case 'warning': return AlertTriangle
      case 'info': return Info
      case 'success': return CheckCircle
      default: return Info
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'red'
      case 'warning': return 'orange'
      case 'info': return 'blue'
      case 'success': return 'green'
      default: return 'gray'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'blue'
      default: return 'gray'
    }
  }

  if (loading) {
    return (
      <Card bg={bgColor} borderColor={borderColor} size="sm">
        <CardHeader pb={2}>
          <Skeleton height="20px" width="120px" />
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={3}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height="60px" width="100%" />
            ))}
          </VStack>
        </CardBody>
      </Card>
    )
  }

  const visibleAlerts = alerts.slice(0, maxVisible)
  const hasMore = alerts.length > maxVisible

  if (alerts.length === 0) {
    return (
      <Card bg={bgColor} borderColor={borderColor} size="sm">
        <CardHeader pb={2}>
          <HStack justify="space-between">
            <Text fontSize="sm" fontWeight="bold" color="gray.900">
              System Status
            </Text>
            <Badge colorScheme="green" size="sm">
              ALL CLEAR
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <HStack spacing={2} py={4} justify="center">
            <CheckCircle size={16} color="green" />
            <Text fontSize="sm" color="green.600" fontWeight="medium">
              No active alerts
            </Text>
          </HStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card bg={bgColor} borderColor={borderColor} size="sm">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="bold" color="gray.900">
            Active Alerts
          </Text>
          <Badge colorScheme="red" size="sm">
            {alerts.length}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={2} align="stretch">
          {visibleAlerts.map(alert => {
            const AlertIcon = getAlertIcon(alert.type)
            const alertColor = getAlertColor(alert.type)
            
            return (
              <Box
                key={alert.id}
                p={3}
                borderRadius="md"
                bg={`${alertColor}.50`}
                borderLeft="3px solid"
                borderLeftColor={`${alertColor}.500`}
                cursor={onAlertClick ? 'pointer' : 'default'}
                _hover={onAlertClick ? { bg: `${alertColor}.100` } : {}}
                transition="all 0.2s"
                onClick={() => onAlertClick?.(alert)}
              >
                <HStack justify="space-between" align="start">
                  <HStack spacing={2} flex={1}>
                    <Icon as={AlertIcon} size={14} color={`${alertColor}.600`} />
                    <VStack align="start" spacing={0} flex={1}>
                      <HStack spacing={2} w="100%">
                        <Text fontSize="xs" fontWeight="bold" color="gray.900" flex={1} noOfLines={1}>
                          {alert.title}
                        </Text>
                        <Badge colorScheme={getSeverityColor(alert.severity)} size="xs">
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.600" noOfLines={2}>
                        {alert.message}
                      </Text>
                      <HStack spacing={2} mt={1}>
                        {alert.component && (
                          <Text fontSize="xs" color="gray.500" fontWeight="medium">
                            {alert.component}
                          </Text>
                        )}
                        <Text fontSize="xs" color="gray.500">
                          {alert.timestamp.toLocaleTimeString()}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  {onAlertClick && (
                    <Icon as={ChevronRight} size={12} color="gray.400" />
                  )}
                </HStack>
              </Box>
            )
          })}
        </VStack>

        {(hasMore || onViewAll) && (
          <Box mt={3} textAlign="center">
            <Button 
              size="xs" 
              variant="outline" 
              onClick={onViewAll}
              rightIcon={<ChevronRight size={12} />}
            >
              {hasMore ? `View all ${alerts.length} alerts` : 'View details'}
            </Button>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}



