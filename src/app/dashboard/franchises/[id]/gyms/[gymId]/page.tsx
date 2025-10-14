/**
 * 🏋️ DASHBOARD SALLE DE SPORT DÉTAIL
 * Vue complète d'une salle avec kiosk, membres et sessions
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
  Button,
  Badge,
  Avatar,
  Progress,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react'
import { 
  Activity,
  Users,
  Monitor,
  TrendingUp,
  MapPin,
  MoreVertical,
  Edit,
  Settings,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { DashboardUrlBuilder } from '@/lib/user-context'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface Gym {
  id: string
  name: string
  address: string
  city: string
  phone?: string
  email?: string
  description?: string
  franchise_name: string
  manager_name?: string
  manager_email?: string
  created_at: Date
  is_active: boolean
  kiosk_config: any
}

interface GymStats {
  totalMembers: number
  activeSessions: number
  dailySessions: number
  monthlyRevenue: number
  avgSessionDuration: number
  kioskUptime: number
}

interface Member {
  id: string
  badge_id: string
  first_name: string
  last_name: string
  email?: string
  membership_type: string
  last_visit?: Date
  total_sessions: number
  status: 'active' | 'inactive' | 'suspended'
}

interface LiveSession {
  id: string
  session_id: string
  member_name: string
  member_badge_id: string
  started_at: Date
  duration_minutes: number
  status: 'active' | 'completed' | 'interrupted'
  ai_model: string
  voice_model: string
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function GymHeader({ gym }: { gym: Gym }) {
  const getKioskStatus = () => {
    if (!gym.kiosk_config?.is_provisioned) return { status: 'offline', color: 'red', label: 'Non configuré' }
    if (gym.kiosk_config?.is_active) return { status: 'online', color: 'green', label: 'En ligne' }
    return { status: 'maintenance', color: 'orange', label: 'Maintenance' }
  }

  const kioskStatus = getKioskStatus()

  return (
    <Card>
      <CardBody>
        <Flex justify="space-between" align="start">
          <HStack spacing={4}>
            <Avatar size="lg" name={gym.name} />
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                {gym.name}
              </Text>
              <HStack color="gray.600">
                <MapPin size={16} />
                <Text>{gym.address}, {gym.city}</Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Franchise: {gym.franchise_name}
              </Text>
              {gym.description && (
                <Text fontSize="sm" color="gray.600" maxW="500px">
                  {gym.description}
                </Text>
              )}
            </VStack>
          </HStack>

          <VStack align="end" spacing={2}>
            <HStack>
              <Badge 
                colorScheme={gym.is_active ? 'green' : 'red'} 
                variant="subtle"
                px={3}
                py={1}
              >
                {gym.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge 
                colorScheme={kioskStatus.color} 
                variant="solid"
                px={3}
                py={1}
              >
                <HStack spacing={1}>
                  {kioskStatus.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                  <Text>Kiosk {kioskStatus.label}</Text>
                </HStack>
              </Badge>
            </HStack>
            <Button
              leftIcon={<Settings size={16} />}
              variant="outline"
              size="sm"
            >
              Paramètres
            </Button>
          </VStack>
        </Flex>

        {/* Informations de contact */}
        <Divider my={4} />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Contact salle */}
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              Contact de la salle
            </Text>
            {gym.phone && (
              <HStack color="gray.600" fontSize="sm">
                <Phone size={14} />
                <Text>{gym.phone}</Text>
              </HStack>
            )}
            {gym.email && (
              <HStack color="gray.600" fontSize="sm">
                <Mail size={14} />
                <Text>{gym.email}</Text>
              </HStack>
            )}
          </VStack>

          {/* Manager */}
          {gym.manager_name && (
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Manager de la salle
              </Text>
              <HStack>
                <Avatar size="sm" name={gym.manager_name} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    {gym.manager_name}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {gym.manager_email}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          )}
        </SimpleGrid>
      </CardBody>
    </Card>
  )
}

function GymStatsGrid({ stats }: { stats: GymStats }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Membres Actifs</StatLabel>
            <StatNumber color="blue.600">{stats.totalMembers}</StatNumber>
            <StatHelpText>
              Inscrits à cette salle
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions Live</StatLabel>
            <StatNumber color="green.600">{stats.activeSessions}</StatNumber>
            <StatHelpText>
              En cours maintenant
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions (Jour)</StatLabel>
            <StatNumber color="orange.600">{stats.dailySessions}</StatNumber>
            <StatHelpText>
              Aujourd'hui
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Revenus Mensuels</StatLabel>
            <StatNumber color="purple.600">${stats.monthlyRevenue.toLocaleString()}</StatNumber>
            <StatHelpText>
              Estimation
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Durée Moyenne</StatLabel>
            <StatNumber color="teal.600">{stats.avgSessionDuration}min</StatNumber>
            <StatHelpText>
              Par session
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Uptime Kiosk</StatLabel>
            <StatNumber color="pink.600">{stats.kioskUptime}%</StatNumber>
            <StatHelpText>
              Dernières 24h
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function LiveSessionsTable({ sessions }: { sessions: LiveSession[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'completed': return 'blue'
      case 'interrupted': return 'red'
      default: return 'gray'
    }
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="semibold">
            Sessions Live ({sessions.length})
          </Text>
          <Button size="sm" leftIcon={<RotateCcw size={16} />}>
            Actualiser
          </Button>
        </HStack>
      </CardHeader>
      <CardBody>
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Membre</Th>
                <Th>Badge ID</Th>
                <Th>Durée</Th>
                <Th>Modèle IA</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sessions.map(session => (
                <Tr key={session.id}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={session.member_name} />
                      <Text fontWeight="medium">{session.member_name}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge variant="outline">{session.member_badge_id}</Badge>
                  </Td>
                  <Td>
                    <HStack>
                      <Clock size={14} />
                      <Text>{session.duration_minutes}min</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {session.ai_model}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<MoreVertical size={16} />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem icon={<Eye size={16} />}>
                          Voir détails
                        </MenuItem>
                        <MenuItem icon={<Pause size={16} />}>
                          Interrompre
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        {sessions.length === 0 && (
          <VStack spacing={4} py={8}>
            <Activity size={48} color="gray.400" />
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="medium" color="gray.600">
                Aucune session active
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Les sessions en cours apparaîtront ici en temps réel.
              </Text>
            </VStack>
          </VStack>
        )}
      </CardBody>
    </Card>
  )
}

function MembersTable({ members }: { members: Member[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'gray'
      case 'suspended': return 'red'
      default: return 'gray'
    }
  }

  return (
    <Card>
      <CardHeader>
        <Text fontSize="lg" fontWeight="semibold">
          Membres ({members.length})
        </Text>
      </CardHeader>
      <CardBody>
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Membre</Th>
                <Th>Badge ID</Th>
                <Th>Type d'abonnement</Th>
                <Th>Dernière visite</Th>
                <Th>Sessions totales</Th>
                <Th>Statut</Th>
              </Tr>
            </Thead>
            <Tbody>
              {members.slice(0, 10).map(member => (
                <Tr key={member.id}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={`${member.first_name} ${member.last_name}`} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">
                          {member.first_name} {member.last_name}
                        </Text>
                        {member.email && (
                          <Text fontSize="xs" color="gray.500">
                            {member.email}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge variant="outline">{member.badge_id}</Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme="blue" variant="subtle">
                      {member.membership_type}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {member.last_visit?.toLocaleDateString('fr-FR') || 'Jamais'}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontWeight="medium">{member.total_sessions}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        {members.length > 10 && (
          <Flex justify="center" mt={4}>
            <Button variant="outline" size="sm">
              Voir tous les membres ({members.length})
            </Button>
          </Flex>
        )}

        {members.length === 0 && (
          <VStack spacing={4} py={8}>
            <Users size={48} color="gray.400" />
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="medium" color="gray.600">
                Aucun membre inscrit
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Les membres inscrits à cette salle apparaîtront ici.
              </Text>
            </VStack>
          </VStack>
        )}
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function GymDetailPage() {
  const params = useParams()
  const franchiseId = params.id as string
  const gymId = params.gymId as string
  const router = useRouter()

  const [gym, setGym] = useState<Gym | null>(null)
  const [stats, setStats] = useState<GymStats>({
    totalMembers: 0,
    activeSessions: 0,
    dailySessions: 0,
    monthlyRevenue: 0,
    avgSessionDuration: 0,
    kioskUptime: 0
  })
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (franchiseId && gymId) {
      loadGymData()
    }
  }, [franchiseId, gymId])

  const loadGymData = async () => {
    try {
      const supabase = getSupabaseSingleton()

      // Charger les données de la salle
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select(`
          *,
          franchises (name),
          gym_members (
            id,
            badge_id,
            first_name,
            last_name,
            email,
            membership_type,
            last_visit,
            is_active
          )
        `)
        .eq('id', gymId)
        .single()

      if (gymError) throw gymError

      // Charger les sessions actives
      const { data: sessionsData } = await supabase
        .from('openai_realtime_sessions')
        .select(`
          *,
          gym_members (
            badge_id,
            first_name,
            last_name
          )
        `)
        .eq('gym_id', gymId)
        .is('session_end', null)

      // Enrichir les données
      const enrichedGym: Gym = {
        id: gymData.id,
        name: gymData.name,
        address: gymData.address || 'Adresse non renseignée',
        city: gymData.city || 'Ville non renseignée',
        phone: gymData.phone,
        email: gymData.email,
        description: gymData.description,
        franchise_name: gymData.franchises?.name || 'Franchise inconnue',
        manager_name: gymData.manager_name,
        manager_email: gymData.manager_email,
        created_at: new Date(gymData.created_at),
        is_active: gymData.status === 'active',
        kiosk_config: gymData.kiosk_config || {}
      }

      const enrichedMembers: Member[] = (gymData.gym_members || []).map((m: any) => ({
        id: m.id,
        badge_id: m.badge_id,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        membership_type: m.membership_type || 'Standard',
        last_visit: m.last_visit ? new Date(m.last_visit) : undefined,
        total_sessions: 0, // À calculer depuis les sessions
        status: m.is_active ? 'active' : 'inactive'
      }))

      const enrichedSessions: LiveSession[] = (sessionsData || []).map((s: any) => ({
        id: s.id,
        session_id: s.session_id,
        member_name: `${s.gym_members?.first_name} ${s.gym_members?.last_name}`,
        member_badge_id: s.gym_members?.badge_id || 'N/A',
        started_at: new Date(s.session_start),
        duration_minutes: Math.floor((Date.now() - new Date(s.session_start).getTime()) / 60000),
        status: 'active',
        ai_model: s.ai_model || 'gpt-4o-mini',
        voice_model: s.voice_model || 'alloy'
      }))

      // Calculer les statistiques
      const newStats: GymStats = {
        totalMembers: enrichedMembers.length,
        activeSessions: enrichedSessions.length,
        dailySessions: Math.floor(Math.random() * 20) + 5, // Simulé
        monthlyRevenue: enrichedMembers.length * 29.99,
        avgSessionDuration: 8.5, // Simulé
        kioskUptime: gymData.kiosk_config?.is_provisioned ? 98.5 : 0
      }

      setGym(enrichedGym)
      setMembers(enrichedMembers)
      setLiveSessions(enrichedSessions)
      setStats(newStats)

    } catch (error) {
      console.error('Erreur chargement salle:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!gym && !loading) {
    return (
      <DashboardLayout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Salle introuvable</AlertTitle>
          <AlertDescription>
            La salle demandée n'existe pas ou vous n'avez pas les permissions pour y accéder.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={gym?.name || 'Chargement...'}
      subtitle="Monitoring et gestion de la salle de sport"
      loading={loading}
      actions={
        <Button
          leftIcon={<Monitor size={18} />}
          colorScheme="blue"
          onClick={() => router.push(`/kiosk/${gym?.id}`)}
        >
          Accéder au Kiosk
        </Button>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Header de la salle */}
        {gym && <GymHeader gym={gym} />}

        {/* Statistiques */}
        <GymStatsGrid stats={stats} />

        {/* Onglets */}
        <Tabs>
          <TabList>
            <Tab>Sessions Live ({liveSessions.length})</Tab>
            <Tab>Membres ({members.length})</Tab>
            <Tab>Analytics</Tab>
            <Tab>Kiosk</Tab>
          </TabList>

          <TabPanels>
            {/* Onglet Sessions Live */}
            <TabPanel px={0}>
              <LiveSessionsTable sessions={liveSessions} />
            </TabPanel>

            {/* Onglet Membres */}
            <TabPanel px={0}>
              <MembersTable members={members} />
            </TabPanel>

            {/* Onglet Analytics */}
            <TabPanel px={0}>
              <Card>
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <TrendingUp size={48} color="gray.400" />
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                      Analytics détaillées
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Graphiques de performance et analyses détaillées à venir.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Onglet Kiosk */}
            <TabPanel px={0}>
              <Card>
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <Monitor size={48} color="gray.400" />
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                      Configuration Kiosk
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Paramètres et monitoring du kiosk JARVIS.
                    </Text>
                    <Button
                      colorScheme="blue"
                      onClick={() => router.push(`/kiosk/${gym?.id}`)}
                    >
                      Ouvrir le Kiosk
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </DashboardLayout>
  )
}
