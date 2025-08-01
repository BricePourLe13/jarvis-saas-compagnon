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
    kiosk_config: unknown
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
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
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
                      scale: 1.01,
                      transition: { duration: 0.2 }
                    }}
                    cursor="pointer"
                    onClick={() => router.push(`/admin/franchises/${franchise.id}`)}
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

                                                                          {/* Gyms preview */}
                         {franchise.gyms && franchise.gyms.length > 0 && (
                           <VStack spacing={2} align="start" w="full">
                             <Text fontSize="xs" color="gray.500" fontWeight="500">
                               SALLES
                             </Text>
                             <VStack spacing={1} align="start" w="full">
                               {franchise.gyms.slice(0, 3).map((gym) => (
                                 <HStack key={gym.id} spacing={2} w="full">
                                   <Box
                                     w={1}
                                     h={1}
                                     bg={gym.kiosk_config?.is_provisioned ? "gray.900" : "gray.400"}
                                     borderRadius="50%"
                                     flexShrink={0}
                                   />
                                   <Text fontSize="xs" color="gray.600" fontWeight="400">
                                     {gym.name}
                                   </Text>
                                 </HStack>
                               ))}
                               {franchise.gyms.length > 3 && (
                                 <Text fontSize="xs" color="gray.500" fontWeight="400">
                                   +{franchise.gyms.length - 3} autres...
                                 </Text>
                               )}
                             </VStack>
                           </VStack>
                         )}
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