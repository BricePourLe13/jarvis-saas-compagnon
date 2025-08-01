'use client'

import { 
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  useToast,
  Spinner,
  Icon,
  Flex,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Checkbox
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { UserPlus, Users, Shield, Mail, Calendar, CheckCircle, Clock, Edit, Trash2, Activity, MoreHorizontal, Monitor, Building2, History, Bell } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import EditUserModal from '@/components/admin/EditUserModal'
import DeleteUserModal from '@/components/admin/DeleteUserModal'
import ManagePermissionsModal from '@/components/admin/ManagePermissionsModal'
import ActivityLogsModal from '@/components/admin/ActivityLogsModal'
import BulkOperationsModal from '@/components/admin/BulkOperationsModal'
import UserSessionsModal from '@/components/admin/UserSessionsModal'
import AccessManagementModal from '@/components/admin/AccessManagementModal'
import UserAuditModal from '@/components/admin/UserAuditModal'
import NotificationPreferencesModal from '@/components/admin/NotificationPreferencesModal'
import { Bell } from 'lucide-react'
import type { User, UserRole } from '@/types/franchise'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface InviteForm {
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner'
  franchise_access: string[]
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'super_admin': return 'purple'
    case 'franchise_owner': return 'blue'
    case 'gym_manager': return 'green'
    case 'gym_staff': return 'gray'
    default: return 'gray'
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'super_admin': return 'Super Admin'
    case 'franchise_owner': return 'Propriétaire'
    case 'gym_manager': return 'Manager'
    case 'gym_staff': return 'Staff'
    default: return role
  }
}

function InviteModal({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState<InviteForm>({
    email: '',
    full_name: '',
    role: 'franchise_owner',
    franchise_access: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [franchises, setFranchises] = useState<Array<{id: string, name: string}>>([])
  const toast = useToast()

  // Charger les franchises pour la sélection
  useEffect(() => {
    if (isOpen) {
      fetchFranchises()
    }
  }, [isOpen])

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/admin/franchises')
      const data = await response.json()
      if (data.success) {
        setFranchises(data.data)
      }
    } catch (error) {
      console.error('Erreur chargement franchises:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email invalide'
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nom complet requis'
    }

    if (formData.role === 'franchise_owner' && formData.franchise_access.length === 0) {
      newErrors.franchise_access = 'Au moins une franchise requise'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Invitation envoyée',
          description: result.message,
          status: 'success',
          duration: 5000,
        })
        onSuccess()
        handleClose()
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible d\'envoyer l\'invitation',
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
      email: '',
      full_name: '',
      role: 'franchise_owner',
      franchise_access: []
    })
    setErrors({})
    onClose()
  }

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
              <Icon as={UserPlus} boxSize={5} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Inviter un administrateur
              </Text>
              <Text fontSize="sm" color="#6b7280">
                Ajoutez un nouveau membre à votre équipe
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
            <FormControl isInvalid={!!errors.email} isRequired>
              <FormLabel color="#374151" fontSize="sm" fontWeight="600" mb={2}>
                Email
              </FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
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

            <FormControl isRequired>
              <FormLabel color="#374151" fontSize="sm" fontWeight="600" mb={2}>
                Rôle
              </FormLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
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
                <option value="franchise_owner">Propriétaire de Franchise</option>
                <option value="super_admin">Super Administrateur</option>
              </Select>
            </FormControl>

            {formData.role === 'franchise_owner' && (
              <FormControl isInvalid={!!errors.franchise_access} isRequired>
                <FormLabel>Franchises</FormLabel>
                <Select
                  placeholder="Sélectionner une franchise"
                  onChange={(e) => {
                    if (e.target.value && !formData.franchise_access.includes(e.target.value)) {
                      setFormData({
                        ...formData,
                        franchise_access: [...formData.franchise_access, e.target.value]
                      })
                    }
                  }}
                >
                  {franchises.map(franchise => (
                    <option key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </option>
                  ))}
                </Select>
                {formData.franchise_access.length > 0 && (
                  <Box mt={2}>
                    <HStack spacing={2} flexWrap="wrap">
                      {formData.franchise_access.map(franchiseId => {
                        const franchise = franchises.find(f => f.id === franchiseId)
                        return (
                          <Badge
                            key={franchiseId}
                            colorScheme="blue"
                            cursor="pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                franchise_access: formData.franchise_access.filter(id => id !== franchiseId)
                              })
                            }}
                          >
                            {franchise?.name} ✕
                          </Badge>
                        )
                      })}
                    </HStack>
                  </Box>
                )}
                <FormErrorMessage>{errors.franchise_access}</FormErrorMessage>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter p={6} pt={4}>
          <HStack spacing={3} w="full" justify="end">
            <Button
              bg="#f3f4f6"
              color="#6b7280"
              borderRadius="12px"
              h="48px"
              px={6}
              fontWeight="600"
              onClick={handleClose}
              _hover={{
                bg: "#e5e7eb",
                color: "#374151"
              }}
              transition="all 0.2s"
            >
              Annuler
            </Button>
            <Button
              bg="#374151"
              color="white"
              borderRadius="12px"
              h="48px"
              px={6}
              fontWeight="600"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Envoi..."
              leftIcon={<Icon as={Mail} />}
              _hover={{
                bg: "#1f2937",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(55, 65, 81, 0.3)"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              transition="all 0.2s"
            >
              Envoyer l&apos;invitation
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    super_admins: 0
  })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isPermissionsOpen, onOpen: onPermissionsOpen, onClose: onPermissionsClose } = useDisclosure()
  const { isOpen: isActivityOpen, onOpen: onActivityOpen, onClose: onActivityClose } = useDisclosure()
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure()
  const { isOpen: isSessionsOpen, onOpen: onSessionsOpen, onClose: onSessionsClose } = useDisclosure()
  const { isOpen: isAccessOpen, onOpen: onAccessOpen, onClose: onAccessClose } = useDisclosure()
  const { isOpen: isAuditOpen, onOpen: onAuditOpen, onClose: onAuditClose } = useDisclosure()
  const { isOpen: isNotifOpen, onOpen: onNotifOpen, onClose: onNotifClose } = useDisclosure()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectAllMode, setSelectAllMode] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  // Fonctions de sélection multiple
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id)
      if (isSelected) {
        return prev.filter(u => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
      setSelectAllMode(false)
    } else {
      setSelectedUsers([...users])
      setSelectAllMode(true)
    }
  }

  const clearSelection = () => {
    setSelectedUsers([])
    setSelectAllMode(false)
  }

  const isUserSelected = (userId: string) => {
    return selectedUsers.some(u => u.id === userId)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (data.success && data.data) {
        // Enrichir les données avec le statut d'invitation
        const enrichedUsers: User[] = data.data.map((user: Record<string, unknown>) => {
          // Déterminer le statut d'invitation
          let invitationStatus: 'pending' | 'accepted' | 'expired' = 'accepted'
          
          if (!user.is_active && !user.last_login) {
            // Utilisateur jamais connecté = invitation en attente
            const daysSinceCreation = user.created_at 
              ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0
            
            invitationStatus = daysSinceCreation > 7 ? 'expired' : 'pending'
          }
          
          return {
            ...user,
            invitation_status: invitationStatus,
            invited_at: user.created_at
          } as User
        })
        
        setUsers(enrichedUsers)
        
        // Calculer les stats
        const activeUsers = enrichedUsers.filter((u: User) => u.is_active)
        const pendingUsers = enrichedUsers.filter((u: User) => u.invitation_status === 'pending')
        const superAdmins = enrichedUsers.filter((u: User) => u.role === 'super_admin')
        
        const newStats = {
          total: enrichedUsers.length,
          active: activeUsers.length,
          pending: pendingUsers.length,
          super_admins: superAdmins.length
        }
        
        setStats(newStats)
      } else {
        console.error('❌ Réponse API invalide:', data)
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvitation = async (email: string) => {
    try {
      const response = await fetch('/api/admin/invitations/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Invitation renvoyée',
          description: result.message,
          status: 'success',
          duration: 5000,
        })
        fetchUsers() // Rafraîchir la liste
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible de renvoyer l\'invitation',
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
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    onEditOpen()
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    onDeleteOpen()
  }

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user)
    onPermissionsOpen()
  }

  const handleManageAccess = (user: User) => {
    setSelectedUser(user)
    onAccessOpen()
  }

  const handleViewAudit = (user: User) => {
    setSelectedUser(user)
    onAuditOpen()
  }

  const handleNotifications = (user: User) => {
    setSelectedUser(user)
    onNotifOpen()
  }

  const handleUserSessions = (user: User) => {
    setSelectedUser(user)
    onSessionsOpen()
  }

  const handleCleanupUser = async (email: string) => {
    try {
      const response = await fetch('/api/admin/users/cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Utilisateur nettoyé',
          description: `${email} supprimé, vous pouvez renvoyer une invitation`,
          status: 'success',
          duration: 3000,
        })
        // Rafraîchir la liste
        await fetchUsers()
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Erreur lors du nettoyage',
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
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getInvitationBadge = (status?: 'pending' | 'accepted' | 'expired') => {
    switch (status) {
      case 'pending':
        return (
          <Box
            px={3}
            py={1}
            bg="#fef3c7"
            color="#92400e"
            fontSize="xs"
            fontWeight="600"
            borderRadius="8px"
            border="1px solid #fbbf24"
          >
            En attente
          </Box>
        )
      case 'expired':
        return (
          <Box
            px={3}
            py={1}
            bg="#fee2e2"
            color="#991b1b"
            fontSize="xs"
            fontWeight="600"
            borderRadius="8px"
            border="1px solid #f87171"
          >
            Expirée
          </Box>
        )
      case 'accepted':
      default:
        return (
          <Box
            px={3}
            py={1}
            bg="#dcfce7"
            color="#166534"
            fontSize="xs"
            fontWeight="600"
            borderRadius="8px"
            border="1px solid #4ade80"
          >
            Acceptée
          </Box>
        )
    }
  }

  return (
    <AuthGuard requiredRole="super_admin">
      <Box minH="100vh" bg="#fafafa">
        <Container maxW="7xl" py={12}>
          <VStack spacing={10} align="stretch">
            {/* Header moderne */}
            <Box>
              <HStack justify="space-between" align="center" mb={6}>
                <VStack align="start" spacing={2}>
                  <HStack spacing={4}>
                    <Box
                      p={3}
                      bg="#ffffff"
                      borderRadius="16px"
                      border="1px solid #e5e7eb"
                      boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
                    >
                      <Icon as={Users} boxSize={6} color="#374151" />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text
                        fontSize="2xl"
                        fontWeight="800"
                        color="#1a1a1a"
                        letterSpacing="1px"
                      >
                        GESTION DE L'ÉQUIPE
                      </Text>
                      <Text color="#6b7280" fontSize="md">
                        Gérez les accès administrateurs de votre plateforme JARVIS
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
                <HStack spacing={4}>
                  {selectedUsers.length > 0 && (
                    <HStack spacing={3} p={3} bg="#fef3c7" borderRadius="12px" border="1px solid #f59e0b">
                      <Text fontSize="sm" fontWeight="600" color="#92400e">
                        {selectedUsers.length} sélectionné(s)
                      </Text>
                      <Button
                        size="sm"
                        bg="#f59e0b"
                        color="white"
                        borderRadius="8px"
                        leftIcon={<Icon as={MoreHorizontal} boxSize={3} />}
                        onClick={onBulkOpen}
                        _hover={{ bg: "#d97706" }}
                      >
                        Actions
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        color="#92400e"
                        onClick={clearSelection}
                        _hover={{ bg: "#fde68a" }}
                      >
                        Annuler
                      </Button>
                    </HStack>
                  )}
                  <Button
                    bg="#059669"
                    color="white"
                    borderRadius="12px"
                    h="50px"
                    px={6}
                    fontWeight="600"
                    leftIcon={<Icon as={Monitor} />}
                    onClick={onSessionsOpen}
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
                    Sessions
                  </Button>
                  <Button
                    bg="#6366f1"
                    color="white"
                    borderRadius="12px"
                    h="50px"
                    px={6}
                    fontWeight="600"
                    leftIcon={<Icon as={Activity} />}
                    onClick={onActivityOpen}
                    _hover={{
                      bg: "#4f46e5",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
                    }}
                    _active={{
                      transform: "translateY(0px)"
                    }}
                    transition="all 0.2s"
                  >
                    Analytics
                  </Button>
                  <Button
                    bg="#374151"
                    color="white"
                    borderRadius="12px"
                    h="50px"
                    px={6}
                    fontWeight="600"
                    leftIcon={<Icon as={UserPlus} />}
                    onClick={onOpen}
                    _hover={{
                      bg: "#1f2937",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(55, 65, 81, 0.3)"
                    }}
                    _active={{
                      transform: "translateY(0px)"
                    }}
                    transition="all 0.2s"
                  >
                    Inviter un admin
                  </Button>
                </HStack>
              </HStack>
            </Box>

            {/* Stats Cards modernes */}
            <HStack spacing={6} flexWrap="wrap">
              <Box 
                flex="1" 
                minW="200px"
                bg="#ffffff"
                borderRadius="16px"
                border="1px solid #e5e7eb"
                p={6}
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
                _hover={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  transform: "translateY(-1px)"
                }}
                transition="all 0.2s"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="800" color="#1a1a1a">
                      {stats.total}
                    </Text>
                    <Text fontSize="sm" color="#6b7280" fontWeight="500">Total utilisateurs</Text>
                  </VStack>
                  <Box
                    p={3}
                    bg="#f3f4f6"
                    borderRadius="12px"
                  >
                    <Icon as={Users} boxSize={5} color="#374151" />
                  </Box>
                </HStack>
              </Box>

              <Box 
                flex="1" 
                minW="200px"
                bg="#ffffff"
                borderRadius="16px"
                border="1px solid #e5e7eb"
                p={6}
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
                _hover={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  transform: "translateY(-1px)"
                }}
                transition="all 0.2s"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="800" color="#1a1a1a">
                      {stats.active}
                    </Text>
                    <Text fontSize="sm" color="#6b7280" fontWeight="500">Actifs</Text>
                  </VStack>
                  <Box
                    p={3}
                    bg="#f0fdf4"
                    borderRadius="12px"
                  >
                    <Icon as={CheckCircle} boxSize={5} color="#16a34a" />
                  </Box>
                </HStack>
              </Box>

              <Box 
                flex="1" 
                minW="200px"
                bg="#ffffff"
                borderRadius="16px"
                border="1px solid #e5e7eb"
                p={6}
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
                _hover={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  transform: "translateY(-1px)"
                }}
                transition="all 0.2s"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="800" color="#1a1a1a">
                      {stats.pending}
                    </Text>
                    <Text fontSize="sm" color="#6b7280" fontWeight="500">En attente</Text>
                  </VStack>
                  <Box
                    p={3}
                    bg="#fef3c7"
                    borderRadius="12px"
                  >
                    <Icon as={Clock} boxSize={5} color="#d97706" />
                  </Box>
                </HStack>
              </Box>

              <Box 
                flex="1" 
                minW="200px"
                bg="#ffffff"
                borderRadius="16px"
                border="1px solid #e5e7eb"
                p={6}
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
                _hover={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  transform: "translateY(-1px)"
                }}
                transition="all 0.2s"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="800" color="#1a1a1a">
                      {stats.super_admins}
                    </Text>
                    <Text fontSize="sm" color="#6b7280" fontWeight="500">Super Admins</Text>
                  </VStack>
                  <Box
                    p={3}
                    bg="#faf5ff"
                    borderRadius="12px"
                  >
                    <Icon as={Shield} boxSize={5} color="#9333ea" />
                  </Box>
                </HStack>
              </Box>
            </HStack>

            {/* Table des utilisateurs moderne */}
            <Box
              bg="#ffffff"
              borderRadius="16px"
              border="1px solid #e5e7eb"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
              overflow="hidden"
            >
              <Box p={6} borderBottom="1px solid #e5e7eb">
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                      Utilisateurs administrateurs
                    </Text>
                    <Text fontSize="sm" color="#6b7280">
                      {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              <Box>
              {loading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" color="blue.500" />
                </Flex>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th w="50px">
                        <Checkbox
                          isChecked={selectedUsers.length === users.length && users.length > 0}
                          isIndeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                          onChange={toggleSelectAll}
                        />
                      </Th>
                      <Th>Utilisateur</Th>
                      <Th>Rôle</Th>
                      <Th>Statut</Th>
                      <Th>Invitation</Th>
                      <Th>Dernière connexion</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users.map((user) => (
                      <Tr key={user.id} bg={isUserSelected(user.id) ? "#f0f9ff" : "white"}>
                        <Td>
                          <Checkbox
                            isChecked={isUserSelected(user.id)}
                            onChange={() => toggleUserSelection(user)}
                          />
                        </Td>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={user.full_name} />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{user.full_name}</Text>
                              <Text fontSize="sm" color="gray.600">{user.email}</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getRoleBadgeColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={user.is_active ? 'green' : 'orange'}>
                            {user.is_active ? 'Actif' : 'En attente'}
                          </Badge>
                        </Td>
                        <Td>
                          {getInvitationBadge(user.invitation_status)}
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">
                            {user.last_login ? formatDate(user.last_login) : 'Jamais'}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            {/* Icône Éditer - toujours visible */}
                            <Tooltip label="Éditer l'utilisateur" hasArrow>
                              <IconButton
                                aria-label="Éditer"
                                icon={<Icon as={Edit} boxSize={4} />}
                                size="sm"
                                bg="#374151"
                                color="white"
                                borderRadius="8px"
                                h="32px"
                                w="32px"
                                onClick={() => handleEditUser(user)}
                                _hover={{
                                  bg: "#1f2937",
                                  transform: "translateY(-1px)"
                                }}
                                _active={{
                                  transform: "translateY(0px)"
                                }}
                                transition="all 0.2s"
                              />
                            </Tooltip>

                            {/* Icône Permissions - sauf pour super_admin */}
                            {user.role !== 'super_admin' && (
                              <Tooltip label="Gérer les permissions" hasArrow>
                                <IconButton
                                  aria-label="Permissions"
                                  icon={<Icon as={Shield} boxSize={4} />}
                                  size="sm"
                                  bg="#6366f1"
                                  color="white"
                                  borderRadius="8px"
                                  h="32px"
                                  w="32px"
                                  onClick={() => handleManagePermissions(user)}
                                  _hover={{
                                    bg: "#4f46e5",
                                    transform: "translateY(-1px)"
                                  }}
                                  _active={{
                                    transform: "translateY(0px)"
                                  }}
                                  transition="all 0.2s"
                                />
                              </Tooltip>
                            )}

                            {/* Icône Sessions - uniquement pour users actifs */}
                            {user.is_active && (
                              <Tooltip label="Voir les sessions actives" hasArrow>
                                <IconButton
                                  aria-label="Sessions"
                                  icon={<Icon as={Monitor} boxSize={4} />}
                                  size="sm"
                                  bg="#3b82f6"
                                  color="white"
                                  borderRadius="8px"
                                  h="32px"
                                  w="32px"
                                  onClick={() => handleUserSessions(user)}
                                  _hover={{
                                    bg: "#2563eb",
                                    transform: "translateY(-1px)"
                                  }}
                                  _active={{
                                    transform: "translateY(0px)"
                                  }}
                                  transition="all 0.2s"
                                />
                              </Tooltip>
                            )}

                            {/* Icône Accès - sauf pour super_admin */}
                            {user.role !== 'super_admin' && (
                              <Tooltip label="Gérer les accès franchises/salles" hasArrow>
                                <IconButton
                                  aria-label="Accès"
                                  icon={<Icon as={Building2} boxSize={4} />}
                                  size="sm"
                                  bg="#dc2626"
                                  color="white"
                                  borderRadius="8px"
                                  h="32px"
                                  w="32px"
                                  onClick={() => handleManageAccess(user)}
                                  _hover={{
                                    bg: "#b91c1c",
                                    transform: "translateY(-1px)"
                                  }}
                                  _active={{
                                    transform: "translateY(0px)"
                                  }}
                                  transition="all 0.2s"
                                />
                              </Tooltip>
                            )}

                            {/* Icône Audit - toujours visible */}
                            <Tooltip label="Voir l'historique des modifications" hasArrow>
                              <IconButton
                                aria-label="Audit"
                                icon={<Icon as={History} boxSize={4} />}
                                size="sm"
                                bg="#7c3aed"
                                color="white"
                                borderRadius="8px"
                                h="32px"
                                w="32px"
                                onClick={() => handleViewAudit(user)}
                                _hover={{
                                  bg: "#6d28d9",
                                  transform: "translateY(-1px)"
                                }}
                                _active={{
                                  transform: "translateY(0px)"
                                }}
                                transition="all 0.2s"
                              />
                            </Tooltip>

                            {/* Icône Notifications - sauf pour super_admin */}
                            {user.role !== 'super_admin' && (
                              <Tooltip label="Gérer les notifications" hasArrow>
                                <IconButton
                                  aria-label="Notifications"
                                  icon={<Icon as={Bell} boxSize={4} />}
                                  size="sm"
                                  bg="#f59e0b"
                                  color="white"
                                  borderRadius="8px"
                                  h="32px"
                                  w="32px"
                                  onClick={() => handleNotifications(user)}
                                  _hover={{ bg: "#d97706", transform: "translateY(-1px)" }}
                                  _active={{ transform: "translateY(0px)" }}
                                  transition="all 0.2s"
                                />
                              </Tooltip>
                            )}

                            {/* Actions selon statut */}
                            {!user.is_active ? (
                              <>
                                <Tooltip label="Renvoyer l'invitation" hasArrow>
                                  <IconButton
                                    aria-label="Renvoyer"
                                    icon={<Icon as={Mail} boxSize={4} />}
                                    size="sm"
                                    bg="#059669"
                                    color="white"
                                    borderRadius="8px"
                                    h="32px"
                                    w="32px"
                                    onClick={() => handleResendInvitation(user.email)}
                                    _hover={{
                                      bg: "#047857",
                                      transform: "translateY(-1px)"
                                    }}
                                    _active={{
                                      transform: "translateY(0px)"
                                    }}
                                    transition="all 0.2s"
                                  />
                                </Tooltip>
                                <Tooltip label="Supprimer pour renvoyer une nouvelle invitation" hasArrow>
                                  <IconButton
                                    aria-label="Nettoyer"
                                    icon={<Icon as={Trash2} boxSize={4} />}
                                    size="sm"
                                    bg="#f3f4f6"
                                    color="#6b7280"
                                    borderRadius="8px"
                                    h="32px"
                                    w="32px"
                                    onClick={() => handleCleanupUser(user.email)}
                                    _hover={{
                                      bg: "#e5e7eb",
                                      color: "#374151"
                                    }}
                                    transition="all 0.2s"
                                  />
                                </Tooltip>
                              </>
                            ) : (
                              /* Icône Supprimer - pour utilisateurs actifs */
                              <Tooltip label="Supprimer l'utilisateur" hasArrow>
                                <IconButton
                                  aria-label="Supprimer"
                                  icon={<Icon as={Trash2} boxSize={4} />}
                                  size="sm"
                                  bg="#dc2626"
                                  color="white"
                                  borderRadius="8px"
                                  h="32px"
                                  w="32px"
                                  onClick={() => handleDeleteUser(user)}
                                  _hover={{
                                    bg: "#b91c1c",
                                    transform: "translateY(-1px)"
                                  }}
                                  _active={{
                                    transform: "translateY(0px)"
                                  }}
                                  transition="all 0.2s"
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
              </Box>
            </Box>

            {/* Modal d'invitation */}
            <InviteModal
              isOpen={isOpen}
              onClose={onClose}
              onSuccess={fetchUsers}
            />

            {/* Modal d'édition utilisateur */}
            <EditUserModal
              isOpen={isEditOpen}
              onClose={onEditClose}
              user={selectedUser}
              onSuccess={fetchUsers}
            />

            {/* Modal de suppression utilisateur */}
            <DeleteUserModal
              isOpen={isDeleteOpen}
              onClose={onDeleteClose}
              user={selectedUser}
              onSuccess={fetchUsers}
            />

            {/* Modal de gestion des permissions */}
            <ManagePermissionsModal
              isOpen={isPermissionsOpen}
              onClose={onPermissionsClose}
              user={selectedUser}
              onSuccess={fetchUsers}
            />

            {/* Modal des logs d'activité */}
            <ActivityLogsModal
              isOpen={isActivityOpen}
              onClose={onActivityClose}
            />

            {/* Modal des opérations en masse */}
            <BulkOperationsModal
              isOpen={isBulkOpen}
              onClose={onBulkClose}
              selectedUsers={selectedUsers}
              onSuccess={() => {
                fetchUsers()
                clearSelection()
              }}
            />

            {/* Modal des sessions utilisateur */}
            <UserSessionsModal
              isOpen={isSessionsOpen}
              onClose={onSessionsClose}
            />

            {/* Modal de gestion des accès */}
            <AccessManagementModal
              isOpen={isAccessOpen}
              onClose={onAccessClose}
              user={selectedUser}
              onSuccess={fetchUsers}
            />

            {/* Modal d'audit utilisateur */}
            <UserAuditModal
              isOpen={isAuditOpen}
              onClose={onAuditClose}
              user={selectedUser}
            />

            {/* Modal de préférences de notification */}
            <NotificationPreferencesModal
              isOpen={isNotifOpen}
              onClose={onNotifClose}
              user={selectedUser}
              onSuccess={fetchUsers}
            />
          </VStack>
        </Container>
      </Box>
    </AuthGuard>
  )
} 