"use client"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack,
  HStack,
  Button,
  Spinner,
  useToast
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Wifi,
  DollarSign,
  Users,
  RefreshCw,
  Building2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatDurationFromMinutes } from '@/lib/format-time'
import { createBrowserClientWithConfig } from '../../../../../lib/supabase-admin'
import { MetricsGrid, MetricCard } from '../../../../../components/admin/monitoring/MetricsGrid'
import { MonitoringTable, TableColumn } from '../../../../../components/admin/monitoring/MonitoringTable'
import { LevelBreadcrumb } from '../../../../../components/admin/navigation/LevelBreadcrumb'
import { useMonitoringData } from '../../../../../hooks/useMonitoringData'

const MotionBox = motion(Box)

interface FranchiseInfo {
  id: string
  name: string
}

export default function FranchiseMonitoringPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const franchiseId = params.id as string

  const [franchise, setFranchise] = useState<FranchiseInfo | null>(null)
  const [loadingFranchise, setLoadingFranchise] = useState(true)

  // Utiliser le hook de monitoring pour cette franchise
  const { 
    monitoring, 
    sessions, 
    kiosks, 
    loading: monitoringLoading, 
    error, 
    refresh 
  } = useMonitoringData({
    level: 'franchise',
    franchiseId,
    autoRefresh: true,
    refreshInterval: 30000
  })

  const [refreshing, setRefreshing] = useState(false)

  // Charger les infos de la franchise
  useEffect(() => {
    loadFranchiseInfo()
  }, [franchiseId])

  const loadFranchiseInfo = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      const { data, error } = await supabase
        .from('franchises')
        .select('id, name')
        .eq('id', franchiseId)
        .single()

      if (error) throw error
      setFranchise(data)
    } catch (error) {
      // Log supprimé pour production
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de la franchise",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoadingFranchise(false)
    }
  }

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

  // Configuration des métriques franchise
  const metricsCards: MetricCard[] = [
    {
      label: 'Sessions actives',
      value: monitoring.activeSessions,
      icon: Activity,
      color: 'purple',
      trend: monitoring.activeSessions > 0 ? {
        value: 12,
        label: 'vs hier',
        positive: true
      } : undefined
    },
    {
      label: 'Kiosks en ligne',
      value: `${monitoring.onlineKiosks}/${monitoring.totalKiosks}`,
      icon: Wifi,
      color: monitoring.onlineKiosks < monitoring.totalKiosks ? 'red' : 'purple',
      highlight: monitoring.onlineKiosks < monitoring.totalKiosks
    },
    {
      label: 'Coûts aujourd\'hui',
      value: `$${monitoring.todayCosts}`,
      icon: DollarSign,
      color: 'purple',
      trend: {
        value: -8,
        label: 'vs hier',
        positive: false
      }
    },
    {
      label: 'Sessions jour',
      value: monitoring.totalSessions,
      icon: Users,
      color: 'purple'
    }
  ]

  // Configuration des colonnes pour les salles de cette franchise
  const gymColumns: TableColumn[] = [
    { key: 'gym_name', label: 'Salle', width: '30%' },
    { key: 'status', label: 'Statut Kiosk', width: '20%' },
    { key: 'active_sessions', label: 'Sessions actives', width: '15%' },
    { key: 'daily_sessions', label: 'Sessions jour', width: '15%' },
    { key: 'daily_cost', label: 'Coûts jour', width: '20%' }
  ]

  // Configuration des colonnes pour les sessions de cette franchise
  const sessionColumns: TableColumn[] = [
    { key: 'id', label: 'Session ID', width: '15%' },
    { key: 'gym_name', label: 'Salle', width: '25%' },
    { key: 'session_start', label: 'Début', width: '20%' },
    { key: 'duration_minutes', label: 'Durée', width: '15%', 
      render: (value) => value ? formatDurationFromMinutes(value) : <span style={{color: 'var(--chakra-colors-blue-600)', fontSize: '12px', background: 'var(--chakra-colors-blue-50)', padding: '2px 6px', borderRadius: '4px'}}>En cours</span>
    },
    { key: 'status', label: 'Statut', width: '15%' },
    { key: 'cost_usd', label: 'Coût', width: '10%' }
  ]

  // Breadcrumb pour la navigation
  const breadcrumbLevels = [
    {
      level: 'global' as const,
      name: 'Dashboard Global',
      href: '/admin'
    },
    {
      level: 'franchise' as const,
      name: franchise?.name || 'Franchise',
      href: `/admin/franchises/${franchiseId}/gyms`
    }
  ]

  if (loadingFranchise || monitoringLoading) {
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
          <Spinner size="lg" color="purple.600" />
          <Text color="gray.600" fontSize="sm" fontWeight="400">
            Chargement du monitoring franchise...
          </Text>
        </VStack>
      </Box>
    )
  }

  if (!franchise) {
    return (
      <Box 
        minH="100vh" 
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="red.600">Franchise non trouvée</Text>
      </Box>
    )
  }

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, var(--chakra-colors-gray-50) 0%, var(--chakra-colors-gray-100) 50%, var(--chakra-colors-gray-200) 100%)"
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
                currentPage="Monitoring"
              />
              
              <HStack justify="space-between" align="center">
                <HStack spacing={4}>
                  <Box
                    w={12}
                    h={12}
                    bg="linear-gradient(135deg, var(--chakra-colors-purple-400) 0%, var(--chakra-colors-purple-600) 100%)"
                    borderRadius="12px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Building2 color="white" size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Heading 
                      size="lg" 
                      color="black"
                      fontWeight="500"
                      letterSpacing="-0.5px"
                    >
                      Monitoring {franchise.name}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      Supervision des salles et kiosks de cette franchise
                    </Text>
                  </VStack>
                </HStack>
                
                <Button
                  leftIcon={<RefreshCw />}
                  onClick={refreshData}
                  isLoading={refreshing}
                  loadingText="Actualisation..."
                  colorScheme="purple"
                  variant="outline"
                  size="sm"
                >
                  Actualiser
                </Button>
              </HStack>
            </VStack>
          </MotionBox>

          {/* Métriques franchise */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <MetricsGrid 
              metrics={metricsCards}
              level="franchise"
              columns={{ base: 1, md: 2, lg: 4 }}
            />
          </MotionBox>

          {/* Salles de cette franchise */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <MonitoringTable
              columns={gymColumns}
              data={kiosks}
              level="franchise"
              title="Salles de cette franchise"
              showAvatar={true}
              avatarKey="gym_name"
              nameKey="gym_name"
              onRowClick={(gym) => router.push(`/admin/franchises/${franchiseId}/gyms/${gym.gym_id}`)}
            />
          </MotionBox>

          {/* Sessions récentes de cette franchise */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <MonitoringTable
              columns={sessionColumns}
              data={sessions.slice(0, 15)}
              level="franchise"
              title="Sessions récentes de la franchise"
              showAvatar={false}
            />
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  )
}