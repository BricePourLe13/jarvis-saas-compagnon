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
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Code
} from '@chakra-ui/react'
import {
  Monitor,
  Activity,
  DollarSign,
  Clock,
  Mic,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  openaiRealtimeMonitoringServiceFixed,
  type SimpleKioskStats,
  type SimpleActiveSession,
  type SimpleAudioEvent
} from '@/lib/openai-realtime-monitoring-fixed'
import { formatDuration } from '@/lib/format-time'

interface OpenAIRealtimeMonitoringFixedProps {
  gymId: string
  gymName: string
  kioskSlug: string | null
}

const MotionCard = motion(Card)

export default function OpenAIRealtimeMonitoringFixed({ 
  gymId, 
  gymName, 
  kioskSlug 
}: OpenAIRealtimeMonitoringFixedProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SimpleKioskStats | null>(null)
  const [activeSessions, setActiveSessions] = useState<SimpleActiveSession[]>([])
  const [audioEvents, setAudioEvents] = useState<SimpleAudioEvent[]>([])
  const [diagnostic, setDiagnostic] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [sessionView, setSessionView] = useState<'recent' | 'all' | 'stale'>('recent')
  const toast = useToast()

  // formatDuration importée depuis utilitaire partagé

  useEffect(() => {
    loadData()
    // Actualisation toutes les 30 secondes
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [gymId])

  const loadData = async () => {
    try {
      setLoading(true)
      // Log supprimé pour production

      // Chargement parallèle des données
      const [
        statsData,
        activeSessionsData,
        audioEventsData,
        diagnosticData
      ] = await Promise.all([
        openaiRealtimeMonitoringServiceFixed.getGymStats(gymId),
        openaiRealtimeMonitoringServiceFixed.getGymActiveSessions(gymId),
        openaiRealtimeMonitoringServiceFixed.getRecentAudioEvents(gymId, 5),
        openaiRealtimeMonitoringServiceFixed.diagnosticData()
      ])

      setStats(statsData)
      setActiveSessions(activeSessionsData)
      setAudioEvents(audioEventsData)
      setDiagnostic(diagnosticData)

      // Log supprimé pour production
        stats: !!statsData,
        activeSessions: activeSessionsData.length,
        audioEvents: audioEventsData.length,
        diagnostic: diagnosticData
      })

    } catch (error) {
      // Log supprimé pour production
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

  const testSQLFunction = async () => {
    // Log supprimé pour production
    const result = await openaiRealtimeMonitoringServiceFixed.testSQLFunction(gymId)
    setTestResult(result)
    // Log supprimé pour production
  }

  if (loading) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Chargement du monitoring OpenAI Realtime (version corrigée)...</Text>
      </VStack>
    )
  }

  const hasActiveSession = activeSessions.length > 0
  const hasData = stats && stats.sessions_24h > 0

  return (
    <VStack spacing={8} align="stretch">
      
      {/* Header avec diagnostic */}
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
        <VStack spacing={4} align="stretch">
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
              <Button
                leftIcon={<Icon as={RefreshCw} />}
                onClick={loadData}
                variant="outline"
                size="sm"
                borderRadius="8px"
              >
                Actualiser
              </Button>
              <Button
                onClick={() => setShowDiagnostic((v) => !v)}
                variant="outline"
                size="sm"
                borderRadius="8px"
              >
                {showDiagnostic ? 'Masquer Diagnostic' : 'Diagnostic'}
              </Button>
            </HStack>
          </HStack>

          {/* Diagnostic repliable (masqué par défaut) */}
          {showDiagnostic && (
            <VStack spacing={3} align="stretch">
              {diagnostic && (
                <Box bg="bg.subtle" p={4} borderRadius="8px" border="1px solid" borderColor="border.default">
                  <Text fontSize="sm" fontWeight="600" mb={2}>Diagnostic Base de Données:</Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <VStack spacing={1}>
                      <Text fontSize="xs" color="gray.600">Sessions</Text>
                      <Text fontSize="lg" fontWeight="600">{diagnostic.sessions_count}</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="xs" color="gray.600">Audio Events</Text>
                      <Text fontSize="lg" fontWeight="600">{diagnostic.audio_events_count}</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="xs" color="gray.600">WebRTC Stats</Text>
                      <Text fontSize="lg" fontWeight="600">{diagnostic.webrtc_stats_count}</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="xs" color="gray.600">Fonctions</Text>
                      <Text fontSize="lg" fontWeight="600">{diagnostic.functions_available.length}</Text>
                    </VStack>
                  </SimpleGrid>
                </Box>
              )}
              <HStack>
                <Button onClick={testSQLFunction} variant="outline" size="sm" borderRadius="8px" colorScheme="blue">
                  Test SQL
                </Button>
              </HStack>
              {testResult && (
                <Box bg={testResult.error ? "red.50" : "green.50"} p={4} borderRadius="8px" border="1px solid" borderColor={testResult.error ? "red.200" : "green.200"}>
                  <Text fontSize="sm" fontWeight="600" mb={2}>Résultat Test SQL:</Text>
                  <Code fontSize="xs" p={2} bg="bg.surface" borderRadius="4px" display="block" border="1px solid" borderColor="border.default">
                    {JSON.stringify(testResult, null, 2)}
                  </Code>
                </Box>
              )}
            </VStack>
          )}
        </VStack>
      </MotionCard>

      {/* Métriques principales */}
      {hasData ? (
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
              
              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Sessions</StatLabel>
                <StatNumber fontSize="2xl" color="text.default">
                  {stats?.sessions_24h || 0}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {stats?.active_sessions || 0} actives
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Durée moyenne</StatLabel>
                <StatNumber fontSize="2xl" color="text.default">
                  {stats?.avg_session_duration ? formatDuration(stats.avg_session_duration) : '--'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  par session
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Coût</StatLabel>
                <StatNumber fontSize="2xl" color="text.default">
                  ${stats?.total_cost_24h_usd?.toFixed(3) || '0.000'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  dernières 24h
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize="sm" color="text.muted">Interactions</StatLabel>
                <StatNumber fontSize="2xl" color="text.default">
                  {(stats?.total_user_turns || 0) + (stats?.total_ai_turns || 0)}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {stats?.total_user_turns || 0} utilisateur, {stats?.total_ai_turns || 0} IA
                </StatHelpText>
              </Stat>

            </SimpleGrid>
          </VStack>
        </MotionCard>
      ) : (
        <Alert status="info" borderRadius="12px">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Aucune données disponibles</AlertTitle>
            <AlertDescription fontSize="xs">
              Ce kiosk n'a pas encore de sessions OpenAI Realtime enregistrées. 
              Les métriques apparaîtront après la première utilisation.
              {diagnostic && diagnostic.sessions_count === 0 && (
                <Text mt={2} fontSize="xs" color="orange.600">
                  💡 Aucune session trouvée dans la base de données. 
                  Vérifiez que l'instrumentation fonctionne.
                </Text>
              )}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Sessions actives */}
      {activeSessions.length > 0 && (
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
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading size="md" color="text.default" fontWeight="600">
                Sessions Actives ({activeSessions.length})
              </Heading>
              <HStack spacing={2}>
                <Button size="xs" variant={sessionView==='recent' ? 'solid' : 'outline'} onClick={() => setSessionView('recent')}>Récentes</Button>
                <Button size="xs" variant={sessionView==='all' ? 'solid' : 'outline'} onClick={() => setSessionView('all')}>Toutes</Button>
                <Button size="xs" variant={sessionView==='stale' ? 'solid' : 'outline'} onClick={() => setSessionView('stale')}>Inactives</Button>
              </HStack>
            </HStack>
            {(() => {
              const isStale = (s: SimpleActiveSession) => (s.duration_seconds >= 600) && ((s.user_turns || 0) + (s.ai_turns || 0) === 0)
              const recent = activeSessions.filter((s) => !isStale(s))
              const stale = activeSessions.filter((s) => isStale(s))
              const base = sessionView === 'all' ? activeSessions : (sessionView === 'stale' ? stale : recent)
              const sorted = [...base].sort((a, b) => {
                const aDate = new Date(a.started_at).getTime()
                const bDate = new Date(b.started_at).getTime()
                return bDate - aDate
              })
              return (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
                  {sorted.map((session) => (
                    <Box
                      key={session.session_id}
                      bg="white"
                      border="1px solid"
                      borderColor="gray.100"
                      borderRadius="10px"
                      p={4}
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                          {session.member_name || 'Visiteur'}
                        </Text>
                        {isStale(session) ? (
                          <Badge variant="subtle" colorScheme="yellow">Inactif</Badge>
                        ) : (
                          <Badge variant="subtle" colorScheme="green">Actif</Badge>
                        )}
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.600">
                          {formatDuration(session.duration_seconds)}
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          ${session.current_cost_usd.toFixed(4)}
                        </Text>
                      </HStack>
                      <Text mt={2} fontSize="xs" color="gray.500">
                        {session.user_turns} tours utilisateur • {session.ai_turns} réponses IA
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              )
            })()}
          </VStack>
        </MotionCard>
      )}

      {/* Événements audio récents */}
      {audioEvents.length > 0 && (
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
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="text.default" fontWeight="600">
              Événements Audio Récents
            </Heading>
            
            <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
              {audioEvents.map((event) => (
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
          </VStack>
        </MotionCard>
      )}

    </VStack>
  )
}