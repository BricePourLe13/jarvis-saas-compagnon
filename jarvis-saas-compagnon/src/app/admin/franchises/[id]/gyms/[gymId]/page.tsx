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
  Card,
  CardBody,
  CardHeader,
  Badge,
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
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Building2, 
  MapPin, 
  Clock,
  Settings,
  MoreVertical,
  Edit,
  QrCode,
  Wifi,
  Monitor,
  Users,
  Activity,
  Dumbbell,
  Calendar,
  Zap
} from 'lucide-react'
import type { Gym, Franchise } from '../../../../../../types/franchise'

// ===========================================
// 🎯 Page Principale
// ===========================================

export default function GymDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  
  const franchiseId = params.id as string
  const gymId = params.gymId as string

  // ===========================================
  // 📊 État
  // ===========================================
  
  const [gym, setGym] = useState<Gym | null>(null)
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)

  // ===========================================
  // 🔄 Chargement des données
  // ===========================================

  useEffect(() => {
    loadGymDetails()
  }, [gymId])

  const loadGymDetails = async () => {
    try {
      setLoading(true)

      // Charger les détails de la salle
      const response = await fetch(`/api/admin/gyms/${gymId}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la salle')
      }

      const result = await response.json()
      setGym(result.data)
      
      // Charger les détails de la franchise
      if (result.data?.franchise_id) {
        const franchiseResponse = await fetch(`/api/admin/franchises/${result.data.franchise_id}`)
        if (franchiseResponse.ok) {
          const franchiseResult = await franchiseResponse.json()
          setFranchise(franchiseResult.data)
        }
      }

    } catch (error) {
      console.error('Erreur chargement salle:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les détails de la salle',
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

  const handleBack = () => {
    router.push(`/admin/franchises/${franchiseId}/gyms`)
  }

  const handleEdit = () => {
    router.push(`/admin/franchises/${franchiseId}/gyms/${gymId}/edit`)
  }

  const handlePreviewKiosk = () => {
    if (gym?.kiosk_config?.kiosk_url_slug) {
      window.open(`/kiosk/${gym.kiosk_config.kiosk_url_slug}`, '_blank')
    } else {
      toast({
        title: 'Kiosk non configuré',
        description: 'Cette salle n\'a pas encore de Kiosk JARVIS configuré',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const copyProvisioningCode = () => {
    if (gym?.kiosk_config?.provisioning_code) {
      navigator.clipboard.writeText(gym.kiosk_config.provisioning_code)
      toast({
        title: 'Code copié',
        description: 'Le code de provisioning a été copié dans le presse-papier',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  // ===========================================
  // 🎨 UI Helpers
  // ===========================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'maintenance': return 'orange'
      case 'offline': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'maintenance': return 'Maintenance'
      case 'offline': return 'Hors ligne'
      default: return status
    }
  }

  const isKioskProvisioned = gym?.kiosk_config?.is_provisioned || false
  const provisioningCode = gym?.kiosk_config?.provisioning_code
  const kioskUrl = gym?.kiosk_config?.kiosk_url_slug

  // ===========================================
  // 🖼️ Rendu
  // ===========================================

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Text>Chargement...</Text>
        </VStack>
      </Container>
    )
  }

  if (!gym) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Salle introuvable</AlertTitle>
          <AlertDescription>
            Cette salle n'existe pas ou vous n'avez pas les permissions pour la voir.
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="7xl" py={8}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VStack spacing={6} align="stretch">
          
          {/* Navigation */}
          <Breadcrumb fontSize="sm" color="gray.600">
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/admin/franchises')}>
                Franchises
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms`)}>
                {franchise?.name || 'Franchise'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <Text color="gray.900" fontWeight="600">{gym.name}</Text>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Header avec actions */}
          <Flex align="center">
            <HStack spacing={4}>
              <IconButton
                icon={<Icon as={ArrowLeft} />}
                onClick={handleBack}
                variant="outline"
                borderRadius="12px"
                aria-label="Retour"
              />
              <VStack align="start" spacing={0}>
                <Heading size="lg" color="gray.800">
                  {gym.name}
                </Heading>
                <HStack spacing={2}>
                  <Icon as={MapPin} boxSize={4} color="gray.400" />
                  <Text fontSize="sm" color="gray.600">
                    {gym.city} • {gym.postal_code}
                  </Text>
                  <Badge 
                    colorScheme={getStatusColor(gym.status)} 
                    size="sm"
                    borderRadius="8px"
                  >
                    {getStatusLabel(gym.status)}
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            
            <Spacer />
            
            <HStack spacing={3}>
              <Button
                leftIcon={<Icon as={QrCode} />}
                onClick={handlePreviewKiosk}
                variant="outline"
                colorScheme="purple"
                borderRadius="12px"
                isDisabled={!kioskUrl}
              >
                Prévisualiser Kiosk
              </Button>
              
              <Button
                leftIcon={<Icon as={Edit} />}
                onClick={handleEdit}
                variant="outline"
                colorScheme="blue"
                borderRadius="12px"
              >
                Modifier
              </Button>
              
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<Icon as={MoreVertical} />}
                  variant="outline"
                  borderRadius="12px"
                />
                <MenuList borderRadius="12px">
                  <MenuItem icon={<Icon as={Settings} />}>
                    Configuration
                  </MenuItem>
                  <MenuItem icon={<Icon as={Activity} />}>
                    Analytics
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>

          {/* Contenu principal avec onglets */}
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList borderRadius="12px 12px 0 0" bg="gray.50">
              <Tab _selected={{ bg: "white", borderColor: "gray.200" }}>
                <Icon as={Building2} mr={2} />
                Informations
              </Tab>
              <Tab _selected={{ bg: "white", borderColor: "gray.200" }}>
                <Icon as={Monitor} mr={2} />
                Kiosk JARVIS
              </Tab>
              <Tab _selected={{ bg: "white", borderColor: "gray.200" }}>
                <Icon as={Activity} mr={2} />
                Analytics
              </Tab>
            </TabList>

            <TabPanels bg="white" borderRadius="0 0 12px 12px" border="1px solid" borderColor="gray.200" borderTop="none">
              
              {/* Onglet Informations */}
              <TabPanel p={6}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  
                  {/* Informations générales */}
                  <Card 
                    borderRadius="16px" 
                    border="1px solid" 
                    borderColor="gray.100"
                    bg="white"
                    shadow="sm"
                    _hover={{ shadow: "md" }}
                    transition="all 0.2s"
                  >
                    <CardHeader bg="blue.50" borderRadius="16px 16px 0 0">
                      <Heading size="md" color="blue.700">
                        <Icon as={Building2} mr={2} />
                        Informations générales
                      </Heading>
                    </CardHeader>
                    <CardBody pt={4}>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Nom</Text>
                          <Text fontWeight="600" color="gray.800">{gym.name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Adresse</Text>
                          <Text color="gray.700">{gym.address}</Text>
                          <Text color="gray.600">{gym.city} {gym.postal_code}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Statut</Text>
                          <Badge 
                            colorScheme={getStatusColor(gym.status)} 
                            size="md"
                            borderRadius="8px"
                            px={3}
                            py={1}
                          >
                            {getStatusLabel(gym.status)}
                          </Badge>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Statistiques */}
                  <Card 
                    borderRadius="16px" 
                    border="1px solid" 
                    borderColor="gray.100"
                    bg="white"
                    shadow="sm"
                    _hover={{ shadow: "md" }}
                    transition="all 0.2s"
                  >
                    <CardHeader bg="green.50" borderRadius="16px 16px 0 0">
                      <Heading size="md" color="green.700">
                        <Icon as={Activity} mr={2} />
                        Statistiques
                      </Heading>
                    </CardHeader>
                    <CardBody pt={4}>
                      <SimpleGrid columns={2} spacing={4}>
                        <Stat 
                          p={4} 
                          bg="blue.50" 
                          borderRadius="12px" 
                          border="1px solid" 
                          borderColor="blue.100"
                        >
                          <StatLabel fontSize="sm" color="blue.600" fontWeight="600">
                            Membres
                          </StatLabel>
                          <StatNumber color="blue.700" fontSize="2xl">
                            {gym.member_count || 0}
                          </StatNumber>
                        </Stat>
                        <Stat 
                          p={4} 
                          bg="purple.50" 
                          borderRadius="12px" 
                          border="1px solid" 
                          borderColor="purple.100"
                        >
                          <StatLabel fontSize="sm" color="purple.600" fontWeight="600">
                            Sessions JARVIS
                          </StatLabel>
                          <StatNumber color="purple.700" fontSize="2xl">
                            0
                          </StatNumber>
                        </Stat>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                  
                </SimpleGrid>
              </TabPanel>

              {/* Onglet Kiosk JARVIS */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  
                  {/* Statut Kiosk */}
                  <Alert 
                    status={isKioskProvisioned ? "success" : "warning"} 
                    borderRadius="12px"
                  >
                    <AlertIcon />
                    <Box>
                      <AlertTitle>
                        {isKioskProvisioned ? "Kiosk configuré" : "Kiosk en attente"}
                      </AlertTitle>
                      <AlertDescription>
                        {isKioskProvisioned 
                          ? "Le Kiosk JARVIS est opérationnel pour cette salle"
                          : "Le Kiosk JARVIS attend d'être configuré avec le code de provisioning"
                        }
                      </AlertDescription>
                    </Box>
                  </Alert>

                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    
                    {/* Configuration Kiosk */}
                    <Card 
                      borderRadius="16px" 
                      border="1px solid" 
                      borderColor="gray.100"
                      bg="white"
                      shadow="sm"
                      _hover={{ shadow: "md" }}
                      transition="all 0.2s"
                    >
                      <CardHeader bg="purple.50" borderRadius="16px 16px 0 0">
                        <Heading size="md" color="purple.700">
                          <Icon as={Settings} mr={2} />
                          Configuration
                        </Heading>
                      </CardHeader>
                      <CardBody pt={4}>
                        <VStack spacing={5} align="stretch">
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={3} fontWeight="600">Code de provisioning</Text>
                            <HStack>
                              <Code 
                                px={4} 
                                py={3} 
                                borderRadius="12px" 
                                bg="gray.50"
                                border="1px solid"
                                borderColor="gray.200"
                                fontSize="sm"
                                flex="1"
                                fontWeight="600"
                                color="gray.800"
                              >
                                {provisioningCode || 'Non généré'}
                              </Code>
                              {provisioningCode && (
                                <Button
                                  leftIcon={<Icon as={QrCode} />}
                                  onClick={copyProvisioningCode}
                                  size="sm"
                                  variant="outline"
                                  colorScheme="gray"
                                  borderRadius="12px"
                                >
                                  Copier
                                </Button>
                              )}
                            </HStack>
                          </Box>
                          
                          {kioskUrl && (
                            <Box>
                              <Text fontSize="sm" color="gray.600" mb={3} fontWeight="600">Accès Kiosk</Text>
                              <Button
                                leftIcon={<Icon as={Monitor} />}
                                onClick={handlePreviewKiosk}
                                size="md"
                                colorScheme="purple"
                                borderRadius="12px"
                                w="full"
                                rightIcon={<Icon as={ArrowLeft} transform="rotate(180deg)" />}
                              >
                                Ouvrir le Kiosk JARVIS
                              </Button>
                              <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                                URL: /kiosk/{kioskUrl}
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Message d'accueil */}
                    <Card 
                      borderRadius="16px" 
                      border="1px solid" 
                      borderColor="gray.100"
                      bg="white"
                      shadow="sm"
                      _hover={{ shadow: "md" }}
                      transition="all 0.2s"
                    >
                      <CardHeader bg="orange.50" borderRadius="16px 16px 0 0">
                        <Heading size="md" color="orange.700">
                          <Icon as={Zap} mr={2} />
                          Message d'accueil
                        </Heading>
                      </CardHeader>
                      <CardBody pt={4}>
                        <Box 
                          p={4} 
                          bg="orange.25" 
                          borderRadius="12px" 
                          border="1px solid" 
                          borderColor="orange.100"
                        >
                          <Text 
                            color="orange.800" 
                            fontStyle="italic" 
                            fontSize="md"
                            fontWeight="500"
                            lineHeight="1.6"
                          >
                            "{gym.kiosk_config?.welcome_message || 'Bienvenue ! Comment puis-je vous aider ?'}"
                          </Text>
                        </Box>
                      </CardBody>
                    </Card>
                    
                  </SimpleGrid>
                </VStack>
              </TabPanel>

              {/* Onglet Analytics */}
              <TabPanel p={6}>
                <Alert status="info" borderRadius="12px">
                  <AlertIcon />
                  <AlertTitle>Analytics à venir</AlertTitle>
                  <AlertDescription>
                    Les données d'analytics et de sessions JARVIS seront disponibles prochainement.
                  </AlertDescription>
                </Alert>
              </TabPanel>
              
            </TabPanels>
          </Tabs>

        </VStack>
      </motion.div>
    </Container>
  )
} 