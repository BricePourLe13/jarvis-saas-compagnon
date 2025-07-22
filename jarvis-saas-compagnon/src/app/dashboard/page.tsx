"use client"
import { useEffect, useState } from "react"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  VStack,
  HStack,
  Icon,
  Badge,
  Flex,
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  useToast
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowLeft, 
  ChevronRight 
} from 'lucide-react'
import { createClient } from '../../lib/supabase-simple'
import type { Database } from '../../types/database'

type Franchise = Database['public']['Tables']['franchises']['Row']

// Données de démonstration pour les stats globales
const stats = [
  { 
    label: "Franchises", 
    value: 12, 
    change: "+12%", 
    trend: "up",
    icon: TrendingUp,
    color: "brand.500"
  },
  { 
    label: "Franchises actives", 
    value: 10, 
    change: "+8%", 
    trend: "up",
    icon: Activity,
    color: "green.500"
  },
  { 
    label: "Utilisateurs", 
    value: 134, 
    change: "+24%", 
    trend: "up",
    icon: Users,
    color: "blue.500"
  },
  { 
    label: "Latence API", 
    value: "120ms", 
    change: "-15%", 
    trend: "down",
    icon: Clock,
    color: "purple.500"
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.1, 0.25, 1] as any
    } 
  }
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const MotionBox = motion(Box)
const MotionCard = motion(Card)

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'overview' | 'franchise-details'>('overview')
  const toast = useToast()

  const supabase = createClient()
  
  useEffect(() => { 
    setMounted(true)
    loadFranchises()
  }, [])

  // Charger les franchises depuis Supabase
  const loadFranchises = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur Supabase:', error)
        toast({
          title: "Erreur de chargement",
          description: `Impossible de charger les franchises: ${error.message}`,
          status: "error",
          duration: 10000,
          isClosable: true,
        })
        return
      }

      setFranchises(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast({
        title: "Erreur technique",
        description: "Une erreur est survenue lors du chargement des franchises",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFranchiseClick = (franchise: Franchise) => {
    setSelectedFranchise(franchise)
    setView('franchise-details')
  }

  const handleBackToOverview = () => {
    setSelectedFranchise(null)
    setView('overview')
  }

  // Vue principale du dashboard
  const DashboardOverview = () => (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <VStack align="start" spacing={2} mb={12}>
          <Heading 
            as="h1" 
            size="2xl" 
            color="gray.800" 
            fontWeight="bold"
            letterSpacing="-0.025em"
          >
            Dashboard
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Vue d'ensemble de votre plateforme JARVIS
          </Text>
        </VStack>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeInUp}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={12}>
          <AnimatePresence>
            {mounted && stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                whileHover={{ 
                  y: -4, 
                  transition: { duration: 0.2 }
                }}
              >
                <Box
                  bg="white"
                  p={6}
                  borderRadius="20px"
                  boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.04)"
                  border="1px solid"
                  borderColor="gray.100"
                  position="relative"
                  overflow="hidden"
                  cursor="pointer"
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    borderColor: "gray.200"
                  }}
                >
                  <Flex justify="space-between" align="start" mb={4}>
                    <Box
                      p={3}
                      borderRadius="12px"
                      bg={`${stat.color.split('.')[0]}.50`}
                    >
                      <Icon 
                        as={stat.icon} 
                        boxSize={6} 
                        color={stat.color}
                      />
                    </Box>
                    <Badge
                      colorScheme={stat.trend === 'up' ? 'green' : stat.trend === 'down' ? 'red' : 'gray'}
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                      py={1}
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      {stat.change}
                    </Badge>
                  </Flex>
                  
                  <Stat>
                    <StatNumber 
                      fontSize="2xl" 
                      fontWeight="bold" 
                      color="gray.800"
                      letterSpacing="-0.025em"
                    >
                      {stat.value}
                    </StatNumber>
                    <StatLabel 
                      color="gray.600" 
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      {stat.label}
                    </StatLabel>
                  </Stat>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </SimpleGrid>
      </motion.div>

      {/* Section Franchises */}
      <motion.div variants={fadeInUp}>
        <VStack align="start" spacing={6} mb={8}>
          <Flex justify="space-between" align="center" w="full">
            <VStack align="start" spacing={1}>
              <Heading as="h2" size="lg" color="gray.800">
                Gestion des Franchises
              </Heading>
              <Text color="gray.600">
                Gérer et monitorer toutes vos franchises
              </Text>
            </VStack>
            <HStack spacing={3}>
              <Badge 
                colorScheme="blue" 
                variant="subtle" 
                borderRadius="full"
                px={3}
                py={1}
                fontSize="sm"
                fontWeight="medium"
              >
                {franchises.length} franchise{franchises.length > 1 ? 's' : ''}
              </Badge>
              <Badge 
                colorScheme="green" 
                variant="subtle" 
                borderRadius="full"
                px={3}
                py={1}
                fontSize="sm"
                fontWeight="medium"
              >
                {franchises.filter(f => f.is_active).length} active{franchises.filter(f => f.is_active).length > 1 ? 's' : ''}
              </Badge>
            </HStack>
          </Flex>
        </VStack>

        {/* Franchises Grid */}
        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
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
            <Text color="gray.500" fontSize="lg">
              Aucune franchise trouvée
            </Text>
            <Text fontSize="sm" color="gray.400" mt={2}>
              Les franchises créées apparaîtront ici
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {franchises.map((franchise, index) => (
              <motion.div
                key={franchise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                whileHover={{ y: -4 }}
              >
                <MotionCard
                  bg="white"
                  borderRadius="20px"
                  border="1px solid"
                  borderColor="gray.100"
                  cursor="pointer"
                  overflow="hidden"
                  _hover={{
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    borderColor: "brand.200"
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  onClick={() => handleFranchiseClick(franchise)}
                >
                  <CardHeader pb={2}>
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex="1">
                        <Text 
                          fontWeight="bold" 
                          fontSize="lg" 
                          color="gray.800"
                          noOfLines={1}
                        >
                          {franchise.name}
                        </Text>
                        <HStack spacing={1}>
                          <Icon as={MapPin} boxSize={3} color="gray.400" />
                          <Text fontSize="sm" color="gray.500" noOfLines={1}>
                            {franchise.city}
                          </Text>
                        </HStack>
                      </VStack>
                      
                      <Badge 
                        colorScheme={franchise.is_active ? "green" : "gray"}
                        variant="subtle"
                        borderRadius="full"
                        fontSize="xs"
                      >
                        {franchise.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </Flex>
                  </CardHeader>

                  <CardBody pt={0}>
                    <VStack spacing={3} align="stretch">
                      <VStack spacing={2} align="stretch">
                        <HStack>
                          <Icon as={Mail} boxSize={4} color="gray.400" />
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {franchise.email}
                          </Text>
                        </HStack>
                        <HStack>
                          <Icon as={Phone} boxSize={4} color="gray.400" />
                          <Text fontSize="sm" color="gray.600">
                            {franchise.phone}
                          </Text>
                        </HStack>
                      </VStack>

                      <Flex justify="space-between" align="center" pt={2}>
                        <Text fontSize="xs" color="gray.400">
                          Créé le {new Date(franchise.created_at).toLocaleDateString('fr-FR')}
                        </Text>
                        <Icon as={ChevronRight} boxSize={4} color="gray.400" />
                      </Flex>
                    </VStack>
                  </CardBody>
                </MotionCard>
              </motion.div>
            ))}
          </SimpleGrid>
        )}
      </motion.div>
    </motion.div>
  )

  // Vue détails franchise
  const FranchiseDetails = () => (
    <MotionBox
      initial="hidden"
      animate="show"
      variants={fadeInUp}
    >
      {/* Header avec bouton retour */}
      <HStack spacing={4} mb={8}>
        <Button
          leftIcon={<Icon as={ArrowLeft} />}
          variant="ghost"
          size="md"
          onClick={handleBackToOverview}
          color="gray.700"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          _hover={{ 
            bg: "gray.50",
            borderColor: "gray.300",
            color: "gray.800"
          }}
          boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
        >
          Retour au dashboard
        </Button>
        <Box>
          <Heading as="h1" size="xl" color="gray.800">
            {selectedFranchise?.name}
          </Heading>
          <Text color="gray.600" mt={1}>
            Détails de la franchise
          </Text>
        </Box>
      </HStack>

      {/* Informations franchise */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg="white" borderRadius="20px" border="1px solid" borderColor="gray.100">
          <CardHeader>
            <Heading size="md" color="gray.800">
              Informations générales
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Nom</Text>
                <Text fontWeight="medium">{selectedFranchise?.name}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Adresse</Text>
                <Text fontWeight="medium">{selectedFranchise?.address}</Text>
                <Text color="gray.600">{selectedFranchise?.postal_code} {selectedFranchise?.city}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Contact</Text>
                <Text fontWeight="medium">{selectedFranchise?.email}</Text>
                <Text color="gray.600">{selectedFranchise?.phone}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Statut</Text>
                <Badge 
                  colorScheme={selectedFranchise?.is_active ? "green" : "gray"}
                  borderRadius="full"
                >
                  {selectedFranchise?.is_active ? "Actif" : "Inactif"}
                </Badge>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        <Card bg="white" borderRadius="20px" border="1px solid" borderColor="gray.100">
          <CardHeader>
            <Heading size="md" color="gray.800">
              Salles de la franchise
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Icon as={Users} boxSize={12} color="gray.300" />
              <Text color="gray.500" textAlign="center">
                Liste des salles à venir
              </Text>
              <Text fontSize="sm" color="gray.400" textAlign="center">
                Cette section affichera toutes les salles<br />
                associées à cette franchise
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </MotionBox>
  )

  return (
    <Box minH="100vh" bg="#fafafa" py={8}>
      <Container maxW="7xl">
        {view === 'overview' ? <DashboardOverview /> : <FranchiseDetails />}
      </Container>
    </Box>
  )
}
