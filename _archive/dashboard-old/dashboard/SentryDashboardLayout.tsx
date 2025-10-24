/**
 * 🎯 LAYOUT DASHBOARD STYLE SENTRY
 * Layout principal avec sidebar Sentry + main content
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
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge
} from '@chakra-ui/react'
import {
  ChevronRight,
  LogOut,
  User,
  Settings,
  Bell,
  Search,
  Filter
} from 'lucide-react'
import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import SentrySidebar from './SentrySidebar'
import SafeLink from '@/components/common/SafeLink'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner' | 'gym_manager'
  avatar_url?: string
}

interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
}

interface SentryDashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  showFilters?: boolean
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function SentryDashboardLayout({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  showFilters = false
}: SentryDashboardLayoutProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState(3) // Simulé
  
  const router = useRouter()
  const pathname = usePathname()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const headerBg = useColorModeValue('white', 'gray.900')

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const supabase = getSupabaseSingleton()
      
      // Récupérer l'utilisateur authentifié
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        router.push('/auth/login')
        return
      }

      // Récupérer le profil complet
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('Erreur profil:', profileError)
        // Créer un profil par défaut si nécessaire
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || 'Utilisateur',
          role: 'super_admin' // Par défaut pour l'instant
        })
      } else {
        setUser({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || profile.email,
          role: profile.role || 'super_admin',
          avatar_url: profile.avatar_url
        })
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { getSupabaseSingleton } = await import('@/lib/supabase-singleton')
      const supabase = getSupabaseSingleton()
      
      if (supabase?.auth) {
        await supabase.auth.signOut()
      }
      router.push('/auth/login')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      router.push('/auth/login')
    }
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs.length > 0) return breadcrumbs

    // Auto-générer depuis l'URL
    const pathSegments = pathname.split('/').filter(Boolean)
    const autoBreadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ]

    let currentPath = ''
    pathSegments.slice(1).forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathSegments.length - 2
      
      autoBreadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : `/dashboard${currentPath}`,
        isCurrentPage: isLast
      })
    })

    return autoBreadcrumbs
  }

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.500">Chargement du dashboard...</Text>
        </VStack>
      </Flex>
    )
  }

  if (!user) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Alert status="error" maxW="md">
          <AlertIcon />
          Erreur d'authentification. Redirection...
        </Alert>
      </Flex>
    )
  }

  const finalBreadcrumbs = generateBreadcrumbs()

  return (
    <Flex h="100vh" bg={bgColor}>
      
      {/* Sidebar Style Sentry */}
      <SentrySidebar 
        currentPath={pathname}
        userRole={user.role}
        userId={user.id}
      />

      {/* Main Content */}
      <Box flex={1} ml="280px" display="flex" flexDirection="column">
        
        {/* Header */}
        <Box
          bg={headerBg}
          borderBottom="1px"
          borderColor={borderColor}
          px={6}
          py={4}
          position="sticky"
          top={0}
          zIndex={100}
        >
          <Flex justify="space-between" align="center">
            
            {/* Left: Breadcrumbs + Title */}
            <VStack align="start" spacing={2}>
              
              {/* Breadcrumbs */}
              {finalBreadcrumbs.length > 1 && (
                <Breadcrumb
                  spacing="8px"
                  separator={<ChevronRight size={14} color="gray" />}
                  fontSize="sm"
                >
                  {finalBreadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem key={index} isCurrentPage={crumb.isCurrentPage}>
                      {crumb.href ? (
                        <BreadcrumbLink 
                          as={SafeLink}
                          href={crumb.href}
                          color="gray.500" 
                          _hover={{ color: 'blue.500' }}
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <Text color="gray.900" fontWeight="medium">
                          {crumb.label}
                        </Text>
                      )}
                    </BreadcrumbItem>
                  ))}
                </Breadcrumb>
              )}

              {/* Title & Subtitle */}
              {title && (
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                    {title}
                  </Text>
                  {subtitle && (
                    <Text fontSize="md" color="gray.600">
                      {subtitle}
                    </Text>
                  )}
                </VStack>
              )}
            </VStack>

            {/* Right: Actions + User Menu */}
            <HStack spacing={4}>
              
              {/* Filters (si activé) */}
              {showFilters && (
                <HStack spacing={2}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Search size={16} />}
                  >
                    Search
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Filter size={16} />}
                  >
                    Filter
                  </Button>
                </HStack>
              )}

              {/* Actions personnalisées */}
              {actions}

              {/* Notifications */}
              <IconButton
                aria-label="Notifications"
                icon={<Bell size={18} />}
                variant="ghost"
                size="sm"
                position="relative"
              >
                {notifications > 0 && (
                  <Badge
                    colorScheme="red"
                    borderRadius="full"
                    position="absolute"
                    top="-1"
                    right="-1"
                    fontSize="xs"
                    minW="18px"
                    h="18px"
                  >
                    {notifications}
                  </Badge>
                )}
              </IconButton>

              {/* User Menu */}
              <Menu>
                <MenuButton as={Button} variant="ghost" size="sm">
                  <HStack spacing={2}>
                    <Avatar
                      size="sm"
                      name={user.full_name}
                      src={user.avatar_url}
                      bg="blue.500"
                    />
                    <VStack align="start" spacing={0} display={{ base: 'none', md: 'flex' }}>
                      <Text fontSize="sm" fontWeight="medium">
                        {user.full_name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {user.role.replace('_', ' ')}
                      </Text>
                    </VStack>
                  </HStack>
                </MenuButton>
                
                <MenuList>
                  <MenuItem icon={<User size={16} />}>
                    Profil
                  </MenuItem>
                  <MenuItem icon={<Settings size={16} />}>
                    Paramètres
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem 
                    icon={<LogOut size={16} />}
                    onClick={handleLogout}
                    color="red.500"
                  >
                    Déconnexion
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Box>

        {/* Main Content Area */}
        <Box
          flex={1}
          overflow="auto"
          bg={bgColor}
        >
          {children}
        </Box>

      </Box>
    </Flex>
  )
}
