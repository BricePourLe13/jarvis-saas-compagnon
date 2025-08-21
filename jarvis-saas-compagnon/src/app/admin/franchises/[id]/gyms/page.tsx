"use client"
import {
  SimpleGrid,
  VStack,
  HStack,
  Box,
  Text,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow
} from '@chakra-ui/react'
import { 
  Building2, 
  Plus, 
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClientWithConfig } from '../../../../../lib/supabase-admin'
import { UnifiedLayout } from '../../../../../components/unified/UnifiedLayout'
import { GymCard } from '../../../../../components/unified/GymCard'
import { PrimaryButton } from '../../../../../components/unified/PrimaryButton'
import { formatCurrency } from '../../../../../lib/currency'

interface Franchise {
  id: string
  name: string
  city: string
}

  interface Gym {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  status: 'online' | 'offline' | 'warning'
  kiosk_config: { is_provisioned?: boolean } | null
  // Métriques simulées
  activeUsers: number
    dailyCostUsd: number
  lastActivity: string
  photo?: string
}

interface FranchiseMetrics {
  totalSessions: number
  totalRevenue: number
  totalUsers: number
  avgSessionDuration: number
  costToday: number
  trends: {
    sessions: { value: number; positive: boolean }
    revenue: { value: number; positive: boolean }
    costs: { value: number; positive: boolean }
  }
}

export default function FranchiseGymsPage() {
  const router = useRouter()
  const params = useParams()
  const franchiseId = params.id as string
  
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [gyms, setGyms] = useState<Gym[]>([])
  const [metrics, setMetrics] = useState<FranchiseMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (franchiseId) {
      loadFranchiseData()
    }
  }, [franchiseId])

  const loadFranchiseData = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      
      // Log supprimé pour production
      
      // Charger franchise + ses salles
      const { data: franchiseData, error: franchiseError } = await supabase
        .from('franchises')
        .select(`
          id,
          name,
          city,
          gyms (
            id,
            name,
            address,
            city,
            postal_code,
            status,
            kiosk_config
          )
        `)
        .eq('id', franchiseId)
        .single()

      // Log supprimé pour production
      // Log supprimé pour production

      if (franchiseError) {
        // Log supprimé pour production
        throw franchiseError
      }

      // Préparer les IDs de salles
      const gymIds: string[] = (franchiseData.gyms || []).map((g: any) => g.id)

      // Récupérer les sessions du jour pour ces salles
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const [sessionsResp, heartbeatsResp, costsResp] = await Promise.all([
        supabase
          .from('openai_realtime_sessions')
          .select('session_id,gym_id,session_started_at,session_ended_at,total_cost_usd')
          .in('gym_id', gymIds)
          .gte('session_started_at', startOfDay.toISOString()),
        supabase
          .from('kiosk_heartbeats')
          .select('gym_id,last_heartbeat,status')
          .in('gym_id', gymIds),
        supabase
          .from('jarvis_session_costs')
          .select('gym_id,total_cost,timestamp')
          .in('gym_id', gymIds)
          .gte('timestamp', startOfDay.toISOString())
      ])

      if (sessionsResp.error) // Log supprimé pour production
      if (heartbeatsResp.error) // Log supprimé pour production

      const sessions = sessionsResp.data || []
      const heartbeats = heartbeatsResp.data || []
      const costs = costsResp.data || []

      // Indexer par gym
      const gymIdToSessions = new Map<string, typeof sessions>()
      sessions.forEach((s: any) => {
        const list = gymIdToSessions.get(s.gym_id) || []
        list.push(s)
        gymIdToSessions.set(s.gym_id, list)
      })
      // Agréger coûts live par gym
      const gymIdToCost = new Map<string, number>()
      costs.forEach((c: any) => {
        gymIdToCost.set(c.gym_id, (gymIdToCost.get(c.gym_id) || 0) + (c.total_cost || 0))
      })

      const gymIdToHeartbeat = new Map<string, { last_heartbeat: string | null; status: string | null }>()
      heartbeats.forEach((h: any) => {
        gymIdToHeartbeat.set(h.gym_id, { last_heartbeat: h.last_heartbeat, status: h.status })
      })

      // Transformer les salles avec métriques BDD
      const now = Date.now()
      const ONLINE_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

      const transformedGyms: Gym[] = (franchiseData.gyms || []).map((gym: any) => {
        const gymSessions = gymIdToSessions.get(gym.id) || []
        const activeSessions = gymSessions.filter((s: any) => !s.session_ended_at).length
        // Coût du jour = coûts live agrégés
        const dailyCost = Math.round(((gymIdToCost.get(gym.id) || 0)) * 100) / 100

        const hb = gymIdToHeartbeat.get(gym.id)
        const lastSessionTs = gymSessions.length > 0 ?
          Math.max(...gymSessions.map((s: any) => new Date(s.session_ended_at || s.session_started_at).getTime())) :
          undefined
        const lastHeartbeatTs = hb?.last_heartbeat ? new Date(hb.last_heartbeat).getTime() : undefined
        const lastActivityTs = Math.max(lastSessionTs || 0, lastHeartbeatTs || 0)
        const minutesAgo = lastActivityTs ? Math.max(0, Math.round((now - lastActivityTs) / 60000)) : null

        const isProvisioned = !!gym.kiosk_config?.is_provisioned
        let status: Gym['status'] = 'offline'
        if (!isProvisioned) {
          status = 'warning'
        } else if (lastHeartbeatTs && now - lastHeartbeatTs < ONLINE_THRESHOLD_MS) {
          status = 'online'
        } else {
          status = 'offline'
        }

        return {
          ...gym,
          status,
          activeUsers: activeSessions, // renommage logique pour rester compatible avec GymCard
          dailyCostUsd: Math.round(dailyCost * 100) / 100,
          lastActivity: minutesAgo !== null ? `Il y a ${minutesAgo} min` : 'Jamais',
          photo: `https://images.unsplash.com/photo-${1571019613454 + parseInt(gym.id.slice(-2), 16)}?w=400&h=200&fit=crop&auto=format&q=80`
        }
      })

      // Calculer métriques franchise depuis BDD
      const totalSessions = transformedGyms.reduce((sum, g) => sum + g.activeUsers, 0)
      const costToday = transformedGyms.reduce((sum, g) => sum + g.dailyCostUsd, 0)

      // Durée moyenne des sessions terminées aujourd'hui
      const completed = sessions.filter((s: any) => s.session_ended_at)
      const avgSessionDuration = completed.length > 0
        ? Math.round(
            (completed.reduce((acc: number, s: any) => acc + (new Date(s.session_ended_at).getTime() - new Date(s.session_started_at).getTime()), 0) / completed.length) / 60000 * 10
          ) / 10
        : 0

      const franchiseMetrics: FranchiseMetrics = {
        totalSessions,
        totalRevenue: Math.round(costToday),
        totalUsers: totalSessions,
        avgSessionDuration,
        costToday: Math.round(costToday),
        trends: {
          sessions: { value: 0, positive: true },
          revenue: { value: 0, positive: true },
          costs: { value: 0, positive: false }
        }
      }

      setFranchise(franchiseData)
      setGyms(transformedGyms)
      setMetrics(franchiseMetrics)
    } catch (error) {
      // Log supprimé pour production
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <UnifiedLayout
        title="Chargement..."
        currentLevel="franchise"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Franchises", href: "/admin/franchises" }
        ]}
      >
        <VStack spacing={8} align="center" py={12}>
          <Spinner size="lg" color="black" />
          <Text color="gray.600">Chargement des salles...</Text>
        </VStack>
      </UnifiedLayout>
    )
  }

  if (!franchise) {
    return (
      <UnifiedLayout
        title="Franchise introuvable"
        currentLevel="franchise"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Franchises", href: "/admin/franchises" }
        ]}
      >
        <Text color="gray.600">Cette franchise n'existe pas.</Text>
      </UnifiedLayout>
    )
  }

  return (
    <UnifiedLayout
      title={franchise.name}
      currentLevel="franchise"
      franchiseId={franchiseId}
      franchiseName={franchise.name}
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Franchises", href: "/admin/franchises" },
        { label: franchise.name, href: `/admin/franchises/${franchiseId}/gyms` }
      ]}
      primaryAction={{
        label: "Ajouter une salle",
        onClick: () => router.push(`/admin/franchises/${franchiseId}/gyms/create`)
      }}
    >
      <VStack spacing={8} align="stretch">
        {/* MÉTRIQUES FRANCHISE */}
        {metrics && (
          <Box>
            <Text fontSize="lg" fontWeight="600" color="black" mb={4}>
              Performance de la franchise
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 5 }} gap={4}>
              <Box
                bg="white"
                p={4}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
              >
                <Stat>
                  <StatLabel fontSize="xs" color="gray.500">Sessions aujourd'hui</StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="700" color="black">
                    {metrics.totalSessions}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>
                    <StatArrow type={metrics.trends.sessions.positive ? 'increase' : 'decrease'} />
                    {metrics.trends.sessions.value}% vs hier
                  </StatHelpText>
                </Stat>
              </Box>

              <Box
                bg="white"
                p={4}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
              >
                <Stat>
                  <StatLabel fontSize="xs" color="gray.500">Revenus du jour</StatLabel>
                   <StatNumber fontSize="2xl" fontWeight="700" color="green.600">
                     {formatCurrency(metrics.totalRevenue, { currency: 'USD' })}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>
                    <StatArrow type={metrics.trends.revenue.positive ? 'increase' : 'decrease'} />
                    {metrics.trends.revenue.value}% vs hier
                  </StatHelpText>
                </Stat>
              </Box>

              <Box
                bg="white"
                p={4}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
              >
                <Stat>
                  <StatLabel fontSize="xs" color="gray.500">Coûts IA</StatLabel>
                   <StatNumber fontSize="2xl" fontWeight="700" color="orange.600">
                     {formatCurrency(metrics.costToday, { currency: 'USD' })}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>
                    <StatArrow type={metrics.trends.costs.positive ? 'increase' : 'decrease'} />
                    {Math.abs(metrics.trends.costs.value)}% vs hier
                  </StatHelpText>
                </Stat>
              </Box>

              <Box
                bg="white"
                p={4}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
              >
                <Stat>
                  <StatLabel fontSize="xs" color="gray.500">Utilisateurs actifs</StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="700" color="blue.600">
                    {metrics.totalUsers}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>
                    En temps réel
                  </StatHelpText>
                </Stat>
              </Box>

              <Box
                bg="white"
                p={4}
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
              >
                <Stat>
                  <StatLabel fontSize="xs" color="gray.500">Durée moy. session</StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="700" color="purple.600">
                    {metrics.avgSessionDuration}min
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>
                    Performance
                  </StatHelpText>
                </Stat>
              </Box>
            </SimpleGrid>
          </Box>
        )}

        {/* SALLES */}
        <Box>
          <HStack justify="space-between" align="center" mb={6}>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="600" color="black">
                Salles de sport ({gyms.length})
              </Text>
              <Text fontSize="sm" color="gray.500">
                {franchise.city}
              </Text>
            </VStack>
          </HStack>

          {gyms.length === 0 ? (
            <Box
              bg="white"
              borderRadius="12px"
              border="1px solid"
              borderColor="gray.100"
              p={12}
              textAlign="center"
            >
              <VStack spacing={4}>
                <Building2 size={32} color="#9CA3AF" />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="500" color="black">
                    Aucune salle
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Commencez par ajouter votre première salle de sport
                  </Text>
                </VStack>
                <PrimaryButton
                  leftIcon={<Plus size={16} />}
                  onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/create`)}
                >
                  Ajouter une salle
                </PrimaryButton>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {gyms.map((gym) => (
                <GymCard
                  key={gym.id}
                  id={gym.id}
                  name={gym.name}
                  address={`${gym.address}, ${gym.city}`}
                  photo={gym.photo}
                  activeUsers={gym.activeUsers}
                  status={gym.status}
                  lastActivity={gym.lastActivity}
                  dailyCostUsd={gym.dailyCostUsd}
                  onClick={() => router.push(`/admin/franchises/${franchiseId}/gyms/${gym.id}`)}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>
    </UnifiedLayout>
  )
}