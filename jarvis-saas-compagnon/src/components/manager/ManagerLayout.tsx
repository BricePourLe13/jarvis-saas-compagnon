'use client'

import { useState } from 'react'
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  useColorModeValue,
  Collapse,
  Badge,
  Avatar,
  Divider,
  IconButton
} from '@chakra-ui/react'
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  MessageCircle, 
  Settings, 
  ChevronLeft,
  Bell,
  Search
} from 'lucide-react'

type ManagerLayoutProps = {
  children: React.ReactNode
  currentPage?: string
  gymName?: string
  onlineStatus?: boolean
}

type NavItem = {
  label: string
  icon: any
  href?: string
  badge?: string | number
  active?: boolean
  disabled?: boolean
}

export default function ManagerLayout({ 
  children, 
  currentPage = 'Vue d\'ensemble',
  gymName = 'AREA',
  onlineStatus = true
}: ManagerLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const bgColor = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const sidebarBg = useColorModeValue('gray.50', 'gray.800')
  const activeBg = useColorModeValue('blue.50', 'blue.900')
  const activeColor = useColorModeValue('blue.600', 'blue.300')

  const navItems: NavItem[] = [
    {
      label: 'Vue d\'ensemble',
      icon: LayoutDashboard,
      active: currentPage === 'Vue d\'ensemble'
    },
    {
      label: 'Fiches Membres',
      icon: Users,
      badge: '12',
      disabled: true
    },
    {
      label: 'Actions du Jour',
      icon: Target,
      badge: 3
    },
    {
      label: 'Missions JARVIS',
      icon: MessageCircle,
      disabled: true
    },
    {
      label: 'Paramètres',
      icon: Settings
    }
  ]

  return (
    <Box 
      minH="100vh" 
      bg="gray.50"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      <Flex>
        {/* Sidebar */}
        <Box
          w={sidebarCollapsed ? '70px' : '280px'}
          minH="100vh"
          bg="white"
          borderRight="1px solid"
          borderColor="gray.200"
          p={6}
          position="fixed"
          left={0}
          top={0}
          zIndex={10}
          transition="all 0.2s ease"
        >
          <VStack spacing={8} align="stretch" h="full">
            {/* Logo */}
            <Box>
              <Text fontSize="xl" fontWeight="600" color="black">
                {!sidebarCollapsed ? 'JARVIS Manager' : 'JM'}
              </Text>
              {!sidebarCollapsed && (
                <HStack spacing={2} mt={1}>
                  <Text fontSize="sm" color="gray.500">
                    {gymName}
                  </Text>
                  <Badge 
                    size="sm" 
                    colorScheme={onlineStatus ? 'green' : 'red'}
                    variant="subtle"
                  >
                    {onlineStatus ? 'EN LIGNE' : 'HORS LIGNE'}
                  </Badge>
                </HStack>
              )}
            </Box>
            
            <Divider />
            
            <IconButton
              aria-label="Toggle sidebar"
              icon={<Icon as={ChevronLeft} transform={sidebarCollapsed ? 'rotate(180deg)' : 'none'} />}
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              transition="transform 0.2s ease"
              alignSelf={sidebarCollapsed ? 'center' : 'flex-end'}
            />

            {/* Navigation */}
            <VStack spacing={1} align="stretch">
              {navItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  justifyContent={sidebarCollapsed ? 'center' : 'flex-start'}
                  h="48px"
                  bg={item.active ? 'gray.100' : 'transparent'}
                  color={item.active ? 'black' : 'gray.600'}
                  _hover={{
                    bg: item.active ? 'gray.100' : 'gray.50'
                  }}
                  leftIcon={
                    <Icon 
                      as={item.icon} 
                      w={5} 
                      h={5}
                      color={item.active ? 'black' : 'gray.500'}
                    />
                  }
                  fontWeight={item.active ? '600' : '500'}
                  borderRadius="8px"
                  transition="all 0.2s ease"
                  isDisabled={item.disabled}
                  opacity={item.disabled ? 0.5 : 1}
                  onClick={() => {
                    if (!item.disabled) {
                      if (item.label === "Fiches Membres") {
                        window.location.href = '/dashboard/members'
                      } else if (item.label === "Vue d'ensemble") {
                        window.location.href = '/dashboard'
                      }
                      // Autres routes à ajouter plus tard
                    }
                  }}
                >
                  {!sidebarCollapsed && (
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm">{item.label}</Text>
                      {item.badge && (
                        <Badge 
                          size="sm" 
                          colorScheme={item.active ? 'blue' : 'gray'}
                          variant="subtle"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </HStack>
                  )}
                </Button>
              ))}
            </VStack>

            {/* User Profile (Bottom) */}
            {!sidebarCollapsed && (
              <Box position="absolute" bottom={4} left={0} right={0} px={6}>
                <Divider mb={3} />
                <HStack spacing={3} p={3} bg="gray.50" borderRadius="12px">
                  <Avatar size="sm" name="Manager" bg="blue.500" />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight="500" color="black">
                      Gérant
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {gymName}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Main Content */}
        <Box flex={1} ml={sidebarCollapsed ? '70px' : '280px'} transition="margin-left 0.2s ease">
          {/* Top Header */}
          <Box
            h="70px"
            bg="white"
            borderBottom="1px solid"
            borderColor="gray.200"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={6}
            position="sticky"
            top={0}
            zIndex={5}
          >
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="600" color="black">
                {currentPage}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Gérez votre salle en temps réel
              </Text>
            </VStack>

            <HStack spacing={3}>
              <IconButton
                aria-label="Search"
                icon={<Icon as={Search} />}
                variant="ghost"
                size="sm"
                color="gray.500"
              />
              <IconButton
                aria-label="Notifications"
                icon={<Icon as={Bell} />}
                variant="ghost"
                size="sm"
                color="gray.500"
              />
              <Badge colorScheme={onlineStatus ? 'green' : 'red'} variant="outline" px={2} py={1}>
                {onlineStatus ? 'Tout fonctionne' : 'Problème détecté'}
              </Badge>
            </HStack>
          </Box>

          {/* Content Area */}
          <Box bg="gray.50" minH="calc(100vh - 70px)">
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}
