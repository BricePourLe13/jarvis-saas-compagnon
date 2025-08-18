'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Badge, 
  Button, 
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Avatar,
  Icon,
  Spinner,
  Divider,
  Flex,
  Tag,
  TagLabel,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react'
import { 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Heart,
  Target,
  Activity,
  User,
  Calendar,
  BarChart3
} from 'lucide-react'
import ManagerLayout from '@/components/manager/ManagerLayout'

interface ConversationLog {
  id: string
  session_id: string
  timestamp: string
  speaker: 'user' | 'jarvis'
  message_text: string
  detected_intent: string | null
  sentiment_score: number | null
  emotion_detected: string | null
  topic_category: string | null
  mentioned_equipment: string[]
  mentioned_activities: string[]
  contains_complaint: boolean
  contains_feedback: boolean
  user_engagement_level: string | null
  conversation_turn_number: number
}

interface MemberStats {
  total_sessions_30d: number
  total_messages_30d: number
  user_messages_30d: number
  jarvis_messages_30d: number
  avg_sentiment_30d: number | null
  top_intents: Array<{ intent: string; count: number }>
  top_equipment: Array<{ equipment: string; count: number }>
  last_conversation_at: string | null
}

interface MemberDetail {
  id: string
  badge_id: string
  first_name: string
  last_name: string
  email: string
  membership_type: string
  engagement_level: string
  jarvis_personalization_score: number
  total_visits: number
  last_visit: string | null
  created_at: string
  stats: MemberStats
}

export default function MemberDetailPage(props: { params: { memberId: string } }) {
  const { memberId } = props.params
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [conversations, setConversations] = useState<ConversationLog[]>([])
  const [conversationsBySession, setConversationsBySession] = useState<Record<string, ConversationLog[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchMemberDetail()
  }, [memberId])

  const fetchMemberDetail = async () => {
    try {
      const response = await fetch(`/api/manager/members/${memberId}`)
      const data = await response.json()

      if (data.success) {
        setMember(data.member)
        setConversations(data.conversations)
        setConversationsBySession(data.conversationsBySession)
      } else {
        setError(data.error || 'Erreur de chargement')
      }
    } catch (error) {
      console.error('Erreur API membre:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return `${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (maintenant)`
    if (diffHours < 24) return `${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (il y a ${diffHours}h)`
    return date.toLocaleString('fr-FR')
  }

  const getSentimentColor = (sentiment: number | null) => {
    if (sentiment === null) return 'gray'
    if (sentiment > 0.3) return 'green'
    if (sentiment < -0.3) return 'red'
    return 'yellow'
  }

  const getSentimentLabel = (sentiment: number | null) => {
    if (sentiment === null) return 'N/A'
    if (sentiment > 0.3) return 'Positif'
    if (sentiment < -0.3) return 'Négatif'
    return 'Neutre'
  }

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'enthusiast': return 'purple'
      case 'regular': return 'blue'
      case 'casual': return 'green'
      case 'new': return 'gray'
      default: return 'gray'
    }
  }

  if (loading) {
    return (
      <ManagerLayout currentPage="Fiches Membres" gymName="AREA" onlineStatus={true}>
        <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text color="gray.500">Chargement du profil membre...</Text>
          </VStack>
        </Box>
      </ManagerLayout>
    )
  }

  if (error || !member) {
    return (
      <ManagerLayout currentPage="Fiches Membres" gymName="AREA" onlineStatus={true}>
        <Box p={6}>
          <Card>
            <CardBody textAlign="center" py={12}>
              <Text color="red.500" fontSize="lg" mb={4}>
                {error || 'Membre introuvable'}
              </Text>
              <Button
                leftIcon={<Icon as={ArrowLeft} />}
                onClick={() => router.push('/dashboard/members')}
                colorScheme="blue"
              >
                Retour à la liste
              </Button>
            </CardBody>
          </Card>
        </Box>
      </ManagerLayout>
    )
  }

  const sessions = Object.entries(conversationsBySession).map(([sessionId, sessionConversations]) => {
    const firstMessage = sessionConversations[sessionConversations.length - 1] // Le plus ancien
    const lastMessage = sessionConversations[0] // Le plus récent
    const duration = new Date(lastMessage.timestamp).getTime() - new Date(firstMessage.timestamp).getTime()
    const userMessages = sessionConversations.filter(c => c.speaker === 'user')
    const jarvisMessages = sessionConversations.filter(c => c.speaker === 'jarvis')
    
    return {
      sessionId,
      conversations: sessionConversations.sort((a, b) => a.conversation_turn_number - b.conversation_turn_number),
      startTime: firstMessage.timestamp,
      endTime: lastMessage.timestamp,
      duration: Math.floor(duration / 1000 / 60), // minutes
      userMessageCount: userMessages.length,
      jarvisMessageCount: jarvisMessages.length,
      avgSentiment: sessionConversations
        .filter(c => c.sentiment_score !== null)
        .reduce((acc, c) => acc + (c.sentiment_score || 0), 0) / 
        sessionConversations.filter(c => c.sentiment_score !== null).length || null
    }
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  return (
    <ManagerLayout currentPage="Fiches Membres" gymName="AREA" onlineStatus={true}>
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          {/* En-tête avec bouton retour */}
          <HStack spacing={4}>
            <Button
              leftIcon={<Icon as={ArrowLeft} />}
              onClick={() => router.push('/dashboard/members')}
              variant="outline"
              size="sm"
            >
              Retour
            </Button>
            <Divider orientation="vertical" h="20px" />
            <VStack align="start" spacing={0}>
              <Heading size="lg" color="black">
                {member.first_name} {member.last_name}
              </Heading>
              <Text color="gray.600">
                Badge {member.badge_id} • {member.membership_type}
              </Text>
            </VStack>
          </HStack>

          {/* Informations générales */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Profil membre */}
            <Card>
              <CardHeader>
                <HStack spacing={3}>
                  <Icon as={User} w={5} h={5} color="blue.500" />
                  <Heading size="md">Profil Membre</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Avatar 
                      size="lg" 
                      name={`${member.first_name} ${member.last_name}`}
                      bg="blue.500"
                    />
                    <VStack align="end" spacing={1}>
                      <Badge 
                        colorScheme={getEngagementColor(member.engagement_level)}
                        size="lg"
                        px={3}
                        py={1}
                      >
                        {member.engagement_level}
                      </Badge>
                      <Text fontSize="sm" color="gray.500">
                        Membre depuis {new Date(member.created_at).toLocaleDateString('fr-FR')}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text color="gray.600">Visites totales</Text>
                      <Text fontWeight="bold">{member.total_visits}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Dernière visite</Text>
                      <Text fontWeight="bold">
                        {member.last_visit ? new Date(member.last_visit).toLocaleDateString('fr-FR') : 'N/A'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Score personnalisation</Text>
                      <HStack spacing={2}>
                        <Progress 
                          value={member.jarvis_personalization_score * 100} 
                          w="100px" 
                          colorScheme="blue"
                          size="sm"
                        />
                        <Text fontWeight="bold" fontSize="sm">
                          {(member.jarvis_personalization_score * 100).toFixed(0)}%
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Statistiques JARVIS (30j) */}
            <Card>
              <CardHeader>
                <HStack spacing={3}>
                  <Icon as={BarChart3} w={5} h={5} color="purple.500" />
                  <Heading size="md">Interactions JARVIS (30j)</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={2} spacing={4}>
                  <VStack spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                      {member.stats.total_sessions_30d}
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Sessions totales
                    </Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {member.stats.total_messages_30d}
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Messages échangés
                    </Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Badge 
                      colorScheme={getSentimentColor(member.stats.avg_sentiment_30d)}
                      fontSize="lg"
                      px={3}
                      py={1}
                    >
                      {getSentimentLabel(member.stats.avg_sentiment_30d)}
                    </Badge>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Sentiment moyen
                    </Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color="green.500">
                      {member.stats.last_conversation_at ? (
                        <Text fontSize="sm">
                          {formatDate(member.stats.last_conversation_at).split(' ')[0]}
                        </Text>
                      ) : 'N/A'}
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Dernière conversation
                    </Text>
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Insights */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Top Intents */}
            <Card>
              <CardHeader>
                <HStack spacing={3}>
                  <Icon as={Target} w={5} h={5} color="orange.500" />
                  <Heading size="md">Intérêts principaux</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                {member.stats.top_intents.length > 0 ? (
                  <VStack align="stretch" spacing={2}>
                    {member.stats.top_intents.map((item, index) => (
                      <HStack key={index} justify="space-between">
                        <Tag size="sm" colorScheme="orange" variant="subtle">
                          <TagLabel>{item.intent}</TagLabel>
                        </Tag>
                        <Badge variant="outline">{item.count}</Badge>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500" textAlign="center">Aucune donnée disponible</Text>
                )}
              </CardBody>
            </Card>

            {/* Top Equipment */}
            <Card>
              <CardHeader>
                <HStack spacing={3}>
                  <Icon as={Activity} w={5} h={5} color="green.500" />
                  <Heading size="md">Équipements mentionnés</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                {member.stats.top_equipment.length > 0 ? (
                  <VStack align="stretch" spacing={2}>
                    {member.stats.top_equipment.map((item, index) => (
                      <HStack key={index} justify="space-between">
                        <Tag size="sm" colorScheme="green" variant="subtle">
                          <TagLabel>{item.equipment}</TagLabel>
                        </Tag>
                        <Badge variant="outline">{item.count}</Badge>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500" textAlign="center">Aucune donnée disponible</Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Historique des conversations */}
          <Card>
            <CardHeader>
              <HStack spacing={3}>
                <Icon as={MessageSquare} w={5} h={5} color="blue.500" />
                <Heading size="md">Historique des Conversations (30 derniers jours)</Heading>
                <Badge colorScheme="blue" variant="outline">
                  {sessions.length} sessions
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              {sessions.length > 0 ? (
                <Accordion allowMultiple>
                  {sessions.map((session, index) => (
                    <AccordionItem key={session.sessionId}>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <HStack justify="space-between" w="100%">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">
                                Session {index + 1} • {formatDate(session.startTime)}
                              </Text>
                              <HStack spacing={4}>
                                <Text fontSize="sm" color="gray.500">
                                  {session.userMessageCount + session.jarvisMessageCount} messages
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {session.duration} min
                                </Text>
                                {session.avgSentiment !== null && (
                                  <Badge 
                                    size="sm" 
                                    colorScheme={getSentimentColor(session.avgSentiment)}
                                    variant="subtle"
                                  >
                                    {getSentimentLabel(session.avgSentiment)}
                                  </Badge>
                                )}
                              </HStack>
                            </VStack>
                          </HStack>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack align="stretch" spacing={3}>
                          {session.conversations.map((conv) => (
                            <HStack 
                              key={conv.id} 
                              align="start" 
                              spacing={3}
                              p={3}
                              bg={conv.speaker === 'user' ? 'blue.50' : 'green.50'}
                              borderRadius="md"
                              borderLeft="4px solid"
                              borderLeftColor={conv.speaker === 'user' ? 'blue.400' : 'green.400'}
                            >
                              <Avatar 
                                size="xs" 
                                name={conv.speaker === 'user' ? member.first_name : 'JARVIS'}
                                bg={conv.speaker === 'user' ? 'blue.500' : 'green.500'}
                              />
                              <VStack align="start" spacing={1} flex={1}>
                                <HStack spacing={2}>
                                  <Text fontSize="sm" fontWeight="bold">
                                    {conv.speaker === 'user' ? member.first_name : 'JARVIS'}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {new Date(conv.timestamp).toLocaleTimeString('fr-FR')}
                                  </Text>
                                  {conv.detected_intent && (
                                    <Badge size="xs" colorScheme="purple" variant="outline">
                                      {conv.detected_intent}
                                    </Badge>
                                  )}
                                  {conv.sentiment_score !== null && (
                                    <Badge 
                                      size="xs" 
                                      colorScheme={getSentimentColor(conv.sentiment_score)}
                                      variant="subtle"
                                    >
                                      {getSentimentLabel(conv.sentiment_score)}
                                    </Badge>
                                  )}
                                </HStack>
                                <Text fontSize="sm">
                                  {conv.message_text}
                                </Text>
                                {(conv.mentioned_equipment.length > 0 || conv.mentioned_activities.length > 0) && (
                                  <HStack spacing={1} wrap="wrap">
                                    {conv.mentioned_equipment.map((eq, i) => (
                                      <Tag key={i} size="xs" colorScheme="orange" variant="subtle">
                                        {eq}
                                      </Tag>
                                    ))}
                                    {conv.mentioned_activities.map((act, i) => (
                                      <Tag key={i} size="xs" colorScheme="green" variant="subtle">
                                        {act}
                                      </Tag>
                                    ))}
                                  </HStack>
                                )}
                                {(conv.contains_complaint || conv.contains_feedback) && (
                                  <HStack spacing={1}>
                                    {conv.contains_complaint && (
                                      <Badge size="xs" colorScheme="red" variant="solid">
                                        Plainte
                                      </Badge>
                                    )}
                                    {conv.contains_feedback && (
                                      <Badge size="xs" colorScheme="blue" variant="solid">
                                        Feedback
                                      </Badge>
                                    )}
                                  </HStack>
                                )}
                              </VStack>
                            </HStack>
                          ))}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    Aucune conversation JARVIS enregistrée pour ce membre dans les 30 derniers jours.
                  </Text>
                  <Text color="gray.400" fontSize="sm" mt={2}>
                    Les conversations apparaîtront ici dès que le membre utilisera JARVIS.
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </ManagerLayout>
  )
}
