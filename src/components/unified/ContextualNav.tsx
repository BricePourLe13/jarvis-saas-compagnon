"use client"
import {
  VStack,
  HStack,
  Text,
  Icon,
  Box,
  Badge,
  Divider
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  Building2, 
  Dumbbell, 
  AlertTriangle,
  Users,
  Settings,
  ChevronRight
} from 'lucide-react'

const MotionBox = motion(Box)

interface NavItem {
  label: string
  href: string
  icon: any
  badge?: number
  active?: boolean
  level: 'global' | 'franchise' | 'gym'
}

interface ContextualNavProps {
  currentLevel: 'global' | 'franchise' | 'gym'
  franchiseId?: string
  franchiseName?: string
  gymId?: string
  gymName?: string
}

export function ContextualNav({
  currentLevel,
  franchiseId,
  franchiseName,
  gymId,
  gymName
}: ContextualNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isActivePath = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // Navigation adaptative selon le contexte
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: Home,
        active: isActivePath('/admin') && pathname === '/admin',
        level: 'global'
      }
    ]

    if (currentLevel === 'global') {
      return [
        ...baseItems,
        {
          label: 'Franchises',
          href: '/admin/franchises',
          icon: Building2,
          active: isActivePath('/admin/franchises'),
          level: 'global'
        },
        {
          label: 'Alertes',
          href: '/admin/alerts',
          icon: AlertTriangle,
          badge: 3,
          level: 'global'
        },
        {
          label: 'Équipe',
          href: '/admin/team',
          icon: Users,
          active: isActivePath('/admin/team'),
          level: 'global'
        }
      ]
    }

    if (currentLevel === 'franchise' && franchiseId) {
      return [
        ...baseItems,
        {
          label: 'Toutes les franchises',
          href: '/admin/franchises',
          icon: Building2,
          level: 'global'
        },
        {
          label: franchiseName || 'Franchise',
          href: `/admin/franchises/${franchiseId}/gyms`,
          icon: Building2,
          active: isActivePath(`/admin/franchises/${franchiseId}/gyms`),
          level: 'franchise'
        },
        {
          label: 'Salles',
          href: `/admin/franchises/${franchiseId}/gyms`,
          icon: Dumbbell,
          active: isActivePath(`/admin/franchises/${franchiseId}/gyms`),
          level: 'franchise'
        },
        {
          label: 'Monitoring',
          href: `/admin/franchises/${franchiseId}/monitoring`,
          icon: AlertTriangle,
          active: isActivePath(`/admin/franchises/${franchiseId}/monitoring`),
          level: 'franchise'
        }
      ]
    }

    if (currentLevel === 'gym' && franchiseId && gymId) {
      return [
        ...baseItems,
        {
          label: franchiseName || 'Franchise',
          href: `/admin/franchises/${franchiseId}/gyms`,
          icon: Building2,
          level: 'franchise'
        },
        {
          label: 'Toutes les salles',
          href: `/admin/franchises/${franchiseId}/gyms`,
          icon: Dumbbell,
          level: 'franchise'
        },
        {
          label: gymName || 'Salle',
          href: `/admin/franchises/${franchiseId}/gyms/${gymId}`,
          icon: Dumbbell,
          active: isActivePath(`/admin/franchises/${franchiseId}/gyms/${gymId}`),
          level: 'gym'
        },
        {
          label: 'Configuration',
          href: `/admin/franchises/${franchiseId}/gyms/${gymId}/settings`,
          icon: Settings,
          level: 'gym'
        }
      ]
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <VStack spacing={1} align="stretch" w="full">
      {navItems.map((item, index) => (
          <Box key={`${item.level}:${item.href}:${item.label}`}>
          <MotionBox
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <HStack
              spacing={3}
              p={3}
              borderRadius="6px"
              cursor="pointer"
              bg={item.active ? 'black' : 'transparent'}
              color={item.active ? 'white' : 'gray.700'}
              _hover={{
                bg: item.active ? 'black' : 'gray.50',
                color: item.active ? 'white' : 'black'
              }}
              onClick={() => router.push(item.href)}
              transition="all 0.2s ease"
            >
              <Icon as={item.icon} boxSize={4} />
              <Text fontSize="sm" fontWeight={item.active ? '500' : '400'} flex="1">
                {item.label}
              </Text>
              
              {item.badge && (
                <Badge
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  px={2}
                  py={0}
                  fontSize="xs"
                  fontWeight="600"
                >
                  {item.badge}
                </Badge>
              )}
              
              {!item.active && (
                <Icon as={ChevronRight} boxSize={3} color="gray.400" />
              )}
            </HStack>
          </MotionBox>
          
          {/* Divider between levels */}
          {index < navItems.length - 1 && 
           navItems[index].level !== navItems[index + 1].level && (
            <Divider my={2} />
          )}
        </Box>
      ))}
    </VStack>
  )
}