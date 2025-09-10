/**
 * 🏗️ LAYOUT DASHBOARD UNIFIÉ
 * Layout principal pour tous les niveaux du dashboard multi-tenant
 */

'use client'

import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Select,
  Spinner,
  useColorModeValue,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Badge,
  Tooltip
} from '@chakra-ui/react'
import { 
  Home, 
  Building2, 
  Dumbbell, 
  Users, 
  Activity, 
  Settings, 
  LogOut, 
  Menu as MenuIcon,
  ChevronRight,
  Monitor,
  BarChart3,
  Shield,
  Bell
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { UserContext, NavigationContext, userContextManager, DashboardUrlBuilder, PermissionChecker } from '@/lib/user-context'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
  loading?: boolean
}

interface SidebarItem {
  id: string
  label: string
  icon: any
  href?: string
  badge?: string | number
  children?: SidebarItem[]
  permission?: (checker: PermissionChecker) => boolean
}

// ===========================================
// 🧭 NAVIGATION CONFIGURATION
// ===========================================

const getNavigationItems = (
  userContext: UserContext,
  navigationContext: NavigationContext,
  permissions: PermissionChecker
): SidebarItem[] => {
  const items: SidebarItem[] = []

  // Vue d'ensemble (toujours visible)
  items.push({
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: Home,
    href: DashboardUrlBuilder.dashboard()
  })

  // Navigation selon le niveau
  if (navigationContext.level === 'global' && permissions.canAccessGlobalDashboard()) {
    // Super Admin - Vue globale
    items.push(
      {
        id: 'franchises',
        label: 'Franchises',
        icon: Building2,
        href: DashboardUrlBuilder.franchises(),
        badge: navigationContext.availableFranchises.length
      },
      {
        id: 'users',
        label: 'Utilisateurs',
        icon: Users,
        href: '/dashboard/users',
        permission: (checker) => checker.canManageUsers()
      }
    )
  }

  if (navigationContext.level === 'franchise' || userContext.role === 'franchise_owner') {
    // Vue franchise
    items.push({
      id: 'gyms',
      label: 'Salles de sport',
      icon: Dumbbell,
      href: navigationContext.franchiseId 
        ? DashboardUrlBuilder.franchiseGyms(navigationContext.franchiseId)
        : '/dashboard/gyms',
      badge: navigationContext.availableGyms.length
    })
  }

  // Sessions live (contextuelle)
  const sessionsHref = navigationContext.gymId && navigationContext.franchiseId
    ? DashboardUrlBuilder.liveSessions(navigationContext.franchiseId, navigationContext.gymId)
    : navigationContext.franchiseId
    ? DashboardUrlBuilder.liveSessions(navigationContext.franchiseId)
    : DashboardUrlBuilder.liveSessions()

  items.push({
    id: 'sessions',
    label: 'Sessions Live',
    icon: Activity,
    href: sessionsHref
  })

  // Monitoring (selon permissions)
  if (permissions.canAccessGlobalDashboard() || permissions.canManageFranchise(navigationContext.franchiseId || '')) {
    items.push({
      id: 'monitoring',
      label: 'Monitoring',
      icon: Monitor,
      children: [
        {
          id: 'performance',
          label: 'Performance',
          icon: BarChart3,
          href: '/dashboard/monitoring/performance'
        },
        {
          id: 'errors',
          label: 'Erreurs',
          icon: Shield,
          href: '/dashboard/monitoring/errors'
        }
      ]
    })
  }

  // Paramètres (toujours en bas)
  items.push({
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    href: DashboardUrlBuilder.settings(navigationContext.level)
  })

  return items
}

// ===========================================
// 🍞 BREADCRUMBS COMPONENT
// ===========================================

interface DashboardBreadcrumbsProps {
  userContext: UserContext
  navigationContext: NavigationContext
}

function DashboardBreadcrumbs({ userContext, navigationContext }: DashboardBreadcrumbsProps) {
  const breadcrumbs = []

  // Toujours commencer par Dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    href: DashboardUrlBuilder.dashboard(),
    isCurrentPage: navigationContext.level === 'global'
  })

  // Ajouter franchise si applicable
  if (navigationContext.franchiseId && navigationContext.franchiseName) {
    breadcrumbs.push({
      label: navigationContext.franchiseName,
      href: DashboardUrlBuilder.franchise(navigationContext.franchiseId),
      isCurrentPage: navigationContext.level === 'franchise'
    })
  }

  // Ajouter gym si applicable
  if (navigationContext.gymId && navigationContext.gymName) {
    breadcrumbs.push({
      label: navigationContext.gymName,
      href: navigationContext.franchiseId 
        ? DashboardUrlBuilder.gym(navigationContext.franchiseId, navigationContext.gymId)
        : DashboardUrlBuilder.gymDirect(navigationContext.gymId),
      isCurrentPage: navigationContext.level === 'gym'
    })
  }

  return (
    <Breadcrumb spacing="8px" separator={<ChevronRight size={16} color="gray.400" />}>
      {breadcrumbs.map((crumb, index) => (
        <BreadcrumbItem key={index} isCurrentPage={crumb.isCurrentPage}>
          <BreadcrumbLink 
            as={Link} 
            href={crumb.href}
            color={crumb.isCurrentPage ? 'gray.800' : 'gray.500'}
            fontWeight={crumb.isCurrentPage ? 'semibold' : 'normal'}
          >
            {crumb.label}
          </BreadcrumbLink>
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  )
}

// ===========================================
// 🎛️ CONTEXT SWITCHER
// ===========================================

interface ContextSwitcherProps {
  userContext: UserContext
  navigationContext: NavigationContext
  onContextChange: (franchiseId?: string, gymId?: string) => void
}

function ContextSwitcher({ userContext, navigationContext, onContextChange }: ContextSwitcherProps) {
  const router = useRouter()

  if (userContext.role === 'gym_manager' || navigationContext.availableFranchises.length <= 1) {
    return null // Pas besoin de switcher
  }

  const handleFranchiseChange = (franchiseId: string) => {
    if (franchiseId === 'global') {
      router.push(DashboardUrlBuilder.dashboard())
    } else {
      router.push(DashboardUrlBuilder.franchise(franchiseId))
    }
  }

  const handleGymChange = (gymId: string) => {
    const gym = navigationContext.availableGyms.find(g => g.id === gymId)
    if (gym && navigationContext.franchiseId) {
      router.push(DashboardUrlBuilder.gym(navigationContext.franchiseId, gymId))
    }
  }

  return (
    <HStack spacing={3}>
      {/* Sélecteur de franchise */}
      {userContext.role === 'super_admin' && (
        <Select
          size="sm"
          value={navigationContext.franchiseId || 'global'}
          onChange={(e) => handleFranchiseChange(e.target.value)}
          maxW="200px"
        >
          <option value="global">🌍 Vue globale</option>
          {navigationContext.availableFranchises.map(franchise => (
            <option key={franchise.id} value={franchise.id}>
              🏢 {franchise.name}
            </option>
          ))}
        </Select>
      )}

      {/* Sélecteur de gym */}
      {navigationContext.availableGyms.length > 1 && (
        <Select
          size="sm"
          value={navigationContext.gymId || ''}
          onChange={(e) => handleGymChange(e.target.value)}
          maxW="200px"
          placeholder="Sélectionner une salle"
        >
          {navigationContext.availableGyms.map(gym => (
            <option key={gym.id} value={gym.id}>
              🏋️ {gym.name}
            </option>
          ))}
        </Select>
      )}
    </HStack>
  )
}

// ===========================================
// 📱 SIDEBAR COMPONENT
// ===========================================

interface SidebarProps {
  userContext: UserContext
  navigationContext: NavigationContext
  permissions: PermissionChecker
  isOpen?: boolean
  onClose?: () => void
}

function Sidebar({ userContext, navigationContext, permissions, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const navigationItems = getNavigationItems(userContext, navigationContext, permissions)

  const handleLogout = async () => {
    try {
      const { getSupabaseSingleton } = await import('@/lib/supabase-singleton')
      const supabase = getSupabaseSingleton()
      await supabase.auth.signOut()
      userContextManager.clearContext()
      router.push('/auth/setup')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  const SidebarContent = (
    <VStack h="100%" spacing={0} align="stretch">
      {/* Header */}
      <Box p={6} borderBottom="1px" borderColor={borderColor}>
        <VStack spacing={3} align="start">
          <Text fontSize="xl" fontWeight="bold" color="black">
            JARVIS Dashboard
          </Text>
          <HStack>
            <Avatar size="sm" name={userContext.full_name} />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {userContext.full_name}
              </Text>
              <Badge colorScheme="blue" size="sm">
                {userContext.role.replace('_', ' ')}
              </Badge>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {/* Navigation */}
      <VStack flex={1} spacing={1} p={4} align="stretch">
        {navigationItems.map(item => {
          // Vérifier les permissions
          if (item.permission && !item.permission(permissions)) {
            return null
          }

          const isActive = item.href === pathname
          
          return (
            <Box key={item.id}>
              <Button
                as={item.href ? Link : 'button'}
                href={item.href}
                variant={isActive ? 'solid' : 'ghost'}
                colorScheme={isActive ? 'blue' : 'gray'}
                justifyContent="start"
                leftIcon={<item.icon size={18} />}
                rightIcon={item.badge ? (
                  <Badge colorScheme="red" borderRadius="full" minW="20px" h="20px">
                    {item.badge}
                  </Badge>
                ) : undefined}
                w="100%"
                h="40px"
                fontSize="sm"
              >
                {item.label}
              </Button>
              
              {/* Sous-menu si applicable */}
              {item.children && (
                <VStack spacing={1} mt={2} ml={4} align="stretch">
                  {item.children.map(child => (
                    <Button
                      key={child.id}
                      as={Link}
                      href={child.href || '#'}
                      variant="ghost"
                      size="sm"
                      justifyContent="start"
                      leftIcon={<child.icon size={16} />}
                      color="gray.600"
                      _hover={{ color: 'gray.800', bg: 'gray.100' }}
                    >
                      {child.label}
                    </Button>
                  ))}
                </VStack>
              )}
            </Box>
          )
        })}
      </VStack>

      {/* Footer */}
      <Box p={4} borderTop="1px" borderColor={borderColor}>
        <Button
          variant="ghost"
          leftIcon={<LogOut size={18} />}
          onClick={handleLogout}
          w="100%"
          justifyContent="start"
          color="red.500"
          _hover={{ bg: 'red.50' }}
        >
          Déconnexion
        </Button>
      </Box>
    </VStack>
  )

  // Version mobile (Drawer)
  if (isOpen !== undefined) {
    return (
      <Drawer isOpen={isOpen} placement="left" onClose={onClose || (() => {})}>
        <DrawerOverlay />
        <DrawerContent maxW="280px">
          <DrawerCloseButton />
          {SidebarContent}
        </DrawerContent>
      </Drawer>
    )
  }

  // Version desktop
  return (
    <Box
      w="280px"
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      position="fixed"
      left={0}
      top={0}
      zIndex={1000}
    >
      {SidebarContent}
    </Box>
  )
}

// ===========================================
// 🏗️ MAIN LAYOUT COMPONENT
// ===========================================

export default function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  actions, 
  loading = false 
}: DashboardLayoutProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<PermissionChecker | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const router = useRouter()
  const pathname = usePathname()

  // Charger le contexte utilisateur
  useEffect(() => {
    loadUserContext()
  }, [])

  // Recharger le contexte de navigation quand l'URL change
  useEffect(() => {
    if (userContext) {
      loadNavigationContext()
    }
  }, [pathname, userContext])

  const loadUserContext = async () => {
    try {
      const context = await userContextManager.loadUserContext()
      if (!context) {
        router.push('/auth/setup')
        return
      }

      setUserContext(context)
      setPermissions(new PermissionChecker(context))
    } catch (error) {
      console.error('Erreur chargement contexte:', error)
      router.push('/auth/setup')
    }
  }

  const loadNavigationContext = async () => {
    if (!userContext) return

    try {
      // Extraire franchiseId et gymId de l'URL
      const pathParts = pathname.split('/')
      let franchiseId: string | undefined
      let gymId: string | undefined

      const franchiseIndex = pathParts.indexOf('franchises')
      if (franchiseIndex !== -1 && pathParts[franchiseIndex + 1]) {
        franchiseId = pathParts[franchiseIndex + 1]
      }

      const gymIndex = pathParts.indexOf('gyms')
      if (gymIndex !== -1 && pathParts[gymIndex + 1]) {
        gymId = pathParts[gymIndex + 1]
      }

      const navContext = await userContextManager.loadNavigationContext(franchiseId, gymId)
      setNavigationContext(navContext)
    } catch (error) {
      console.error('Erreur chargement navigation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state - éviter l'hydratation mismatch
  if (isLoading) {
    return (
      <Flex h="100vh" align="center" justify="center" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Chargement du dashboard...</Text>
        </VStack>
      </Flex>
    )
  }

  // Si pas de contexte, rediriger vers auth
  if (!userContext || !navigationContext || !permissions) {
    if (typeof window !== 'undefined') {
      router.push('/auth/setup')
    }
    return (
      <Flex h="100vh" align="center" justify="center" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Redirection...</Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <Flex h="100vh" bg="gray.50">
      {/* Sidebar Desktop */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <Sidebar 
          userContext={userContext}
          navigationContext={navigationContext}
          permissions={permissions}
        />
      </Box>

      {/* Sidebar Mobile */}
      <Sidebar 
        userContext={userContext}
        navigationContext={navigationContext}
        permissions={permissions}
        isOpen={isOpen}
        onClose={onClose}
      />

      {/* Main Content */}
      <Box flex={1} ml={{ base: 0, lg: '280px' }}>
        {/* Header */}
        <Box
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          px={6}
          py={4}
        >
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              {/* Menu mobile */}
              <IconButton
                aria-label="Menu"
                icon={<MenuIcon />}
                variant="ghost"
                display={{ base: 'flex', lg: 'none' }}
                onClick={onOpen}
              />

              {/* Breadcrumbs */}
              <DashboardBreadcrumbs 
                userContext={userContext}
                navigationContext={navigationContext}
              />
            </HStack>

            {/* Context Switcher */}
            <ContextSwitcher
              userContext={userContext}
              navigationContext={navigationContext}
              onContextChange={loadNavigationContext}
            />
          </Flex>

          {/* Title & Actions */}
          {(title || actions) && (
            <Flex justify="space-between" align="center" mt={4}>
              <VStack align="start" spacing={1}>
                {title && (
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text color="gray.600" fontSize="sm">
                    {subtitle}
                  </Text>
                )}
              </VStack>
              {actions && <Box>{actions}</Box>}
            </Flex>
          )}
        </Box>

        {/* Page Content */}
        <Box flex={1} overflow="auto" p={6}>
          {loading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : (
            children
          )}
        </Box>
      </Box>
    </Flex>
  )
}
