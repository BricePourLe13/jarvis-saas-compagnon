'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  Icon,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Skeleton,
  useToast,
  Flex,
  Spacer,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  MapPin, 
  Mail, 
  Phone,
  MoreVertical,
  Eye,
  Edit,
  Settings,
  Dumbbell
} from 'lucide-react'
import type { Franchise, PaginatedResponse, FranchiseFilters } from '../../../types/franchise'

// ===========================================
// 🎨 Animation variants
// ===========================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// ===========================================
// 🎯 Interface pour franchise avec métadonnées
// ===========================================

interface FranchiseWithStats extends Franchise {
  owner?: {
    id: string
    email: string
    full_name: string
    is_active: boolean
  }
  gyms?: Array<{
    id: string
    name: string
    status: string
  }>
}

// ===========================================
// 🎯 Composant principal
// ===========================================

export default function FranchisesListPage() {
  const [franchises, setFranchises] = useState<FranchiseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  const router = useRouter()
  const toast = useToast()

  // ===========================================
  // 📝 Fonctions utilitaires
  // ===========================================

  const loadFranchises = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/franchises?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des franchises')
      }

      const result: PaginatedResponse<FranchiseWithStats> = await response.json()
      
      setFranchises(result.data)
      setPagination(result.pagination)

    } catch (error) {
      console.error('Erreur chargement franchises:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les franchises',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleCreateFranchise = () => {
    router.push('/admin/franchises/create')
  }

  const handleViewFranchise = (franchiseId: string) => {
    router.push(`/admin/franchises/${franchiseId}`)
  }

  const handleViewGyms = (franchiseId: string) => {
    router.push(`/admin/franchises/${franchiseId}/gyms`)
  }

  const handleEditFranchise = (franchiseId: string) => {
    router.push(`/admin/franchises/${franchiseId}/edit`)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // ===========================================
  // 🔄 Effects
  // ===========================================

  useEffect(() => {
    loadFranchises()
  }, [pagination.page, searchTerm, statusFilter])

  // ===========================================
  // 🎨 Render Functions
  // ===========================================

  const renderFranchiseCard = (franchise: FranchiseWithStats, index: number) => {
    const gymsCount = franchise.gyms?.length || 0
    const activeGyms = franchise.gyms?.filter(gym => gym.status === 'active').length || 0

    return (
      <motion.div
        key={franchise.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
      >
        <Card
          bg="white"
          borderRadius="20px"
          border="1px solid"
          borderColor="gray.100"
          overflow="hidden"
          _hover={{
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            borderColor: "blue.200"
          }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          h="full"
        >
          <CardHeader pb={3}>
            <Flex justify="space-between" align="start">
              <VStack align="start" spacing={2} flex="1">
                <HStack spacing={2}>
                  <Icon as={Building2} boxSize={5} color="blue.500" />
                  <Text 
                    fontWeight="bold" 
                    fontSize="lg" 
                    color="gray.800"
                    noOfLines={1}
                  >
                    {franchise.name}
                  </Text>
                </HStack>
                
                <Badge 
                  colorScheme={
                    franchise.status === 'active' ? 'green' : 
                    franchise.status === 'trial' ? 'orange' : 
                    'gray'
                  }
                  variant="subtle"
                  borderRadius="full"
                  fontSize="xs"
                  px={2}
                >
                  {franchise.status === 'active' ? 'Actif' : 
                   franchise.status === 'trial' ? 'Essai' : 
                   'Suspendu'}
                </Badge>
              </VStack>

              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<Icon as={MoreVertical} />}
                  variant="ghost"
                  size="sm"
                  borderRadius="full"
                  _hover={{ bg: "gray.100" }}
                />
                <MenuList borderRadius="12px" border="1px solid" borderColor="gray.200">
                  <MenuItem 
                    icon={<Icon as={Dumbbell} />}
                    onClick={() => handleViewGyms(franchise.id)}
                    borderRadius="8px"
                    fontWeight="600"
                    color="green.600"
                  >
                    Voir les salles
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={Eye} />}
                    onClick={() => handleViewFranchise(franchise.id)}
                    borderRadius="8px"
                  >
                    Voir détails
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={Edit} />}
                    onClick={() => handleEditFranchise(franchise.id)}
                    borderRadius="8px"
                  >
                    Modifier
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={Settings} />}
                    borderRadius="8px"
                  >
                    Configuration
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </CardHeader>

          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              {/* Informations de contact */}
              <VStack spacing={2} align="stretch">
                <HStack spacing={2}>
                  <Icon as={Mail} boxSize={4} color="gray.400" />
                  <Text fontSize="sm" color="gray.600" noOfLines={1}>
                    {franchise.contact_email}
                  </Text>
                </HStack>
                
                {franchise.phone && (
                  <HStack spacing={2}>
                    <Icon as={Phone} boxSize={4} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">
                      {franchise.phone}
                    </Text>
                  </HStack>
                )}

                {franchise.city && (
                  <HStack spacing={2}>
                    <Icon as={MapPin} boxSize={4} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">
                      {franchise.city}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Statistiques */}
              <HStack justify="space-between" pt={2} borderTop="1px solid" borderColor="gray.100">
                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {gymsCount}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Salle{gymsCount > 1 ? 's' : ''}
                  </Text>
                </VStack>
                
                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    {activeGyms}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Active{activeGyms > 1 ? 's' : ''}
                  </Text>
                </VStack>

                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    {franchise.owner ? '1' : '0'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Gérant
                  </Text>
                </VStack>
              </HStack>

              {/* Propriétaire */}
              {franchise.owner && (
                <Box 
                  p={3} 
                  bg="gray.50" 
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <HStack spacing={2}>
                    <Icon as={Users} boxSize={4} color="gray.500" />
                    <VStack align="start" spacing={0} flex="1">
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        {franchise.owner.full_name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {franchise.owner.email}
                      </Text>
                    </VStack>
                    <Badge 
                      colorScheme={franchise.owner.is_active ? 'green' : 'gray'}
                      size="sm"
                      variant="subtle"
                    >
                      {franchise.owner.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </HStack>
                </Box>
              )}

              {/* Bouton d'accès aux salles */}
              <Button
                leftIcon={<Icon as={Dumbbell} />}
                onClick={() => handleViewGyms(franchise.id)}
                variant="outline"
                colorScheme="green"
                size="sm"
                borderRadius="12px"
                _hover={{
                  bg: "green.50",
                  borderColor: "green.300"
                }}
                w="full"
              >
                Voir les salles ({gymsCount})
              </Button>

              {/* Date de création */}
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Créé le {new Date(franchise.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </motion.div>
    )
  }

  // ===========================================
  // 🎨 Render principal
  // ===========================================

  return (
    <Box minH="100vh" bg="#fafafa" py={8}>
      <Container maxW="7xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Header */}
          <motion.div variants={fadeInUp}>
            <VStack spacing={6} align="start" mb={8}>
              <HStack justify="space-between" w="full">
                <VStack align="start" spacing={2}>
                  <HStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="12px"
                      bg="blue.50"
                      border="1px solid"
                      borderColor="blue.200"
                    >
                      <Icon as={Building2} boxSize={6} color="blue.500" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Heading 
                        size="xl" 
                        color="gray.800"
                        fontWeight="bold"
                        letterSpacing="-0.025em"
                      >
                        Franchises
                      </Heading>
                      <Text color="gray.600" fontSize="md">
                        Gestion des franchises et espaces JARVIS
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>

                <Button
                  leftIcon={<Icon as={Plus} />}
                  colorScheme="blue"
                  onClick={handleCreateFranchise}
                  borderRadius="12px"
                  px={6}
                  h="50px"
                  _hover={{
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)"
                  }}
                  transition="all 0.2s ease"
                >
                  Nouvelle Franchise
                </Button>
              </HStack>

              {/* Statistiques rapides */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
                <Box
                  p={4}
                  bg="white"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor="gray.100"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {pagination.total}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Total Franchises
                  </Text>
                </Box>
                <Box
                  p={4}
                  bg="white"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor="gray.100"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {franchises.filter(f => f.status === 'active').length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Actives
                  </Text>
                </Box>
                <Box
                  p={4}
                  bg="white"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor="gray.100"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {franchises.filter(f => f.status === 'trial').length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    En Essai
                  </Text>
                </Box>
                <Box
                  p={4}
                  bg="white"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor="gray.100"
                  textAlign="center"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {franchises.reduce((total, f) => total + (f.gyms?.length || 0), 0)}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Total Salles
                  </Text>
                </Box>
              </SimpleGrid>
            </VStack>
          </motion.div>

          {/* Filtres et recherche */}
          <motion.div variants={fadeInUp}>
            <HStack spacing={4} mb={6}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Rechercher une franchise..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="12px"
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                  }}
                />
              </InputGroup>

              <Select
                placeholder="Tous les statuts"
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                maxW="200px"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="12px"
                _focus={{
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                }}
              >
                <option value="active">Actives</option>
                <option value="trial">En essai</option>
                <option value="suspended">Suspendues</option>
              </Select>

              <Spacer />

              <Text fontSize="sm" color="gray.600">
                {pagination.total} franchise{pagination.total > 1 ? 's' : ''} trouvée{pagination.total > 1 ? 's' : ''}
              </Text>
            </HStack>
          </motion.div>

          {/* Liste des franchises */}
          <motion.div variants={fadeInUp}>
            {loading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} height="300px" borderRadius="20px" />
                ))}
              </SimpleGrid>
            ) : franchises.length === 0 ? (
              <Box
                bg="white"
                borderRadius="20px"
                p={12}
                textAlign="center"
                border="1px solid"
                borderColor="gray.100"
              >
                <Icon as={Building2} boxSize={12} color="gray.300" mb={4} />
                <Text color="gray.500" fontSize="lg" mb={2}>
                  {searchTerm || statusFilter ? 'Aucune franchise trouvée' : 'Aucune franchise créée'}
                </Text>
                <Text fontSize="sm" color="gray.400" mb={6}>
                  {searchTerm || statusFilter 
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par créer votre première franchise'}
                </Text>
                {!searchTerm && !statusFilter && (
                  <Button
                    leftIcon={<Icon as={Plus} />}
                    colorScheme="blue"
                    onClick={handleCreateFranchise}
                    borderRadius="12px"
                  >
                    Créer ma première franchise
                  </Button>
                )}
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                <AnimatePresence>
                  {franchises.map((franchise, index) => 
                    renderFranchiseCard(franchise, index)
                  )}
                </AnimatePresence>
              </SimpleGrid>
            )}
          </motion.div>

          {/* Pagination (si nécessaire) */}
          {pagination.totalPages > 1 && (
            <motion.div variants={fadeInUp}>
              <Flex justify="center" mt={8}>
                <HStack spacing={2}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === pagination.page ? "solid" : "ghost"}
                      colorScheme="blue"
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
                      borderRadius="8px"
                    >
                      {page}
                    </Button>
                  ))}
                </HStack>
              </Flex>
            </motion.div>
          )}
        </motion.div>
      </Container>
    </Box>
  )
} 