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
  Checkbox,
  SimpleGrid,
  Badge,
  Icon,
  useToast,
  Divider
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Building2, MapPin } from 'lucide-react'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

interface SuperAdminAccessModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onSuccess?: () => void
}

interface Franchise {
  id: string
  name: string
  city: string
  gyms?: Gym[]
}

interface Gym {
  id: string
  name: string
  city: string
}

export default function SuperAdminAccessModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess 
}: SuperAdminAccessModalProps) {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [selectedFranchises, setSelectedFranchises] = useState<string[]>([])
  const [selectedGyms, setSelectedGyms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      loadFranchisesAndGyms()
      loadUserAccess()
    }
  }, [isOpen])

  const loadFranchisesAndGyms = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseSingleton()
      
      const { data: franchiseData, error } = await supabase
        .from('franchises')
        .select(`
          id,
          name,
          city,
          gyms (
            id,
            name,
            city
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFranchises(franchiseData || [])
    } catch (error) {
      console.error('Erreur chargement franchises:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les franchises',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUserAccess = async () => {
    if (!user?.id) return
    
    try {
      const supabase = getSupabaseSingleton()
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('franchise_access, gym_access')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      setSelectedFranchises(userData?.franchise_access || [])
      setSelectedGyms(userData?.gym_access || [])
    } catch (error) {
      console.error('Erreur chargement accès:', error)
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

  const handleSelectAll = () => {
    const allFranchiseIds = franchises.map(f => f.id)
    const allGymIds = franchises.flatMap(f => f.gyms?.map(g => g.id) || [])
    
    setSelectedFranchises(allFranchiseIds)
    setSelectedGyms(allGymIds)
  }

  const handleClearAll = () => {
    setSelectedFranchises([])
    setSelectedGyms([])
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const supabase = getSupabaseSingleton()
      
      const { error } = await supabase
        .from('users')
        .update({
          franchise_access: selectedFranchises,
          gym_access: selectedGyms
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Accès mis à jour',
        description: `Accès configuré pour ${user.full_name}`,
        status: 'success',
        duration: 3000,
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erreur sauvegarde accès:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les accès',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg="white" borderRadius="16px" maxH="90vh">
        <ModalHeader borderBottom="1px solid" borderColor="gray.100">
          <VStack align="start" spacing={2}>
            <Text fontSize="lg" fontWeight="600" color="black">
              Gestion des accès avancée
            </Text>
            <Text fontSize="sm" color="gray.600">
              Configurer les accès de <strong>{user?.full_name}</strong> aux franchises et salles
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6} maxH="60vh" overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Actions rapides */}
            <HStack spacing={3}>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
                isDisabled={loading}
              >
                Tout sélectionner
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAll}
                isDisabled={loading}
              >
                Tout désélectionner
              </Button>
              <Badge colorScheme="blue" px={3} py={1} borderRadius="8px">
                {selectedFranchises.length} franchise{selectedFranchises.length > 1 ? 's' : ''}, {selectedGyms.length} salle{selectedGyms.length > 1 ? 's' : ''}
              </Badge>
            </HStack>

            <Divider />

            {/* Liste des franchises */}
            {franchises.map((franchise) => (
              <Box key={franchise.id} border="1px solid" borderColor="gray.200" borderRadius="12px" p={4}>
                <VStack spacing={4} align="stretch">
                  {/* Header franchise */}
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Checkbox
                        isChecked={selectedFranchises.includes(franchise.id)}
                        onChange={() => handleFranchiseToggle(franchise.id)}
                        colorScheme="blue"
                      />
                      <Icon as={Building2} color="gray.600" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="md" fontWeight="500" color="black">
                          {franchise.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {franchise.city}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge variant="outline" colorScheme="gray">
                      {franchise.gyms?.length || 0} salle{(franchise.gyms?.length || 0) > 1 ? 's' : ''}
                    </Badge>
                  </HStack>

                  {/* Salles de la franchise */}
                  {franchise.gyms && franchise.gyms.length > 0 && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} pl={8}>
                      {franchise.gyms.map((gym) => (
                        <HStack key={gym.id} spacing={3} p={2} borderRadius="8px" _hover={{ bg: "gray.50" }}>
                          <Checkbox
                            isChecked={selectedGyms.includes(gym.id)}
                            onChange={() => handleGymToggle(gym.id)}
                            colorScheme="blue"
                            size="sm"
                          />
                          <Icon as={MapPin} color="gray.500" boxSize={4} />
                          <VStack align="start" spacing={0} flex="1">
                            <Text fontSize="sm" fontWeight="500" color="black">
                              {gym.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {gym.city}
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  )}
                </VStack>
              </Box>
            ))}

            {franchises.length === 0 && !loading && (
              <Text textAlign="center" color="gray.500" py={8}>
                Aucune franchise disponible
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="gray.100">
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button
              bg="black"
              color="white"
              _hover={{ bg: "gray.800" }}
              isLoading={saving}
              onClick={handleSave}
            >
              Sauvegarder les accès
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}