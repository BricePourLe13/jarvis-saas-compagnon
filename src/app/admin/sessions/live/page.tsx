/**
 * 📊 DASHBOARD SESSIONS TEMPS RÉEL
 * Interface admin pour voir toutes les sessions actives et l'historique en direct
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Grid,
  Card,
  CardBody,
  Text,
  Badge,
  VStack,
  HStack,
  Spinner,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Flex,
  Divider
} from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import LiveSessionCard from '@/components/admin/LiveSessionCard'

interface LiveSession {
  session_id: string
  member_id: string
  gym_id: string
  session_started_at: string
  session_ended_at?: string
  ai_model: string
  voice_model: string
  total_user_turns: number
  total_ai_turns: number
  end_reason?: string
  session_state: string
  last_activity_at: string
  gym_members: {
    first_name: string
    last_name: string
    badge_id: string
  }
  gyms: {
    name: string
  }
}

interface RealtimeEvent {
  id: string
  session_id: string
  event_type: string
  event_timestamp: string
  user_transcript?: string
  jarvis_transcript?: string
  turn_number: number
}

export default function LiveSessionsPage() {
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([])
  const [recentSessions, setRecentSessions] = useState<LiveSession[]>([])
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const toast = useToast()

  // Initialiser Supabase client
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey)
      setSupabase(client)
    } else {
      toast({
        title: 'Erreur configuration',
        description: 'Variables Supabase manquantes',
        status: 'error',
        duration: 5000,
      })
    }
  }, [toast])

  // Charger les données initiales
  const loadSessions = async () => {
    if (!supabase) return

    try {
      // Sessions actives (non terminées)
      const { data: active, error: activeError } = await supabase
        .from('openai_realtime_sessions')
        .select(`
          *,
          gym_members(first_name, last_name, badge_id),
          gyms(name)
        `)
        .is('session_ended_at', null)
        .order('session_started_at', { ascending: false })

      if (activeError) throw activeError

      // Sessions récentes (dernières 24h)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data: recent, error: recentError } = await supabase
        .from('openai_realtime_sessions')
        .select(`
          *,
          gym_members(first_name, last_name, badge_id),
          gyms(name)
        `)
        .gte('session_started_at', yesterday.toISOString())
        .order('session_started_at', { ascending: false })
        .limit(20)

      if (recentError) throw recentError

      // Événements récents
      const { data: events, error: eventsError } = await supabase
        .from('openai_realtime_audio_events')
        .select('*')
        .gte('event_timestamp', yesterday.toISOString())
        .order('event_timestamp', { ascending: false })
        .limit(50)

      if (eventsError) throw eventsError

      setActiveSessions(active || [])
      setRecentSessions(recent || [])
      setRealtimeEvents(events || [])
      setIsLoading(false)

    } catch (error: any) {
      console.error('Erreur chargement sessions:', error)
      toast({
        title: 'Erreur chargement',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
      setIsLoading(false)
    }
  }

  // Configurer les subscriptions Realtime
  useEffect(() => {
    if (!supabase) return

    loadSessions()

    // Subscription pour les sessions
    const sessionsChannel = supabase
      .channel('admin_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'openai_realtime_sessions'
        },
        (payload: any) => {
          console.log('🔄 [ADMIN] Session update:', payload)
          loadSessions() // Recharger les données
        }
      )
      .subscribe()

    // Subscription pour les événements audio
    const eventsChannel = supabase
      .channel('admin_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'openai_realtime_audio_events'
        },
        (payload: any) => {
          console.log('🎙️ [ADMIN] Nouvel événement:', payload.new)
          setRealtimeEvents(prev => [payload.new, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      sessionsChannel.unsubscribe()
      eventsChannel.unsubscribe()
    }
  }, [supabase])

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
  }

  const getSessionStatus = (session: LiveSession) => {
    if (session.session_ended_at) {
      return { color: 'gray', label: 'Terminée' }
    }
    
    const lastActivity = new Date(session.last_activity_at)
    const now = new Date()
    const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
    
    if (inactiveMinutes > 5) {
      return { color: 'orange', label: 'Inactive' }
    }
    
    return { color: 'green', label: 'Active' }
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Chargement des sessions...</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="gray.800">
          📊 Sessions JARVIS - Temps Réel
        </Heading>

        {/* Statistiques rapides */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Card>
            <CardBody>
              <HStack>
                <Box w={6} h={6} bg="green.500" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                  <Text color="white" fontSize="xs" fontWeight="bold">●</Text>
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {activeSessions.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Sessions actives</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack>
                <Box w={6} h={6} bg="blue.500" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                  <Text color="white" fontSize="xs" fontWeight="bold">👥</Text>
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {recentSessions.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Sessions 24h</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack>
                <Box w={6} h={6} bg="purple.500" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                  <Text color="white" fontSize="xs" fontWeight="bold">💬</Text>
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {realtimeEvents.filter(e => e.event_type === 'user_transcript').length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Messages récents</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </Grid>

        <Tabs>
          <TabList>
            <Tab>🟢 Sessions Actives ({activeSessions.length})</Tab>
            <Tab>📈 Historique Récent ({recentSessions.length})</Tab>
            <Tab>🎙️ Événements Live ({realtimeEvents.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Sessions Actives */}
            <TabPanel>
              <Grid templateColumns="repeat(auto-fill, minmax(450px, 1fr))" gap={4}>
                {activeSessions.map((session) => (
                  <LiveSessionCard 
                    key={session.session_id} 
                    session={session}
                    realtimeEvents={realtimeEvents.filter(e => e.session_id === session.session_id)}
                  />
                ))}
              </Grid>

              {activeSessions.length === 0 && (
                <Card>
                  <CardBody textAlign="center" py={8}>
                    <Text color="gray.500">Aucune session active pour le moment</Text>
                  </CardBody>
                </Card>
              )}
            </TabPanel>

            {/* Historique Récent */}
            <TabPanel>
              <VStack spacing={3} align="stretch">
                {recentSessions.map((session) => (
                  <Card key={session.session_id}>
                    <CardBody>
                      <HStack justify="space-between">
                        <HStack spacing={4}>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">
                              {session.gym_members?.first_name} {session.gym_members?.last_name}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {session.gyms?.name}
                            </Text>
                          </VStack>
                          
                          <Badge colorScheme={session.session_ended_at ? 'gray' : 'green'}>
                            {session.session_ended_at ? 'Terminée' : 'Active'}
                          </Badge>
                        </HStack>

                        <HStack spacing={6} fontSize="sm">
                          <VStack align="center" spacing={0}>
                            <Text fontSize="lg">⏱️</Text>
                            <Text>{formatDuration(session.session_started_at, session.session_ended_at)}</Text>
                          </VStack>
                          <VStack align="center" spacing={0}>
                            <Text fontSize="lg">💬</Text>
                            <Text>{session.total_user_turns + session.total_ai_turns}</Text>
                          </VStack>
                          <Text color="gray.500">
                            {new Date(session.session_started_at).toLocaleTimeString()}
                          </Text>
                        </HStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>

            {/* Événements Live */}
            <TabPanel>
              <VStack spacing={2} align="stretch" maxH="600px" overflowY="auto">
                {realtimeEvents.map((event) => (
                  <Card key={event.id} size="sm">
                    <CardBody py={3}>
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Badge 
                            colorScheme={
                              event.event_type.includes('user') ? 'blue' : 
                              event.event_type.includes('jarvis') ? 'green' : 'gray'
                            }
                            fontSize="xs"
                          >
                            {event.event_type}
                          </Badge>
                          
                          {(event.user_transcript || event.jarvis_transcript) && (
                            <Text fontSize="sm" noOfLines={1}>
                              "{event.user_transcript || event.jarvis_transcript}"
                            </Text>
                          )}
                        </HStack>
                        
                        <VStack align="end" spacing={0}>
                          <Text fontSize="xs" color="gray.500">
                            {event.session_id.slice(-8)}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {new Date(event.event_timestamp).toLocaleTimeString()}
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Flex justify="center">
          <Button onClick={loadSessions} colorScheme="blue" size="sm">
            🔄 Actualiser
          </Button>
        </Flex>
      </VStack>
    </Container>
  )
}
