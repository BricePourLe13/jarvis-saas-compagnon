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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  Skeleton
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, Dumbbell } from 'lucide-react'
import GymCreateFormSimple from '../../../../../../components/admin/GymCreateFormSimple'
import type { Gym, Franchise, ApiResponse } from '../../../../../../types/franchise'

// ===========================================
// 🎨 Animation variants
// ===========================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const slideInFromRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
}

// ===========================================
// 🎯 Composant principal
// ===========================================

export default function CreateGymPage() {
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const toast = useToast()

  const franchiseId = params.id as string

  // ===========================================
  // 🔄 Charger les données de la franchise
  // ===========================================

  useEffect(() => {
    const loadFranchise = async () => {
      try {
        const response = await fetch(`/api/admin/franchises`)
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des franchises')
        }

        const result = await response.json()
        const foundFranchise = result.data.find((f: Franchise) => f.id === franchiseId)
        
        if (!foundFranchise) {
          throw new Error('Franchise introuvable')
        }

        setFranchise(foundFranchise)
      } catch (error) {
        console.error('Erreur chargement franchise:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations de la franchise',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        router.push('/admin/franchises')
      } finally {
        setLoading(false)
      }
    }

    if (franchiseId) {
      loadFranchise()
    }
  }, [franchiseId, router, toast])

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleSuccess = (gym: Gym & { provisioning_code?: string }) => {
    // Afficher notification de succès avec code de provisioning
    toast({
      title: '🎉 Salle créée !',
      description: `La salle "${gym.name}" a été créée avec succès.${
        gym.provisioning_code ? ` Code de provisioning: ${gym.provisioning_code}` : ''
      }`,
      status: 'success',
      duration: 8000,
      isClosable: true,
      position: 'top-right'
    })

    // Rediriger vers la liste des salles de cette franchise
    setTimeout(() => {
      router.push(`/admin/franchises/${franchiseId}/gyms`)
    }, 2000)
  }

  const handleCancel = () => {
    router.back()
  }

  const handleBackToGyms = () => {
    router.push(`/admin/franchises/${franchiseId}/gyms`)
  }

  const handleBackToFranchises = () => {
    router.push('/admin/franchises')
  }

  // ===========================================
  // 🎨 Render
  // ===========================================

  if (loading) {
    return (
      <Box minH="100vh" bg="#fafafa" py={8}>
        <Container maxW="6xl">
          <VStack spacing={6}>
            <Skeleton height="40px" width="300px" />
            <Skeleton height="600px" width="100%" borderRadius="20px" />
          </VStack>
        </Container>
      </Box>
    )
  }

  if (!franchise) {
    return (
      <Box minH="100vh" bg="#fafafa" py={8}>
        <Container maxW="6xl">
          <Text color="red.500">Franchise introuvable</Text>
        </Container>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="#fafafa" py={8}>
      <Container maxW="6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* Header avec navigation */}
          <motion.div variants={fadeInUp}>
            <VStack spacing={6} align="start" mb={8}>
              {/* Breadcrumb */}
              <Breadcrumb fontSize="sm" color="gray.600">
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={handleBackToFranchises}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={handleBackToFranchises}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    Franchises
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={handleBackToGyms}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    {franchise.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={handleBackToGyms}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    Salles
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                  <Text color="gray.400">Nouvelle salle</Text>
                </BreadcrumbItem>
              </Breadcrumb>

              {/* Titre et bouton retour */}
              <HStack spacing={4} w="full" justify="space-between">
                <VStack align="start" spacing={2}>
                  <HStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="12px"
                      bg="green.50"
                      border="1px solid"
                      borderColor="green.200"
                    >
                      <Icon as={Dumbbell} boxSize={6} color="green.500" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Heading 
                        size="xl" 
                        color="gray.800"
                        fontWeight="bold"
                        letterSpacing="-0.025em"
                      >
                        Nouvelle Salle
                      </Heading>
                      <HStack spacing={2}>
                        <Text color="gray.600" fontSize="md">
                          Créer une nouvelle salle pour
                        </Text>
                        <Text color="blue.600" fontWeight="600">
                          {franchise.name}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Bouton retour */}
                <Button
                  leftIcon={<Icon as={ArrowLeft} />}
                  variant="ghost"
                  onClick={handleBackToGyms}
                  color="gray.700"
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="12px"
                  _hover={{ 
                    bg: "gray.50",
                    borderColor: "gray.300"
                  }}
                  boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                  px={6}
                >
                  Retour aux salles
                </Button>
              </HStack>
            </VStack>
          </motion.div>

          {/* Formulaire de création */}
          <motion.div variants={slideInFromRight}>
            <GymCreateFormSimple
              franchiseId={franchiseId}
              franchiseName={franchise.name}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </motion.div>

          {/* Footer informatif */}
          <motion.div variants={fadeInUp}>
            <Box
              mt={8}
              p={6}
              bg="blue.50"
              borderRadius="16px"
              border="1px solid"
              borderColor="blue.200"
            >
              <VStack spacing={3} align="start">
                <HStack spacing={2}>
                  <Icon as={Dumbbell} color="blue.500" />
                  <Text fontWeight="600" color="blue.700">
                    Après création de la salle
                  </Text>
                </HStack>
                <VStack align="start" spacing={1} pl={6}>
                  <Text fontSize="sm" color="blue.600">
                    • Un code de provisioning unique sera généré pour lier le kiosque physique
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Une URL unique sera créée pour l'interface JARVIS (/kiosk/gym-xxxxx)
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • La configuration JARVIS sera immédiatement disponible
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Tu pourras ajouter un gérant et configurer les accès
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  )
} 