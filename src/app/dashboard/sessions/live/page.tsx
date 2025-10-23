/**
 * 📊 SESSIONS LIVE DASHBOARD UNIFIÉ
 * Vue temps réel des sessions selon le contexte utilisateur
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { 
  Activity,
  Clock,
  Users,
  TrendingUp,
  MoreVertical,
  Eye,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Download
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { userContextManager, UserContext, NavigationContext } from '@/lib/user-context'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface LiveSession {
  id: string
  session_id: string
  member_name: string
  member_badge_id: string
  gym_name: string
  franchise_name?: string
  started_at: Date
  duration_minutes: number
  status: 'active' | 'completed' | 'interrupted'
  ai_model: string
  voice_model: string
  cost_usd: number
  conversation_turns: number
}

interface SessionStats {
  totalActive: number
  totalToday: number
  avgDuration: number
  totalCost: number
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function SessionStatsGrid({ stats }: { stats: SessionStats }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions Actives</StatLabel>
            <StatNumber color="green.600">{stats.totalActive}</StatNumber>
            <StatHelpText>
              En cours maintenant
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions Aujourd'hui</StatLabel>
            <StatNumber color="blue.600">{stats.totalToday}</StatNumber>
            <StatHelpText>
              Depuis minuit
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Durée Moyenne</StatLabel>
            <StatNumber color="purple.600">{stats.avgDuration}min</StatNumber>
            <StatHelpText>
              Par session
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Coût Total</StatLabel>
            <StatNumber color="orange.600">${stats.totalCost.toFixed(2)}</StatNumber>
            <StatHelpText>
              Aujourd'hui
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function LiveSessionsTable({ 
  sessions, 
  showFranchise = false, 
  showGym = true 
}: { 
  sessions: LiveSession[]
  showFranchise?: boolean
  showGym?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.member_badge_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.gym_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Text fontSize="lg" fontWeight="semibold">
            Sessions Live ({filteredSessions.length})
          </Text>
          
          <HStack spacing={3}>
            {/* Recherche */}
            <InputGroup maxW="300px">
              <InputLeftElement>
                <Search size={16} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
              />
            </InputGroup>

            {/* Filtre statut */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="sm"
              maxW="150px"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="completed">Terminées</option>
              <option value="interrupted">Interrompues</option>
            </Select>

            {/* Actions */}
            <Button size="sm" leftIcon={<RotateCcw size={16} />}>
              Actualiser
            </Button>
            <Button size="sm" leftIcon={<Download size={16} />} variant="outline">
              Exporter
            </Button>
          </HStack>
        </Flex>
      </CardHeader>

      <CardBody>
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Membre</Th>
                <Th>Badge ID</Th>
                {showFranchise && <Th>Franchise</Th>}
                {showGym && <Th>Salle</Th>}
                <Th>Durée</Th>
                <Th>Modèle IA</Th>
                <Th>Coût</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredSessions.map(session => (
                <Tr key={session.id}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={session.member_name} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" fontSize="sm">
                          {session.member_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {session.conversation_turns} échanges
                        </Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge variant="outline" fontSize="xs">
                      {session.member_badge_id}
                    </Badge>
                  </Td>
                  {showFranchise && (
                    <Td>
                      <Text fontSize="sm" color="gray.600">
                        {session.franchise_name || 'N/A'}
                      </Text>
                    </Td>
                  )}
                  {showGym && (
                    <Td>
                      <Text fontSize="sm" color="gray.600">
                        {session.gym_name}
                      </Text>
                    </Td>
                  )}
                  <Td>
                    <HStack>
                      <Clock size={14} />
                      <Text fontSize="sm">
                        {session.duration_minutes}min
                      </Text>
                    </HStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="gray.600">
                        {session.ai_model}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {session.voice_model}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm" fontWeight="medium" color="green.600">
                      ${session.cost_usd.toFixed(3)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(session.status)} size="sm">
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
                        {session.status === 'active' && (
                          <MenuItem icon={<Pause size={16} />}>
                            Interrompre
                          </MenuItem>
                        )}
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        {filteredSessions.length === 0 && (
          <VStack spacing={4} py={8}>
            <Activity size={48} color="gray.400" />
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="medium" color="gray.600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune session trouvée' 
                  : 'Aucune session active'
                }
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                {searchTerm || statusFilter !== 'all'
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Les sessions en cours apparaîtront ici en temps réel.'
                }
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

export default function LiveSessionsPage() {
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null)
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [stats, setStats] = useState<SessionStats>({
    totalActive: 0,
    totalToday: 0,
    avgDuration: 0,
    totalCost: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionsData()
  }, [])

  const loadSessionsData = async () => {
    try {
      // Récupérer le contexte utilisateur
      const userCtx = userContextManager.getUserContext()
      const navCtx = userContextManager.getNavigationContext()
      
      if (!userCtx || !navCtx) {
        const newUserCtx = await userContextManager.loadUserContext()
        const newNavCtx = await userContextManager.loadNavigationContext()
        
        if (newUserCtx && newNavCtx) {
          setUserContext(newUserCtx)
          setNavigationContext(newNavCtx)
        }
        return
      }

      setUserContext(userCtx)
      setNavigationContext(navCtx)

      const supabase = getSupabaseSingleton()

      // Construire la requête selon le contexte
      let sessionsQuery = supabase
        .from('openai_realtime_sessions')
        .select(`
          *,
          gym_members_v2 (
            badge_id,
            first_name,
            last_name
          ),
          gyms (
            name,
            franchises (name)
          )
        `)

      // Filtrer selon les permissions
      if (userCtx.role === 'gym_manager') {
        sessionsQuery = sessionsQuery.in('gym_id', userCtx.gymIds)
      } else if (userCtx.role === 'franchise_owner') {
        // Récupérer les gyms des franchises accessibles
        const { data: gyms } = await supabase
          .from('gyms')
          .select('id')
          .in('franchise_id', userCtx.franchiseIds)
        
        const gymIds = (gyms || []).map(g => g.id)
        if (gymIds.length > 0) {
          sessionsQuery = sessionsQuery.in('gym_id', gymIds)
        }
      }
      // Super admin voit tout (pas de filtre)

      // Filtrer par contexte de navigation si applicable
      if (navCtx.gymId) {
        sessionsQuery = sessionsQuery.eq('gym_id', navCtx.gymId)
      } else if (navCtx.franchiseId && userCtx.role === 'super_admin') {
        const { data: gyms } = await supabase
          .from('gyms')
          .select('id')
          .eq('franchise_id', navCtx.franchiseId)
        
        const gymIds = (gyms || []).map(g => g.id)
        if (gymIds.length > 0) {
          sessionsQuery = sessionsQuery.in('gym_id', gymIds)
        }
      }

      const { data: sessionsData, error } = await sessionsQuery
        .order('session_start', { ascending: false })
        .limit(100)

      if (error) throw error

      // Enrichir les données
      const enrichedSessions: LiveSession[] = (sessionsData || []).map(s => ({
        id: s.id,
        session_id: s.session_id,
        member_name: s.gym_members_v2 
          ? `${s.gym_members_v2.first_name} ${s.gym_members_v2.last_name}`
          : 'Membre inconnu',
        member_badge_id: s.gym_members_v2?.badge_id || 'N/A',
        gym_name: s.gyms?.name || 'Salle inconnue',
        franchise_name: s.gyms?.franchises?.name,
        started_at: new Date(s.session_start),
        duration_minutes: s.session_end 
          ? Math.floor((new Date(s.session_end).getTime() - new Date(s.session_start).getTime()) / 60000)
          : Math.floor((Date.now() - new Date(s.session_start).getTime()) / 60000),
        status: s.session_end ? 'completed' : 'active',
        ai_model: s.ai_model || 'gpt-4o-mini',
        voice_model: s.voice_model || 'alloy',
        cost_usd: s.cost_usd || 0,
        conversation_turns: Math.floor(Math.random() * 20) + 5 // Simulé pour l'instant
      }))

      // Calculer les statistiques
      const activeSessions = enrichedSessions.filter(s => s.status === 'active')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todaySessions = enrichedSessions.filter(s => s.started_at >= today)

      const newStats: SessionStats = {
        totalActive: activeSessions.length,
        totalToday: todaySessions.length,
        avgDuration: todaySessions.length > 0 
          ? Math.round(todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0) / todaySessions.length)
          : 0,
        totalCost: todaySessions.reduce((sum, s) => sum + s.cost_usd, 0)
      }

      setSessions(enrichedSessions)
      setStats(newStats)

    } catch (error) {
      console.error('Erreur chargement sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPageTitle = () => {
    if (!navigationContext) return 'Sessions Live'
    
    if (navigationContext.level === 'gym') {
      return `Sessions Live - ${navigationContext.gymName}`
    }
    if (navigationContext.level === 'franchise') {
      return `Sessions Live - ${navigationContext.franchiseName}`
    }
    
    return 'Sessions Live - Vue Globale'
  }

  const getPageSubtitle = () => {
    if (!userContext) return ''
    
    switch (userContext.role) {
      case 'super_admin': return 'Monitoring temps réel de toutes les sessions'
      case 'franchise_owner': return 'Sessions de vos franchises et salles'
      case 'gym_manager': return 'Sessions de votre salle de sport'
      default: return 'Conversations JARVIS en temps réel'
    }
  }

  const shouldShowFranchise = () => {
    return userContext?.role === 'super_admin' && navigationContext?.level === 'global'
  }

  const shouldShowGym = () => {
    return navigationContext?.level !== 'gym'
  }

  return (
    <DashboardLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      loading={loading}
      actions={
        <Button
          leftIcon={<RotateCcw size={18} />}
          onClick={loadSessionsData}
          isLoading={loading}
        >
          Actualiser
        </Button>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Statistiques */}
        <SessionStatsGrid stats={stats} />

        {/* Table des sessions */}
        <LiveSessionsTable 
          sessions={sessions}
          showFranchise={shouldShowFranchise()}
          showGym={shouldShowGym()}
        />
      </VStack>
    </DashboardLayout>
  )
}
