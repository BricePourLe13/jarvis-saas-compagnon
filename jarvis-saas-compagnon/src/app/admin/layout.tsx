'use client'

import { 
  Box, 
  Flex, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Icon, 
  Badge,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Plus,
  ArrowLeft,
  Zap,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react'
import { createBrowserClientWithConfig } from '@/lib/supabase-admin'

const MotionBox = motion(Box)
const MotionButton = motion(Button)
const MotionVStack = motion(VStack)

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  icon: any
  href?: string
  onClick?: () => void
  badge?: string
  children?: NavItem[]
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        setUser(profile)
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      await supabase.auth.signOut()
      
      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt !',
        status: 'success',
        duration: 2000,
      })
      
      router.push('/')
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de se déconnecter',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const navItems: NavItem[] = [
    {
      label: 'Vue d\'ensemble',
      icon: LayoutDashboard,
      href: '/admin',
    },
    {
      label: 'Franchises',
      icon: Building2,
      children: [
        {
          label: 'Toutes les franchises',
          icon: Building2,
          href: '/admin/franchises',
        },
        {
          label: 'Nouvelle franchise',
          icon: Plus,
          href: '/admin/franchises/create',
        }
      ]
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      badge: 'Bientôt'
    },
    {
      label: 'Utilisateurs',
      icon: Users,
      href: '/admin/users',
      badge: 'Bientôt'
    },
    {
      label: 'Paramètres',
      icon: Settings,
      href: '/admin/settings',
      badge: 'Bientôt'
    }
  ]

  const isActivePath = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = item.href ? isActivePath(item.href) : false
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
      return (
        <VStack key={item.label} spacing={2} align="stretch" w="full">
          <Text
            fontSize="xs"
            fontWeight="600"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="0.5px"
            px={4}
            py={2}
            fontFamily="system-ui"
          >
            {item.label}
          </Text>
          <VStack spacing={1} align="stretch">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </VStack>
        </VStack>
      )
    }

    return (
      <MotionButton
        key={item.label}
        variant="ghost"
        justifyContent="flex-start"
        leftIcon={<Icon as={item.icon} boxSize={4} />}
        size="sm"
        w="full"
        px={4}
        py={3}
        h="auto"
        fontWeight={isActive ? '500' : '400'}
        bg={isActive ? 'black' : 'transparent'}
        color={isActive ? 'white' : 'gray.700'}
        fontSize="sm"
        borderRadius="2px"
        fontFamily="system-ui"
        _hover={{
          bg: isActive ? 'gray.900' : 'gray.50',
          color: isActive ? 'white' : 'black',
          transition: "all 0.15s ease"
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition="all 0.15s ease"
        onClick={() => {
          if (item.href) {
            router.push(item.href)
          } else if (item.onClick) {
            item.onClick()
          }
        }}
        isDisabled={!!item.badge}
        ml={level > 0 ? 4 : 0}
      >
        <HStack justify="space-between" w="full">
          <Text>{item.label}</Text>
          {item.badge && (
            <Badge 
              bg="gray.100" 
              color="gray.600" 
              size="sm" 
              borderRadius="2px" 
              fontSize="xs"
              fontWeight="400"
              px={2}
              py={1}
            >
              {item.badge}
            </Badge>
          )}
        </HStack>
      </MotionButton>
    )
  }

  // Animations
  const sidebarVariants = {
    hidden: { x: -280 },
    show: { 
      x: 0,
      transition: { 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1] 
      }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: { 
        duration: 0.5, 
        delay: 0.2 
      }
    }
  }

  return (
    <Flex direction="column" minH="100vh" bg="white" fontFamily="system-ui, -apple-system, sans-serif">
      {/* Header avec menu utilisateur */}
      <Box
        borderBottom="1px solid"
        borderColor="gray.100"
        bg="white"
        px={6}
        py={4}
        zIndex={10}
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <Text 
              fontSize="xl" 
              fontWeight="600" 
              color="black"
              letterSpacing="-0.5px"
            >
              JARVIS Admin
            </Text>
          </HStack>

          {!loading && user && (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                rightIcon={<Icon as={ChevronDown} boxSize={4} />}
                _hover={{ bg: 'gray.50' }}
                _active={{ bg: 'gray.100' }}
              >
                <HStack spacing={3}>
                  <Avatar 
                    size="sm" 
                    name={user.full_name} 
                    bg="blue.500"
                    color="white"
                  />
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" fontWeight="500" color="black">
                      {user.full_name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </Text>
                  </VStack>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem 
                  icon={<Icon as={User} />}
                  onClick={() => router.push('/admin/profile')}
                >
                  Mon profil
                </MenuItem>
                <MenuItem 
                  icon={<Icon as={Settings} />}
                  onClick={() => router.push('/admin/settings')}
                >
                  Paramètres
                </MenuItem>
                <MenuDivider />
                <MenuItem 
                  icon={<Icon as={LogOut} />}
                  onClick={handleLogout}
                  color="red.500"
                >
                  Se déconnecter
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Box>

      <Flex flex="1">
        {/* Sidebar épurée */}
      <MotionBox
        w="280px"
        bg="white"
        borderRight="1px solid"
        borderColor="gray.200"
        variants={sidebarVariants}
        initial="hidden"
        animate="show"
        position="relative"
      >
        {/* Pattern de points subtil */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={0.015}
          bgImage="radial-gradient(circle, black 1px, transparent 1px)"
          bgSize="20px 20px"
          pointerEvents="none"
        />

        <MotionVStack 
          spacing={0} 
          align="stretch" 
          h="full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {/* Header épuré */}
          <Box p={6} borderBottom="1px solid" borderColor="gray.100">
            <VStack spacing={4} align="start">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft size={16} />}
                onClick={() => router.push('/dashboard')}
                color="gray.600"
                fontSize="sm"
                fontWeight="400"
                px={3}
                py={2}
                h="auto"
                borderRadius="2px"
                _hover={{ 
                  color: 'black', 
                  bg: 'gray.50',
                  transition: "all 0.15s ease"
                }}
              >
                Dashboard
              </Button>
              
              <VStack spacing={1} align="start">
                <Text 
                  fontSize="lg" 
                  fontWeight="500" 
                  color="black"
                  letterSpacing="-0.25px"
                >
                  Administration
                </Text>
                <Text 
                  fontSize="xs" 
                  color="gray.500"
                  fontWeight="400"
                >
                  Gestion JARVIS
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Navigation épurée */}
          <VStack spacing={3} align="stretch" p={4} flex="1">
            {navItems.map(item => renderNavItem(item))}
          </VStack>

          {/* Footer minimaliste */}
          <Box p={4} borderTop="1px solid" borderColor="gray.100">
            <HStack spacing={2} justify="center">
              <Box
                w={1.5}
                h={1.5}
                bg="gray.400"
                borderRadius="50%"
              />
              <Text fontSize="xs" color="gray.500" fontWeight="400">
                JARVIS v2.0
              </Text>
            </HStack>
          </Box>
        </MotionVStack>
      </MotionBox>

      {/* Contenu principal */}
      <MotionBox
        flex="1"
        variants={contentVariants}
        initial="hidden"
        animate="show"
        position="relative"
        bg="white"
      >
        {children}
      </MotionBox>
      </Flex>
    </Flex>
  )
} 