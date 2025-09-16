/**
 * 📈 MODULE ANALYTICS - BUSINESS INTELLIGENCE
 * Métriques business, graphiques interactifs, recommandations IA
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Button,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  TagLeftIcon
} from '@chakra-ui/react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Heart,
  Zap,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  Lightbulb,
  Download,
  RefreshCw,
  Clock,
  MessageSquare,
  Star,
  ThumbsUp
} from 'lucide-react'
import { useState, useEffect } from 'react'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface BusinessMetric {
  id: string
  label: string
  value: string | number
  previousValue: string | number
  trend: number
  trendLabel: string
  format: 'number' | 'currency' | 'percentage' | 'duration'
  status: 'good' | 'warning' | 'critical'
}

interface ChartData {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: any[]
  period: string
}

interface AIRecommendation {
  id: string
  category: 'revenue' | 'retention' | 'satisfaction' | 'engagement'
  title: string
  description: string
  impact: string
  confidence: number
  estimatedROI: number
  priority: 'high' | 'medium' | 'low'
  actions: string[]
}

interface BenchmarkData {
  metric: string
  gymValue: number
  networkAverage: number
  topPerformer: number
  position: number
  totalGyms: number
}

// ===========================================
// 🎨 COMPOSANT SÉLECTEUR PÉRIODE
// ===========================================

function PeriodSelector({ 
  selectedPeriod, 
  onPeriodChange 
}: { 
  selectedPeriod: string
  onPeriodChange: (period: string) => void 
}) {
  const periods = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '3m', label: '3 derniers mois' },
    { value: '6m', label: '6 derniers mois' },
    { value: '1y', label: '1 an' }
  ]

  return (
    <Card>
      <CardBody>
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Icon as={Calendar} size={20} />
            <Text fontSize="md" fontWeight="medium">Période d'analyse</Text>
            
            <Select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              size="sm"
              maxW="200px"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </Select>
          </HStack>

          <HStack spacing={2}>
            <Button size="sm" leftIcon={<RefreshCw size={14} />} variant="outline">
              Actualiser
            </Button>
            <Button size="sm" leftIcon={<Download size={14} />} variant="outline">
              Exporter
            </Button>
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT MÉTRIQUES BUSINESS
// ===========================================

function BusinessMetricsPanel({ metrics }: { metrics: BusinessMetric[] }) {
  const formatValue = (value: string | number, format: BusinessMetric['format']) => {
    switch (format) {
      case 'currency':
        return `€${value}`
      case 'percentage':
        return `${value}%`
      case 'duration':
        return `${value}min`
      default:
        return value.toString()
    }
  }

  const getStatusColor = (status: BusinessMetric['status']) => {
    switch (status) {
      case 'good': return 'green'
      case 'warning': return 'orange'
      case 'critical': return 'red'
    }
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
      {metrics.map(metric => (
        <Card key={metric.id}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.600">
                {metric.label}
              </StatLabel>
              
              <StatNumber 
                fontSize="2xl" 
                color={`${getStatusColor(metric.status)}.600`}
              >
                {formatValue(metric.value, metric.format)}
              </StatNumber>
              
              <StatHelpText>
                <StatArrow type={metric.trend > 0 ? 'increase' : 'decrease'} />
                {Math.abs(metric.trend)}% {metric.trendLabel}
              </StatHelpText>
              
              <Badge 
                colorScheme={getStatusColor(metric.status)} 
                variant="subtle" 
                size="sm"
                mt={2}
              >
                {metric.status}
              </Badge>
            </Stat>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  )
}

// ===========================================
// 🎨 COMPOSANT GRAPHIQUES
// ===========================================

function ChartsPanel({ charts }: { charts: ChartData[] }) {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
      {charts.map(chart => (
        <Card key={chart.id}>
          <CardHeader>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                {chart.title}
              </Text>
              <Badge variant="outline" size="sm">
                {chart.period}
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            {/* Placeholder pour graphique */}
            <Box 
              h="250px" 
              bg="gray.50" 
              borderRadius="md" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
            >
              <VStack spacing={3}>
                <Icon as={BarChart3} size={32} color="gray.400" />
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Graphique {chart.type} interactif
                </Text>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Intégration Chart.js/Recharts à implémenter
                </Text>
              </VStack>
            </Box>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  )
}

// ===========================================
// 🎨 COMPOSANT RECOMMANDATIONS IA
// ===========================================

function AIRecommendationsPanel({ recommendations }: { recommendations: AIRecommendation[] }) {
  const getCategoryColor = (category: AIRecommendation['category']) => {
    switch (category) {
      case 'revenue': return 'green'
      case 'retention': return 'blue'
      case 'satisfaction': return 'purple'
      case 'engagement': return 'orange'
    }
  }

  const getCategoryIcon = (category: AIRecommendation['category']) => {
    switch (category) {
      case 'revenue': return DollarSign
      case 'retention': return Heart
      case 'satisfaction': return ThumbsUp
      case 'engagement': return Zap
    }
  }

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
    }
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Lightbulb size={20} />
            <Text fontSize="lg" fontWeight="bold">Recommandations IA</Text>
          </HStack>
          <Badge colorScheme="purple" variant="solid">
            {recommendations.length} suggestions
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {recommendations.map(rec => {
            const CategoryIcon = getCategoryIcon(rec.category)
            return (
              <Card key={rec.id} variant="outline">
                <CardBody p={4}>
                  <HStack justify="space-between" align="start" mb={3}>
                    <HStack spacing={3} flex={1}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg={`${getCategoryColor(rec.category)}.100`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <CategoryIcon size={18} color={`var(--chakra-colors-${getCategoryColor(rec.category)}-500)`} />
                      </Box>
                      
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text fontSize="md" fontWeight="bold">
                            {rec.title}
                          </Text>
                          <Badge colorScheme={getPriorityColor(rec.priority)} size="sm">
                            {rec.priority}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {rec.description}
                        </Text>
                      </VStack>
                    </HStack>

                    <VStack align="end" spacing={1}>
                      <Text fontSize="sm" fontWeight="bold" color="green.600">
                        ROI: +{rec.estimatedROI}%
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Confiance: {rec.confidence}%
                      </Text>
                    </VStack>
                  </HStack>

                  <Box mb={3}>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Impact attendu: {rec.impact}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {rec.actions.map((action, index) => (
                        <Tag key={index} size="sm" colorScheme={getCategoryColor(rec.category)} variant="subtle">
                          <TagLabel>{action}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>
                  </Box>

                  <HStack spacing={2}>
                    <Button size="sm" colorScheme={getCategoryColor(rec.category)}>
                      Appliquer
                    </Button>
                    <Button size="sm" variant="outline">
                      Plus de détails
                    </Button>
                  </HStack>
                </CardBody>
              </Card>
            )
          })}
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT BENCHMARKS
// ===========================================

function BenchmarksPanel({ benchmarks }: { benchmarks: BenchmarkData[] }) {
  const getPerformanceColor = (position: number, total: number) => {
    const percentile = (total - position + 1) / total
    if (percentile >= 0.8) return 'green'
    if (percentile >= 0.6) return 'blue'
    if (percentile >= 0.4) return 'orange'
    return 'red'
  }

  const getPerformanceLabel = (position: number, total: number) => {
    const percentile = (total - position + 1) / total
    if (percentile >= 0.8) return 'Excellent'
    if (percentile >= 0.6) return 'Bon'
    if (percentile >= 0.4) return 'Moyen'
    return 'À améliorer'
  }

  return (
    <Card>
      <CardHeader>
        <HStack spacing={3}>
          <Award size={20} />
          <Text fontSize="lg" fontWeight="bold">Comparaison Réseau</Text>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Métrique</Th>
              <Th>Votre Salle</Th>
              <Th>Moyenne Réseau</Th>
              <Th>Top Performer</Th>
              <Th>Position</Th>
              <Th>Performance</Th>
            </Tr>
          </Thead>
          <Tbody>
            {benchmarks.map((benchmark, index) => (
              <Tr key={index}>
                <Td fontWeight="medium">{benchmark.metric}</Td>
                <Td fontWeight="bold" color="blue.600">
                  {benchmark.gymValue}
                </Td>
                <Td color="gray.600">
                  {benchmark.networkAverage}
                </Td>
                <Td color="green.600" fontWeight="bold">
                  {benchmark.topPerformer}
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {benchmark.position}/{benchmark.totalGyms}
                  </Text>
                </Td>
                <Td>
                  <Badge 
                    colorScheme={getPerformanceColor(benchmark.position, benchmark.totalGyms)}
                    variant="solid"
                    size="sm"
                  >
                    {getPerformanceLabel(benchmark.position, benchmark.totalGyms)}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function AnalyticsModule({ gymId }: { gymId: string }) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([])
  const [charts, setCharts] = useState<ChartData[]>([])
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([])
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [gymId, selectedPeriod])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Simuler le chargement
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Mock data
      setBusinessMetrics([
        {
          id: 'revenue',
          label: 'Revenus',
          value: 12450,
          previousValue: 11200,
          trend: 11.2,
          trendLabel: 'vs période précédente',
          format: 'currency',
          status: 'good'
        },
        {
          id: 'satisfaction',
          label: 'Satisfaction Moyenne',
          value: 4.2,
          previousValue: 4.4,
          trend: -4.5,
          trendLabel: 'vs période précédente',
          format: 'number',
          status: 'warning'
        },
        {
          id: 'retention',
          label: 'Taux de Rétention',
          value: 87,
          previousValue: 85,
          trend: 2.4,
          trendLabel: 'vs période précédente',
          format: 'percentage',
          status: 'good'
        },
        {
          id: 'engagement',
          label: 'Engagement Moyen',
          value: 6.8,
          previousValue: 7.2,
          trend: -5.6,
          trendLabel: 'vs période précédente',
          format: 'duration',
          status: 'critical'
        }
      ])

      setCharts([
        {
          id: 'sessions_trend',
          title: 'Évolution des Sessions',
          type: 'line',
          data: [],
          period: selectedPeriod
        },
        {
          id: 'satisfaction_breakdown',
          title: 'Répartition Satisfaction',
          type: 'pie',
          data: [],
          period: selectedPeriod
        },
        {
          id: 'topics_popularity',
          title: 'Sujets les Plus Populaires',
          type: 'bar',
          data: [],
          period: selectedPeriod
        },
        {
          id: 'churn_prediction',
          title: 'Prédiction de Churn',
          type: 'area',
          data: [],
          period: selectedPeriod
        }
      ])

      setAIRecommendations([
        {
          id: '1',
          category: 'retention',
          title: 'Programme de Fidélisation VIP',
          description: 'Créer un programme spécial pour les membres premium avec avantages exclusifs',
          impact: 'Réduction churn -15%, augmentation revenus +8%',
          confidence: 87,
          estimatedROI: 23,
          priority: 'high',
          actions: ['Définir avantages VIP', 'Créer missions exclusives', 'Système de points']
        },
        {
          id: '2',
          category: 'satisfaction',
          title: 'Optimisation Créneaux Cardio',
          description: 'Redistribuer les recommandations horaires pour éviter les embouteillages 18h-19h',
          impact: 'Satisfaction +12%, temps d\'attente -30%',
          confidence: 92,
          estimatedROI: 15,
          priority: 'medium',
          actions: ['Analyser fréquentation', 'Ajuster algorithme', 'Communiquer changements']
        },
        {
          id: '3',
          category: 'engagement',
          title: 'Missions Gamifiées',
          description: 'Introduire des défis hebdomadaires avec récompenses pour augmenter l\'engagement',
          impact: 'Durée sessions +20%, fréquence +25%',
          confidence: 78,
          estimatedROI: 18,
          priority: 'medium',
          actions: ['Concevoir défis', 'Système récompenses', 'Interface gamification']
        }
      ])

      setBenchmarks([
        {
          metric: 'Satisfaction Moyenne',
          gymValue: 4.2,
          networkAverage: 4.1,
          topPerformer: 4.8,
          position: 12,
          totalGyms: 45
        },
        {
          metric: 'Taux de Rétention (%)',
          gymValue: 87,
          networkAverage: 82,
          topPerformer: 94,
          position: 8,
          totalGyms: 45
        },
        {
          metric: 'Sessions/Membre/Mois',
          gymValue: 8.5,
          networkAverage: 7.2,
          topPerformer: 12.1,
          position: 6,
          totalGyms: 45
        },
        {
          metric: 'Revenus/Membre (€)',
          gymValue: 89,
          networkAverage: 76,
          topPerformer: 125,
          position: 11,
          totalGyms: 45
        }
      ])

    } catch (error) {
      console.error('Erreur chargement analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <VStack spacing={4}>
        <Progress size="xs" isIndeterminate colorScheme="blue" />
        <Text color="gray.600">Chargement des analyses...</Text>
      </VStack>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      
      {/* Sélecteur de Période */}
      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Métriques Business */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          📊 Métriques Business
        </Text>
        <BusinessMetricsPanel metrics={businessMetrics} />
      </Box>

      {/* Graphiques */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          📈 Graphiques Interactifs
        </Text>
        <ChartsPanel charts={charts} />
      </Box>

      {/* Layout 2 Colonnes */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        
        {/* Recommandations IA */}
        <AIRecommendationsPanel recommendations={aiRecommendations} />

        {/* Benchmarks */}
        <BenchmarksPanel benchmarks={benchmarks} />

      </SimpleGrid>

    </VStack>
  )
}

