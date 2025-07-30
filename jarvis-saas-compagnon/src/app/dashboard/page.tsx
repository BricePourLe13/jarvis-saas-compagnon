"use client"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Flex,
  Button,
  Spinner,
  useToast
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Building2, 
  Mic,
  DollarSign,
  Zap,
  MessageSquare,
  Settings
} from 'lucide-react'
import { createBrowserClientWithConfig } from '../../lib/supabase-admin'
import type { Database } from '../../types/database'
import { getRealTimeMetrics, convertUSDToEUR, formatCurrency } from '../../lib/openai-cost-tracker'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

type Franchise = Database['public']['Tables']['franchises']['Row']

// Stats globales dynamiques calculées à partir des vraies données
const getDynamicStats = (franchises: Franchise[], jarvisMetrics: any) => [
  { 
    label: "Franchises", 
    value: franchises.length, 
    icon: Building2,
    description: "Total des franchises"
  },
  { 
    label: "Sessions JARVIS", 
    value: jarvisMetrics?.today?.totalSessions || 0, 
    icon: MessageSquare,
    description: "Sessions totales"
  },
  { 
    label: "Coût IA", 
    value: `${formatCurrency(convertUSDToEUR(jarvisMetrics?.today?.totalCostUSD || 0))}`, 
    icon: DollarSign,
    description: "Coût total OpenAI"
  },
  { 
    label: "Tokens utilisés", 
    value: `${Math.round(((jarvisMetrics?.today?.totalTextInputTokens || 0) + (jarvisMetrics?.today?.totalTextOutputTokens || 0) + (jarvisMetrics?.today?.totalAudioInputTokens || 0) + (jarvisMetrics?.today?.totalAudioOutputTokens || 0)) / 1000)}k`, 
    icon: Zap,
    description: "Tokens traités"
  }
]

// Analytics JARVIS dynamiques
const getDynamicJarvisAnalytics = (jarvisMetrics: any) => [
  {
    title: "Sessions audio",
    value: jarvisMetrics?.today?.totalSessions || 0,
    icon: Mic,
    description: "Sessions vocales",
  },
  {
    title: "Tokens traités", 
    value: `${Math.round(((jarvisMetrics?.today?.totalTextInputTokens || 0) + (jarvisMetrics?.today?.totalTextOutputTokens || 0) + (jarvisMetrics?.today?.totalAudioInputTokens || 0) + (jarvisMetrics?.today?.totalAudioOutputTokens || 0)) / 1000)}k`,
    icon: Activity,
    description: "Tokens OpenAI",
  },
  {
    title: "Coût moyen/session",
    value: (jarvisMetrics?.today?.totalSessions || 0) > 0 
      ? `${formatCurrency(convertUSDToEUR((jarvisMetrics?.today?.totalCostUSD || 0) / (jarvisMetrics?.today?.totalSessions || 1)))}`
      : "€0.00",
    icon: DollarSign,
    description: "Coût par session",
  }
]

export default function DashboardPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [jarvisMetrics, setJarvisMetrics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
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
    setMounted(true)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      
      // Charger les franchises
      const { data: franchisesData, error } = await supabase
        .from('franchises')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setFranchises(franchisesData || [])

      // Charger les métriques JARVIS en temps réel
      const metrics = await getRealTimeMetrics()
      setJarvisMetrics(metrics)

    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du dashboard",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
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
            Chargement du dashboard...
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

      <Container maxW="1200px" p={0}>
        <MotionVStack
          spacing={12}
          align="stretch"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <MotionBox variants={itemVariants}>
            <Flex justify="space-between" align="center">
              <VStack spacing={2} align="start">
                <Heading 
                  size="xl" 
                  color="black"
                  fontWeight="400"
                  letterSpacing="-0.5px"
                >
                  Dashboard
                </Heading>
                <Text 
                  color="gray.600" 
                  fontSize="lg"
                  fontWeight="400"
                >
                  Vue d'ensemble de votre plateforme JARVIS
                </Text>
              </VStack>
              
              <Button
                leftIcon={<Icon as={Settings} />}
                bg="black"
                color="white"
                size="lg"
                onClick={() => router.push('/admin')}
                _hover={{ 
                  bg: "gray.900",
                  transform: "translateY(-2px)",
                  transition: "all 0.2s ease"
                }}
                _active={{ transform: "translateY(0)" }}
                borderRadius="2px"
                px={6}
                py={3}
                fontWeight="500"
                fontSize="sm"
              >
                Administration
              </Button>
            </Flex>
          </MotionBox>

          {/* Stats Grid */}
          <MotionBox variants={itemVariants}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
              {mounted && getDynamicStats(franchises, jarvisMetrics).map((stat, index) => (
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

          {/* Analytics JARVIS */}
          <MotionBox variants={itemVariants}>
            <VStack spacing={6} align="start">
              <Heading 
                size="lg" 
                color="black"
                fontWeight="400"
                letterSpacing="-0.5px"
              >
                Analytics JARVIS
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full">
                {mounted && getDynamicJarvisAnalytics(jarvisMetrics).map((metric, index) => (
                  <MotionBox
                    key={metric.title}
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
                      _hover={{
                        borderColor: "gray.300",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <HStack spacing={4} align="start">
                        <Box
                          w={10}
                          h={10}
                          bg="black"
                          borderRadius="2px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Icon as={metric.icon} color="white" boxSize={5} />
                        </Box>
                        
                        <VStack spacing={1} align="start" flex="1">
                          <Text 
                            fontSize="xl" 
                            fontWeight="600" 
                            color="black"
                          >
                            {metric.value}
                          </Text>
                          <Text 
                            fontSize="sm" 
                            fontWeight="500" 
                            color="black"
                          >
                            {metric.title}
                          </Text>
                          <Text 
                            fontSize="xs" 
                            color="gray.600"
                            fontWeight="400"
                          >
                            {metric.description}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </MotionBox>
        </MotionVStack>
      </Container>
    </Box>
  )
}
