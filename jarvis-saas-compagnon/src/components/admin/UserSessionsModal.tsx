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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  Avatar,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Globe, Shield, LogOut, AlertTriangle, RefreshCw, MoreVertical, Users } from 'lucide-react'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface UserSession {
  id: string
  user_id: string
  user_email: string
  user_role: string
  session_token: string
  device_info: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  device_fingerprint: string | null
  location_data: Record<string, any>
  is_active: boolean
  last_activity: string
  session_duration: number
  login_method: string
  trust_level: 'trusted' | 'normal' | 'suspicious'
  failed_actions: number
  created_at: string
  expires_at: string
  terminated_at: string | null
  termination_reason: string | null
  terminated_by: string | null
  full_name: string
  status: 'online' | 'idle' | 'away' | 'inactive'
  session_age_seconds: number
  inactive_seconds: number
}

interface SessionStats {
  total_active_sessions: number
  online_users: number
  idle_users: number
  away_users: number
  inactive_users: number
  suspicious_sessions: number
  total_users: number
  sessions_by_role: Array<{ role: string; count: number }>
  top_devices: Array<{ device: string; count: number }>
  top_locations: Array<{ location: string; count: number }>
}

interface UserSessionsModalProps {
  isOpen: boolean
  onClose: () => void
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function UserSessionsModal({ isOpen, onClose }: UserSessionsModalProps) {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [stats, setStats] = useState<SessionStats>({
    total_active_sessions: 0,
    online_users: 0,
    idle_users: 0,
    away_users: 0,
    inactive_users: 0,
    suspicious_sessions: 0,
    total_users: 0,
    sessions_by_role: [],
    top_devices: [],
    top_locations: []
  })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [trustFilter, setTrustFilter] = useState('')
  
  // Confirmation de déconnexion
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure()
  const [sessionToTerminate, setSessionToTerminate] = useState<UserSession | null>(null)
  const [terminateAll, setTerminateAll] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  
  const toast = useToast()

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (isOpen) {
      loadSessions()
      const interval = setInterval(loadSessions, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen, statusFilter, roleFilter, trustFilter])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '100'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (roleFilter) params.append('role', roleFilter)
      if (trustFilter) params.append('trust_level', trustFilter)

      const response = await fetch(`/api/admin/sessions?${params}`)
      const result = await response.json()

      if (result.success) {
        setSessions(result.data.sessions)
        setStats(result.data.stats)
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible de charger les sessions',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Erreur chargement sessions:', error)
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSessions()
    setRefreshing(false)
    toast({
      title: 'Données actualisées',
      description: 'Les sessions ont été rechargées',
      status: 'success',
      duration: 2000,
    })
  }

  const handleTerminateSession = (session: UserSession, all: boolean = false) => {
    setSessionToTerminate(session)
    setTerminateAll(all)
    onConfirmOpen()
  }

  const confirmTerminateSession = async () => {
    if (!sessionToTerminate) return

    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: terminateAll ? undefined : sessionToTerminate.session_token,
          user_id: terminateAll ? sessionToTerminate.user_id : undefined,
          terminate_all: terminateAll
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Session(s) terminée(s)',
          description: result.message,
          status: 'success',
          duration: 3000,
        })
        loadSessions() // Recharger la liste
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible de terminer la session',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Erreur terminaison session:', error)
      toast({
        title: 'Erreur système',
        description: 'Une erreur inattendue s\'est produite',
        status: 'error',
        duration: 5000,
      })
    } finally {
      onConfirmClose()
      setSessionToTerminate(null)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'online': return 'green'
      case 'idle': return 'yellow'
      case 'away': return 'orange'
      case 'inactive': return 'gray'
      default: return 'gray'
    }
  }

  const getTrustBadgeColor = (trust: string) => {
    switch (trust) {
      case 'trusted': return 'green'
      case 'normal': return 'blue'
      case 'suspicious': return 'red'
      default: return 'gray'
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

  const getDeviceIcon = (deviceInfo: Record<string, any>) => {
    const device = deviceInfo?.device_type || deviceInfo?.platform || 'desktop'
    if (device.includes('mobile') || device.includes('Mobile')) {
      return Smartphone
    }
    return Monitor
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatLastActivity = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'À l\'instant'
    if (diffMinutes < 60) return `Il y a ${diffMinutes}m`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    
    const diffDays = Math.floor(diffHours / 24)
    return `Il y a ${diffDays}j`
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
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
                  Sessions utilisateur
                </Text>
                <Text fontSize="sm" color="#6b7280">
                  Surveillance et gestion des connexions actives
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
          
          <ModalBody p={6} pt={4} overflowY="auto">
            <VStack spacing={6} align="stretch">
              {/* Statistiques */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
                  <Stat>
                    <StatLabel fontSize="xs" color="#6b7280">Sessions actives</StatLabel>
                    <StatNumber fontSize="lg" color="#1a1a1a">{stats.total_active_sessions}</StatNumber>
                    <StatHelpText fontSize="xs" color="#6b7280">{stats.total_users} utilisateurs</StatHelpText>
                  </Stat>
                </Box>
                <Box p={4} bg="#f0f9ff" borderRadius="12px" border="1px solid #0ea5e9">
                  <Stat>
                    <StatLabel fontSize="xs" color="#0369a1">En ligne</StatLabel>
                    <StatNumber fontSize="lg" color="#0369a1">{stats.online_users}</StatNumber>
                    <StatHelpText fontSize="xs" color="#0369a1">Actifs maintenant</StatHelpText>
                  </Stat>
                </Box>
                <Box p={4} bg="#fefce8" borderRadius="12px" border="1px solid #eab308">
                  <Stat>
                    <StatLabel fontSize="xs" color="#a16207">Inactifs</StatLabel>
                    <StatNumber fontSize="lg" color="#a16207">{stats.idle_users + stats.away_users}</StatNumber>
                    <StatHelpText fontSize="xs" color="#a16207">Idle + Away</StatHelpText>
                  </Stat>
                </Box>
                <Box p={4} bg="#fef2f2" borderRadius="12px" border="1px solid #ef4444">
                  <Stat>
                    <StatLabel fontSize="xs" color="#dc2626">Suspects</StatLabel>
                    <StatNumber fontSize="lg" color="#dc2626">{stats.suspicious_sessions}</StatNumber>
                    <StatHelpText fontSize="xs" color="#dc2626">Surveillance requise</StatHelpText>
                  </Stat>
                </Box>
              </SimpleGrid>

              {/* Filtres */}
              <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
                <VStack spacing={4}>
                  <HStack w="full" justify="space-between">
                    <Text fontSize="sm" fontWeight="600" color="#374151">
                      Filtres et actualisation
                    </Text>
                    <Button
                      size="sm"
                      bg="#374151"
                      color="white"
                      borderRadius="8px"
                      leftIcon={<Icon as={RefreshCw} boxSize={3} />}
                      onClick={handleRefresh}
                      isLoading={refreshing}
                      _hover={{ bg: "#1f2937" }}
                    >
                      Actualiser
                    </Button>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} w="full">
                    <Select
                      placeholder="Statut"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      bg="white"
                      border="1px solid #d1d5db"
                      borderRadius="8px"
                      fontSize="sm"
                    >
                      <option value="online">En ligne</option>
                      <option value="idle">Inactif</option>
                      <option value="away">Absent</option>
                      <option value="inactive">Déconnecté</option>
                    </Select>
                    
                    <Select
                      placeholder="Rôle"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      bg="white"
                      border="1px solid #d1d5db"
                      borderRadius="8px"
                      fontSize="sm"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="franchise_owner">Propriétaire</option>
                      <option value="gym_manager">Manager</option>
                      <option value="gym_staff">Personnel</option>
                    </Select>
                    
                    <Select
                      placeholder="Niveau de confiance"
                      value={trustFilter}
                      onChange={(e) => setTrustFilter(e.target.value)}
                      bg="white"
                      border="1px solid #d1d5db"
                      borderRadius="8px"
                      fontSize="sm"
                    >
                      <option value="trusted">Fiable</option>
                      <option value="normal">Normal</option>
                      <option value="suspicious">Suspect</option>
                    </Select>
                  </SimpleGrid>
                </VStack>
              </Box>

              {/* Tableau des sessions */}
              {loading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="lg" color="#374151" />
                  <Text mt={4} color="#6b7280">Chargement des sessions...</Text>
                </Box>
              ) : sessions.length === 0 ? (
                <Alert status="info" borderRadius="12px">
                  <AlertIcon />
                  <AlertDescription>
                    Aucune session active trouvée avec ces filtres.
                  </AlertDescription>
                </Alert>
              ) : (
                <Box
                  border="1px solid #e5e7eb"
                  borderRadius="12px"
                  overflow="hidden"
                  bg="white"
                >
                  <Table variant="simple" size="sm">
                    <Thead bg="#f9fafb">
                      <Tr>
                        <Th fontSize="xs" color="#374151" fontWeight="600">Utilisateur</Th>
                        <Th fontSize="xs" color="#374151" fontWeight="600">Statut</Th>
                        <Th fontSize="xs" color="#374151" fontWeight="600">Device</Th>
                        <Th fontSize="xs" color="#374151" fontWeight="600">Localisation</Th>
                        <Th fontSize="xs" color="#374151" fontWeight="600">Durée</Th>
                        <Th fontSize="xs" color="#374151" fontWeight="600">Dernière activité</Th>
                        <Th fontSize="xs" color="#374151" fontWeight="600">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sessions.map((session) => (
                        <Tr key={session.id} _hover={{ bg: "#f9fafb" }}>
                          <Td>
                            <HStack spacing={3}>
                              <Avatar size="sm" name={session.full_name} />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="500" color="#1a1a1a">
                                  {session.full_name}
                                </Text>
                                <Text fontSize="xs" color="#6b7280">
                                  {getRoleLabel(session.user_role)}
                                </Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Badge
                                colorScheme={getStatusBadgeColor(session.status)}
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="6px"
                              >
                                {session.status}
                              </Badge>
                              <Badge
                                colorScheme={getTrustBadgeColor(session.trust_level)}
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="6px"
                              >
                                {session.trust_level}
                              </Badge>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Icon as={getDeviceIcon(session.device_info)} boxSize={4} color="#6b7280" />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="#1a1a1a">
                                  {session.device_info?.browser || 'Unknown'}
                                </Text>
                                <Text fontSize="xs" color="#6b7280">
                                  {session.device_info?.os || 'Unknown OS'}
                                </Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Icon as={Globe} boxSize={4} color="#6b7280" />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="#1a1a1a">
                                  {session.location_data?.country || 'Unknown'}
                                </Text>
                                <Text fontSize="xs" color="#6b7280">
                                  {session.ip_address || 'No IP'}
                                </Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <Text fontSize="xs" color="#6b7280">
                              {formatDuration(session.session_duration)}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="xs" color="#6b7280">
                              {formatLastActivity(session.last_activity)}
                            </Text>
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={Button}
                                size="sm"
                                variant="ghost"
                                color="#6b7280"
                                _hover={{ bg: "#f3f4f6" }}
                              >
                                <Icon as={MoreVertical} boxSize={4} />
                              </MenuButton>
                              <MenuList>
                                <MenuItem
                                  icon={<Icon as={LogOut} boxSize={4} />}
                                  onClick={() => handleTerminateSession(session, false)}
                                >
                                  Déconnecter cette session
                                </MenuItem>
                                <MenuItem
                                  icon={<Icon as={AlertTriangle} boxSize={4} />}
                                  onClick={() => handleTerminateSession(session, true)}
                                  color="red.500"
                                >
                                  Déconnecter toutes les sessions
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter p={6} pt={4}>
            <HStack spacing={3} w="full" justify="space-between">
              <Text fontSize="sm" color="#6b7280">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} active{sessions.length !== 1 ? 's' : ''}
              </Text>
              <Button
                bg="#f3f4f6"
                color="#6b7280"
                borderRadius="12px"
                h="48px"
                px={6}
                fontWeight="600"
                onClick={onClose}
                _hover={{
                  bg: "#e5e7eb",
                  color: "#374151"
                }}
                transition="all 0.2s"
              >
                Fermer
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dialog de confirmation */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onConfirmClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmer la déconnexion
            </AlertDialogHeader>

            <AlertDialogBody>
              {terminateAll ? (
                <>
                  Êtes-vous sûr de vouloir déconnecter <strong>toutes les sessions</strong> de{' '}
                  <strong>{sessionToTerminate?.full_name}</strong> ?
                  <br /><br />
                  Cette action est irréversible et forcera l'utilisateur à se reconnecter.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir déconnecter cette session de{' '}
                  <strong>{sessionToTerminate?.full_name}</strong> ?
                  <br /><br />
                  L'utilisateur devra se reconnecter pour continuer à utiliser l'application.
                </>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onConfirmClose}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={confirmTerminateSession} ml={3}>
                {terminateAll ? 'Déconnecter tout' : 'Déconnecter'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}