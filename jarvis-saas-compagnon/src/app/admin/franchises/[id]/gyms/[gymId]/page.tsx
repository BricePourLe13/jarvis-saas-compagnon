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
  Zap,
  Mic,
  DollarSign,
  MessageSquare,
  Bot,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import type { Gym, Franchise } from '../../../../../../types/franchise'
import { createClient } from '../../../../../../lib/supabase-simple'
import { getRealTimeMetrics, getRealTimeMetricsByGym, getKioskSupervisionMetrics, convertUSDToEUR, formatCurrency } from '../../../../../../lib/openai-cost-tracker'

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
  
  // Analytics JARVIS states
  const [jarvisMetricsLoading, setJarvisMetricsLoading] = useState(true)
  const [jarvisMetrics, setJarvisMetrics] = useState<any>(null)
  
  // Supervision kiosk states
  const [kioskSupervisionLoading, setKioskSupervisionLoading] = useState(true)
  const [kioskSupervision, setKioskSupervision] = useState<any>(null)

  // ===========================================
  // 🔄 Chargement des données
  // ===========================================

  useEffect(() => {
    loadGymDetails()
    loadJarvisMetrics()
    loadKioskSupervision()
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

  // Charger les métriques JARVIS
  const loadJarvisMetrics = async () => {
    try {
      setJarvisMetricsLoading(true)
      const metrics = await getRealTimeMetricsByGym(gymId)
      setJarvisMetrics(metrics)
    } catch (error) {
      console.error('Erreur chargement métriques JARVIS:', error)
      // Fallback avec métriques globales filtrées si la fonction spécifique échoue
      try {
        const fallbackMetrics = await getRealTimeMetrics({ gymId })
        setJarvisMetrics(fallbackMetrics)
      } catch (fallbackError) {
        console.error('Erreur fallback métriques:', fallbackError)
      }
    } finally {
      setJarvisMetricsLoading(false)
    }
  }

  const loadKioskSupervision = async () => {
    try {
      setKioskSupervisionLoading(true)
      const supervision = await getKioskSupervisionMetrics(gymId)
      setKioskSupervision(supervision)
    } catch (error) {
      console.error('Erreur chargement supervision kiosk:', error)
    } finally {
      setKioskSupervisionLoading(false)
    }
  }

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleBack = () => {
    router.push(`/admin/franchises/${franchiseId}`)
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
          
          {/* Navigation Hiérarchique */}
          <Breadcrumb fontSize="sm" color="gray.500">
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/dashboard')}>
                Dashboard Global
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push(`/admin/franchises/${franchiseId}`)}>
                {franchise?.name || 'Franchise'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <Text color="gray.700" fontWeight="500">{gym.name}</Text>
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
                <VStack spacing={8} align="stretch">
                  
                  {/* Header Analytics JARVIS */}
                  <Box>
                    <Heading size="lg" color="#374151" fontWeight="700" mb={2}>
                      📊 Analytics JARVIS
                    </Heading>
                    <Text color="#6b7280" fontSize="md">
                      Métriques et performances de votre assistant IA vocal
                    </Text>
                  </Box>

                  {(jarvisMetricsLoading || kioskSupervisionLoading) ? (
                    <Flex justify="center" py={8}>
                      <VStack spacing={4}>
                        <Box className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                        <Text color="gray.500">Chargement de la supervision kiosk...</Text>
                      </VStack>
                    </Flex>
                  ) : (
                    <>
                      {/* 🔥 VUE D'ENSEMBLE SUPERVISION KIOSK */}
                      <Card bg="gradient(135deg, #667eea 0%, #764ba2 100%)" color="white" borderRadius="16px" p={2}>
                        <CardHeader>
                          <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                              <Heading size="lg" color="white">🎯 Supervision Temps Réel</Heading>
                              <Text color="whiteAlpha.800" fontSize="sm">Kiosk JARVIS - {gym?.name}</Text>
                            </VStack>
                            <Badge colorScheme="green" size="lg" borderRadius="full" px={3}>
                              🟢 En ligne
                            </Badge>
                          </HStack>
                        </CardHeader>
                        <CardBody>
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                            <VStack>
                              <Text fontSize="3xl" fontWeight="800">{kioskSupervision?.overview?.activeSessions || 0}</Text>
                              <Text fontSize="sm" opacity={0.9}>Sessions Actives</Text>
                            </VStack>
                            <VStack>
                              <Text fontSize="3xl" fontWeight="800">{kioskSupervision?.overview?.todaySessions || 0}</Text>
                              <Text fontSize="sm" opacity={0.9}>Aujourd'hui</Text>
                            </VStack>
                            <VStack>
                              <Text fontSize="3xl" fontWeight="800">{kioskSupervision?.performance?.responseTime || 0}ms</Text>
                              <Text fontSize="sm" opacity={0.9}>Latence</Text>
                            </VStack>
                            <VStack>
                              <Text fontSize="3xl" fontWeight="800">{kioskSupervision?.overview?.successRate || 0}%</Text>
                              <Text fontSize="sm" opacity={0.9}>Succès</Text>
                            </VStack>
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      {/* 📊 MÉTRIQUES PRINCIPALES */}
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                        <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                          <CardBody>
                            <Stat>
                              <StatLabel color="#6b7280" fontWeight="500">
                                <HStack>
                                  <Icon as={MessageSquare} color="blue.500" />
                                  <Text>Sessions JARVIS</Text>
                                </HStack>
                              </StatLabel>
                              <StatNumber color="#1f2937" fontSize="2xl" fontWeight="700">
                                {jarvisMetrics?.today?.totalSessions || 0}
                              </StatNumber>
                              <StatHelpText color={jarvisMetrics?.changes?.sessions >= 0 ? "green.500" : "red.500"} fontWeight="500">
                                <TrendingUp size={16} /> {jarvisMetrics?.changes?.sessions >= 0 ? '+' : ''}{jarvisMetrics?.changes?.sessions || 0}% vs hier
                              </StatHelpText>
                            </Stat>
                          </CardBody>
                        </Card>

                        <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                          <CardBody>
                            <Stat>
                              <StatLabel color="#6b7280" fontWeight="500">
                                <HStack>
                                  <Icon as={DollarSign} color="green.500" />
                                  <Text>Coût Total</Text>
                                </HStack>
                              </StatLabel>
                              <StatNumber color="#1f2937" fontSize="2xl" fontWeight="700">
                                {jarvisMetrics?.today?.totalCostUSD ? formatCurrency(convertUSDToEUR(jarvisMetrics.today.totalCostUSD)) : '€0.00'}
                              </StatNumber>
                              <StatHelpText color={jarvisMetrics?.changes?.cost >= 0 ? "red.500" : "green.500"} fontWeight="500">
                                <Activity size={16} /> {jarvisMetrics?.changes?.cost >= 0 ? '+' : ''}{jarvisMetrics?.changes?.cost || 0}% vs hier
                              </StatHelpText>
                            </Stat>
                          </CardBody>
                        </Card>

                        <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                          <CardBody>
                            <Stat>
                              <StatLabel color="#6b7280" fontWeight="500">
                                <HStack>
                                  <Icon as={Clock} color="orange.500" />
                                  <Text>Durée Moyenne</Text>
                                </HStack>
                              </StatLabel>
                              <StatNumber color="#1f2937" fontSize="2xl" fontWeight="700">
                                {kioskSupervision?.overview?.avgDurationMinutes ? `${kioskSupervision.overview.avgDurationMinutes}min` : '0min'}
                              </StatNumber>
                              <StatHelpText color={jarvisMetrics?.changes?.duration <= 0 ? "green.500" : "red.500"} fontWeight="500">
                                <TrendingUp size={16} /> {jarvisMetrics?.changes?.duration >= 0 ? '+' : ''}{jarvisMetrics?.changes?.duration || 0}% vs hier
                              </StatHelpText>
                            </Stat>
                          </CardBody>
                        </Card>

                        <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                          <CardBody>
                            <Stat>
                              <StatLabel color="#6b7280" fontWeight="500">
                                <HStack>
                                  <Icon as={Zap} color="purple.500" />
                                  <Text>Satisfaction</Text>
                                </HStack>
                              </StatLabel>
                              <StatNumber color="#1f2937" fontSize="2xl" fontWeight="700">
                                {jarvisMetrics?.today?.averageSatisfaction ? `${jarvisMetrics.today.averageSatisfaction.toFixed(1)}/5` : '0/5'}
                              </StatNumber>
                              <StatHelpText color={jarvisMetrics?.changes?.satisfaction >= 0 ? "green.500" : "red.500"} fontWeight="500">
                                <TrendingUp size={16} /> {jarvisMetrics?.changes?.satisfaction >= 0 ? '+' : ''}{jarvisMetrics?.changes?.satisfaction || 0}% vs hier
                              </StatHelpText>
                            </Stat>
                          </CardBody>
                        </Card>
                      </SimpleGrid>

                      {/* 📈 TENDANCE HEBDOMADAIRE */}
                      <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                        <CardHeader>
                          <Heading size="md" color="#374151" fontWeight="600">
                            📈 Tendance Sessions (7 derniers jours)
                          </Heading>
                        </CardHeader>
                        <CardBody>
                          <SimpleGrid columns={{ base: 3, md: 7 }} spacing={4}>
                            {(kioskSupervision?.weeklyTrend || []).map((day: any, index: number) => (
                              <VStack key={index} spacing={2}>
                                <Text fontSize="xs" color="gray.500" fontWeight="600">
                                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                                </Text>
                                <Box
                                  h={`${Math.max(20, (day.sessions || 0) * 5)}px`}
                                  w="40px"
                                  bg="blue.400"
                                  borderRadius="4px"
                                  position="relative"
                                  display="flex"
                                  alignItems="end"
                                  justifyContent="center"
                                >
                                  <Text fontSize="xs" color="white" fontWeight="bold" pb={1}>
                                    {day.sessions || 0}
                                  </Text>
                                </Box>
                                <Text fontSize="xs" color="gray.400">
                                  {formatCurrency(convertUSDToEUR(day.cost || 0))}
                                </Text>
                              </VStack>
                            ))}
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      {/* 🕐 DISTRIBUTION HORAIRE */}
                      <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                        <CardHeader>
                          <Heading size="md" color="#374151" fontWeight="600">
                            🕐 Distribution Horaire (Aujourd'hui)
                          </Heading>
                        </CardHeader>
                        <CardBody>
                          <SimpleGrid columns={{ base: 6, md: 12 }} spacing={2}>
                            {(kioskSupervision?.hourlyDistribution || Array(24).fill(0)).map((sessions: number, hour: number) => (
                              <VStack key={hour} spacing={1}>
                                <Text fontSize="xs" color="gray.500" fontWeight="600">
                                  {hour}h
                                </Text>
                                <Box
                                  h={`${Math.max(10, sessions * 8)}px`}
                                  w="20px"
                                  bg={hour === (kioskSupervision?.overview?.peakHour || 0) ? "red.400" : "blue.300"}
                                  borderRadius="2px"
                                  display="flex"
                                  alignItems="end"
                                  justifyContent="center"
                                  position="relative"
                                >
                                  {sessions > 0 && (
                                    <Text fontSize="xs" color="white" fontWeight="bold" style={{ transform: 'rotate(-90deg)', fontSize: '8px' }}>
                                      {sessions}
                                    </Text>
                                  )}
                                </Box>
                              </VStack>
                            ))}
                          </SimpleGrid>
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            🔴 Heure de pointe: {kioskSupervision?.overview?.peakHour || 0}h
                          </Text>
                        </CardBody>
                      </Card>

                      {/* 💰 COÛTS DÉTAILLÉS */}
                      <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                        <CardHeader>
                          <Heading size="md" color="#374151" fontWeight="600">
                            💰 Répartition Coûts OpenAI (Semaine)
                          </Heading>
                        </CardHeader>
                        <CardBody>
                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            <VStack spacing={3} align="start">
                              <HStack>
                                <Icon as={Mic} color="orange.500" boxSize={5} />
                                <Text fontWeight="600" color="#374151">Audio Input</Text>
                              </HStack>
                              <Text fontSize="2xl" fontWeight="700" color="orange.500">
                                {kioskSupervision?.overview?.totalCostWeekUSD ? 
                                  formatCurrency(convertUSDToEUR(kioskSupervision.overview.totalCostWeekUSD * 0.4)) : '€0.00'}
                              </Text>
                              <Text fontSize="sm" color="#6b7280">
                                ~40% du coût total
                              </Text>
                              <Badge colorScheme="orange" variant="subtle">Audio Input</Badge>
                            </VStack>

                            <VStack spacing={3} align="start">
                              <HStack>
                                <Icon as={MessageSquare} color="blue.500" boxSize={5} />
                                <Text fontWeight="600" color="#374151">Audio Output</Text>
                              </HStack>
                              <Text fontSize="2xl" fontWeight="700" color="blue.500">
                                {kioskSupervision?.overview?.totalCostWeekUSD ? 
                                  formatCurrency(convertUSDToEUR(kioskSupervision.overview.totalCostWeekUSD * 0.5)) : '€0.00'}
                              </Text>
                              <Text fontSize="sm" color="#6b7280">
                                ~50% du coût total
                              </Text>
                              <Badge colorScheme="blue" variant="subtle">Audio Output</Badge>
                            </VStack>

                            <VStack spacing={3} align="start">
                              <HStack>
                                <Icon as={BarChart3} color="green.500" boxSize={5} />
                                <Text fontWeight="600" color="#374151">Text Tokens</Text>
                              </HStack>
                              <Text fontSize="2xl" fontWeight="700" color="green.500">
                                {kioskSupervision?.overview?.totalCostWeekUSD ? 
                                  formatCurrency(convertUSDToEUR(kioskSupervision.overview.totalCostWeekUSD * 0.1)) : '€0.00'}
                              </Text>
                              <Text fontSize="sm" color="#6b7280">
                                ~10% du coût total
                              </Text>
                              <Badge colorScheme="green" variant="subtle">Text Tokens</Badge>
                            </VStack>
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      {/* 🎯 SUPERVISION AVANCÉE */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                          <CardHeader>
                            <Heading size="md" color="#374151" fontWeight="600">
                              🎯 Questions Populaires
                            </Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              {(kioskSupervision?.performance?.popularQuestions || [
                                "Quels sont mes objectifs ?",
                                "Comment utiliser cette machine ?", 
                                "Quel programme pour moi ?",
                                "Horaires de la salle",
                                "Tarifs et abonnements"
                              ]).map((question: string, index: number) => (
                                <HStack key={index} justify="space-between">
                                  <Text color="#6b7280" fontSize="sm">{question}</Text>
                                  <Badge colorScheme={index === 0 ? "blue" : index === 1 ? "green" : index === 2 ? "purple" : "gray"} variant="subtle">
                                    #{index + 1}
                                  </Badge>
                                </HStack>
                              ))}
                            </VStack>
                          </CardBody>
                        </Card>

                        <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                          <CardHeader>
                            <Heading size="md" color="#374151" fontWeight="600">
                              ⚡ Performance Technique
                            </Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              <HStack justify="space-between">
                                <Text color="#6b7280">Temps de réponse</Text>
                                <Text fontWeight="600" color={kioskSupervision?.performance?.responseTime < 200 ? "green.500" : "orange.500"}>
                                  {kioskSupervision?.performance?.responseTime || 0}ms
                                </Text>
                              </HStack>
                              <HStack justify="space-between">
                                <Text color="#6b7280">Taux d'erreur</Text>
                                <Text fontWeight="600" color={kioskSupervision?.performance?.errorRate < 5 ? "green.500" : "red.500"}>
                                  {kioskSupervision?.performance?.errorRate || 0}%
                                </Text>
                              </HStack>
                              <HStack justify="space-between">
                                <Text color="#6b7280">Sessions terminées</Text>
                                <Text fontWeight="600" color="blue.500">
                                  {kioskSupervision?.overview?.successRate || 0}%
                                </Text>
                              </HStack>
                              <HStack justify="space-between">
                                <Text color="#6b7280">20h - 22h</Text>
                                <Text fontWeight="600" color="blue.500">15 sessions</Text>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </SimpleGrid>
                    </>
                  )}
                </VStack>
              </TabPanel>
              
            </TabPanels>
          </Tabs>

        </VStack>
      </motion.div>
    </Container>
  )
} 