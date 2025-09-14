/**
 * 🏋️ DASHBOARD GÉRANT - CENTRE DE COMMANDEMENT BUSINESS
 * Vue complète orientée gestion des adhérents et actions IA
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
  CircularProgress,
  CircularProgressLabel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Switch,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  FormControl,
  FormLabel,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  Gauge
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
  Server,
  Database,
  Network,
  Gauge as GaugeIcon,
  Thermometer,
  Battery,
  Signal,
  Layers,
  GitBranch,
  Code,
  Terminal,
  Bug,
  Wrench,
  RefreshCw,
  Power,
  PowerOff,
  Plus,
  Minus,
  X,
  Check,
  Bell,
  BellRing,
  Lightbulb,
  Rocket,
  Trophy,
  Medal,
  Crown,
  Flame,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Briefcase,
  Clipboard,
  ClipboardCheck,
  UserCheck,
  UserX,
  UserPlus,
  Fingerprint,
  Scan,
  QrCode,
  Headset,
  Radio,
  Rss,
  Wifi as WifiIcon,
  Bluetooth,
  Cast,
  Smartphone
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'
import OverviewModule from '@/components/dashboard/gym-modules/OverviewModule'
import OperationsModule from '@/components/dashboard/gym-modules/OperationsModule'
import MembersModule from '@/components/dashboard/gym-modules/MembersModule'
import AnalyticsModule from '@/components/dashboard/gym-modules/AnalyticsModule'
import SafeLink from '@/components/common/SafeLink'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface GymDetail {
  id: string
  name: string
  address: string
  city: string
  franchise_name: string
  franchise_id: string
  manager_name: string
  manager_email: string
  created_at: Date
  is_active: boolean
  kiosk_status: 'online' | 'offline' | 'maintenance'
  kiosk_version: string
  last_heartbeat: Date
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  action_url?: string
  icon: any
}

interface BusinessMetrics {
  satisfaction_score: number
  satisfaction_trend: number
  churn_rate: number
  churn_trend: number
  active_members_today: number
  total_members: number
  revenue_today: number
  revenue_month: number
  sessions_today: number
  avg_session_duration: number
  top_topics: Array<{ topic: string; mentions: number; trend: number }>
  activity_heatmap: Array<{ hour: number; sessions: number }>
}

interface AIAction {
  id: string
  title: string
  description: string
  impact_expected: string
  priority: 'high' | 'medium' | 'low'
  category: 'retention' | 'satisfaction' | 'engagement' | 'revenue'
  estimated_roi: number
  completed: boolean
  created_at: Date
  due_date?: Date
}

interface MemberProfile {
  id: string
  badge_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  profile_photo_url?: string
  membership_type: string
  member_since: Date
  last_visit: Date | null
  status: 'active' | 'at_risk' | 'critical' | 'inactive'
  
  // Scores IA
  loyalty_score: number
  satisfaction_score: number
  churn_probability: number
  engagement_level: 'high' | 'medium' | 'low'
  
  // Stats
  total_sessions: number
  avg_session_duration: number
  last_session_sentiment: number
  favorite_topics: string[]
  
  // Recommandations IA
  ai_recommendation: string
  ai_priority: 'urgent' | 'important' | 'normal'
}

interface JarvisMission {
  id: string
  title: string
  message: string
  target_audience: string
  voice_style: string
  duration_days: number
  status: 'active' | 'paused' | 'completed' | 'draft'
  created_at: Date
  stats: {
    times_delivered: number
    target_reached: number
    engagement_rate: number
  }
}

interface WeeklyObjective {
  id: string
  title: string
  description: string
  target_value: number
  current_value: number
  unit: string
  category: 'satisfaction' | 'retention' | 'engagement' | 'revenue'
  deadline: Date
  progress_percentage: number
  suggested_actions: string[]
}

interface NetworkRanking {
  current_position: number
  total_gyms: number
  efficiency_score: number
  network_average: number
  trend: 'up' | 'down' | 'stable'
  rank_change: number
  top_performers: Array<{
    name: string
    score: number
    city: string
  }>
}

interface SmartNotification {
  id: string
  type: 'insight' | 'alert' | 'achievement' | 'recommendation'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action_url?: string
  priority: 'high' | 'medium' | 'low'
}

interface ActionLog {
  id: string
  type: 'human' | 'ai' | 'system'
  action: string
  description: string
  timestamp: Date
  impact_measured?: string
  roi_calculated?: number
  status: 'completed' | 'pending' | 'failed'
}

// ===========================================
// 🎨 COMPOSANT ONBOARDING COMPACT
// ===========================================

function OnboardingPanelCompact({ steps, onComplete }: { steps: OnboardingStep[]; onComplete: () => void }) {
  const completedSteps = steps.filter(s => s.completed).length
  const progressPercentage = (completedSteps / steps.length) * 100
  const remainingSteps = steps.filter(s => !s.completed)

  if (remainingSteps.length === 0) {
    return null // Masquer si terminé
  }

  return (
    <Card bg="gradient-to-r from-blue-50 to-purple-50" borderColor="blue.200" borderWidth={1} size="sm">
      <CardBody p={4}>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Rocket size={18} color="blue" />
            <VStack align="start" spacing={0}>
              <Text fontSize="md" fontWeight="bold" color="blue.700">
                Configuration Dashboard ({completedSteps}/{steps.length})
              </Text>
              <Text fontSize="xs" color="gray.600">
                {remainingSteps.length} étapes restantes
              </Text>
            </VStack>
          </HStack>
          
          <HStack spacing={3}>
            <Progress value={progressPercentage} size="sm" colorScheme="blue" w="120px" />
            <Button size="xs" colorScheme="blue" variant="outline">
              Continuer
            </Button>
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT ONBOARDING ORIGINAL (CONSERVÉ)
// ===========================================

function OnboardingPanel({ steps, onComplete }: { steps: OnboardingStep[]; onComplete: () => void }) {
  const completedSteps = steps.filter(s => s.completed).length
  const progressPercentage = (completedSteps / steps.length) * 100

  if (completedSteps === steps.length) {
    return null // Masquer si terminé
  }

  return (
    <Card bg="gradient-to-r from-blue-50 to-purple-50" borderColor="blue.200" borderWidth={2}>
      <CardHeader>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Rocket size={20} color="blue" />
              <Text fontSize="lg" fontWeight="bold" color="blue.700">
                Bienvenue ! Configurons votre dashboard
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Complétez ces 5 étapes pour débloquer toutes les fonctionnalités
            </Text>
          </VStack>
          <VStack align="end" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {completedSteps}/{steps.length}
            </Text>
            <Progress value={progressPercentage} size="sm" colorScheme="blue" w="100px" />
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
          {steps.map((step, index) => (
            <Card 
              key={step.id} 
              variant={step.completed ? "solid" : "outline"}
              bg={step.completed ? "green.50" : "white"}
              borderColor={step.completed ? "green.200" : "gray.200"}
              cursor="pointer"
              _hover={{ shadow: "md" }}
            >
              <CardBody p={4} textAlign="center">
                <VStack spacing={3}>
                  <Box
                    w={12}
                    h={12}
                    borderRadius="full"
                    bg={step.completed ? "green.500" : "gray.100"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {step.completed ? (
                      <Check size={20} color="white" />
                    ) : (
                      <step.icon size={20} color="gray.600" />
                    )}
                  </Box>
                  <VStack spacing={1}>
                    <Text fontSize="sm" fontWeight="bold" textAlign="center">
                      {step.title}
                    </Text>
                    <Text fontSize="xs" color="gray.600" textAlign="center">
                      {step.description}
                    </Text>
                  </VStack>
                  {!step.completed && (
                    <Button size="xs" colorScheme="blue" variant="outline">
                      Commencer
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 CENTRE DE COMMANDEMENT COMPACT
// ===========================================

function CommandCenterCompact({ metrics }: { metrics: BusinessMetrics }) {
  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return 'green'
    if (score >= 3.5) return 'orange'
    return 'red'
  }

  const getChurnColor = (rate: number) => {
    if (rate <= 5) return 'green'
    if (rate <= 10) return 'orange'
    return 'red'
  }

  return (
    <Card size="sm">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack spacing={2}>
            <BarChart3 size={18} />
            <Text fontSize="md" fontWeight="bold">Centre de Commandement</Text>
          </HStack>
          <Badge colorScheme="blue" variant="solid" size="sm">Live</Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        {/* Métriques Principales - Horizontal */}
        <SimpleGrid columns={4} spacing={4} mb={4}>
          
          {/* Satisfaction */}
          <VStack spacing={2}>
            <CircularProgress 
              value={metrics.satisfaction_score * 20} 
              color={getSatisfactionColor(metrics.satisfaction_score)}
              size="60px"
              thickness="8px"
            >
              <CircularProgressLabel fontSize="xs" fontWeight="bold">
                {metrics.satisfaction_score.toFixed(1)}
              </CircularProgressLabel>
            </CircularProgress>
            <VStack spacing={0}>
              <Text fontSize="xs" fontWeight="medium">Satisfaction</Text>
              <HStack spacing={1}>
                <Icon 
                  as={metrics.satisfaction_trend > 0 ? TrendingUp : TrendingDown} 
                  color={metrics.satisfaction_trend > 0 ? "green.500" : "red.500"}
                  size={10}
                />
                <Text fontSize="xs" color={metrics.satisfaction_trend > 0 ? "green.600" : "red.600"}>
                  {Math.abs(metrics.satisfaction_trend)}%
                </Text>
              </HStack>
            </VStack>
          </VStack>

          {/* Churn */}
          <VStack spacing={2}>
            <CircularProgress 
              value={metrics.churn_rate} 
              color={getChurnColor(metrics.churn_rate)}
              size="60px"
              thickness="8px"
            >
              <CircularProgressLabel fontSize="xs" fontWeight="bold">
                {metrics.churn_rate.toFixed(1)}%
              </CircularProgressLabel>
            </CircularProgress>
            <VStack spacing={0}>
              <Text fontSize="xs" fontWeight="medium">Churn</Text>
              <HStack spacing={1}>
                <Icon 
                  as={metrics.churn_trend < 0 ? TrendingDown : TrendingUp} 
                  color={metrics.churn_trend < 0 ? "green.500" : "red.500"}
                  size={10}
                />
                <Text fontSize="xs" color={metrics.churn_trend < 0 ? "green.600" : "red.600"}>
                  {Math.abs(metrics.churn_trend)}%
                </Text>
              </HStack>
            </VStack>
          </VStack>

          {/* Sessions Aujourd'hui */}
          <VStack spacing={2}>
            <Box
              w="60px"
              h="60px"
              borderRadius="full"
              bg="blue.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                {metrics.sessions_today}
              </Text>
            </Box>
            <VStack spacing={0}>
              <Text fontSize="xs" fontWeight="medium">Sessions</Text>
              <Text fontSize="xs" color="gray.500">Aujourd'hui</Text>
            </VStack>
          </VStack>

          {/* Membres Actifs */}
          <VStack spacing={2}>
            <Box
              w="60px"
              h="60px"
              borderRadius="full"
              bg="green.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {metrics.active_members_today}
              </Text>
            </Box>
            <VStack spacing={0}>
              <Text fontSize="xs" fontWeight="medium">Membres</Text>
              <Text fontSize="xs" color="gray.500">Actifs</Text>
            </VStack>
          </VStack>
        </SimpleGrid>

        {/* Top Sujets - Horizontal */}
        <VStack spacing={2} align="stretch">
          <Text fontSize="xs" fontWeight="medium" color="gray.700">
            Top Sujets Mentionnés
          </Text>
          <HStack spacing={2} justify="space-around">
            {metrics.top_topics.slice(0, 3).map((topic, index) => (
              <HStack key={topic.topic} spacing={2} flex={1}>
                <Badge 
                  colorScheme={index === 0 ? 'gold' : index === 1 ? 'gray' : 'orange'}
                  size="sm"
                >
                  #{index + 1}
                </Badge>
                <VStack spacing={0} flex={1}>
                  <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                    {topic.topic}
                  </Text>
                  <HStack spacing={1}>
                    <Text fontSize="xs" color="blue.600" fontWeight="bold">
                      {topic.mentions}
                    </Text>
                    <Icon 
                      as={topic.trend > 0 ? TrendingUp : TrendingDown}
                      color={topic.trend > 0 ? "green.500" : "red.500"}
                      size={10}
                    />
                  </HStack>
                </VStack>
              </HStack>
            ))}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 CENTRE DE COMMANDEMENT ORIGINAL (CONSERVÉ)
// ===========================================

function CommandCenter({ metrics }: { metrics: BusinessMetrics }) {
  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return 'green'
    if (score >= 3.5) return 'orange'
    return 'red'
  }

  const getChurnColor = (rate: number) => {
    if (rate <= 5) return 'green'
    if (rate <= 10) return 'orange'
    return 'red'
  }

  return (
    <Card>
      <CardHeader>
        <HStack spacing={3}>
          <BarChart3 size={24} />
          <Text fontSize="xl" fontWeight="bold">Centre de Commandement</Text>
          <Badge colorScheme="blue" variant="solid">Live</Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          
          {/* Satisfaction Globale */}
          <VStack spacing={4}>
            <Text fontSize="md" fontWeight="medium" color="gray.700">
              Satisfaction Globale
            </Text>
            <Box position="relative">
              <CircularProgress 
                value={metrics.satisfaction_score * 20} 
                color={getSatisfactionColor(metrics.satisfaction_score)}
                size="120px"
                thickness="8px"
              >
                <CircularProgressLabel>
                  <VStack spacing={0}>
                    <Text fontSize="xl" fontWeight="bold">
                      {metrics.satisfaction_score.toFixed(1)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">/ 5.0</Text>
                  </VStack>
                </CircularProgressLabel>
              </CircularProgress>
            </Box>
            <HStack spacing={1}>
              <Icon 
                as={metrics.satisfaction_trend > 0 ? TrendingUp : TrendingDown} 
                color={metrics.satisfaction_trend > 0 ? "green.500" : "red.500"}
                size={16}
              />
              <Text fontSize="sm" color={metrics.satisfaction_trend > 0 ? "green.600" : "red.600"}>
                {Math.abs(metrics.satisfaction_trend)}% vs semaine dernière
              </Text>
            </HStack>
          </VStack>

          {/* Taux de Churn */}
          <VStack spacing={4}>
            <Text fontSize="md" fontWeight="medium" color="gray.700">
              Risque de Churn
            </Text>
            <Box position="relative">
              <CircularProgress 
                value={metrics.churn_rate} 
                color={getChurnColor(metrics.churn_rate)}
                size="120px"
                thickness="8px"
              >
                <CircularProgressLabel>
                  <VStack spacing={0}>
                    <Text fontSize="xl" fontWeight="bold">
                      {metrics.churn_rate.toFixed(1)}%
                    </Text>
                    <Text fontSize="xs" color="gray.500">estimé</Text>
                  </VStack>
                </CircularProgressLabel>
              </CircularProgress>
            </Box>
            <HStack spacing={1}>
              <Icon 
                as={metrics.churn_trend < 0 ? TrendingDown : TrendingUp} 
                color={metrics.churn_trend < 0 ? "green.500" : "red.500"}
                size={16}
              />
              <Text fontSize="sm" color={metrics.churn_trend < 0 ? "green.600" : "red.600"}>
                {Math.abs(metrics.churn_trend)}% vs mois dernier
              </Text>
            </HStack>
          </VStack>

          {/* Activité du Jour */}
          <VStack spacing={4}>
            <Text fontSize="md" fontWeight="medium" color="gray.700">
              Activité Aujourd'hui
            </Text>
            <SimpleGrid columns={2} spacing={4} w="100%">
              <Stat textAlign="center">
                <StatNumber fontSize="2xl" color="blue.600">
                  {metrics.sessions_today}
                </StatNumber>
                <StatLabel fontSize="xs">Sessions</StatLabel>
              </Stat>
              <Stat textAlign="center">
                <StatNumber fontSize="2xl" color="green.600">
                  {metrics.active_members_today}
                </StatNumber>
                <StatLabel fontSize="xs">Membres actifs</StatLabel>
              </Stat>
              <Stat textAlign="center">
                <StatNumber fontSize="lg" color="purple.600">
                  €{metrics.revenue_today}
                </StatNumber>
                <StatLabel fontSize="xs">Revenus</StatLabel>
              </Stat>
              <Stat textAlign="center">
                <StatNumber fontSize="lg" color="orange.600">
                  {metrics.avg_session_duration}min
                </StatNumber>
                <StatLabel fontSize="xs">Durée moy.</StatLabel>
              </Stat>
            </SimpleGrid>
          </VStack>
        </SimpleGrid>

        <Divider my={6} />

        {/* Top Sujets Mentionnés */}
        <VStack spacing={4} align="stretch">
          <Text fontSize="md" fontWeight="medium" color="gray.700">
            Top 3 Sujets les Plus Mentionnés
          </Text>
          <HStack spacing={4} justify="space-around">
            {metrics.top_topics.slice(0, 3).map((topic, index) => (
              <Card key={topic.topic} variant="outline" flex={1}>
                <CardBody p={4} textAlign="center">
                  <VStack spacing={2}>
                    <Badge 
                      colorScheme={index === 0 ? 'gold' : index === 1 ? 'gray' : 'orange'}
                      size="lg"
                      px={3}
                      py={1}
                    >
                      #{index + 1}
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold">
                      {topic.topic}
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                      {topic.mentions}
                    </Text>
                    <HStack spacing={1}>
                      <Icon 
                        as={topic.trend > 0 ? TrendingUp : TrendingDown}
                        color={topic.trend > 0 ? "green.500" : "red.500"}
                        size={12}
                      />
                      <Text fontSize="xs" color={topic.trend > 0 ? "green.600" : "red.600"}>
                        {Math.abs(topic.trend)}%
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 ACTIONS DU JOUR COMPACT
// ===========================================

function DailyActionsPanelCompact({ actions }: { actions: AIAction[] }) {
  const [completedActions, setCompletedActions] = useState<string[]>([])

  const handleActionComplete = (actionId: string) => {
    setCompletedActions(prev => [...prev, actionId])
  }

  const getPriorityColor = (priority: AIAction['priority']) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
    }
  }

  const getCategoryIcon = (category: AIAction['category']) => {
    switch (category) {
      case 'retention': return Heart
      case 'satisfaction': return Smile
      case 'engagement': return Zap
      case 'revenue': return DollarSign
    }
  }

  const pendingActions = actions.filter(a => !completedActions.includes(a.id))

  return (
    <Card size="sm">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Lightbulb size={18} />
            <Text fontSize="md" fontWeight="bold">Actions du Jour</Text>
          </HStack>
          <HStack spacing={2}>
            <Badge colorScheme="purple" variant="solid" size="sm">
              IA
            </Badge>
            <Text fontSize="xs" color="gray.600">
              {pendingActions.length} restantes
            </Text>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {actions.slice(0, 2).map(action => {
            const isCompleted = completedActions.includes(action.id)
            const CategoryIcon = getCategoryIcon(action.category)
            
            return (
              <Card 
                key={action.id} 
                variant="outline" 
                bg={isCompleted ? "green.50" : "white"}
                opacity={isCompleted ? 0.7 : 1}
                size="sm"
              >
                <CardBody p={3}>
                  <HStack justify="space-between" align="start">
                    <HStack spacing={3} flex={1}>
                      <Box
                        w={8}
                        h={8}
                        borderRadius="full"
                        bg={isCompleted ? "green.500" : `${getPriorityColor(action.priority)}.100`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isCompleted ? (
                          <Check size={14} color="white" />
                        ) : (
                          <CategoryIcon size={14} color={`var(--chakra-colors-${getPriorityColor(action.priority)}-500)`} />
                        )}
                      </Box>
                      
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                            {action.title}
                          </Text>
                          <Badge colorScheme={getPriorityColor(action.priority)} size="xs">
                            {action.priority}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.600" noOfLines={2}>
                          {action.description}
                        </Text>
                        <HStack spacing={3} fontSize="xs" color="gray.500">
                          <HStack spacing={1}>
                            <DollarSign size={10} />
                            <Text>ROI: +{action.estimated_roi}%</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>

                    <VStack spacing={1}>
                      {!isCompleted ? (
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Terminé"
                            icon={<Check size={12} />}
                            size="xs"
                            colorScheme="green"
                            onClick={() => handleActionComplete(action.id)}
                          />
                          <IconButton
                            aria-label="Ignorer"
                            icon={<X size={12} />}
                            size="xs"
                            variant="outline"
                          />
                        </HStack>
                      ) : (
                        <Badge colorScheme="green" size="sm">
                          ✅
                        </Badge>
                      )}
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            )
          })}
        </VStack>
        
        {actions.length > 2 && (
          <Box mt={3} textAlign="center">
            <Button variant="outline" size="xs">
              +{actions.length - 2} autres actions
            </Button>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 ACTIONS DU JOUR ORIGINAL (CONSERVÉ)
// ===========================================

function DailyActionsPanel({ actions }: { actions: AIAction[] }) {
  const [completedActions, setCompletedActions] = useState<string[]>([])

  const handleActionComplete = (actionId: string) => {
    setCompletedActions(prev => [...prev, actionId])
  }

  const getPriorityColor = (priority: AIAction['priority']) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
    }
  }

  const getCategoryIcon = (category: AIAction['category']) => {
    switch (category) {
      case 'retention': return Heart
      case 'satisfaction': return Smile
      case 'engagement': return Zap
      case 'revenue': return DollarSign
    }
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Lightbulb size={24} />
            <Text fontSize="xl" fontWeight="bold">Actions du Jour</Text>
            <Badge colorScheme="purple" variant="solid">
              IA Générées
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            {actions.filter(a => !completedActions.includes(a.id)).length} restantes
          </Text>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {actions.slice(0, 3).map(action => {
            const isCompleted = completedActions.includes(action.id)
            const CategoryIcon = getCategoryIcon(action.category)
            
            return (
              <Card 
                key={action.id} 
                variant="outline" 
                bg={isCompleted ? "green.50" : "white"}
                opacity={isCompleted ? 0.7 : 1}
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="start">
                    <HStack spacing={4} flex={1}>
                      <Box
                        w={12}
                        h={12}
                        borderRadius="full"
                        bg={isCompleted ? "green.500" : `${getPriorityColor(action.priority)}.100`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isCompleted ? (
                          <Check size={20} color="white" />
                        ) : (
                          <CategoryIcon size={20} color={`var(--chakra-colors-${getPriorityColor(action.priority)}-500)`} />
                        )}
                      </Box>
                      
                      <VStack align="start" spacing={2} flex={1}>
                        <HStack spacing={2}>
                          <Text fontSize="md" fontWeight="bold">
                            {action.title}
                          </Text>
                          <Badge colorScheme={getPriorityColor(action.priority)} size="sm">
                            {action.priority}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {action.description}
                        </Text>
                        <HStack spacing={4} fontSize="xs" color="gray.500">
                          <HStack spacing={1}>
                            <Target size={12} />
                            <Text>{action.impact_expected}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <DollarSign size={12} />
                            <Text>ROI: +{action.estimated_roi}%</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>

                    <VStack spacing={2}>
                      {!isCompleted ? (
                        <>
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<Check size={16} />}
                            onClick={() => handleActionComplete(action.id)}
                          >
                            Fait
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<X size={16} />}
                          >
                            Ignorer
                          </Button>
                        </>
                      ) : (
                        <Badge colorScheme="green" size="lg" px={3} py={1}>
                          ✅ Terminé
                        </Badge>
                      )}
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            )
          })}
        </VStack>
        
        {actions.length > 3 && (
          <Box mt={4} textAlign="center">
            <Button variant="outline" size="sm">
              Voir toutes les actions ({actions.length})
            </Button>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 FICHES ADHÉRENTS COMPACT
// ===========================================

function MembersPanelCompact({ members }: { members: MemberProfile[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const getStatusColor = (status: MemberProfile['status']) => {
    switch (status) {
      case 'active': return 'green'
      case 'at_risk': return 'orange'
      case 'critical': return 'red'
      case 'inactive': return 'gray'
    }
  }

  const getStatusLabel = (status: MemberProfile['status']) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'at_risk': return 'À Risque'
      case 'critical': return 'Critique'
      case 'inactive': return 'Inactif'
    }
  }

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name} ${member.badge_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleMemberClick = (member: MemberProfile) => {
    setSelectedMember(member)
    onOpen()
  }

  return (
    <>
      <Card size="sm" h="100%">
        <CardHeader pb={2}>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Users size={18} />
                <Text fontSize="md" fontWeight="bold">Adhérents</Text>
              </HStack>
              <Badge colorScheme="blue" variant="outline" size="sm">
                {members.length}
              </Badge>
            </HStack>
            <InputGroup size="sm">
              <InputLeftElement>
                <Search size={14} color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fontSize="xs"
              />
            </InputGroup>
          </VStack>
        </CardHeader>
        <CardBody pt={0} overflow="auto">
          <VStack spacing={2} align="stretch">
            {filteredMembers.slice(0, 20).map(member => (
              <Card 
                key={member.id} 
                variant="outline" 
                cursor="pointer"
                _hover={{ shadow: "sm", bg: "gray.50" }}
                transition="all 0.2s"
                onClick={() => handleMemberClick(member)}
                size="sm"
              >
                <CardBody p={3}>
                  <HStack justify="space-between" align="center">
                    <HStack spacing={3} flex={1}>
                      <Avatar 
                        size="sm" 
                        name={`${member.first_name} ${member.last_name}`}
                        src={member.profile_photo_url}
                      />
                      
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                          {member.first_name} {member.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {member.badge_id}
                        </Text>
                      </VStack>
                    </HStack>

                    <VStack align="end" spacing={1}>
                      <Badge colorScheme={getStatusColor(member.status)} size="xs">
                        {getStatusLabel(member.status)}
                      </Badge>
                      <HStack spacing={2} fontSize="xs">
                        <VStack spacing={0}>
                          <Text fontWeight="bold" color="blue.600">
                            {member.loyalty_score}%
                          </Text>
                          <Text color="gray.500">Fidélité</Text>
                        </VStack>
                        <VStack spacing={0}>
                          <Text fontWeight="bold" color={member.churn_probability > 50 ? "red.600" : "green.600"}>
                            {member.churn_probability}%
                          </Text>
                          <Text color="gray.500">Churn</Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </HStack>

                  {member.ai_recommendation && (
                    <Box mt={2}>
                      <Alert status="info" size="sm" borderRadius="md" p={2}>
                        <AlertIcon boxSize={3} />
                        <Text fontSize="xs" noOfLines={1}>
                          {member.ai_recommendation}
                        </Text>
                      </Alert>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ))}
          </VStack>
          
          {filteredMembers.length > 20 && (
            <Box mt={3} textAlign="center">
              <Button variant="outline" size="xs">
                +{filteredMembers.length - 20} autres membres
              </Button>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Modal Détail Membre (Version Compacte) */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Avatar 
                size="md" 
                name={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : ''}
                src={selectedMember?.profile_photo_url}
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="lg">
                  {selectedMember?.first_name} {selectedMember?.last_name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {selectedMember?.badge_id} • {selectedMember?.membership_type}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMember && (
              <VStack spacing={4} align="stretch">
                {/* Scores Compacts */}
                <SimpleGrid columns={4} spacing={4}>
                  <Stat textAlign="center" size="sm">
                    <StatNumber color="blue.600" fontSize="lg">{selectedMember.loyalty_score}%</StatNumber>
                    <StatLabel fontSize="xs">Fidélité</StatLabel>
                  </Stat>
                  <Stat textAlign="center" size="sm">
                    <StatNumber color="green.600" fontSize="lg">{selectedMember.satisfaction_score.toFixed(1)}</StatNumber>
                    <StatLabel fontSize="xs">Satisfaction</StatLabel>
                  </Stat>
                  <Stat textAlign="center" size="sm">
                    <StatNumber color="red.600" fontSize="lg">{selectedMember.churn_probability}%</StatNumber>
                    <StatLabel fontSize="xs">Risque Churn</StatLabel>
                  </Stat>
                  <Stat textAlign="center" size="sm">
                    <StatNumber color="purple.600" fontSize="lg">{selectedMember.total_sessions}</StatNumber>
                    <StatLabel fontSize="xs">Sessions</StatLabel>
                  </Stat>
                </SimpleGrid>

                {/* Recommandation IA */}
                {selectedMember.ai_recommendation && (
                  <Alert status="info" borderRadius="md" size="sm">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="sm">Recommandation IA</Text>
                      <Text fontSize="sm">{selectedMember.ai_recommendation}</Text>
                    </VStack>
                  </Alert>
                )}

                {/* Sessions Récentes Compactes */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Dernières Sessions</Text>
                  <VStack spacing={2} align="stretch">
                    {[1, 2, 3].map(i => (
                      <Card key={i} variant="outline" size="sm">
                        <CardBody p={2}>
                          <HStack justify="space-between" fontSize="xs">
                            <Text fontWeight="medium">
                              Session #{i} • {Math.floor(Math.random() * 10) + 5}min
                            </Text>
                            <HStack spacing={2}>
                              <Badge colorScheme="green" size="sm">
                                😊 {(Math.random() * 0.4 + 0.6).toFixed(1)}
                              </Badge>
                              <SafeLink href={`/dashboard/sessions/session-${i}/sentry`}>
                                <IconButton
                                  aria-label="Voir conversation"
                                  icon={<Eye size={12} />}
                                  size="xs"
                                  variant="outline"
                                />
                              </SafeLink>
                            </HStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose} size="sm">
              Fermer
            </Button>
            <Button colorScheme="blue" size="sm">
              Créer Mission
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

// ===========================================
// 🎨 FICHES ADHÉRENTS ORIGINAL (CONSERVÉ)
// ===========================================

function MembersPanel({ members }: { members: MemberProfile[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const getStatusColor = (status: MemberProfile['status']) => {
    switch (status) {
      case 'active': return 'green'
      case 'at_risk': return 'orange'
      case 'critical': return 'red'
      case 'inactive': return 'gray'
    }
  }

  const getStatusLabel = (status: MemberProfile['status']) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'at_risk': return 'À Risque'
      case 'critical': return 'Critique'
      case 'inactive': return 'Inactif'
    }
  }

  const getEngagementColor = (level: MemberProfile['engagement_level']) => {
    switch (level) {
      case 'high': return 'green'
      case 'medium': return 'orange'
      case 'low': return 'red'
    }
  }

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name} ${member.badge_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleMemberClick = (member: MemberProfile) => {
    setSelectedMember(member)
    onOpen()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Users size={24} />
              <Text fontSize="xl" fontWeight="bold">Fiches Adhérents</Text>
              <Badge colorScheme="blue" variant="outline">
                {members.length} membres
              </Badge>
            </HStack>
            <InputGroup size="sm" maxW="300px">
              <InputLeftElement>
                <Search size={16} color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredMembers.slice(0, 9).map(member => (
              <Card 
                key={member.id} 
                variant="outline" 
                cursor="pointer"
                _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                onClick={() => handleMemberClick(member)}
              >
                <CardBody p={4}>
                  <VStack spacing={3}>
                    <HStack justify="space-between" w="100%">
                      <Avatar 
                        size="md" 
                        name={`${member.first_name} ${member.last_name}`}
                        src={member.profile_photo_url}
                      />
                      <VStack align="end" spacing={1}>
                        <Badge colorScheme={getStatusColor(member.status)} size="sm">
                          {getStatusLabel(member.status)}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {member.badge_id}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <VStack spacing={1} w="100%">
                      <Text fontSize="md" fontWeight="bold" textAlign="center">
                        {member.first_name} {member.last_name}
                      </Text>
                      <Text fontSize="xs" color="gray.600" textAlign="center">
                        {member.membership_type} • Membre depuis {member.member_since.getFullYear()}
                      </Text>
                    </VStack>

                    <SimpleGrid columns={3} spacing={2} w="100%" fontSize="xs">
                      <VStack spacing={0}>
                        <Text fontWeight="bold" color="blue.600">
                          {member.loyalty_score}%
                        </Text>
                        <Text color="gray.500">Fidélité</Text>
                      </VStack>
                      <VStack spacing={0}>
                        <Text fontWeight="bold" color="green.600">
                          {member.satisfaction_score.toFixed(1)}
                        </Text>
                        <Text color="gray.500">Satisfaction</Text>
                      </VStack>
                      <VStack spacing={0}>
                        <Text fontWeight="bold" color={member.churn_probability > 50 ? "red.600" : "green.600"}>
                          {member.churn_probability}%
                        </Text>
                        <Text color="gray.500">Churn</Text>
                      </VStack>
                    </SimpleGrid>

                    <HStack spacing={1} flexWrap="wrap" justify="center">
                      {member.favorite_topics.slice(0, 2).map(topic => (
                        <Tag key={topic} size="sm" colorScheme="purple" variant="subtle">
                          <TagLabel>{topic}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>

                    {member.ai_recommendation && (
                      <Alert status="info" size="sm" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="xs">
                          {member.ai_recommendation.substring(0, 50)}...
                        </Text>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
          
          {filteredMembers.length > 9 && (
            <Box mt={4} textAlign="center">
              <Button variant="outline" size="sm">
                Voir tous les membres ({filteredMembers.length})
              </Button>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Modal Détail Membre */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Avatar 
                size="md" 
                name={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : ''}
                src={selectedMember?.profile_photo_url}
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="lg">
                  {selectedMember?.first_name} {selectedMember?.last_name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {selectedMember?.badge_id} • {selectedMember?.membership_type}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMember && (
              <VStack spacing={6} align="stretch">
                {/* Scores et Métriques */}
                <SimpleGrid columns={4} spacing={4}>
                  <Stat textAlign="center">
                    <StatNumber color="blue.600">{selectedMember.loyalty_score}%</StatNumber>
                    <StatLabel>Fidélité</StatLabel>
                  </Stat>
                  <Stat textAlign="center">
                    <StatNumber color="green.600">{selectedMember.satisfaction_score.toFixed(1)}</StatNumber>
                    <StatLabel>Satisfaction</StatLabel>
                  </Stat>
                  <Stat textAlign="center">
                    <StatNumber color="red.600">{selectedMember.churn_probability}%</StatNumber>
                    <StatLabel>Risque Churn</StatLabel>
                  </Stat>
                  <Stat textAlign="center">
                    <StatNumber color="purple.600">{selectedMember.total_sessions}</StatNumber>
                    <StatLabel>Sessions</StatLabel>
                  </Stat>
                </SimpleGrid>

                {/* Recommandation IA */}
                {selectedMember.ai_recommendation && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Recommandation IA</Text>
                      <Text fontSize="sm">{selectedMember.ai_recommendation}</Text>
                    </VStack>
                  </Alert>
                )}

                {/* Sujets Favoris */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={2}>Sujets d'Intérêt</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {selectedMember.favorite_topics.map(topic => (
                      <Tag key={topic} colorScheme="purple">
                        <TagLabel>{topic}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </Box>

                {/* Timeline des Interactions (Simulée) */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={2}>Dernières Sessions</Text>
                  <VStack spacing={2} align="stretch">
                    {[1, 2, 3].map(i => (
                      <Card key={i} variant="outline" size="sm">
                        <CardBody p={3}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">
                                Session #{i} • {Math.floor(Math.random() * 10) + 5}min
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Il y a {i} jour{i > 1 ? 's' : ''}
                              </Text>
                            </VStack>
                            <HStack spacing={2}>
                              <Badge colorScheme="green" size="sm">
                                😊 {(Math.random() * 0.4 + 0.6).toFixed(1)}
                              </Badge>
                              <SafeLink href={`/dashboard/sessions/session-${i}/sentry`}>
                                <IconButton
                                  aria-label="Voir conversation"
                                  icon={<Eye size={14} />}
                                  size="xs"
                                  variant="outline"
                                />
                              </SafeLink>
                            </HStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Fermer
            </Button>
            <Button colorScheme="blue">
              Créer Mission Personnalisée
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function GymEnterpriseDashboard({ params }: { params: Promise<{ id: string, gymId: string }> }) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string, gymId: string } | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params
        console.log('🔄 [REDIRECT] Redirecting to new architecture:', resolved)
        // Redirection vers la nouvelle architecture
        router.replace(`/dashboard/franchises/${resolved.id}/gyms/${resolved.gymId}/overview`)
      } catch (error) {
        console.error('❌ [PARAMS] Error resolving:', error)
      }
    }
    resolveParams()
  }, [params, router])

  // Simple page de redirection - plus de logique complexe
  return (
    <Box p={6} textAlign="center">
      <VStack spacing={4}>
        <Progress size="xs" isIndeterminate colorScheme="blue" w="300px" />
        <Text color="gray.600">Redirection vers la nouvelle architecture...</Text>
      </VStack>
    </Box>
  )
}