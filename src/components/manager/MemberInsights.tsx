/**
 * 👥 MEMBER INSIGHTS COMPONENT
 * Affichage des insights et analytics des membres
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Progress,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Divider,
  List,
  ListItem,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import { 
  TrendingUp, 
  MessageSquare, 
  Target, 
  Clock, 
  AlertTriangle,
  Users,
  Activity,
  Heart,
  Brain
} from 'lucide-react'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

interface MemberInsight {
  id: string
  first_name: string
  last_name: string
  engagement_level: string
  jarvis_personalization_score: number
  total_visits: number
  consistency_score: number
  fitness_goals: string[]
  conversation_stats?: {
    total_interactions: number
    complaints_count: number
    avg_sentiment: number
    engagement_level: string
  }
  alerts?: Array<{
    type: string
    severity: string
    message: string
  }>
}

interface MemberInsightsProps {
  gymId: string
}

export default function MemberInsights({ gymId }: MemberInsightsProps) {
  const [members, setMembers] = useState<MemberInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<MemberInsight | null>(null)
  const supabase = getSupabaseSingleton()

  useEffect(() => {
    loadMemberInsights()
  }, [gymId])

  const loadMemberInsights = async () => {
    try {
      // Récupérer les membres avec données enrichies
      const { data: membersData, error } = await supabase
        .from('gym_members')
        .select(`
          id,
          first_name,
          last_name,
          engagement_level,
          jarvis_personalization_score,
          total_visits,
          consistency_score,
          fitness_goals,
          communication_style,
          last_visit,
          created_at
        `)
        .eq('gym_id', gymId)
        .eq('is_active', true)
        .order('jarvis_personalization_score', { ascending: false })

      if (error) throw error

      // Enrichir avec les stats de conversation
      const enrichedMembers = await Promise.all(
        (membersData || []).map(async (member) => {
          // Récupérer stats conversation
          const { data: conversationStats } = await supabase
            .from('jarvis_conversation_logs')
            .select('detected_intent, sentiment_score, contains_complaint')
            .eq('member_id', member.id)
            .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

          let stats = null
          if (conversationStats && conversationStats.length > 0) {
            const complaints = conversationStats.filter(s => s.contains_complaint).length
            const avgSentiment = conversationStats
              .filter(s => s.sentiment_score !== null)
              .reduce((sum, s) => sum + (s.sentiment_score || 0), 0) / conversationStats.length

            stats = {
              total_interactions: conversationStats.length,
              complaints_count: complaints,
              avg_sentiment: avgSentiment,
              engagement_level: conversationStats.length > 20 ? 'high' : conversationStats.length > 5 ? 'medium' : 'low'
            }
          }

          // Générer alertes
          const alerts = []
          if (stats?.complaints_count > 2) {
            alerts.push({
              type: 'complaints',
              severity: 'warning',
              message: `${stats.complaints_count} plaintes récentes`
            })
          }
          if (stats?.avg_sentiment < -0.3) {
            alerts.push({
              type: 'sentiment',
              severity: 'error',
              message: 'Sentiment négatif dans les conversations'
            })
          }
          if (member.consistency_score < 0.3) {
            alerts.push({
              type: 'consistency',
              severity: 'info',
              message: 'Faible régularité de visite'
            })
          }

          return {
            ...member,
            conversation_stats: stats,
            alerts
          }
        })
      )

      setMembers(enrichedMembers)
    } catch (error) {
      console.error('Erreur chargement insights membres:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMembersByEngagement = () => {
    const high = members.filter(m => m.engagement_level === 'enthusiast' || m.engagement_level === 'champion')
    const medium = members.filter(m => m.engagement_level === 'regular')
    const low = members.filter(m => m.engagement_level === 'casual' || m.engagement_level === 'new')
    
    return { high, medium, low }
  }

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'enthusiast':
      case 'champion':
        return 'green'
      case 'regular':
        return 'blue'
      case 'casual':
        return 'orange'
      case 'new':
        return 'purple'
      default:
        return 'gray'
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'green'
    if (sentiment > -0.3) return 'yellow'
    return 'red'
  }

  if (loading) {
    return (
      <Box p={6}>
        <Text>Chargement des insights membres...</Text>
      </Box>
    )
  }

  const engagementGroups = getMembersByEngagement()

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Vue d'ensemble */}
        <Box>
          <Heading size="lg" mb={4} color="black">
            <Icon as={Brain} mr={2} />
            Insights Membres IA
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
            <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
              <StatLabel color="gray.500">Total Membres</StatLabel>
              <StatNumber color="blue.600">{members.length}</StatNumber>
              <StatHelpText>Actifs dans la salle</StatHelpText>
            </Stat>
            
            <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
              <StatLabel color="gray.500">Engagement Élevé</StatLabel>
              <StatNumber color="green.600">{engagementGroups.high.length}</StatNumber>
              <StatHelpText>
                {Math.round((engagementGroups.high.length / members.length) * 100)}% du total
              </StatHelpText>
            </Stat>
            
            <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
              <StatLabel color="gray.500">Alertes Actives</StatLabel>
              <StatNumber color="orange.600">
                {members.reduce((sum, m) => sum + (m.alerts?.length || 0), 0)}
              </StatNumber>
              <StatHelpText>Nécessitent attention</StatHelpText>
            </Stat>
            
            <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
              <StatLabel color="gray.500">Score IA Moyen</StatLabel>
              <StatNumber color="purple.600">
                {Math.round(members.reduce((sum, m) => sum + m.jarvis_personalization_score, 0) / members.length * 100)}%
              </StatNumber>
              <StatHelpText>Personnalisation JARVIS</StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

        {/* Tabs pour différentes vues */}
        <Tabs variant="enclosed" bg="white" borderRadius="lg" shadow="sm">
          <TabList>
            <Tab><Icon as={Users} mr={2} />Vue d'ensemble</Tab>
            <Tab><Icon as={AlertTriangle} mr={2} />Alertes</Tab>
            <Tab><Icon as={Activity} mr={2} />Performance</Tab>
            <Tab><Icon as={MessageSquare} mr={2} />Conversations</Tab>
          </TabList>

          <TabPanels>
            {/* Vue d'ensemble */}
            <TabPanel>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Membre</Th>
                      <Th>Engagement</Th>
                      <Th>Score IA</Th>
                      <Th>Visites</Th>
                      <Th>Objectifs</Th>
                      <Th>Conversations</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {members.map((member) => (
                      <Tr key={member.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">
                              {member.first_name} {member.last_name}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              ID: {member.id.slice(0, 8)}...
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={getEngagementColor(member.engagement_level)}
                            variant="subtle"
                          >
                            {member.engagement_level}
                          </Badge>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Progress 
                              value={member.jarvis_personalization_score * 100} 
                              size="sm" 
                              w="60px"
                              colorScheme="purple"
                            />
                            <Text fontSize="xs" color="gray.500">
                              {Math.round(member.jarvis_personalization_score * 100)}%
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontWeight="semibold">{member.total_visits}</Text>
                          <Progress 
                            value={member.consistency_score * 100} 
                            size="xs" 
                            colorScheme="blue"
                            mt={1}
                          />
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            {(member.fitness_goals || []).slice(0, 2).map((goal, idx) => (
                              <Badge key={idx} size="sm" colorScheme="teal" variant="outline">
                                {goal}
                              </Badge>
                            ))}
                          </VStack>
                        </Td>
                        <Td>
                          {member.conversation_stats ? (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm">
                                {member.conversation_stats.total_interactions} interactions
                              </Text>
                              <Badge 
                                size="sm"
                                colorScheme={getSentimentColor(member.conversation_stats.avg_sentiment)}
                                variant="subtle"
                              >
                                Sentiment: {member.conversation_stats.avg_sentiment.toFixed(2)}
                              </Badge>
                            </VStack>
                          ) : (
                            <Text fontSize="sm" color="gray.500">Aucune conversation</Text>
                          )}
                        </Td>
                        <Td>
                          {member.alerts && member.alerts.length > 0 ? (
                            <Badge colorScheme="red" variant="solid">
                              {member.alerts.length} alerte{member.alerts.length > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge colorScheme="green" variant="subtle">
                              OK
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Alertes */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {members
                  .filter(m => m.alerts && m.alerts.length > 0)
                  .map((member) => (
                    <Box key={member.id}>
                      <Text fontWeight="semibold" mb={2}>
                        {member.first_name} {member.last_name}
                      </Text>
                      {member.alerts?.map((alert, idx) => (
                        <Alert 
                          key={idx} 
                          status={alert.severity as any} 
                          variant="left-accent" 
                          mb={2}
                        >
                          <AlertIcon />
                          <Box>
                            <AlertTitle>{alert.type.toUpperCase()}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                          </Box>
                        </Alert>
                      ))}
                    </Box>
                  ))}
                
                {members.filter(m => m.alerts && m.alerts.length > 0).length === 0 && (
                  <Text color="gray.500" textAlign="center" py={8}>
                    Aucune alerte active ! 🎉
                  </Text>
                )}
              </VStack>
            </TabPanel>

            {/* Performance */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="green.600">
                      <Icon as={TrendingUp} mr={2} />
                      Top Performers
                    </Heading>
                    <List spacing={2}>
                      {members
                        .filter(m => m.jarvis_personalization_score > 0.7)
                        .slice(0, 5)
                        .map((member) => (
                          <ListItem key={member.id}>
                            <HStack justify="space-between">
                              <Text fontSize="sm">
                                {member.first_name} {member.last_name}
                              </Text>
                              <Badge colorScheme="green" size="sm">
                                {Math.round(member.jarvis_personalization_score * 100)}%
                              </Badge>
                            </HStack>
                          </ListItem>
                        ))}
                    </List>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="blue.600">
                      <Icon as={Target} mr={2} />
                      Objectifs Populaires
                    </Heading>
                    <List spacing={2}>
                      {['lose_weight', 'build_muscle', 'endurance', 'flexibility'].map((goal) => {
                        const count = members.filter(m => m.fitness_goals?.includes(goal)).length
                        return (
                          <ListItem key={goal}>
                            <HStack justify="space-between">
                              <Text fontSize="sm">{goal}</Text>
                              <Badge colorScheme="blue" size="sm">{count}</Badge>
                            </HStack>
                          </ListItem>
                        )
                      })}
                    </List>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="orange.600">
                      <Icon as={Clock} mr={2} />
                      À Surveiller
                    </Heading>
                    <List spacing={2}>
                      {members
                        .filter(m => m.consistency_score < 0.4 || (m.conversation_stats?.complaints_count || 0) > 0)
                        .slice(0, 5)
                        .map((member) => (
                          <ListItem key={member.id}>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm">
                                {member.first_name} {member.last_name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                Consistance: {Math.round(member.consistency_score * 100)}%
                              </Text>
                            </VStack>
                          </ListItem>
                        ))}
                    </List>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Conversations */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text color="gray.600">
                  Analyse des conversations JARVIS des 30 derniers jours
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {members
                    .filter(m => m.conversation_stats)
                    .sort((a, b) => (b.conversation_stats?.total_interactions || 0) - (a.conversation_stats?.total_interactions || 0))
                    .slice(0, 10)
                    .map((member) => (
                      <Card key={member.id}>
                        <CardBody>
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="semibold">
                              {member.first_name} {member.last_name}
                            </Text>
                            <Badge 
                              colorScheme={getSentimentColor(member.conversation_stats?.avg_sentiment || 0)}
                              variant="subtle"
                            >
                              {member.conversation_stats?.avg_sentiment.toFixed(2)}
                            </Badge>
                          </HStack>
                          
                          <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">Interactions:</Text>
                              <Text fontSize="sm" fontWeight="semibold">
                                {member.conversation_stats?.total_interactions}
                              </Text>
                            </HStack>
                            
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">Plaintes:</Text>
                              <Text fontSize="sm" fontWeight="semibold" color={
                                (member.conversation_stats?.complaints_count || 0) > 0 ? 'red.500' : 'green.500'
                              }>
                                {member.conversation_stats?.complaints_count || 0}
                              </Text>
                            </HStack>
                            
                            <Progress 
                              value={((member.conversation_stats?.avg_sentiment || 0) + 1) * 50} 
                              colorScheme={getSentimentColor(member.conversation_stats?.avg_sentiment || 0)}
                              size="sm"
                            />
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                </SimpleGrid>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

