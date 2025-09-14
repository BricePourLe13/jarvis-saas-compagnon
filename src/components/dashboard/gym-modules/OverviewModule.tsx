/**
 * 📊 MODULE OVERVIEW - CENTRE DE COMMANDEMENT PROFESSIONNEL
 * Style Sentry/N-Able avec densité d'information élevée
 */

'use client'

import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Text,
  HStack,
  VStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Progress,
  Icon,
  useColorModeValue,
  Tooltip,
  Checkbox
} from '@chakra-ui/react'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
  DollarSign,
  Zap,
  Clock,
  Wifi,
  WifiOff,
  ArrowRight,
  Target,
  Heart,
  MessageSquare,
  Award,
  Eye,
  BarChart3,
  Thermometer,
  Bell,
  Check,
  X,
  Lightbulb,
  Bluetooth,
  Mic,
  UserCheck,
  Sparkles,
  Trophy
} from 'lucide-react'
import { useState, useEffect } from 'react'
import MetricCard from '../shared/MetricCard'
import AlertPanel from '../shared/AlertPanel'

// ===========================================
// 🎯 TYPES & INTERFACES PROFESSIONNELLES
// ===========================================

interface OnboardingMission {
  id: string
  title: string
  description: string
  completed: boolean
  icon: any
}

interface CriticalAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  severity: 'critical' | 'high' | 'medium' | 'low'
  component: string
}

interface AIAction {
  id: string
  title: string
  description: string
  impact: string
  priority: 'high' | 'medium' | 'low'
  category: 'satisfaction' | 'churn' | 'engagement' | 'revenue'
  completed: boolean
  estimatedROI: number
}

interface MemberProfile {
  id: string
  name: string
  avatar?: string
  status: 'active' | 'at_risk' | 'critical'
  lastInteraction: Date
  satisfactionScore: number
  churnProbability: number
  tags: string[]
  aiRecommendation: string
}

interface JarvisMission {
  id: string
  title: string
  message: string
  target: string
  style: string
  duration: number
  status: 'active' | 'paused' | 'completed'
  stats: {
    mentions: number
    targetReached: number
  }
}

interface WeeklyObjective {
  id: string
  title: string
  target: number
  current: number
  progress: number
  category: string
}

interface NetworkRanking {
  position: number
  totalGyms: number
  score: number
  networkAverage: number
  trend: 'up' | 'down' | 'stable'
}

interface SmartNotification {
  id: string
  type: 'insight' | 'alert' | 'achievement'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface ActionLog {
  id: string
  type: 'human' | 'ai' | 'system'
  action: string
  timestamp: Date
  impact?: string
  status: 'completed' | 'pending'
}

interface OverviewData {
  onboardingMissions: OnboardingMission[]
  onboardingProgress: number
  satisfactionRate: number
  satisfactionTrend: number
  churnRate: number
  churnTrend: number
  alerts: CriticalAlert[]
  activityHeatmap: Array<{ hour: number; sessions: number }>
  topTopics: Array<{ topic: string; mentions: number; trend: number }>
  aiSuggestion: {
    title: string
    impact: string
    confidence: number
  }
  dailyActions: AIAction[]
  memberProfiles: MemberProfile[]
  jarvisMissions: JarvisMission[]
  weeklyObjectives: WeeklyObjective[]
  networkRanking: NetworkRanking
  smartNotifications: SmartNotification[]
  actionLogs: ActionLog[]
}

// ===========================================
// 🎨 BLOC ONBOARDING PROFESSIONNEL
// ===========================================

function OnboardingBlock({ missions, progress }: { missions: OnboardingMission[]; progress: number }) {
  const incompleteMissions = missions.filter(m => !m.completed)
  
  if (incompleteMissions.length === 0) return null

  return (
    <Alert status="info" bg="blue.50" borderColor="blue.200" borderWidth={1} borderRadius="md" mb={4}>
      <AlertIcon color="blue.500" />
      <Box flex={1}>
        <AlertTitle fontSize="sm" color="blue.800">
          Configuration initiale ({Math.round(progress)}% terminé)
        </AlertTitle>
        <AlertDescription fontSize="xs" color="blue.700" mt={1}>
          {incompleteMissions.length} étapes restantes pour activer toutes les fonctionnalités
        </AlertDescription>
        <HStack spacing={2} mt={2}>
          {missions.map(mission => (
            <Tooltip key={mission.id} label={mission.description}>
              <Box
                w={6}
                h={6}
                borderRadius="sm"
                bg={mission.completed ? "green.500" : "gray.300"}
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
              >
                {mission.completed ? (
                  <Check size={12} color="white" />
                ) : (
                  <mission.icon size={10} color="gray.600" />
                )}
              </Box>
            </Tooltip>
          ))}
          <Button size="xs" colorScheme="blue" variant="outline" ml={2}>
            Continuer
          </Button>
        </HStack>
      </Box>
    </Alert>
  )
}

// ===========================================
// 🎨 VUE D'ENSEMBLE - STYLE SENTRY AVEC COMPOSANTS STANDARDISÉS
// ===========================================

function CommandCenterGrid({ data }: { data: OverviewData }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
      
      {/* Sessions Actives */}
      <MetricCard
        title="Sessions Actives"
        value="12"
        subtitle="en cours"
        trend={8.5}
        trendLabel="vs hier"
        status="good"
        icon={Activity}
        badge={{ text: "LIVE", colorScheme: "green" }}
      />

      {/* Membres Aujourd'hui */}
      <MetricCard
        title="Membres Actifs"
        value="47"
        subtitle="aujourd'hui"
        trend={-2.1}
        trendLabel="vs hier"
        status="neutral"
        icon={Users}
      />

      {/* Satisfaction Globale */}
      <MetricCard
        title="Satisfaction"
        value={`${data.satisfactionRate.toFixed(1)}/5`}
        subtitle="moyenne 7j"
        trend={data.satisfactionTrend}
        trendLabel="vs semaine"
        status={data.satisfactionRate >= 4.0 ? 'good' : data.satisfactionRate >= 3.0 ? 'warning' : 'critical'}
        icon={Heart}
      />

      {/* Churn Estimé */}
      <MetricCard
        title="Risque Churn"
        value={`${data.churnRate.toFixed(1)}%`}
        subtitle="estimé IA"
        trend={data.churnTrend}
        trendLabel="vs mois"
        status={data.churnRate <= 5 ? 'good' : data.churnRate <= 10 ? 'warning' : 'critical'}
        icon={AlertTriangle}
        badge={{ text: "AI", colorScheme: "purple" }}
      />

    </SimpleGrid>
  )
}

// ===========================================
// 🎨 ALERTES CRITIQUES - UTILISATION COMPOSANT STANDARDISÉ
// ===========================================

function CriticalAlertsSection({ alerts }: { alerts: CriticalAlert[] }) {
  // Conversion des alertes vers le format du composant AlertPanel
  const formattedAlerts = alerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    title: alert.title,
    message: alert.message,
    timestamp: alert.timestamp,
    severity: alert.severity,
    component: alert.component,
    actionable: true
  }))

  return (
    <AlertPanel
      alerts={formattedAlerts}
      onAlertClick={(alert) => console.log('Alert clicked:', alert)}
      onViewAll={() => console.log('View all alerts')}
      maxVisible={3}
    />
  )
}

// ===========================================
// 🎨 ACTIONS DU JOUR - STYLE PROFESSIONNEL
// ===========================================

function DailyActionsPanel({ actions }: { actions: AIAction[] }) {
  const [completedActions, setCompletedActions] = useState<string[]>([])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'satisfaction': return Heart
      case 'churn': return AlertTriangle
      case 'engagement': return Zap
      case 'revenue': return DollarSign
    }
  }

  return (
    <Card size="sm">
      <CardHeader p={3} pb={2}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="bold" color="gray.900">
            Actions du Jour
          </Text>
          <Badge colorScheme="purple" size="sm">
            IA
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody p={3} pt={0}>
        <VStack spacing={2} align="stretch">
          {actions.slice(0, 3).map(action => {
            const isCompleted = completedActions.includes(action.id)
            const CategoryIcon = getCategoryIcon(action.category)
            
            return (
              <Box 
                key={action.id}
                p={2}
                borderRadius="sm"
                bg={isCompleted ? "green.50" : "white"}
                border="1px solid"
                borderColor={isCompleted ? "green.200" : "gray.200"}
              >
                <HStack justify="space-between" align="start">
                  <HStack spacing={2} flex={1}>
                    <Box
                      w={5}
                      h={5}
                      borderRadius="sm"
                      bg={isCompleted ? "green.500" : `${getPriorityColor(action.priority)}.100`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {isCompleted ? (
                        <Check size={10} color="white" />
                      ) : (
                        <CategoryIcon size={10} color={`var(--chakra-colors-${getPriorityColor(action.priority)}-600)`} />
                      )}
                    </Box>
                    
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.900">
                        {action.title}
                      </Text>
                      <Text fontSize="xs" color="gray.600" noOfLines={1}>
                        {action.description}
                      </Text>
                      <HStack spacing={2} mt={1}>
                        <Text fontSize="xs" color="gray.500">
                          {action.impact}
                        </Text>
                        <Text fontSize="xs" color="green.600" fontWeight="medium">
                          ROI: +{action.estimatedROI}%
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>

                  <HStack spacing={1}>
                    <Badge colorScheme={getPriorityColor(action.priority)} size="xs">
                      {action.priority.toUpperCase()}
                    </Badge>
                    {!isCompleted && (
                      <Checkbox
                        size="sm"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCompletedActions(prev => [...prev, action.id])
                          }
                        }}
                      />
                    )}
                  </HStack>
                </HStack>
              </Box>
            )
          })}
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 TOP TOPICS & HEATMAP
// ===========================================

function TopicsAndHeatmap({ topTopics, heatmap }: { topTopics: any[]; heatmap: any[] }) {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
      
      {/* Top 3 Sujets */}
      <Card size="sm">
        <CardHeader p={3} pb={2}>
          <Text fontSize="sm" fontWeight="bold" color="gray.900">
            Top Sujets Mentionnés
          </Text>
        </CardHeader>
        <CardBody p={3} pt={0}>
          <VStack spacing={2} align="stretch">
            {topTopics.slice(0, 3).map((topic, index) => (
              <HStack key={topic.topic} justify="space-between">
                <HStack spacing={2}>
                  <Badge 
                    colorScheme={index === 0 ? 'gold' : index === 1 ? 'gray' : 'orange'}
                    size="xs"
                  >
                    #{index + 1}
                  </Badge>
                  <Text fontSize="xs" fontWeight="medium">
                    {topic.topic}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="xs" fontWeight="bold" color="blue.600">
                    {topic.mentions}
                  </Text>
                  <Icon 
                    as={topic.trend > 0 ? TrendingUp : TrendingDown}
                    size={10}
                    color={topic.trend > 0 ? "green.500" : "red.500"}
                  />
                  <Text fontSize="xs" color={topic.trend > 0 ? "green.600" : "red.600"}>
                    {Math.abs(topic.trend)}%
                  </Text>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Activité Horaire */}
      <Card size="sm">
        <CardHeader p={3} pb={2}>
          <Text fontSize="sm" fontWeight="bold" color="gray.900">
            Activité Horaire
          </Text>
        </CardHeader>
        <CardBody p={3} pt={0}>
          <Box h="80px" bg="gray.50" borderRadius="sm" display="flex" alignItems="center" justifyContent="center">
            <VStack spacing={1}>
              <BarChart3 size={20} color="gray.400" />
              <Text fontSize="xs" color="gray.600">
                Heatmap à implémenter
              </Text>
            </VStack>
          </Box>
        </CardBody>
      </Card>

    </SimpleGrid>
  )
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function OverviewModule({ gymId }: { gymId: string }) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOverviewData()
  }, [gymId])

  const loadOverviewData = async () => {
    try {
      // Simuler le chargement
      await new Promise(resolve => setTimeout(resolve, 800))

      const mockData: OverviewData = {
        onboardingMissions: [
          { id: '1', title: 'Appairer Jarvis', description: 'Connecter le kiosk au dashboard', completed: true, icon: Bluetooth },
          { id: '2', title: 'Mission Vocale', description: 'Créer votre première mission', completed: true, icon: Mic },
          { id: '3', title: 'Fiche Adhérent', description: 'Consulter un profil membre', completed: false, icon: UserCheck },
          { id: '4', title: 'Suggestion IA', description: 'Appliquer une recommandation', completed: false, icon: Sparkles },
          { id: '5', title: 'Classement', description: 'Voir votre position réseau', completed: false, icon: Trophy }
        ],
        onboardingProgress: 40,
        satisfactionRate: 4.2,
        satisfactionTrend: 5.3,
        churnRate: 6.8,
        churnTrend: -2.1,
        alerts: [
          {
            id: '1',
            type: 'warning',
            title: 'Qualité Audio Dégradée',
            message: 'Microphone kiosk: bruit de fond détecté',
            timestamp: new Date(Date.now() - 1800000),
            severity: 'medium',
            component: 'KIOSK-AUDIO'
          }
        ],
        activityHeatmap: [],
        topTopics: [
          { topic: 'Nutrition', mentions: 47, trend: 12 },
          { topic: 'Cardio', mentions: 38, trend: -5 },
          { topic: 'Musculation', mentions: 31, trend: 8 }
        ],
        aiSuggestion: {
          title: 'Optimiser créneaux cardio',
          impact: 'Réduire attente -30%, satisfaction +12%',
          confidence: 87
        },
        dailyActions: [
          {
            id: '1',
            title: 'Réactiver Marie Dubois',
            description: 'Absence 10j, créer mission motivation',
            impact: 'Churn -15%',
            priority: 'high',
            category: 'churn',
            completed: false,
            estimatedROI: 25
          },
          {
            id: '2',
            title: 'Promouvoir yoga',
            description: 'Pic mentions "stress", suggérer relaxation',
            impact: 'Satisfaction +8%',
            priority: 'medium',
            category: 'satisfaction',
            completed: false,
            estimatedROI: 15
          },
          {
            id: '3',
            title: 'Optimiser horaires',
            description: 'Embouteillages 18h-19h détectés',
            impact: 'Engagement +12%',
            priority: 'low',
            category: 'engagement',
            completed: false,
            estimatedROI: 10
          }
        ],
        memberProfiles: [],
        jarvisMissions: [],
        weeklyObjectives: [],
        networkRanking: {
          position: 12,
          totalGyms: 45,
          score: 87.3,
          networkAverage: 82.1,
          trend: 'up'
        },
        smartNotifications: [],
        actionLogs: []
      }

      setData(mockData)
    } catch (error) {
      console.error('Erreur chargement overview:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box p={4}>
        <Progress size="xs" isIndeterminate colorScheme="blue" mb={4} />
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Chargement des métriques...
        </Text>
      </Box>
    )
  }

  if (!data) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle fontSize="sm">Erreur de chargement</AlertTitle>
        <AlertDescription fontSize="xs">
          Impossible de charger les données.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Box>
      {/* Onboarding Block */}
      <OnboardingBlock 
        missions={data.onboardingMissions} 
        progress={data.onboardingProgress} 
      />

      {/* Vue d'ensemble */}
      <CommandCenterGrid data={data} />

      {/* Alertes Critiques */}
      <Box mb={4}>
        <CriticalAlertsSection alerts={data.alerts} />
      </Box>

      {/* Actions du Jour */}
      <Box mb={4}>
        <DailyActionsPanel actions={data.dailyActions} />
      </Box>

      {/* Topics & Heatmap */}
      <TopicsAndHeatmap 
        topTopics={data.topTopics} 
        heatmap={data.activityHeatmap} 
      />
    </Box>
  )
}