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
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Avatar,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Code,
  Flex,
  Tooltip,
  Select,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { 
  History, 
  User, 
  Shield, 
  Building2, 
  Users, 
  Eye, 
  Calendar,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

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

interface AuditLog {
  id: string
  user_id: string
  user_email: string
  user_role: string
  action_type: string
  target_type: string | null
  target_id: string | null
  target_name: string | null
  description: string
  details: Record<string, any>
  old_values: Record<string, any>
  new_values: Record<string, any>
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  success: boolean
  error_message: string | null
  ip_address: string | null
  created_at: string
  full_name: string
}

interface AuditStats {
  total_modifications: number
  profile_changes: number
  permission_changes: number
  access_changes: number
  last_modification: string | null
  risk_score: number
  most_active_period: string
}

interface UserAuditModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function UserAuditModal({ isOpen, onClose, user }: UserAuditModalProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats>({
    total_modifications: 0,
    profile_changes: 0,
    permission_changes: 0,
    access_changes: 0,
    last_modification: null,
    risk_score: 0,
    most_active_period: 'N/A'
  })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filtres
  const [actionFilter, setActionFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [daysFilter, setDaysFilter] = useState('30')
  const [searchTerm, setSearchTerm] = useState('')
  
  const toast = useToast()

  // Charger les données à l'ouverture
  useEffect(() => {
    if (isOpen && user) {
      loadUserAuditLogs()
    }
  }, [isOpen, user, actionFilter, severityFilter, daysFilter])

  const loadUserAuditLogs = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        user_id: user.id,
        days: daysFilter,
        limit: '100'
      })
      
      if (actionFilter) params.append('action_type', actionFilter)
      if (severityFilter) params.append('severity', severityFilter)

      const response = await fetch(`/api/admin/activity?${params}`)
      const result = await response.json()

      if (result.success) {
        const userLogs = result.data.logs.filter((log: AuditLog) => 
          log.target_type === 'user' && log.target_id === user.id
        )
        setAuditLogs(userLogs)
        calculateStats(userLogs)
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Impossible de charger l\'audit',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Erreur chargement audit:', error)
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

  const calculateStats = (logs: AuditLog[]) => {
    const profileChanges = logs.filter(log => 
      ['user_updated', 'profile_update'].includes(log.action_type)
    ).length

    const permissionChanges = logs.filter(log => 
      ['permissions_updated', 'role_changed'].includes(log.action_type)
    ).length

    const accessChanges = logs.filter(log => 
      log.action_type === 'permissions_updated' && 
      (log.details?.franchise_changes || log.details?.gym_changes)
    ).length

    const riskScores = logs.map(log => {
      switch (log.risk_level) {
        case 'critical': return 10
        case 'high': return 7
        case 'medium': return 4
        case 'low': return 1
        default: return 0
      }
    })

    const avgRiskScore = riskScores.length > 0 
      ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
      : 0

    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    setStats({
      total_modifications: logs.length,
      profile_changes: profileChanges,
      permission_changes: permissionChanges,
      access_changes: accessChanges,
      last_modification: sortedLogs[0]?.created_at || null,
      risk_score: avgRiskScore,
      most_active_period: getMostActivePeriod(logs)
    })
  }

  const getMostActivePeriod = (logs: AuditLog[]) => {
    if (logs.length === 0) return 'N/A'
    
    const periods = logs.reduce((acc, log) => {
      const hour = new Date(log.created_at).getHours()
      const period = hour < 12 ? 'Matin' : hour < 18 ? 'Après-midi' : 'Soir'
      acc[period] = (acc[period] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(periods)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUserAuditLogs()
    setRefreshing(false)
    toast({
      title: 'Audit actualisé',
      description: 'L\'historique a été rechargé',
      status: 'success',
      duration: 2000,
    })
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_updated':
      case 'profile_update':
        return User
      case 'permissions_updated':
      case 'role_changed':
        return Shield
      case 'user_created':
        return Users
      default:
        return History
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'user_updated':
      case 'profile_update':
        return '#6366f1'
      case 'permissions_updated':
      case 'role_changed':
        return '#dc2626'
      case 'user_created':
        return '#059669'
      default:
        return '#6b7280'
    }
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

  const getSuccessIcon = (success: boolean) => {
    return success ? CheckCircle : XCircle
  }

  const getSuccessColor = (success: boolean) => {
    return success ? '#059669' : '#dc2626'
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

  const formatDateRelative = (dateStr: string) => {
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

  const renderValueChange = (oldVal: any, newVal: any, field: string) => {
    if (oldVal === newVal) return null
    
    return (
      <Box p={2} bg="#f9fafb" borderRadius="8px" border="1px solid #e5e7eb">
        <Text fontSize="xs" fontWeight="600" color="#374151" mb={1}>
          {field}
        </Text>
        <HStack spacing={2} align="center">
          <Code fontSize="xs" bg="#fef2f2" color="#dc2626" px={2} py={1} borderRadius="4px">
            {oldVal || 'N/A'}
          </Code>
          <Icon as={ChevronRight} boxSize={3} color="#6b7280" />
          <Code fontSize="xs" bg="#f0fdf4" color="#059669" px={2} py={1} borderRadius="4px">
            {newVal || 'N/A'}
          </Code>
        </HStack>
      </Box>
    )
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
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
              <Icon as={History} boxSize={5} color="#374151" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="700" color="#1a1a1a">
                Audit utilisateur
              </Text>
              <HStack spacing={3}>
                <Avatar size="sm" name={user.full_name} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="500" color="#1a1a1a">
                    {user.full_name}
                  </Text>
                  <Text fontSize="xs" color="#6b7280">
                    {user.email}
                  </Text>
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
        />
        
        <ModalBody p={6} pt={4} overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Statistiques d'audit */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Box p={4} bg="#f9fafb" borderRadius="12px" border="1px solid #e5e7eb">
                <Stat>
                  <StatLabel fontSize="xs" color="#6b7280">Total modifications</StatLabel>
                  <StatNumber fontSize="lg" color="#1a1a1a">{stats.total_modifications}</StatNumber>
                  <StatHelpText fontSize="xs" color="#6b7280">{daysFilter} derniers jours</StatHelpText>
                </Stat>
              </Box>
              <Box p={4} bg="#f0f9ff" borderRadius="12px" border="1px solid #0ea5e9">
                <Stat>
                  <StatLabel fontSize="xs" color="#0369a1">Profil</StatLabel>
                  <StatNumber fontSize="lg" color="#0369a1">{stats.profile_changes}</StatNumber>
                  <StatHelpText fontSize="xs" color="#0369a1">Modifications profil</StatHelpText>
                </Stat>
              </Box>
              <Box p={4} bg="#fef2f2" borderRadius="12px" border="1px solid #ef4444">
                <Stat>
                  <StatLabel fontSize="xs" color="#dc2626">Permissions</StatLabel>
                  <StatNumber fontSize="lg" color="#dc2626">{stats.permission_changes}</StatNumber>
                  <StatHelpText fontSize="xs" color="#dc2626">Changements permissions</StatHelpText>
                </Stat>
              </Box>
              <Box p={4} bg="#f0fdf4" borderRadius="12px" border="1px solid #22c55e">
                <Stat>
                  <StatLabel fontSize="xs" color="#059669">Score risque</StatLabel>
                  <StatNumber fontSize="lg" color="#059669">{stats.risk_score}/10</StatNumber>
                  <StatHelpText fontSize="xs" color="#059669">Moyenne pondérée</StatHelpText>
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
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    bg="white"
                    border="1px solid #d1d5db"
                    borderRadius="8px"
                    fontSize="sm"
                  >
                    <option value="user_updated">Profil modifié</option>
                    <option value="permissions_updated">Permissions</option>
                    <option value="role_changed">Rôle modifié</option>
                    <option value="user_created">Utilisateur créé</option>
                  </Select>
                  
                  <Select
                    placeholder="Sévérité"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    bg="white"
                    border="1px solid #d1d5db"
                    borderRadius="8px"
                    fontSize="sm"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Attention</option>
                    <option value="error">Erreur</option>
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
                    <option value="7">7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">90 derniers jours</option>
                    <option value="365">1 an</option>
                  </Select>
                </SimpleGrid>
              </VStack>
            </Box>

            {/* Timeline des modifications */}
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="#374151" />
                <Text mt={4} color="#6b7280">Chargement de l'audit...</Text>
              </Box>
            ) : filteredLogs.length === 0 ? (
              <Alert status="info" borderRadius="12px">
                <AlertIcon />
                <AlertDescription>
                  Aucune modification trouvée pour cet utilisateur avec ces filtres.
                </AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" fontWeight="600" color="#374151">
                  Timeline des modifications ({filteredLogs.length})
                </Text>
                
                <VStack spacing={3} align="stretch">
                  {filteredLogs.map((log, index) => (
                    <Box
                      key={log.id}
                      position="relative"
                      pl={8}
                      _before={{
                        content: '""',
                        position: 'absolute',
                        left: '15px',
                        top: '48px',
                        bottom: index === filteredLogs.length - 1 ? 'auto' : '-12px',
                        width: '2px',
                        bg: '#e5e7eb',
                        display: index === filteredLogs.length - 1 ? 'none' : 'block'
                      }}
                    >
                      <Box
                        position="absolute"
                        left="0"
                        top="12px"
                        w="8"
                        h="8"
                        bg={getActionColor(log.action_type)}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border="3px solid white"
                        boxShadow="0 0 0 1px #e5e7eb"
                      >
                        <Icon as={getActionIcon(log.action_type)} boxSize={3} color="white" />
                      </Box>
                      
                      <Box
                        p={4}
                        bg="white"
                        border="1px solid #e5e7eb"
                        borderRadius="12px"
                        _hover={{ bg: "#f9fafb" }}
                        transition="all 0.2s"
                      >
                        <HStack justify="space-between" mb={2}>
                          <HStack spacing={3}>
                            <Text fontSize="sm" fontWeight="600" color="#1a1a1a">
                              {log.description}
                            </Text>
                            <Badge
                              colorScheme={getRiskBadgeColor(log.risk_level)}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="6px"
                            >
                              {log.risk_level}
                            </Badge>
                            <HStack spacing={1}>
                              <Icon 
                                as={getSuccessIcon(log.success)} 
                                boxSize={3} 
                                color={getSuccessColor(log.success)} 
                              />
                              <Text fontSize="xs" color={getSuccessColor(log.success)}>
                                {log.success ? 'Succès' : 'Échec'}
                              </Text>
                            </HStack>
                          </HStack>
                          <VStack align="end" spacing={0}>
                            <Text fontSize="xs" color="#6b7280">
                              {formatDateRelative(log.created_at)}
                            </Text>
                            <Text fontSize="xs" color="#9ca3af">
                              {formatDate(log.created_at)}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        {/* Détails des changements */}
                        {Object.keys(log.old_values).length > 0 && (
                          <Box mt={3}>
                            <Text fontSize="xs" fontWeight="600" color="#374151" mb={2}>
                              Modifications :
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                              {Object.entries(log.old_values).map(([field, oldVal]) => 
                                renderValueChange(oldVal, log.new_values[field], field)
                              )}
                            </SimpleGrid>
                          </Box>
                        )}
                        
                        {/* Métadonnées */}
                        <HStack mt={3} spacing={4} fontSize="xs" color="#6b7280">
                          <HStack spacing={1}>
                            <Icon as={User} boxSize={3} />
                            <Text>{log.full_name}</Text>
                          </HStack>
                          {log.ip_address && (
                            <HStack spacing={1}>
                              <Icon as={Eye} boxSize={3} />
                              <Text>{log.ip_address}</Text>
                            </HStack>
                          )}
                          <HStack spacing={1}>
                            <Icon as={Clock} boxSize={3} />
                            <Text>{log.user_role}</Text>
                          </HStack>
                        </HStack>
                      </Box>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter p={6} pt={4}>
          <HStack spacing={3} w="full" justify="space-between">
            <Text fontSize="sm" color="#6b7280">
              {filteredLogs.length} modification{filteredLogs.length !== 1 ? 's' : ''} affichée{filteredLogs.length !== 1 ? 's' : ''}
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