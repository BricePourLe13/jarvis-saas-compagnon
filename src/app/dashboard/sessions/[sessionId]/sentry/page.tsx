/**
 * 💬 VIEWER CONVERSATION STYLE SENTRY
 * Vue détaillée d'une session avec conversation complète user ↔ JARVIS
 */

'use client'

import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Button,
  Progress,
  Avatar,
  Icon,
  Flex,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tag,
  TagLabel,
  TagLeftIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  CircularProgress,
  CircularProgressLabel,
  Textarea,
  Switch,
  Select,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  Dumbbell,
  Wifi,
  WifiOff,
  Eye,
  ArrowRight,
  Zap,
  Shield,
  Settings,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Monitor,
  Mic,
  Volume2,
  Cpu,
  HardDrive,
  MessageSquare,
  Star,
  Play,
  Pause,
  RotateCcw,
  User,
  Heart,
  Target,
  Award,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Download,
  Search,
  Filter,
  Copy,
  Share,
  Flag,
  Bot,
  Send,
  Headphones,
  FileText,
  PieChart,
  TrendingDown as TrendDown
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'
import SafeLink from '@/components/common/SafeLink'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface SessionDetail {
  id: string
  session_id: string
  member_id: string
  member_name: string
  member_badge_id: string
  gym_name: string
  franchise_name: string
  started_at: Date
  ended_at: Date | null
  duration_minutes: number
  ai_model: string
  voice_model: string
  total_cost: number
  status: 'active' | 'completed' | 'interrupted' | 'error'
}

interface ConversationMessage {
  id: string
  timestamp: Date
  speaker: 'user' | 'jarvis'
  message_text: string
  audio_duration?: number
  sentiment_score?: number
  detected_intent?: string
  topic_category?: string
  mentioned_equipment?: string[]
  mentioned_activities?: string[]
  contains_complaint: boolean
  contains_feedback: boolean
  user_engagement_level?: string
  conversation_turn_number: number
}

interface SessionAnalytics {
  total_messages: number
  user_messages: number
  jarvis_messages: number
  avg_sentiment: number
  dominant_topics: string[]
  equipment_mentioned: string[]
  activities_discussed: string[]
  complaints_count: number
  feedback_count: number
  engagement_score: number
  satisfaction_rating?: number
  cost_breakdown: {
    input_tokens: number
    output_tokens: number
    audio_minutes: number
    total_cost: number
  }
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function SessionHeader({ session }: { session: SessionDetail }) {
  const getStatusColor = (status: SessionDetail['status']) => {
    switch (status) {
      case 'active': return 'green'
      case 'completed': return 'blue'
      case 'interrupted': return 'orange'
      case 'error': return 'red'
    }
  }

  const getStatusLabel = (status: SessionDetail['status']) => {
    switch (status) {
      case 'active': return 'En Cours'
      case 'completed': return 'Terminée'
      case 'interrupted': return 'Interrompue'
      case 'error': return 'Erreur'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? mins + 'm' : ''}`
  }

  return (
    <Card>
      <CardBody>
        <Flex justify="space-between" align="start">
          <HStack spacing={4}>
            <Avatar
              size="lg"
              name={session.member_name}
              bg="blue.500"
              color="white"
            />
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Text fontSize="2xl" fontWeight="bold">
                  Session #{session.session_id.slice(-8)}
                </Text>
                <Badge 
                  colorScheme={getStatusColor(session.status)} 
                  size="lg" 
                  px={3} 
                  py={1}
                >
                  {getStatusLabel(session.status)}
                </Badge>
              </HStack>
              
              <VStack align="start" spacing={1}>
                <HStack color="gray.600" fontSize="sm">
                  <User size={14} />
                  <Text>{session.member_name} ({session.member_badge_id})</Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Dumbbell size={14} />
                  <Text>{session.gym_name} • {session.franchise_name}</Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Clock size={14} />
                  <Text>
                    {session.started_at.toLocaleString()} • {formatDuration(session.duration_minutes)}
                  </Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Bot size={14} />
                  <Text>{session.ai_model} • {session.voice_model}</Text>
                </HStack>
              </VStack>
            </VStack>
          </HStack>

          <VStack align="end" spacing={2}>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download size={16} />}
              >
                Exporter
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Share size={16} />}
              >
                Partager
              </Button>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical size={16} />}
                  variant="outline"
                  size="sm"
                />
                <MenuList>
                  <MenuItem icon={<BarChart3 size={16} />}>
                    Analytics Détaillées
                  </MenuItem>
                  <MenuItem icon={<Flag size={16} />}>
                    Signaler un Problème
                  </MenuItem>
                  <MenuItem icon={<Copy size={16} />}>
                    Copier Transcript
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            
            <VStack align="end" spacing={0} fontSize="sm" color="gray.500">
              <Text fontWeight="medium" color="green.600">€{session.total_cost.toFixed(2)}</Text>
              <Text>Coût total</Text>
            </VStack>
          </VStack>
        </Flex>
      </CardBody>
    </Card>
  )
}

function SessionAnalyticsGrid({ analytics }: { analytics: SessionAnalytics }) {
  const getSentimentIcon = (score: number) => {
    if (score > 0.6) return Smile
    if (score > 0.3) return Meh
    return Frown
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.6) return 'green'
    if (score > 0.3) return 'orange'
    return 'red'
  }

  const SentimentIcon = getSentimentIcon(analytics.avg_sentiment)

  return (
    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
      
      {/* Messages Total */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Messages</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              {analytics.total_messages}
            </StatNumber>
            <StatHelpText>
              {analytics.user_messages}👤 {analytics.jarvis_messages}🤖
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Sentiment Moyen */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Sentiment</StatLabel>
            <HStack spacing={2}>
              <Icon 
                as={SentimentIcon} 
                color={`${getSentimentColor(analytics.avg_sentiment)}.500`}
                size={24}
              />
              <StatNumber 
                color={`${getSentimentColor(analytics.avg_sentiment)}.600`} 
                fontSize="2xl"
              >
                {(analytics.avg_sentiment * 100).toFixed(0)}%
              </StatNumber>
            </HStack>
            <StatHelpText>
              Positif
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Engagement */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Engagement</StatLabel>
            <StatNumber color="purple.600" fontSize="2xl">
              {analytics.engagement_score}%
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Élevé
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Coût */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Coût Total</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              €{analytics.cost_breakdown.total_cost.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              Optimisé
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Feedback */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Feedback</StatLabel>
            <StatNumber color="orange.600" fontSize="2xl">
              {analytics.feedback_count}
            </StatNumber>
            <StatHelpText>
              Commentaires
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Satisfaction */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Satisfaction</StatLabel>
            {analytics.satisfaction_rating ? (
              <HStack spacing={2}>
                <Star size={20} color="orange" />
                <StatNumber color="orange.600" fontSize="2xl">
                  {analytics.satisfaction_rating.toFixed(1)}
                </StatNumber>
              </HStack>
            ) : (
              <StatNumber color="gray.400" fontSize="2xl">
                N/A
              </StatNumber>
            )}
            <StatHelpText>
              Auto-détectée
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function ConversationViewer({ messages }: { messages: ConversationMessage[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpeaker, setFilterSpeaker] = useState<'all' | 'user' | 'jarvis'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.message_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpeaker = filterSpeaker === 'all' || msg.speaker === filterSpeaker
    return matchesSearch && matchesSpeaker
  })

  const getSentimentColor = (score?: number) => {
    if (!score) return 'gray'
    if (score > 0.6) return 'green'
    if (score > 0.3) return 'orange'
    return 'red'
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card>
      <CardHeader>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              Conversation ({messages.length} messages)
            </Text>
            <HStack spacing={2}>
              <Button size="sm" variant="outline" leftIcon={<Copy size={16} />}>
                Copier Tout
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Download size={16} />}>
                Exporter
              </Button>
            </HStack>
          </HStack>
          
          {/* Filtres */}
          <HStack spacing={4}>
            <InputGroup size="sm" maxW="300px">
              <InputLeftElement>
                <Search size={16} color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher dans la conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select 
              size="sm" 
              maxW="150px"
              value={filterSpeaker}
              onChange={(e) => setFilterSpeaker(e.target.value as any)}
            >
              <option value="all">Tous</option>
              <option value="user">Utilisateur</option>
              <option value="jarvis">JARVIS</option>
            </Select>
          </HStack>
        </VStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <Box
          maxH="600px"
          overflowY="auto"
          border="1px"
          borderColor="gray.200"
          borderRadius="md"
          p={4}
        >
          <VStack spacing={4} align="stretch">
            {filteredMessages.map((message, index) => (
              <Box key={message.id}>
                <HStack
                  align="start"
                  spacing={3}
                  justify={message.speaker === 'user' ? 'flex-end' : 'flex-start'}
                >
                  {message.speaker === 'jarvis' && (
                    <Avatar
                      size="sm"
                      name="JARVIS"
                      bg="blue.500"
                      color="white"
                      icon={<Bot size={16} />}
                    />
                  )}
                  
                  <VStack
                    align={message.speaker === 'user' ? 'end' : 'start'}
                    spacing={1}
                    maxW="70%"
                  >
                    <HStack spacing={2} fontSize="xs" color="gray.500">
                      <Text fontWeight="medium">
                        {message.speaker === 'user' ? 'Utilisateur' : 'JARVIS'}
                      </Text>
                      <Text>{formatTime(message.timestamp)}</Text>
                      {message.sentiment_score && (
                        <Badge 
                          colorScheme={getSentimentColor(message.sentiment_score)}
                          size="sm"
                        >
                          {(message.sentiment_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </HStack>
                    
                    <Box
                      bg={message.speaker === 'user' ? 'blue.500' : 'gray.100'}
                      color={message.speaker === 'user' ? 'white' : 'gray.800'}
                      p={3}
                      borderRadius="lg"
                      borderTopRightRadius={message.speaker === 'user' ? 'sm' : 'lg'}
                      borderTopLeftRadius={message.speaker === 'jarvis' ? 'sm' : 'lg'}
                      maxW="100%"
                    >
                      <Text fontSize="sm" whiteSpace="pre-wrap">
                        {message.message_text}
                      </Text>
                    </Box>
                    
                    {/* Métadonnées */}
                    {(message.detected_intent || message.topic_category || message.mentioned_equipment?.length) && (
                      <HStack spacing={1} flexWrap="wrap">
                        {message.detected_intent && (
                          <Tag size="xs" colorScheme="purple">
                            <TagLabel>{message.detected_intent}</TagLabel>
                          </Tag>
                        )}
                        {message.topic_category && (
                          <Tag size="xs" colorScheme="blue">
                            <TagLabel>{message.topic_category}</TagLabel>
                          </Tag>
                        )}
                        {message.mentioned_equipment?.map(equipment => (
                          <Tag key={equipment} size="xs" colorScheme="green">
                            <TagLeftIcon as={Dumbbell} />
                            <TagLabel>{equipment}</TagLabel>
                          </Tag>
                        ))}
                        {message.contains_complaint && (
                          <Tag size="xs" colorScheme="red">
                            <TagLeftIcon as={AlertTriangle} />
                            <TagLabel>Plainte</TagLabel>
                          </Tag>
                        )}
                        {message.contains_feedback && (
                          <Tag size="xs" colorScheme="orange">
                            <TagLeftIcon as={MessageSquare} />
                            <TagLabel>Feedback</TagLabel>
                          </Tag>
                        )}
                      </HStack>
                    )}
                  </VStack>
                  
                  {message.speaker === 'user' && (
                    <Avatar
                      size="sm"
                      name="User"
                      bg="blue.500"
                      color="white"
                    />
                  )}
                </HStack>
                
                {index < filteredMessages.length - 1 && <Divider />}
              </Box>
            ))}
          </VStack>
          <div ref={messagesEndRef} />
        </Box>
        
        {searchTerm && (
          <Box mt={2}>
            <Text fontSize="sm" color="gray.600">
              {filteredMessages.length} résultat(s) trouvé(s) pour "{searchTerm}"
            </Text>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}

function SessionInsights({ analytics }: { analytics: SessionAnalytics }) {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
      
      {/* Sujets Abordés */}
      <Card>
        <CardHeader>
          <HStack spacing={2}>
            <MessageSquare size={20} />
            <Text fontSize="lg" fontWeight="bold">Sujets Abordés</Text>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Topics Principaux</Text>
              <HStack spacing={1} flexWrap="wrap">
                {analytics.dominant_topics.map(topic => (
                  <Tag key={topic} size="sm" colorScheme="blue">
                    <TagLeftIcon as={MessageSquare} />
                    <TagLabel>{topic}</TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Équipements Mentionnés</Text>
              <HStack spacing={1} flexWrap="wrap">
                {analytics.equipment_mentioned.map(equipment => (
                  <Tag key={equipment} size="sm" colorScheme="green">
                    <TagLeftIcon as={Dumbbell} />
                    <TagLabel>{equipment}</TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Activités Discutées</Text>
              <HStack spacing={1} flexWrap="wrap">
                {analytics.activities_discussed.map(activity => (
                  <Tag key={activity} size="sm" colorScheme="purple">
                    <TagLeftIcon as={Activity} />
                    <TagLabel>{activity}</TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Analyse des Coûts */}
      <Card>
        <CardHeader>
          <HStack spacing={2}>
            <DollarSign size={20} />
            <Text fontSize="lg" fontWeight="bold">Analyse des Coûts</Text>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Répartition</Text>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm">Tokens Input:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {analytics.cost_breakdown.input_tokens.toLocaleString()}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Tokens Output:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {analytics.cost_breakdown.output_tokens.toLocaleString()}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Audio (minutes):</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {analytics.cost_breakdown.audio_minutes.toFixed(1)}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <Divider />

            <Box>
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Total:</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  €{analytics.cost_breakdown.total_cost.toFixed(2)}
                </Text>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Métriques</Text>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm">Coût par message:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    €{(analytics.cost_breakdown.total_cost / analytics.total_messages).toFixed(3)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Plaintes détectées:</Text>
                  <Badge colorScheme={analytics.complaints_count > 0 ? 'red' : 'green'}>
                    {analytics.complaints_count}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Feedback reçus:</Text>
                  <Badge colorScheme="blue">
                    {analytics.feedback_count}
                  </Badge>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function SessionSentryPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      loadSessionData()
    }
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      const supabase = getSupabaseSingleton()
      
      // 1. Charger session
      const { data: sessionData, error: sessionError } = await supabase
        .from('openai_realtime_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // 2. Charger membre
      const { data: memberData } = await supabase
        .from('gym_members')
        .select('id, badge_id, first_name, last_name, gym_id')
        .eq('id', sessionData.member_id)
        .single()

      // 3. Charger gym et franchise
      const { data: gymData } = await supabase
        .from('gyms')
        .select('id, name, franchise_id')
        .eq('id', memberData?.gym_id)
        .single()

      const { data: franchiseData } = await supabase
        .from('franchises')
        .select('name')
        .eq('id', gymData?.franchise_id)
        .single()

      // 4. Charger messages de conversation
      const { data: conversationData } = await supabase
        .from('jarvis_conversation_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('conversation_turn_number', { ascending: true })

      // Enrichir session
      const duration = sessionData.session_end 
        ? Math.floor((new Date(sessionData.session_end).getTime() - new Date(sessionData.session_start).getTime()) / 60000)
        : Math.floor((Date.now() - new Date(sessionData.session_start).getTime()) / 60000)

      const enrichedSession: SessionDetail = {
        id: sessionData.id,
        session_id: sessionData.session_id,
        member_id: sessionData.member_id,
        member_name: memberData ? `${memberData.first_name} ${memberData.last_name}` : 'Membre inconnu',
        member_badge_id: memberData?.badge_id || 'N/A',
        gym_name: gymData?.name || 'Gym inconnue',
        franchise_name: franchiseData?.name || 'Franchise inconnue',
        started_at: new Date(sessionData.session_start),
        ended_at: sessionData.session_end ? new Date(sessionData.session_end) : null,
        duration_minutes: duration,
        ai_model: sessionData.ai_model || 'GPT-4o-mini',
        voice_model: sessionData.voice_model || 'Alloy',
        total_cost: Math.random() * 3 + 1, // Simulé
        status: sessionData.session_end ? 'completed' : 'active'
      }

      // Enrichir messages
      const enrichedMessages: ConversationMessage[] = (conversationData || []).map(msg => ({
        id: msg.id,
        timestamp: new Date(msg.timestamp),
        speaker: msg.speaker,
        message_text: msg.message_text,
        sentiment_score: msg.sentiment_score,
        detected_intent: msg.detected_intent,
        topic_category: msg.topic_category,
        mentioned_equipment: msg.mentioned_equipment || [],
        mentioned_activities: msg.mentioned_activities || [],
        contains_complaint: msg.contains_complaint || false,
        contains_feedback: msg.contains_feedback || false,
        user_engagement_level: msg.user_engagement_level,
        conversation_turn_number: msg.conversation_turn_number
      }))

      // Calculer analytics
      const userMessages = enrichedMessages.filter(m => m.speaker === 'user')
      const jarvisMessages = enrichedMessages.filter(m => m.speaker === 'jarvis')
      const avgSentiment = enrichedMessages.length > 0
        ? enrichedMessages.reduce((sum, m) => sum + (m.sentiment_score || 0.5), 0) / enrichedMessages.length
        : 0.5

      const enrichedAnalytics: SessionAnalytics = {
        total_messages: enrichedMessages.length,
        user_messages: userMessages.length,
        jarvis_messages: jarvisMessages.length,
        avg_sentiment: avgSentiment,
        dominant_topics: ['Fitness', 'Nutrition', 'Motivation'], // Simulé
        equipment_mentioned: ['Tapis de course', 'Haltères'], // Simulé
        activities_discussed: ['Cardio', 'Musculation'], // Simulé
        complaints_count: enrichedMessages.filter(m => m.contains_complaint).length,
        feedback_count: enrichedMessages.filter(m => m.contains_feedback).length,
        engagement_score: 85, // Simulé
        satisfaction_rating: Math.random() > 0.3 ? Math.random() * 2 + 3 : undefined,
        cost_breakdown: {
          input_tokens: Math.floor(Math.random() * 5000) + 1000,
          output_tokens: Math.floor(Math.random() * 3000) + 500,
          audio_minutes: duration,
          total_cost: enrichedSession.total_cost
        }
      }

      setSession(enrichedSession)
      setMessages(enrichedMessages)
      setAnalytics(enrichedAnalytics)
    } catch (error) {
      console.error('Erreur chargement session:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SentryDashboardLayout
        title="Chargement..."
        subtitle="Récupération de la conversation"
      >
        <Box p={6} textAlign="center">
          <Text>Chargement de la session...</Text>
        </Box>
      </SentryDashboardLayout>
    )
  }

  if (!session || !analytics) {
    return (
      <SentryDashboardLayout
        title="Session introuvable"
        subtitle="Cette session n'existe pas ou vous n'avez pas accès"
      >
        <Box p={6}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Session introuvable</AlertTitle>
            <AlertDescription>
              Cette session n'existe pas ou vous n'avez pas les permissions pour y accéder.
            </AlertDescription>
          </Alert>
        </Box>
      </SentryDashboardLayout>
    )
  }

  return (
    <SentryDashboardLayout
      title={`Session #${session.session_id.slice(-8)}`}
      subtitle={`${session.member_name} • ${session.gym_name} • ${analytics.total_messages} messages`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Sessions', href: '/dashboard/sessions' },
        { label: `#${session.session_id.slice(-8)}`, isCurrentPage: true }
      ]}
      actions={
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<BarChart3 size={16} />}
          >
            Analytics
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<Download size={16} />}
          >
            Exporter
          </Button>
        </HStack>
      }
    >
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          
          {/* Header Session */}
          <SessionHeader session={session} />

          {/* Analytics Grid */}
          <SessionAnalyticsGrid analytics={analytics} />

          {/* Tabs: Conversation + Insights */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <MessageSquare size={16} />
                  <Text>Conversation ({messages.length})</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <PieChart size={16} />
                  <Text>Insights</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <ConversationViewer messages={messages} />
              </TabPanel>
              <TabPanel px={0}>
                <SessionInsights analytics={analytics} />
              </TabPanel>
            </TabPanels>
          </Tabs>

        </VStack>
      </Box>
    </SentryDashboardLayout>
  )
}

