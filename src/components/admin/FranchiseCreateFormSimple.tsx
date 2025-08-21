'use client'

import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Alert,
  AlertIcon,
  Text,
  useToast,
  Heading,
  SimpleGrid,
  InputGroup,
  InputLeftAddon
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ApiResponse, Franchise } from '../../types/franchise'

// ===========================================
// 🎨 Animation variants
// ===========================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// ===========================================
// 🎯 Interface du composant
// ===========================================

interface FranchiseCreateFormProps {
  onSuccess?: (franchise: Franchise) => void
  onCancel?: () => void
}

interface FormData {
  name: string
  contact_email: string
  phone: string
  headquarters_address: string
  city: string
  postal_code: string
}

// ===========================================
// 🔧 Validations
// ===========================================

function validateForm(data: FormData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name.trim()) {
    errors.push('Le nom de la franchise est requis')
  }

  if (!data.contact_email.trim() || !data.contact_email.includes('@')) {
    errors.push('Email de contact valide requis')
  }

  return { valid: errors.length === 0, errors }
}

// ===========================================
// 🎯 Composant principal
// ===========================================

export default function FranchiseCreateFormSimple({ onSuccess, onCancel }: FranchiseCreateFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact_email: '',
    phone: '',
    headquarters_address: '',
    city: '',
    postal_code: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const toast = useToast()

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const validation = validateForm(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    setErrors([])

    try {
      // Appel API
      const response = await fetch('/api/admin/franchises/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result: ApiResponse<Franchise> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la création')
      }

      // Succès !
      toast({
        title: 'Franchise créée !',
        description: result.message || `La franchise "${formData.name}" a été créée avec succès.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      if (onSuccess && result.data) {
        onSuccess(result.data)
      }

    } catch (error) {
      // Log supprimé pour production
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inattendue'
      setErrors([errorMessage])
      
      toast({
        title: 'Erreur de création',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // ===========================================
  // 🎨 Render
  // ===========================================

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="white"
      borderRadius="20px"
      p={8}
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="gray.100"
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <VStack spacing={3} align="start" mb={8}>
            <Heading size="lg" color="gray.800">
              Nouvelle Franchise
            </Heading>
            <Text color="gray.600">
              Créer un nouvel espace franchise pour votre réseau
            </Text>
          </VStack>
        </motion.div>

        {/* Erreurs */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert status="error" borderRadius="12px" mb={6}>
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  {errors.map((error, index) => (
                    <Text key={index} fontSize="sm">
                      {error}
                    </Text>
                  ))}
                </VStack>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <VStack spacing={8}>
          {/* Section: Informations Franchise */}
          <motion.div variants={fadeInUp} style={{ width: '100%' }}>
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="gray.700">
                📋 Informations de la Franchise
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="gray.600" fontWeight="600">
                    Nom de la franchise
                  </FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Orange Bleue, BasicFit..."
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="12px"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                    }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.600" fontWeight="600">
                    Email de contact
                  </FormLabel>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@franchise.com"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="12px"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.600" fontWeight="600">
                    Téléphone
                  </FormLabel>
                  <InputGroup>
                    <InputLeftAddon bg="gray.100" borderColor="gray.200">
                      📞
                    </InputLeftAddon>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="01.23.45.67.89"
                      bg="gray.50"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="0 12px 12px 0"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.600" fontWeight="600">
                    Ville
                  </FormLabel>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Paris"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="12px"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel color="gray.600" fontWeight="600">
                  Adresse du siège
                </FormLabel>
                <Textarea
                  value={formData.headquarters_address}
                  onChange={(e) => handleInputChange('headquarters_address', e.target.value)}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="12px"
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.600" fontWeight="600">
                  Code postal
                </FormLabel>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="75001"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="12px"
                  maxW="200px"
                />
              </FormControl>
            </VStack>
          </motion.div>

          {/* Info prochaines fonctionnalités */}
          <motion.div variants={fadeInUp} style={{ width: '100%' }}>
            <Box
              p={6}
              bg="blue.50"
              borderRadius="16px"
              border="1px solid"
              borderColor="blue.200"
            >
              <VStack spacing={3} align="start">
                <Text fontWeight="600" color="blue.700">
                  🚀 Prochaines fonctionnalités
                </Text>
                <VStack align="start" spacing={1} pl={4}>
                  <Text fontSize="sm" color="blue.600">
                    • Gestion des propriétaires et accès multi-franchises
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Configuration JARVIS au niveau des salles individuelles
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Tableau de bord franchise avec analytics consolidées
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeInUp} style={{ width: '100%' }}>
            <HStack spacing={4} justify="end" pt={6}>
              {onCancel && (
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  isDisabled={loading}
                  borderRadius="12px"
                  px={8}
                >
                  Annuler
                </Button>
              )}
              
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="Création en cours..."
                borderRadius="12px"
                px={8}
                h="50px"
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)"
                }}
                transition="all 0.2s ease"
              >
                Créer la Franchise
              </Button>
            </HStack>
          </motion.div>
        </VStack>
      </motion.div>
    </Box>
  )
} 