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
  Badge
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ApiResponse, Gym } from '../../types/franchise'

// ===========================================
// 🎯 Interface simplifiée
// ===========================================

interface GymCreateFormProps {
  franchiseId: string
  franchiseName: string
  onSuccess?: (gym: Gym & { provisioning_code?: string }) => void
  onCancel?: () => void
}

interface SimpleGymFormData {
  name: string
  address: string
  city: string
  postal_code: string
  welcome_message: string
}

// ===========================================
// 🔧 Validations
// ===========================================

function validateForm(data: SimpleGymFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name.trim()) {
    errors.push('Le nom de la salle est requis')
  }

  if (!data.address.trim()) {
    errors.push('Adresse complète requise')
  }

  if (!data.city.trim()) {
    errors.push('Ville requise')
  }

  if (!data.postal_code.trim()) {
    errors.push('Code postal requis')
  }

  return { valid: errors.length === 0, errors }
}

// ===========================================
// 🎯 Composant principal
// ===========================================

export default function GymCreateFormSimple({ 
  franchiseId, 
  franchiseName, 
  onSuccess, 
  onCancel 
}: GymCreateFormProps) {
  const [formData, setFormData] = useState<SimpleGymFormData>({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    welcome_message: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const toast = useToast()

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleInputChange = (field: keyof SimpleGymFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-générer le message de bienvenue si vide
    if (field === 'name' && value.trim()) {
      if (!formData.welcome_message) {
        setFormData(prev => ({
          ...prev,
          welcome_message: `Bienvenue à ${value.trim()} !`
        }))
      }
    }
    
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
      // Préparer les données pour l'API
      const requestData = {
        franchise_id: franchiseId,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        welcome_message: formData.welcome_message || `Bienvenue à ${formData.name} !`
      }

      // Appel API
      const response = await fetch('/api/admin/gyms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result: ApiResponse<Gym & { provisioning_code?: string }> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la création')
      }

      // Succès !
      toast({
        title: 'Salle créée !',
        description: result.message || `La salle "${formData.name}" a été créée avec succès.`,
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <VStack spacing={3} align="start" mb={8}>
          <Heading size="lg" color="gray.800">
            Nouvelle Salle de Sport
          </Heading>
          <HStack spacing={2}>
            <Text color="gray.600">
              Franchise :
            </Text>
            <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
              {franchiseName}
            </Badge>
          </HStack>
        </VStack>

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

        <VStack spacing={6}>
          {/* Section: Informations Salle */}
          <VStack spacing={6} align="stretch" w="full">
            <Heading size="md" color="gray.700">
              🏋️ Informations de la Salle
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel color="gray.600" fontWeight="600">
                  Nom de la salle
                </FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Salle Center Park, Gym Central..."
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
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                  }}
                />
              </FormControl>

              <FormControl isRequired>
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
            </SimpleGrid>

            <FormControl isRequired>
              <FormLabel color="gray.600" fontWeight="600">
                Adresse complète
              </FormLabel>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
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
                Message d'accueil JARVIS
              </FormLabel>
              <Textarea
                value={formData.welcome_message}
                onChange={(e) => handleInputChange('welcome_message', e.target.value)}
                placeholder={`Bienvenue à ${formData.name || 'votre salle'} !`}
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="12px"
                rows={2}
              />
            </FormControl>
          </VStack>

          {/* Info génération automatique */}
          <Box
            p={6}
            bg="green.50"
            borderRadius="16px"
            border="1px solid"
            borderColor="green.200"
            w="full"
          >
            <VStack spacing={3} align="start">
              <Text fontWeight="600" color="green.700">
                🔧 Génération automatique
              </Text>
              <VStack align="start" spacing={1} pl={4}>
                <Text fontSize="sm" color="green.600">
                  • Code de provisioning unique (pour lier le kiosque physique)
                </Text>
                <Text fontSize="sm" color="green.600">
                  • URL unique de kiosque JARVIS (/kiosk/gym-xxxxxxxx)
                </Text>
                <Text fontSize="sm" color="green.600">
                  • Configuration JARVIS par défaut (analytics, rapports, interaction vocale)
                </Text>
                <Text fontSize="sm" color="green.600">
                  • Horaires d'ouverture standard (6h-22h en semaine)
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Actions */}
          <HStack spacing={4} justify="end" pt={6} w="full">
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
              Créer la Salle
            </Button>
          </HStack>
        </VStack>
      </motion.div>
    </Box>
  )
} 