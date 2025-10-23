"use client"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Button,
  Badge,
  Flex,
  Spinner,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  Tooltip
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Wifi,
  WifiOff,
  DollarSign,
  Clock,
  Monitor,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDurationFromMinutes } from '@/lib/format-time'
import { createBrowserClientWithConfig } from '../../../lib/supabase-admin'
import { MetricsGrid, MetricCard } from '../../../components/admin/monitoring/MetricsGrid'
import { MonitoringTable, TableColumn } from '../../../components/admin/monitoring/MonitoringTable'
import { LevelBreadcrumb } from '../../../components/admin/navigation/LevelBreadcrumb'
import { useMonitoringData } from '../../../hooks/useMonitoringData'

const MotionBox = motion(Box)

interface SessionData {
  id: string
  gym_id: string
  gym_name: string
  franchise_name: string
  session_start: string
  session_end?: string
  cost_usd: number
  status: 'active' | 'completed' | 'error'
  duration_minutes?: number
}

interface KioskStatus {
  gym_id: string
  gym_name: string
  franchise_name: string
  kiosk_url: string
  status: 'online' | 'offline' | 'error'
  last_ping?: string
  active_sessions: number
  daily_sessions: number
  daily_cost: number
}

export default function MonitoringPage() {
  const router = useRouter()
  const toast = useToast()

  // Utiliser le nouveau hook de monitoring
  const { 
    monitoring, 
    sessions, 
    kiosks, 
    loading, 
    error, 
    refresh 
  } = useMonitoringData({
    level: 'global',
    autoRefresh: true,
    refreshInterval: 30000
  })

  const [refreshing, setRefreshing] = useState(false)

  const refreshData = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  // Gestion des erreurs
  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }, [error, toast])

  // Configuration des métriques
  const metricsCards: MetricCard[] = [
    {
      label: 'Sessions actives',
      value: monitoring.activeSessions,
      icon: Activity,
      color: 'blue'
    },
    {
      label: 'Kiosks en ligne',
      value: `${monitoring.onlineKiosks}/${monitoring.totalKiosks}`,
      icon: Wifi,
      color: monitoring.onlineKiosks < monitoring.totalKiosks ? 'red' : 'green',
      highlight: monitoring.onlineKiosks < monitoring.totalKiosks
    },
    {
      label: 'Coûts aujourd\'hui',
      value: `$${monitoring.todayCosts}`,
      icon: DollarSign,
      color: 'purple'
    },
    {
      label: 'Sessions aujourd\'hui',
      value: monitoring.totalSessions,
      icon: Users,
      color: 'orange'
    }
  ]

  // Configuration des colonnes pour le tableau des kiosks
  const kioskColumns: TableColumn[] = [
    { key: 'gym_name', label: 'Salle', width: '25%' },
    { key: 'franchise_name', label: 'Franchise', width: '20%' },
    { key: 'status', label: 'Statut', width: '15%' },
    { key: 'active_sessions', label: 'Sessions actives', width: '15%' },
    { key: 'daily_sessions', label: 'Sessions jour', width: '15%' },
    { key: 'daily_cost', label: 'Coûts jour', width: '10%' }
  ]

  // Configuration des colonnes pour le tableau des sessions
  const sessionColumns: TableColumn[] = [
    { key: 'id', label: 'Session ID', width: '15%' },
    { key: 'gym_name', label: 'Salle', width: '25%' },
    { key: 'session_start', label: 'Début', width: '20%' },
    { key: 'duration_minutes', label: 'Durée', width: '15%', 
      render: (value) => value ? formatDurationFromMinutes(value) : <Badge colorScheme="blue" variant="subtle">En cours</Badge>
    },
    { key: 'status', label: 'Statut', width: '15%' },
    { key: 'cost_usd', label: 'Coût', width: '10%' }
  ]

  // Breadcrumb pour la navigation
  const breadcrumbLevels = [
    {
      level: 'global' as const,
      name: 'Dashboard Global',
      href: '/dashboard'
    }
  ]

  if (loading) {
    return (
      <Box 
        minH="100vh" 
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <VStack spacing={4}>
          <Spinner size="lg" color="gray.600" />
          <Text color="gray.600" fontSize="sm" fontWeight="400">
            Chargement du monitoring...
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #eeeeee 100%)"
      fontFamily="system-ui, -apple-system, sans-serif"
      p={8}
    >
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header avec Breadcrumb */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={4} align="stretch">
              <LevelBreadcrumb 
                levels={breadcrumbLevels}
                currentPage="Monitoring Temps Réel"
              />
              
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Heading 
                    size="lg" 
                    color="black"
                    fontWeight="500"
                    letterSpacing="-0.5px"
                  >
                    Monitoring Temps Réel Global
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Supervision de toutes les franchises et kiosks JARVIS
                  </Text>
                </VStack>
                
                <Button
                  leftIcon={<RefreshCw />}
                  onClick={refreshData}
                  isLoading={refreshing}
                  loadingText="Actualisation..."
                  colorScheme="gray"
                  variant="outline"
                  size="sm"
                >
                  Actualiser
                </Button>
              </HStack>
            </VStack>
          </MotionBox>

          {/* Métriques globales */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <MetricsGrid 
              metrics={metricsCards}
              level="global"
              columns={{ base: 1, md: 2, lg: 4 }}
            />
          </MotionBox>

          {/* Statut des Kiosks */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <MonitoringTable
              columns={kioskColumns}
              data={kiosks}
              level="global"
              title="Statut des Kiosks"
              showAvatar={true}
              avatarKey="gym_name"
              nameKey="gym_name"
            />
          </MotionBox>

          {/* Sessions récentes */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <MonitoringTable
              columns={sessionColumns}
              data={sessions.slice(0, 10)}
              level="global"
              title="Sessions Récentes"
              showAvatar={false}
            />
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  )
}