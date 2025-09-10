/**
 * 📊 CARTE SESSION LIVE
 * Composant pour afficher une session en temps réel avec détails
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Collapse,
  Divider,
  Box,
  Icon,
  Progress,
  useDisclosure
} from '@chakra-ui/react'
// Utilisation d'emojis au lieu de react-icons pour éviter les dépendances

interface LiveSessionCardProps {
  session: {
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
  realtimeEvents?: Array<{
    event_type: string
    event_timestamp: string
    user_transcript?: string
    jarvis_transcript?: string
    turn_number: number
  }>
}

export default function LiveSessionCard({ session, realtimeEvents = [] }: LiveSessionCardProps) {
  const { isOpen, onToggle } = useDisclosure()
  const [duration, setDuration] = useState(0)

  // Mettre à jour la durée en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(session.session_started_at)
      const end = session.session_ended_at ? new Date(session.session_ended_at) : new Date()
      setDuration(Math.round((end.getTime() - start.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [session.session_started_at, session.session_ended_at])

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getSessionStatus = () => {
    if (session.session_ended_at) {
      return { color: 'gray', label: 'Terminée', pulse: false }
    }
    
    const lastActivity = new Date(session.last_activity_at)
    const now = new Date()
    const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
    
    if (inactiveMinutes > 5) {
      return { color: 'orange', label: 'Inactive', pulse: false }
    }
    
    return { color: 'green', label: 'Active', pulse: true }
  }

  const getActivityLevel = () => {
    const totalTurns = session.total_user_turns + session.total_ai_turns
    if (totalTurns > 20) return { color: 'green', level: 'Élevée' }
    if (totalTurns > 10) return { color: 'yellow', level: 'Moyenne' }
    return { color: 'red', level: 'Faible' }
  }

  const status = getSessionStatus()
  const activity = getActivityLevel()
  const sessionEvents = realtimeEvents.filter(e => e.event_timestamp >= session.session_started_at)
  const userMessages = sessionEvents.filter(e => e.event_type === 'user_transcript' && e.user_transcript)
  const jarvisMessages = sessionEvents.filter(e => e.event_type === 'jarvis_transcript' && e.jarvis_transcript)

  return (
    <Card 
      borderLeft="4px solid" 
      borderLeftColor={`${status.color}.400`}
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* En-tête */}
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Text fontSize="lg">👤</Text>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg">
                  {session.gym_members?.first_name} {session.gym_members?.last_name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {session.gym_members?.badge_id} • {session.gyms?.name}
                </Text>
              </VStack>
            </HStack>
            
            <VStack align="end" spacing={1}>
              <Badge 
                colorScheme={status.color} 
                variant={status.pulse ? 'solid' : 'outline'}
                animation={status.pulse ? 'pulse 2s infinite' : undefined}
              >
                {status.label}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {formatDuration(duration)}
              </Text>
            </VStack>
          </HStack>

          {/* Métriques rapides */}
          <HStack justify="space-around" py={2}>
            <VStack spacing={1}>
              <Text fontSize="lg" color="blue.500">⏱️</Text>
              <Text fontSize="sm" fontWeight="bold">{formatDuration(duration)}</Text>
              <Text fontSize="xs" color="gray.500">Durée</Text>
            </VStack>
            
            <VStack spacing={1}>
              <Text fontSize="lg" color="green.500">💬</Text>
              <Text fontSize="sm" fontWeight="bold">
                {session.total_user_turns + session.total_ai_turns}
              </Text>
              <Text fontSize="xs" color="gray.500">Tours</Text>
            </VStack>
            
            <VStack spacing={1}>
              <Text fontSize="lg" color="purple.500">🎤</Text>
              <Text fontSize="sm" fontWeight="bold">{userMessages.length}</Text>
              <Text fontSize="xs" color="gray.500">Messages</Text>
            </VStack>
          </HStack>

          {/* Niveau d'activité */}
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">Activité</Text>
              <Badge colorScheme={activity.color} size="sm">{activity.level}</Badge>
            </HStack>
            <Progress 
              value={Math.min((session.total_user_turns + session.total_ai_turns) * 5, 100)} 
              colorScheme={activity.color}
              size="sm"
              borderRadius="md"
            />
          </Box>

          {/* Bouton détails */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            rightIcon={<Text>{isOpen ? '▲' : '▼'}</Text>}
          >
            {isOpen ? 'Masquer' : 'Voir'} les détails
          </Button>

          {/* Détails étendus */}
          <Collapse in={isOpen}>
            <VStack align="stretch" spacing={4} pt={2}>
              <Divider />
              
              {/* Informations techniques */}
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  Configuration
                </Text>
                <HStack justify="space-between" fontSize="sm">
                  <Text color="gray.600">Modèle IA:</Text>
                  <Text fontFamily="mono">{session.ai_model}</Text>
                </HStack>
                <HStack justify="space-between" fontSize="sm">
                  <Text color="gray.600">Voix:</Text>
                  <Text fontFamily="mono">{session.voice_model}</Text>
                </HStack>
                <HStack justify="space-between" fontSize="sm">
                  <Text color="gray.600">Session ID:</Text>
                  <Text fontFamily="mono" fontSize="xs">{session.session_id.slice(-12)}</Text>
                </HStack>
              </VStack>

              {/* Messages récents */}
              {(userMessages.length > 0 || jarvisMessages.length > 0) && (
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">
                    Messages récents
                  </Text>
                  <Box maxH="200px" overflowY="auto">
                    <VStack align="stretch" spacing={2}>
                      {sessionEvents
                        .filter(e => e.user_transcript || e.jarvis_transcript)
                        .slice(-5)
                        .map((event, index) => (
                          <Box
                            key={index}
                            p={2}
                            bg={event.event_type.includes('user') ? 'blue.50' : 'green.50'}
                            borderRadius="md"
                            borderLeft="3px solid"
                            borderLeftColor={event.event_type.includes('user') ? 'blue.400' : 'green.400'}
                          >
                            <HStack justify="space-between" mb={1}>
                              <Badge
                                size="xs"
                                colorScheme={event.event_type.includes('user') ? 'blue' : 'green'}
                              >
                                {event.event_type.includes('user') ? 'Utilisateur' : 'JARVIS'}
                              </Badge>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(event.event_timestamp).toLocaleTimeString()}
                              </Text>
                            </HStack>
                            <Text fontSize="sm">
                              "{event.user_transcript || event.jarvis_transcript}"
                            </Text>
                          </Box>
                        ))}
                    </VStack>
                  </Box>
                </VStack>
              )}

              {/* Timestamps */}
              <VStack align="stretch" spacing={1} fontSize="xs" color="gray.500">
                <HStack justify="space-between">
                  <Text>Début:</Text>
                  <Text>{new Date(session.session_started_at).toLocaleString()}</Text>
                </HStack>
                {session.session_ended_at && (
                  <HStack justify="space-between">
                    <Text>Fin:</Text>
                    <Text>{new Date(session.session_ended_at).toLocaleString()}</Text>
                  </HStack>
                )}
                <HStack justify="space-between">
                  <Text>Dernière activité:</Text>
                  <Text>{new Date(session.last_activity_at).toLocaleString()}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  )
}
