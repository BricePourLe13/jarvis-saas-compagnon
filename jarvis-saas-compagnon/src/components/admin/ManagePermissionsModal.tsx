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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  SimpleGrid,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Shield, Building2, Dumbbell, CheckSquare, Square } from 'lucide-react'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface User {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
  franchise_access?: string[]
  gym_access?: string[]
  is_active: boolean
}

interface Franchise {
  id: string
  name: string
  city: string
  owner_id: string
  is_active: boolean
}

interface Gym {
  id: string
  name: string
  city: string
  franchise_id: string
  franchise_name: string
  manager_id: string | null
  status: string
}

interface ManagePermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function ManagePermissionsModal({ isOpen, onClose, user, onSuccess }: ManagePermissionsModalProps) {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [gyms, setGyms] = useState<Gym[]>([])
  const [selectedFranchises, setSelectedFranchises] = useState<string[]>([])
  const [selectedGyms, setSelectedGyms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const toast = useToast()

  // Charger les données à l'ouverture
  useEffect(() => {
    if (user && isOpen) {
      loadData()
      // Pré-remplir les permissions existantes
      setSelectedFranchises(user.franchise_access || [])
      setSelectedGyms(user.gym_access || [])
    }
  }, [user, isOpen])

  const loadData = async () => {
    setDataLoading(true)
    try {
      const [franchisesRes, gymsRes] = await Promise.all([
        fetch('/api/admin/permissions/franchises'),
        fetch('/api/admin/permissions/gyms')
      ])

      const franchisesData = await franchisesRes.json()
      const gymsData = await gymsRes.json()

      if (franchisesData.success) {
        setFranchises(franchisesData.data)
      }
      if (gymsData.success) {
        setGyms(gymsData.data)
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les franchises et salles',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setDataLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const updateData = {
        franchise_access: selectedFranchises,
        gym_access: selectedGyms
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Permissions mises à jour',
          description: `Les accès de ${user.full_name} ont été mis à jour`,
          status: 'success',
          duration: 3000,
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Erreur lors de la mise à jour',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur système',
        description: 'Une erreur inattendue s\'est produite',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFranchiseToggle = (franchiseId: string) => {
    setSelectedFranchises(prev => 
      prev.includes(franchiseId)
        ? prev.filter(id => id !== franchiseId)
        : [...prev, franchiseId]
    )
  }

  const handleGymToggle = (gymId: string) => {
    setSelectedGyms(prev => 
      prev.includes(gymId)
        ? prev.filter(id => id !== gymId)
        : [...prev, gymId]
    )
  }

  const selectAllFranchises = () => {
    setSelectedFranchises(franchises.map(f => f.id))
  }

  const deselectAllFranchises = () => {
    setSelectedFranchises([])
  }

  const selectAllGyms = () => {
    setSelectedGyms(gyms.map(g => g.id))
  }

  const deselectAllGyms = () => {
    setSelectedGyms([])
  }

  const getRolePermissionHelp = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Les super administrateurs ont accès à tout par défaut. Ces permissions sont optionnelles.'
      case 'franchise_owner':
        return 'Sélectionnez les franchises que cet utilisateur peut gérer.'
      case 'gym_manager':
        return 'Sélectionnez les salles que ce manager peut administrer.'
      case 'gym_staff':
        return 'Sélectionnez les salles où ce membre du personnel peut travailler.'
      default:
        return ''
    }
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="bg.surface"
        borderRadius="16px"
        border="1px solid"
        borderColor="border.default"
        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        mx={4}
        maxH="90vh"
      >
        <ModalHeader p={6} pb={0}>
          <HStack spacing={4}>
            <Box
              p={3}
              bg="bg.muted"
              borderRadius="12px"
            >
              <Icon as={Shield} boxSize={5} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Gérer les permissions
              </Text>
              <Text fontSize="sm" color="#6b7280">
                Configurez les accès de {user.full_name} - {user.role}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton 
          top={4}
          right={4}
          bg="bg.muted"
          borderRadius="8px"
          _hover={{ bg: "bg.subtle" }}
        />
        
        <ModalBody p={6} pt={4} overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Information rôle */}
            <Alert 
              status="info" 
              borderRadius="12px"
              variant="left-accent"
            >
              <AlertIcon />
              <AlertDescription fontSize="sm">
                {getRolePermissionHelp(user.role)}
              </AlertDescription>
            </Alert>

            {dataLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="#374151" />
                <Text mt={4} color="#6b7280">Chargement des données...</Text>
              </Box>
            ) : (
              <Tabs variant="enclosed" colorScheme="gray">
                <TabList>
                  <Tab _selected={{ bg: "gray.800", color: "white" }}>
                    <HStack spacing={2}>
                      <Icon as={Building2} boxSize={4} />
                      <Text>Franchises ({selectedFranchises.length})</Text>
                    </HStack>
                  </Tab>
                  <Tab _selected={{ bg: "gray.800", color: "white" }}>
                    <HStack spacing={2}>
                      <Icon as={Dumbbell} boxSize={4} />
                      <Text>Salles ({selectedGyms.length})</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Tab Franchises */}
                  <TabPanel p={4}>
                    <VStack spacing={4} align="stretch">
                      {/* Actions rapides */}
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="600" color="#374151">
                          {franchises.length} franchise{franchises.length > 1 ? 's' : ''} disponible{franchises.length > 1 ? 's' : ''}
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            leftIcon={<Icon as={CheckSquare} boxSize={3} />}
                            onClick={selectAllFranchises}
                          >
                            Tout sélectionner
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="gray"
                            leftIcon={<Icon as={Square} boxSize={3} />}
                            onClick={deselectAllFranchises}
                          >
                            Tout désélectionner
                          </Button>
                        </HStack>
                      </HStack>

                      {/* Liste franchises */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {franchises.map((franchise) => (
                          <Box
                            key={franchise.id}
                            p={4}
                            bg={selectedFranchises.includes(franchise.id) ? "green.50" : "bg.subtle"}
                            border="1px solid"
                            borderColor={selectedFranchises.includes(franchise.id) ? "green.400" : "border.default"}
                            borderRadius="12px"
                            cursor="pointer"
                            onClick={() => handleFranchiseToggle(franchise.id)}
                            _hover={{
                              borderColor: "gray.800",
                              transform: "translateY(-1px)"
                            }}
                            transition="all 0.2s"
                          >
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" fontWeight="600" color="#1a1a1a">
                                  {franchise.name}
                                </Text>
                                <Text fontSize="xs" color="#6b7280">
                                  {franchise.city}
                                </Text>
                                {!franchise.is_active && (
                                  <Badge colorScheme="red" size="sm">Inactive</Badge>
                                )}
                              </VStack>
                              <Checkbox
                                isChecked={selectedFranchises.includes(franchise.id)}
                                onChange={() => handleFranchiseToggle(franchise.id)}
                                colorScheme="green"
                              />
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  {/* Tab Salles */}
                  <TabPanel p={4}>
                    <VStack spacing={4} align="stretch">
                      {/* Actions rapides */}
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="600" color="#374151">
                          {gyms.length} salle{gyms.length > 1 ? 's' : ''} disponible{gyms.length > 1 ? 's' : ''}
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            leftIcon={<Icon as={CheckSquare} boxSize={3} />}
                            onClick={selectAllGyms}
                          >
                            Tout sélectionner
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="gray"
                            leftIcon={<Icon as={Square} boxSize={3} />}
                            onClick={deselectAllGyms}
                          >
                            Tout désélectionner
                          </Button>
                        </HStack>
                      </HStack>

                      {/* Liste salles */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {gyms.map((gym) => (
                          <Box
                            key={gym.id}
                            p={4}
                            bg={selectedGyms.includes(gym.id) ? "green.50" : "bg.subtle"}
                            border="1px solid"
                            borderColor={selectedGyms.includes(gym.id) ? "green.400" : "border.default"}
                            borderRadius="12px"
                            cursor="pointer"
                            onClick={() => handleGymToggle(gym.id)}
                            _hover={{
                              borderColor: "gray.800",
                              transform: "translateY(-1px)"
                            }}
                            transition="all 0.2s"
                          >
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" fontWeight="600" color="#1a1a1a">
                                  {gym.name}
                                </Text>
                                <Text fontSize="xs" color="#6b7280">
                                  {gym.franchise_name} • {gym.city}
                                </Text>
                                <Badge 
                                  colorScheme={gym.status === 'active' ? 'green' : 'orange'} 
                                  size="sm"
                                >
                                  {gym.status}
                                </Badge>
                              </VStack>
                              <Checkbox
                                isChecked={selectedGyms.includes(gym.id)}
                                onChange={() => handleGymToggle(gym.id)}
                                colorScheme="green"
                              />
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter p={6} pt={4}>
          <HStack spacing={3} w="full" justify="end">
            <Button
              variant="secondary"
              borderRadius="12px"
              h="48px"
              px={6}
              fontWeight="600"
              onClick={onClose}
              transition="all 0.2s"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              borderRadius="12px"
              h="48px"
              px={6}
              fontWeight="600"
              onClick={handleSave}
              isLoading={loading}
              loadingText="Sauvegarde..."
              leftIcon={<Icon as={Shield} />}
              transition="all 0.2s"
            >
              Sauvegarder les permissions
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}