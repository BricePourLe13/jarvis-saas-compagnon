"use client"
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Image,
  Icon,
  Spinner
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Wifi, 
  WifiOff, 
  DollarSign, 
  Clock,
  MapPin
} from 'lucide-react'

const MotionBox = motion(Box)

interface GymCardProps {
  id: string
  name: string
  address?: string
  photo?: string
  activeUsers: number
  status: 'online' | 'offline' | 'warning'
  lastActivity?: string
  dailyCostUsd?: number
  totalCapacity?: number
  onClick?: () => void
  loading?: boolean
}

export function GymCard({
  id,
  name,
  address,
  photo,
  activeUsers,
  status,
  lastActivity,
  dailyCostUsd,
  totalCapacity = 50,
  onClick,
  loading = false
}: GymCardProps) {
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          color: 'green',
          label: 'EN LIGNE',
          icon: Wifi,
          iconColor: 'var(--chakra-colors-green-500)'
        }
      case 'offline':
        return {
          color: 'red',
          label: 'HORS LIGNE',
          icon: WifiOff,
          iconColor: 'var(--chakra-colors-red-500)'
        }
      case 'warning':
        return {
          color: 'orange',
          label: 'ATTENTION',
          icon: Wifi,
          iconColor: 'var(--chakra-colors-orange-500)'
        }
      default:
        return {
          color: 'gray',
          label: 'INCONNU',
          icon: WifiOff,
          iconColor: 'var(--chakra-colors-gray-500)'
        }
    }
  }

  const statusConfig = getStatusConfig(status)
  const utilizationRate = Math.round((activeUsers / totalCapacity) * 100)

  // Photo placeholder basée sur l'ID de la salle
  const placeholderPhoto = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop&auto=format&q=80`

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Box
        bg="white"
        borderRadius="12px"
        border="1px solid"
        borderColor="gray.100"
        overflow="hidden"
        cursor="pointer"
        onClick={onClick}
        _hover={{
          shadow: "0 8px 25px rgba(0, 0, 0, 0.12)",
          borderColor: "gray.200"
        }}
        transition="all 0.3s ease"
        position="relative"
      >
        {/* Status indicator */}
        <Box
          position="absolute"
          top={3}
          right={3}
          zIndex={2}
        >
          <Badge
            colorScheme={statusConfig.color}
            variant="solid"
            fontSize="xs"
            fontWeight="600"
            borderRadius="full"
            px={2}
            py={1}
          >
            <HStack spacing={1}>
              <Icon as={statusConfig.icon} boxSize={3} />
              <Text>{statusConfig.label}</Text>
            </HStack>
          </Badge>
        </Box>

        {/* Photo */}
        <Box position="relative" h="120px" overflow="hidden">
          <Image
            src={photo || placeholderPhoto}
            alt={name}
            w="full"
            h="full"
            objectFit="cover"
            fallback={
              <Box
                w="full"
                h="full"
                bg="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {loading ? (
                  <Spinner size="md" color="gray.400" />
                ) : (
                  <Text color="gray.400" fontSize="sm">
                    Pas d'image
                  </Text>
                )}
              </Box>
            }
          />
          
          {/* Overlay gradient */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="40px"
            bg="linear-gradient(transparent, rgba(0,0,0,0.6))"
          />
        </Box>

        {/* Content */}
        <VStack spacing={3} p={4} align="stretch">
          {/* Header */}
          <VStack spacing={1} align="start">
            <Text fontWeight="600" fontSize="md" color="black" noOfLines={1}>
              {name}
            </Text>
            {address && (
              <HStack spacing={1}>
                <Icon as={MapPin} boxSize={3} color="gray.400" />
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {address}
                </Text>
              </HStack>
            )}
          </VStack>

          {/* Metrics */}
          <HStack justify="space-between" align="center">
            <VStack spacing={0} align="start">
              <Text fontSize="xl" fontWeight="700" color="black">
                {activeUsers}
              </Text>
              <Text fontSize="xs" color="gray.500">
                utilisateurs
              </Text>
            </VStack>

            <VStack spacing={0} align="center">
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                {utilizationRate}%
              </Text>
              <Text fontSize="xs" color="gray.500">
                taux
              </Text>
            </VStack>

            {typeof dailyCostUsd === 'number' && (
              <VStack spacing={0} align="end">
                <HStack spacing={1}>
                  <Icon as={DollarSign} boxSize={3} color="green.500" />
                  <Text fontSize="sm" fontWeight="600" color="green.600">
                    ${dailyCostUsd}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  coût jour
                </Text>
              </VStack>
            )}
          </HStack>

          {/* Last activity */}
          {lastActivity && status === 'online' && (
            <HStack spacing={1} justify="center">
              <Icon as={Clock} boxSize={3} color="gray.400" />
              <Text fontSize="xs" color="gray.500">
                {lastActivity}
              </Text>
            </HStack>
          )}

          {/* Utilization bar */}
          <Box>
            <Box
              w="full"
              h="2px"
              bg="gray.100"
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                w={`${Math.min(utilizationRate, 100)}%`}
                h="full"
                bg={
                  utilizationRate > 80 ? "red.400" :
                  utilizationRate > 60 ? "orange.400" :
                  "green.400"
                }
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </Box>
          </Box>
        </VStack>
      </Box>
    </MotionBox>
  )
}