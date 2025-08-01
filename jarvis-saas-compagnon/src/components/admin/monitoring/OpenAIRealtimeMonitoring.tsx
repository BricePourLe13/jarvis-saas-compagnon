'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  VStack,
  HStack,
  Text,
  Heading,
  SimpleGrid,
  Icon,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Tooltip
} from '@chakra-ui/react'
import {
  Monitor,
  Activity,
  DollarSign,
  Clock,
  Mic,
  Speaker,
  Wifi,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Headphones,
  Radio,
  Volume2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { openaiRealtimeMonitoringService } from '@/lib/openai-realtime-monitoring'
import type { 
  KioskRealtimeStats24h, 
  ActiveRealtimeSession,
  OpenAIRealtimeAudioEvent,
  OpenAIRealtimeWebRTCStats 
} from '@/lib/openai-realtime-monitoring'

interface OpenAIRealtimeMonitoringProps {
  gymId: string
  gymName: string
  kioskSlug: string | null
}

const MotionCard = motion(Card)

export default function OpenAIRealtimeMonitoring({ 
  gymId, 
  gymName, 
  kioskSlug 
}: OpenAIRealtimeMonitoringProps) {
  const [loading, setLoading] = useState(true)
  const [kioskStats, setKioskStats] = useState<KioskRealtimeStats24h | null>(null)
  const [activeSessions, setActiveSessions] = useState<ActiveRealtimeSession[]>([])
  const [audioEvents, setAudioEvents] = useState<OpenAIRealtimeAudioEvent[]>([])
  const [webrtcStats, setWebrtcStats] = useState<OpenAIRealtimeWebRTCStats[]>([])
  const [quickSummary, setQuickSummary] = useState<any>(null)
  const toast = useToast()

  useEffect(() => {
    loadMonitoringData()
    // Actualisation toutes les 30 secondes pour les sessions actives
    const interval = setInterval(loadMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [gymId])

  const loadMonitoringData = async () => {
    try {
      setLoading(true)

      // Chargement parallèle des données
      const [
        kioskStatsResponse,
        activeSessionsResponse,
        quickSummaryResponse
      ] = await Promise.all([
        openaiRealtimeMonitoringService.getKioskStats24h(),
        openaiRealtimeMonitoringService.getActiveSessions(),
        openaiRealtimeMonitoringService.getQuickSummary()
      ])

      // Filtrer les stats pour ce kiosk
      const currentKioskStats = kioskStatsResponse.find(stats => stats.gym_id === gymId)
      setKioskStats(currentKioskStats || null)

      // Filtrer les sessions actives pour ce kiosk
      const currentKioskSessions = activeSessionsResponse.filter(session => session.gym_id === gymId)
      setActiveSessions(currentKioskSessions)

      // Si on a des sessions actives, charger les détails
      if (currentKioskSessions.length > 0) {
        const sessionId = currentKioskSessions[0].id
        const [audioEventsResponse, webrtcStatsResponse] = await Promise.all([
          openaiRealtimeMonitoringService.getSessionAudioEvents(sessionId, 20),
          openaiRealtimeMonitoringService.getSessionWebRTCStats(sessionId, 1)
        ])
        setAudioEvents(audioEventsResponse)
        setWebrtcStats(webrtcStatsResponse)
      } else {
        setAudioEvents([])
        setWebrtcStats([])
      }

      setQuickSummary(quickSummaryResponse)

    } catch (error) {
      console.error('❌ [MONITORING] Erreur chargement données:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les métriques de monitoring',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Chargement du monitoring OpenAI Realtime...</Text>
      </VStack>
    )
  }

  const hasActiveSession = activeSessions.length > 0
  const currentSession = activeSessions[0] || null
  const hasData = kioskStats && kioskStats.sessions_24h > 0

  return (
    <VStack spacing={8} align="stretch">
      
      {/* Header avec statut en temps réel */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        bg={hasActiveSession ? "#f0fdf4" : "#fafafa"}
        border="1px solid"
        borderColor={hasActiveSession ? "#bbf7d0" : "#e5e7eb"}
        borderRadius="12px"
        p={6}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <Box
              w="12px"
              h="12px"
              borderRadius="50%"
              bg={hasActiveSession ? "#22c55e" : "#6b7280"}
            />
            <VStack align="start" spacing={1}>
              <Text fontWeight="600" color="#111827" fontSize="lg">
                {hasActiveSession ? `Session JARVIS Active` : 'Kiosk en Attente'}
              </Text>
              <Text fontSize="sm" color="#6b7280">
                {gymName} • {kioskSlug || 'Kiosk non configuré'}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={3}>
            {hasActiveSession && currentSession && (
              <Badge colorScheme="green" px={3} py={1} borderRadius="6px">
                {Math.floor(currentSession.current_duration_seconds / 60)}min {currentSession.current_duration_seconds % 60}s
              </Badge>
            )}
            <Button
              leftIcon={<Icon as={RefreshCw} />}
              onClick={loadMonitoringData}
              variant="outline"
              size="sm"
              borderRadius="8px"
            >
              Actualiser
            </Button>
          </HStack>
        </HStack>
      </MotionCard>

      {/* Si pas de données */}
      {!hasData && (
        <Alert status="info" borderRadius="12px">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Aucune données disponibles</AlertTitle>
            <AlertDescription fontSize="xs">
              Ce kiosk n'a pas encore de sessions OpenAI Realtime enregistrées. 
              Les métriques apparaîtront après la première utilisation.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Métriques principales 24h */}
      {hasData && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          bg="#ffffff"
          border="1px solid #e5e7eb"
          borderRadius="12px"
          p={6}
        >
          <VStack spacing={6} align="stretch">
            <Heading size="md" color="#111827" fontWeight="600">
              Métriques OpenAI Realtime (24h)
            </Heading>
            
            <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={6}>
              
              {/* Sessions */}
              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Sessions</StatLabel>
                <StatNumber fontSize="2xl" color="#111827">
                  {kioskStats?.sessions_24h || 0}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {kioskStats?.active_sessions || 0} actives
                </StatHelpText>
              </Stat>

              {/* Durée moyenne */}
              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Durée moyenne</StatLabel>
                <StatNumber fontSize="2xl" color="#111827">
                  {kioskStats?.avg_session_duration_seconds ? 
                    `${Math.floor(kioskStats.avg_session_duration_seconds / 60)}m` : '--'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  par session
                </StatHelpText>
              </Stat>

              {/* Coût */}
              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Coût</StatLabel>
                <StatNumber fontSize="2xl" color="#111827">
                  {kioskStats?.total_cost_24h_usd ? 
                    `$${kioskStats.total_cost_24h_usd.toFixed(3)}` : '$0.000'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  dernières 24h
                </StatHelpText>
              </Stat>

              {/* Taux erreur */}
              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Taux erreur</StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color={
                    (kioskStats?.error_rate_percent || 0) > 10 ? "#ef4444" :
                    (kioskStats?.error_rate_percent || 0) > 5 ? "#f59e0b" : "#10b981"
                  }
                >
                  {kioskStats?.error_rate_percent?.toFixed(1) || 0}%
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {kioskStats?.sessions_with_errors || 0} erreurs
                </StatHelpText>
              </Stat>

            </SimpleGrid>
          </VStack>
        </MotionCard>
      )}

      {/* Session active détaillée */}
      {hasActiveSession && currentSession && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          bg="#ffffff"
          border="1px solid #e5e7eb"
          borderRadius="12px"
          p={6}
        >
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="md" color="#111827" fontWeight="600">
                Session Active en Cours
              </Heading>
              <Badge colorScheme="green" px={3} py={1} borderRadius="8px">
                {currentSession.connection_type.toUpperCase()}
              </Badge>
            </HStack>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              
              {/* Interaction */}
              <Card bg="#f8fafc" border="1px solid #e2e8f0" borderRadius="8px" p={4}>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Icon as={Mic} boxSize={4} color="#3b82f6" />
                    <Text fontSize="sm" fontWeight="600" color="#1e293b">
                      Interaction
                    </Text>
                  </HStack>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="#64748b">Tours utilisateur:</Text>
                      <Text fontSize="sm" fontWeight="600">{currentSession.total_user_turns}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="#64748b">Tours IA:</Text>
                      <Text fontSize="sm" fontWeight="600">{currentSession.total_ai_turns}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="#64748b">Interruptions:</Text>
                      <Text fontSize="sm" fontWeight="600">{currentSession.total_interruptions}</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card>

              {/* Coût temps réel */}
              <Card bg="#f8fafc" border="1px solid #e2e8f0" borderRadius="8px" p={4}>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Icon as={DollarSign} boxSize={4} color="#10b981" />
                    <Text fontSize="sm" fontWeight="600" color="#1e293b">
                      Coût Session
                    </Text>
                  </HStack>
                  <VStack spacing={2} align="stretch">
                    <Text fontSize="lg" fontWeight="700" color="#111827">
                      ${currentSession.total_cost_usd?.toFixed(4) || '0.0000'}
                    </Text>
                    <Text fontSize="xs" color="#64748b">
                      Depuis {Math.floor(currentSession.current_duration_seconds / 60)}min
                    </Text>
                  </VStack>
                </VStack>
              </Card>

              {/* Configuration */}
              <Card bg="#f8fafc" border="1px solid #e2e8f0" borderRadius="8px" p={4}>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Icon as={Volume2} boxSize={4} color="#8b5cf6" />
                    <Text fontSize="sm" fontWeight="600" color="#1e293b">
                      Configuration
                    </Text>
                  </HStack>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="#64748b">Voix:</Text>
                      <Text fontSize="sm" fontWeight="600">
                        {currentSession.voice_model || 'Default'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="#64748b">Détection:</Text>
                      <Text fontSize="sm" fontWeight="600">
                        {currentSession.turn_detection_type}
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card>

            </SimpleGrid>
          </VStack>
        </MotionCard>
      )}

      {/* Tabs pour détails techniques */}
      {hasData && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          bg="#ffffff"
          border="1px solid #e5e7eb"
          borderRadius="12px"
          p={6}
        >
          <Tabs colorScheme="blue" variant="enclosed" size="sm">
            <TabList>
              <Tab>
                <Icon as={Activity} mr={2} boxSize={4} />
                Performance
              </Tab>
              <Tab>
                <Icon as={Headphones} mr={2} boxSize={4} />
                Audio
              </Tab>
              <Tab>
                <Icon as={Radio} mr={2} boxSize={4} />
                WebRTC
              </Tab>
              <Tab>
                <Icon as={DollarSign} mr={2} boxSize={4} />
                Coûts
              </Tab>
            </TabList>

            <TabPanels>
              
              {/* Performance */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="sm" color="#111827">Métriques de Performance</Heading>
                  
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    
                    {/* Connexions */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="#374151">Connexions</Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="#6b7280">WebRTC:</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {kioskStats?.webrtc_sessions || 0}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="#6b7280">WebSocket:</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {kioskStats?.websocket_sessions || 0}
                        </Text>
                      </HStack>
                    </VStack>

                    {/* Turns & Interruptions */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="#374151">Interaction</Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="#6b7280">Tours utilisateur moy.:</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {kioskStats?.avg_user_turns?.toFixed(1) || '--'}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="#6b7280">Interruptions moy.:</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {kioskStats?.avg_interruptions?.toFixed(1) || '--'}
                        </Text>
                      </HStack>
                    </VStack>

                  </SimpleGrid>
                </VStack>
              </TabPanel>

              {/* Audio */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="sm" color="#111827">Événements Audio</Heading>
                  
                  {audioEvents.length > 0 ? (
                    <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                      {audioEvents.slice(0, 10).map((event) => (
                        <Box key={event.id} p={3} bg="#f8fafc" borderRadius="8px" border="1px solid #e2e8f0">
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs" fontWeight="600" color="#374151">
                                {event.event_type}
                              </Text>
                              {event.user_transcript && (
                                <Text fontSize="xs" color="#6b7280" noOfLines={1}>
                                  👤 {event.user_transcript}
                                </Text>
                              )}
                              {event.ai_transcript_final && (
                                <Text fontSize="xs" color="#6b7280" noOfLines={1}>
                                  🤖 {event.ai_transcript_final}
                                </Text>
                              )}
                            </VStack>
                            <Text fontSize="xs" color="#9ca3af">
                              {new Date(event.event_timestamp).toLocaleTimeString()}
                            </Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="#6b7280" textAlign="center" py={4}>
                      Aucun événement audio récent
                    </Text>
                  )}
                </VStack>
              </TabPanel>

              {/* WebRTC */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="sm" color="#111827">Qualité WebRTC</Heading>
                  
                  {webrtcStats.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                      {webrtcStats.slice(0, 1).map((stats) => (
                        <VStack key={stats.id} spacing={3} align="stretch">
                          <Text fontSize="sm" fontWeight="600" color="#374151">Dernière mesure</Text>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#6b7280">Connexion:</Text>
                              <Badge 
                                colorScheme={stats.connection_state === 'connected' ? 'green' : 'red'}
                                size="sm"
                              >
                                {stats.connection_state}
                              </Badge>
                            </HStack>
                            {stats.rtt_ms && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="#6b7280">RTT:</Text>
                                <Text fontSize="sm" fontWeight="600">{stats.rtt_ms}ms</Text>
                              </HStack>
                            )}
                            {stats.packet_loss_rate && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="#6b7280">Perte paquets:</Text>
                                <Text fontSize="sm" fontWeight="600">
                                  {(stats.packet_loss_rate * 100).toFixed(1)}%
                                </Text>
                              </HStack>
                            )}
                            {stats.audio_level_input && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="#6b7280">Niveau audio:</Text>
                                <Text fontSize="sm" fontWeight="600">
                                  {(stats.audio_level_input * 100).toFixed(0)}%
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        </VStack>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text fontSize="sm" color="#6b7280" textAlign="center" py={4}>
                      Aucune donnée WebRTC disponible
                    </Text>
                  )}
                </VStack>
              </TabPanel>

              {/* Coûts */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Heading size="sm" color="#111827">Détail des Coûts</Heading>
                  
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    
                    {/* Tokens */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="#374151">Tokens</Text>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280">Input text:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_input_tokens || 0}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280">Output text:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_output_tokens || 0}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280">Audio input:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_input_audio_tokens || 0}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280">Audio output:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_output_audio_tokens || 0}
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>

                    {/* Moyennes */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="#374151">Moyennes</Text>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280">Coût/session:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            ${kioskStats?.avg_cost_per_session_usd?.toFixed(4) || '0.0000'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="#6b7280">Voix utilisée:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.voice_models_used || 'N/A'}
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>

                  </SimpleGrid>
                </VStack>
              </TabPanel>

            </TabPanels>
          </Tabs>
        </MotionCard>
      )}

    </VStack>
  )
}