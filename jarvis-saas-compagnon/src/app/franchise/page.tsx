'use client'

import { useEffect, useState } from 'react'
import { createBrowserClientWithConfig } from '../../lib/supabase-admin'
import { Database } from '../../types/database'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  Box, 
  VStack,
  HStack,
  Heading, 
  Text, 
  Button,
  Icon,
  SimpleGrid,
  Spinner
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Users, 
  Dumbbell,
  Activity,
  ArrowRight
} from 'lucide-react'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

type Franchise = Database['public']['Tables']['franchises']['Row']
type UserProfile = Database['public']['Tables']['users']['Row']

export default function FranchisePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createBrowserClientWithConfig()

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
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        router.push('/auth/login')
        return
      }

      setUserProfile(profile)

      if (profile.role !== 'franchise_owner' && profile.role !== 'franchise_admin') {
        router.push('/dashboard')
        return
      }

      // Charger la franchise
      if (profile.franchise_id) {
        loadFranchise(profile.franchise_id)
      }
    } catch (error) {
      console.error('Erreur authentification:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadFranchise = async (franchiseId: string) => {
    try {
      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchiseId)
        .single()

      if (error) throw error
      setFranchise(data)
    } catch (error) {
      console.error('Erreur chargement franchise:', error)
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
            Chargement de votre franchise...
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
              Aucune franchise trouvée
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="400">
              Contactez votre administrateur
            </Text>
          </VStack>
          <Button
            bg="black"
            color="white"
            onClick={() => router.push('/dashboard')}
            _hover={{ bg: "gray.900" }}
            borderRadius="2px"
            fontWeight="500"
            fontSize="sm"
          >
            Retour au dashboard
          </Button>
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
                  Gestion de votre franchise
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </MotionBox>

        {/* Quick Stats */}
        <MotionBox variants={itemVariants}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {[
              { label: 'Salles', value: 'N/A', icon: Dumbbell, description: 'Salles actives' },
              { label: 'Membres', value: 'N/A', icon: Users, description: 'Membres totaux' },
              { label: 'Sessions', value: 'N/A', icon: Activity, description: 'Sessions JARVIS' }
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
            
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="full">
              {[
                {
                  label: 'Dashboard global',
                  description: 'Vue d\'ensemble de la plateforme',
                  action: () => router.push('/dashboard')
                },
                {
                  label: 'Profil utilisateur',
                  description: 'Gérer vos informations',
                  action: () => alert('Fonctionnalité en cours de développement')
                }
              ].map((action, index) => (
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
                    onClick={action.action}
                    _hover={{
                      borderColor: "gray.300",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <HStack spacing={4} align="start">
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
                      
                      <Icon as={ArrowRight} color="gray.400" boxSize={4} />
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
