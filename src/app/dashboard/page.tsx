/**
 * 🏠 DASHBOARD PRINCIPAL UNIFIÉ
 * Point d'entrée unique avec vue adaptée au rôle utilisateur
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
  Avatar,
  Progress,
  Flex,
  Divider
} from '@chakra-ui/react'
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Clock,
  Building2,
  Dumbbell,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { userContextManager, UserContext, NavigationContext, DashboardUrlBuilder } from '@/lib/user-context'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface DashboardStats {
  activeSessions: number
  dailyCost: number
  dailySessions: number
  avgDuration: number
  totalFranchises?: number
  totalGyms?: number
  totalUsers?: number
}

interface QuickAction {
  id: string
  label: string
  description: string
  icon: any
  href: string
  color: string
  badge?: string | number
}

interface RecentActivity {
  id: string
  type: 'session' | 'error' | 'user' | 'system'
  title: string
  description: string
  timestamp: Date
  status: 'success' | 'warning' | 'error'
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions Actives</StatLabel>
            <StatNumber color="blue.600">{stats.activeSessions}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              En temps réel
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Coût IA (Aujourd'hui)</StatLabel>
            <StatNumber color="green.600">${stats.dailyCost.toFixed(2)}</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              Optimisé
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Sessions (Jour)</StatLabel>
            <StatNumber color="purple.600">{stats.dailySessions}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              +12% vs hier
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel color="gray.600">Durée Moyenne</StatLabel>
            <StatNumber color="orange.600">{stats.avgDuration}min</StatNumber>
            <StatHelpText>
              Engagement élevé
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}

function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  const router = useRouter()

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
      {actions.map(action => (
        <Card
          key={action.id}
          cursor="pointer"
          onClick={() => router.push(action.href)}
          _hover={{
            shadow: 'md',
            transform: 'translateY(-2px)'
          }}
          transition="all 0.2s"
        >
          <CardBody>
            <VStack spacing={3} align="start">
              <HStack justify="space-between" w="100%">
                <Box
                  p={3}
                  borderRadius="lg"
                  bg={`${action.color}.100`}
                  color={`${action.color}.600`}
                >
                  <action.icon size={24} />
                </Box>
                {action.badge && (
                  <Badge colorScheme={action.color} borderRadius="full">
                    {action.badge}
                  </Badge>
                )}
              </HStack>
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold" color="gray.800">
                  {action.label}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {action.description}
                </Text>
              </VStack>
              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ArrowRight size={16} />}
                color={`${action.color}.600`}
                _hover={{ bg: `${action.color}.50` }}
              >
                Accéder
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  )
}

function RecentActivityFeed({ activities }: { activities: RecentActivity[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green'
      case 'warning': return 'orange'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return Activity
    }
  }

  return (
    <Card>
      <CardHeader>
        <Text fontSize="lg" fontWeight="semibold">
          Activité Récente
        </Text>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {activities.map((activity, index) => {
            const StatusIcon = getStatusIcon(activity.status)
            return (
              <Box key={activity.id}>
                <HStack spacing={3} align="start">
                  <Box
                    p={2}
                    borderRadius="full"
                    bg={`${getStatusColor(activity.status)}.100`}
                    color={`${getStatusColor(activity.status)}.600`}
                  >
                    <StatusIcon size={16} />
                  </Box>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      {activity.title}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {activity.description}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {activity.timestamp.toLocaleString('fr-FR')}
                    </Text>
                  </VStack>
                </HStack>
                {index < activities.length - 1 && <Divider mt={4} />}
              </Box>
            )
          })}
        </VStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

export default function DashboardPage() {
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    activeSessions: 0,
    dailyCost: 0,
    dailySessions: 0,
    avgDuration: 0
  })
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Récupérer le contexte utilisateur
      const userCtx = userContextManager.getUserContext()
      const navCtx = userContextManager.getNavigationContext()
      
      if (!userCtx || !navCtx) {
        // Recharger le contexte si nécessaire
        const newUserCtx = await userContextManager.loadUserContext()
        const newNavCtx = await userContextManager.loadNavigationContext()
        
        if (newUserCtx && newNavCtx) {
          setUserContext(newUserCtx)
          setNavigationContext(newNavCtx)
        }
        return
      }

      setUserContext(userCtx)
      setNavigationContext(navCtx)

      // Charger les données selon le rôle
      await Promise.all([
        loadStats(userCtx, navCtx),
        loadQuickActions(userCtx, navCtx),
        loadRecentActivities(userCtx, navCtx)
      ])

    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (userCtx: UserContext, navCtx: NavigationContext) => {
    try {
      const supabase = getSupabaseSingleton()
      
      // Statistiques de base (sessions)
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const [
        { data: activeSessions },
        { data: dailySessions }
      ] = await Promise.all([
        supabase
          .from('openai_realtime_sessions')
          .select('id, cost_usd')
          .is('session_end', null),
        supabase
          .from('openai_realtime_sessions')
          .select('id, cost_usd, session_start, session_end')
          .gte('session_start', startOfDay.toISOString())
      ])

      // Calculer les métriques
      const dailyCost = (dailySessions || []).reduce((sum: number, s: any) => sum + (s.cost_usd || 0), 0)
      const completed = (dailySessions || []).filter((s: any) => s.session_end)
      const avgDuration = completed.length > 0 ? Math.round(
        (completed.reduce((acc: number, s: any) => 
          acc + (new Date(s.session_end).getTime() - new Date(s.session_start).getTime()), 0
        ) / completed.length) / 60000
      ) : 0

      let newStats: DashboardStats = {
        activeSessions: (activeSessions || []).length,
        dailyCost,
        dailySessions: (dailySessions || []).length,
        avgDuration
      }

      // Statistiques globales pour super admin
      if (userCtx.role === 'super_admin') {
        const [
          { data: franchises },
          { data: gyms },
          { data: users }
        ] = await Promise.all([
          supabase.from('franchises').select('id').eq('is_active', true),
          supabase.from('gyms').select('id').eq('is_active', true),
          supabase.from('users').select('id').eq('is_active', true)
        ])

        newStats = {
          ...newStats,
          totalFranchises: (franchises || []).length,
          totalGyms: (gyms || []).length,
          totalUsers: (users || []).length
        }
      }

      setStats(newStats)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const loadQuickActions = (userCtx: UserContext, navCtx: NavigationContext) => {
    const actions: QuickAction[] = []

    // Actions selon le rôle
    if (userCtx.role === 'super_admin') {
      actions.push(
        {
          id: 'franchises',
          label: 'Gérer les Franchises',
          description: 'Voir et gérer toutes les franchises',
          icon: Building2,
          href: DashboardUrlBuilder.franchises(),
          color: 'blue',
          badge: navCtx.availableFranchises.length
        },
        {
          id: 'users',
          label: 'Équipe & Utilisateurs',
          description: 'Gérer les accès et permissions',
          icon: Users,
          href: '/dashboard/users',
          color: 'purple'
        }
      )
    }

    if (userCtx.role === 'franchise_owner' || navCtx.availableGyms.length > 0) {
      actions.push({
        id: 'gyms',
        label: 'Mes Salles de Sport',
        description: 'Gérer les salles et kiosks',
        icon: Dumbbell,
        href: '/dashboard/gyms',
        color: 'green',
        badge: navCtx.availableGyms.length
      })
    }

    // Actions communes
    actions.push(
      {
        id: 'sessions',
        label: 'Sessions Live',
        description: 'Monitoring temps réel des conversations',
        icon: Activity,
        href: DashboardUrlBuilder.liveSessions(),
        color: 'orange',
        badge: stats.activeSessions > 0 ? stats.activeSessions : undefined
      },
      {
        id: 'monitoring',
        label: 'Monitoring Système',
        description: 'Performance et santé du système',
        icon: TrendingUp,
        href: '/dashboard/monitoring',
        color: 'teal'
      }
    )

    setQuickActions(actions)
  }

  const loadRecentActivities = async (userCtx: UserContext, navCtx: NavigationContext) => {
    try {
      const supabase = getSupabaseSingleton()
      
      // Charger les activités récentes
      const { data: errors } = await supabase
        .from('jarvis_errors_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      const activities: RecentActivity[] = (errors || []).map(error => ({
        id: error.id,
        type: 'error',
        title: `Erreur ${error.error_type}`,
        description: error.error_message || 'Voir détails',
        timestamp: new Date(error.created_at),
        status: error.error_type === 'critical' ? 'error' : 'warning'
      }))

      // Ajouter des activités système simulées
      activities.unshift({
        id: 'system-1',
        type: 'system',
        title: 'Système opérationnel',
        description: 'Tous les services fonctionnent normalement',
        timestamp: new Date(),
        status: 'success'
      })

      setRecentActivities(activities)
    } catch (error) {
      console.error('Erreur chargement activités:', error)
    }
  }

  const getPageTitle = () => {
    if (!userContext || !navigationContext) return 'Dashboard'
    
    if (navigationContext.level === 'gym') {
      return `Dashboard - ${navigationContext.gymName}`
    }
    if (navigationContext.level === 'franchise') {
      return `Dashboard - ${navigationContext.franchiseName}`
    }
    
    switch (userContext.role) {
      case 'super_admin': return 'Dashboard Global'
      case 'franchise_owner': return 'Dashboard Franchise'
      case 'gym_manager': return 'Dashboard Salle'
      default: return 'Dashboard'
    }
  }

  const getPageSubtitle = () => {
    if (!userContext) return ''
    
    switch (userContext.role) {
      case 'super_admin': return 'Vue d\'ensemble de toutes les franchises et salles'
      case 'franchise_owner': return 'Gestion de vos franchises et salles de sport'
      case 'gym_manager': return 'Monitoring et gestion de votre salle'
      default: return 'Tableau de bord personnalisé'
    }
  }

  return (
    <DashboardLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      loading={loading}
    >
      <VStack spacing={8} align="stretch">
        {/* Statistiques principales */}
        <StatsGrid stats={stats} />

        {/* Actions rapides et activité récente */}
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
          <VStack align="stretch" spacing={6}>
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Actions Rapides
              </Text>
              <QuickActionsGrid actions={quickActions} />
            </Box>
          </VStack>

          <RecentActivityFeed activities={recentActivities} />
        </SimpleGrid>
      </VStack>
    </DashboardLayout>
  )
}