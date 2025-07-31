'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Icon,
  Checkbox,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  Avatar,
  Tooltip,
  SimpleGrid,
  Divider,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Building2, MapPin, Search, Users, Shield, CheckCircle, AlertTriangle, Save } from 'lucide-react'
import { logPermissionsUpdate } from '@/lib/activity-logger'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface User {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
  franchise_access: string[] | null
  gym_access: string[] | null
  is_active: boolean
}

interface Franchise {
  id: string
  name: string
  brand_name: string
  city: string
  status: string
  owner_id: string | null
  gyms?: Gym[]
}

interface Gym {
  id: string
  name: string
  franchise_id: string
  city: string
  address: string
  status: string
  manager_id: string | null
}

interface AccessManagementModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function AccessManagementModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess 
}: AccessManagementModalProps) {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // États locaux pour les accès
  const [selectedFranchises, setSelectedFranchises] = useState<string[]>([])
  const [selectedGyms, setSelectedGyms] = useState<string[]>([])
  
  // Recherche
  const [searchTerm, setSearchTerm] = useState('')
  
  const toast = useToast()

  // Charger les données à l'ouverture
  useEffect(() => {
    if (isOpen && user) {
      loadFranchisesAndGyms()
      // Initialiser les sélections avec les accès actuels
      setSelectedFranchises(user.franchise_access || [])
      setSelectedGyms(user.gym_access || [])
    }
  }, [isOpen, user])

  const loadFranchisesAndGyms = async () => {
    setLoading(true)
    try {
      // Charger les franchises
      const franchisesResponse = await fetch('/api/admin/franchises')
      const franchisesResult = await franchisesResponse.json()

      if (franchisesResult.success) {
        setFranchises(franchisesResult.data)
      }

      // Charger toutes les salles
      const gymsResponse = await fetch('/api/admin/permissions/gyms')
      const gymsResult = await gymsResponse.json()

      if (gymsResult.success) {
        setGyms(gymsResult.data)
      }

    } catch (error) {
      console.error('Erreur chargement données:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFranchiseToggle = (franchiseId: string) => {
    setSelectedFranchises(prev => {
      const isSelected = prev.includes(franchiseId)
      if (isSelected) {
        // Retirer la franchise et toutes ses salles
        const franchiseGyms = gyms.filter(gym => gym.franchise_id === franchiseId).map(gym => gym.id)
        setSelectedGyms(prevGyms => prevGyms.filter(gymId => !franchiseGyms.includes(gymId)))
        return prev.filter(id => id !== franchiseId)
      } else {
        // Ajouter la franchise
        return [...prev, franchiseId]
      }
    })
  }

  const handleGymToggle = (gymId: string, franchiseId: string) => {
    setSelectedGyms(prev => {
      const isSelected = prev.includes(gymId)
      if (isSelected) {
        return prev.filter(id => id !== gymId)
      } else {
        // Ajouter la salle et automatiquement la franchise si pas déjà sélectionnée
        if (!selectedFranchises.includes(franchiseId)) {
          setSelectedFranchises(prevFranchises => [...prevFranchises, franchiseId])
        }
        return [...prev, gymId]
      }
    })
  }

  const handleSelectAllGymsInFranchise = (franchiseId: string) => {
    const franchiseGyms = gyms.filter(gym => gym.franchise_id === franchiseId)
    const allSelected = franchiseGyms.every(gym => selectedGyms.includes(gym.id))
    
    if (allSelected) {
      // Désélectionner toutes les salles de cette franchise
      const gymIds = franchiseGyms.map(gym => gym.id)
      setSelectedGyms(prev => prev.filter(id => !gymIds.includes(id)))
    } else {
      // Sélectionner toutes les salles de cette franchise
      const gymIds = franchiseGyms.map(gym => gym.id)
      setSelectedGyms(prev => [...new Set([...prev, ...gymIds])])
      
      // S'assurer que la franchise est sélectionnée
      if (!selectedFranchises.includes(franchiseId)) {
        setSelectedFranchises(prev => [...prev, franchiseId])
      }
    }
  }

  const saveAccessChanges = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchise_access: selectedFranchises,
          gym_access: selectedGyms
        })
      })

      const result = await response.json()

      if (result.success) {
        // Log de l'activité
        await logPermissionsUpdate(
          user.id,
          user.full_name,
          user.franchise_access || [],
          selectedFranchises,
          user.gym_access || [],
          selectedGyms
        )

        toast({
          title: 'Accès mis à jour',
          description: 'Les permissions ont été sauvegardées avec succès',
          status: 'success',
          duration: 3000,
        })
        
        onSuccess()
        onClose()
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible de sauvegarder les permissions',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Erreur sauvegarde permissions:', error)
      toast({
        title: 'Erreur système',
        description: 'Une erreur inattendue s\'est produite',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'super_admin': 'Super Admin',
      'franchise_owner': 'Propriétaire',
      'gym_manager': 'Manager',
      'gym_staff': 'Personnel'
    }
    return roles[role] || role
  }

  const getAccessSummary = () => {
    return {
      franchises: selectedFranchises.length,
      gyms: selectedGyms.length,
      totalPossibleFranchises: franchises.length,
      totalPossibleGyms: gyms.length
    }
  }

  const isGymInFranchise = (gymId: string, franchiseId: string) => {
    return gyms.find(gym => gym.id === gymId)?.franchise_id === franchiseId
  }

  const getFranchiseGyms = (franchiseId: string) => {
    return gyms.filter(gym => gym.franchise_id === franchiseId)
  }

  const filteredFranchises = franchises.filter(franchise =>
    franchise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    franchise.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    franchise.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user) return null

  const summary = getAccessSummary()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#ffffff"
        borderRadius="16px"
        border="1px solid #e5e7eb"
        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        mx={4}
        maxH="90vh"
      >
        <ModalHeader p={6} pb={0}>
          <HStack spacing={4}>
            <Box
              p={3}
              bg="#f3f4f6"
              borderRadius="12px"
            >
              <Icon as={Shield} boxSize={5} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Gestion des accès
              </Text>
              <HStack spacing={3}>
                <Avatar size="sm" name={user.full_name} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="500" color="#1a1a1a">
                    {user.full_name}
                  </Text>
                  <Badge
                    colorScheme="blue"
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="6px"
                  >
                    {getRoleLabel(user.role)}
                  </Badge>
                </VStack>
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton 
          top={4}
          right={4}
          bg="#f3f4f6"
          borderRadius="8px"
          _hover={{ bg: "#e5e7eb" }}
          isDisabled={saving}
        />
        
        <ModalBody p={6} pt={4} overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Résumé des accès */}
            <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
              <VStack spacing={3}>
                <Text fontSize="sm" fontWeight="600" color="#374151">
                  Résumé des accès sélectionnés
                </Text>
                <SimpleGrid columns={2} spacing={4} w="full">
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="700" color="#6366f1">
                      {summary.franchises}
                    </Text>
                    <Text fontSize="xs" color="#6b7280">
                      Franchise{summary.franchises !== 1 ? 's' : ''} / {summary.totalPossibleFranchises}
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="700" color="#059669">
                      {summary.gyms}
                    </Text>
                    <Text fontSize="xs" color="#6b7280">
                      Salle{summary.gyms !== 1 ? 's' : ''} / {summary.totalPossibleGyms}
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </Box>

            {/* Recherche */}
            <InputGroup>
              <InputLeftElement>
                <Icon as={Search} boxSize={4} color="#6b7280" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher une franchise ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
                border="1px solid #d1d5db"
                borderRadius="8px"
                fontSize="sm"
                _focus={{
                  borderColor: "#374151",
                  boxShadow: "0 0 0 1px #374151"
                }}
              />
            </InputGroup>

            {/* Liste des franchises et salles */}
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="#374151" />
                <Text mt={4} color="#6b7280">Chargement des données...</Text>
              </Box>
            ) : filteredFranchises.length === 0 ? (
              <Alert status="info" borderRadius="12px">
                <AlertIcon />
                <AlertDescription>
                  Aucune franchise trouvée avec ces critères.
                </AlertDescription>
              </Alert>
            ) : (
              <Accordion allowMultiple>
                {filteredFranchises.map((franchise) => {
                  const franchiseGyms = getFranchiseGyms(franchise.id)
                  const isSelected = selectedFranchises.includes(franchise.id)
                  const selectedGymsInFranchise = franchiseGyms.filter(gym => 
                    selectedGyms.includes(gym.id)
                  ).length
                  
                  return (
                    <AccordionItem key={franchise.id} border="1px solid #e5e7eb" borderRadius="8px" mb={3}>
                      <AccordionButton
                        p={4}
                        _hover={{ bg: "#f9fafb" }}
                        borderRadius="8px"
                      >
                        <HStack flex={1} justify="space-between">
                          <HStack spacing={4}>
                            <Checkbox
                              isChecked={isSelected}
                              onChange={() => handleFranchiseToggle(franchise.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Icon as={Building2} boxSize={5} color="#6366f1" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="600" color="#1a1a1a">
                                {franchise.name}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="xs" color="#6b7280">
                                  {franchise.brand_name}
                                </Text>
                                <Icon as={MapPin} boxSize={3} color="#6b7280" />
                                <Text fontSize="xs" color="#6b7280">
                                  {franchise.city}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>
                          <HStack spacing={3}>
                            <Badge
                              colorScheme={isSelected ? 'green' : 'gray'}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="6px"
                            >
                              {selectedGymsInFranchise}/{franchiseGyms.length} salles
                            </Badge>
                            <AccordionIcon />
                          </HStack>
                        </HStack>
                      </AccordionButton>
                      
                      <AccordionPanel p={4} pt={0}>
                        <VStack spacing={3} align="stretch">
                          <Divider />
                          
                          {/* Actions rapides */}
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="#6b7280" fontWeight="600">
                              SALLES DE CETTE FRANCHISE
                            </Text>
                            <Button
                              size="xs"
                              variant="ghost"
                              color="#6366f1"
                              onClick={() => handleSelectAllGymsInFranchise(franchise.id)}
                              _hover={{ bg: "#f0f9ff" }}
                            >
                              {franchiseGyms.every(gym => selectedGyms.includes(gym.id)) 
                                ? 'Tout désélectionner' 
                                : 'Tout sélectionner'
                              }
                            </Button>
                          </HStack>

                          {/* Liste des salles */}
                          <VStack spacing={2} align="stretch">
                            {franchiseGyms.map((gym) => {
                              const isGymSelected = selectedGyms.includes(gym.id)
                              
                              return (
                                <Box
                                  key={gym.id}
                                  p={3}
                                  bg={isGymSelected ? "#f0f9ff" : "white"}
                                  border="1px solid"
                                  borderColor={isGymSelected ? "#0ea5e9" : "#e5e7eb"}
                                  borderRadius="8px"
                                  cursor="pointer"
                                  onClick={() => handleGymToggle(gym.id, franchise.id)}
                                  _hover={{ bg: isGymSelected ? "#e0f2fe" : "#f9fafb" }}
                                  transition="all 0.2s"
                                >
                                  <HStack spacing={3}>
                                    <Checkbox
                                      isChecked={isGymSelected}
                                      readOnly
                                    />
                                    <Icon as={Users} boxSize={4} color="#059669" />
                                    <VStack align="start" spacing={0} flex={1}>
                                      <Text fontSize="sm" fontWeight="500" color="#1a1a1a">
                                        {gym.name}
                                      </Text>
                                      <Text fontSize="xs" color="#6b7280">
                                        {gym.city} • {gym.address}
                                      </Text>
                                    </VStack>
                                    <Badge
                                      colorScheme={gym.status === 'active' ? 'green' : 'gray'}
                                      fontSize="xs"
                                      px={2}
                                      py={1}
                                      borderRadius="6px"
                                    >
                                      {gym.status}
                                    </Badge>
                                  </HStack>
                                </Box>
                              )
                            })}
                          </VStack>
                          
                          {franchiseGyms.length === 0 && (
                            <Text fontSize="sm" color="#6b7280" textAlign="center" py={4}>
                              Aucune salle dans cette franchise
                            </Text>
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter p={6} pt={4}>
          <HStack spacing={3} w="full" justify="space-between">
            <Text fontSize="sm" color="#6b7280">
              {summary.franchises} franchise{summary.franchises !== 1 ? 's' : ''}, {summary.gyms} salle{summary.gyms !== 1 ? 's' : ''} sélectionnée{summary.gyms !== 1 ? 's' : ''}
            </Text>
            <HStack spacing={3}>
              <Button
                bg="#f3f4f6"
                color="#6b7280"
                borderRadius="12px"
                h="48px"
                px={6}
                fontWeight="600"
                onClick={onClose}
                isDisabled={saving}
                _hover={{
                  bg: "#e5e7eb",
                  color: "#374151"
                }}
                transition="all 0.2s"
              >
                Annuler
              </Button>
              <Button
                bg="#059669"
                color="white"
                borderRadius="12px"
                h="48px"
                px={6}
                fontWeight="600"
                onClick={saveAccessChanges}
                isLoading={saving}
                loadingText="Sauvegarde..."
                leftIcon={<Icon as={Save} />}
                _hover={{
                  bg: "#047857",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
                }}
                _active={{
                  transform: "translateY(0px)"
                }}
                transition="all 0.2s"
              >
                Sauvegarder
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}