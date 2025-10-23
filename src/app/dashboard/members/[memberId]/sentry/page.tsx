/**
 * 👤 PROFIL MEMBRE DÉTAILLÉ STYLE SENTRY
 * Vue complète d'un membre avec historique sessions et conversations
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  CircularProgressLabel
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
  Download
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'
import SafeLink from '@/components/common/SafeLink'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface MemberProfile {
  id: string
  badge_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: Date | null
  gender: string
  membership_type: string
  member_since: Date
  membership_expires: Date | null
  gym_name: string
  franchise_name: string
  profile_photo_url: string | null
  is_active: boolean
  
  // Fitness Info
  fitness_level: string
  fitness_goals: string[]
  current_weight_kg: number | null
  target_weight_kg: number | null
  height_cm: number | null
  
  // Preferences
  preferred_workout_times: string[]
  workout_frequency_per_week: number
  favorite_equipment: string[]
  avoided_equipment: string[]
  
  // JARVIS Personalization
  jarvis_personalization_score: number
  communication_style: string
  conversation_topics_of_interest: string[]
  preferred_feedback_style: string
}

interface MemberStats {
  total_sessions_30d: number
  total_sessions_all_time: number
  avg_session_duration: number
  total_time_spent_minutes: number
  last_session_at: Date | null
  avg_sentiment_score: number
  satisfaction_rating: number
  consistency_score: number
  engagement_level: string
  goal_achievement_rate: number
  favorite_visit_days: string[]
  peak_visit_hours: string[]
}

interface SessionHistory {
  id: string
  session_id: string
  started_at: Date
  ended_at: Date | null
  duration_minutes: number
  ai_model: string
  voice_model: string
  cost: number
  messages_count: number
  avg_sentiment: number
  satisfaction_rating: number | null
  topics_discussed: string[]
  goals_mentioned: string[]
  equipment_discussed: string[]
  status: 'completed' | 'interrupted' | 'error'
}

interface ConversationSummary {
  id: string
  session_id: string
  timestamp: Date
  speaker: 'user' | 'jarvis'
  message_preview: string
  sentiment_score: number
  detected_intent: string
  topic_category: string
  contains_feedback: boolean
  contains_complaint: boolean
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function MemberHeader({ member }: { member: MemberProfile }) {
  const getMembershipColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'premium': return 'gold'
      case 'standard': return 'blue'
      case 'basic': return 'gray'
      default: return 'blue'
    }
  }

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'green'
      case 'medium': return 'orange'
      case 'low': return 'red'
      default: return 'gray'
    }
  }

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return null
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  const age = calculateAge(member.date_of_birth)

  return (
    <Card>
      <CardBody>
        <Flex justify="space-between" align="start">
          <HStack spacing={4}>
            <Avatar
              size="xl"
              name={`${member.first_name} ${member.last_name}`}
              src={member.profile_photo_url || undefined}
              bg="purple.500"
              color="white"
            />
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Text fontSize="2xl" fontWeight="bold">
                  {member.first_name} {member.last_name}
                </Text>
                <Badge 
                  colorScheme={getMembershipColor(member.membership_type)} 
                  size="lg" 
                  px={3} 
                  py={1}
                >
                  {member.membership_type}
                </Badge>
                <Badge 
                  colorScheme={member.is_active ? 'green' : 'red'} 
                  size="lg"
                >
                  {member.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </HStack>
              
              <VStack align="start" spacing={1}>
                <HStack color="gray.600" fontSize="sm">
                  <User size={14} />
                  <Text>Badge: {member.badge_id}</Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Mail size={14} />
                  <Text>{member.email}</Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Phone size={14} />
                  <Text>{member.phone || 'Non renseigné'}</Text>
                </HStack>
                <HStack color="gray.600" fontSize="sm">
                  <Dumbbell size={14} />
                  <Text>{member.gym_name} • {member.franchise_name}</Text>
                </HStack>
                {age && (
                  <HStack color="gray.600" fontSize="sm">
                    <Calendar size={14} />
                    <Text>{age} ans • {member.gender || 'Non spécifié'}</Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </HStack>

          <VStack align="end" spacing={2}>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Edit size={16} />}
              >
                Modifier Profil
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
                  <MenuItem icon={<Download size={16} />}>
                    Exporter Données
                  </MenuItem>
                  <MenuItem icon={<Settings size={16} />}>
                    Paramètres JARVIS
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            
            <VStack align="end" spacing={0} fontSize="sm" color="gray.500">
              <Text>Membre depuis: {member.member_since.toLocaleDateString()}</Text>
              {member.membership_expires && (
                <Text>Expire: {member.membership_expires.toLocaleDateString()}</Text>
              )}
            </VStack>
          </VStack>
        </Flex>
      </CardBody>
    </Card>
  )
}

function MemberStatsGrid({ stats }: { stats: MemberStats }) {
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

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'green'
      case 'medium': return 'orange'
      case 'low': return 'red'
      default: return 'gray'
    }
  }

  const SentimentIcon = getSentimentIcon(stats.avg_sentiment_score)

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
      
      {/* Sessions 30j */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Sessions (30j)</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              {stats.total_sessions_30d}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Actif
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Durée Moyenne */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Durée Moy.</StatLabel>
            <StatNumber color="purple.600" fontSize="2xl">
              {stats.avg_session_duration}min
            </StatNumber>
            <StatHelpText>
              Par session
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Sentiment */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Sentiment</StatLabel>
            <HStack spacing={2}>
              <Icon 
                as={SentimentIcon} 
                color={`${getSentimentColor(stats.avg_sentiment_score)}.500`}
                size={24}
              />
              <StatNumber 
                color={`${getSentimentColor(stats.avg_sentiment_score)}.600`} 
                fontSize="2xl"
              >
                {(stats.avg_sentiment_score * 100).toFixed(0)}%
              </StatNumber>
            </HStack>
            <StatHelpText>
              Positif
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Satisfaction */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Satisfaction</StatLabel>
            <HStack spacing={2}>
              <Star size={20} color="orange" />
              <StatNumber color="orange.600" fontSize="2xl">
                {stats.satisfaction_rating.toFixed(1)}
              </StatNumber>
            </HStack>
            <StatHelpText>
              Très élevée
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Consistance */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Consistance</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              {stats.consistency_score}%
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Régulier
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {/* Engagement */}
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600" fontSize="sm">Engagement</StatLabel>
            <Badge 
              colorScheme={getEngagementColor(stats.engagement_level)} 
              fontSize="lg"
              px={2}
              py={1}
            >
              {stats.engagement_level}
            </Badge>
            <StatHelpText>
              Niveau actuel
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function SessionHistoryTable({ sessions }: { sessions: SessionHistory[] }) {
  const getStatusColor = (status: SessionHistory['status']) => {
    switch (status) {
      case 'completed': return 'green'
      case 'interrupted': return 'orange'
      case 'error': return 'red'
    }
  }

  const getSentimentIcon = (score: number) => {
    if (score > 0.6) return ThumbsUp
    if (score > 0.3) return Meh
    return ThumbsDown
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.6) return 'green'
    if (score > 0.3) return 'orange'
    return 'red'
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? mins + 'm' : ''}`
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    
    if (diffDays === 0) return 'Aujourd\'hui'
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `${diffDays}j ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem ago`
    return `${Math.floor(diffDays / 30)}mois ago`
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Historique Sessions ({sessions.length})</Text>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download size={16} />}
          >
            Exporter
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Durée</Th>
                <Th>Modèle IA</Th>
                <Th>Messages</Th>
                <Th>Sentiment</Th>
                <Th>Satisfaction</Th>
                <Th>Coût</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sessions.slice(0, 10).map(session => {
                const SentimentIcon = getSentimentIcon(session.avg_sentiment)
                return (
                  <Tr key={session.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {formatTimeAgo(session.started_at)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {session.started_at.toLocaleTimeString()}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontWeight="medium">
                        {formatDuration(session.duration_minutes)}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue" size="sm">
                        {session.ai_model}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <MessageSquare size={12} />
                        <Text fontSize="sm">{session.messages_count}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Icon 
                          as={SentimentIcon} 
                          color={`${getSentimentColor(session.avg_sentiment)}.500`}
                          size={14}
                        />
                        <Text 
                          fontSize="sm"
                          color={`${getSentimentColor(session.avg_sentiment)}.600`}
                        >
                          {(session.avg_sentiment * 100).toFixed(0)}%
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      {session.satisfaction_rating ? (
                        <HStack spacing={1}>
                          <Star size={12} color="orange" />
                          <Text fontSize="sm">{session.satisfaction_rating.toFixed(1)}</Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color="gray.400">-</Text>
                      )}
                    </Td>
                    <Td>
                      <Text fontSize="sm" fontWeight="medium">
                        €{session.cost.toFixed(2)}
                      </Text>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={getStatusColor(session.status)} 
                        size="sm"
                      >
                        {session.status}
                      </Badge>
                    </Td>
                    <Td>
                      <SafeLink href={`/dashboard/sessions/${session.session_id}`}>
                        <IconButton
                          aria-label="Voir conversation"
                          icon={<Eye size={14} />}
                          size="xs"
                          variant="outline"
                        />
                      </SafeLink>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Box>
        
        {sessions.length > 10 && (
          <Box mt={4} textAlign="center">
            <Button variant="outline" size="sm">
              Voir toutes les sessions ({sessions.length})
            </Button>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}

function MemberInsights({ member, stats }: { member: MemberProfile, stats: MemberStats }) {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
      
      {/* Profil Fitness */}
      <Card>
        <CardHeader>
          <HStack spacing={2}>
            <Target size={20} />
            <Text fontSize="lg" fontWeight="bold">Profil Fitness</Text>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Niveau & Objectifs</Text>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm">Niveau:</Text>
                  <Badge colorScheme="purple">{member.fitness_level}</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Fréquence:</Text>
                  <Text fontSize="sm">{member.workout_frequency_per_week}x/semaine</Text>
                </HStack>
                {member.current_weight_kg && (
                  <HStack justify="space-between">
                    <Text fontSize="sm">Poids actuel:</Text>
                    <Text fontSize="sm">{member.current_weight_kg}kg</Text>
                  </HStack>
                )}
                {member.target_weight_kg && (
                  <HStack justify="space-between">
                    <Text fontSize="sm">Objectif poids:</Text>
                    <Text fontSize="sm">{member.target_weight_kg}kg</Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Objectifs</Text>
              <HStack spacing={1} flexWrap="wrap">
                {member.fitness_goals.map(goal => (
                  <Tag key={goal} size="sm" colorScheme="blue">
                    <TagLeftIcon as={Target} />
                    <TagLabel>{goal}</TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Équipements Préférés</Text>
              <HStack spacing={1} flexWrap="wrap">
                {member.favorite_equipment.map(equipment => (
                  <Tag key={equipment} size="sm" colorScheme="green">
                    <TagLeftIcon as={Dumbbell} />
                    <TagLabel>{equipment}</TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Personnalisation JARVIS */}
      <Card>
        <CardHeader>
          <HStack spacing={2}>
            <Zap size={20} />
            <Text fontSize="lg" fontWeight="bold">Personnalisation JARVIS</Text>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Score de Personnalisation</Text>
              <HStack spacing={4}>
                <CircularProgress 
                  value={member.jarvis_personalization_score} 
                  color="blue.400"
                  size="80px"
                >
                  <CircularProgressLabel>
                    {member.jarvis_personalization_score}%
                  </CircularProgressLabel>
                </CircularProgress>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">
                    Niveau: {member.jarvis_personalization_score > 80 ? 'Expert' : 
                            member.jarvis_personalization_score > 60 ? 'Avancé' : 
                            member.jarvis_personalization_score > 40 ? 'Intermédiaire' : 'Débutant'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Basé sur {stats.total_sessions_all_time} sessions
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Style de Communication</Text>
              <Badge colorScheme="purple" size="lg">
                {member.communication_style}
              </Badge>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Sujets d'Intérêt</Text>
              <HStack spacing={1} flexWrap="wrap">
                {member.conversation_topics_of_interest.map(topic => (
                  <Tag key={topic} size="sm" colorScheme="orange">
                    <TagLeftIcon as={MessageSquare} />
                    <TagLabel>{topic}</TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Créneaux Préférés</Text>
              <VStack spacing={2} align="stretch">
                <HStack spacing={1} flexWrap="wrap">
                  {stats.favorite_visit_days.map(day => (
                    <Tag key={day} size="sm" colorScheme="teal">
                      <TagLeftIcon as={Calendar} />
                      <TagLabel>{day}</TagLabel>
                    </Tag>
                  ))}
                </HStack>
                <HStack spacing={1} flexWrap="wrap">
                  {stats.peak_visit_hours.map(hour => (
                    <Tag key={hour} size="sm" colorScheme="cyan">
                      <TagLeftIcon as={Clock} />
                      <TagLabel>{hour}</TagLabel>
                    </Tag>
                  ))}
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

export default function MemberSentryPage({ params }: { params: { memberId: string } }) {
  const { memberId } = params
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [sessions, setSessions] = useState<SessionHistory[]>([])
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (memberId) {
      loadMemberData()
    }
  }, [memberId])

  const loadMemberData = async () => {
    try {
      const supabase = getSupabaseSingleton()
      
      // 1. Charger membre
      const { data: memberData, error: memberError } = await supabase
        .from('gym_members_v2')
        .select('*')
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError

      // 2. Charger gym et franchise
      const { data: gymData } = await supabase
        .from('gyms')
        .select('id, name, franchise_id')
        .eq('id', memberData.gym_id)
        .single()

      const { data: franchiseData } = await supabase
        .from('franchises')
        .select('name')
        .eq('id', gymData?.franchise_id)
        .single()

      // 3. Charger sessions
      const { data: sessionsData } = await supabase
        .from('openai_realtime_sessions')
        .select('*')
        .eq('member_id', memberId)
        .order('session_start', { ascending: false })

      // 4. Charger conversations
      const { data: conversationsData } = await supabase
        .from('jarvis_conversation_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('timestamp', { ascending: false })
        .limit(50)

      // Enrichir membre
      const enrichedMember: MemberProfile = {
        id: memberData.id,
        badge_id: memberData.badge_id,
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        email: memberData.email,
        phone: memberData.phone || '',
        date_of_birth: memberData.date_of_birth ? new Date(memberData.date_of_birth) : null,
        gender: memberData.gender || 'Non spécifié',
        membership_type: memberData.membership_type || 'Standard',
        member_since: new Date(memberData.created_at),
        membership_expires: memberData.membership_expires ? new Date(memberData.membership_expires) : null,
        gym_name: gymData?.name || 'Gym inconnue',
        franchise_name: franchiseData?.name || 'Franchise inconnue',
        profile_photo_url: memberData.profile_photo_url,
        is_active: memberData.is_active,
        
        // Fitness (avec valeurs par défaut)
        fitness_level: memberData.fitness_level || 'Intermédiaire',
        fitness_goals: memberData.fitness_goals || ['Perte de poids', 'Renforcement musculaire'],
        current_weight_kg: memberData.current_weight_kg,
        target_weight_kg: memberData.target_weight_kg,
        height_cm: memberData.height_cm,
        
        // Preferences (avec valeurs par défaut)
        preferred_workout_times: memberData.preferred_workout_times || ['Matin', 'Soir'],
        workout_frequency_per_week: memberData.workout_frequency_per_week || 3,
        favorite_equipment: memberData.favorite_equipment || ['Tapis de course', 'Haltères', 'Vélo'],
        avoided_equipment: memberData.avoided_equipment || [],
        
        // JARVIS (avec valeurs par défaut)
        jarvis_personalization_score: memberData.jarvis_personalization_score || 75,
        communication_style: memberData.communication_style || 'Encourageant',
        conversation_topics_of_interest: memberData.conversation_topics_of_interest || ['Fitness', 'Nutrition', 'Motivation'],
        preferred_feedback_style: memberData.preferred_feedback_style || 'Positif'
      }

      // Calculer stats
      const totalSessions30d = (sessionsData || []).filter(s => {
        const sessionDate = new Date(s.session_start)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return sessionDate >= thirtyDaysAgo
      }).length

      const avgDuration = (sessionsData || []).length > 0
        ? (sessionsData || []).reduce((sum, s) => {
            const duration = s.session_end 
              ? Math.floor((new Date(s.session_end).getTime() - new Date(s.session_start).getTime()) / 60000)
              : 0
            return sum + duration
          }, 0) / (sessionsData || []).length
        : 0

      const enrichedStats: MemberStats = {
        total_sessions_30d: totalSessions30d,
        total_sessions_all_time: (sessionsData || []).length,
        avg_session_duration: Math.round(avgDuration),
        total_time_spent_minutes: Math.round(avgDuration * (sessionsData || []).length),
        last_session_at: (sessionsData || []).length > 0 ? new Date((sessionsData || [])[0].session_start) : null,
        avg_sentiment_score: 0.75, // Simulé
        satisfaction_rating: 4.6, // Simulé
        consistency_score: 85, // Simulé
        engagement_level: 'High', // Simulé
        goal_achievement_rate: 78, // Simulé
        favorite_visit_days: ['Lundi', 'Mercredi', 'Vendredi'],
        peak_visit_hours: ['18h-19h', '19h-20h']
      }

      // Enrichir sessions
      const enrichedSessions: SessionHistory[] = (sessionsData || []).map(s => ({
        id: s.id,
        session_id: s.session_id,
        started_at: new Date(s.session_start),
        ended_at: s.session_end ? new Date(s.session_end) : null,
        duration_minutes: s.session_end 
          ? Math.floor((new Date(s.session_end).getTime() - new Date(s.session_start).getTime()) / 60000)
          : 0,
        ai_model: s.ai_model || 'GPT-4o-mini',
        voice_model: s.voice_model || 'Alloy',
        cost: Math.random() * 2 + 0.5, // Simulé
        messages_count: Math.floor(Math.random() * 20) + 5, // Simulé
        avg_sentiment: Math.random() * 0.6 + 0.4, // Simulé
        satisfaction_rating: Math.random() > 0.7 ? Math.random() * 2 + 3 : null, // Simulé
        topics_discussed: ['Fitness', 'Nutrition'], // Simulé
        goals_mentioned: ['Perte de poids'], // Simulé
        equipment_discussed: ['Tapis de course'], // Simulé
        status: 'completed'
      }))

      // Enrichir conversations
      const enrichedConversations: ConversationSummary[] = (conversationsData || []).map(c => ({
        id: c.id,
        session_id: c.session_id,
        timestamp: new Date(c.timestamp),
        speaker: c.speaker,
        message_preview: c.message_text.substring(0, 100) + '...',
        sentiment_score: c.sentiment_score || 0.5,
        detected_intent: c.detected_intent || 'general',
        topic_category: c.topic_category || 'fitness',
        contains_feedback: c.contains_feedback || false,
        contains_complaint: c.contains_complaint || false
      }))

      setMember(enrichedMember)
      setStats(enrichedStats)
      setSessions(enrichedSessions)
      setConversations(enrichedConversations)
    } catch (error) {
      console.error('Erreur chargement membre:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SentryDashboardLayout
        title="Chargement..."
        subtitle="Récupération du profil membre"
      >
        <Box p={6} textAlign="center">
          <Text>Chargement du profil...</Text>
        </Box>
      </SentryDashboardLayout>
    )
  }

  if (!member || !stats) {
    return (
      <SentryDashboardLayout
        title="Membre introuvable"
        subtitle="Ce membre n'existe pas ou vous n'avez pas accès"
      >
        <Box p={6}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Membre introuvable</AlertTitle>
            <AlertDescription>
              Ce membre n'existe pas ou vous n'avez pas les permissions pour y accéder.
            </AlertDescription>
          </Alert>
        </Box>
      </SentryDashboardLayout>
    )
  }

  return (
    <SentryDashboardLayout
      title={`${member.first_name} ${member.last_name}`}
      subtitle={`Profil membre • ${stats.total_sessions_all_time} sessions • ${member.gym_name}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Membres', href: '/dashboard/members' },
        { label: `${member.first_name} ${member.last_name}`, isCurrentPage: true }
      ]}
      actions={
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<MessageSquare size={16} />}
          >
            Conversations
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<Edit size={16} />}
          >
            Modifier
          </Button>
        </HStack>
      }
    >
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          
          {/* Header Membre */}
          <MemberHeader member={member} />

          {/* Stats Grid */}
          <MemberStatsGrid stats={stats} />

          {/* Insights */}
          <MemberInsights member={member} stats={stats} />

          {/* Historique Sessions */}
          <SessionHistoryTable sessions={sessions} />

        </VStack>
      </Box>
    </SentryDashboardLayout>
  )
}



