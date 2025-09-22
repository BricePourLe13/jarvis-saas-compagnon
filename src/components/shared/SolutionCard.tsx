'use client'

import {
  Card,
  CardBody,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Icon,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import { FaArrowRight, FaCheck } from 'react-icons/fa'

interface SolutionCardProps {
  title: string
  subtitle: string
  description: string
  icon: IconType
  color: string
  status: 'available' | 'coming-soon' | 'beta'
  features: string[]
  metrics?: {
    clients: string
    satisfaction: string
    sessions: string
  }
  onAction: () => void
  actionLabel?: string
}

const statusConfig = {
  available: {
    label: 'Disponible',
    colorScheme: 'green',
    disabled: false
  },
  'coming-soon': {
    label: 'Bientôt disponible',
    colorScheme: 'orange',
    disabled: true
  },
  beta: {
    label: 'Version Bêta',
    colorScheme: 'blue',
    disabled: false
  }
}

export default function SolutionCard({
  title,
  subtitle,
  description,
  icon,
  color,
  status,
  features,
  metrics,
  onAction,
  actionLabel
}: SolutionCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const statusStyle = statusConfig[status]

  return (
    <Card 
      bg={cardBg} 
      shadow="xl" 
      borderRadius="2xl" 
      overflow="hidden"
      h="full"
      transition="all 0.3s"
      _hover={{ 
        transform: status !== 'coming-soon' ? 'translateY(-4px)' : 'none', 
        shadow: status !== 'coming-soon' ? '2xl' : 'xl' 
      }}
      opacity={status === 'coming-soon' ? 0.9 : 1}
    >
      <CardBody p={8}>
        <VStack align="start" spacing={6} h="full">
          {/* Header */}
          <HStack justify="space-between" w="full">
            <HStack spacing={3}>
              <Icon 
                as={icon} 
                boxSize={8} 
                color={`${color}.500`} 
              />
              <VStack align="start" spacing={0}>
                <Heading size="lg">{title}</Heading>
                <Text color="gray.500" fontSize="sm">
                  {subtitle}
                </Text>
              </VStack>
            </HStack>
            <Badge 
              colorScheme={statusStyle.colorScheme}
              borderRadius="full"
              px={3}
              py={1}
            >
              {statusStyle.label}
            </Badge>
          </HStack>

          {/* Description */}
          <Text color="gray.600" lineHeight="tall">
            {description}
          </Text>

          {/* Features */}
          <VStack align="start" spacing={2} w="full">
            <Text fontWeight="semibold" color="gray.700">
              Fonctionnalités clés :
            </Text>
            {features.map((feature, index) => (
              <HStack key={index} spacing={2}>
                <Icon as={FaCheck} color="green.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600">{feature}</Text>
              </HStack>
            ))}
          </VStack>

          {/* Metrics */}
          {metrics && (
            <HStack spacing={6} w="full" pt={4}>
              <VStack spacing={0}>
                <Text fontWeight="bold" color={`${color}.500`}>
                  {metrics.clients}
                </Text>
                <Text fontSize="xs" color="gray.500">Clients</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontWeight="bold" color={`${color}.500`}>
                  {metrics.satisfaction}
                </Text>
                <Text fontSize="xs" color="gray.500">Satisfaction</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontWeight="bold" color={`${color}.500`}>
                  {metrics.sessions}
                </Text>
                <Text fontSize="xs" color="gray.500">Sessions</Text>
              </VStack>
            </HStack>
          )}

          {/* Action Button */}
          <Button
            colorScheme={color}
            size="lg"
            w="full"
            rightIcon={<FaArrowRight />}
            onClick={onAction}
            isDisabled={statusStyle.disabled}
            mt="auto"
            variant={status === 'coming-soon' ? 'outline' : 'solid'}
          >
            {actionLabel || (statusStyle.disabled ? statusStyle.label : 'Accéder')}
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}


