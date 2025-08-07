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
  Clock,
  Wifi,
  WifiOff,
  DollarSign,
  AlertTriangle,
  Monitor,
  Eye
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

interface MonitoringStats {
  activeSessions: number
  onlineKiosks: number
  offlineKiosks: number
  todayCosts: number
  recentErrors: number
  avgSessionDuration: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalFranchises: 0,
    totalGyms: 0,
    totalActiveKiosks: 0,
    todaySessions: 0,
    pendingProvisioning: 0
  })
  const [monitoring, setMonitoring] = useState<MonitoringStats>({
    activeSessions: 0,
    onlineKiosks: 0,
    offlineKiosks: 0,
    todayCosts: 0,
    recentErrors: 0,
    avgSessionDuration: 0
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
    loadMonitoring()
    
    // Refresh monitoring toutes les 30 secondes
    const interval = setInterval(loadMonitoring, 30000)
    return () => clearInterval(interval)
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

  const loadMonitoring = async () => {
    try {
      const supabase = createBrowserClientWithConfig()

      // Charger les sessions actives (dernière heure)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('openai_realtime_sessions')
        .select('id, session_start, session_end, cost_usd, gym_id')
        .gte('session_start', oneHourAgo)

      if (sessionsError) {
        console.warn('Erreur sessions:', sessionsError)
      }

      const activeSessions = sessions?.filter(s => !s.session_end).length || 0
      const todaySessions = sessions?.length || 0
      const todayCosts = sessions?.reduce((sum, s) => sum + (s.cost_usd || 0), 0) || 0
      const avgSessionDuration = sessions?.length ? 
        sessions.reduce((sum, s) => {
          if (s.session_end) {
            const duration = new Date(s.session_end).getTime() - new Date(s.session_start).getTime()
            return sum + duration / 1000 / 60 // en minutes
          }
          return sum
        }, 0) / sessions.filter(s => s.session_end).length : 0

      // Simuler status kiosks (à améliorer plus tard)
      const onlineKiosks = stats.totalActiveKiosks
      const offlineKiosks = 0

      setMonitoring({
        activeSessions,
        onlineKiosks,
        offlineKiosks,
        todayCosts: Math.round(todayCosts * 100) / 100,
        recentErrors: 0, // À implémenter
        avgSessionDuration: Math.round(avgSessionDuration * 10) / 10
      })

      // Mettre à jour aussi todaySessions dans stats
      setStats(prev => ({ ...prev, todaySessions }))

    } catch (error) {
      console.error('Erreur monitoring:', error)
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

  const monitoringCards = [
    {
      label: 'Sessions actives',
      value: monitoring.activeSessions,
      icon: Activity,
      color: monitoring.activeSessions > 0 ? 'green' : 'gray',
      action: () => router.push('/admin/monitoring')
    },
    {
      label: 'Kiosks en ligne',
      value: `${monitoring.onlineKiosks}/${monitoring.onlineKiosks + monitoring.offlineKiosks}`,
      icon: monitoring.offlineKiosks > 0 ? WifiOff : Wifi,
      color: monitoring.offlineKiosks > 0 ? 'red' : 'green',
      action: () => router.push('/admin/monitoring'),
      highlight: monitoring.offlineKiosks > 0
    },
    {
      label: 'Coûts aujourd\'hui',
      value: `$${monitoring.todayCosts}`,
      icon: DollarSign,
      color: 'blue',
      action: () => router.push('/admin/monitoring')
    },
    {
      label: 'Durée moy. session',
      value: `${monitoring.avgSessionDuration}min`,
      icon: Clock,
      color: 'gray',
      action: () => router.push('/admin/monitoring')
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
      label: 'Monitoring temps réel',
      description: 'Supervision kiosks et sessions',
      icon: Monitor,
      action: () => router.push('/admin/monitoring')
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
      bg="linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #eeeeee 100%)"
      fontFamily="system-ui, -apple-system, sans-serif"
      position="relative"
      p={8}
      overflow="hidden"
    >
      {/* Formes fluides arrière-plan comme page login */}
      <Box
        position="absolute"
        top="15%"
        right="10%"
        width="40%"
        height="50%"
        background="linear-gradient(225deg, rgba(107, 114, 128, 0.3) 0%, rgba(156, 163, 175, 0.2) 60%, rgba(209, 213, 219, 0.1) 100%)"
        borderRadius="40% 50% 30% 60%"
        filter="blur(2px)"
        transform="rotate(-10deg)"
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="20%"
        left="15%"
        width="45%"
        height="55%"
        background="linear-gradient(45deg, rgba(229, 231, 235, 0.4) 0%, rgba(243, 244, 246, 0.2) 100%)"
        borderRadius="60% 40% 50% 30%"
        filter="blur(1.5px)"
        transform="rotate(8deg)"
        zIndex={0}
      />
      
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
        zIndex={1}
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
                  bg="rgba(255, 255, 255, 0.95)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  borderRadius="20px"
                  p={6}
                  backdropFilter="blur(20px)"
                  shadow={stat.highlight ? "0 20px 40px rgba(0, 0, 0, 0.15)" : "0 8px 32px rgba(0, 0, 0, 0.12)"}
                  position="relative"
                  zIndex={2}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.98)",
                    shadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                    transform: "translateY(-2px)",
                    transition: "all 0.3s ease"
                  }}
                >
                  <VStack spacing={4} align="start">
                    <HStack justify="space-between" w="full">
                      <Box
                        w={12}
                        h={12}
                        bg="linear-gradient(135deg, #1a1a1a 0%, #404040 100%)"
                        borderRadius="16px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        shadow="0 4px 12px rgba(0, 0, 0, 0.15)"
                      >
                        <Icon as={stat.icon} color="white" boxSize={6} />
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

        {/* Section Monitoring Temps Réel */}
        <MotionBox variants={itemVariants}>
          <VStack spacing={6} w="full" align="start">
            <HStack justify="space-between" w="full">
              <Heading 
                size="lg" 
                color="black"
                fontWeight="400"
                letterSpacing="-0.5px"
              >
                Monitoring temps réel
              </Heading>
              <Badge 
                bg="green.50" 
                color="green.600" 
                px={3} 
                py={1} 
                borderRadius="full"
                fontSize="xs"
                fontWeight="500"
              >
                LIVE
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4} w="full">
              {monitoringCards.map((card, index) => (
                <MotionBox
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.15 }
                  }}
                  cursor="pointer"
                  onClick={card.action}
                >
                  <Box
                    bg="rgba(255, 255, 255, 0.95)"
                    border="1px solid"
                    borderColor={card.highlight ? "red.200" : "rgba(255, 255, 255, 0.2)"}
                    borderRadius="16px"
                    p={5}
                    backdropFilter="blur(20px)"
                    shadow={card.highlight ? "0 8px 32px rgba(239, 68, 68, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.08)"}
                    position="relative"
                    zIndex={2}
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.98)",
                      shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                      transform: "translateY(-1px)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <HStack justify="space-between" align="start">
                      <VStack spacing={2} align="start" flex="1">
                        <Text 
                          fontSize="sm" 
                          color="gray.600"
                          fontWeight="400"
                        >
                          {card.label}
                        </Text>
                        <Text 
                          fontSize="xl" 
                          fontWeight="600" 
                          color="black"
                          lineHeight="1"
                        >
                          {card.value}
                        </Text>
                      </VStack>
                      
                      <Box
                        w={10}
                        h={10}
                        bg={`${card.color}.500`}
                        borderRadius="12px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={card.icon} color="white" boxSize={5} />
                      </Box>
                    </HStack>
                    
                    {card.highlight && (
                      <Box
                        position="absolute"
                        top={2}
                        right={2}
                        w={2}
                        h={2}
                        bg="red.400"
                        borderRadius="50%"
                        animation="pulse 2s infinite"
                      />
                    )}
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
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
                    bg="rgba(255, 255, 255, 0.95)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    borderRadius="16px"
                    p={6}
                    backdropFilter="blur(20px)"
                    shadow="0 8px 32px rgba(0, 0, 0, 0.12)"
                    cursor={action.disabled ? "not-allowed" : "pointer"}
                    opacity={action.disabled ? 0.6 : 1}
                    onClick={action.disabled ? undefined : action.action}
                    position="relative"
                    zIndex={2}
                    _hover={action.disabled ? {} : {
                      bg: "rgba(255, 255, 255, 0.98)",
                      shadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
                      transform: "translateY(-1px)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <HStack spacing={4} align="start">
                      <Box
                        w={12}
                        h={12}
                        bg={action.disabled ? "gray.300" : "linear-gradient(135deg, #1a1a1a 0%, #404040 100%)"}
                        borderRadius="14px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        shadow={action.disabled ? "none" : "0 4px 12px rgba(0, 0, 0, 0.15)"}
                      >
                        <Icon as={action.icon} color="white" boxSize={6} />
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
