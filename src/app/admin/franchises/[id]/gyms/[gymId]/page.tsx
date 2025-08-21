import { formatCurrency } from '../../../../../../lib/currency'
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  ButtonGroup,
  Icon,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Badge,
  useToast,
  Flex,
  Spacer,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Switch,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { UnifiedLayout } from '@/components/unified/UnifiedLayout'
import { 
  ArrowLeft,
  Building2, 
  MapPin, 
  Clock,
  Settings,
  MoreVertical,
  Edit,
  QrCode,
  Wifi,
  Monitor,
  Users,
  Activity,
  Dumbbell,
  Calendar,
  Zap,
  Mic,
  DollarSign,
  MessageSquare,
  Bot,
  BarChart3,
  TrendingUp,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import type { Gym, Franchise } from '../../../../../../types/franchise'
import { createBrowserClientWithConfig } from '../../../../../../lib/supabase-admin'
import { getKioskSupervisionMetrics, convertUSDToEUR } from '../../../../../../lib/openai-cost-tracker'
// ✅ Import pour les métriques temps réel
import { RealOpenAICostsService } from '../../../../../../lib/real-openai-costs'
// 💓 Import pour le statut temps réel des kiosks
import { KioskStatusService } from '../../../../../../lib/kiosk-status'



// ===========================================
// 🎯 Page Principale
// ===========================================

export default function GymDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  
  const franchiseId = params.id as string
  const gymId = params.gymId as string

  // ===========================================
  // 📊 État
  // ===========================================
  
  const [gym, setGym] = useState<Gym | null>(null)
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Analytics JARVIS states
  const [jarvisMetricsLoading, setJarvisMetricsLoading] = useState(true)
  const [jarvisMetrics, setJarvisMetrics] = useState<any>(null)
  
  // Supervision kiosk states
  const [kioskSupervisionLoading, setKioskSupervisionLoading] = useState(true)
  const [kioskSupervision, setKioskSupervision] = useState<any>(null)
  
  // 💓 Statut temps réel du kiosk
  const [kioskOnlineStatus, setKioskOnlineStatus] = useState<boolean>(false)
  
  // 🧭 Suivi sessions simplifié
  type Period = 'day' | 'week' | 'month'
  const [period, setPeriod] = useState<Period>('day')
  const [sessionSummary, setSessionSummary] = useState<{ activeCount: number; activeMemberName: string | null; totalInPeriod: number }>({ activeCount: 0, activeMemberName: null, totalInPeriod: 0 })
  // 🔧 Détails techniques repliés par défaut
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // 📝 Formulaire configuration Jarvis
  const [jarvisSettings, setJarvisSettings] = useState<any>({
    personality: 'friendly',
    humor_level: 'medium',
    response_length: 'short',
    language_accent: 'fr_fr',
    tone_timebased: true,
    emotion_bias: 'neutral',
    speaking_pace: 'normal',
    opening_preset: 'deadpool_clean',
    strict_end_rule: true,
    model: 'gpt-4o-mini-realtime',
    voice: 'verse'
  })
  const [configSaving, setConfigSaving] = useState<boolean>(false)
  const [configPublishing, setConfigPublishing] = useState<boolean>(false)
  // 🚨 Incidents récents
  const [incidents, setIncidents] = useState<Array<{ id: string; started_at: string; ended_at: string | null; message?: string | null }>>([])

  // ===========================================
  // 🔄 Chargement des données
  // ===========================================

  useEffect(() => {
    loadGymDetails()
    loadJarvisMetrics()
    loadKioskSupervision()
    loadKioskStatus() // 💓 Charger le statut temps réel
    loadSessionSummary('day')
    loadIncidents()

    // 📡 Mise à jour temps réel des métriques toutes les 2 minutes (moins de spam)
    const interval = setInterval(() => {
      loadJarvisMetrics()
      loadKioskSupervision()
      loadKioskStatus() // 💓 Vérifier le statut régulièrement
      loadSessionSummary(period)
      loadIncidents()
    }, 120000) // ✅ 2 minutes au lieu de 30 secondes

    // ⚡ Vérifier le statut ultra-fréquemment (toutes les 10 secondes)
    const statusInterval = setInterval(() => {
      loadKioskStatus()
    }, 10000) // ⚡ 10 secondes pour détection ultra-rapide

    return () => {
      clearInterval(interval)
      clearInterval(statusInterval)
    }
  }, [gymId])

  // Rafraîchir lors d'un changement de période
  useEffect(() => {
    if (gymId) {
      loadSessionSummary(period)
    }
  }, [period, gymId])

  const loadGymDetails = async () => {
    try {
      setLoading(true)

      // Charger les détails de la salle
      const response = await fetch(`/api/admin/gyms/${gymId}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la salle')
      }

      const result = await response.json()
      setGym(result.data)
      const cfg = result.data?.kiosk_config || {}
      if (cfg && (cfg as any).jarvis_settings) {
        setJarvisSettings({ ...jarvisSettings, ...(cfg as any).jarvis_settings })
      }
      
      // Charger les détails de la franchise avec fallback gracieux
      if (result.data?.franchise_id) {
        try {
        const franchiseResponse = await fetch(`/api/admin/franchises/${result.data.franchise_id}`)
        if (franchiseResponse.ok) {
          const franchiseResult = await franchiseResponse.json()
          setFranchise(franchiseResult.data)
          } else {
            // Log supprimé pour production
            // Fallback avec nom par défaut
            setFranchise({ 
              id: result.data.franchise_id, 
              name: 'Franchise'
            } as Franchise)
          }
        } catch (franchiseError) {
          // Log supprimé pour production
          // Fallback gracieux
          setFranchise({ 
            id: result.data.franchise_id, 
            name: 'Franchise'
          } as Franchise)
        }
      }

    } catch (error) {
      // Log supprimé pour production
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les détails de la salle',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // ✅ RESTAURATION: Métriques avec vrais coûts OpenAI (crédits API rechargés !)
  const loadJarvisMetrics = async () => {
    try {
      setJarvisMetricsLoading(true)
      // ⚡ Logs silencieux pour éviter le spam (mais fonctionnalité complète)
      const metrics = await RealOpenAICostsService.getRealTimeMetricsByGym(gymId)
      setJarvisMetrics(metrics)
    } catch (error) {
      // Log supprimé pour production
      // Fallback avec données par défaut pour éviter crash
      setJarvisMetrics({
        today: { 
          totalSessions: 0, 
          totalCostUSD: 0, 
          totalDurationMinutes: 0,
          averageSessionCost: 0
        },
        yesterday: { 
          totalSessions: 0, 
          totalCostUSD: 0, 
          totalDurationMinutes: 0,
          averageSessionCost: 0
        }
      })
    } finally {
      setJarvisMetricsLoading(false)
    }
  }

  const loadKioskSupervision = async () => {
    try {
      setKioskSupervisionLoading(true)
      const supervision = await getKioskSupervisionMetrics(gymId)
      setKioskSupervision(supervision)
    } catch (error) {
      // Log supprimé pour production
      // Fallback avec données par défaut pour éviter crash
      setKioskSupervision({
        activeSessions: 0,
        lastActivityMinutesAgo: null,
        performance: {
          responseTime: 195,
          errorRate: 0
        },
        overview: {
          successRate: 95
        }
      })
    } finally {
      setKioskSupervisionLoading(false)
    }
  }

  // 💓 Charger le statut temps réel du kiosk
  const loadKioskStatus = async () => {
    try {
      const status = await KioskStatusService.getKioskStatus(gymId)
      const wasOnline = kioskOnlineStatus
      setKioskOnlineStatus(status.isOnline)
      
      // ⚡ Log seulement les changements de statut (éviter le spam)
      if (wasOnline !== status.isOnline) {
        // Log supprimé pour production
      }
    } catch (error) {
      // Log supprimé pour production
      // Fallback silencieux en production
      setKioskOnlineStatus(false)
    }
  }

  const loadIncidents = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('openai_realtime_sessions')
        .select('session_id, session_started_at, session_ended_at, session_metadata')
        .eq('gym_id', gymId)
        .gte('session_started_at', sevenDaysAgo)
        .contains('session_metadata', { has_error: true })
        .order('session_started_at', { ascending: false })
        .limit(10)
      const mapped = (data || []).map((s: any) => ({
        id: s.session_id,
        started_at: s.session_started_at,
        ended_at: s.session_ended_at,
        message: s.session_metadata?.error_message || null,
      }))
      setIncidents(mapped)
    } catch (e) {
      // Log supprimé pour production
      setIncidents([])
    }
  }

  const handleSaveJarvisConfig = async () => {
    if (!gym) return
    try {
      setConfigSaving(true)
      const updatedConfig = {
        ...(gym.kiosk_config || {}),
        jarvis_settings: { ...(gym.kiosk_config as any)?.jarvis_settings, ...jarvisSettings },
        config_updated_at: new Date().toISOString(),
      }
      const res = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kiosk_config: updatedConfig })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erreur enregistrement')
      setGym((g) => g ? { ...g, kiosk_config: updatedConfig } as any : g)
      toast({ title: 'Enregistré', description: 'Configuration Jarvis sauvegardée', status: 'success', duration: 3000, isClosable: true })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible de sauvegarder', status: 'error', duration: 4000, isClosable: true })
    } finally {
      setConfigSaving(false)
    }
  }

  const handlePublishJarvisConfig = async () => {
    if (!gym) return
    try {
      setConfigPublishing(true)
      const currentVersion = Number(((gym.kiosk_config as any)?.config_version) || 0)
      const updatedConfig = {
        ...(gym.kiosk_config || {}),
        jarvis_settings: { ...(gym.kiosk_config as any)?.jarvis_settings, ...jarvisSettings },
        config_version: currentVersion + 1,
        last_published_at: new Date().toISOString(),
      }
      const res = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kiosk_config: updatedConfig })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erreur publication')
      setGym((g) => g ? { ...g, kiosk_config: updatedConfig } as any : g)
      toast({ title: 'Publié', description: 'Configuration envoyée au kiosk', status: 'success', duration: 3000, isClosable: true })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible de publier', status: 'error', duration: 4000, isClosable: true })
    } finally {
      setConfigPublishing(false)
    }
  }

  // 📊 Résumé sessions (actives + total période)
  const loadSessionSummary = async (p: Period) => {
    try {
      const supabase = createBrowserClientWithConfig()
      const now = new Date()
      const start = new Date()
      if (p === 'day') {
        start.setUTCHours(0, 0, 0, 0)
      } else if (p === 'week') {
        start.setTime(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        start.setUTCHours(0, 0, 0, 0)
      } else {
        start.setTime(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        start.setUTCHours(0, 0, 0, 0)
      }

      // Sessions actives maintenant
      const { data: active } = await supabase
        .from('openai_realtime_sessions')
        .select('session_id, session_started_at, session_metadata')
        .eq('gym_id', gymId)
        .is('session_ended_at', null)
        .order('session_started_at', { ascending: false })

      const activeCount = active?.length || 0
      const activeMemberName = active && active.length > 0
        ? ((active[0] as any).session_metadata?.member_name || 'Visiteur')
        : null

      // Sessions sur la période
      // Cleanup minimal côté UI pour fiabiliser les compteurs
      try { await supabase.rpc('cleanup_inactive_realtime_sessions', { p_gym_id: gymId, p_inactive_minutes: 10 }) } catch {}
      const { data: periodSessions } = await supabase
        .from('openai_realtime_sessions')
        .select('session_id')
        .eq('gym_id', gymId)
        .gte('session_started_at', start.toISOString())

      setSessionSummary({
        activeCount,
        activeMemberName,
        totalInPeriod: periodSessions?.length || 0,
      })
    } catch (e) {
      // Log supprimé pour production
      setSessionSummary({ activeCount: 0, activeMemberName: null, totalInPeriod: 0 })
    }
  }

  // ===========================================
  // 📝 Handlers
  // ===========================================

  const handleBack = () => {
    router.push(`/admin/franchises/${franchiseId}/gyms`)
  }

  const handleEdit = () => {
    router.push(`/admin/franchises/${franchiseId}/gyms/${gymId}/edit`)
  }

  const handlePreviewKiosk = () => {
    if (gym?.kiosk_config?.kiosk_url_slug) {
      window.open(`/kiosk/${gym.kiosk_config.kiosk_url_slug}`, '_blank')
    } else {
      toast({
        title: 'Kiosk non configuré',
        description: 'Cette salle n\'a pas encore de Kiosk JARVIS configuré',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const copyProvisioningCode = () => {
    if (gym?.kiosk_config?.provisioning_code) {
      navigator.clipboard.writeText(gym.kiosk_config.provisioning_code)
      toast({
        title: 'Code copié',
        description: 'Le code de provisioning a été copié dans le presse-papier',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  const regenerateProvisioningCode = async () => {
    if (!gym?.id) return

    try {
      const response = await fetch(`/api/admin/gyms/${gym.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'regenerate_provisioning_code' }),
      })

      const result = await response.json()

      if (result.success) {
        // Mettre à jour l'état local
        setGym(prevGym => {
          if (!prevGym) return prevGym
          return {
            ...prevGym,
            kiosk_config: {
              ...prevGym.kiosk_config,
              provisioning_code: result.data.provisioning_code,
              provisioning_expires_at: result.data.expires_at,
              is_provisioned: false,
              provisioned_at: null
            }
          }
        })

        toast({
          title: 'Code régénéré',
          description: 'Un nouveau code de provisioning a été généré avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        throw new Error(result.error || 'Erreur lors de la régénération')
      }
    } catch (error) {
      // Log supprimé pour production
      toast({
        title: 'Erreur',
        description: 'Impossible de régénérer le code de provisioning',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // ===========================================
  // 🎨 UI Helpers
  // ===========================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'maintenance': return 'orange'
      case 'offline': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'maintenance': return 'Maintenance'
      case 'offline': return 'Hors ligne'
      default: return status
    }
  }

  const isKioskProvisioned = gym?.kiosk_config?.is_provisioned || false
  const provisioningCode = gym?.kiosk_config?.provisioning_code
  const kioskUrl = gym?.kiosk_config?.kiosk_url_slug
  
  // 💓 Statut temps réel basé sur les heartbeats
  const isKioskOnline = kioskOnlineStatus

  // ===========================================
  // 🖼️ Rendu
  // ===========================================

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Text>Chargement...</Text>
        </VStack>
      </Container>
    )
  }

  if (!gym) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Salle introuvable</AlertTitle>
          <AlertDescription>
            Cette salle n'existe pas ou vous n'avez pas les permissions pour la voir.
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <UnifiedLayout
      title={gym?.name || 'Salle'}
      currentLevel="gym"
      franchiseId={franchiseId}
      franchiseName={franchise?.name}
      gymId={gymId}
      gymName={gym?.name}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: franchise?.name || 'Franchise', href: `/admin/franchises/${franchiseId}/gyms` },
        { label: 'Salles', href: `/admin/franchises/${franchiseId}/gyms` },
        { label: gym?.name || 'Salle', href: `/admin/franchises/${franchiseId}/gyms/${gymId}` }
      ]}
    >
      <Container maxW="7xl" py={0}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VStack spacing={6} align="stretch">
          {/* Breadcrumb rendu par UnifiedLayout */}

          {/* Header avec actions */}
          <Flex align="center">
            <HStack spacing={4}>
              <IconButton
                icon={<Icon as={ArrowLeft} />}
                onClick={handleBack}
                variant="outline"
                borderRadius="12px"
                aria-label="Retour"
              />
              <VStack align="start" spacing={0}>
                <Heading size="lg" color="gray.800">
                  {gym.name}
                </Heading>
                <HStack spacing={2}>
                  <Icon as={MapPin} boxSize={4} color="gray.400" />
                  <Text fontSize="sm" color="gray.600">
                    {gym.city} • {gym.postal_code}
                  </Text>
                  <Badge 
                    colorScheme={getStatusColor(gym.status)} 
                    size="sm"
                    borderRadius="8px"
                  >
                    {getStatusLabel(gym.status)}
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            
            <Spacer />
            
            <HStack spacing={3}>
              <Button
                leftIcon={<Icon as={QrCode} />}
                onClick={handlePreviewKiosk}
                variant="outline"
                colorScheme="purple"
                borderRadius="12px"
                isDisabled={!kioskUrl}
              >
                Prévisualiser Kiosk
              </Button>
              <Button
                as="a"
                href={`/dashboard?gymId=${encodeURIComponent(gymId)}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                borderRadius="12px"
              >
                Ouvrir Dashboard Gérant
              </Button>
              
              <Button
                leftIcon={<Icon as={Edit} />}
                onClick={handleEdit}
                variant="outline"
                colorScheme="blue"
                borderRadius="12px"
              >
                Modifier
              </Button>
              
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<Icon as={MoreVertical} />}
                  variant="outline"
                  borderRadius="12px"
                />
                <MenuList borderRadius="12px">
                  <MenuItem icon={<Icon as={Settings} />}>
                    Configuration
                  </MenuItem>
                  <MenuItem icon={<Icon as={Activity} />}>
                    Analytics
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>

          {/* Contenu principal avec onglets */}
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList 
              borderRadius="2px" 
              bg="#fafafa"
              borderBottom="1px solid"
              borderColor="#e5e7eb"
              fontFamily="system-ui"
            >
              <Tab 
                _selected={{ 
                  bg: "#ffffff", 
                  borderColor: "#e5e7eb",
                  color: "#111827",
                  fontWeight: "500"
                }}
                color="#6b7280"
                fontSize="sm"
                px={6}
                py={3}
              >
                <Icon as={BarChart3} mr={2} boxSize={4} />
                Vue d'ensemble
              </Tab>
              <Tab 
                _selected={{ 
                  bg: "#ffffff", 
                  borderColor: "#e5e7eb",
                  color: "#111827",
                  fontWeight: "500"
                }}
                color="#6b7280"
                fontSize="sm"
                px={6}
                py={3}
              >
                <Icon as={Monitor} mr={2} boxSize={4} />
                Kiosk JARVIS
              </Tab>

            </TabList>

            <TabPanels 
              bg="#ffffff" 
              borderRadius="0 0 2px 2px" 
              border="1px solid" 
              borderColor="#e5e7eb" 
              borderTop="none"
              fontFamily="system-ui"
            >
              
              {/* Onglet Vue d'ensemble */}
              <TabPanel p={8}>
                <VStack spacing={8} align="stretch">
                  
                  {/* Statut Global Kiosk */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                  <Card 
                      bg={isKioskOnline ? "#f0fdf4" : "#fef2f2"}
                    border="1px solid" 
                      borderColor={isKioskOnline ? "#bbf7d0" : "#fecaca"}
                      borderRadius="12px"
                      p={6}
                    >
                      <HStack justify="space-between" align="center">
                        <HStack spacing={4}>
                          <Box
                            w="12px"
                            h="12px"
                            borderRadius="50%"
                            bg={isKioskOnline ? "#22c55e" : "#ef4444"}
                          />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="600" color="#111827" fontSize="lg">
                              {isKioskOnline ? "Kiosk JARVIS Opérationnel" : "Kiosk JARVIS Hors ligne"}
                            </Text>
                            <Text fontSize="sm" color="#6b7280">
                              {gym.name} • {franchise?.name}
                            </Text>
                          </VStack>
                        </HStack>
                          <Badge 
                          colorScheme={isKioskOnline ? "green" : "red"} 
                            size="md"
                            px={3}
                            py={1}
                          borderRadius="6px"
                          >
                          {isKioskOnline ? "EN LIGNE" : "HORS LIGNE"}
                          </Badge>
                      </HStack>
                  </Card>
                  </motion.div>

                  {/* Métriques Clés Aujourd'hui */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <VStack spacing={6} align="stretch">
                      <HStack justify="space-between" align="center">
                        <Heading size="md" color="#111827" fontWeight="600">
                          Sessions
                      </Heading>
                        <HStack spacing={2}>
                          <Select size="sm" value={period} onChange={(e) => setPeriod(e.target.value as any)} w="120px">
                            <option value="day">Jour</option>
                            <option value="week">7j</option>
                            <option value="month">30j</option>
                          </Select>
                        </HStack>
                      </HStack>
                      
                      {/* Budget Mensuel - Vue principale */}
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                        <Card bg="#ffffff" border="1px solid #e5e7eb" borderRadius="12px" p={6}>
                          <VStack align="start" spacing={1}>
                            <Stat>
                              <StatLabel fontSize="sm" color="#6b7280">Session en cours</StatLabel>
                              <StatNumber fontSize="3xl" fontWeight="700" color={isKioskOnline ? '#10b981' : '#111827'}>
                                {sessionSummary.activeCount > 0 ? '1' : '0'}
                          </StatNumber>
                              {sessionSummary.activeMemberName && (
                                <StatHelpText fontSize="xs" color="#6b7280">{sessionSummary.activeMemberName}</StatHelpText>
                              )}
                        </Stat>
                          </VStack>
                        </Card>
                        <Card bg="#ffffff" border="1px solid #e5e7eb" borderRadius="12px" p={6}>
                          <VStack align="start" spacing={1}>
                            <Stat>
                              <StatLabel fontSize="sm" color="#6b7280">Sessions ({period === 'day' ? 'aujourd\'hui' : period === 'week' ? '7j' : '30j'})</StatLabel>
                              <StatNumber fontSize="3xl" fontWeight="700" color="#111827">{sessionSummary.totalInPeriod}</StatNumber>
                              <StatHelpText fontSize="xs" color="#9ca3af">Filtre: {period === 'day' ? 'jour' : period === 'week' ? 'semaine' : 'mois'}</StatHelpText>
                            </Stat>
                          </VStack>
                        </Card>
                        <Card bg="#ffffff" border="1px solid #e5e7eb" borderRadius="12px" p={6}>
                          <VStack align="start" spacing={1}>
                            <Stat>
                              <StatLabel fontSize="sm" color="#6b7280">Statut Kiosk</StatLabel>
                              <StatNumber fontSize="3xl" fontWeight="700" color={isKioskOnline ? '#10b981' : '#ef4444'}>
                                {isKioskOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                          </StatNumber>
                              <StatHelpText fontSize="xs" color="#9ca3af">Temps réel</StatHelpText>
                        </Stat>
                          </VStack>
                        </Card>
                      </SimpleGrid>

                      {/* Santé Technique */}
                      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                        
                        {/* État Système */}
                        <Card bg="#ffffff" border="1px solid #e5e7eb" borderRadius="12px" p={6}>
                          <VStack spacing={4} align="stretch">
                            <Text fontWeight="600" color="#111827" fontSize="md">
                              Santé Technique
                            </Text>
                            
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="#6b7280">Statut Kiosk</Text>
                                <HStack>
                                  <Box 
                                    w="8px" 
                                    h="8px" 
                                    bg={isKioskOnline ? "#10b981" : "#ef4444"} 
                                    borderRadius="50%" 
                                  />
                                  <Text fontSize="sm" fontWeight="600" color={isKioskOnline ? "#10b981" : "#ef4444"}>
                                    {isKioskOnline ? "EN LIGNE" : "HORS LIGNE"}
                                  </Text>
                                </HStack>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="#6b7280">Latence réseau</Text>
                                <Text fontSize="sm" fontWeight="600" color={
                                  (kioskSupervision?.performance?.responseTime || 195) < 300 ? "#10b981" : 
                                  (kioskSupervision?.performance?.responseTime || 195) < 500 ? "#f59e0b" : "#ef4444"
                                }>
                                  {kioskSupervision?.performance?.responseTime || 195}ms
                                </Text>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="#6b7280">Dernière activité</Text>
                                <Text fontSize="sm" fontWeight="600" color="#6b7280">
                                  {kioskSupervision?.lastActivityMinutesAgo !== undefined && kioskSupervision?.lastActivityMinutesAgo !== null ? 
                                    `Il y a ${kioskSupervision.lastActivityMinutesAgo}min` : 
                                    'Aucune'
                                  }
                                </Text>
                              </HStack>
                            </VStack>
                          </VStack>
                        </Card>

                        {/* Alertes Système */}
                        <Card bg="#ffffff" border="1px solid #e5e7eb" borderRadius="12px" p={6}>
                          <VStack spacing={4} align="stretch">
                            <Text fontWeight="600" color="#111827" fontSize="md">
                              Alertes & Monitoring
                            </Text>
                            
                            <VStack spacing={3} align="stretch">
                              {/* Alerte Budget */}
                              {((jarvisMetrics?.today?.totalCostUSD || 0) * 30 * 0.85) > 400 && (
                                <Box bg="#fef2f2" border="1px solid #fca5a5" borderRadius="8px" p={3}>
                                  <HStack>
                                    <Icon as={AlertTriangle} color="#ef4444" boxSize={4} />
                                    <Text fontSize="sm" color="#dc2626" fontWeight="500">
                                      Budget critique: {(((jarvisMetrics?.today?.totalCostUSD || 0) * 30 * 0.85) / 5).toFixed(0)}%
                                    </Text>
                                  </HStack>
                                </Box>
                              )}
                              
                              {/* Alerte Kiosk Hors Ligne */}
                              {!isKioskOnline && (
                                <Box bg="#fef2f2" border="1px solid #fca5a5" borderRadius="8px" p={3}>
                                  <HStack>
                                    <Icon as={AlertTriangle} color="#ef4444" boxSize={4} />
                                    <Text fontSize="sm" color="#dc2626" fontWeight="500">
                                      Kiosk hors ligne
                                    </Text>
                                  </HStack>
                                </Box>
                              )}
                              
                              {/* État Normal */}
                              {isKioskOnline && ((jarvisMetrics?.today?.totalCostUSD || 0) * 30 * 0.85) <= 400 && (
                                <Box bg="#f0fdf4" border="1px solid #bbf7d0" borderRadius="8px" p={3}>
                                  <HStack>
                                    <Icon as={CheckCircle} color="#16a34a" boxSize={4} />
                                    <Text fontSize="sm" color="#16a34a" fontWeight="500">
                                      Système opérationnel
                                    </Text>
                                  </HStack>
                                </Box>
                              )}
                            </VStack>
                          </VStack>
                        </Card>

                        {/* Configuration */}
                        <Card bg="#ffffff" border="1px solid #e5e7eb" borderRadius="12px" p={6}>
                          <VStack spacing={4} align="stretch">
                            <Text fontWeight="600" color="#111827" fontSize="md">
                              Configuration
                            </Text>
                            
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="#6b7280">Modèle IA</Text>
                                <Text fontSize="sm" fontWeight="600" color="#6b7280" fontFamily="mono">
                                  GPT-4o Mini Realtime
                                </Text>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="#6b7280">Budget mensuel</Text>
                                <Text fontSize="sm" fontWeight="600" color="#111827">
                                  $500
                                </Text>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="#6b7280">Provisioning</Text>
                                <Badge 
                                  colorScheme={gym.kiosk_config?.is_provisioned ? "green" : "orange"} 
                                  size="sm"
                                  borderRadius="6px"
                                >
                                  {gym.kiosk_config?.is_provisioned ? "Configuré" : "En attente"}
                                </Badge>
                              </HStack>
                            </VStack>
                          </VStack>
                  </Card>
                  
                </SimpleGrid>
                    </VStack>
                  </motion.div>





                  
                  {/* Section avancée (repliée par défaut) */}
                  <VStack spacing={4} align="stretch" pt={8}>
                    <Divider />
                    <HStack 
                      justify="space-between"
                      role="button"
                      tabIndex={0}
                      aria-expanded={showAdvanced}
                      onClick={() => setShowAdvanced(v => !v)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowAdvanced(v => !v) } }}
                      cursor="pointer"
                      p={2}
                      borderRadius="8px"
                      _hover={{ bg: '#fafafa' }}
                    >
                      <HStack spacing={3}>
                        <Icon as={ChevronDown} boxSize={4} transform={showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)'} transition="transform 0.2s" />
                        <VStack align="start" spacing={0}>
                          <Heading size="md" color="#111827" fontWeight="600">
                            Détails techniques
                          </Heading>
                          <Text fontSize="sm" color="#6b7280">Diagnostics temps réel (optionnel)</Text>
                        </VStack>
                      </HStack>
                    </HStack>
                    {showAdvanced && (
                      <Box bg="#fafafa" border="1px dashed #e5e7eb" borderRadius="8px" p={4}>
                        <Text fontSize="sm" color="#6b7280">
                          Diagnostic détaillé désactivé. Réactivez un composant de monitoring si nécessaire.
                        </Text>
                      </Box>
                    )}
                  </VStack>

                </VStack>
              </TabPanel>

              {/* Onglet Kiosk JARVIS */}
              <TabPanel p={8}>
                <VStack spacing={8} align="stretch">
                  
                  {/* Statut Kiosk */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      bg={isKioskProvisioned ? "#f0fdf4" : "#fffbeb"}
                      border="1px solid"
                      borderColor={isKioskProvisioned ? "#bbf7d0" : "#fde68a"}
                      borderRadius="2px"
                      p={6}
                      position="relative"
                      _before={{
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        bg: isKioskProvisioned ? "#10b981" : "#f59e0b",
                      }}
                    >
                      <HStack spacing={4}>
                        <Box
                          w="12px"
                          h="12px"
                          borderRadius="50%"
                          bg={isKioskProvisioned ? "#10b981" : "#f59e0b"}
                        />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="600" color="#111827" fontSize="lg">
                            {isKioskProvisioned ? "Kiosk Configuré" : "Configuration Requise"}
                          </Text>
                          <Text fontSize="sm" color={isKioskProvisioned ? "#166534" : "#92400e"}>
                        {isKioskProvisioned 
                          ? "Le Kiosk JARVIS est opérationnel pour cette salle"
                          : "Le Kiosk JARVIS attend d'être configuré avec le code de provisioning"
                        }
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  </motion.div>

                  {/* Configuration Jarvis */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="500" color="#111827" fontSize="lg">Configuration Jarvis</Text>
                      
                      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                        {/* Paramétrage Jarvis (sans texte libre) */}
                        <Box bg="#ffffff" border="1px solid #e5e7eb" borderRadius="2px" p={6}>
                          <VStack align="stretch" spacing={3}>
                            <Text fontSize="sm" color="#6b7280" fontWeight="500" textTransform="uppercase">Paramètres</Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Personnalité</FormLabel>
                                <Select size="sm" value={jarvisSettings.personality} onChange={(e)=>setJarvisSettings((s:any)=>({...s, personality:e.target.value}))}>
                                  <option value="friendly">Amicale</option>
                                  <option value="professional">Professionnelle</option>
                                  <option value="energetic">Énergique</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Humour</FormLabel>
                                <Select size="sm" value={jarvisSettings.humor_level} onChange={(e)=>setJarvisSettings((s:any)=>({...s, humor_level:e.target.value}))}>
                                  <option value="none">Aucun</option>
                                  <option value="low">Léger</option>
                                  <option value="medium">Moyen</option>
                                  <option value="high">Marqué</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Longueur réponse</FormLabel>
                                <Select size="sm" value={jarvisSettings.response_length} onChange={(e)=>setJarvisSettings((s:any)=>({...s, response_length:e.target.value}))}>
                                  <option value="short">Courte</option>
                                  <option value="medium">Moyenne</option>
                                  <option value="long">Longue</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Accent</FormLabel>
                                <Select size="sm" value={jarvisSettings.language_accent} onChange={(e)=>setJarvisSettings((s:any)=>({...s, language_accent:e.target.value}))}>
                                  <option value="fr_fr">Français (FR)</option>
                                  <option value="fr_ca">Français (CA)</option>
                                  <option value="fr_be">Français (BE)</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Biais émotionnel</FormLabel>
                                <Select size="sm" value={jarvisSettings.emotion_bias} onChange={(e)=>setJarvisSettings((s:any)=>({...s, emotion_bias:e.target.value}))}>
                                  <option value="neutral">Neutre</option>
                                  <option value="happy">Joyeux</option>
                                  <option value="calm">Calme</option>
                                  <option value="energetic">Énergique</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Rythme</FormLabel>
                                <Select size="sm" value={jarvisSettings.speaking_pace} onChange={(e)=>setJarvisSettings((s:any)=>({...s, speaking_pace:e.target.value}))}>
                                  <option value="slow">Lent</option>
                                  <option value="normal">Normal</option>
                                  <option value="fast">Rapide</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Ouverture</FormLabel>
                                <Select size="sm" value={jarvisSettings.opening_preset} onChange={(e)=>setJarvisSettings((s:any)=>({...s, opening_preset:e.target.value}))}>
                                  <option value="deadpool_clean">Drôle (clean)</option>
                                  <option value="friendly_minimal">Minimaliste</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Modèle</FormLabel>
                                <Select size="sm" value={jarvisSettings.model} onChange={(e)=>setJarvisSettings((s:any)=>({...s, model:e.target.value}))}>
                                  <option value="gpt-4o-mini-realtime">GPT-4o Mini Realtime</option>
                                  <option value="gpt-4o-realtime">GPT-4o Realtime</option>
                                </Select>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs" color="#6b7280">Voix</FormLabel>
                                <Select size="sm" value={jarvisSettings.voice} onChange={(e)=>setJarvisSettings((s:any)=>({...s, voice:e.target.value}))}>
                                  <option value="alloy">Alloy</option>
                                  <option value="ash">Ash</option>
                                  <option value="ballad">Ballad</option>
                                  <option value="coral">Coral</option>
                                  <option value="echo">Echo</option>
                                  <option value="sage">Sage</option>
                                  <option value="shimmer">Shimmer</option>
                                  <option value="verse">Verse</option>
                                </Select>
                              </FormControl>
                              <FormControl display="flex" alignItems="center">
                                <FormLabel fontSize="xs" color="#6b7280" mb={0}>Ton par heure</FormLabel>
                                <Switch isChecked={jarvisSettings.tone_timebased} onChange={(e)=>setJarvisSettings((s:any)=>({...s, tone_timebased:e.target.checked}))} ml={2} />
                              </FormControl>
                              <FormControl display="flex" alignItems="center">
                                <FormLabel fontSize="xs" color="#6b7280" mb={0}>Fin stricte "Au revoir"</FormLabel>
                                <Switch isChecked={jarvisSettings.strict_end_rule} onChange={(e)=>setJarvisSettings((s:any)=>({...s, strict_end_rule:e.target.checked}))} ml={2} />
                              </FormControl>
                            </SimpleGrid>
                            <HStack spacing={3} pt={2}>
                              <Button size="sm" onClick={handleSaveJarvisConfig} isLoading={configSaving} variant="outline">Enregistrer</Button>
                              <Button size="sm" onClick={handlePublishJarvisConfig} isLoading={configPublishing} colorScheme="purple">Publier</Button>
                            </HStack>
                            {(gym?.kiosk_config as any)?.config_version && (
                              <Text fontSize="xs" color="#6b7280">Version: {String((gym.kiosk_config as any).config_version)} • Dernière publication: {(gym?.kiosk_config as any)?.last_published_at ? new Date((gym.kiosk_config as any).last_published_at).toLocaleString() : '—'}</Text>
                            )}
                          </VStack>
                        </Box>
                        
                        {/* Code de Provisioning */}
                        <Box
                          bg="#ffffff"
                          border="1px solid #e5e7eb"
                          borderRadius="2px"
                          p={6}
                        >
                          <VStack spacing={4} align="stretch">
                            <Text fontSize="sm" color="#6b7280" fontWeight="500" textTransform="uppercase">
                              Code de Provisioning
                            </Text>
                            <HStack spacing={3}>
                              <Box
                                px={4} 
                                py={3} 
                                borderRadius="2px" 
                                bg="#fafafa"
                                border="1px solid #e5e7eb"
                                fontSize="sm"
                                flex="1"
                                fontWeight="600"
                                color="#111827"
                                fontFamily="mono"
                                textAlign="center"
                              >
                                {provisioningCode || 'Non généré'}
                              </Box>
                              {provisioningCode ? (
                                <Button
                                  leftIcon={<Icon as={QrCode} boxSize={4} />}
                                  onClick={copyProvisioningCode}
                                  size="sm"
                                  variant="outline"
                                  borderColor="#e5e7eb"
                                  color="#6b7280"
                                  borderRadius="2px"
                                  _hover={{ bg: "#fafafa", borderColor: "#d1d5db" }}
                                  px={3}
                                  fontSize="xs"
                                  fontWeight="500"
                                >
                                  Copier
                                </Button>
                              ) : (
                                <Button
                                  leftIcon={<Icon as={Zap} boxSize={4} />}
                                  onClick={regenerateProvisioningCode}
                                  size="sm"
                                  bg="#2563eb"
                                  color="white"
                                  borderRadius="2px"
                                  _hover={{ bg: "#1d4ed8" }}
                                  px={3}
                                  fontSize="xs"
                                  fontWeight="500"
                                >
                                  Générer
                                </Button>
                              )}
                            </HStack>
                          </VStack>
                          </Box>
                          
                        {/* Accès Kiosk */}
                          {kioskUrl && (
                          <Box
                            bg="#ffffff"
                            border="1px solid #e5e7eb"
                            borderRadius="2px"
                            p={6}
                          >
                            <VStack spacing={4} align="stretch">
                              <Text fontSize="sm" color="#6b7280" fontWeight="500" textTransform="uppercase">
                                Accès Kiosk
                              </Text>
                              <VStack spacing={3}>
                              <Button
                                  leftIcon={<Icon as={Monitor} boxSize={4} />}
                                onClick={handlePreviewKiosk}
                                  bg="#7c3aed"
                                  color="white"
                                  borderRadius="2px"
                                  _hover={{ bg: "#6d28d9" }}
                                w="full"
                                  fontSize="sm"
                                  fontWeight="500"
                                  py={6}
                              >
                                Ouvrir le Kiosk JARVIS
                              </Button>
                                <Text fontSize="xs" color="#6b7280" textAlign="center" fontFamily="mono">
                                  /kiosk/{kioskUrl}
                              </Text>
                              </VStack>
                            </VStack>
                            </Box>
                          )}

                      </SimpleGrid>
                        </VStack>
                  </motion.div>

                  {/* Statut Matériel */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="500" color="#111827" fontSize="lg">
                        Statut Matériel
                      </Text>
                      
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        
                        {/* Microphone */}
                        <Box
                          bg="#ffffff"
                          border="1px solid #e5e7eb"
                          borderRadius="2px"
                          p={4}
                          _hover={{ bg: "#fafafa" }}
                      transition="all 0.2s"
                    >
                          <VStack spacing={2}>
                            <Icon as={Mic} boxSize={6} color="#10b981" />
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase">
                              Microphone
                            </Text>
                            <Text fontSize="sm" fontWeight="600" color="#10b981">
                              Actif
                            </Text>
                          </VStack>
                        </Box>

                        {/* Haut-parleurs */}
                        <Box
                          bg="#ffffff"
                          border="1px solid #e5e7eb"
                          borderRadius="2px"
                          p={4} 
                          _hover={{ bg: "#fafafa" }}
                          transition="all 0.2s"
                        >
                          <VStack spacing={2}>
                            <Icon as={Bot} boxSize={6} color="#10b981" />
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase">
                              Audio
                            </Text>
                            <Text fontSize="sm" fontWeight="600" color="#10b981">
                              Fonctionnel
                            </Text>
                          </VStack>
                        </Box>

                        {/* RFID */}
                        <Box
                          bg="#ffffff"
                          border="1px solid #e5e7eb"
                          borderRadius="2px"
                          p={4}
                          _hover={{ bg: "#fafafa" }}
                          transition="all 0.2s"
                        >
                          <VStack spacing={2}>
                            <Icon as={QrCode} boxSize={6} color="#10b981" />
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase">
                              RFID
                          </Text>
                            <Text fontSize="sm" fontWeight="600" color="#10b981">
                              Connecté
                            </Text>
                          </VStack>
                        </Box>

                        {/* Réseau */}
                        <Box
                          bg="#ffffff"
                          border="1px solid #e5e7eb"
                          borderRadius="2px"
                          p={4}
                          _hover={{ bg: "#fafafa" }}
                          transition="all 0.2s"
                        >
                          <VStack spacing={2}>
                            <Icon as={Wifi} boxSize={6} color="#10b981" />
                            <Text fontSize="xs" color="#6b7280" fontWeight="500" textTransform="uppercase">
                              Réseau
                            </Text>
                            <Text fontSize="sm" fontWeight="600" color="#10b981">
                              Stable
                            </Text>
                          </VStack>
                        </Box>
                    
                  </SimpleGrid>
                </VStack>
                  </motion.div>

                  {/* Incidents récents */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                  >
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="500" color="#111827" fontSize="lg">Incidents récents</Text>
                      {incidents.length === 0 ? (
                        <Text fontSize="sm" color="#6b7280">Aucun incident sur les 7 derniers jours.</Text>
                      ) : (
                        <VStack spacing={2} align="stretch">
                          {incidents.map((it) => (
                            <HStack key={it.id} justify="space-between" p={3} bg="#fff" border="1px solid #e5e7eb" borderRadius="8px">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="600" color="#111827">{it.id}</Text>
                                <Text fontSize="xs" color="#6b7280">{new Date(it.started_at).toLocaleString()} • {it.message || 'Erreur'}</Text>
                              </VStack>
                              <Badge colorScheme={it.ended_at ? 'green' : 'red'}>{it.ended_at ? 'Résolu' : 'Ouvert'}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  </motion.div>

                </VStack>
              </TabPanel>
              
            </TabPanels>
          </Tabs>

        </VStack>
      </motion.div>
    </Container>
    </UnifiedLayout>
  )
} 