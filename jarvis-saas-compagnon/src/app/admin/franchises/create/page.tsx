'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  useToast
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2 } from 'lucide-react'
import FranchiseCreateFormSimple from '../../../../components/admin/FranchiseCreateFormSimple'
import type { Franchise } from '../../../../types/franchise'

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

export default function CreateFranchisePage() {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const toast = useToast()

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleSuccess = (franchise: Franchise) => {
    setIsCreating(false)
    
    // Afficher notification de succès
    toast({
      title: '🎉 Franchise créée !',
      description: `La franchise "${franchise.name}" a été créée avec succès.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'top-right'
    })

    // Rediriger vers la liste des franchises après un délai
    setTimeout(() => {
      router.push('/admin/franchises')
    }, 2000)
  }

  const handleCancel = () => {
    router.back()
  }

  const handleBackToList = () => {
    router.push('/admin/franchises')
  }

  // ===========================================
  // 🎨 Render
  // ===========================================

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
                    onClick={handleBackToList}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={handleBackToList}
                    cursor="pointer"
                    _hover={{ color: "blue.500" }}
                  >
                    Franchises
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                  <Text color="gray.400">Nouvelle franchise</Text>
                </BreadcrumbItem>
              </Breadcrumb>

              {/* Titre et bouton retour */}
              <HStack spacing={4} w="full" justify="space-between">
                <VStack align="start" spacing={2}>
                  <HStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="12px"
                      bg="blue.50"
                      border="1px solid"
                      borderColor="blue.200"
                    >
                      <Icon as={Building2} boxSize={6} color="blue.500" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Heading 
                        size="xl" 
                        color="gray.800"
                        fontWeight="bold"
                        letterSpacing="-0.025em"
                      >
                        Nouvelle Franchise
                      </Heading>
                      <Text color="gray.600" fontSize="md">
                        Créer un nouvel espace franchise avec configuration JARVIS
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Bouton retour */}
                <Button
                  leftIcon={<Icon as={ArrowLeft} />}
                  variant="ghost"
                  onClick={handleBackToList}
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
                  Retour à la liste
                </Button>
              </HStack>
            </VStack>
          </motion.div>

          {/* Formulaire de création */}
          <motion.div variants={slideInFromRight}>
            <FranchiseCreateFormSimple
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
                  <Icon as={Building2} color="blue.500" />
                  <Text fontWeight="600" color="blue.700">
                    Après création de la franchise
                  </Text>
                </HStack>
                <VStack align="start" spacing={1} pl={6}>
                  <Text fontSize="sm" color="blue.600">
                    • Le propriétaire recevra une invitation par email (si configuré)
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Vous pourrez ajouter des salles à cette franchise
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • La configuration JARVIS sera appliquée à toutes les salles
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Le tableau de bord franchise sera automatiquement créé
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