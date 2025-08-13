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
  Text,
  VStack,
  HStack,
  Box,
  Icon,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react'
import { useState } from 'react'
import { Trash2, AlertTriangle, User } from 'lucide-react'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface User {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
  is_active: boolean
}

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function DeleteUserModal({ isOpen, onClose, user, onSuccess }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleDelete = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Utilisateur supprimé',
          description: `${user.full_name} a été supprimé définitivement`,
          status: 'success',
          duration: 3000,
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Erreur lors de la suppression',
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
    <Modal isOpen={isOpen} onClose={onClose} size="md">
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
              bg="#fee2e2"
              borderRadius="12px"
            >
              <Icon as={AlertTriangle} boxSize={5} color="#dc2626" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Supprimer l'utilisateur
              </Text>
              <Text fontSize="sm" color="#6b7280">
                Cette action est irréversible
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
          <VStack spacing={5} align="start">
            {/* Avertissement */}
            <Alert 
              status="warning" 
              bg="#fef3c7" 
              color="#92400e" 
              borderRadius="12px"
              border="1px solid #fbbf24"
            >
              <AlertIcon color="#d97706" />
              <AlertDescription fontSize="sm">
                <strong>Attention :</strong> Cette action supprimera définitivement l'utilisateur 
                et toutes ses données associées. Cette action ne peut pas être annulée.
              </AlertDescription>
            </Alert>

            {/* Informations utilisateur */}
            <Box
              w="full"
              p={4}
              bg="#f9fafb"
              borderRadius="12px"
              border="1px solid #e5e7eb"
            >
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Icon as={User} boxSize={4} color="#6b7280" />
                  <Text fontSize="sm" fontWeight="600" color="#374151">
                    Utilisateur à supprimer
                  </Text>
                </HStack>
                
                <VStack align="start" spacing={1} pl={7}>
                  <Text fontSize="md" fontWeight="600" color="#1a1a1a">
                    {user.full_name}
                  </Text>
                  <Text fontSize="sm" color="#6b7280">
                    {user.email}
                  </Text>
                  <Box
                    px={2}
                    py={1}
                    bg="#e5e7eb"
                    color="#374151"
                    fontSize="xs"
                    fontWeight="500"
                    borderRadius="6px"
                  >
                    {getRoleLabel(user.role)}
                  </Box>
                </VStack>
              </VStack>
            </Box>

            {/* Super admin warning */}
            {user.role === 'super_admin' && (
              <Alert 
                status="error" 
                bg="#fee2e2" 
                color="#991b1b" 
                borderRadius="12px"
                border="1px solid #f87171"
              >
                <AlertIcon color="#dc2626" />
                <AlertDescription fontSize="sm">
                  <strong>Super Administrateur :</strong> Assurez-vous qu'il existe 
                  d'autres super administrateurs avant de supprimer ce compte.
                </AlertDescription>
              </Alert>
            )}

            {/* Confirmation text */}
            <Text fontSize="sm" color="#6b7280" textAlign="center" w="full">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? 
              Tapez le nom complet pour confirmer : <strong>{user.full_name}</strong>
            </Text>
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
              onClick={handleDelete}
              isLoading={loading}
              loadingText="Suppression..."
              leftIcon={<Icon as={Trash2} />}
              transition="all 0.2s"
            >
              Supprimer définitivement
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}