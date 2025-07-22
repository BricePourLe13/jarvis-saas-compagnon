'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  MenuItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Code
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Building2, 
  Dumbbell,
  MapPin, 
  Clock,
  Settings,
  MoreVertical,
  Eye,
  Edit,
  QrCode,
  ArrowLeft
} from 'lucide-react'
import type { Gym, PaginatedResponse, Franchise } from '../../../../../types/franchise'

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
// 🎯 Interface pour gym avec métadonnées
// ===========================================

interface GymWithStats extends Gym {
  franchise_name?: string
  provisioning_code?: string | null
  kiosk_url?: string | null
  manager?: {
    id: string
    email: string
    full_name: string
    is_active: boolean
  }
}

// ===========================================
// 🎯 Composant principal
// ===========================================

export default function GymsListPage() {
  const [gyms, setGyms] = useState<GymWithStats[]>([])
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  const router = useRouter()
  const params = useParams()
  const toast = useToast()

  const franchiseId = params.id as string

  // ===========================================
  // 📝 Fonctions utilitaires
  // ===========================================

  const loadGyms = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      })

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/franchises/${franchiseId}/gyms?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des salles')
      }

      const result: PaginatedResponse<GymWithStats> & { franchise?: Franchise } = await response.json()
      
      setGyms(result.data)
      if (result.franchise) {
        setFranchise(result.franchise as Franchise)
      }

    } catch (error) {
      console.error('Erreur chargement salles:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les salles',
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

  const handleCreateGym = () => {
    router.push(`/admin/franchises/${franchiseId}/gyms/create`)
  }

  const handleViewGym = (gymId: string) => {
    router.push(`/admin/franchises/${franchiseId}/gyms/${gymId}`)
  }

  const handleEditGym = (gymId: string) => {
    router.push(`/admin/franchises/${franchiseId}/gyms/${gymId}/edit`)
  }

  const handleBackToFranchises = () => {
    router.push('/admin/franchises')
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  // ===========================================
  // 🔄 Effects
  // ===========================================

  useEffect(() => {
    if (franchiseId) {
      loadGyms()
    }
  }, [franchiseId, searchTerm, statusFilter])

  // ===========================================
  // 🎨 Render Functions
  // ===========================================

  const renderGymCard = (gym: GymWithStats, index: number) => {
    return (
      <motion.div
        key={gym.id}
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
            borderColor: "green.200"
          }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          h="full"
        >
          <CardHeader pb={3}>
            <Flex justify="space-between" align="start">
              <VStack align="start" spacing={2} flex="1">
                <HStack spacing={2}>
                  <Icon as={Dumbbell} boxSize={5} color="green.500" />
                  <Text 
                    fontWeight="bold" 
                    fontSize="lg" 
                    color="gray.800"
                    noOfLines={1}
                  >
                    {gym.name}
                  </Text>
                </HStack>
                
                <Badge 
                  colorScheme={
                    gym.status === 'active' ? 'green' : 
                    gym.status === 'maintenance' ? 'orange' : 
                    'gray'
                  }
                  variant="subtle"
                  borderRadius="full"
                  fontSize="xs"
                  px={2}
                >
                  {gym.status === 'active' ? 'Active' : 
                   gym.status === 'maintenance' ? 'Maintenance' : 
                   'Suspendue'}
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
                    icon={<Icon as={Eye} />}
                    onClick={() => handleViewGym(gym.id)}
                    borderRadius="8px"
                    fontWeight="600"
                    color="blue.600"
                  >
                    Voir détails
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={Edit} />}
                    onClick={() => handleEditGym(gym.id)}
                    borderRadius="8px"
                  >
                    Modifier
                  </MenuItem>
                  <MenuItem 
                    icon={<Icon as={Settings} />}
                    borderRadius="8px"
                  >
                    Config JARVIS
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </CardHeader>

          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              {/* Localisation */}
              <VStack spacing={2} align="stretch">
                <HStack spacing={2}>
                  <Icon as={MapPin} boxSize={4} color="gray.400" />
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {gym.address}
                  </Text>
                </HStack>
                
                <HStack spacing={2}>
                  <Icon as={Building2} boxSize={4} color="gray.400" />
                  <Text fontSize="sm" color="gray.600">
                    {gym.city} • {gym.postal_code}
                  </Text>
                </HStack>
              </VStack>

              {/* Code de provisioning */}
              {gym.provisioning_code && (
                <Box 
                  p={3} 
                  bg="blue.50" 
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="blue.100"
                >
                  <HStack spacing={2} justify="space-between">
                    <VStack align="start" spacing={1} flex="1">
                      <HStack spacing={2}>
                        <Icon as={QrCode} boxSize={4} color="blue.500" />
                        <Text fontSize="xs" fontWeight="600" color="blue.700">
                          Code de provisioning
                        </Text>
                      </HStack>
                      <Code 
                        colorScheme="blue" 
                        fontSize="sm" 
                        fontWeight="bold"
                        bg="blue.100"
                        px={2}
                        py={1}
                        borderRadius="6px"
                      >
                        {gym.provisioning_code}
                      </Code>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* URL Kiosque */}
              {gym.kiosk_url && (
                <Box 
                  p={3} 
                  bg="green.50" 
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="green.100"
                >
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="600" color="green.700">
                      🤖 Interface JARVIS
                    </Text>
                    <Code 
                      colorScheme="green" 
                      fontSize="xs"
                      bg="green.100"
                      px={2}
                      py={1}
                      borderRadius="6px"
                      maxW="100%"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {gym.kiosk_url}
                    </Code>
                  </VStack>
                </Box>
              )}

              {/* Gérant */}
              {gym.manager ? (
                <Box 
                  p={3} 
                  bg="gray.50" 
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <HStack spacing={2}>
                    <Icon as={Building2} boxSize={4} color="gray.500" />
                    <VStack align="start" spacing={0} flex="1">
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        {gym.manager.full_name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {gym.manager.email}
                      </Text>
                    </VStack>
                    <Badge 
                      colorScheme={gym.manager.is_active ? 'green' : 'gray'}
                      size="sm"
                      variant="subtle"
                    >
                      {gym.manager.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </HStack>
                </Box>
              ) : (
                <Box 
                  p={3} 
                  bg="orange.50" 
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="orange.100"
                >
                  <Text fontSize="sm" color="orange.600">
                    👤 Aucun gérant assigné
                  </Text>
                </Box>
              )}

              {/* Bouton d'accès aux détails */}
              <Button
                leftIcon={<Icon as={Eye} />}
                onClick={() => handleViewGym(gym.id)}
                variant="solid"
                colorScheme="blue"
                size="md"
                borderRadius="12px"
                _hover={{
                  bg: "blue.600",
                  transform: "translateY(-1px)",
                  shadow: "md"
                }}
                transition="all 0.2s"
                w="full"
                fontWeight="600"
                shadow="sm"
              >
                Voir les détails
              </Button>

              {/* Date de création */}
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Créée le {new Date(gym.created_at).toLocaleDateString('fr-FR', {
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
              {/* Breadcrumb */}
              <Breadcrumb fontSize="sm" color="gray.600">
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={handleBackToFranchises}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={handleBackToFranchises}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    Franchises
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                  <Text color="gray.400">
                    {franchise?.name || 'Chargement...'}
                  </Text>
                </BreadcrumbItem>
              </Breadcrumb>

              <HStack justify="space-between" w="full">
                <VStack align="start" spacing={2}>
                  <HStack spacing={4}>
                    <Button
                      leftIcon={<Icon as={ArrowLeft} />}
                      variant="ghost"
                      onClick={handleBackToFranchises}
                      color="gray.700"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="12px"
                      _hover={{ 
                        bg: "gray.50",
                        borderColor: "gray.300"
                      }}
                      boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                    >
                      Retour
                    </Button>
                    
                    <VStack align="start" spacing={1}>
                      <Heading 
                        size="xl" 
                        color="gray.800"
                        fontWeight="bold"
                        letterSpacing="-0.025em"
                      >
                        {loading ? 'Chargement...' : `Salles de ${franchise?.name}`}
                      </Heading>
                      <Text color="gray.600" fontSize="md">
                        Gestion des salles de sport et interfaces JARVIS
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>

                <Button
                  leftIcon={<Icon as={Plus} />}
                  colorScheme="blue"
                  onClick={handleCreateGym}
                  borderRadius="12px"
                  px={6}
                  h="50px"
                  _hover={{
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)"
                  }}
                  transition="all 0.2s ease"
                >
                  Nouvelle Salle
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
                    {gyms.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Total Salles
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
                    {gyms.filter(g => g.status === 'active').length}
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
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {gyms.filter(g => g.provisioning_code).length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    JARVIS Configuré
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
                    {gyms.filter(g => !g.manager).length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Sans Gérant
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
                  placeholder="Rechercher une salle..."
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
                <option value="maintenance">Maintenance</option>
                <option value="suspended">Suspendues</option>
              </Select>

              <Spacer />

              <Text fontSize="sm" color="gray.600">
                {gyms.length} salle{gyms.length > 1 ? 's' : ''} trouvée{gyms.length > 1 ? 's' : ''}
              </Text>
            </HStack>
          </motion.div>

          {/* Liste des salles */}
          <motion.div variants={fadeInUp}>
            {loading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} height="400px" borderRadius="20px" />
                ))}
              </SimpleGrid>
            ) : gyms.length === 0 ? (
              <Box
                bg="white"
                borderRadius="20px"
                p={12}
                textAlign="center"
                border="1px solid"
                borderColor="gray.100"
              >
                <Icon as={Dumbbell} boxSize={12} color="gray.300" mb={4} />
                <Text color="gray.500" fontSize="lg" mb={2}>
                  {searchTerm || statusFilter ? 'Aucune salle trouvée' : 'Aucune salle créée'}
                </Text>
                <Text fontSize="sm" color="gray.400" mb={6}>
                  {searchTerm || statusFilter 
                    ? 'Essayez de modifier vos critères de recherche'
                    : `Commencez par créer votre première salle pour ${franchise?.name}`}
                </Text>
                {!searchTerm && !statusFilter && (
                  <Button
                    leftIcon={<Icon as={Plus} />}
                    colorScheme="blue"
                    onClick={handleCreateGym}
                    borderRadius="12px"
                  >
                    Créer ma première salle
                  </Button>
                )}
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                <AnimatePresence>
                  {gyms.map((gym, index) => 
                    renderGymCard(gym, index)
                  )}
                </AnimatePresence>
              </SimpleGrid>
            )}
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  )
} 