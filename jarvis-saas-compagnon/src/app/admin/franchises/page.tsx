"use client"
import {
  SimpleGrid,
  VStack,
  Box,
  HStack,
  Text,
  Badge,
  Avatar,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { 
  Building2, 
  Dumbbell, 
  Monitor,
  Settings,
  Search,
  MapPin,
  Users,
  Activity
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClientWithConfig } from '../../../lib/supabase-admin'
import { UnifiedLayout } from '../../../components/unified/UnifiedLayout'
import { PrimaryButton } from '../../../components/unified/PrimaryButton'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

interface Franchise {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  is_active: boolean
  created_at: string
  gyms?: {
    id: string
    name: string
    kiosk_config: { is_provisioned?: boolean } | null
    status: string
  }[]
}

export default function FranchisesPage() {
  const router = useRouter()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [filteredFranchises, setFilteredFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [heartbeatByGymId, setHeartbeatByGymId] = useState<Record<string, string | null>>({})

  useEffect(() => {
    loadFranchises()
  }, [])

  useEffect(() => {
    // Filter franchises based on search
    if (searchTerm.trim() === '') {
      setFilteredFranchises(franchises)
    } else {
      const filtered = franchises.filter(franchise =>
        franchise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        franchise.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFranchises(filtered)
    }
  }, [searchTerm, franchises])

  const loadFranchises = async () => {
    try {
      console.log('🔍 [FRANCHISES] Début chargement...')
      const supabase = createBrowserClientWithConfig()
      
      const { data, error } = await supabase
        .from('franchises')
        .select(`
          *,
          gyms (
            id,
            name,
            kiosk_config,
            status
          )
        `)
        .order('created_at', { ascending: false })

      console.log('📊 [FRANCHISES] Données reçues:', data)
      console.log('❌ [FRANCHISES] Erreur:', error)

      if (error) throw error

      const loaded = data || []
      setFranchises(loaded)
      setFilteredFranchises(loaded)

      // Charger les derniers heartbeats pour tous les gyms listés
      const gymIds: string[] = loaded.flatMap(f => (f.gyms || []).map(g => g.id))
      if (gymIds.length > 0) {
        const { data: hbData, error: hbError } = await supabase
          .from('kiosk_heartbeats')
          .select('gym_id,last_heartbeat')
          .in('gym_id', gymIds)

        if (!hbError && hbData) {
          const map: Record<string, string | null> = {}
          hbData.forEach((h: any) => {
            map[h.gym_id] = h.last_heartbeat
          })
          setHeartbeatByGymId(map)
        } else if (hbError) {
          console.warn('[FRANCHISES] Erreur récupération heartbeats:', hbError)
        }
      }
      console.log('✅ [FRANCHISES] Chargement terminé:', data?.length || 0, 'franchises')
    } catch (error) {
      console.error('Erreur chargement franchises:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFranchiseStats = (franchise: Franchise) => {
    const totalGyms = franchise.gyms?.length || 0
    // Actifs = kiosks provisionnés + dernier heartbeat < 2 min
    const now = Date.now()
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000
    const activeKiosks = (franchise.gyms || []).filter((gym: any) => {
      if (!gym.kiosk_config?.is_provisioned) return false
      const last = heartbeatByGymId[gym.id] || undefined
      if (!last) return false
      return now - new Date(last).getTime() < ONLINE_THRESHOLD_MS
    }).length
    const pendingKiosks = franchise.gyms?.filter(gym => 
      gym.kiosk_config && !gym.kiosk_config.is_provisioned
    ).length || 0
    
    return { totalGyms, activeKiosks, pendingKiosks }
  }

  const getFranchiseStatus = (franchise: Franchise) => {
    const stats = getFranchiseStats(franchise)
    if (!franchise.is_active) return 'inactive'
    if (stats.totalGyms === 0) return 'no_gyms'
    if (stats.activeKiosks === 0) return 'no_active'
    if (stats.activeKiosks === stats.totalGyms) return 'all_active'
    return 'partial_active'
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'all_active':
        return { color: 'green', label: 'PLEINEMENT ACTIF' }
      case 'partial_active':
        return { color: 'orange', label: 'PARTIELLEMENT ACTIF' }
      case 'no_active':
        return { color: 'red', label: 'AUCUN KIOSK ACTIF' }
      case 'no_gyms':
        return { color: 'gray', label: 'AUCUNE SALLE' }
      case 'inactive':
        return { color: 'gray', label: 'INACTIF' }
      default:
        return { color: 'gray', label: 'STATUT INCONNU' }
    }
  }

  if (loading) {
    return (
      <UnifiedLayout
        title="Franchises"
        currentLevel="global"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Franchises", href: "/admin/franchises" }
        ]}
      >
        <VStack spacing={8} align="center" py={12}>
          <Spinner size="lg" color="black" />
          <Text color="gray.600">Chargement des franchises...</Text>
        </VStack>
      </UnifiedLayout>
    )
  }

  return (
    <UnifiedLayout
      title="Gestion des franchises"
      currentLevel="global"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Franchises", href: "/admin/franchises" }
      ]}
      primaryAction={{
        label: "Nouvelle franchise",
        onClick: () => router.push('/admin/franchises/create')
      }}
    >
      <VStack spacing={6} align="stretch">
        {/* Header avec recherche */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="600" color="black">
              {filteredFranchises.length} franchise{filteredFranchises.length > 1 ? 's' : ''} trouvée{filteredFranchises.length > 1 ? 's' : ''}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Gérer et superviser vos franchises
            </Text>
          </VStack>

          <Box w="300px">
            <InputGroup>
              <InputLeftElement>
                <Search size={16} color="var(--chakra-colors-gray-400)" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher par nom ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="8px"
                _focus={{
                  borderColor: "black",
                  boxShadow: "0 0 0 1px black"
                }}
              />
            </InputGroup>
          </Box>
        </HStack>

        {/* Liste des franchises */}
        {filteredFranchises.length === 0 ? (
          <Box
            bg="white"
            borderRadius="12px"
            border="1px solid"
            borderColor="gray.100"
            p={12}
            textAlign="center"
          >
            <VStack spacing={4}>
              <Building2 size={32} color="var(--chakra-colors-gray-400)" />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="500" color="black">
                  {searchTerm ? 'Aucune franchise trouvée' : 'Aucune franchise'}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {searchTerm 
                    ? 'Essayez avec d\'autres termes de recherche'
                    : 'Commencez par créer votre première franchise'
                  }
                </Text>
              </VStack>
              {!searchTerm && (
                <PrimaryButton
                  onClick={() => router.push('/admin/franchises/create')}
                >
                  Créer une franchise
                </PrimaryButton>
              )}
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {filteredFranchises.map((franchise, index) => {
              const stats = getFranchiseStats(franchise)
              const status = getFranchiseStatus(franchise)
              const statusConfig = getStatusConfig(status)
              
              return (
                <MotionBox
                  key={franchise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Box
                    bg="white"
                    borderRadius="12px"
                    border="1px solid"
                    borderColor="gray.100"
                    p={6}
                    cursor="pointer"
                    onClick={() => router.push(`/admin/franchises/${franchise.id}/gyms`)}
                    _hover={{
                      shadow: "0 8px 25px rgba(0, 0, 0, 0.12)",
                      borderColor: "gray.200"
                    }}
                    transition="all 0.3s ease"
                  >
                    <VStack spacing={4} align="stretch">
                      {/* Header */}
                      <HStack justify="space-between" align="start">
                        <HStack spacing={3}>
                          <Avatar 
                            size="md" 
                            name={franchise.name}
                            bg="black"
                            color="white"
                            fontWeight="600"
                          />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="600" fontSize="md" noOfLines={1}>
                              {franchise.name}
                            </Text>
                            <HStack spacing={1}>
                              <MapPin size={12} color="var(--chakra-colors-gray-400)" />
                              <Text fontSize="xs" color="gray.500">
                                {franchise.city}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                        
                        <Badge
                          colorScheme={statusConfig.color}
                          variant="subtle"
                          fontSize="xs"
                          fontWeight="500"
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {statusConfig.label}
                        </Badge>
                      </HStack>

                      {/* Quick Stats */}
                      <HStack justify="space-around" align="center" py={2}>
                        <VStack spacing={1} align="center">
                          <HStack spacing={1}>
                              <Dumbbell size={14} color="var(--chakra-colors-gray-500)" />
                            <Text fontSize="lg" fontWeight="700" color="black">
                              {stats.totalGyms}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500" textAlign="center">
                            Salle{stats.totalGyms > 1 ? 's' : ''}
                          </Text>
                        </VStack>
                        
                        <VStack spacing={1} align="center">
                          <HStack spacing={1}>
                              <Activity size={14} color="var(--chakra-colors-green-500)" />
                            <Text fontSize="lg" fontWeight="700" color="green.600">
                              {stats.activeKiosks}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500" textAlign="center">
                            Actif{stats.activeKiosks > 1 ? 's' : ''}
                          </Text>
                        </VStack>
                        
                        {stats.pendingKiosks > 0 && (
                          <VStack spacing={1} align="center">
                            <HStack spacing={1}>
                              <Users size={14} color="var(--chakra-colors-orange-500)" />
                              <Text fontSize="lg" fontWeight="700" color="orange.600">
                                {stats.pendingKiosks}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                              En attente
                            </Text>
                          </VStack>
                        )}
                      </HStack>

                      {/* Actions */}
                      <VStack spacing={2} pt={2}>
                        <PrimaryButton
                          variant="primary"
                          size="sm"
                          leftIcon={<Dumbbell size={14} />}
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/franchises/${franchise.id}/gyms`)
                          }}
                          w="full"
                        >
                          Voir les salles
                        </PrimaryButton>
                        <HStack spacing={2} w="full">
                          <PrimaryButton
                            variant="ghost"
                            size="sm"
                            leftIcon={<Monitor size={14} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/franchises/${franchise.id}/monitoring`)
                            }}
                            flex="1"
                          >
                            Monitor
                          </PrimaryButton>
                          <PrimaryButton
                            variant="ghost"
                            size="sm"
                            leftIcon={<Settings size={14} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/franchises/${franchise.id}/gyms`)
                            }}
                            flex="1"
                          >
                            Config
                          </PrimaryButton>
                        </HStack>
                      </VStack>
                    </VStack>
                  </Box>
                </MotionBox>
              )
            })}
          </SimpleGrid>
        )}
      </VStack>
    </UnifiedLayout>
  )
}