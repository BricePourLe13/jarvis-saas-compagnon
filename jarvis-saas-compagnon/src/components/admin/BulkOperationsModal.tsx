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
  Badge,
  Select,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Divider,
  Checkbox,
  SimpleGrid,
  Progress,
  Flex,
  Avatar,
  Tooltip
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Users, AlertTriangle, CheckCircle, Settings, Trash2, UserX, Shield } from 'lucide-react'
import { logBulkOperation } from '@/lib/activity-logger'
import type { User } from '@/types/franchise'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface BulkOperation {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  confirmationRequired: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface BulkOperationsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedUsers: User[]
  onSuccess: () => void
}

// ===========================================
// 🎯 DÉFINITION DES OPÉRATIONS
// ===========================================

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'deactivate',
    label: 'Désactiver',
    description: 'Désactiver les comptes sélectionnés',
    icon: UserX,
    color: 'orange',
    confirmationRequired: true,
    riskLevel: 'medium'
  },
  {
    id: 'activate',
    label: 'Activer',
    description: 'Activer les comptes sélectionnés',
    icon: CheckCircle,
    color: 'green',
    confirmationRequired: false,
    riskLevel: 'low'
  },
  {
    id: 'change_role',
    label: 'Changer le rôle',
    description: 'Modifier le rôle des utilisateurs sélectionnés',
    icon: Shield,
    color: 'blue',
    confirmationRequired: true,
    riskLevel: 'high'
  },
  {
    id: 'remove_access',
    label: 'Retirer accès',
    description: 'Supprimer tous les accès franchises/salles',
    icon: Settings,
    color: 'yellow',
    confirmationRequired: true,
    riskLevel: 'medium'
  },
  {
    id: 'delete',
    label: 'Supprimer',
    description: 'Supprimer définitivement les comptes',
    icon: Trash2,
    color: 'red',
    confirmationRequired: true,
    riskLevel: 'critical'
  }
]

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function BulkOperationsModal({ 
  isOpen, 
  onClose, 
  selectedUsers, 
  onSuccess 
}: BulkOperationsModalProps) {
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [newRole, setNewRole] = useState<string>('')
  const [confirmationChecked, setConfirmationChecked] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  
  const toast = useToast()

  // Reset state on modal close
  useEffect(() => {
    if (!isOpen) {
      setSelectedOperation('')
      setNewRole('')
      setConfirmationChecked(false)
      setProcessing(false)
      setProgress(0)
      setCurrentStep('')
    }
  }, [isOpen])

  const selectedOperationData = BULK_OPERATIONS.find(op => op.id === selectedOperation)

  const canExecute = () => {
    if (!selectedOperation || selectedUsers.length === 0) return false
    
    if (selectedOperation === 'change_role' && !newRole) return false
    
    if (selectedOperationData?.confirmationRequired && !confirmationChecked) return false
    
    return true
  }

  const executeBulkOperation = async () => {
    if (!canExecute() || !selectedOperationData) return

    setProcessing(true)
    setProgress(0)
    setCurrentStep('Initialisation...')

    try {
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i]
        setCurrentStep(`Traitement ${user.full_name}...`)
        setProgress((i / selectedUsers.length) * 100)

        try {
          let endpoint = ''
          let method = 'PUT'
          let body: any = {}

          switch (selectedOperation) {
            case 'deactivate':
              endpoint = `/api/admin/users/${user.id}`
              body = { is_active: false }
              break
            
            case 'activate':
              endpoint = `/api/admin/users/${user.id}`
              body = { is_active: true }
              break
            
            case 'change_role':
              endpoint = `/api/admin/users/${user.id}`
              body = { role: newRole }
              break
            
            case 'remove_access':
              endpoint = `/api/admin/users/${user.id}`
              body = { 
                franchise_access: [],
                gym_access: []
              }
              break
            
            case 'delete':
              endpoint = `/api/admin/users/${user.id}`
              method = 'DELETE'
              break
          }

          const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method !== 'DELETE' ? JSON.stringify(body) : undefined
          })

          const result = await response.json()

          if (result.success) {
            successCount++
          } else {
            errorCount++
            errors.push(`${user.full_name}: ${result.message}`)
          }

        } catch (error) {
          errorCount++
          errors.push(`${user.full_name}: Erreur réseau`)
        }

        // Petit délai pour éviter de surcharger
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setProgress(100)
      setCurrentStep('Finalisation...')

      // Log de l'opération en masse
      await logBulkOperation(
        selectedOperation,
        selectedUsers.length,
        {
          operation_data: selectedOperationData,
          success_count: successCount,
          error_count: errorCount,
          target_users: selectedUsers.map(u => ({ id: u.id, name: u.full_name })),
          new_role: newRole || undefined
        }
      )

      // Affichage des résultats
      if (errorCount === 0) {
        toast({
          title: 'Opération réussie',
          description: `${successCount} utilisateur(s) traité(s) avec succès`,
          status: 'success',
          duration: 5000,
        })
      } else if (successCount > 0) {
        toast({
          title: 'Opération partiellement réussie',
          description: `${successCount} succès, ${errorCount} échecs`,
          status: 'warning',
          duration: 7000,
        })
      } else {
        toast({
          title: 'Opération échouée',
          description: `Toutes les opérations ont échoué`,
          status: 'error',
          duration: 7000,
        })
      }

      // Attendre un peu puis fermer
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)

    } catch (error) {
      console.error('Erreur opération en masse:', error)
      toast({
        title: 'Erreur système',
        description: 'Une erreur inattendue s\'est produite',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setProcessing(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
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
              <Icon as={Users} boxSize={5} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Opérations en masse
              </Text>
              <Text fontSize="sm" color="#6b7280">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
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
          isDisabled={processing}
        />
        
        <ModalBody p={6} pt={4} overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Utilisateurs sélectionnés */}
            <Box>
              <Text fontSize="sm" fontWeight="600" color="#374151" mb={3}>
                Utilisateurs concernés
              </Text>
              <Box
                maxH="120px"
                overflowY="auto"
                border="1px solid #e5e7eb"
                borderRadius="8px"
                p={3}
                bg="#f9fafb"
              >
                <VStack spacing={2} align="stretch">
                  {selectedUsers.map((user) => (
                    <HStack key={user.id} spacing={3}>
                      <Avatar size="sm" name={user.full_name} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="500" color="#1a1a1a">
                          {user.full_name}
                        </Text>
                        <Text fontSize="xs" color="#6b7280">
                          {user.email} • {user.role}
                        </Text>
                      </VStack>
                      <Badge
                        colorScheme={user.is_active ? 'green' : 'gray'}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="6px"
                      >
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </Box>

            <Divider />

            {/* Sélection de l'opération */}
            <Box>
              <Text fontSize="sm" fontWeight="600" color="#374151" mb={3}>
                Choisir une opération
              </Text>
              <SimpleGrid columns={1} spacing={3}>
                {BULK_OPERATIONS.map((operation) => (
                  <Box
                    key={operation.id}
                    p={4}
                    border="2px solid"
                    borderColor={selectedOperation === operation.id ? "#374151" : "#e5e7eb"}
                    borderRadius="12px"
                    cursor="pointer"
                    onClick={() => setSelectedOperation(operation.id)}
                    bg={selectedOperation === operation.id ? "#f9fafb" : "white"}
                    _hover={{ borderColor: "#374151" }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={3} justify="space-between">
                      <HStack spacing={3}>
                        <Icon as={operation.icon} color={`${operation.color}.500`} boxSize={5} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="600" color="#1a1a1a">
                            {operation.label}
                          </Text>
                          <Text fontSize="xs" color="#6b7280">
                            {operation.description}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge
                        colorScheme={getRiskColor(operation.riskLevel)}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="6px"
                      >
                        {operation.riskLevel}
                      </Badge>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            {/* Options spécifiques */}
            {selectedOperation === 'change_role' && (
              <Box>
                <Text fontSize="sm" fontWeight="600" color="#374151" mb={3}>
                  Nouveau rôle
                </Text>
                <Select
                  placeholder="Sélectionner un rôle"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  bg="white"
                  border="1px solid #d1d5db"
                  borderRadius="8px"
                  fontSize="sm"
                >
                  <option value="gym_staff">Personnel de salle</option>
                  <option value="gym_manager">Manager de salle</option>
                  <option value="franchise_owner">Propriétaire franchise</option>
                  <option value="super_admin">Super Admin</option>
                </Select>
              </Box>
            )}

            {/* Confirmation pour opérations risquées */}
            {selectedOperationData?.confirmationRequired && (
              <Alert status="warning" borderRadius="12px">
                <AlertIcon />
                <Box flex={1}>
                  <AlertDescription fontSize="sm">
                    Cette opération est irréversible et peut affecter {selectedUsers.length} utilisateur(s).
                    <Checkbox
                      mt={2}
                      isChecked={confirmationChecked}
                      onChange={(e) => setConfirmationChecked(e.target.checked)}
                      fontSize="sm"
                    >
                      Je comprends les risques et je confirme l'opération
                    </Checkbox>
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Barre de progression pendant l'exécution */}
            {processing && (
              <Box>
                <VStack spacing={3}>
                  <Progress 
                    value={progress} 
                    colorScheme="blue" 
                    w="full" 
                    borderRadius="8px"
                    bg="#f3f4f6"
                  />
                  <Text fontSize="sm" color="#6b7280" textAlign="center">
                    {currentStep}
                  </Text>
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter p={6} pt={4}>
          <HStack spacing={3} w="full" justify="space-between">
            <Text fontSize="sm" color="#6b7280">
              {selectedUsers.length} utilisateur(s) sélectionné(s)
            </Text>
            <HStack spacing={3}>
              <Button
                variant="secondary"
                borderRadius="12px"
                h="48px"
                px={6}
                fontWeight="600"
                onClick={onClose}
                isDisabled={processing}
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
                onClick={executeBulkOperation}
                isDisabled={!canExecute()}
                isLoading={processing}
                loadingText="Traitement..."
                leftIcon={selectedOperationData && <Icon as={selectedOperationData.icon} />}
                transition="all 0.2s"
              >
                {selectedOperationData?.label || 'Exécuter'}
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}