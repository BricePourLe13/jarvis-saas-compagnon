/**
 * 🏢 VUE FRANCHISE DÉTAILLÉE STYLE SENTRY
 * Monitoring complet d'une franchise avec drill-down vers gyms
 */

'use client'

import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Button,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Icon,
  Flex,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton
} from '@chakra-ui/react'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  Dumbbell,
  Wifi,
  WifiOff,
  Eye,
  ArrowRight,
  Zap,
  Shield,
  Settings,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'
import SafeLink from '@/components/common/SafeLink'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface Franchise {
  id: string
  name: string
  city: string
  country: string
  headquarters_address: string
  phone: string
  contact_email: string
  owner_name: string
  owner_email: string
  created_at: Date
  is_active: boolean
  total_gyms: number
  total_members: number
  active_sessions: number
  monthly_revenue: number
  status: 'healthy' | 'warning' | 'critical'
}

interface FranchiseGym {
  id: string
  name: string
  address: string
  city: string
  members_count: number
  active_sessions: number
  kiosk_status: 'online' | 'offline' | 'warning'
  last_activity: Date
  monthly_revenue: number
  uptime: number
  issues_count: number
  status: 'healthy' | 'warning' | 'critical'
}

interface FranchiseMetrics {
  totalGyms: number
  totalMembers: number
  activeSessions: number
  dailyCost: number
  monthlyRevenue: number
  avgUptime: number
  totalIssues: number
  satisfactionScore: number
  growthRate: number
}

interface FranchiseIssue {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  gym_name: string
  timestamp: Date
  resolved: boolean
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function FranchiseHeader({ franchise }: { franchise: Franchise }) {
  const getStatusColor = (status: Franchise['status']) => {
    switch (status) {
      case 'healthy': return 'green'
      case 'warning': return 'orange'
      case 'critical': return 'red'
    }
  }

  const getStatusLabel = (status: Franchise['status']) => {
    switch (status) {
      case 'healthy': return 'Opérationnel'
      case 'warning': return 'Attention'
      case 'critical': return 'Critique'
    }
  }

  return (
    <Card>
      <CardBody>
        <Flex justify="space-between" align="start">
          <HStack spacing={4}>
            <Avatar
              size="lg"
              name={franchise.name}
              bg="blue.500"
              color="white"
            />
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Text fontSize="2xl" fontWeight="bold">
                  {franchise.name}
                </Text>
                <Badge 
                  colorScheme={getStatusColor(franchise.status)} 
                  size="lg"
                  px={3}
                  py={1}
                >
                  {getStatusLabel(franchise.status)}
                </Badge>
              </HStack>
              
              <VStack align="start" spacing={1}>
                <HStack color="gray.600" fontSize="sm">
                  <MapPin size={14} />
                  <Text>{franchise.headquarters_address}, {franchise.city}</Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Phone size={14} />
                  <Text>{franchise.phone}</Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Mail size={14} />
                  <Text>{franchise.contact_email}</Text>
                </HStack>
              </VStack>
            </VStack>
          </HStack>

          <VStack align="end" spacing={2}>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Settings size={16} />}
              >
                Configurer
              </Button>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical size={16} />}
                  variant="outline"
                  size="sm"
                />
                <MenuList>
                  <MenuItem icon={<Eye size={16} />}>
                    Voir détails
                  </MenuItem>
                  <MenuItem icon={<BarChart3 size={16} />}>
                    Analytics
                  </MenuItem>
                  <MenuItem icon={<Settings size={16} />}>
                    Paramètres
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            
            <VStack align="end" spacing={0} fontSize="sm" color="gray.500">
              <Text>Propriétaire: {franchise.owner_name}</Text>
              <Text>Créée: {franchise.created_at.toLocaleDateString()}</Text>
            </VStack>
          </VStack>
        </Flex>
      </CardBody>
    </Card>
  )
}

function FranchiseMetricsGrid({ metrics }: { metrics: FranchiseMetrics }) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
      
      {/* Total Gyms */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Salles Total</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              {metrics.totalGyms}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Actives
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Total Members */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Membres Total</StatLabel>
            <StatNumber color="purple.600" fontSize="2xl">
              {metrics.totalMembers}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              +{metrics.growthRate}% ce mois
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Sessions Actives */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Sessions Live</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              {metrics.activeSessions}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Temps réel
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Revenue Mensuel */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">CA Mensuel</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              €{metrics.monthlyRevenue.toLocaleString()}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              +12% vs mois dernier
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Uptime Moyen */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Uptime Moyen</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              {metrics.avgUptime}%
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Excellent
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Satisfaction */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Satisfaction</StatLabel>
            <StatNumber color="orange.600" fontSize="2xl">
              {metrics.satisfactionScore}★
            </StatNumber>
            <StatHelpText>
              Très élevée
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function GymsTable({ gyms, franchiseId }: { gyms: FranchiseGym[], franchiseId: string }) {
  const getStatusColor = (status: FranchiseGym['status']) => {
    switch (status) {
      case 'healthy': return 'green'
      case 'warning': return 'orange'
      case 'critical': return 'red'
    }
  }

  const getKioskStatusColor = (status: FranchiseGym['kiosk_status']) => {
    switch (status) {
      case 'online': return 'green'
      case 'warning': return 'orange'
      case 'offline': return 'red'
    }
  }

  const getKioskStatusIcon = (status: FranchiseGym['kiosk_status']) => {
    switch (status) {
      case 'online': return Wifi
      case 'warning': return Wifi
      case 'offline': return WifiOff
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins}min ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Salles de Sport ({gyms.length})</Text>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<Dumbbell size={16} />}
          >
            Nouvelle Salle
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Salle</Th>
                <Th>Kiosk Status</Th>
                <Th>Membres</Th>
                <Th>Sessions Live</Th>
                <Th>Uptime</Th>
                <Th>CA Mensuel</Th>
                <Th>Issues</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {gyms.map(gym => {
                const KioskIcon = getKioskStatusIcon(gym.kiosk_status)
                return (
                  <Tr key={gym.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{gym.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {gym.city}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Icon 
                          as={KioskIcon} 
                          color={`${getKioskStatusColor(gym.kiosk_status)}.500`}
                          size={16}
                        />
                        <Badge 
                          colorScheme={getKioskStatusColor(gym.kiosk_status)}
                          size="sm"
                        >
                          {gym.kiosk_status}
                        </Badge>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontWeight="medium">{gym.members_count}</Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {gym.active_sessions > 0 && (
                          <Box w={2} h={2} bg="green.400" borderRadius="full" />
                        )}
                        <Text fontWeight="medium">{gym.active_sessions}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Progress 
                          value={gym.uptime} 
                          size="sm" 
                          w="60px"
                          colorScheme={gym.uptime > 95 ? 'green' : gym.uptime > 90 ? 'orange' : 'red'}
                        />
                        <Text fontSize="sm">{gym.uptime}%</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontWeight="medium">€{gym.monthly_revenue.toLocaleString()}</Text>
                    </Td>
                    <Td>
                      {gym.issues_count > 0 ? (
                        <Badge colorScheme="red" size="sm">
                          {gym.issues_count}
                        </Badge>
                      ) : (
                        <Badge colorScheme="green" size="sm">
                          0
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <SafeLink href={`/dashboard/franchises/${franchiseId}/gyms/${gym.id}`}>
                          <IconButton
                            aria-label="Voir détails"
                            icon={<Eye size={14} />}
                            size="xs"
                            variant="outline"
                          />
                        </SafeLink>
                        <IconButton
                          aria-label="Configurer"
                          icon={<Settings size={14} />}
                          size="xs"
                          variant="outline"
                        />
                      </HStack>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Box>
      </CardBody>
    </Card>
  )
}

function FranchiseIssuesPanel({ issues }: { issues: FranchiseIssue[] }) {
  const getIssueColor = (type: FranchiseIssue['type']) => {
    switch (type) {
      case 'critical': return 'red'
      case 'warning': return 'orange'
      case 'info': return 'blue'
    }
  }

  const getIssueIcon = (type: FranchiseIssue['type']) => {
    switch (type) {
      case 'critical': return AlertTriangle
      case 'warning': return AlertTriangle
      case 'info': return AlertTriangle
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins}min ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Issues Franchise</Text>
          <SafeLink href="/dashboard/issues">
            <Button size="sm" variant="outline" rightIcon={<ArrowRight size={16} />}>
              Voir tout
            </Button>
          </SafeLink>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {issues.filter(i => !i.resolved).slice(0, 5).map(issue => {
            const IssueIcon = getIssueIcon(issue.type)
            return (
              <SafeLink key={issue.id} href={`/dashboard/issues/${issue.id}`}>
                <Box
                  p={3}
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                  _hover={{ borderColor: 'blue.300', bg: 'blue.50' }}
                  cursor="pointer"
                  transition="all 0.2s"
                >
                  <HStack spacing={3}>
                    <Icon 
                      as={IssueIcon} 
                      color={`${getIssueColor(issue.type)}.500`} 
                      size={16}
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="medium" fontSize="sm">
                          {issue.title}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatTimeAgo(issue.timestamp)}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {issue.description}
                      </Text>
                      <Badge colorScheme="gray" size="sm">
                        {issue.gym_name}
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>
              </SafeLink>
            )
          })}
          
          {issues.filter(i => !i.resolved).length === 0 && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Aucun issue !</AlertTitle>
              <AlertDescription>
                Toutes les salles fonctionnent parfaitement.
              </AlertDescription>
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function FranchiseSentryPage({ params }: { params: { id: string } }) {
  const { id: franchiseId } = params
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [gyms, setGyms] = useState<FranchiseGym[]>([])
  const [metrics, setMetrics] = useState<FranchiseMetrics>({
    totalGyms: 0,
    totalMembers: 0,
    activeSessions: 0,
    dailyCost: 0,
    monthlyRevenue: 0,
    avgUptime: 0,
    totalIssues: 0,
    satisfactionScore: 0,
    growthRate: 0
  })
  const [issues, setIssues] = useState<FranchiseIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (franchiseId) {
      loadFranchiseData()
    }
  }, [franchiseId])

  const loadFranchiseData = async () => {
    try {
      const supabase = getSupabaseSingleton()
      
      // 1. Charger franchise
      const { data: franchiseData, error: franchiseError } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchiseId)
        .single()

      if (franchiseError) throw franchiseError

      // 2. Charger gyms
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('id, name, franchise_id')
        .eq('franchise_id', franchiseId)

      if (gymsError) throw gymsError

      // 3. Charger membres
      const { data: membersData } = await supabase
        .from('gym_members')
        .select('id, gym_id')
        .eq('is_active', true)

      // 4. Charger sessions actives
      const { data: sessionsData } = await supabase
        // Désactivé temporairement pour éviter les erreurs 400
        // .from('openai_realtime_sessions')
        // .select('id, gym_id')
        // .is('session_end', null)
        .from('gym_members')
        .select('id')
        .limit(0) // Requête vide pour éviter les erreurs

      // Enrichir les données
      const enrichedFranchise: Franchise = {
        id: franchiseData.id,
        name: franchiseData.name,
        city: franchiseData.city || 'Ville non spécifiée',
        country: franchiseData.country || 'France',
        headquarters_address: franchiseData.headquarters_address || 'Adresse non spécifiée',
        phone: franchiseData.phone || 'Non renseigné',
        contact_email: franchiseData.contact_email || 'Non renseigné',
        owner_name: 'Propriétaire', // Hardcodé
        owner_email: 'owner@example.com', // Hardcodé
        created_at: new Date(franchiseData.created_at),
        is_active: franchiseData.is_active,
        total_gyms: gymsData?.length || 0,
        total_members: 0, // Calculé plus bas
        active_sessions: 0, // Calculé plus bas
        monthly_revenue: 0, // Calculé plus bas
        status: 'healthy' // Simulé
      }

      const enrichedGyms: FranchiseGym[] = (gymsData || []).map(g => {
        const gymMembers = (membersData || []).filter(m => m.gym_id === g.id)
        const gymSessions = (sessionsData || []).filter(s => s.gym_id === g.id)
        
        return {
          id: g.id,
          name: g.name,
          address: 'Adresse non spécifiée', // Hardcodé
          city: 'Ville non spécifiée', // Hardcodé
          members_count: gymMembers.length,
          active_sessions: gymSessions.length,
          kiosk_status: Math.random() > 0.8 ? 'offline' : Math.random() > 0.9 ? 'warning' : 'online',
          last_activity: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
          monthly_revenue: gymMembers.length * 29.99,
          uptime: Math.floor(Math.random() * 10) + 90,
          issues_count: Math.floor(Math.random() * 3),
          status: gymSessions.length > 3 ? 'warning' : 'healthy'
        }
      })

      // Calculer métriques
      const totalMembers = enrichedGyms.reduce((sum, g) => sum + g.members_count, 0)
      const totalSessions = enrichedGyms.reduce((sum, g) => sum + g.active_sessions, 0)
      const totalRevenue = enrichedGyms.reduce((sum, g) => sum + g.monthly_revenue, 0)
      const avgUptime = enrichedGyms.length > 0 
        ? enrichedGyms.reduce((sum, g) => sum + g.uptime, 0) / enrichedGyms.length 
        : 0

      const newMetrics: FranchiseMetrics = {
        totalGyms: enrichedGyms.length,
        totalMembers,
        activeSessions: totalSessions,
        dailyCost: totalSessions * 0.15,
        monthlyRevenue: totalRevenue,
        avgUptime: Math.round(avgUptime * 10) / 10,
        totalIssues: enrichedGyms.reduce((sum, g) => sum + g.issues_count, 0),
        satisfactionScore: 4.6,
        growthRate: 12
      }

      // Issues simulées
      const simulatedIssues: FranchiseIssue[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Coût IA Élevé',
          description: 'Coût horaire dépasse le seuil',
          gym_name: enrichedGyms[0]?.name || 'Gym inconnue',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          resolved: false
        }
      ]

      // Mettre à jour les états
      enrichedFranchise.total_members = totalMembers
      enrichedFranchise.active_sessions = totalSessions
      enrichedFranchise.monthly_revenue = totalRevenue

      setFranchise(enrichedFranchise)
      setGyms(enrichedGyms)
      setMetrics(newMetrics)
      setIssues(simulatedIssues)
    } catch (error) {
      console.error('Erreur chargement franchise:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SentryDashboardLayout
        title="Chargement..."
        subtitle="Récupération des données franchise"
      >
        <Box p={6} textAlign="center">
          <Text>Chargement des données...</Text>
        </Box>
      </SentryDashboardLayout>
    )
  }

  if (!franchise) {
    return (
      <SentryDashboardLayout
        title="Franchise introuvable"
        subtitle="Cette franchise n'existe pas ou vous n'avez pas accès"
      >
        <Box p={6}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Franchise introuvable</AlertTitle>
            <AlertDescription>
              Cette franchise n'existe pas ou vous n'avez pas les permissions pour y accéder.
            </AlertDescription>
          </Alert>
        </Box>
      </SentryDashboardLayout>
    )
  }

  return (
    <SentryDashboardLayout
      title={franchise.name}
      subtitle={`Monitoring franchise • ${franchise.total_gyms} salles • ${franchise.total_members} membres`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Franchises', href: '/dashboard/franchises' },
        { label: franchise.name, isCurrentPage: true }
      ]}
      actions={
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<BarChart3 size={16} />}
          >
            Analytics
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<Dumbbell size={16} />}
          >
            Nouvelle Salle
          </Button>
        </HStack>
      }
    >
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          
          {/* Header Franchise */}
          <FranchiseHeader franchise={franchise} />

          {/* Métriques */}
          <FranchiseMetricsGrid metrics={metrics} />

          {/* Grid Issues + Table Gyms */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
            <Box gridColumn={{ lg: "1 / 2" }}>
              <FranchiseIssuesPanel issues={issues} />
            </Box>
            <Box gridColumn={{ lg: "2 / 4" }}>
              <GymsTable gyms={gyms} franchiseId={franchiseId} />
            </Box>
          </SimpleGrid>

        </VStack>
      </Box>
    </SentryDashboardLayout>
  )
}
