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
  Input,
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
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Activity, Shield, Users, AlertTriangle, Calendar, Search, Filter, RefreshCw } from 'lucide-react'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface ActivityLog {
  id: string
  user_id: string
  user_email: string
  user_role: string
  action_type: string
  target_type: string | null
  target_id: string | null
  target_name: string | null
  description: string
  details: Record<string, unknown>
  old_values: Record<string, unknown>
  new_values: Record<string, unknown>
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  success: boolean
  error_message: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  full_name: string
  time_category: 'just_now' | 'today' | 'this_week' | 'older'
}

interface ActivityStats {
  total_logs: number
  today_logs: number
  failed_logs: number
  high_risk_logs: number
  top_actions: Array<{ action_type: string; count: number }>
  top_users: Array<{ user_id: string; full_name: string; count: number }>
}

interface ActivityLogsModalProps {
  isOpen: boolean
  onClose: () => void
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function ActivityLogsModal({ isOpen, onClose }: ActivityLogsModalProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityStats>({
    total_logs: 0,
    today_logs: 0,
    failed_logs: 0,
    high_risk_logs: 0,
    top_actions: [],
    top_users: []
  })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filtres
  const [actionTypeFilter, setActionTypeFilter] = useState('')
  const [riskLevelFilter, setRiskLevelFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [daysFilter, setDaysFilter] = useState('7')
  
  const toast = useToast()

  // Charger les données à l'ouverture
  useEffect(() => {
    if (isOpen) {
      loadActivityLogs()
    }
  }, [isOpen, actionTypeFilter, riskLevelFilter, daysFilter])

  const loadActivityLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        days: daysFilter,
        limit: '100'
      })
      
      if (actionTypeFilter) params.append('action_type', actionTypeFilter)
      if (riskLevelFilter) params.append('risk_level', riskLevelFilter)

      const response = await fetch(`/api/admin/activity?${params}`)
      const result = await response.json()

      if (result.success) {
        setLogs(result.data.logs)
        setStats(result.data.stats)
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible de charger les logs',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error)
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
    await loadActivityLogs()
    setRefreshing(false)
    toast({
      title: 'Données actualisées',
      description: 'Les logs d\'activité ont été rechargés',
      status: 'success',
      duration: 2000,
    })
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red'
      case 'error': return 'red'
      case 'warning': return 'orange'
      case 'info': return 'blue'
      case 'debug': return 'gray'
      default: return 'gray'
    }
  }

  const getActionTypeDisplay = (actionType: string) => {
    const types: Record<string, string> = {
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'user_created': 'Utilisateur créé',
      'user_updated': 'Utilisateur modifié',
      'user_deleted': 'Utilisateur supprimé',
      'permissions_updated': 'Permissions modifiées',
      'invitation_sent': 'Invitation envoyée',
      'franchise_created': 'Franchise créée',
      'gym_created': 'Salle créée',
      'unauthorized_access_attempt': 'Tentative d\'accès non autorisé'
    }
    return types[actionType] || actionType
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
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
              <Icon as={Activity} boxSize={5} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Logs d'activité
              </Text>
              <Text fontSize="sm" color="#6b7280">
                Audit complet des actions utilisateur
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
                  <StatLabel fontSize="xs" color="#6b7280">Total logs</StatLabel>
                  <StatNumber fontSize="lg" color="#1a1a1a">{stats.total_logs}</StatNumber>
                  <StatHelpText fontSize="xs" color="#6b7280">{daysFilter} derniers jours</StatHelpText>
                </Stat>
              </Box>
              <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
                <Stat>
                  <StatLabel fontSize="xs" color="#6b7280">Aujourd'hui</StatLabel>
                  <StatNumber fontSize="lg" color="#1a1a1a">{stats.today_logs}</StatNumber>
                  <StatHelpText fontSize="xs" color="#6b7280">Actions récentes</StatHelpText>
                </Stat>
              </Box>
              <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
                <Stat>
                  <StatLabel fontSize="xs" color="#6b7280">Échecs</StatLabel>
                  <StatNumber fontSize="lg" color="#dc2626">{stats.failed_logs}</StatNumber>
                  <StatHelpText fontSize="xs" color="#6b7280">Actions échouées</StatHelpText>
                </Stat>
              </Box>
              <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
                <Stat>
                  <StatLabel fontSize="xs" color="#6b7280">Risque élevé</StatLabel>
                  <StatNumber fontSize="lg" color="#dc2626">{stats.high_risk_logs}</StatNumber>
                  <StatHelpText fontSize="xs" color="#6b7280">Alerte sécurité</StatHelpText>
                </Stat>
              </Box>
            </SimpleGrid>

            {/* Filtres */}
            <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
              <VStack spacing={4}>
                <HStack w="full" justify="space-between">
                  <Text fontSize="sm" fontWeight="600" color="#374151">
                    Filtres et recherche
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
                
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} w="full">
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={Search} boxSize={4} color="#6b7280" />
                    </InputLeftElement>
                    <Input
                      placeholder="Rechercher..."
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
                  
                  <Select
                    placeholder="Type d'action"
                    value={actionTypeFilter}
                    onChange={(e) => setActionTypeFilter(e.target.value)}
                    bg="white"
                    border="1px solid #d1d5db"
                    borderRadius="8px"
                    fontSize="sm"
                  >
                    <option value="login">Connexions</option>
                    <option value="user_created">Créations utilisateur</option>
                    <option value="user_updated">Modifications utilisateur</option>
                    <option value="permissions_updated">Permissions modifiées</option>
                    <option value="invitation_sent">Invitations</option>
                  </Select>
                  
                  <Select
                    placeholder="Niveau de risque"
                    value={riskLevelFilter}
                    onChange={(e) => setRiskLevelFilter(e.target.value)}
                    bg="white"
                    border="1px solid #d1d5db"
                    borderRadius="8px"
                    fontSize="sm"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Élevé</option>
                    <option value="critical">Critique</option>
                  </Select>
                  
                  <Select
                    value={daysFilter}
                    onChange={(e) => setDaysFilter(e.target.value)}
                    bg="white"
                    border="1px solid #d1d5db"
                    borderRadius="8px"
                    fontSize="sm"
                  >
                    <option value="1">Aujourd'hui</option>
                    <option value="7">7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">90 derniers jours</option>
                  </Select>
                </SimpleGrid>
              </VStack>
            </Box>

            {/* Tableau des logs */}
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="#374151" />
                <Text mt={4} color="#6b7280">Chargement des logs...</Text>
              </Box>
            ) : filteredLogs.length === 0 ? (
              <Alert status="info" borderRadius="12px">
                <AlertIcon />
                <AlertDescription>
                  Aucun log d'activité trouvé avec ces filtres.
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
                      <Th fontSize="xs" color="#374151" fontWeight="600">Action</Th>
                      <Th fontSize="xs" color="#374151" fontWeight="600">Cible</Th>
                      <Th fontSize="xs" color="#374151" fontWeight="600">Risque</Th>
                      <Th fontSize="xs" color="#374151" fontWeight="600">Statut</Th>
                      <Th fontSize="xs" color="#374151" fontWeight="600">Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredLogs.map((log) => (
                      <Tr key={log.id} _hover={{ bg: "#f9fafb" }}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={log.full_name} />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="500" color="#1a1a1a">
                                {log.full_name}
                              </Text>
                              <Text fontSize="xs" color="#6b7280">
                                {log.user_role}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="500" color="#1a1a1a">
                              {getActionTypeDisplay(log.action_type)}
                            </Text>
                            <Text fontSize="xs" color="#6b7280" noOfLines={2}>
                              {log.description}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          {log.target_name ? (
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" color="#1a1a1a">{log.target_name}</Text>
                              <Text fontSize="xs" color="#6b7280">{log.target_type}</Text>
                            </VStack>
                          ) : (
                            <Text fontSize="sm" color="#9ca3af">-</Text>
                          )}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getRiskBadgeColor(log.risk_level)}
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="6px"
                          >
                            {log.risk_level}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Badge
                              colorScheme={log.success ? 'green' : 'red'}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="6px"
                            >
                              {log.success ? 'Succès' : 'Échec'}
                            </Badge>
                            {!log.success && log.error_message && (
                              <Tooltip label={log.error_message} hasArrow>
                                <Icon as={AlertTriangle} boxSize={3} color="#dc2626" />
                              </Tooltip>
                            )}
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color="#6b7280">
                            {formatDate(log.created_at)}
                          </Text>
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
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} affiché{filteredLogs.length !== 1 ? 's' : ''}
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
  )
}