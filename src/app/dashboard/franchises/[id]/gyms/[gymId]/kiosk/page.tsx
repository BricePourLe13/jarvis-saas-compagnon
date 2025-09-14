/**
 * 🖥️ KIOSK LIVE - MONITORING & CONFIGURATION
 * Interface de gestion du kiosk avec nouvelle architecture
 */

'use client'

import { useState, useEffect } from 'react'
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
  Button, 
  IconButton,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Textarea
} from '@chakra-ui/react'
import {
  Monitor,
  Wifi,
  WifiOff,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Mic,
  Volume2,
  Bluetooth,
  QrCode,
  ExternalLink,
  Activity
} from 'lucide-react'
import SentryMainLayout from '@/components/dashboard/layouts/SentryMainLayout'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

interface KioskPageProps {
  params: Promise<{ id: string; gymId: string }>
}

interface KioskStatus {
  status: 'online' | 'offline' | 'provisioning' | 'error'
  lastHeartbeat: Date | null
  version: string
  isProvisioned: boolean
  provisioningCode?: string
  kioskUrl?: string
  diagnostics: {
    microphone: 'good' | 'warning' | 'error'
    speakers: 'good' | 'warning' | 'error'
    network: 'good' | 'warning' | 'error'
    rfid: 'good' | 'warning' | 'error'
  }
}

interface KioskConfig {
  // Configuration IA avancée
  personality: 'friendly' | 'professional' | 'casual' | 'energetic'
  humor_level: 'none' | 'low' | 'medium' | 'high'
  response_length: 'short' | 'medium' | 'long'
  language_accent: 'fr_fr' | 'fr_ca' | 'en_us' | 'en_gb'
  tone_timebased: boolean
  emotion_bias: 'neutral' | 'positive' | 'empathetic'
  speaking_pace: 'slow' | 'normal' | 'fast'
  opening_preset: 'standard' | 'energetic' | 'casual' | 'deadpool_clean'
  strict_end_rule: boolean
  model: 'gpt-4o-realtime-preview-2024-12-17' | 'gpt-4o-mini-realtime-preview-2024-12-17'
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse'
  
  // Configuration UI
  avatarStyle: 'friendly' | 'professional' | 'energetic'
  welcomeMessage: string
  brandColors: {
    primary: string
    secondary: string
    accent: string
  }
}

export default function KioskPage({ params }: KioskPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; gymId: string } | null>(null)
  const [kioskStatus, setKioskStatus] = useState<KioskStatus | null>(null)
  const [kioskConfig, setKioskConfig] = useState<KioskConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure()
  const { isOpen: isProvisioningOpen, onOpen: onProvisioningOpen, onClose: onProvisioningClose } = useDisclosure()

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params
        setResolvedParams(resolved)
      } catch (error) {
        console.error('Error resolving params:', error)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      loadKioskData()
    }
  }, [resolvedParams])

  const loadKioskData = async () => {
    if (!resolvedParams) return

    try {
      const supabase = getSupabaseSingleton()
      
      const { data: gym, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', resolvedParams.gymId)
        .single()

      if (error) throw error

      const kioskConfig = gym.kiosk_config as any

      // Simuler le statut du kiosk
      const mockStatus: KioskStatus = {
        status: kioskConfig?.is_provisioned ? 'online' : 'provisioning',
        lastHeartbeat: kioskConfig?.is_provisioned ? new Date(Date.now() - 30000) : null,
        version: 'v2.1.3',
        isProvisioned: kioskConfig?.is_provisioned || false,
        provisioningCode: kioskConfig?.provisioning_code,
        kioskUrl: kioskConfig?.kiosk_url_slug ? `/kiosk/${kioskConfig.kiosk_url_slug}` : undefined,
        diagnostics: {
          microphone: 'good',
          speakers: 'good', 
          network: 'good',
          rfid: 'warning'
        }
      }

      const mockConfig: KioskConfig = {
        // Configuration IA avancée (depuis jarvisSettingsSchema)
        personality: kioskConfig?.personality || 'friendly',
        humor_level: kioskConfig?.humor_level || 'medium',
        response_length: kioskConfig?.response_length || 'short',
        language_accent: kioskConfig?.language_accent || 'fr_fr',
        tone_timebased: kioskConfig?.tone_timebased ?? true,
        emotion_bias: kioskConfig?.emotion_bias || 'positive',
        speaking_pace: kioskConfig?.speaking_pace || 'normal',
        opening_preset: kioskConfig?.opening_preset || 'standard',
        strict_end_rule: kioskConfig?.strict_end_rule ?? true,
        model: kioskConfig?.model || 'gpt-4o-mini-realtime-preview-2024-12-17',
        voice: kioskConfig?.voice || 'verse',
        
        // Configuration UI
        avatarStyle: kioskConfig?.avatar_style || 'friendly',
        welcomeMessage: kioskConfig?.welcome_message || 'Bonjour ! Je suis JARVIS, votre assistant personnel.',
        brandColors: kioskConfig?.brand_colors || {
          primary: '#3182CE',
          secondary: '#2D3748',
          accent: '#38B2AC'
        }
      }

      setKioskStatus(mockStatus)
      setKioskConfig(mockConfig)

    } catch (error) {
      console.error('Error loading kiosk data:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du kiosk',
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKioskPreview = () => {
    if (kioskStatus?.kioskUrl) {
      window.open(kioskStatus.kioskUrl, '_blank')
    }
  }

  const handleCopyProvisioningCode = () => {
    if (kioskStatus?.provisioningCode) {
      navigator.clipboard.writeText(kioskStatus.provisioningCode)
      toast({
        title: 'Code copié',
        description: 'Le code de provisioning a été copié',
        status: 'success',
        duration: 2000
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green'
      case 'offline': return 'red'
      case 'provisioning': return 'orange'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getDiagnosticColor = (status: string) => {
    switch (status) {
      case 'good': return 'green'
      case 'warning': return 'orange'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  if (loading || !resolvedParams) {
  return (
    <SentryMainLayout
      currentPath={['dashboard', 'franchises', resolvedParams?.id || '', 'gyms', resolvedParams?.gymId || '', 'kiosk']}
      gymId={resolvedParams?.gymId}
      franchiseId={resolvedParams?.id}
    >
      <Box p={6} textAlign="center">
        <VStack spacing={4}>
          <Progress size="xs" isIndeterminate colorScheme="blue" w="300px" />
          <Text color="gray.600">Chargement des données kiosk...</Text>
        </VStack>
      </Box>
    </SentryMainLayout>
  )
  }

  return (
    <SentryMainLayout
      currentPath={['dashboard', 'franchises', resolvedParams.id, 'gyms', resolvedParams.gymId, 'kiosk']}
      gymId={resolvedParams.gymId}
      franchiseId={resolvedParams.id}
    >
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          
          {/* Statut Principal */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
            <Card>
              <CardHeader pb={2}>
                <HStack spacing={2}>
                  <Monitor size={18} />
                  <Text fontSize="sm" fontWeight="bold">Statut Kiosk</Text>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">État</Text>
                    <Badge colorScheme={getStatusColor(kioskStatus?.status || 'offline')} size="sm">
                      {kioskStatus?.status?.toUpperCase()}
                    </Badge>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">Version</Text>
                    <Text fontSize="xs" fontWeight="medium">{kioskStatus?.version}</Text>
                  </HStack>

                  {kioskStatus?.lastHeartbeat && (
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.600">Dernière activité</Text>
                      <Text fontSize="xs" fontWeight="medium">
                        {new Date(kioskStatus.lastHeartbeat).toLocaleTimeString()}
                      </Text>
                    </HStack>
                  )}

                  <Divider />

                  <HStack spacing={2}>
                    {kioskStatus?.isProvisioned ? (
                      <Button size="xs" colorScheme="blue" leftIcon={<Eye size={12} />} onClick={handleKioskPreview}>
                        Voir Kiosk
                      </Button>
                    ) : (
                      <Button size="xs" colorScheme="orange" leftIcon={<QrCode size={12} />}>
                        Provisionner
                      </Button>
                    )}
                    <IconButton
                      aria-label="Actualiser"
                      icon={<RefreshCw size={12} />}
                      size="xs"
                      variant="outline"
                      onClick={loadKioskData}
                    />
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Diagnostics */}
            <Card>
              <CardHeader pb={2}>
                <HStack spacing={2}>
                  <Settings size={18} />
                  <Text fontSize="sm" fontWeight="bold">Diagnostics</Text>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={2} align="stretch">
                  {Object.entries(kioskStatus?.diagnostics || {}).map(([component, status]) => (
                    <HStack key={component} justify="space-between">
                      <HStack spacing={2}>
                        {component === 'microphone' && <Mic size={12} />}
                        {component === 'speakers' && <Volume2 size={12} />}
                        {component === 'network' && <Wifi size={12} />}
                        {component === 'rfid' && <Bluetooth size={12} />}
                        <Text fontSize="xs" textTransform="capitalize">{component}</Text>
                      </HStack>
                      <Badge colorScheme={getDiagnosticColor(status)} size="xs">
                        {status.toUpperCase()}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>

            {/* Actions Rapides */}
            <Card>
              <CardHeader pb={2}>
                <HStack spacing={2}>
                  <Settings size={18} />
                  <Text fontSize="sm" fontWeight="bold">Actions</Text>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={2} align="stretch">
                  <Button size="xs" variant="outline" leftIcon={<Settings size={12} />} onClick={onConfigOpen}>
                    Configuration
                  </Button>
                  
                  {!kioskStatus?.isProvisioned && kioskStatus?.provisioningCode && (
                    <Button 
                      size="xs" 
                      variant="outline" 
                      leftIcon={<Copy size={12} />}
                      onClick={handleCopyProvisioningCode}
                    >
                      Copier Code
                    </Button>
                  )}

                  {!kioskStatus?.isProvisioned && (
                    <Button 
                      size="xs" 
                      colorScheme="purple" 
                      leftIcon={<QrCode size={12} />}
                      onClick={onProvisioningOpen}
                    >
                      Provisioning
                    </Button>
                  )}

                  <Button size="xs" variant="outline" leftIcon={<RotateCcw size={12} />}>
                    Redémarrer
                  </Button>

                  <Button size="xs" variant="outline" leftIcon={<ExternalLink size={12} />} onClick={handleKioskPreview}>
                    Ouvrir Kiosk
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Code de Provisioning */}
          {!kioskStatus?.isProvisioned && kioskStatus?.provisioningCode && (
            <Alert status="warning">
              <AlertIcon />
              <Box flex={1}>
                <AlertTitle fontSize="sm">Kiosk non provisionné</AlertTitle>
                <AlertDescription fontSize="xs">
                  Utilisez ce code pour activer le kiosk : <Code>{kioskStatus.provisioningCode}</Code>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Sessions Live (placeholder) */}
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <Activity size={18} />
                  <Text fontSize="sm" fontWeight="bold">Sessions Live</Text>
                </HStack>
                <Badge colorScheme="green" size="sm">0 active</Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text fontSize="sm" color="gray.600" textAlign="center" py={4}>
                Aucune session active
              </Text>
            </CardBody>
          </Card>

        </VStack>

        {/* Modal Configuration Avancée */}
        <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="4xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Configuration JARVIS - Kiosk</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                
                {/* Section IA & Modèle */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="purple.700">
                    🤖 Intelligence Artificielle
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Modèle IA</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.model}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, model: e.target.value as any} : null)}
                      >
                        <option value="gpt-4o-mini-realtime-preview-2024-12-17">GPT-4o Mini Realtime</option>
                        <option value="gpt-4o-realtime-preview-2024-12-17">GPT-4o Realtime</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Voix</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.voice}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, voice: e.target.value as any} : null)}
                      >
                        <option value="alloy">Alloy</option>
                        <option value="ash">Ash</option>
                        <option value="ballad">Ballad</option>
                        <option value="coral">Coral</option>
                        <option value="echo">Echo</option>
                        <option value="sage">Sage</option>
                        <option value="shimmer">Shimmer ✨</option>
                        <option value="verse">Verse</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Section Personnalité */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="blue.700">
                    🎭 Personnalité & Style
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Personnalité</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.personality}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, personality: e.target.value as any} : null)}
                      >
                        <option value="friendly">Amical</option>
                        <option value="professional">Professionnel</option>
                        <option value="casual">Décontracté</option>
                        <option value="energetic">Énergique</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Niveau d'humour</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.humor_level}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, humor_level: e.target.value as any} : null)}
                      >
                        <option value="none">Aucun</option>
                        <option value="low">Léger</option>
                        <option value="medium">Moyen</option>
                        <option value="high">Marqué</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Biais émotionnel</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.emotion_bias}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, emotion_bias: e.target.value as any} : null)}
                      >
                        <option value="neutral">Neutre</option>
                        <option value="positive">Positif</option>
                        <option value="empathetic">Empathique</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Style d'ouverture</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.opening_preset}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, opening_preset: e.target.value as any} : null)}
                      >
                        <option value="standard">Standard</option>
                        <option value="energetic">Énergique</option>
                        <option value="casual">Décontracté</option>
                        <option value="deadpool_clean">Drôle (clean)</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Section Communication */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="green.700">
                    🗣️ Communication
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Longueur des réponses</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.response_length}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, response_length: e.target.value as any} : null)}
                      >
                        <option value="short">Courte</option>
                        <option value="medium">Moyenne</option>
                        <option value="long">Longue</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Rythme de parole</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.speaking_pace}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, speaking_pace: e.target.value as any} : null)}
                      >
                        <option value="slow">Lent</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Rapide</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Accent</FormLabel>
                      <Select 
                        size="sm" 
                        value={kioskConfig?.language_accent}
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, language_accent: e.target.value as any} : null)}
                      >
                        <option value="fr_fr">Français (France)</option>
                        <option value="fr_ca">Français (Canada)</option>
                        <option value="en_us">English (US)</option>
                        <option value="en_gb">English (UK)</option>
                      </Select>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel fontSize="sm" mb={0}>Ton adapté par heure</FormLabel>
                      <Switch 
                        isChecked={kioskConfig?.tone_timebased} 
                        onChange={(e) => setKioskConfig(prev => prev ? {...prev, tone_timebased: e.target.checked} : null)}
                        colorScheme="blue"
                        ml={2}
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Section Comportement */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="orange.700">
                    ⚙️ Comportement
                  </Text>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="sm" mb={0}>Fin stricte sur "Au revoir"</FormLabel>
                    <Switch 
                      isChecked={kioskConfig?.strict_end_rule} 
                      onChange={(e) => setKioskConfig(prev => prev ? {...prev, strict_end_rule: e.target.checked} : null)}
                      colorScheme="orange"
                      ml={2}
                    />
                  </FormControl>
                </Box>

                {/* Section Message d'accueil */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                    💬 Message d'accueil
                  </Text>
                  <FormControl>
                    <Textarea 
                      size="sm" 
                      value={kioskConfig?.welcomeMessage}
                      onChange={(e) => setKioskConfig(prev => prev ? {...prev, welcomeMessage: e.target.value} : null)}
                      placeholder="Message personnalisé d'accueil..."
                      rows={3}
                    />
                  </FormControl>
                </Box>

              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onConfigClose} size="sm">
                Annuler
              </Button>
              <Button colorScheme="purple" size="sm">
                Sauvegarder Configuration
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Provisioning */}
        <Modal isOpen={isProvisioningOpen} onClose={onProvisioningClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>🔧 Provisioning Kiosk</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                
                {/* Instructions */}
                <Alert status="info">
                  <AlertIcon />
                  <Box flex={1}>
                    <AlertTitle fontSize="sm">Instructions d'installation</AlertTitle>
                    <AlertDescription fontSize="xs">
                      Suivez ces étapes pour activer le kiosk sur site
                    </AlertDescription>
                  </Box>
                </Alert>

                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" color="gray.600">
                    1. Rendez-vous sur site avec l'écran du kiosk
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    2. Ouvrez un navigateur et allez sur l'URL ci-dessous
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    3. Saisissez le code d'activation à 6 caractères
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    4. Suivez les tests automatiques (micro, RFID, etc.)
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    5. Le kiosk sera automatiquement activé
                  </Text>
                </VStack>

                <Divider />

                {/* URL du kiosk */}
                <Box>
                  <Text fontWeight="600" mb={3} color="gray.800">
                    🌐 URL du Kiosk
                  </Text>
                  <HStack spacing={3}>
                    <Code p={3} fontSize="md" flex={1} borderRadius="8px">
                      {kioskStatus?.kioskUrl ? `${window.location.origin}${kioskStatus.kioskUrl}` : 'Non configuré'}
                    </Code>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (kioskStatus?.kioskUrl) {
                          navigator.clipboard.writeText(`${window.location.origin}${kioskStatus.kioskUrl}`)
                          toast({
                            title: 'URL copiée',
                            status: 'success',
                            duration: 2000
                          })
                        }
                      }}
                      colorScheme="gray"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleKioskPreview}
                      colorScheme="blue"
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </HStack>
                </Box>

                {/* Code d'activation */}
                <Box>
                  <Text fontWeight="600" mb={3} color="gray.800">
                    🔑 Code d'Activation
                  </Text>
                  <HStack spacing={3}>
                    <Code 
                      p={4} 
                      fontSize="xl" 
                      flex={1} 
                      borderRadius="8px"
                      fontFamily="mono"
                      textAlign="center"
                      bg="purple.50"
                      color="purple.800"
                      border="2px solid"
                      borderColor="purple.200"
                    >
                      {kioskStatus?.provisioningCode || 'Non généré'}
                    </Code>
                    <Button 
                      size="sm" 
                      onClick={handleCopyProvisioningCode}
                      colorScheme="purple"
                    >
                      <Copy size={16} />
                    </Button>
                  </HStack>
                  {kioskStatus?.provisioningExpiry && (
                    <Text fontSize="xs" color="orange.600" mt={2}>
                      ⏰ Expire le {new Date(kioskStatus.provisioningExpiry).toLocaleString()}
                    </Text>
                  )}
                </Box>

              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onProvisioningClose} size="sm">
                Fermer
              </Button>
              <Button colorScheme="purple" size="sm" onClick={handleKioskPreview}>
                Ouvrir Kiosk
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      </Box>
    </SentryMainLayout>
  )
}
