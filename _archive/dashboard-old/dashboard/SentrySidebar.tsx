/**
 * 🎯 SIDEBAR STYLE SENTRY
 * Sidebar contextuelle avec drill-down comme dans Sentry
 */

'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Icon,
  Collapse,
  useDisclosure,
  Avatar,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue
} from '@chakra-ui/react'
import {
  Building2,
  Dumbbell,
  AlertTriangle,
  Activity,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Clock,
  DollarSign,
  Shield,
  BarChart3
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SafeLink from '@/components/common/SafeLink'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface SidebarFranchise {
  id: string
  name: string
  gyms_count: number
  active_sessions: number
  issues_count: number
  status: 'healthy' | 'warning' | 'critical'
}

interface SidebarGym {
  id: string
  name: string
  franchise_id: string
  members_count: number
  active_sessions: number
  kiosk_status: 'online' | 'offline' | 'warning'
  last_activity: Date
}

interface Issue {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  gym_name?: string
  franchise_name?: string
  timestamp: Date
  resolved: boolean
}

interface LiveSession {
  id: string
  member_name: string
  gym_name: string
  duration_minutes: number
  ai_model: string
}

// ===========================================
// 🎨 COMPOSANTS
// ===========================================

interface SentrySidebarProps {
  currentPath: string
  userRole: 'super_admin' | 'franchise_owner' | 'gym_manager'
  userId: string
}

export default function SentrySidebar({ currentPath, userRole, userId }: SentrySidebarProps) {
  const [franchises, setFranchises] = useState<SidebarFranchise[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Disclosure pour sections collapsibles
  const { isOpen: franchisesOpen, onToggle: toggleFranchises } = useDisclosure({ defaultIsOpen: true })
  const { isOpen: issuesOpen, onToggle: toggleIssues } = useDisclosure({ defaultIsOpen: true })
  const { isOpen: sessionsOpen, onToggle: toggleSessions } = useDisclosure({ defaultIsOpen: true })

  useEffect(() => {
    loadSidebarData()
    
    // Refresh toutes les 30 secondes
    const interval = setInterval(loadSidebarData, 30000)
    return () => clearInterval(interval)
  }, [userRole, userId])

  const loadSidebarData = async () => {
    try {
      const supabase = getSupabaseSingleton()
      
      // 1. Charger franchises avec stats
      const { data: franchisesData } = await supabase
        .from('franchises')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      // 2. Charger gyms pour compter
      const { data: gymsData } = await supabase
        .from('gyms')
        .select('id, name, franchise_id')

      // 3. Charger sessions actives (DÉSACTIVÉ temporairement pour éviter les 400)
      // const { data: sessionsData } = await supabase
      //   .from('openai_realtime_sessions')
      //   .select(`
      //     id,
      //     session_id,
      //     member_id,
      //     gym_id,
      //     session_start
      //   `)
      //   .is('session_end', null)
      const sessionsData: any[] = [] // Données vides temporaires

      // 4. Charger membres pour les noms
      const { data: membersData } = await supabase
        .from('gym_members_v2')
        .select('id, first_name, last_name, gym_id')
        .eq('is_active', true)

      // Enrichir les données
      const enrichedFranchises: SidebarFranchise[] = (franchisesData || []).map(f => {
        const franchiseGyms = (gymsData || []).filter(g => g.franchise_id === f.id)
        const franchiseSessions = (sessionsData || []).filter(s => 
          franchiseGyms.some(g => g.id === s.gym_id)
        )
        
        return {
          id: f.id,
          name: f.name,
          gyms_count: franchiseGyms.length,
          active_sessions: franchiseSessions.length,
          issues_count: Math.floor(Math.random() * 3), // Simulé pour l'instant
          status: franchiseSessions.length > 5 ? 'warning' : 'healthy'
        }
      })

      // Enrichir sessions live
      const enrichedSessions: LiveSession[] = (sessionsData || []).slice(0, 8).map(s => {
        const member = membersData?.find(m => m.id === s.member_id)
        const gym = gymsData?.find(g => g.id === s.gym_id)
        
        return {
          id: s.id,
          member_name: member ? `${member.first_name} ${member.last_name}` : 'Membre inconnu',
          gym_name: gym?.name || 'Gym inconnue',
          duration_minutes: Math.floor((Date.now() - new Date(s.session_start).getTime()) / 60000),
          ai_model: 'GPT-4o-mini'
        }
      })

      // Générer issues simulées (à remplacer par vraies données)
      const simulatedIssues: Issue[] = [
        {
          id: '1',
          type: 'critical',
          title: 'Kiosk Offline',
          description: 'TEST KIOSK ne répond plus depuis 5min',
          gym_name: 'TEST KIOSK',
          franchise_name: 'Orange Bleue',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          resolved: false
        },
        {
          id: '2',
          type: 'warning',
          title: 'Coût IA Élevé',
          description: 'Coût horaire: €12.50 (seuil: €10)',
          gym_name: 'JARVIS Demo Gym',
          franchise_name: 'Orange Bleue',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          resolved: false
        },
        {
          id: '3',
          type: 'warning',
          title: 'DB Timeout',
          description: 'Requête gym_members_v2 lente (2.3s)',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          resolved: false
        }
      ]

      setFranchises(enrichedFranchises)
      setLiveSessions(enrichedSessions)
      setIssues(simulatedIssues)
    } catch (error) {
      console.error('Erreur chargement sidebar:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIssueIcon = (type: Issue['type']) => {
    switch (type) {
      case 'critical': return { icon: AlertTriangle, color: 'red.500' }
      case 'warning': return { icon: AlertTriangle, color: 'orange.500' }
      case 'info': return { icon: AlertTriangle, color: 'blue.500' }
    }
  }

  const getStatusColor = (status: SidebarFranchise['status']) => {
    switch (status) {
      case 'healthy': return 'green'
      case 'warning': return 'orange'
      case 'critical': return 'red'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? mins + 'm' : ''}`
  }

  if (loading) {
    return (
      <Box w="280px" h="100vh" bg={bgColor} borderRight="1px" borderColor={borderColor} p={4}>
        <Text>Chargement...</Text>
      </Box>
    )
  }

  return (
    <Box 
      w="280px" 
      h="100vh" 
      bg={bgColor} 
      borderRight="1px" 
      borderColor={borderColor}
      overflowY="auto"
      position="fixed"
      left={0}
      top={0}
      zIndex={1000}
    >
      <VStack spacing={0} align="stretch">
        
        {/* Header */}
        <Box p={4} borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={3}>
            <Avatar size="sm" name="JARVIS" bg="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="sm">JARVIS SaaS</Text>
              <Text fontSize="xs" color="gray.500">Super Admin</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Navigation principale */}
        <Box p={2}>
          <VStack spacing={1} align="stretch">
            <SafeLink href="/dashboard">
              <Button
                variant={currentPath === '/dashboard' ? 'solid' : 'ghost'}
                colorScheme={currentPath === '/dashboard' ? 'blue' : 'gray'}
                size="sm"
                justifyContent="flex-start"
                leftIcon={<BarChart3 size={16} />}
                w="full"
              >
                Dashboard
              </Button>
            </SafeLink>
          </VStack>
        </Box>

        <Divider />

        {/* Franchises Section */}
        <Box p={2}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFranchises}
            leftIcon={franchisesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            rightIcon={<Badge colorScheme="blue" size="sm">{franchises.length}</Badge>}
            justifyContent="space-between"
            w="full"
            fontWeight="semibold"
            color="gray.700"
          >
            <HStack spacing={2}>
              <Building2 size={16} />
              <Text>Franchises</Text>
            </HStack>
          </Button>
          
          <Collapse in={franchisesOpen}>
            <VStack spacing={1} align="stretch" mt={2} ml={2}>
              {franchises.map(franchise => (
                <SafeLink key={franchise.id} href={`/dashboard/franchises/${franchise.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    justifyContent="flex-start"
                    w="full"
                    py={2}
                    h="auto"
                  >
                    <VStack align="start" spacing={0} flex={1}>
                      <HStack spacing={2} w="full" justify="space-between">
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {franchise.name}
                        </Text>
                        <Badge 
                          colorScheme={getStatusColor(franchise.status)} 
                          size="xs"
                        >
                          {franchise.gyms_count}
                        </Badge>
                      </HStack>
                      <HStack spacing={3} fontSize="xs" color="gray.500">
                        <Text>{franchise.active_sessions} live</Text>
                        {franchise.issues_count > 0 && (
                          <Text color="orange.500">{franchise.issues_count} issues</Text>
                        )}
                      </HStack>
                    </VStack>
                  </Button>
                </SafeLink>
              ))}
            </VStack>
          </Collapse>
        </Box>

        <Divider />

        {/* Issues Section */}
        <Box p={2}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleIssues}
            leftIcon={issuesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            rightIcon={<Badge colorScheme="red" size="sm">{issues.filter(i => !i.resolved).length}</Badge>}
            justifyContent="space-between"
            w="full"
            fontWeight="semibold"
            color="gray.700"
          >
            <HStack spacing={2}>
              <AlertTriangle size={16} />
              <Text>Issues</Text>
            </HStack>
          </Button>
          
          <Collapse in={issuesOpen}>
            <VStack spacing={1} align="stretch" mt={2} ml={2}>
              {issues.filter(i => !i.resolved).slice(0, 5).map(issue => {
                const { icon: IssueIcon, color } = getIssueIcon(issue.type)
                return (
                  <SafeLink key={issue.id} href={`/dashboard/issues/${issue.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      justifyContent="flex-start"
                      w="full"
                      py={2}
                      h="auto"
                    >
                      <HStack spacing={2} w="full">
                        <Icon as={IssueIcon} color={color} size={12} />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {issue.title}
                          </Text>
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            {issue.gym_name || issue.description}
                          </Text>
                        </VStack>
                      </HStack>
                    </Button>
                  </SafeLink>
                )
              })}
              
              {issues.filter(i => !i.resolved).length > 5 && (
                <SafeLink href="/dashboard/issues">
                  <Button variant="ghost" size="xs" color="blue.500" w="full">
                    Voir tous les issues ({issues.filter(i => !i.resolved).length})
                  </Button>
                </SafeLink>
              )}
            </VStack>
          </Collapse>
        </Box>

        <Divider />

        {/* Live Sessions Section */}
        <Box p={2}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSessions}
            leftIcon={sessionsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            rightIcon={<Badge colorScheme="green" size="sm">{liveSessions.length}</Badge>}
            justifyContent="space-between"
            w="full"
            fontWeight="semibold"
            color="gray.700"
          >
            <HStack spacing={2}>
              <Activity size={16} />
              <Text>Live Sessions</Text>
            </HStack>
          </Button>
          
          <Collapse in={sessionsOpen}>
            <VStack spacing={1} align="stretch" mt={2} ml={2}>
              {liveSessions.slice(0, 6).map(session => (
                <SafeLink key={session.id} href={`/dashboard/sessions/${session.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    justifyContent="flex-start"
                    w="full"
                    py={2}
                    h="auto"
                  >
                    <HStack spacing={2} w="full">
                      <Box w={2} h={2} bg="green.400" borderRadius="full" />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {session.member_name}
                        </Text>
                        <HStack spacing={2} fontSize="xs" color="gray.500">
                          <Text>{session.gym_name}</Text>
                          <Text>•</Text>
                          <Text>{formatDuration(session.duration_minutes)}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Button>
                </SafeLink>
              ))}
              
              {liveSessions.length > 6 && (
                <SafeLink href="/dashboard/sessions/live">
                  <Button variant="ghost" size="xs" color="blue.500" w="full">
                    Voir toutes les sessions ({liveSessions.length})
                  </Button>
                </SafeLink>
              )}
            </VStack>
          </Collapse>
        </Box>

        <Divider />

        {/* Team & Settings */}
        <Box p={2}>
          <VStack spacing={1} align="stretch">
            <SafeLink href="/dashboard/team">
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                leftIcon={<Users size={16} />}
                w="full"
              >
                Team
              </Button>
            </SafeLink>
            
            <SafeLink href="/dashboard/settings">
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                leftIcon={<Settings size={16} />}
                w="full"
              >
                Settings
              </Button>
            </SafeLink>
          </VStack>
        </Box>

      </VStack>
    </Box>
  )
}
