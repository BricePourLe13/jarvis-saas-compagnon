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
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Switch,
  Text,
  Box,
  Icon,
  FormErrorMessage,
  useToast
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { User, Settings, Shield, Mail } from 'lucide-react'

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
  last_login?: string
  created_at: string
  updated_at: string
  dashboard_preferences?: Record<string, any>
  notification_settings?: Record<string, any>
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

interface UserForm {
  full_name: string
  email: string
  role: 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
  is_active: boolean
  email_notifications: boolean
  push_notifications: boolean
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState<UserForm>({
    full_name: '',
    email: '',
    role: 'franchise_owner',
    is_active: true,
    email_notifications: true,
    push_notifications: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  // Charger les données utilisateur dans le formulaire
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        email_notifications: user.notification_settings?.email_notifications ?? true,
        push_notifications: user.notification_settings?.push_notifications ?? true
      })
      setErrors({})
    }
  }, [user, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nom complet requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !user) return

    setLoading(true)
    try {
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active,
        notification_settings: {
          email_notifications: formData.email_notifications,
          push_notifications: formData.push_notifications,
          reports_frequency: user.notification_settings?.reports_frequency || 'weekly'
        }
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Utilisateur mis à jour',
          description: `${formData.full_name} a été mis à jour avec succès`,
          status: 'success',
          duration: 3000,
        })
        onSuccess()
        handleClose()
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

  const handleClose = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'franchise_owner',
      is_active: true,
      email_notifications: true,
      push_notifications: true
    })
    setErrors({})
    onClose()
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur'
      case 'franchise_owner': return 'Propriétaire de Franchise'
      case 'gym_manager': return 'Manager de Salle'
      case 'gym_staff': return 'Personnel de Salle'
      default: return role
    }
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#ffffff"
        borderRadius="16px"
        border="1px solid #e5e7eb"
        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        mx={4}
      >
        <ModalHeader p={6} pb={0}>
          <HStack spacing={4}>
            <Box
              p={3}
              bg="#f3f4f6"
              borderRadius="12px"
            >
              <Icon as={Settings} boxSize={5} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Modifier l'utilisateur
              </Text>
              <Text fontSize="sm" color="#6b7280">
                Gérez les informations et permissions de {user.full_name}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton 
          top={4}
          right={4}
          bg="#f3f4f6"
          borderRadius="8px"
          _hover={{ bg: "#e5e7eb" }}
        />
        
        <ModalBody p={6} pt={4}>
          <VStack spacing={5}>
            {/* Informations de base */}
            <Box w="full">
              <HStack spacing={3} mb={4}>
                <Icon as={User} boxSize={4} color="#374151" />
                <Text fontSize="md" fontWeight="600" color="#374151">
                  Informations personnelles
                </Text>
              </HStack>
              
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.full_name} isRequired>
                  <FormLabel color="#374151" fontSize="sm" fontWeight="600" mb={2}>
                    Nom complet
                  </FormLabel>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Jean Dupont"
                    bg="#ffffff"
                    border="1px solid"
                    borderColor="#e5e7eb"
                    borderRadius="12px"
                    h="48px"
                    fontSize="15px"
                    color="#1a1a1a"
                    _placeholder={{ color: "#9ca3af" }}
                    _focus={{
                      borderColor: "#374151",
                      boxShadow: "0 0 0 3px rgba(55, 65, 81, 0.1)"
                    }}
                    _hover={{
                      borderColor: "#d1d5db"
                    }}
                  />
                  <FormErrorMessage color="#dc2626" fontSize="sm" mt={2}>
                    {errors.full_name}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.email} isRequired>
                  <FormLabel color="#374151" fontSize="sm" fontWeight="600" mb={2}>
                    Email
                  </FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean@exemple.com"
                    bg="#ffffff"
                    border="1px solid"
                    borderColor="#e5e7eb"
                    borderRadius="12px"
                    h="48px"
                    fontSize="15px"
                    color="#1a1a1a"
                    _placeholder={{ color: "#9ca3af" }}
                    _focus={{
                      borderColor: "#374151",
                      boxShadow: "0 0 0 3px rgba(55, 65, 81, 0.1)"
                    }}
                    _hover={{
                      borderColor: "#d1d5db"
                    }}
                  />
                  <FormErrorMessage color="#dc2626" fontSize="sm" mt={2}>
                    {errors.email}
                  </FormErrorMessage>
                </FormControl>
              </VStack>
            </Box>

            {/* Rôle et statut */}
            <Box w="full">
              <HStack spacing={3} mb={4}>
                <Icon as={Shield} boxSize={4} color="#374151" />
                <Text fontSize="md" fontWeight="600" color="#374151">
                  Rôle et statut
                </Text>
              </HStack>
              
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="#374151" fontSize="sm" fontWeight="600" mb={2}>
                    Rôle
                  </FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    bg="#ffffff"
                    border="1px solid"
                    borderColor="#e5e7eb"
                    borderRadius="12px"
                    h="48px"
                    fontSize="15px"
                    color="#1a1a1a"
                    _focus={{
                      borderColor: "#374151",
                      boxShadow: "0 0 0 3px rgba(55, 65, 81, 0.1)"
                    }}
                    _hover={{
                      borderColor: "#d1d5db"
                    }}
                  >
                    <option value="super_admin">Super Administrateur</option>
                    <option value="franchise_owner">Propriétaire de Franchise</option>
                    <option value="gym_manager">Manager de Salle</option>
                    <option value="gym_staff">Personnel de Salle</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="600" color="#374151">
                        Compte actif
                      </Text>
                      <Text fontSize="xs" color="#6b7280">
                        L'utilisateur peut se connecter
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      colorScheme="gray"
                      size="lg"
                    />
                  </HStack>
                </FormControl>
              </VStack>
            </Box>

            {/* Préférences notifications */}
            <Box w="full">
              <HStack spacing={3} mb={4}>
                <Icon as={Mail} boxSize={4} color="#374151" />
                <Text fontSize="md" fontWeight="600" color="#374151">
                  Notifications
                </Text>
              </HStack>
              
              <VStack spacing={3}>
                <FormControl>
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="500" color="#374151">
                        Notifications email
                      </Text>
                      <Text fontSize="xs" color="#6b7280">
                        Recevoir les emails de notification
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={formData.email_notifications}
                      onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                      colorScheme="gray"
                    />
                  </HStack>
                </FormControl>

                <FormControl>
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="500" color="#374151">
                        Notifications push
                      </Text>
                      <Text fontSize="xs" color="#6b7280">
                        Recevoir les notifications dans le navigateur
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={formData.push_notifications}
                      onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })}
                      colorScheme="gray"
                    />
                  </HStack>
                </FormControl>
              </VStack>
            </Box>
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
              onClick={handleClose}
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
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Sauvegarde..."
              leftIcon={<Icon as={Settings} />}
              transition="all 0.2s"
            >
              Sauvegarder
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}