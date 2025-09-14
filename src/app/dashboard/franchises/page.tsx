/**
 * 🏢 DASHBOARD FRANCHISES
 * Vue globale de toutes les franchises (Super Admin uniquement)
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider
} from '@chakra-ui/react'
import { 
  Building2,
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
  CheckCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { userContextManager, DashboardUrlBuilder } from '@/lib/user-context'
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
  gyms_count: number
  active_sessions: number
  total_members: number
  monthly_revenue: number
  status: 'active' | 'warning' | 'error'
  last_activity: Date
  created_at: Date
}

interface FranchiseStats {
  total: number
  active: number
  warning: number
  error: number
  totalGyms: number
  totalMembers: number
  monthlyRevenue: number
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function FranchiseStatsGrid({ stats }: { stats: FranchiseStats }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Total Franchises</StatLabel>
            <StatNumber color="blue.600">{stats.total}</StatNumber>
            <StatHelpText>
              {stats.active} actives, {stats.warning + stats.error} alertes
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Salles de Sport</StatLabel>
            <StatNumber color="green.600">{stats.totalGyms}</StatNumber>
            <StatHelpText>
              Réparties sur {stats.total} franchises
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Membres Actifs</StatLabel>
            <StatNumber color="purple.600">{stats.totalMembers.toLocaleString()}</StatNumber>
            <StatHelpText>
              Tous réseaux confondus
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">CA Mensuel</StatLabel>
            <StatNumber color="orange.600">${stats.monthlyRevenue.toLocaleString()}</StatNumber>
            <StatHelpText>
              Estimation basée sur l'activité
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function FranchiseCard({ franchise }: { franchise: Franchise }) {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'warning': return 'orange'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return Activity
    }
  }

  const StatusIcon = getStatusIcon(franchise.status)

  return (
    <Card
      cursor="pointer"
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)'
      }}
      transition="all 0.2s"
      onClick={() => router.push(DashboardUrlBuilder.franchise(franchise.id))}
    >
      <CardHeader>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={2}>
            <HStack>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {franchise.name}
              </Text>
              <Badge colorScheme={getStatusColor(franchise.status)} variant="subtle">
                <HStack spacing={1}>
                  <StatusIcon size={12} />
                  <Text>{franchise.status}</Text>
                </HStack>
              </Badge>
            </HStack>
            <HStack color="gray.600" fontSize="sm">
              <MapPin size={14} />
              <Text>{franchise.city}, {franchise.country}</Text>
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
                  router.push(DashboardUrlBuilder.franchise(franchise.id))
                }}
              >
                Voir le dashboard
              </MenuItem>
              <MenuItem 
                icon={<Edit size={16} />}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen()
                }}
              >
                Modifier
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Métriques principales */}
          <SimpleGrid columns={2} spacing={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {franchise.gyms_count}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Salles de sport
              </Text>
            </VStack>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {franchise.active_sessions}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Sessions actives
              </Text>
            </VStack>
          </SimpleGrid>

          <Divider />

          {/* Informations propriétaire */}
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              Propriétaire
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

          {/* Activité récente */}
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="gray.600">
              Dernière activité: {franchise.last_activity.toLocaleDateString('fr-FR')}
            </Text>
            <Progress 
              value={75} 
              size="sm" 
              colorScheme={getStatusColor(franchise.status)}
              borderRadius="full"
            />
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [stats, setStats] = useState<FranchiseStats>({
    total: 0,
    active: 0,
    warning: 0,
    error: 0,
    totalGyms: 0,
    totalMembers: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadFranchises()
  }, [])

  const loadFranchises = async () => {
    try {
      const supabase = getSupabaseSingleton()

      // 1. Charger les franchises
      const { data: franchisesData, error: franchisesError } = await supabase
        .from('franchises')
        .select(`
          id,
          name,
          city,
          country,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (franchisesError) throw franchisesError

      // 2. Charger les gyms
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('id, name, franchise_id')

      if (gymsError) throw gymsError

      // 3. Charger les membres
      const { data: membersData, error: membersError } = await supabase
        .from('gym_members')
        .select('id, gym_id')
        .eq('is_active', true)

      if (membersError) throw membersError

      // Enrichir les données
      const enrichedFranchises: Franchise[] = (franchisesData || []).map(f => {
        const franchiseGyms = (gymsData || []).filter(g => g.franchise_id === f.id)
        const totalMembers = franchiseGyms.reduce((sum, gym) => {
          const gymMembers = (membersData || []).filter(m => m.gym_id === gym.id)
          return sum + gymMembers.length
        }, 0)

        return {
          id: f.id,
          name: f.name,
          city: f.city || 'Non spécifiée',
          country: f.country || 'France',
          owner_name: 'Non assigné', // Colonne n'existe pas encore
          owner_email: '', // Colonne n'existe pas encore
          gyms_count: franchiseGyms.length,
          active_sessions: Math.floor(Math.random() * 5), // Simulé pour l'instant
          total_members: totalMembers,
          monthly_revenue: totalMembers * 29.99, // Estimation
          status: f.is_active ? 'active' : 'error',
          last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          created_at: new Date(f.created_at)
        } as Franchise
      })

      // Calculer les statistiques
      const newStats: FranchiseStats = {
        total: enrichedFranchises.length,
        active: enrichedFranchises.filter(f => f.status === 'active').length,
        warning: enrichedFranchises.filter(f => f.status === 'warning').length,
        error: enrichedFranchises.filter(f => f.status === 'error').length,
        totalGyms: enrichedFranchises.reduce((sum, f) => sum + f.gyms_count, 0),
        totalMembers: enrichedFranchises.reduce((sum, f) => sum + f.total_members, 0),
        monthlyRevenue: enrichedFranchises.reduce((sum, f) => sum + f.monthly_revenue, 0)
      }

      setFranchises(enrichedFranchises)
      setStats(newStats)

    } catch (error) {
      console.error('Erreur chargement franchises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFranchise = () => {
    router.push('/dashboard/franchises/create')
  }

  return (
    <DashboardLayout
      title="Gestion des Franchises"
      subtitle="Vue d'ensemble et administration de toutes les franchises"
      loading={loading}
      actions={
        <Button
          leftIcon={<Plus size={18} />}
          colorScheme="blue"
          onClick={handleCreateFranchise}
        >
          Nouvelle Franchise
        </Button>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Statistiques */}
        <FranchiseStatsGrid stats={stats} />

        {/* Liste des franchises */}
        <Box>
          <HStack justify="space-between" mb={6}>
            <Text fontSize="lg" fontWeight="semibold">
              Franchises ({franchises.length})
            </Text>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {franchises.map(franchise => (
              <FranchiseCard key={franchise.id} franchise={franchise} />
            ))}
          </SimpleGrid>

          {franchises.length === 0 && !loading && (
            <Card>
              <CardBody>
                <VStack spacing={4} py={8}>
                  <Building2 size={48} color="gray.400" />
                  <VStack spacing={2}>
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                      Aucune franchise trouvée
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Commencez par créer votre première franchise pour développer votre réseau.
                    </Text>
                  </VStack>
                  <Button
                    leftIcon={<Plus size={18} />}
                    colorScheme="blue"
                    onClick={handleCreateFranchise}
                  >
                    Créer une franchise
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}
        </Box>
      </VStack>
    </DashboardLayout>
  )
}
