/**
 * 🏢 DASHBOARD FRANCHISE DÉTAIL
 * Vue détaillée d'une franchise avec ses salles de sport
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
  AlertDescription
} from '@chakra-ui/react'
import { 
  Dumbbell,
  Users,
  Activity,
  TrendingUp,
  MapPin,
  MoreVertical,
  Edit,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle,
  Settings,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { DashboardUrlBuilder } from '@/lib/user-context'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface Franchise {
  id: string
  name: string
  city: string
  country: string
  owner_name: string
  owner_email: string
  description?: string
  website?: string
  phone?: string
  created_at: Date
  is_active: boolean
}

interface Gym {
  id: string
  name: string
  address: string
  city: string
  phone?: string
  email?: string
  members_count: number
  active_sessions: number
  kiosk_status: 'online' | 'offline' | 'maintenance'
  last_activity: Date
  monthly_revenue: number
  status: 'active' | 'warning' | 'error'
}

interface FranchiseStats {
  totalGyms: number
  totalMembers: number
  activeSessions: number
  monthlyRevenue: number
  avgSessionDuration: number
  dailySessions: number
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function FranchiseHeader({ franchise }: { franchise: Franchise }) {
  return (
    <Card>
      <CardBody>
        <Flex justify="space-between" align="start">
          <HStack spacing={4}>
            <Avatar size="lg" name={franchise.name} />
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                {franchise.name}
              </Text>
              <HStack color="gray.600">
                <MapPin size={16} />
                <Text>{franchise.city}, {franchise.country}</Text>
              </HStack>
              {franchise.description && (
                <Text fontSize="sm" color="gray.600" maxW="500px">
                  {franchise.description}
                </Text>
              )}
            </VStack>
          </HStack>

          <VStack align="end" spacing={2}>
            <Badge 
              colorScheme={franchise.is_active ? 'green' : 'red'} 
              variant="subtle"
              px={3}
              py={1}
            >
              {franchise.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Button
              leftIcon={<Settings size={16} />}
              variant="outline"
              size="sm"
            >
              Paramètres
            </Button>
          </VStack>
        </Flex>

        {franchise.owner_name && (
          <>
            <Divider my={4} />
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Propriétaire de la franchise
              </Text>
              <HStack>
                <Avatar size="sm" name={franchise.owner_name} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    {franchise.owner_name}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {franchise.owner_email}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </>
        )}
      </CardBody>
    </Card>
  )
}

function FranchiseStatsGrid({ stats }: { stats: FranchiseStats }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Salles de Sport</StatLabel>
            <StatNumber color="blue.600">{stats.totalGyms}</StatNumber>
            <StatHelpText>
              Réseau complet
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Membres Actifs</StatLabel>
            <StatNumber color="green.600">{stats.totalMembers.toLocaleString()}</StatNumber>
            <StatHelpText>
              Toutes salles confondues
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions Live</StatLabel>
            <StatNumber color="orange.600">{stats.activeSessions}</StatNumber>
            <StatHelpText>
              En cours maintenant
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">CA Mensuel</StatLabel>
            <StatNumber color="purple.600">${stats.monthlyRevenue.toLocaleString()}</StatNumber>
            <StatHelpText>
              Estimation basée sur l'activité
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions (Jour)</StatLabel>
            <StatNumber color="teal.600">{stats.dailySessions}</StatNumber>
            <StatHelpText>
              Aujourd'hui
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Durée Moyenne</StatLabel>
            <StatNumber color="pink.600">{stats.avgSessionDuration}min</StatNumber>
            <StatHelpText>
              Par session
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function GymCard({ gym, franchiseId }: { gym: Gym; franchiseId: string }) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'warning': return 'orange'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getKioskStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green'
      case 'offline': return 'red'
      case 'maintenance': return 'orange'
      default: return 'gray'
    }
  }

  return (
    <Card
      cursor="pointer"
      _hover={{
        shadow: 'md',
        transform: 'translateY(-2px)'
      }}
      transition="all 0.2s"
      onClick={() => router.push(DashboardUrlBuilder.gym(franchiseId, gym.id))}
    >
      <CardHeader>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={2}>
            <HStack>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {gym.name}
              </Text>
              <Badge colorScheme={getStatusColor(gym.status)} variant="subtle">
                {gym.status}
              </Badge>
            </HStack>
            <HStack color="gray.600" fontSize="sm">
              <MapPin size={14} />
              <Text>{gym.address}, {gym.city}</Text>
            </HStack>
          </VStack>

          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVertical size={16} />}
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList>
              <MenuItem 
                icon={<Eye size={16} />}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(DashboardUrlBuilder.gym(franchiseId, gym.id))
                }}
              >
                Voir le dashboard
              </MenuItem>
              <MenuItem 
                icon={<Edit size={16} />}
                onClick={(e) => e.stopPropagation()}
              >
                Modifier
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Statut du kiosk */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">Kiosk JARVIS</Text>
            <Badge colorScheme={getKioskStatusColor(gym.kiosk_status)} variant="solid">
              {gym.kiosk_status}
            </Badge>
          </HStack>

          {/* Métriques */}
          <SimpleGrid columns={2} spacing={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                {gym.members_count}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Membres
              </Text>
            </VStack>
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color="green.600">
                {gym.active_sessions}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Sessions actives
              </Text>
            </VStack>
          </SimpleGrid>

          {/* Revenus */}
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold" color="purple.600">
              ${gym.monthly_revenue.toLocaleString()}
            </Text>
            <Text fontSize="xs" color="gray.600">
              Revenus mensuels estimés
            </Text>
          </VStack>

          {/* Dernière activité */}
          <Text fontSize="xs" color="gray.500">
            Dernière activité: {gym.last_activity.toLocaleDateString('fr-FR')}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function FranchiseDetailPage() {
  const params = useParams()
  const franchiseId = params.id as string
  const router = useRouter()

  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [gyms, setGyms] = useState<Gym[]>([])
  const [stats, setStats] = useState<FranchiseStats>({
    totalGyms: 0,
    totalMembers: 0,
    activeSessions: 0,
    monthlyRevenue: 0,
    avgSessionDuration: 0,
    dailySessions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (franchiseId) {
      loadFranchiseData()
    }
  }, [franchiseId])

  const loadFranchiseData = async () => {
    try {
      const supabase = getSupabaseSingleton()

      // Charger les données de la franchise
      const { data: franchiseData, error: franchiseError } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchiseId)
        .single()

      if (franchiseError) throw franchiseError

      // Charger les salles de sport
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select(`
          id,
          name,
          address,
          city,
          phone,
          status,
          kiosk_config,
          created_at,
          gym_members (id)
        `)
        .eq('franchise_id', franchiseId)
        .order('created_at', { ascending: false })

      if (gymsError) throw gymsError

      // Enrichir les données
      const enrichedFranchise: Franchise = {
        id: franchiseData.id,
        name: franchiseData.name,
        city: franchiseData.city || 'Non spécifiée',
        country: franchiseData.country || 'France',
        owner_name: franchiseData.owner_name || 'Non assigné',
        owner_email: franchiseData.owner_email || '',
        description: franchiseData.description,
        website: franchiseData.website,
        phone: franchiseData.phone,
        created_at: new Date(franchiseData.created_at),
        is_active: franchiseData.is_active
      }

      const enrichedGyms: Gym[] = (gymsData || []).map(g => ({
        id: g.id,
        name: g.name,
        address: g.address || 'Adresse non renseignée',
        city: g.city || 'Ville non renseignée',
        phone: g.phone,
        email: g.email,
        members_count: (g.gym_members || []).length,
        active_sessions: Math.floor(Math.random() * 3), // Simulé
        kiosk_status: g.kiosk_config?.is_provisioned ? 'online' : 'offline',
        last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        monthly_revenue: (g.gym_members || []).length * 29.99,
        status: g.status === 'active' ? 'active' : (g.status === 'maintenance' ? 'warning' : 'error')
      }))

      // Calculer les statistiques
      const newStats: FranchiseStats = {
        totalGyms: enrichedGyms.length,
        totalMembers: enrichedGyms.reduce((sum, g) => sum + g.members_count, 0),
        activeSessions: enrichedGyms.reduce((sum, g) => sum + g.active_sessions, 0),
        monthlyRevenue: enrichedGyms.reduce((sum, g) => sum + g.monthly_revenue, 0),
        avgSessionDuration: 8.5, // Simulé
        dailySessions: Math.floor(Math.random() * 50) + 20 // Simulé
      }

      setFranchise(enrichedFranchise)
      setGyms(enrichedGyms)
      setStats(newStats)

    } catch (error) {
      console.error('Erreur chargement franchise:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGym = () => {
    router.push(`/dashboard/franchises/${franchiseId}/gyms/create`)
  }

  if (!franchise && !loading) {
    return (
      <DashboardLayout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Franchise introuvable</AlertTitle>
          <AlertDescription>
            La franchise demandée n'existe pas ou vous n'avez pas les permissions pour y accéder.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={franchise?.name || 'Chargement...'}
      subtitle="Gestion et monitoring de la franchise"
      loading={loading}
      actions={
        <Button
          leftIcon={<Plus size={18} />}
          colorScheme="blue"
          onClick={handleCreateGym}
        >
          Nouvelle Salle
        </Button>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Header de la franchise */}
        {franchise && <FranchiseHeader franchise={franchise} />}

        {/* Statistiques */}
        <FranchiseStatsGrid stats={stats} />

        {/* Onglets */}
        <Tabs>
          <TabList>
            <Tab>Salles de Sport ({gyms.length})</Tab>
            <Tab>Analytics</Tab>
            <Tab>Paramètres</Tab>
          </TabList>

          <TabPanels>
            {/* Onglet Salles */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {gyms.map(gym => (
                    <GymCard key={gym.id} gym={gym} franchiseId={franchiseId} />
                  ))}
                </SimpleGrid>

                {gyms.length === 0 && (
                  <Card>
                    <CardBody>
                      <VStack spacing={4} py={8}>
                        <Dumbbell size={48} color="gray.400" />
                        <VStack spacing={2}>
                          <Text fontSize="lg" fontWeight="medium" color="gray.600">
                            Aucune salle de sport
                          </Text>
                          <Text fontSize="sm" color="gray.500" textAlign="center">
                            Ajoutez votre première salle de sport à cette franchise.
                          </Text>
                        </VStack>
                        <Button
                          leftIcon={<Plus size={18} />}
                          colorScheme="blue"
                          onClick={handleCreateGym}
                        >
                          Créer une salle
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Onglet Analytics */}
            <TabPanel px={0}>
              <Card>
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <BarChart3 size={48} color="gray.400" />
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                      Analytics détaillées
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Les graphiques et analyses détaillées seront disponibles prochainement.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Onglet Paramètres */}
            <TabPanel px={0}>
              <Card>
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <Settings size={48} color="gray.400" />
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                      Paramètres de la franchise
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Configuration et paramètres avancés de la franchise.
                    </Text>
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
