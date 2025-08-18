'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Badge, 
  Button, 
  Input, 
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Icon,
  Spinner,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  SimpleGrid
} from '@chakra-ui/react'
import { Search, MessageSquare, TrendingUp, Clock, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ManagerLayout from '@/components/manager/ManagerLayout'

interface MemberStats {
  total_sessions_7d: number
  total_messages_7d: number
  last_conversation_at: string | null
  avg_sentiment_7d: number | null
  last_intent: string | null
}

interface Member {
  id: string
  badge_id: string
  first_name: string
  last_name: string
  email: string
  membership_type: string
  is_active: boolean
  total_visits: number
  last_visit: string | null
  engagement_level: string
  jarvis_personalization_score: number
  created_at: string
  conversation_stats: MemberStats
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('last_conversation')
  const [filterBy, setFilterBy] = useState('all')
  const router = useRouter()

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/manager/members')
      const data = await response.json()

      if (data.success) {
        setMembers(data.members)
      } else {
        console.error('Erreur récupération membres:', data.error)
      }
    } catch (error) {
      console.error('Erreur API membres:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer et trier les membres
  const filteredAndSortedMembers = members
    .filter(member => {
      const matchesSearch = searchTerm === '' || 
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.badge_id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterBy === 'all' ||
        (filterBy === 'active_jarvis' && member.conversation_stats.total_sessions_7d > 0) ||
        (filterBy === 'inactive_jarvis' && member.conversation_stats.total_sessions_7d === 0) ||
        (filterBy === 'high_engagement' && member.engagement_level === 'enthusiast')

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'last_conversation':
          const aTime = a.conversation_stats.last_conversation_at ? new Date(a.conversation_stats.last_conversation_at).getTime() : 0
          const bTime = b.conversation_stats.last_conversation_at ? new Date(b.conversation_stats.last_conversation_at).getTime() : 0
          return bTime - aTime
        case 'sessions_desc':
          return b.conversation_stats.total_sessions_7d - a.conversation_stats.total_sessions_7d
        case 'sentiment_desc':
          return (b.conversation_stats.avg_sentiment_7d || 0) - (a.conversation_stats.avg_sentiment_7d || 0)
        case 'name_asc':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        default:
          return 0
      }
    })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Il y a moins d\'1h'
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffHours < 48) return 'Hier'
    return date.toLocaleDateString('fr-FR')
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

  const getEngagementLabel = (level: string) => {
    switch (level) {
      case 'enthusiast': return 'Passionné'
      case 'regular': return 'Régulier'
      case 'casual': return 'Occasionnel'
      case 'new': return 'Nouveau'
      default: return level
    }
  }

  // Statistiques rapides
  const totalMembers = members.length
  const activeJarvisUsers = members.filter(m => m.conversation_stats.total_sessions_7d > 0).length
  const avgSentiment = members
    .filter(m => m.conversation_stats.avg_sentiment_7d !== null)
    .reduce((acc, m) => acc + (m.conversation_stats.avg_sentiment_7d || 0), 0) / 
    members.filter(m => m.conversation_stats.avg_sentiment_7d !== null).length || 0

  if (loading) {
    return (
      <ManagerLayout currentPage="Fiches Membres" gymName="AREA" onlineStatus={true}>
        <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text color="gray.500">Chargement des membres...</Text>
          </VStack>
        </Box>
      </ManagerLayout>
    )
  }

  return (
    <ManagerLayout currentPage="Fiches Membres" gymName="AREA" onlineStatus={true}>
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          {/* En-tête */}
          <Box>
            <Heading size="lg" color="black" mb={2}>
              Fiches Membres
            </Heading>
            <Text color="gray.600">
              Profils détaillés et historique des interactions JARVIS
            </Text>
          </Box>

          {/* Statistiques rapides */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardBody>
                <HStack spacing={3}>
                  <Icon as={MessageSquare} w={5} h={5} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="gray.500">Utilisateurs JARVIS (7j)</Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.500">
                      {activeJarvisUsers}/{totalMembers}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <HStack spacing={3}>
                  <Icon as={TrendingUp} w={5} h={5} color="green.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="gray.500">Sentiment Moyen</Text>
                    <HStack spacing={2}>
                      <Text fontSize="xl" fontWeight="bold" color="green.500">
                        {(avgSentiment * 100).toFixed(0)}%
                      </Text>
                      <Badge colorScheme={getSentimentColor(avgSentiment)} size="sm">
                        {getSentimentLabel(avgSentiment)}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <HStack spacing={3}>
                  <Icon as={Clock} w={5} h={5} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="gray.500">Sessions Totales (7j)</Text>
                    <Text fontSize="xl" fontWeight="bold" color="purple.500">
                      {members.reduce((acc, m) => acc + m.conversation_stats.total_sessions_7d, 0)}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filtres et recherche */}
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <Icon as={Search} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Select 
              maxW="200px" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="last_conversation">Dernière conversation</option>
              <option value="sessions_desc">Sessions (plus → moins)</option>
              <option value="sentiment_desc">Sentiment (+ → -)</option>
              <option value="name_asc">Nom A→Z</option>
            </Select>

            <Select 
              maxW="200px" 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="all">Tous les membres</option>
              <option value="active_jarvis">Actifs JARVIS (7j)</option>
              <option value="inactive_jarvis">Inactifs JARVIS</option>
              <option value="high_engagement">Très engagés</option>
            </Select>
          </HStack>

          {/* Table des membres */}
          <Card>
            <CardBody p={0}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Membre</Th>
                    <Th>Engagement</Th>
                    <Th>Sessions JARVIS (7j)</Th>
                    <Th>Sentiment</Th>
                    <Th>Dernière conversation</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredAndSortedMembers.map((member) => (
                    <Tr key={member.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <HStack spacing={3}>
                          <Avatar 
                            size="sm" 
                            name={`${member.first_name} ${member.last_name}`}
                            bg="blue.500"
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">
                              {member.first_name} {member.last_name}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {member.badge_id} • {member.membership_type}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={getEngagementColor(member.engagement_level)}
                          variant="subtle"
                        >
                          {getEngagementLabel(member.engagement_level)}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color="purple.500">
                            {member.conversation_stats.total_sessions_7d}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {member.conversation_stats.total_messages_7d} messages
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        {member.conversation_stats.avg_sentiment_7d !== null ? (
                          <Badge 
                            colorScheme={getSentimentColor(member.conversation_stats.avg_sentiment_7d)}
                            variant="subtle"
                          >
                            {getSentimentLabel(member.conversation_stats.avg_sentiment_7d)}
                          </Badge>
                        ) : (
                          <Text fontSize="sm" color="gray.400">N/A</Text>
                        )}
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm">
                            {formatDate(member.conversation_stats.last_conversation_at)}
                          </Text>
                          {member.conversation_stats.last_intent && (
                            <Text fontSize="xs" color="gray.500">
                              {member.conversation_stats.last_intent}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          leftIcon={<Icon as={Eye} />}
                          onClick={() => router.push(`/dashboard/members/${member.id}`)}
                          variant="outline"
                          colorScheme="blue"
                        >
                          Voir détail
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {filteredAndSortedMembers.length === 0 && (
                <Box p={8} textAlign="center">
                  <Text color="gray.500">Aucun membre trouvé avec ces critères</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </ManagerLayout>
  )
}
