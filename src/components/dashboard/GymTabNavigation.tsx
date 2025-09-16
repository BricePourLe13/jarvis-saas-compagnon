/**
 * 🏢 NAVIGATION ONGLETS DASHBOARD SALLE - NIVEAU ENTREPRISE
 * Navigation modulaire professionnelle avec drill-down cohérent
 */

'use client'

import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Text,
  Badge,
  Icon,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider
} from '@chakra-ui/react'
import {
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SafeLink from '@/components/common/SafeLink'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface TabConfig {
  id: string
  label: string
  icon: any
  badge?: number
  badgeColor?: string
  description: string
}

interface GymTabNavigationProps {
  gymId: string
  franchiseId: string
  gymName: string
  franchiseName: string
  children: React.ReactNode
  defaultTab?: string
}

// ===========================================
// 🎨 CONFIGURATION ONGLETS
// ===========================================

const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'Vue d\'ensemble et KPI essentiels'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Activity,
    badge: 2, // Sessions live
    badgeColor: 'green',
    description: 'Kiosk status et sessions temps réel'
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    badge: 3, // Membres à risque
    badgeColor: 'orange',
    description: 'Gestion adhérents et segments'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    description: 'Business intelligence et tendances'
  }
]

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function GymTabNavigation({
  gymId,
  franchiseId,
  gymName,
  franchiseName,
  children,
  defaultTab = 'overview'
}: GymTabNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(defaultTab)

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Synchroniser avec URL
  useEffect(() => {
    const tab = searchParams.get('tab') || defaultTab
    setActiveTab(tab)
  }, [searchParams, defaultTab])

  const handleTabChange = (index: number) => {
    const tabId = TAB_CONFIGS[index].id
    setActiveTab(tabId)
    
    // Mettre à jour l'URL sans recharger la page
    const newUrl = `/dashboard/franchises/${franchiseId}/gyms/${gymId}/sentry?tab=${tabId}`
    router.push(newUrl, { scroll: false })
  }

  const getTabIndex = () => {
    return TAB_CONFIGS.findIndex(tab => tab.id === activeTab)
  }

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Header avec Breadcrumbs */}
      <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={6} py={4}>
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRight size={14} color="gray" />}
          fontSize="sm"
          mb={3}
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={SafeLink} href="/dashboard" color="gray.500">
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={SafeLink} href="/dashboard/franchises" color="gray.500">
              Franchises
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink 
              as={SafeLink} 
              href={`/dashboard/franchises/${franchiseId}/sentry`} 
              color="gray.500"
            >
              {franchiseName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text color="gray.900" fontWeight="medium">
              {gymName}
            </Text>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Titre Principal */}
        <HStack justify="space-between" align="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900">
              {gymName}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Centre de commandement • {franchiseName}
            </Text>
          </Box>
          
          {/* Actions Globales */}
          <HStack spacing={3}>
            <Badge colorScheme="green" variant="solid">
              🟢 Kiosk Online
            </Badge>
            <Badge colorScheme="blue" variant="outline">
              v2.1.3
            </Badge>
          </HStack>
        </HStack>
      </Box>

      {/* Navigation par Onglets */}
      <Tabs 
        index={getTabIndex()} 
        onChange={handleTabChange}
        variant="enclosed"
        colorScheme="blue"
      >
        <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={6}>
          <TabList border="none">
            {TAB_CONFIGS.map((tab, index) => (
              <Tab
                key={tab.id}
                _selected={{
                  color: 'blue.600',
                  borderColor: 'blue.500',
                  borderBottomColor: bgColor,
                  bg: bgColor
                }}
                _hover={{
                  color: 'blue.500'
                }}
                px={6}
                py={4}
              >
                <HStack spacing={3}>
                  <Icon as={tab.icon} size={18} />
                  <Text fontWeight="medium">{tab.label}</Text>
                  {tab.badge && (
                    <Badge 
                      colorScheme={tab.badgeColor || 'gray'} 
                      variant="solid" 
                      size="sm"
                      borderRadius="full"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </HStack>
              </Tab>
            ))}
          </TabList>
        </Box>

        {/* Contenu des Onglets */}
        <TabPanels>
          {TAB_CONFIGS.map((tab) => (
            <TabPanel key={tab.id} p={0}>
              {/* Description de l'onglet */}
              <Box bg="gray.50" px={6} py={3} borderBottom="1px" borderColor={borderColor}>
                <Text fontSize="sm" color="gray.600">
                  {tab.description}
                </Text>
              </Box>
              
              {/* Contenu dynamique */}
              <Box p={6}>
                {children}
              </Box>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  )
}

// ===========================================
// 🎯 HOOKS UTILITAIRES
// ===========================================

export function useActiveTab() {
  const searchParams = useSearchParams()
  return searchParams.get('tab') || 'overview'
}

export function useTabNavigation(gymId: string, franchiseId: string) {
  const router = useRouter()
  
  const navigateToTab = (tabId: string) => {
    const newUrl = `/dashboard/franchises/${franchiseId}/gyms/${gymId}/sentry?tab=${tabId}`
    router.push(newUrl, { scroll: false })
  }

  return { navigateToTab }
}

