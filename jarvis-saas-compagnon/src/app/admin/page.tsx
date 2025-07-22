"use client"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack,
  HStack,
  Icon,
  Button,
  Badge,
  Flex,
  SimpleGrid,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  useToast
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Building2, MapPin, Phone, Mail, ArrowLeft, Users, Activity, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase-simple'
import type { Database } from '../../types/database'

type Franchise = Database['public']['Tables']['franchises']['Row']

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

const MotionBox = motion(Box)
const MotionCard = motion(Card)

export default function AdminPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'details'>('list')
  const toast = useToast()

  const supabase = createClient()

  // Charger les franchises depuis Supabase
  useEffect(() => {
    loadFranchises()
  }, [])

  const loadFranchises = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les franchises",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        return
      }

      setFranchises(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
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
    setView('details')
  }

  const handleBackToList = () => {
    setSelectedFranchise(null)
    setView('list')
  }

  // Vue liste des franchises
  const FranchisesList = () => (
    <MotionBox
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
          }
        }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <VStack spacing={4} textAlign="center" mb={8}>
          <Box
            p={4}
            borderRadius="20px"
            bg="brand.50"
            border="1px solid"
            borderColor="brand.100"
          >
            <Icon as={Building2} boxSize={8} color="brand.500" />
          </Box>
          
          <VStack spacing={2}>
            <Heading 
              as="h1" 
              size="2xl" 
              color="gray.800" 
              fontWeight="bold"
              letterSpacing="-0.025em"
            >
              Franchises JARVIS
            </Heading>
            <Text color="gray.600" fontSize="lg" maxW="md">
              Gérer toutes les franchises de la plateforme
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
        </VStack>
      </motion.div>

      {/* Franchises Grid */}
      {loading ? (
        <Flex justify="center" py={12}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      ) : franchises.length === 0 ? (
        <motion.div variants={fadeInUp}>
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
          </Box>
        </motion.div>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {franchises.map((franchise, index) => (
            <motion.div
              key={franchise.id}
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
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
    </MotionBox>
  )

  // Vue détails franchise (pour l'instant, on affichera les infos de base)
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
          onClick={handleBackToList}
          _hover={{ bg: "gray.100" }}
        >
          Retour
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
      <Container maxW="6xl">
        {view === 'list' ? <FranchisesList /> : <FranchiseDetails />}
      </Container>
    </Box>
  )
}
