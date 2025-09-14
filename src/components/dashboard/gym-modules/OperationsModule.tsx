/**
 * 🔧 MODULE OPERATIONS - TEMPS RÉEL SALLE
 * Kiosk status, sessions live, incidents, logs système
 */

'use client'

import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  useColorModeValue,
  Tooltip,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon
} from '@chakra-ui/react'
import {
  Wifi,
  WifiOff,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mic,
  Volume2,
  Server,
  Database,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react'
import { useState, useEffect } from 'react'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface KioskStatus {
  status: 'online' | 'offline' | 'maintenance'
  version: string
  lastHeartbeat: Date
  uptime: number // en secondes
  diagnostics: {
    microphone: 'good' | 'warning' | 'error'
    speakers: 'good' | 'warning' | 'error'
    network: 'good' | 'warning' | 'error'
    storage: 'good' | 'warning' | 'error'
  }
}

interface LiveSession {
  id: string
  sessionId: string
  memberName: string
  memberBadge: string
  startTime: Date
  duration: number // en secondes
  status: 'active' | 'paused' | 'ending'
  aiModel: string
  voiceModel: string
  lastActivity: Date
}

interface SystemLog {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  component: string
  message: string
  details?: any
}

interface Incident {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved'
  createdAt: Date
  resolvedAt?: Date
  assignee?: string
}

// ===========================================
// 🎨 COMPOSANT KIOSK STATUS
// ===========================================

function KioskStatusPanel({ status }: { status: KioskStatus }) {
  const getStatusColor = (status: KioskStatus['status']) => {
    switch (status) {
      case 'online': return 'green'
      case 'offline': return 'red'
      case 'maintenance': return 'orange'
    }
  }

  const getDiagnosticColor = (diagnostic: 'good' | 'warning' | 'error') => {
    switch (diagnostic) {
      case 'good': return 'green'
      case 'warning': return 'orange'
      case 'error': return 'red'
    }
  }

  const getDiagnosticIcon = (diagnostic: 'good' | 'warning' | 'error') => {
    switch (diagnostic) {
      case 'good': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Icon as={status.status === 'online' ? Wifi : WifiOff} size={20} />
            <Text fontSize="lg" fontWeight="bold">Kiosk Status</Text>
          </HStack>
          <Badge colorScheme={getStatusColor(status.status)} variant="solid">
            {status.status.toUpperCase()}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          
          {/* Informations Générales */}
          <SimpleGrid columns={3} spacing={4}>
            <Stat size="sm">
              <StatLabel>Version</StatLabel>
              <StatNumber fontSize="md">{status.version}</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Uptime</StatLabel>
              <StatNumber fontSize="md">{formatUptime(status.uptime)}</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Dernier Signal</StatLabel>
              <StatHelpText fontSize="sm">
                {status.lastHeartbeat.toLocaleTimeString()}
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          <Divider />

          {/* Diagnostics */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={3}>Diagnostics Système</Text>
            <SimpleGrid columns={2} spacing={3}>
              {Object.entries(status.diagnostics).map(([component, diagnostic]) => {
                const Icon = getDiagnosticIcon(diagnostic)
                return (
                  <HStack key={component} spacing={3}>
                    <Icon 
                      as={Icon} 
                      size={16} 
                      color={`var(--chakra-colors-${getDiagnosticColor(diagnostic)}-500)`} 
                    />
                    <Text fontSize="sm" flex={1} textTransform="capitalize">
                      {component}
                    </Text>
                    <Badge colorScheme={getDiagnosticColor(diagnostic)} size="sm">
                      {diagnostic}
                    </Badge>
                  </HStack>
                )
              })}
            </SimpleGrid>
          </Box>

          {/* Actions */}
          <HStack spacing={2}>
            <Button size="sm" leftIcon={<RefreshCw size={14} />} variant="outline">
              Redémarrer
            </Button>
            <Button size="sm" leftIcon={<Settings size={14} />} variant="outline">
              Configurer
            </Button>
            <Button size="sm" leftIcon={<Download size={14} />} variant="outline">
              Logs
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT SESSIONS LIVE
// ===========================================

function LiveSessionsPanel({ sessions }: { sessions: LiveSession[] }) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: LiveSession['status']) => {
    switch (status) {
      case 'active': return 'green'
      case 'paused': return 'orange'
      case 'ending': return 'red'
    }
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <HStack spacing={3}>
            <Activity size={20} />
            <Text fontSize="lg" fontWeight="bold">Sessions Live</Text>
            <Badge colorScheme="gray" variant="outline">0</Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={3} py={6}>
            <Icon as={Users} size={32} color="gray.400" />
            <Text color="gray.600" textAlign="center">
              Aucune session active
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Les conversations apparaîtront ici en temps réel
            </Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Activity size={20} />
            <Text fontSize="lg" fontWeight="bold">Sessions Live</Text>
            <Badge colorScheme="green" variant="solid">{sessions.length}</Badge>
          </HStack>
          <Button size="sm" leftIcon={<RefreshCw size={14} />} variant="outline">
            Actualiser
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {sessions.map(session => (
            <Card key={session.id} variant="outline" size="sm">
              <CardBody p={4}>
                <HStack justify="space-between" align="start">
                  <HStack spacing={3} flex={1}>
                    <Avatar size="sm" name={session.memberName} />
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="bold">
                          {session.memberName}
                        </Text>
                        <Badge colorScheme={getStatusColor(session.status)} size="xs">
                          {session.status}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        {session.memberBadge} • {session.aiModel}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Démarrée à {session.startTime.toLocaleTimeString()}
                      </Text>
                    </VStack>
                  </HStack>

                  <VStack align="end" spacing={2}>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                      {formatDuration(session.duration)}
                    </Text>
                    <HStack spacing={1}>
                      <Tooltip label="Voir conversation">
                        <IconButton
                          aria-label="Voir"
                          icon={<Eye size={14} />}
                          size="xs"
                          variant="outline"
                        />
                      </Tooltip>
                      <Tooltip label="Mettre en pause">
                        <IconButton
                          aria-label="Pause"
                          icon={<Pause size={14} />}
                          size="xs"
                          variant="outline"
                        />
                      </Tooltip>
                    </HStack>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT LOGS SYSTÈME
// ===========================================

function SystemLogsPanel({ logs }: { logs: SystemLog[] }) {
  const getLevelColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'info': return 'blue'
      case 'warning': return 'orange'
      case 'error': return 'red'
    }
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Server size={20} />
            <Text fontSize="lg" fontWeight="bold">Logs Système</Text>
          </HStack>
          <Button size="sm" leftIcon={<Download size={14} />} variant="outline">
            Exporter
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Box maxH="300px" overflowY="auto">
          <VStack spacing={2} align="stretch">
            {logs.slice(0, 10).map(log => (
              <HStack key={log.id} spacing={3} p={2} borderRadius="md" bg="gray.50">
                <Badge colorScheme={getLevelColor(log.level)} size="sm">
                  {log.level.toUpperCase()}
                </Badge>
                <Text fontSize="xs" color="gray.500" minW="60px">
                  {log.timestamp.toLocaleTimeString()}
                </Text>
                <Text fontSize="xs" color="gray.600" minW="80px">
                  {log.component}
                </Text>
                <Text fontSize="xs" flex={1} noOfLines={1}>
                  {log.message}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function OperationsModule({ gymId }: { gymId: string }) {
  const [kioskStatus, setKioskStatus] = useState<KioskStatus | null>(null)
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOperationsData()
    
    // Simuler les mises à jour temps réel
    const interval = setInterval(() => {
      updateLiveData()
    }, 5000)

    return () => clearInterval(interval)
  }, [gymId])

  const loadOperationsData = async () => {
    try {
      // Simuler le chargement
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock data
      setKioskStatus({
        status: 'online',
        version: 'v2.1.3',
        lastHeartbeat: new Date(),
        uptime: 86400 + 3600 + 1800, // 1j 1h 30m
        diagnostics: {
          microphone: 'warning',
          speakers: 'good',
          network: 'good',
          storage: 'good'
        }
      })

      setLiveSessions([
        {
          id: '1',
          sessionId: 'sess_abc123',
          memberName: 'Marie Dubois',
          memberBadge: 'BADGE001',
          startTime: new Date(Date.now() - 180000), // 3 min ago
          duration: 180,
          status: 'active',
          aiModel: 'GPT-4o-mini',
          voiceModel: 'alloy',
          lastActivity: new Date()
        },
        {
          id: '2',
          sessionId: 'sess_def456',
          memberName: 'Jean Martin',
          memberBadge: 'BADGE002',
          startTime: new Date(Date.now() - 420000), // 7 min ago
          duration: 420,
          status: 'active',
          aiModel: 'GPT-4o-mini',
          voiceModel: 'nova',
          lastActivity: new Date(Date.now() - 30000)
        }
      ])

      setSystemLogs([
        {
          id: '1',
          timestamp: new Date(),
          level: 'info',
          component: 'SESSION',
          message: 'Session créée pour membre BADGE001'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 30000),
          level: 'warning',
          component: 'AUDIO',
          message: 'Qualité microphone dégradée détectée'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 60000),
          level: 'info',
          component: 'KIOSK',
          message: 'Heartbeat reçu - système opérationnel'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 120000),
          level: 'error',
          component: 'API',
          message: 'Timeout OpenAI API - retry automatique'
        }
      ])

    } catch (error) {
      console.error('Erreur chargement operations:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateLiveData = () => {
    // Simuler mise à jour des durées de session
    setLiveSessions(prev => prev.map(session => ({
      ...session,
      duration: session.duration + 5,
      lastActivity: new Date()
    })))

    // Ajouter un nouveau log occasionnellement
    if (Math.random() > 0.7) {
      const newLog: SystemLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        level: Math.random() > 0.8 ? 'warning' : 'info',
        component: ['SESSION', 'KIOSK', 'AUDIO', 'API'][Math.floor(Math.random() * 4)],
        message: 'Événement système automatique'
      }
      setSystemLogs(prev => [newLog, ...prev.slice(0, 19)])
    }
  }

  if (loading) {
    return (
      <VStack spacing={4}>
        <Progress size="xs" isIndeterminate colorScheme="blue" />
        <Text color="gray.600">Chargement des données opérationnelles...</Text>
      </VStack>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      
      {/* Kiosk Status */}
      <Box>
        {kioskStatus && <KioskStatusPanel status={kioskStatus} />}
      </Box>

      {/* Layout 2 Colonnes */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        
        {/* Sessions Live */}
        <LiveSessionsPanel sessions={liveSessions} />

        {/* Logs Système */}
        <SystemLogsPanel logs={systemLogs} />

      </SimpleGrid>

    </VStack>
  )
}
