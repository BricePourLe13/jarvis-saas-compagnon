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
import { formatDuration } from '@/lib/format-time'

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
        bg={hasActiveSession ? "green.50" : "bg.subtle"}
        border="1px solid"
        borderColor={hasActiveSession ? "green.200" : "border.default"}
        borderRadius="12px"
        p={6}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <Box
              w="12px"
              h="12px"
              borderRadius="50%"
              bg={hasActiveSession ? "green.500" : "gray.500"}
            />
            <VStack align="start" spacing={1}>
              <Text fontWeight="600" color="text.default" fontSize="lg">
                {hasActiveSession ? `Session JARVIS Active` : 'Kiosk en Attente'}
              </Text>
              <Text fontSize="sm" color="text.muted">
                {gymName} • {kioskSlug || 'Kiosk non configuré'}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={3}>
            {hasActiveSession && currentSession && (
              <Badge colorScheme="green" px={3} py={1} borderRadius="6px">
                {formatDuration(currentSession.current_duration_seconds)}
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
          bg="bg.surface"
          border="1px solid"
          borderColor="border.default"
          borderRadius="12px"
          p={6}
        >
          <VStack spacing={6} align="stretch">
            <Heading size="md" color="text.default" fontWeight="600">
              Métriques OpenAI Realtime (24h)
            </Heading>
            
            <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={6}>
              
              {/* Sessions */}
              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Sessions</StatLabel>
                <StatNumber fontSize="2xl" color="text.default">
                  {kioskStats?.sessions_24h || 0}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {kioskStats?.active_sessions || 0} actives
                </StatHelpText>
              </Stat>

              {/* Durée moyenne */}
              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Durée moyenne</StatLabel>
                <StatNumber fontSize="2xl" color="text.default">
                  {kioskStats?.avg_session_duration_seconds ? 
                    `${Math.floor(kioskStats.avg_session_duration_seconds / 60)}m` : '--'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  par session
                </StatHelpText>
              </Stat>

              {/* Coût */}
              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Coût</StatLabel>
                <StatNumber fontSize="2xl" color="text.default">
                  {kioskStats?.total_cost_24h_usd ? 
                    `$${kioskStats.total_cost_24h_usd.toFixed(3)}` : '$0.000'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  dernières 24h
                </StatHelpText>
              </Stat>

              {/* Taux erreur */}
              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Taux erreur</StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color={
                    (kioskStats?.error_rate_percent || 0) > 10 ? "red.500" :
                    (kioskStats?.error_rate_percent || 0) > 5 ? "orange.500" : "green.500"
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
          bg="bg.surface"
          border="1px solid"
          borderColor="border.default"
          borderRadius="12px"
          p={6}
        >
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="md" color="text.default" fontWeight="600">
                Session Active en Cours
              </Heading>
              <Badge colorScheme="green" px={3} py={1} borderRadius="8px">
                {currentSession.connection_type.toUpperCase()}
              </Badge>
            </HStack>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              
              {/* Interaction */}
              <Card bg="bg.subtle" border="1px solid" borderColor="border.default" borderRadius="8px" p={4}>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Icon as={Mic} boxSize={4} color="blue.500" />
                    <Text fontSize="sm" fontWeight="600" color="text.default">
                      Interaction
                    </Text>
                  </HStack>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="text.muted">Tours utilisateur:</Text>
                      <Text fontSize="sm" fontWeight="600">{currentSession.total_user_turns}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="text.muted">Tours IA:</Text>
                      <Text fontSize="sm" fontWeight="600">{currentSession.total_ai_turns}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="text.muted">Interruptions:</Text>
                      <Text fontSize="sm" fontWeight="600">{currentSession.total_interruptions}</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card>

              {/* Coût temps réel */}
              <Card bg="bg.subtle" border="1px solid" borderColor="border.default" borderRadius="8px" p={4}>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Icon as={DollarSign} boxSize={4} color="green.500" />
                    <Text fontSize="sm" fontWeight="600" color="text.default">
                      Coût Session
                    </Text>
                  </HStack>
                  <VStack spacing={2} align="stretch">
                    <Text fontSize="lg" fontWeight="700" color="text.default">
                      ${currentSession.total_cost_usd?.toFixed(4) || '0.0000'}
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      Depuis {formatDuration(currentSession.current_duration_seconds)}
                    </Text>
                  </VStack>
                </VStack>
              </Card>

              {/* Configuration */}
              <Card bg="bg.subtle" border="1px solid" borderColor="border.default" borderRadius="8px" p={4}>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Icon as={Volume2} boxSize={4} color="purple.500" />
                    <Text fontSize="sm" fontWeight="600" color="text.default">
                      Configuration
                    </Text>
                  </HStack>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="text.muted">Voix:</Text>
                      <Text fontSize="sm" fontWeight="600">
                        {currentSession.voice_model || 'Default'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="text.muted">Détection:</Text>
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
          bg="bg.surface"
          border="1px solid"
          borderColor="border.default"
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
                  <Heading size="sm" color="text.default">Métriques de Performance</Heading>
                  
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    
                    {/* Connexions */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="text.default">Connexions</Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="text.muted">WebRTC:</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {kioskStats?.webrtc_sessions || 0}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="text.muted">WebSocket:</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {kioskStats?.websocket_sessions || 0}
                        </Text>
                      </HStack>
                    </VStack>

                    {/* Turns & Interruptions */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="text.default">Interaction</Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="text.muted">Tours utilisateur moy.:</Text>
                        <Text fontSize="sm" fontWeight="600">
                          {kioskStats?.avg_user_turns?.toFixed(1) || '--'}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="text.muted">Interruptions moy.:</Text>
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
                  <Heading size="sm" color="text.default">Événements Audio</Heading>
                  
                  {audioEvents.length > 0 ? (
                    <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                      {audioEvents.slice(0, 10).map((event) => (
                        <Box key={event.id} p={3} bg="bg.subtle" borderRadius="8px" border="1px solid" borderColor="border.default">
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs" fontWeight="600" color="text.default">
                                {event.event_type}
                              </Text>
                              {event.user_transcript && (
                                <Text fontSize="xs" color="text.muted" noOfLines={1}>
                                  👤 {event.user_transcript}
                                </Text>
                              )}
                              {event.ai_transcript_final && (
                                <Text fontSize="xs" color="text.muted" noOfLines={1}>
                                  🤖 {event.ai_transcript_final}
                                </Text>
                              )}
                            </VStack>
                            <Text fontSize="xs" color="gray.400">
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
                  <Heading size="sm" color="text.default">Qualité WebRTC</Heading>
                  
                  {webrtcStats.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                      {webrtcStats.slice(0, 1).map((stats) => (
                        <VStack key={stats.id} spacing={3} align="stretch">
                          <Text fontSize="sm" fontWeight="600" color="text.default">Dernière mesure</Text>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="text.muted">Connexion:</Text>
                              <Badge 
                                colorScheme={stats.connection_state === 'connected' ? 'green' : 'red'}
                                size="sm"
                              >
                                {stats.connection_state}
                              </Badge>
                            </HStack>
                            {stats.rtt_ms && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="text.muted">RTT:</Text>
                                <Text fontSize="sm" fontWeight="600">{stats.rtt_ms}ms</Text>
                              </HStack>
                            )}
                            {stats.packet_loss_rate && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="text.muted">Perte paquets:</Text>
                                <Text fontSize="sm" fontWeight="600">
                                  {(stats.packet_loss_rate * 100).toFixed(1)}%
                                </Text>
                              </HStack>
                            )}
                            {stats.audio_level_input && (
                              <HStack justify="space-between">
                                <Text fontSize="xs" color="text.muted">Niveau audio:</Text>
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
                  <Heading size="sm" color="text.default">Détail des Coûts</Heading>
                  
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    
                    {/* Tokens */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="text.default">Tokens</Text>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="text.muted">Input text:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_input_tokens || 0}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="text.muted">Output text:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_output_tokens || 0}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="text.muted">Audio input:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_input_audio_tokens || 0}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="text.muted">Audio output:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            {kioskStats?.total_output_audio_tokens || 0}
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>

                    {/* Moyennes */}
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="600" color="text.default">Moyennes</Text>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="text.muted">Coût/session:</Text>
                          <Text fontSize="sm" fontWeight="600">
                            ${kioskStats?.avg_cost_per_session_usd?.toFixed(4) || '0.0000'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="text.muted">Voix utilisée:</Text>
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