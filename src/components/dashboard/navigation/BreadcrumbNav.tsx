/**
 * 🍞 BREADCRUMB NAVIGATION - CONTEXTE PROFESSIONNEL
 * Navigation contextuelle avec actions rapides
 */

'use client'

import {
  Box,
  HStack,
  Text,
  Button,
  ButtonGroup,
  Badge,
  useColorModeValue,
  Icon
} from '@chakra-ui/react'
import {
  Plus,
  RefreshCw,
  Download,
  Settings,
  Monitor,
  Bell
} from 'lucide-react'

interface BreadcrumbNavProps {
  path: string[]
}

export default function BreadcrumbNav({ path }: BreadcrumbNavProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  const getPageTitle = (path: string[]) => {
    const lastPath = path[path.length - 1]
    switch (lastPath) {
      case 'overview': return 'Centre de Commandement'
      case 'operations': return 'Operations & Monitoring'
      case 'members': return 'Gestion Adhérents'
      case 'analytics': return 'Analytics & Insights'
      default: return 'Dashboard'
    }
  }

  const getPageSubtitle = (path: string[]) => {
    const lastPath = path[path.length - 1]
    switch (lastPath) {
      case 'overview': return 'Vue d\'ensemble temps réel'
      case 'operations': return 'Kiosk, sessions live, incidents'
      case 'members': return 'Profils, segments, recommandations IA'
      case 'analytics': return 'Métriques business et tendances'
      default: return 'Supervision complète'
    }
  }

  const getQuickActions = (path: string[]) => {
    const lastPath = path[path.length - 1]
    
    const commonActions = [
      { icon: RefreshCw, label: 'Refresh', variant: 'ghost' as const },
      { icon: Bell, label: 'Alerts', variant: 'ghost' as const, badge: '3' }
    ]

    switch (lastPath) {
      case 'overview':
        return [
          { icon: Plus, label: 'Nouvelle Mission', variant: 'solid' as const, colorScheme: 'blue' },
          { icon: Monitor, label: 'Kiosk Live', variant: 'outline' as const },
          ...commonActions
        ]
      case 'operations':
        return [
          { icon: Settings, label: 'Config Kiosk', variant: 'outline' as const },
          { icon: Download, label: 'Export Logs', variant: 'ghost' as const },
          ...commonActions
        ]
      case 'members':
        return [
          { icon: Plus, label: 'Ajouter Membre', variant: 'solid' as const, colorScheme: 'blue' },
          { icon: Download, label: 'Export CSV', variant: 'ghost' as const },
          ...commonActions
        ]
      case 'analytics':
        return [
          { icon: Download, label: 'Export Report', variant: 'outline' as const },
          ...commonActions
        ]
      default:
        return commonActions
    }
  }

  return (
    <Box
      bg={bgColor}
      borderBottom="1px solid"
      borderColor={borderColor}
      px={6}
      py={4}
    >
      <HStack justify="space-between" align="center">
        {/* Titre et Sous-titre */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" color="gray.900">
            {getPageTitle(path)}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {getPageSubtitle(path)}
          </Text>
        </Box>

        {/* Actions Rapides */}
        <ButtonGroup size="sm" spacing={2}>
          {getQuickActions(path).map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              colorScheme={action.colorScheme}
              leftIcon={<Icon as={action.icon} size={14} />}
              rightIcon={
                action.badge ? (
                  <Badge colorScheme="red" size="xs" borderRadius="full">
                    {action.badge}
                  </Badge>
                ) : undefined
              }
            >
              {action.label}
            </Button>
          ))}
        </ButtonGroup>
      </HStack>
    </Box>
  )
}



