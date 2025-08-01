'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  VStack,
  HStack,
  Button,
  Icon,
  Heading,
  Text,
  Badge,
  useToast,
  SimpleGrid,
  Spinner
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
  Zap,
  Plus
} from 'lucide-react'
import type { Gym, Franchise } from '../../../../types/franchise'
import { createBrowserClientWithConfig } from '../../../../lib/supabase-admin'
import { getRealTimeMetrics, formatCurrency } from '../../../../lib/openai-cost-tracker'

// Utiliser les types de base de données réels
type DatabaseFranchise = {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  email: string
  phone: string
  owner_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

export default function FranchiseAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  
  const franchiseId = params.id as string
  const [franchise, setFranchise] = useState<DatabaseFranchise | null>(null)
  const [gyms, setGyms] = useState<Gym[]>([])
  const [metrics, setMetrics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  // Animations subtiles
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.23, 1, 0.32, 1] 
      }
    }
  }

  useEffect(() => {
    if (franchiseId) {
      loadFranchiseData()
    }
  }, [franchiseId])

  const loadFranchiseData = async () => {
    try {
      const supabase = createBrowserClientWithConfig()

             // Charger la franchise avec ses gyms
       const { data: franchiseData, error: franchiseError } = await supabase
         .from('franchises')
         .select(`
           *,
           gyms (
             id,
             name,
             address,
             city,
             status,
             kiosk_config,
             created_at
           )
         `)
         .eq('id', franchiseId)
         .single()

       if (franchiseError) {
         console.error('Erreur Supabase:', franchiseError)
         throw new Error(franchiseError.message || 'Erreur de base de données')
       }

       setFranchise(franchiseData)
       setGyms(franchiseData.gyms || [])

      // Charger les métriques en temps réel
      const realTimeMetrics = await getRealTimeMetrics()
      setMetrics(realTimeMetrics)

    } catch (error) {
      console.error('Erreur chargement franchise:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la franchise",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

     const getGymsStats = () => {
     const totalGyms = gyms.length
     const activeGyms = gyms.filter(gym => gym.status === 'active').length
     const totalMembers = 0 // Pas de member_count dans la table gyms
     const kioskProvisioned = gyms.filter(gym => gym.kiosk_config?.is_provisioned).length
     
     return { totalGyms, activeGyms, totalMembers, kioskProvisioned }
   }

  if (loading) {
    return (
      <Box 
        minH="100vh" 
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <VStack spacing={4}>
          <Spinner size="lg" color="gray.600" />
          <Text color="gray.600" fontSize="sm" fontWeight="400">
            Chargement des données...
          </Text>
        </VStack>
      </Box>
    )
  }

  if (!franchise) {
    return (
      <Box 
        minH="100vh" 
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <VStack spacing={4}>
          <Box
            w={12}
            h={12}
            bg="gray.100"
            borderRadius="2px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={Building2} color="gray.400" boxSize={6} />
          </Box>
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="500" color="black">
              Franchise non trouvée
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="400">
              Cette franchise n'existe pas ou n'est plus accessible
            </Text>
          </VStack>
          <Button
            leftIcon={<ArrowLeft size={16} />}
            bg="black"
            color="white"
            onClick={() => router.push('/admin/franchises')}
            _hover={{ bg: "gray.900" }}
            borderRadius="2px"
            fontWeight="500"
            fontSize="sm"
          >
            Retour aux franchises
          </Button>
        </VStack>
      </Box>
    )
  }

  const stats = getGymsStats()

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #eeeeee 100%)"
      fontFamily="system-ui, -apple-system, sans-serif"
      position="relative"
      p={8}
      overflow="hidden"
    >
      {/* Formes fluides arrière-plan */}
      <Box
        position="absolute"
        top="15%"
        right="10%"
        width="40%"
        height="50%"
        background="linear-gradient(225deg, rgba(107, 114, 128, 0.3) 0%, rgba(156, 163, 175, 0.2) 60%, rgba(209, 213, 219, 0.1) 100%)"
        borderRadius="40% 50% 30% 60%"
        filter="blur(2px)"
        transform="rotate(-8deg)"
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="20%"
        left="15%"
        width="35%"
        height="45%"
        background="linear-gradient(45deg, rgba(229, 231, 235, 0.4) 0%, rgba(243, 244, 246, 0.2) 100%)"
        borderRadius="60% 40% 50% 30%"
        filter="blur(1.5px)"
        transform="rotate(5deg)"
        zIndex={0}
      />
      
      {/* Pattern de points subtil */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.02}
        bgImage="radial-gradient(circle, black 1px, transparent 1px)"
        bgSize="24px 24px"
        pointerEvents="none"
        zIndex={1}
      />

      <MotionVStack
        spacing={12}
        align="stretch"
        maxW="1400px"
        mx="auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        position="relative"
        zIndex={2}
      >
        {/* Header moderne avec navigation et informations clés */}
        <MotionBox variants={itemVariants}>
          <Box
            bg="rgba(255, 255, 255, 0.95)"
            borderRadius="24px"
            p={8}
            backdropFilter="blur(20px)"
            shadow="0 8px 32px rgba(0, 0, 0, 0.12)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
          >
            <VStack spacing={6} align="start">
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => router.push('/admin/franchises')}
                color="gray.600"
                fontSize="sm"
                fontWeight="500"
                px={4}
                py={3}
                h="auto"
                borderRadius="12px"
                _hover={{ 
                  color: 'black', 
                  bg: 'gray.50',
                  transform: 'translateX(-2px)',
                  transition: "all 0.2s ease"
                }}
              >
                Retour aux franchises
              </Button>
              
              <HStack spacing={6} w="full" align="start">
                {/* Informations principales */}
                <HStack spacing={4} flex="1">
                  <Box
                    w={16}
                    h={16}
                    bg="linear-gradient(135deg, #1a1a1a 0%, #404040 100%)"
                    borderRadius="20px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    shadow="0 8px 24px rgba(0, 0, 0, 0.15)"
                  >
                    <Icon as={Building2} color="white" boxSize={8} />
                  </Box>
                  <VStack spacing={2} align="start" flex="1">
                    <Heading 
                      size="2xl" 
                      color="black"
                      fontWeight="600"
                      letterSpacing="-0.5px"
                    >
                      {franchise.name}
                    </Heading>
                    <HStack spacing={4} divider={<Box w="1px" h="4" bg="gray.300" />}>
                      <HStack spacing={2}>
                        <Icon as={MapPin} color="gray.500" boxSize={4} />
                        <Text color="gray.600" fontSize="sm" fontWeight="500">
                          {franchise.city}
                        </Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Icon as={Mail} color="gray.500" boxSize={4} />
                        <Text color="gray.600" fontSize="sm" fontWeight="500">
                          {franchise.email}
                        </Text>
                      </HStack>
                      {franchise.phone && (
                        <HStack spacing={2}>
                          <Icon as={Phone} color="gray.500" boxSize={4} />
                          <Text color="gray.600" fontSize="sm" fontWeight="500">
                            {franchise.phone}
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
                
                {/* Actions rapides */}
                <VStack spacing={3}>
                  <Button
                    size="sm"
                    bg="black"
                    color="white"
                    borderRadius="12px"
                    fontWeight="500"
                    _hover={{ bg: "gray.800" }}
                    leftIcon={<Icon as={Plus} boxSize={4} />}
                    onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/create`)}
                  >
                    Nouvelle salle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="gray.200"
                    borderRadius="12px"
                    fontWeight="500"
                    _hover={{ bg: "gray.50" }}
                  >
                    Modifier franchise
                  </Button>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </MotionBox>

        {/* Stats en cartes modernes */}
        <MotionBox variants={itemVariants}>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
            {[
              { 
                label: 'Salles totales', 
                value: stats.totalGyms, 
                icon: Dumbbell, 
                color: '#374151',
                bg: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
              },
              { 
                label: 'Salles actives', 
                value: stats.activeGyms, 
                icon: Activity, 
                color: '#1f2937',
                bg: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)'
              },
              { 
                label: 'Kiosks actifs', 
                value: stats.kioskProvisioned, 
                icon: Zap, 
                color: '#111827',
                bg: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)'
              },
              { 
                label: 'Membres totaux', 
                value: stats.totalMembers, 
                icon: Users, 
                color: '#4b5563',
                bg: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
              }
            ].map((stat, index) => (
              <MotionBox
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.23, 1, 0.32, 1]
                }}
                whileHover={{ 
                  y: -4,
                  transition: { duration: 0.2 }
                }}
              >
                <Box
                  bg={stat.bg}
                  borderRadius="20px"
                  p={6}
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  shadow="0 4px 16px rgba(0, 0, 0, 0.08)"
                  _hover={{
                    shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    transition: "all 0.3s ease"
                  }}
                >
                  <VStack spacing={4} align="start">
                    <Box
                      w={12}
                      h={12}
                      bg={stat.color}
                      borderRadius="16px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      shadow="0 4px 12px rgba(0, 0, 0, 0.15)"
                    >
                      <Icon as={stat.icon} color="white" boxSize={6} />
                    </Box>
                    
                    <VStack spacing={1} align="start">
                      <Text 
                        fontSize="3xl" 
                        fontWeight="800" 
                        color="black"
                        lineHeight="1"
                      >
                        {stat.value}
                      </Text>
                      <Text 
                        fontSize="sm" 
                        color="gray.700"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        {stat.label}
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>

        {/* Section Salles - Plus prominente et intuitive */}
        <MotionBox variants={itemVariants}>
          <Box
            bg="rgba(255, 255, 255, 0.95)"
            borderRadius="24px"
            p={8}
            backdropFilter="blur(20px)"
            shadow="0 8px 32px rgba(0, 0, 0, 0.12)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
          >
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color="black" fontWeight="600">
                    Salles de sport ({gyms.length})
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Gérez et surveillez toutes les salles de cette franchise
                  </Text>
                </VStack>
                <Button
                  leftIcon={<Icon as={Plus} />}
                  bg="black"
                  color="white"
                  borderRadius="16px"
                  fontWeight="500"
                  px={6}
                  _hover={{ 
                    bg: "gray.800",
                    transform: "translateY(-1px)"
                  }}
                  onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/create`)}
                >
                  Ajouter une salle
                </Button>
              </HStack>

              {gyms.length === 0 ? (
                <VStack spacing={4} py={12}>
                  <Box
                    w={16}
                    h={16}
                    bg="gray.100"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={Dumbbell} color="gray.400" boxSize={8} />
                  </Box>
                  <VStack spacing={2}>
                    <Text fontSize="lg" fontWeight="600" color="black">
                      Aucune salle configurée
                    </Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Commencez par créer votre première salle de sport pour cette franchise
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                  {gyms.map((gym, index) => (
                    <MotionBox
                      key={gym.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.1,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      whileHover={{ 
                        y: -4,
                        transition: { duration: 0.2 }
                      }}
                      cursor="pointer"
                      onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/${gym.id}`)}
                    >
                      <Box
                        bg="white"
                        borderRadius="20px"
                        p={6}
                        border="1px solid"
                        borderColor="gray.100"
                        shadow="0 4px 16px rgba(0, 0, 0, 0.06)"
                        _hover={{
                          shadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
                          borderColor: "gray.200",
                          transition: "all 0.3s ease"
                        }}
                        position="relative"
                        h="200px"
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                      >
                        {/* Header salle */}
                        <VStack spacing={3} align="start">
                          <HStack justify="space-between" w="full">
                            <Box
                              w={12}
                              h={12}
                              bg="linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                              borderRadius="16px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              shadow="0 4px 12px rgba(0, 0, 0, 0.15)"
                            >
                              <Icon as={Dumbbell} color="white" boxSize={6} />
                            </Box>
                            <Badge
                              colorScheme={gym.status === 'active' ? 'green' : 'orange'}
                              variant="subtle"
                              borderRadius="8px"
                              px={3}
                              py={1}
                              fontSize="xs"
                              fontWeight="600"
                            >
                              {gym.status === 'active' ? 'ACTIF' : 'MAINTENANCE'}
                            </Badge>
                          </HStack>
                          
                          <VStack spacing={1} align="start" w="full">
                            <Text fontSize="lg" fontWeight="600" color="black" noOfLines={1}>
                              {gym.name}
                            </Text>
                            <HStack spacing={2}>
                              <Icon as={MapPin} color="gray.500" boxSize={4} />
                              <Text fontSize="sm" color="gray.600" noOfLines={1}>
                                {gym.city}
                              </Text>
                            </HStack>
                          </VStack>
                        </VStack>

                        {/* Status JARVIS */}
                        <HStack spacing={3} w="full">
                          <HStack spacing={2} flex="1">
                            <Box
                              w="8px"
                              h="8px"
                              bg={gym.kiosk_config?.is_provisioned ? "#10b981" : "#f59e0b"}
                              borderRadius="full"
                            />
                            <Text fontSize="xs" color="gray.600" fontWeight="500">
                              JARVIS {gym.kiosk_config?.is_provisioned ? 'Actif' : 'En attente'}
                            </Text>
                          </HStack>
                          <Button
                            size="sm"
                            variant="ghost"
                            color="gray.600"
                            fontSize="xs"
                            fontWeight="500"
                            px={3}
                            py={2}
                            h="auto"
                            borderRadius="8px"
                            _hover={{ bg: "gray.50" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/franchises/${franchiseId}/gyms/${gym.id}`)
                            }}
                          >
                            Gérer →
                          </Button>
                        </HStack>
                      </Box>
                    </MotionBox>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </Box>
        </MotionBox>




      </MotionVStack>
    </Box>
  )
} 