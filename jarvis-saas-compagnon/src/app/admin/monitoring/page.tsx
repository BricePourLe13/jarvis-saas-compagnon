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
import { createBrowserClientWithConfig } from '../../../lib/supabase-admin'

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
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [kiosks, setKiosks] = useState<KioskStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    loadData()
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const supabase = createBrowserClientWithConfig()

      // Charger les sessions récentes
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('openai_realtime_sessions')
        .select(`
          id,
          session_start,
          session_end,
          cost_usd,
          gym_id,
          gyms (
            name,
            franchises (
              name
            )
          )
        `)
        .order('session_start', { ascending: false })
        .limit(20)

      if (sessionsError) {
        console.error('Erreur sessions:', sessionsError)
      }

      // Charger les kiosks avec statut
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select(`
          id,
          name,
          kiosk_config,
          franchises (
            name
          )
        `)
        .not('kiosk_config', 'is', null)

      if (gymsError) {
        console.error('Erreur gyms:', gymsError)
      }

      // Transformer les données
      const transformedSessions: SessionData[] = (sessionsData || []).map(session => ({
        id: session.id,
        gym_id: session.gym_id,
        gym_name: (session.gyms as any)?.name || 'Salle inconnue',
        franchise_name: (session.gyms as any)?.franchises?.name || 'Franchise inconnue',
        session_start: session.session_start,
        session_end: session.session_end,
        cost_usd: session.cost_usd || 0,
        status: session.session_end ? 'completed' : 'active',
        duration_minutes: session.session_end ? 
          Math.round((new Date(session.session_end).getTime() - new Date(session.session_start).getTime()) / 60000) : 
          undefined
      }))

      const transformedKiosks: KioskStatus[] = (gymsData || []).map(gym => {
        const gymSessions = transformedSessions.filter(s => s.gym_id === gym.id)
        const activeSessions = gymSessions.filter(s => s.status === 'active').length
        const dailyCost = gymSessions.reduce((sum, s) => sum + s.cost_usd, 0)

        return {
          gym_id: gym.id,
          gym_name: gym.name,
          franchise_name: (gym.franchises as any)?.name || 'Franchise inconnue',
          kiosk_url: gym.kiosk_config?.kiosk_url || '',
          status: gym.kiosk_config?.is_provisioned ? 'online' : 'offline',
          active_sessions: activeSessions,
          daily_sessions: gymSessions.length,
          daily_cost: Math.round(dailyCost * 100) / 100
        }
      })

      setSessions(transformedSessions)
      setKiosks(transformedKiosks)

    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de monitoring",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green'
      case 'active': return 'blue'
      case 'completed': return 'gray'
      case 'offline': return 'red'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return Wifi
      case 'active': return Activity
      case 'completed': return CheckCircle
      case 'offline': return WifiOff
      case 'error': return AlertTriangle
      default: return Monitor
    }
  }

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
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HStack justify="space-between" align="center">
              <HStack spacing={4}>
                <Button
                  variant="ghost"
                  leftIcon={<ArrowLeft />}
                  onClick={() => router.push('/admin')}
                  color="gray.600"
                >
                  Retour
                </Button>
                <VStack align="start" spacing={1}>
                  <Heading 
                    size="lg" 
                    color="black"
                    fontWeight="500"
                    letterSpacing="-0.5px"
                  >
                    Monitoring Temps Réel
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Supervision des kiosks et sessions JARVIS
                  </Text>
                </VStack>
              </HStack>
              
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
          </MotionBox>

          {/* Métriques globales */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
              <Box
                bg="white"
                p={6}
                borderRadius="16px"
                shadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                border="1px solid"
                borderColor="gray.100"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.600">Sessions actives</Text>
                    <Text fontSize="2xl" fontWeight="600" color="blue.600">
                      {sessions.filter(s => s.status === 'active').length}
                    </Text>
                  </VStack>
                  <Icon as={Activity} boxSize={8} color="blue.500" />
                </HStack>
              </Box>

              <Box
                bg="white"
                p={6}
                borderRadius="16px"
                shadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                border="1px solid"
                borderColor="gray.100"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.600">Kiosks en ligne</Text>
                    <Text fontSize="2xl" fontWeight="600" color="green.600">
                      {kiosks.filter(k => k.status === 'online').length}/{kiosks.length}
                    </Text>
                  </VStack>
                  <Icon as={Wifi} boxSize={8} color="green.500" />
                </HStack>
              </Box>

              <Box
                bg="white"
                p={6}
                borderRadius="16px"
                shadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                border="1px solid"
                borderColor="gray.100"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.600">Coûts aujourd'hui</Text>
                    <Text fontSize="2xl" fontWeight="600" color="purple.600">
                      ${kiosks.reduce((sum, k) => sum + k.daily_cost, 0).toFixed(2)}
                    </Text>
                  </VStack>
                  <Icon as={DollarSign} boxSize={8} color="purple.500" />
                </HStack>
              </Box>

              <Box
                bg="white"
                p={6}
                borderRadius="16px"
                shadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                border="1px solid"
                borderColor="gray.100"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.600">Sessions aujourd'hui</Text>
                    <Text fontSize="2xl" fontWeight="600" color="orange.600">
                      {sessions.length}
                    </Text>
                  </VStack>
                  <Icon as={Users} boxSize={8} color="orange.500" />
                </HStack>
              </Box>
            </SimpleGrid>
          </MotionBox>

          {/* Statut des Kiosks */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <VStack align="stretch" spacing={4}>
              <Heading size="md" color="black" fontWeight="500">
                Statut des Kiosks
              </Heading>
              
              <Box
                bg="white"
                borderRadius="16px"
                shadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                border="1px solid"
                borderColor="gray.100"
                overflow="hidden"
              >
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Salle</Th>
                        <Th>Franchise</Th>
                        <Th>Statut</Th>
                        <Th>Sessions actives</Th>
                        <Th>Sessions aujourd'hui</Th>
                        <Th>Coûts journaliers</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {kiosks.map((kiosk) => (
                        <Tr key={kiosk.gym_id}>
                          <Td>
                            <HStack>
                              <Avatar size="sm" name={kiosk.gym_name} bg="gray.200" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="500">{kiosk.gym_name}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {kiosk.kiosk_url}
                                </Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <Text color="gray.600">{kiosk.franchise_name}</Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getStatusColor(kiosk.status)}
                              variant="subtle"
                              display="flex"
                              alignItems="center"
                              gap={1}
                              w="fit-content"
                            >
                              <Icon as={getStatusIcon(kiosk.status)} boxSize={3} />
                              {kiosk.status}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontWeight="500">{kiosk.active_sessions}</Text>
                          </Td>
                          <Td>
                            <Text color="gray.600">{kiosk.daily_sessions}</Text>
                          </Td>
                          <Td>
                            <Text fontWeight="500" color="green.600">
                              ${kiosk.daily_cost.toFixed(2)}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </VStack>
          </MotionBox>

          {/* Sessions récentes */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <VStack align="stretch" spacing={4}>
              <Heading size="md" color="black" fontWeight="500">
                Sessions Récentes
              </Heading>
              
              <Box
                bg="white"
                borderRadius="16px"
                shadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                border="1px solid"
                borderColor="gray.100"
                overflow="hidden"
              >
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Session ID</Th>
                        <Th>Salle</Th>
                        <Th>Début</Th>
                        <Th>Durée</Th>
                        <Th>Statut</Th>
                        <Th>Coût</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sessions.slice(0, 10).map((session) => (
                        <Tr key={session.id}>
                          <Td>
                            <Tooltip label={session.id}>
                              <Text fontFamily="mono" fontSize="sm">
                                {session.id.slice(0, 8)}...
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="500">{session.gym_name}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {session.franchise_name}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {new Date(session.session_start).toLocaleString('fr-FR')}
                            </Text>
                          </Td>
                          <Td>
                            <Text>
                              {session.duration_minutes ? 
                                `${session.duration_minutes}min` : 
                                <Badge colorScheme="blue" variant="subtle">En cours</Badge>
                              }
                            </Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getStatusColor(session.status)}
                              variant="subtle"
                              display="flex"
                              alignItems="center"
                              gap={1}
                              w="fit-content"
                            >
                              <Icon as={getStatusIcon(session.status)} boxSize={3} />
                              {session.status === 'active' ? 'Active' : 'Terminée'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontWeight="500" color="green.600">
                              ${session.cost_usd.toFixed(3)}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  )
}