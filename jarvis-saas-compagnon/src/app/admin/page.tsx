"use client"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Button,
  Badge,
  Flex,
  Spinner,
  useToast
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  Dumbbell, 
  Users, 
  Activity, 
  Plus,
  BarChart3,
  Settings,
  Zap,
  TrendingUp,
  ArrowRight,
  Clock
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClientWithConfig } from '../../lib/supabase-admin'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)
const MotionVStack = motion(VStack)

interface AdminStats {
  totalFranchises: number
  totalGyms: number
  totalActiveKiosks: number
  todaySessions: number
  pendingProvisioning: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalFranchises: 0,
    totalGyms: 0,
    totalActiveKiosks: 0,
    todaySessions: 0,
    pendingProvisioning: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const toast = useToast()

  // Animations subtiles premium
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
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const supabase = createBrowserClientWithConfig()

      // Charger les statistiques en parallèle
      const [franchisesResponse, gymsResponse] = await Promise.all([
        supabase.from('franchises').select('id'),
        supabase.from('gyms').select('id, kiosk_config')
      ])

      const totalFranchises = franchisesResponse.data?.length || 0
      const totalGyms = gymsResponse.data?.length || 0
      
      // Calculer les kiosks actifs et en attente de provisioning
      const gyms = gymsResponse.data || []
      const totalActiveKiosks = gyms.filter(gym => 
        gym.kiosk_config && gym.kiosk_config.is_provisioned
      ).length
      
      const pendingProvisioning = gyms.filter(gym => 
        gym.kiosk_config && !gym.kiosk_config.is_provisioned
      ).length

      setStats({
        totalFranchises,
        totalGyms,
        totalActiveKiosks,
        todaySessions: 0, // À implémenter plus tard
        pendingProvisioning
      })
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      label: 'Franchises',
      value: stats.totalFranchises,
      icon: Building2,
      action: () => router.push('/admin/franchises')
    },
    {
      label: 'Salles',
      value: stats.totalGyms,
      icon: Dumbbell,
      action: () => router.push('/admin/franchises')
    },
    {
      label: 'Kiosks actifs',
      value: stats.totalActiveKiosks,
      icon: Zap,
      action: () => router.push('/admin/franchises')
    },
    {
      label: 'En attente',
      value: stats.pendingProvisioning,
      icon: Clock,
      action: () => router.push('/admin/franchises'),
      highlight: stats.pendingProvisioning > 0
    }
  ]

  const quickActions = [
    {
      label: 'Nouvelle franchise',
      description: 'Créer une nouvelle franchise',
      icon: Plus,
      action: () => router.push('/admin/franchises/create')
    },
    {
      label: 'Voir les franchises',
      description: 'Gérer les franchises existantes',
      icon: Building2,
      action: () => router.push('/admin/franchises')
    },
    {
      label: 'Gestion équipe',
      description: 'Inviter et gérer les administrateurs',
      icon: Users,
      action: () => router.push('/admin/team')
    },
    {
      label: 'Analytics',
      description: 'Voir les statistiques détaillées',
      icon: BarChart3,
      action: () => toast({
        title: "Bientôt disponible",
        description: "Les analytics arrivent prochainement",
        status: "info",
        duration: 3000,
      }),
      disabled: true
    }
  ]

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

  return (
    <Box 
      minH="100vh" 
      bg="white"
      fontFamily="system-ui, -apple-system, sans-serif"
      position="relative"
      p={8}
    >
      {/* Pattern de points subtil en arrière-plan */}
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
        spacing={12}
        align="stretch"
        maxW="1200px"
        mx="auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <MotionBox variants={itemVariants}>
          <VStack spacing={2} align="start">
            <Heading 
              size="xl" 
              color="black"
              fontWeight="400"
              letterSpacing="-0.5px"
              fontFamily="system-ui"
            >
              Administration
            </Heading>
            <Text 
              color="gray.600" 
              fontSize="lg"
              fontWeight="400"
            >
              Gestion de la plateforme JARVIS
            </Text>
          </VStack>
        </MotionBox>

        {/* Stats Grid */}
        <MotionBox variants={itemVariants}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
            {statsCards.map((stat, index) => (
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
                cursor="pointer"
                onClick={stat.action}
              >
                <Box
                  bg="white"
                  border="1px solid"
                  borderColor={stat.highlight ? "gray.400" : "gray.200"}
                  borderRadius="2px"
                  p={6}
                  shadow="0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)"
                  position="relative"
                  _hover={{
                    borderColor: "gray.300",
                    transition: "all 0.2s ease"
                  }}
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
                    <HStack justify="space-between" w="full">
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
                      {stat.highlight && (
                        <Box
                          w={2}
                          h={2}
                          bg="gray.900"
                          borderRadius="50%"
                        />
                      )}
                    </HStack>
                    
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
                    </VStack>
                  </VStack>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>

        {/* Quick Actions */}
        <MotionBox variants={itemVariants}>
          <VStack spacing={6} align="start">
            <Heading 
              size="lg" 
              color="black"
              fontWeight="400"
              letterSpacing="-0.5px"
            >
              Actions rapides
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full">
              {quickActions.map((action, index) => (
                <MotionBox
                  key={action.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: action.disabled ? 1 : 1.01,
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
                    cursor={action.disabled ? "not-allowed" : "pointer"}
                    opacity={action.disabled ? 0.6 : 1}
                    onClick={action.disabled ? undefined : action.action}
                    _hover={action.disabled ? {} : {
                      borderColor: "gray.300",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <HStack spacing={4} align="start">
                      <Box
                        w={10}
                        h={10}
                        bg={action.disabled ? "gray.300" : "black"}
                        borderRadius="2px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={action.icon} color="white" boxSize={5} />
                      </Box>
                      
                      <VStack spacing={1} align="start" flex="1">
                        <Text 
                          fontSize="md" 
                          fontWeight="500" 
                          color="black"
                        >
                          {action.label}
                        </Text>
                        <Text 
                          fontSize="sm" 
                          color="gray.600"
                          fontWeight="400"
                        >
                          {action.description}
                        </Text>
                      </VStack>
                      
                      {!action.disabled && (
                        <Icon as={ArrowRight} color="gray.400" boxSize={4} />
                      )}
                    </HStack>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
        </MotionBox>
      </MotionVStack>
    </Box>
  )
}
