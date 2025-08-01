"use client"
import { 
  Box, 
  Heading, 
  Text, 
  VStack,
  HStack,
  Icon,
  Button,
  SimpleGrid,
  Spinner,
  useToast
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Plus,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClientWithConfig } from '../../../lib/supabase-admin'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

// Utiliser les types de base de données réels avec gyms
interface Franchise {
  id: string
  name: string
  email: string
  address: string
  city: string
  postal_code: string
  phone: string
  owner_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  gyms?: {
    id: string
    name: string
    kiosk_config: { is_provisioned?: boolean } | null
    status: string
  }[]
}

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const toast = useToast()

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
    loadFranchises()
  }, [])

  const loadFranchises = async () => {
    try {
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

      if (error) throw error

      setFranchises(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des franchises:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les franchises",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

     const getFranchiseStats = (franchise: Franchise) => {
     const totalGyms = franchise.gyms?.length || 0
     const activeKiosks = franchise.gyms?.filter(gym => 
       gym.kiosk_config?.is_provisioned
     ).length || 0
     const pendingKiosks = franchise.gyms?.filter(gym => 
       gym.kiosk_config && !gym.kiosk_config.is_provisioned
     ).length || 0
     
     return { totalGyms, activeKiosks, pendingKiosks }
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
            Chargement des franchises...
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #eeeeee 100%)"
      fontFamily="system-ui, -apple-system, sans-serif"
      position="relative"
      p={8}
      overflow="hidden"
    >
      {/* Formes fluides arrière-plan comme page login */}
      <Box
        position="absolute"
        top="20%"
        right="15%"
        width="45%"
        height="55%"
        background="linear-gradient(225deg, rgba(107, 114, 128, 0.4) 0%, rgba(156, 163, 175, 0.3) 60%, rgba(209, 213, 219, 0.2) 100%)"
        borderRadius="40% 50% 30% 60%"
        filter="blur(2px)"
        transform="rotate(-15deg)"
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="10%"
        left="20%"
        width="50%"
        height="60%"
        background="linear-gradient(45deg, rgba(229, 231, 235, 0.5) 0%, rgba(243, 244, 246, 0.3) 100%)"
        borderRadius="60% 40% 50% 30%"
        filter="blur(1.5px)"
        transform="rotate(12deg)"
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
          <HStack justify="space-between" align="start">
            <VStack spacing={2} align="start">
              <Heading 
                size="xl" 
                color="black"
                fontWeight="400"
                letterSpacing="-0.5px"
              >
                Franchises
              </Heading>
              <Text 
                color="gray.600" 
                fontSize="lg"
                fontWeight="400"
              >
                {franchises.length} franchise{franchises.length > 1 ? 's' : ''} enregistrée{franchises.length > 1 ? 's' : ''}
              </Text>
            </VStack>

            <Button
              leftIcon={<Icon as={Plus} />}
              bg="black"
              color="white"
              size="lg"
              onClick={() => router.push('/admin/franchises/create')}
              _hover={{ 
                bg: "gray.900",
                transform: "translateY(-1px)",
                transition: "all 0.2s ease"
              }}
              _active={{ transform: "translateY(0)" }}
              borderRadius="2px"
              px={6}
              py={3}
              fontWeight="500"
              fontSize="sm"
            >
              Nouvelle franchise
            </Button>
          </HStack>
        </MotionBox>

        {/* Franchises Grid */}
        <MotionBox variants={itemVariants}>
          {franchises.length === 0 ? (
            <Box
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="2px"
              p={12}
              textAlign="center"
              shadow="0 1px 3px rgba(0, 0, 0, 0.06)"
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
                    Aucune franchise
                  </Text>
                  <Text fontSize="sm" color="gray.600" fontWeight="400">
                    Commencez par créer votre première franchise
                  </Text>
                </VStack>
                <Button
                  leftIcon={<Icon as={Plus} />}
                  bg="black"
                  color="white"
                  onClick={() => router.push('/admin/franchises/create')}
                  _hover={{ bg: "gray.900" }}
                  borderRadius="2px"
                  fontWeight="500"
                  fontSize="sm"
                >
                  Créer une franchise
                </Button>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {franchises.map((franchise, index) => {
                const stats = getFranchiseStats(franchise)
                
                return (
                  <MotionBox
                    key={franchise.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    cursor="pointer"
                    position="relative"
                    zIndex={2}
                  >
                    <Box
                      bg="rgba(255, 255, 255, 0.95)"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.2)"
                      borderRadius="20px"
                      p={6}
                      backdropFilter="blur(20px)"
                      shadow="0 8px 32px rgba(0, 0, 0, 0.12)"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.98)",
                        shadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                        transition: "all 0.3s ease"
                      }}
                      position="relative"
                      h="280px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                    >
                      <VStack spacing={4} align="start">
                        {/* Header */}
                        <HStack justify="space-between" w="full">
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
                              <Text 
                                fontSize="lg" 
                                fontWeight="500" 
                                color="black"
                                lineHeight="1.2"
                              >
                                {franchise.name}
                                                             </Text>
                               <Text 
                                 fontSize="sm" 
                                 color="gray.600"
                                 fontWeight="400"
                               >
                                 {franchise.email}
                               </Text>
                            </VStack>
                          </HStack>
                          
                          <Icon as={ArrowRight} color="gray.400" boxSize={4} />
                        </HStack>

                        {/* Stats */}
                        <HStack spacing={6} w="full">
                          <VStack spacing={1} align="start">
                            <Text fontSize="xl" fontWeight="600" color="black">
                              {stats.totalGyms}
                            </Text>
                            <Text fontSize="xs" color="gray.500" fontWeight="400">
                              Salle{stats.totalGyms > 1 ? 's' : ''}
                            </Text>
                          </VStack>
                          
                          <VStack spacing={1} align="start">
                            <Text fontSize="xl" fontWeight="600" color="black">
                              {stats.activeKiosks}
                            </Text>
                            <Text fontSize="xs" color="gray.500" fontWeight="400">
                              Actif{stats.activeKiosks > 1 ? 's' : ''}
                            </Text>
                          </VStack>
                          
                          {stats.pendingKiosks > 0 && (
                            <VStack spacing={1} align="start">
                              <HStack spacing={1}>
                                <Text fontSize="xl" fontWeight="600" color="black">
                                  {stats.pendingKiosks}
                                </Text>
                                <Box
                                  w={1.5}
                                  h={1.5}
                                  bg="gray.900"
                                  borderRadius="50%"
                                />
                              </HStack>
                              <Text fontSize="xs" color="gray.500" fontWeight="400">
                                En attente
                              </Text>
                            </VStack>
                          )}
                        </HStack>

                        {/* Boutons d'action directe */}
                        <VStack spacing={2} w="full" pt={2}>
                          <Button
                            w="full"
                            size="sm"
                            bg="black"
                            color="white"
                            borderRadius="12px"
                            fontWeight="500"
                            _hover={{ bg: "gray.800" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/franchises/${franchise.id}`)
                            }}
                            leftIcon={<Icon as={ArrowRight} boxSize={4} />}
                          >
                            Gérer la franchise
                          </Button>
                          
                          {franchise.gyms && franchise.gyms.length > 0 && (
                            <Button
                              w="full"
                              size="sm"
                              variant="outline"
                              borderColor="gray.200"
                              color="gray.700"
                              borderRadius="12px"
                              fontWeight="500"
                              _hover={{ bg: "gray.50", borderColor: "gray.300" }}
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admin/franchises/${franchise.id}#salles`)
                              }}
                              leftIcon={<Icon as={Building2} boxSize={4} />}
                            >
                              Voir les {stats.totalGyms} salle{stats.totalGyms > 1 ? 's' : ''}
                            </Button>
                          )}
                        </VStack>
                      </VStack>
                    </Box>
                  </MotionBox>
                )
              })}
            </SimpleGrid>
          )}
        </MotionBox>
      </MotionVStack>
    </Box>
  )
} 