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
import { createClient } from '../../../../lib/supabase-simple'
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
      const supabase = createClient()

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
      bg="white"
      fontFamily="system-ui, -apple-system, sans-serif"
      position="relative"
      p={8}
    >
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
      />

      <MotionVStack
        spacing={10}
        align="stretch"
        maxW="1200px"
        mx="auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <MotionBox variants={itemVariants}>
          <VStack spacing={6} align="start">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => router.push('/admin/franchises')}
              color="gray.600"
              fontSize="sm"
              fontWeight="400"
              px={3}
              py={2}
              h="auto"
              borderRadius="2px"
              _hover={{ 
                color: 'black', 
                bg: 'gray.50',
                transition: "all 0.15s ease"
              }}
            >
              Retour aux franchises
            </Button>
            
            <VStack spacing={2} align="start">
              <HStack spacing={3}>
                <Box
                  w={10}
                  h={10}
                  bg="black"
                  borderRadius="2px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={Building2} color="white" boxSize={5} />
                </Box>
                <VStack spacing={0} align="start">
                  <Heading 
                    size="xl" 
                    color="black"
                    fontWeight="400"
                    letterSpacing="-0.5px"
                  >
                    {franchise.name}
                  </Heading>
                  <Text 
                    color="gray.600" 
                    fontSize="lg"
                    fontWeight="400"
                  >
                    Gestion et analytics de la franchise
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </VStack>
        </MotionBox>

        {/* Stats principales */}
        <MotionBox variants={itemVariants}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
            {[
              { label: 'Salles totales', value: stats.totalGyms, icon: Dumbbell, description: 'Salles créées' },
              { label: 'Salles actives', value: stats.activeGyms, icon: Activity, description: 'Salles opérationnelles' },
              { label: 'Membres totaux', value: stats.totalMembers, icon: Users, description: 'Membres inscrits' },
              { label: 'Kiosks actifs', value: stats.kioskProvisioned, icon: Zap, description: 'Kiosks provisionnés' }
            ].map((stat, index) => (
              <MotionBox
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.23, 1, 0.32, 1]
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="2px"
                  p={6}
                  shadow="0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)"
                  _hover={{
                    borderColor: "gray.300",
                    transition: "all 0.2s ease"
                  }}
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    bg: 'linear-gradient(90deg, transparent, gray.100, transparent)',
                  }}
                >
                  <VStack spacing={4} align="start">
                    <Box
                      w={10}
                      h={10}
                      bg="black"
                      borderRadius="2px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={stat.icon} color="white" boxSize={5} />
                    </Box>
                    
                    <VStack spacing={1} align="start">
                      <Text 
                        fontSize="2xl" 
                        fontWeight="600" 
                        color="black"
                        lineHeight="1"
                      >
                        {stat.value}
                      </Text>
                      <Text 
                        fontSize="sm" 
                        color="gray.600"
                        fontWeight="400"
                      >
                        {stat.label}
                      </Text>
                      <Text 
                        fontSize="xs" 
                        color="gray.500"
                        fontWeight="400"
                      >
                        {stat.description}
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>

        {/* Informations de contact */}
        <MotionBox variants={itemVariants}>
          <VStack spacing={6} align="start">
            <Heading 
              size="lg" 
              color="black"
              fontWeight="400"
              letterSpacing="-0.5px"
            >
              Informations de contact
            </Heading>
            
            <Box
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="2px"
              p={6}
              shadow="0 1px 3px rgba(0, 0, 0, 0.06)"
              w="full"
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <VStack spacing={3} align="start">
                  <HStack spacing={3}>
                    <Icon as={Mail} color="gray.600" boxSize={4} />
                    <Text fontSize="sm" color="gray.900" fontWeight="500">
                      Email de contact
                    </Text>
                  </HStack>
                                     <Text fontSize="sm" color="gray.600" fontWeight="400" ml={7}>
                     {franchise.email}
                   </Text>
                </VStack>

                                 <VStack spacing={3} align="start">
                   <HStack spacing={3}>
                     <Icon as={Phone} color="gray.600" boxSize={4} />
                     <Text fontSize="sm" color="gray.900" fontWeight="500">
                       Téléphone
                     </Text>
                   </HStack>
                   <Text fontSize="sm" color="gray.600" fontWeight="400" ml={7}>
                     {franchise.phone || 'Non renseigné'}
                   </Text>
                 </VStack>
              </SimpleGrid>
            </Box>
          </VStack>
        </MotionBox>

        {/* Liste des salles */}
        <MotionBox variants={itemVariants}>
          <VStack spacing={6} align="start">
            <HStack justify="space-between" w="full">
              <Heading 
                size="lg" 
                color="black"
                fontWeight="400"
                letterSpacing="-0.5px"
              >
                Salles ({gyms.length})
              </Heading>
              
              <Button
                leftIcon={<Icon as={Plus} />}
                bg="black"
                color="white"
                size="md"
                onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/create`)}
                _hover={{ 
                  bg: "gray.900",
                  transform: "translateY(-1px)",
                  transition: "all 0.2s ease"
                }}
                _active={{ transform: "translateY(0)" }}
                borderRadius="2px"
                px={4}
                py={2}
                fontWeight="500"
                fontSize="sm"
              >
                Nouvelle salle
              </Button>
            </HStack>
            
                                                                  {gyms.length === 0 ? (
               <Box
                 bg="white"
                 border="1px solid"
                 borderColor="gray.200"
                 borderRadius="2px"
                 p={12}
                 textAlign="center"
                 shadow="0 1px 3px rgba(0, 0, 0, 0.06)"
                 w="full"
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
                     <Icon as={Dumbbell} color="gray.400" boxSize={6} />
                   </Box>
                   <VStack spacing={2}>
                     <Text fontSize="lg" fontWeight="500" color="black">
                       Aucune salle
                     </Text>
                     <Text fontSize="sm" color="gray.600" fontWeight="400">
                       Commencez par créer la première salle de cette franchise
                     </Text>
                   </VStack>
                   <Button
                     leftIcon={<Icon as={Plus} />}
                     bg="black"
                     color="white"
                     onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/create`)}
                     _hover={{ bg: "gray.900" }}
                     borderRadius="2px"
                     fontWeight="500"
                     fontSize="sm"
                   >
                     Créer une salle
                   </Button>
                 </VStack>
               </Box>
             ) : (
               <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} w="full">
                 {gyms.map((gym, index) => (
                   <MotionBox
                     key={gym.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ 
                       duration: 0.4, 
                       delay: index * 0.1,
                       ease: "easeOut"
                     }}
                     whileHover={{ 
                       scale: 1.01,
                       transition: { duration: 0.15 }
                     }}
                   >
                     <Box
                       bg="white"
                       border="1px solid"
                       borderColor="gray.200"
                       borderRadius="2px"
                       p={6}
                       shadow="0 1px 3px rgba(0, 0, 0, 0.06)"
                       cursor="pointer"
                       onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/${gym.id}`)}
                       _hover={{
                         borderColor: "gray.300",
                         transition: "all 0.2s ease"
                       }}
                     >
                       <VStack spacing={4} align="start">
                         <HStack justify="space-between" w="full">
                           <HStack spacing={3}>
                             <Box
                               w={8}
                               h={8}
                               bg="black"
                               borderRadius="2px"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                             >
                               <Icon as={Dumbbell} color="white" boxSize={4} />
                             </Box>
                             <VStack spacing={0} align="start">
                               <Text 
                                 fontSize="md" 
                                 fontWeight="500" 
                                 color="black"
                               >
                                 {gym.name}
                               </Text>
                               <Text 
                                 fontSize="xs" 
                                 color="gray.600"
                                 fontWeight="400"
                               >
                                 {gym.address || 'Adresse non renseignée'}
                               </Text>
                             </VStack>
                           </HStack>
                           
                           <Badge 
                             bg={gym.status === 'active' ? 'gray.900' : 'gray.300'}
                             color={gym.status === 'active' ? 'white' : 'gray.600'}
                             borderRadius="2px"
                             px={2}
                             py={1}
                             fontSize="xs"
                             fontWeight="400"
                           >
                             {gym.status === 'active' ? 'Actif' : 'Inactif'}
                           </Badge>
                         </HStack>

                         <SimpleGrid columns={2} gap={4} w="full">
                           <VStack spacing={1} align="start">
                             <HStack spacing={1}>
                               <Text fontSize="lg" fontWeight="600" color="black">
                                 {gym.kiosk_config?.is_provisioned ? '1' : '0'}
                               </Text>
                               {gym.kiosk_config?.is_provisioned && (
                                 <Box
                                   w={1}
                                   h={1}
                                   bg="gray.900"
                                   borderRadius="50%"
                                 />
                               )}
                             </HStack>
                             <Text fontSize="xs" color="gray.500" fontWeight="400">
                               Kiosk
                             </Text>
                           </VStack>
                           
                           <VStack spacing={1} align="start">
                             <Text fontSize="lg" fontWeight="600" color="black">
                               {new Date(gym.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                             </Text>
                             <Text fontSize="xs" color="gray.500" fontWeight="400">
                               Créée
                             </Text>
                           </VStack>
                         </SimpleGrid>
                       </VStack>
                     </Box>
                   </MotionBox>
                 ))}
               </SimpleGrid>
             )}
          </VStack>
        </MotionBox>
      </MotionVStack>
    </Box>
  )
} 