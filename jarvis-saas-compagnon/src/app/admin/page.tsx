"use client"
import {
  VStack,
  HStack,
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Spinner,
  Badge,
  Avatar
} from '@chakra-ui/react'
import { 
  AlertTriangle, 
  TrendingUp,
  Building2,
  Activity,
  DollarSign,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClientWithConfig } from '../../lib/supabase-admin'
import { UnifiedLayout } from '../../components/unified/UnifiedLayout'
import { PrimaryButton } from '../../components/unified/PrimaryButton'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../lib/currency'

const MotionBox = motion(Box)

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  franchise?: string
  gym?: string
  timestamp: Date
}

interface QuickStat {
  label: string
  value: string | number
  trend?: { value: number; positive: boolean }
  icon: any
}

interface Franchise {
  id: string
  name: string
  city: string
  gyms_count: number
  active_sessions: number
  status: 'active' | 'warning' | 'error'
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [topFranchises, setTopFranchises] = useState<Franchise[]>([])
  const [quickStats, setQuickStats] = useState<QuickStat[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      
      // Charger les franchises
      const { data: franchisesData, error } = await supabase
        .from('franchises')
        .select(`
          id,
          name,
          city,
          gyms (id, kiosk_config)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Charger des alertes réelles depuis jarvis_errors_log (dernières 24h)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: errorsData } = await supabase
        .from('jarvis_errors_log')
        .select('id, error_type, error_message, context, created_at, gym_id, franchise_id')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5)

      const alertsFromDb: Alert[] = (errorsData || []).map((e: any) => ({
        id: e.id,
        type: e.error_type === 'critical' ? 'error' : 'warning',
        title: e.error_type?.toUpperCase() || 'Incident',
        description: e.error_message || 'Voir détails',
        timestamp: new Date(e.created_at)
      }))

      // Top 3 franchises par activité (sessions actives + kiosks provisionnés)
      const transformedFranchises: Franchise[] = (franchisesData || []).map(f => ({
        id: f.id,
        name: f.name,
        city: f.city,
        gyms_count: f.gyms?.length || 0,
        active_sessions: 0,
        status: (f.gyms || []).some((g: any) => !g.kiosk_config?.is_provisioned) ? 'warning' : 'active' as any
      })).sort((a, b) => b.active_sessions - a.active_sessions).slice(0, 3)

      // Récupérer les métriques globales réelles
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0)
      const [{ data: sessionsToday }, { data: activeSessions } ] = await Promise.all([
        supabase
          .from('openai_realtime_sessions')
          .select('id, cost_usd, session_start, session_end')
          .gte('session_start', startOfDay.toISOString()),
        supabase
          .from('openai_realtime_sessions')
          .select('id')
          .is('session_end', null)
      ])

      const totalCostToday = (sessionsToday || []).reduce((sum: number, s: any) => sum + (s.cost_usd || 0), 0)
      const completed = (sessionsToday || []).filter((s: any) => s.session_end)
      const avgDuration = completed.length > 0 ? Math.round(
        (completed.reduce((acc: number, s: any) => acc + (new Date(s.session_end).getTime() - new Date(s.session_start).getTime()), 0) / completed.length) / 60000 * 10
      ) / 10 : 0

      const stats: QuickStat[] = [
        { label: 'Sessions actives', value: (activeSessions || []).length, icon: Activity, trend: { value: 0, positive: true } },
        { label: 'Coûts IA (jour)', value: formatCurrency(Math.round(totalCostToday * 100)/100, { currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: TrendingUp, trend: { value: 0, positive: false } },
        { label: 'Sessions (jour)', value: (sessionsToday || []).length, icon: DollarSign, trend: { value: 0, positive: true } },
        { label: 'Durée moy. session', value: `${avgDuration} min`, icon: Clock }
      ]

      setAlerts(alertsFromDb)
      setTopFranchises(transformedFranchises)
      setQuickStats(stats)
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAlertStatus = (type: string) => {
    switch (type) {
      case 'error': return 'error'
      case 'warning': return 'warning'
      default: return 'info'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'warning': return 'orange'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  if (loading) {
    return (
      <UnifiedLayout
        title="Dashboard"
        currentLevel="global"
      >
        <VStack spacing={8} align="center" py={12}>
          <Spinner size="lg" color="black" />
          <Text color="gray.600">Chargement du dashboard...</Text>
        </VStack>
      </UnifiedLayout>
    )
  }

  return (
    <UnifiedLayout
      title="Dashboard"
      currentLevel="global"
      primaryAction={{
        label: "Nouvelle franchise",
        onClick: () => router.push('/admin/franchises/create')
      }}
    >
      <VStack spacing={8} align="stretch">
        {/* ALERTES URGENTES */}
        {alerts.length > 0 && (
          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" align="center">
                <HStack spacing={2}>
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text fontSize="lg" fontWeight="600" color="black">
                    Alertes urgentes
                  </Text>
                  <Badge colorScheme="red" variant="subtle">
                    {alerts.length}
                  </Badge>
                </HStack>
                <PrimaryButton
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={() => router.push('/admin/monitoring')}
                >
                  Voir toutes
                </PrimaryButton>
              </HStack>

              <VStack spacing={3} align="stretch">
                {alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    status={getAlertStatus(alert.type)}
                    borderRadius="8px"
                    cursor="pointer"
                    _hover={{ bg: `${getAlertStatus(alert.type)}.25` }}
                    onClick={() => router.push('/admin/monitoring')}
                  >
                    <AlertIcon />
                    <Box flex="1">
                      <AlertTitle fontSize="sm" fontWeight="600">
                        {alert.title}
                      </AlertTitle>
                      <AlertDescription fontSize="sm">
                        {alert.description}
                      </AlertDescription>
                      {alert.franchise && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {alert.franchise} {alert.gym && `• ${alert.gym}`}
                        </Text>
                      )}
                    </Box>
                  </Alert>
                ))}
              </VStack>
            </VStack>
          </MotionBox>
        )}

        {/* STATS RAPIDES CONTEXTUELLES */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="600" color="black">
              Vue d'ensemble
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
              {quickStats.map((stat) => (
                <Box
                  key={stat.label}
                  bg="white"
                  p={4}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <VStack spacing={2} align="start">
                    <HStack spacing={2}>
                      <Box
                        w={8}
                        h={8}
                        bg="gray.100"
                        borderRadius="6px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <stat.icon size={16} color="#374151" />
                      </Box>
                      {stat.trend && (
                        <Text
                          fontSize="xs"
                          color={stat.trend.positive ? "green.600" : "red.600"}
                          fontWeight="500"
                        >
                          {stat.trend.positive ? "+" : ""}{stat.trend.value}%
                        </Text>
                      )}
                    </HStack>
                    <VStack spacing={0} align="start">
                      <Text fontSize="xl" fontWeight="600" color="black">
                        {stat.value}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {stat.label}
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </MotionBox>

        {/* TOP FRANCHISES ACTIVES */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="600" color="black">
                Franchises les plus actives
              </Text>
              <PrimaryButton
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => router.push('/admin/franchises')}
              >
                Voir toutes
              </PrimaryButton>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              {topFranchises.map((franchise, index) => (
                <Box
                  key={franchise.id}
                  bg="white"
                  p={4}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="gray.100"
                  cursor="pointer"
                  onClick={() => router.push(`/admin/franchises/${franchise.id}/gyms`)}
                  _hover={{
                    shadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    borderColor: "gray.200"
                  }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={3} align="start">
                    <Avatar
                      size="sm"
                      name={franchise.name}
                      bg="black"
                      color="white"
                    />
                    <VStack align="start" spacing={1} flex="1">
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                          {franchise.name}
                        </Text>
                        <Badge
                          colorScheme={getStatusColor(franchise.status)}
                          variant="subtle"
                          fontSize="xs"
                        >
                          #{index + 1}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {franchise.city} • {franchise.gyms_count} salle{franchise.gyms_count > 1 ? 's' : ''}
                      </Text>
                      <Text fontSize="sm" fontWeight="500" color="green.600">
                        {franchise.active_sessions} sessions actives
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </MotionBox>

        {/* ACTIONS RAPIDES */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="600" color="black">
              Actions rapides
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box
                bg="white"
                p={6}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
                cursor="pointer"
                onClick={() => router.push('/admin/franchises/create')}
                _hover={{
                  shadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  borderColor: "gray.200"
                }}
                transition="all 0.2s ease"
                textAlign="center"
              >
                <VStack spacing={3}>
                  <Box
                    w={12}
                    h={12}
                    bg="black"
                    borderRadius="8px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Plus size={24} color="white" />
                  </Box>
                  <VStack spacing={1}>
                    <Text fontWeight="600" color="black">
                      Nouvelle franchise
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Ajouter une franchise
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              <Box
                bg="white"
                p={6}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
                cursor="pointer"
                onClick={() => router.push('/admin/franchises')}
                _hover={{
                  shadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  borderColor: "gray.200"
                }}
                transition="all 0.2s ease"
                textAlign="center"
              >
                <VStack spacing={3}>
                  <Box
                    w={12}
                    h={12}
                    bg="gray.100"
                    borderRadius="8px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Building2 size={24} color="#374151" />
                  </Box>
                  <VStack spacing={1}>
                    <Text fontWeight="600" color="black">
                      Gérer franchises
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Voir toutes les franchises
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              <Box
                bg="white"
                p={6}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
                cursor="pointer"
                onClick={() => router.push('/admin/monitoring')}
                _hover={{
                  shadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  borderColor: "gray.200"
                }}
                transition="all 0.2s ease"
                textAlign="center"
              >
                <VStack spacing={3}>
                  <Box
                    w={12}
                    h={12}
                    bg="orange.100"
                    borderRadius="8px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Activity size={24} color="#F97316" />
                  </Box>
                  <VStack spacing={1}>
                    <Text fontWeight="600" color="black">
                      Monitoring global
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Superviser les systèmes
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </MotionBox>
      </VStack>
    </UnifiedLayout>
  )
}