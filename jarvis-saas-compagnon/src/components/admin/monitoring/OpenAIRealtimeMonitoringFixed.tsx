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
  const toast = useToast()

  useEffect(() => {
    loadData()
    // Actualisation toutes les 30 secondes
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [gymId])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 [MONITORING FIXED] Chargement données pour gym:', gymId)

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

      console.log('✅ [MONITORING FIXED] Données chargées:', {
        stats: !!statsData,
        activeSessions: activeSessionsData.length,
        audioEvents: audioEventsData.length,
        diagnostic: diagnosticData
      })

    } catch (error) {
      console.error('❌ [MONITORING FIXED] Erreur chargement:', error)
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
    console.log('🧪 [MONITORING FIXED] Test fonction SQL...')
    const result = await openaiRealtimeMonitoringServiceFixed.testSQLFunction(gymId)
    setTestResult(result)
    console.log('🧪 [MONITORING FIXED] Résultat test:', result)
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
        bg={hasActiveSession ? "#f0fdf4" : "#fafafa"}
        border="1px solid"
        borderColor={hasActiveSession ? "#bbf7d0" : "#e5e7eb"}
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
                onClick={testSQLFunction}
                variant="outline"
                size="sm"
                borderRadius="8px"
                colorScheme="blue"
              >
                Test SQL
              </Button>
            </HStack>
          </HStack>

          {/* Diagnostic */}
          {diagnostic && (
            <Box bg="gray.50" p={4} borderRadius="8px">
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

          {/* Résultat test SQL */}
          {testResult && (
            <Box bg={testResult.error ? "red.50" : "green.50"} p={4} borderRadius="8px">
              <Text fontSize="sm" fontWeight="600" mb={2}>Résultat Test SQL:</Text>
              <Code fontSize="xs" p={2} bg="white" borderRadius="4px" display="block">
                {JSON.stringify(testResult, null, 2)}
              </Code>
            </Box>
          )}
        </VStack>
      </MotionCard>

      {/* Métriques principales */}
      {hasData ? (
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
              
              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Sessions</StatLabel>
                <StatNumber fontSize="2xl" color="#111827">
                  {stats?.sessions_24h || 0}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {stats?.active_sessions || 0} actives
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Durée moyenne</StatLabel>
                <StatNumber fontSize="2xl" color="#111827">
                  {stats?.avg_session_duration ? 
                    `${Math.floor(stats.avg_session_duration / 60)}m` : '--'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  par session
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Coût</StatLabel>
                <StatNumber fontSize="2xl" color="#111827">
                  ${stats?.total_cost_24h_usd?.toFixed(3) || '0.000'}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  dernières 24h
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize="sm" color="#6b7280">Interactions</StatLabel>
                <StatNumber fontSize="2xl" color="#111827">
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
          bg="#ffffff"
          border="1px solid #e5e7eb"
          borderRadius="12px"
          p={6}
        >
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="#111827" fontWeight="600">
              Sessions Actives ({activeSessions.length})
            </Heading>
            
            {activeSessions.map((session) => (
              <Box key={session.session_id} p={4} bg="green.50" borderRadius="8px">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="600">
                      {session.member_name || 'Utilisateur anonyme'}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {Math.floor(session.duration_seconds / 60)}min {session.duration_seconds % 60}s
                    </Text>
                  </VStack>
                  <VStack align="end" spacing={1}>
                    <Text fontSize="sm" fontWeight="600">
                      ${session.current_cost_usd.toFixed(4)}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {session.user_turns} tours utilisateur
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </MotionCard>
      )}

      {/* Événements audio récents */}
      {audioEvents.length > 0 && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          bg="#ffffff"
          border="1px solid #e5e7eb"
          borderRadius="12px"
          p={6}
        >
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="#111827" fontWeight="600">
              Événements Audio Récents
            </Heading>
            
            <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
              {audioEvents.map((event) => (
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
          </VStack>
        </MotionCard>
      )}

    </VStack>
  )
}