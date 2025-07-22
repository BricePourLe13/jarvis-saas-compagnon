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
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Card,
  CardBody,
  CardHeader,
  useToast,
  Flex,
  Spacer,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Select,
  Switch,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Building2, 
  MapPin, 
  Save,
  X,
  Settings,
  Monitor,
  Zap,
  Palette
} from 'lucide-react'
import type { Gym, GymUpdateRequest } from '../../../../../../../types/franchise'

// ===========================================
// 🎯 Page Principale
// ===========================================

export default function GymEditPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  
  const franchiseId = params.id as string
  const gymId = params.gymId as string

  // ===========================================
  // 📊 État
  // ===========================================
  
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    status: 'active',
    welcome_message: '',
    member_count: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ===========================================
  // 🔄 Chargement des données
  // ===========================================

  useEffect(() => {
    loadGymDetails()
  }, [gymId])

  const loadGymDetails = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/admin/gyms/${gymId}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la salle')
      }

      const result = await response.json()
      const gymData = result.data
      
      setGym(gymData)
      setFormData({
        name: gymData.name || '',
        address: gymData.address || '',
        city: gymData.city || '',
        postal_code: gymData.postal_code || '',
        status: gymData.status || 'active',
        welcome_message: gymData.kiosk_config?.welcome_message || '',
        member_count: gymData.member_count || 0
      })

    } catch (error) {
      console.error('Erreur chargement salle:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les détails de la salle',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise'
    }
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Le code postal est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Erreurs de validation',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setSaving(true)

      const updateData: GymUpdateRequest = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postal_code: formData.postal_code.trim(),
        status: formData.status as 'active' | 'maintenance' | 'offline',
        member_count: formData.member_count,
        kiosk_config: {
          ...gym?.kiosk_config,
          welcome_message: formData.welcome_message.trim()
        }
      }

      const response = await fetch(`/api/admin/gyms/${gymId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      toast({
        title: 'Salle mise à jour',
        description: 'Les modifications ont été sauvegardées avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Retour à la page de détails
      router.push(`/admin/franchises/${franchiseId}/gyms/${gymId}`)

    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast({
        title: 'Erreur de sauvegarde',
        description: 'Impossible de sauvegarder les modifications',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/franchises/${franchiseId}/gyms/${gymId}`)
  }

  // ===========================================
  // 🖼️ Rendu
  // ===========================================

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <Text>Chargement...</Text>
      </Container>
    )
  }

  if (!gym) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Salle introuvable</AlertTitle>
          <AlertDescription>
            Cette salle n'existe pas ou vous n'avez pas les permissions pour la modifier.
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="5xl" py={8}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VStack spacing={6} align="stretch">
          
          {/* Navigation */}
          <Breadcrumb fontSize="sm" color="gray.600">
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/admin/franchises')}>
                Franchises
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms`)}>
                Salles
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/${gymId}`)}>
                {gym.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <Text color="gray.900" fontWeight="600">Édition</Text>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Header */}
          <Flex align="center">
            <HStack spacing={4}>
              <Button
                leftIcon={<Icon as={ArrowLeft} />}
                onClick={handleCancel}
                variant="outline"
                borderRadius="12px"
              >
                Annuler
              </Button>
              <VStack align="start" spacing={0}>
                <Heading size="lg" color="gray.800">
                  Modifier la salle
                </Heading>
                <Text fontSize="md" color="gray.600">
                  {gym.name}
                </Text>
              </VStack>
            </HStack>
            
            <Spacer />
            
            <Button
              leftIcon={<Icon as={Save} />}
              onClick={handleSave}
              colorScheme="blue"
              borderRadius="12px"
              isLoading={saving}
              loadingText="Sauvegarde..."
              size="lg"
              fontWeight="600"
            >
              Sauvegarder
            </Button>
          </Flex>

          {/* Formulaire avec onglets */}
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList borderRadius="12px 12px 0 0" bg="gray.50">
              <Tab _selected={{ bg: "white", borderColor: "gray.200" }}>
                <Icon as={Building2} mr={2} />
                Informations
              </Tab>
              <Tab _selected={{ bg: "white", borderColor: "gray.200" }}>
                <Icon as={Monitor} mr={2} />
                Configuration JARVIS
              </Tab>
            </TabList>

            <TabPanels bg="white" borderRadius="0 0 12px 12px" border="1px solid" borderColor="gray.200" borderTop="none">
              
              {/* Onglet Informations */}
              <TabPanel p={6}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  
                  {/* Informations de base */}
                  <Card borderRadius="16px" border="1px solid" borderColor="gray.100" shadow="sm">
                    <CardHeader bg="blue.50" borderRadius="16px 16px 0 0">
                      <Heading size="md" color="blue.700">
                        <Icon as={Building2} mr={2} />
                        Informations générales
                      </Heading>
                    </CardHeader>
                    <CardBody pt={4}>
                      <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={!!errors.name}>
                          <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Nom de la salle</FormLabel>
                          <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            borderRadius="12px"
                            border="1px solid"
                            borderColor="gray.200"
                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                          />
                          <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.status}>
                          <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Statut</FormLabel>
                          <Select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            borderRadius="12px"
                            border="1px solid"
                            borderColor="gray.200"
                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                          >
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="offline">Hors ligne</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Nombre de membres</FormLabel>
                          <Input
                            type="number"
                            value={formData.member_count}
                            onChange={(e) => handleInputChange('member_count', parseInt(e.target.value) || 0)}
                            borderRadius="12px"
                            border="1px solid"
                            borderColor="gray.200"
                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
                          />
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Localisation */}
                  <Card borderRadius="16px" border="1px solid" borderColor="gray.100" shadow="sm">
                    <CardHeader bg="green.50" borderRadius="16px 16px 0 0">
                      <Heading size="md" color="green.700">
                        <Icon as={MapPin} mr={2} />
                        Localisation
                      </Heading>
                    </CardHeader>
                    <CardBody pt={4}>
                      <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={!!errors.address}>
                          <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Adresse</FormLabel>
                          <Input
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            borderRadius="12px"
                            border="1px solid"
                            borderColor="gray.200"
                            _focus={{ borderColor: "green.400", boxShadow: "0 0 0 1px #48bb78" }}
                          />
                          <FormErrorMessage>{errors.address}</FormErrorMessage>
                        </FormControl>

                        <HStack spacing={4}>
                          <FormControl isInvalid={!!errors.city}>
                            <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Ville</FormLabel>
                            <Input
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              borderRadius="12px"
                              border="1px solid"
                              borderColor="gray.200"
                              _focus={{ borderColor: "green.400", boxShadow: "0 0 0 1px #48bb78" }}
                            />
                            <FormErrorMessage>{errors.city}</FormErrorMessage>
                          </FormControl>

                          <FormControl isInvalid={!!errors.postal_code}>
                            <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Code postal</FormLabel>
                            <Input
                              value={formData.postal_code}
                              onChange={(e) => handleInputChange('postal_code', e.target.value)}
                              borderRadius="12px"
                              border="1px solid"
                              borderColor="gray.200"
                              _focus={{ borderColor: "green.400", boxShadow: "0 0 0 1px #48bb78" }}
                            />
                            <FormErrorMessage>{errors.postal_code}</FormErrorMessage>
                          </FormControl>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                </SimpleGrid>
              </TabPanel>

              {/* Onglet Configuration JARVIS */}
              <TabPanel p={6}>
                <Card borderRadius="16px" border="1px solid" borderColor="gray.100" shadow="sm">
                  <CardHeader bg="purple.50" borderRadius="16px 16px 0 0">
                    <Heading size="md" color="purple.700">
                      <Icon as={Zap} mr={2} />
                      Message d'accueil JARVIS
                    </Heading>
                  </CardHeader>
                  <CardBody pt={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                        Message personnalisé pour cette salle
                      </FormLabel>
                      <Textarea
                        value={formData.welcome_message}
                        onChange={(e) => handleInputChange('welcome_message', e.target.value)}
                        placeholder="Ex: Bienvenue au FitnessPark Lyon Centre ! Comment puis-je vous aider aujourd'hui ?"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor="gray.200"
                        _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px #9f7aea" }}
                        rows={4}
                        resize="vertical"
                      />
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        Ce message sera affiché par JARVIS lors de l'accueil des membres sur le Kiosk de cette salle.
                      </Text>
                    </FormControl>
                  </CardBody>
                </Card>
              </TabPanel>
              
            </TabPanels>
          </Tabs>

        </VStack>
      </motion.div>
    </Container>
  )
} 