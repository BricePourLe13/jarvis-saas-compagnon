/**
 * 🧭 SENTRY SIDEBAR - NAVIGATION PROFESSIONNELLE
 * Sidebar fixe avec contexte gym, navigation modulaire
 */

'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Avatar,
  useColorModeValue,
  Icon,
  Tooltip
} from '@chakra-ui/react'
import {
  BarChart3,
  Activity,
  Users,
  TrendingUp,
  Settings,
  Monitor,
  AlertTriangle,
  Wifi,
  WifiOff,
  Building2,
  ChevronRight,
  Home,
  Database
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import SafeLink from '@/components/common/SafeLink'

interface SentrySidebarProps {
  currentPath: string[]
  gymId?: string
  franchiseId?: string
}

interface NavigationItem {
  id: string
  label: string
  icon: any
  href: string
  badge?: string
  badgeColor?: string
  isActive?: boolean
}

export default function SentrySidebar({ currentPath, gymId, franchiseId }: SentrySidebarProps) {
  const router = useRouter()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  // Navigation principale
  const mainNavigation: NavigationItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      href: `/dashboard/franchises/${franchiseId}/gyms/${gymId}/overview`,
      isActive: currentPath.includes('overview')
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Activity,
      href: `/dashboard/franchises/${franchiseId}/gyms/${gymId}/operations`,
      badge: '2',
      badgeColor: 'green',
      isActive: currentPath.includes('operations')
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      href: `/dashboard/franchises/${franchiseId}/gyms/${gymId}/members`,
      badge: '3',
      badgeColor: 'orange',
      isActive: currentPath.includes('members')
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      href: `/dashboard/franchises/${franchiseId}/gyms/${gymId}/analytics`,
      isActive: currentPath.includes('analytics')
    }
  ]

  // Navigation système
  const systemNavigation: NavigationItem[] = [
    {
      id: 'kiosk',
      label: 'Kiosk Live',
      icon: Monitor,
      href: `/dashboard/franchises/${franchiseId}/gyms/${gymId}/kiosk`,
      isActive: currentPath.includes('kiosk')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: `/dashboard/franchises/${franchiseId}/gyms/${gymId}/settings`,
      isActive: currentPath.includes('settings')
    }
  ]

  return (
    <Box
      w="280px"
      h="100vh"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
    >
      {/* Header Gym */}
      <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
        <VStack spacing={3} align="stretch">
          {/* Breadcrumb rapide */}
          <HStack spacing={2} fontSize="xs" color="gray.500">
            <SafeLink href="/dashboard">
              <HStack spacing={1} _hover={{ color: 'blue.500' }}>
                <Home size={12} />
                <Text>Dashboard</Text>
              </HStack>
            </SafeLink>
            <ChevronRight size={10} />
            <SafeLink href={`/dashboard/franchises/${franchiseId}`}>
              <HStack spacing={1} _hover={{ color: 'blue.500' }}>
                <Building2 size={12} />
                <Text>Franchise</Text>
              </HStack>
            </SafeLink>
            <ChevronRight size={10} />
            <Text fontWeight="medium">Gym</Text>
          </HStack>

          {/* Info Gym */}
          <HStack spacing={3}>
            <Avatar size="sm" name="Gym" bg="blue.500" />
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                Salle de Sport
              </Text>
              <HStack spacing={2}>
                <Badge 
                  colorScheme="green" 
                  size="xs" 
                  display="flex" 
                  alignItems="center" 
                  gap={1}
                >
                  <Wifi size={8} />
                  Online
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  v2.1.3
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {/* Navigation Principale */}
      <Box flex={1} p={3}>
        <VStack spacing={1} align="stretch">
          <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} px={2}>
            MONITORING
          </Text>
          
          {mainNavigation.map(item => (
            <SafeLink key={item.id} href={item.href}>
              <Button
                variant={item.isActive ? "solid" : "ghost"}
                colorScheme={item.isActive ? "blue" : "gray"}
                size="sm"
                justifyContent="flex-start"
                w="100%"
                leftIcon={<Icon as={item.icon} size={16} />}
                rightIcon={
                  item.badge ? (
                    <Badge colorScheme={item.badgeColor} size="xs">
                      {item.badge}
                    </Badge>
                  ) : undefined
                }
                fontWeight={item.isActive ? "bold" : "medium"}
                fontSize="sm"
              >
                {item.label}
              </Button>
            </SafeLink>
          ))}

          <Divider my={3} />

          <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} px={2}>
            SYSTEM
          </Text>

          {systemNavigation.map(item => (
            <SafeLink key={item.id} href={item.href}>
              <Button
                variant={item.isActive ? "solid" : "ghost"}
                colorScheme={item.isActive ? "blue" : "gray"}
                size="sm"
                justifyContent="flex-start"
                w="100%"
                leftIcon={<Icon as={item.icon} size={16} />}
                fontWeight={item.isActive ? "bold" : "medium"}
                fontSize="sm"
              >
                {item.label}
              </Button>
            </SafeLink>
          ))}
        </VStack>
      </Box>

      {/* Footer Status */}
      <Box p={3} borderTop="1px solid" borderColor={borderColor}>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" fontSize="xs">
            <Text color="gray.500">System Status</Text>
            <Badge colorScheme="green" size="xs">ALL GOOD</Badge>
          </HStack>
          
          <HStack justify="space-between" fontSize="xs">
            <HStack spacing={1}>
              <Database size={10} />
              <Text color="gray.500">DB</Text>
            </HStack>
            <Text color="green.600" fontWeight="medium">98ms</Text>
          </HStack>
        </VStack>
      </Box>
    </Box>
  )
}
