'use client'

import { 
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
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
  Divider
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { UserPlus, Users, Shield, Mail, Calendar, CheckCircle, Clock } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface User {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
  franchise_access?: string[]
  is_active: boolean
  last_login?: string
  created_at: string
}

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
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={UserPlus} color="blue.500" />
            <Text>Inviter un administrateur</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email} isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.full_name} isRequired>
              <FormLabel>Nom complet</FormLabel>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Jean Dupont"
              />
              <FormErrorMessage>{errors.full_name}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Rôle</FormLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
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

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Envoi..."
              leftIcon={<Icon as={Mail} />}
            >
              Envoyer l'invitation
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
  const toast = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (data.success && data.data) {
        setUsers(data.data)
        
        // Calculer les stats
        const activeUsers = data.data.filter((u: User) => u.is_active)
        const superAdmins = data.data.filter((u: User) => u.role === 'super_admin')
        
        const newStats = {
          total: data.data.length,
          active: activeUsers.length,
          pending: data.data.length - activeUsers.length,
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

  return (
    <AuthGuard requiredRole="super_admin">
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={2}>
              <HStack spacing={3}>
                <Icon as={Users} boxSize={8} color="blue.500" />
                <Heading size="lg" color="gray.800">Gestion de l'équipe</Heading>
              </HStack>
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={UserPlus} />}
                onClick={onOpen}
              >
                Inviter un admin
              </Button>
            </HStack>
            <Text color="gray.600">
              Gérez les accès administrateurs de votre plateforme JARVIS
            </Text>
          </Box>

          {/* Stats Cards */}
          <HStack spacing={6} flexWrap="wrap">
            <Card flex="1" minW="200px">
              <CardBody>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {stats.total}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Total utilisateurs</Text>
                  </VStack>
                  <Icon as={Users} boxSize={6} color="blue.500" />
                </HStack>
              </CardBody>
            </Card>

            <Card flex="1" minW="200px">
              <CardBody>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {stats.active}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Actifs</Text>
                  </VStack>
                  <Icon as={CheckCircle} boxSize={6} color="green.500" />
                </HStack>
              </CardBody>
            </Card>

            <Card flex="1" minW="200px">
              <CardBody>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                      {stats.pending}
                    </Text>
                    <Text fontSize="sm" color="gray.600">En attente</Text>
                  </VStack>
                  <Icon as={Clock} boxSize={6} color="orange.500" />
                </HStack>
              </CardBody>
            </Card>

            <Card flex="1" minW="200px">
              <CardBody>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                      {stats.super_admins}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Super Admins</Text>
                  </VStack>
                  <Icon as={Shield} boxSize={6} color="purple.500" />
                </HStack>
              </CardBody>
            </Card>
          </HStack>

          {/* Table des utilisateurs */}
          <Card>
            <CardHeader>
              <Heading size="md">Utilisateurs administrateurs</Heading>
            </CardHeader>
            <CardBody>
              {loading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" color="blue.500" />
                </Flex>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Utilisateur</Th>
                      <Th>Rôle</Th>
                      <Th>Statut</Th>
                      <Th>Dernière connexion</Th>
                      <Th>Créé le</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users.map((user) => (
                      <Tr key={user.id}>
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
                          <HStack spacing={2}>
                            <Badge colorScheme={user.is_active ? 'green' : 'orange'}>
                              {user.is_active ? 'Actif' : 'En attente'}
                            </Badge>
                            {!user.is_active && (
                              <>
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="ghost"
                                  onClick={() => handleResendInvitation(user.email)}
                                  leftIcon={<Icon as={Mail} />}
                                >
                                  Renvoyer
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleCleanupUser(user.email)}
                                  title="Supprimer cet utilisateur pour renvoyer une nouvelle invitation"
                                >
                                  🗑️ Nettoyer
                                </Button>
                              </>
                            )}
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">
                            {user.last_login ? formatDate(user.last_login) : 'Jamais'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">
                            {formatDate(user.created_at)}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </VStack>

        {/* Modal d'invitation */}
        <InviteModal
          isOpen={isOpen}
          onClose={onClose}
          onSuccess={fetchUsers}
        />
      </Container>
    </AuthGuard>
  )
} 