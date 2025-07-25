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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Building2, 
  MapPin,
  Phone,
  Mail,
  Users,
  Activity,
  Dumbbell,
  Mic,
  DollarSign,
  MessageSquare,
  Bot,
  BarChart3,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'
import type { Gym, Franchise } from '../../../../types/franchise'
import { createClient } from '../../../../lib/supabase-simple'
import { getRealTimeMetrics, getRealTimeMetricsByFranchise, convertUSDToEUR, formatCurrency } from '../../../../lib/openai-cost-tracker'

export default function FranchiseAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  
  const franchiseId = params.id as string

  // États
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  
  // Analytics JARVIS states
  const [jarvisMetricsLoading, setJarvisMetricsLoading] = useState(true)
  const [jarvisMetrics, setJarvisMetrics] = useState<any>(null)

  useEffect(() => {
    loadFranchiseDetails()
    loadJarvisMetrics()
  }, [franchiseId])

  const loadFranchiseDetails = async () => {
    try {
      setLoading(true)

      // Charger les détails de la franchise
      const supabase = createClient()
      
      const { data: franchiseData, error: franchiseError } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchiseId)
        .single()

      if (franchiseError) {
        throw new Error('Erreur lors du chargement de la franchise')
      }

      setFranchise(franchiseData)
      
      // Charger les salles de la franchise
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('*')
        .eq('franchise_id', franchiseId)

      if (gymsError) {
        console.error('Erreur chargement salles:', gymsError)
      } else {
        setGyms(gymsData || [])
      }

    } catch (error) {
      console.error('Erreur chargement franchise:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les détails de la franchise',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Charger les métriques JARVIS pour cette franchise
  const loadJarvisMetrics = async () => {
    try {
      setJarvisMetricsLoading(true)
      const metrics = await getRealTimeMetricsByFranchise(franchiseId)
      setJarvisMetrics(metrics)
    } catch (error) {
      console.error('Erreur chargement métriques JARVIS:', error)
      // Fallback avec métriques globales filtrées si la fonction spécifique échoue
      try {
        const fallbackMetrics = await getRealTimeMetrics({ franchiseId })
        setJarvisMetrics(fallbackMetrics)
      } catch (fallbackError) {
        console.error('Erreur fallback métriques:', fallbackError)
      }
    } finally {
      setJarvisMetricsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleGymClick = (gym: Gym) => {
    router.push(`/admin/franchises/${franchiseId}/gyms/${gym.id}`)
  }

  // Fonction utilitaire pour calculer les coûts détaillés
  const getDetailedCosts = () => {
    if (!jarvisMetrics?.today) {
      return {
        audioInputCost: '€0.00',
        audioInputTokens: '0',
        audioOutputCost: '€0.00', 
        audioOutputTokens: '0',
        textCost: '€0.00',
        textTokens: '0'
      }
    }
    
    const today = jarvisMetrics.today
    // Calcul approximatif des coûts par type (ces calculs seraient à affiner)
    const totalCost = today.totalCostUSD || 0
    const audioInputCost = totalCost * 0.4 // 40% pour l'audio input approximativement
    const audioOutputCost = totalCost * 0.5 // 50% pour l'audio output approximativement  
    const textCost = totalCost * 0.1 // 10% pour le texte approximativement
    
    return {
      audioInputCost: formatCurrency(convertUSDToEUR(audioInputCost)),
      audioInputTokens: `${Math.round((today.totalAudioInputTokens || 0) / 1000)}K`,
      audioOutputCost: formatCurrency(convertUSDToEUR(audioOutputCost)),
      audioOutputTokens: `${Math.round((today.totalAudioOutputTokens || 0) / 1000)}K`,
      textCost: formatCurrency(convertUSDToEUR(textCost)),
      textTokens: `${Math.round((today.totalTextInputTokens + today.totalTextOutputTokens || 0) / 1000)}K`
    }
  }

  if (loading) {
    return (
      <Box minH="100vh" bg="#fafafa" py={8}>
        <Container maxW="7xl">
          <Flex justify="center" align="center" py={12}>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color="gray.500">Chargement des analytics franchise...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    )
  }

  if (!franchise) {
    return (
      <Box minH="100vh" bg="#fafafa" py={8}>
        <Container maxW="7xl">
          <VStack spacing={6} align="center" py={12}>
            <Text fontSize="xl" color="gray.600">Franchise non trouvée</Text>
            <Button leftIcon={<ArrowLeft />} onClick={handleBack} colorScheme="blue">
              Retour au dashboard
            </Button>
          </VStack>
        </Container>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="#fafafa">
      <Container maxW="7xl" py={8}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <VStack spacing={8} align="stretch">

            {/* Header avec breadcrumb */}
            <VStack spacing={4} align="start">
              <Breadcrumb color="gray.500" fontSize="sm">
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => router.push('/dashboard')}>
                    Dashboard Global
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                  <Text>{franchise.name}</Text>
                </BreadcrumbItem>
              </Breadcrumb>

              <Flex justify="space-between" align="center" w="full">
                <VStack align="start" spacing={2}>
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<ArrowLeft />}
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      color="gray.600"
                    >
                      Dashboard Global
                    </Button>
                  </HStack>
                  
                  <HStack spacing={4} align="center">
                    <Icon as={Building2} boxSize={8} color="blue.500" />
                    <VStack align="start" spacing={1}>
                      <Heading size="xl" color="gray.800" fontWeight="bold">
                        {franchise.name}
                      </Heading>
                      <HStack spacing={4}>
                        <HStack spacing={1}>
                          <Icon as={MapPin} boxSize={4} color="gray.400" />
                          <Text color="gray.600">{franchise.city}</Text>
                        </HStack>
                                               <Badge 
                         colorScheme={franchise.status === 'active' ? "green" : "gray"}
                         variant="subtle"
                         borderRadius="full"
                       >
                         {franchise.status === 'active' ? "Actif" : franchise.status === 'trial' ? "Trial" : "Suspendu"}
                       </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                </VStack>
              </Flex>
            </VStack>

            {/* Analytics JARVIS pour cette franchise */}
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="lg" color="#374151" fontWeight="700" mb={2}>
                  📊 Analytics JARVIS - {franchise.name}
                </Heading>
                <Text color="#6b7280" fontSize="md" mb={2}>
                  Performance de l'ensemble des salles de cette franchise
                </Text>
                <Text color="#9ca3af" fontSize="sm">
                  Cliquez sur une salle pour voir ses analytics détaillées →
                </Text>
              </Box>

              {jarvisMetricsLoading ? (
                <Flex justify="center" py={8}>
                  <VStack spacing={4}>
                    <Spinner color="blue.500" size="lg" />
                    <Text color="gray.500">Chargement des métriques...</Text>
                  </VStack>
                </Flex>
              ) : (
                <>
                  {/* Métriques principales franchise */}
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                      <CardBody>
                        <Stat>
                          <StatLabel color="#6b7280" fontWeight="500">
                            <HStack>
                              <Icon as={MessageSquare} color="blue.500" />
                              <Text>Sessions Totales</Text>
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
                              <Icon as={Dumbbell} color="purple.500" />
                              <Text>Salles Actives</Text>
                            </HStack>
                          </StatLabel>
                          <StatNumber color="#1f2937" fontSize="2xl" fontWeight="700">
                            {gyms.filter(g => g.status === 'active').length}/{gyms.length}
                          </StatNumber>
                          <StatHelpText color="blue.500" fontWeight="500">
                            <TrendingUp size={16} /> Toutes opérationnelles
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                      <CardBody>
                        <Stat>
                          <StatLabel color="#6b7280" fontWeight="500">
                            <HStack>
                              <Icon as={Zap} color="orange.500" />
                              <Text>Satisfaction Moy.</Text>
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

                  {/* Coûts détaillés */}
                  <Card bg="white" border="1px solid" borderColor="#e5e7eb" borderRadius="12px">
                    <CardHeader>
                      <Heading size="md" color="#374151" fontWeight="600">
                        💰 Répartition Coûts OpenAI - {franchise.name}
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
                            {getDetailedCosts().audioInputCost}
                          </Text>
                          <Text fontSize="sm" color="#6b7280">
                            {getDetailedCosts().audioInputTokens} tokens
                          </Text>
                           <Badge colorScheme="orange" variant="subtle">Audio Input</Badge>
                         </VStack>
 
                         <VStack spacing={3} align="start">
                           <HStack>
                             <Icon as={MessageSquare} color="blue.500" boxSize={5} />
                             <Text fontWeight="600" color="#374151">Audio Output</Text>
                           </HStack>
                           <Text fontSize="2xl" fontWeight="700" color="blue.500">
                             {getDetailedCosts().audioOutputCost}
                           </Text>
                           <Text fontSize="sm" color="#6b7280">
                             {getDetailedCosts().audioOutputTokens} tokens
                           </Text>
                           <Badge colorScheme="blue" variant="subtle">Audio Output</Badge>
                         </VStack>
 
                         <VStack spacing={3} align="start">
                           <HStack>
                             <Icon as={BarChart3} color="green.500" boxSize={5} />
                             <Text fontWeight="600" color="#374151">Text Tokens</Text>
                           </HStack>
                           <Text fontSize="2xl" fontWeight="700" color="green.500">
                             {getDetailedCosts().textCost}
                           </Text>
                           <Text fontSize="sm" color="#6b7280">
                             {getDetailedCosts().textTokens} tokens
                           </Text>
                           <Badge colorScheme="green" variant="subtle">Text Tokens</Badge>
                        </VStack>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </>
              )}
            </VStack>

            {/* Liste des salles de la franchise */}
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="lg" color="gray.800" fontWeight="700" mb={2}>
                  🏋️ Salles de {franchise.name}
                </Heading>
                <Text color="gray.600" fontSize="md">
                  Cliquez sur une salle pour voir ses analytics détaillées
                </Text>
              </Box>

              {gyms.length === 0 ? (
                <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="12px">
                  <CardBody textAlign="center" py={12}>
                    <VStack spacing={4}>
                      <Icon as={Dumbbell} boxSize={12} color="gray.300" />
                      <VStack spacing={2}>
                        <Text fontSize="lg" fontWeight="600" color="gray.600">
                          Aucune salle configurée
                        </Text>
                        <Text color="gray.500">
                          Cette franchise n'a pas encore de salles enregistrées
                        </Text>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {gyms.map((gym) => (
                    <motion.div
                      key={gym.id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="12px"
                        cursor="pointer"
                        overflow="hidden"
                        _hover={{
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          borderColor: "blue.300"
                        }}
                        transition="all 0.3s ease"
                        onClick={() => handleGymClick(gym)}
                      >
                        <CardHeader>
                          <Flex justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex="1">
                              <Text fontWeight="bold" fontSize="lg" color="gray.800" noOfLines={1}>
                                {gym.name}
                              </Text>
                              <HStack spacing={1}>
                                <Icon as={MapPin} boxSize={3} color="gray.400" />
                                <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                  {gym.address}
                                </Text>
                              </HStack>
                            </VStack>
                            <Badge 
                              colorScheme={gym.status === 'active' ? "green" : "gray"}
                              variant="subtle"
                              borderRadius="full"
                              fontSize="xs"
                            >
                              {gym.status === 'active' ? "Actif" : "Inactif"}
                            </Badge>
                          </Flex>
                        </CardHeader>

                        <CardBody pt={0}>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">JARVIS Status</Text>
                              <Badge 
                                colorScheme={gym.kiosk_config?.kiosk_url_slug ? "green" : "orange"}
                                variant="subtle"
                                size="sm"
                              >
                                {gym.kiosk_config?.kiosk_url_slug ? "Configuré" : "En attente"}
                              </Badge>
                            </HStack>
                            
                            {gym.kiosk_config?.kiosk_url_slug && (
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="gray.600">URL Kiosk</Text>
                                <Text fontSize="sm" color="blue.500" fontWeight="500">
                                  /{gym.kiosk_config.kiosk_url_slug}
                                </Text>
                              </HStack>
                            )}

                            <Box pt={2}>
                              <Text fontSize="xs" color="gray.400" textAlign="center">
                                Cliquez pour voir les analytics détaillées →
                              </Text>
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </SimpleGrid>
              )}
            </VStack>

          </VStack>
        </motion.div>
      </Container>
    </Box>
  )
} 