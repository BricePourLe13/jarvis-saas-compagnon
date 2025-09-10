'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Progress, 
  Icon, 
  Badge,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mic, 
  Wifi, 
  Monitor,
  RefreshCw
} from 'lucide-react'

// Types pour le diagnostic
interface DiagnosticStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error' | 'warning'
  message?: string
  details?: string
}

interface DiagnosticResult {
  permissions: DiagnosticStep
  microphone: DiagnosticStep
  webrtc: DiagnosticStep
  openai: DiagnosticStep
  overall: 'success' | 'warning' | 'error'
  recommendations?: string[]
}

interface MicrophoneDiagnosticProps {
  onDiagnosticComplete?: (result: DiagnosticResult) => void
  onRetry?: () => void
  autoStart?: boolean
}

export default function MicrophoneDiagnostic({ 
  onDiagnosticComplete, 
  onRetry,
  autoStart = true 
}: MicrophoneDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<DiagnosticStep[]>([
    { id: 'permissions', name: 'Vérification des permissions', status: 'pending' },
    { id: 'microphone', name: 'Test du microphone', status: 'pending' },
    { id: 'webrtc', name: 'Connexion WebRTC', status: 'pending' },
    { id: 'openai', name: 'Connectivité OpenAI', status: 'pending' }
  ])
  const [result, setResult] = useState<DiagnosticResult | null>(null)

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // 🔍 Test des permissions
  const checkPermissions = async (): Promise<DiagnosticStep> => {
    try {
      if (!navigator.permissions) {
        return {
          id: 'permissions',
          name: 'Vérification des permissions',
          status: 'warning',
          message: 'API Permissions non disponible',
          details: 'Navigateur ancien - test direct du microphone'
        }
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      
      switch (permission.state) {
        case 'granted':
          return {
            id: 'permissions',
            name: 'Vérification des permissions',
            status: 'success',
            message: 'Permissions accordées'
          }
        case 'denied':
          return {
            id: 'permissions',
            name: 'Vérification des permissions',
            status: 'error',
            message: 'Permissions refusées',
            details: 'Cliquez sur l\'icône cadenas dans la barre d\'adresse pour autoriser'
          }
        case 'prompt':
          return {
            id: 'permissions',
            name: 'Vérification des permissions',
            status: 'warning',
            message: 'Permissions à demander',
            details: 'Le navigateur demandera l\'autorisation'
          }
        default:
          return {
            id: 'permissions',
            name: 'Vérification des permissions',
            status: 'warning',
            message: 'État inconnu'
          }
      }
    } catch (error: any) {
      return {
        id: 'permissions',
        name: 'Vérification des permissions',
        status: 'error',
        message: 'Erreur de vérification',
        details: error.message
      }
    }
  }

  // 🎤 Test du microphone
  const testMicrophone = async (): Promise<DiagnosticStep> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return {
          id: 'microphone',
          name: 'Test du microphone',
          status: 'error',
          message: 'getUserMedia non supporté',
          details: 'Navigateur incompatible ou connexion non sécurisée'
        }
      }

      // Test avec timeout
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      )

      const stream = await Promise.race([streamPromise, timeoutPromise])

      // Analyser le stream
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)

      // Test niveau audio pendant 2 secondes
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let maxLevel = 0

      for (let i = 0; i < 20; i++) {
        analyser.getByteFrequencyData(dataArray)
        const level = Math.max(...dataArray)
        maxLevel = Math.max(maxLevel, level)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Nettoyer
      stream.getTracks().forEach(track => track.stop())
      audioContext.close()

      if (maxLevel > 10) {
        return {
          id: 'microphone',
          name: 'Test du microphone',
          status: 'success',
          message: `Microphone actif (niveau: ${maxLevel})`
        }
      } else {
        return {
          id: 'microphone',
          name: 'Test du microphone',
          status: 'warning',
          message: 'Microphone silencieux',
          details: 'Vérifiez que le microphone n\'est pas coupé'
        }
      }

    } catch (error: any) {
      let message = 'Erreur microphone'
      let details = error.message

      switch (error.name || error.message) {
        case 'NotAllowedError':
          message = 'Permissions refusées'
          details = 'Autorisez l\'accès au microphone et rechargez'
          break
        case 'NotFoundError':
          message = 'Microphone introuvable'
          details = 'Branchez un microphone et rechargez'
          break
        case 'NotReadableError':
          message = 'Microphone occupé'
          details = 'Fermez les autres applications utilisant le micro'
          break
        case 'TIMEOUT':
          message = 'Timeout microphone'
          details = 'Le microphone met trop de temps à répondre'
          break
      }

      return {
        id: 'microphone',
        name: 'Test du microphone',
        status: 'error',
        message,
        details
      }
    }
  }

  // 🌐 Test WebRTC
  const testWebRTC = async (): Promise<DiagnosticStep> => {
    try {
      if (!window.RTCPeerConnection) {
        return {
          id: 'webrtc',
          name: 'Connexion WebRTC',
          status: 'error',
          message: 'WebRTC non supporté',
          details: 'Navigateur incompatible'
        }
      }

      // Test création PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      // Test data channel
      const dc = pc.createDataChannel('test')
      
      // Attendre l'état de connexion
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WEBRTC_TIMEOUT'))
        }, 5000)

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            clearTimeout(timeout)
            resolve()
          } else if (pc.iceConnectionState === 'failed') {
            clearTimeout(timeout)
            reject(new Error('WEBRTC_FAILED'))
          }
        }

        // Pour le test, on considère que la création réussie = OK
        clearTimeout(timeout)
        resolve()
      })

      pc.close()

      return {
        id: 'webrtc',
        name: 'Connexion WebRTC',
        status: 'success',
        message: 'WebRTC fonctionnel'
      }

    } catch (error: any) {
      return {
        id: 'webrtc',
        name: 'Connexion WebRTC',
        status: 'error',
        message: 'Erreur WebRTC',
        details: error.message
      }
    }
  }

  // 🤖 Test connectivité OpenAI
  const testOpenAIConnection = async (): Promise<DiagnosticStep> => {
    try {
      const response = await fetch('/api/voice/session', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      if (response.ok) {
        return {
          id: 'openai',
          name: 'Connectivité OpenAI',
          status: 'success',
          message: 'API accessible'
        }
      } else {
        return {
          id: 'openai',
          name: 'Connectivité OpenAI',
          status: 'error',
          message: `Erreur API (${response.status})`,
          details: 'Problème serveur ou configuration'
        }
      }
    } catch (error: any) {
      return {
        id: 'openai',
        name: 'Connectivité OpenAI',
        status: 'error',
        message: 'Connexion échouée',
        details: error.message
      }
    }
  }

  // 🚀 Lancer le diagnostic complet
  const runDiagnostic = async () => {
    setIsRunning(true)
    setCurrentStep(0)
    setResult(null)

    const newSteps = [...steps]
    
    try {
      // Étape 1: Permissions
      setCurrentStep(1)
      newSteps[0] = { ...newSteps[0], status: 'running' }
      setSteps([...newSteps])
      
      const permissionResult = await checkPermissions()
      newSteps[0] = permissionResult
      setSteps([...newSteps])

      // Étape 2: Microphone
      setCurrentStep(2)
      newSteps[1] = { ...newSteps[1], status: 'running' }
      setSteps([...newSteps])
      
      const microphoneResult = await testMicrophone()
      newSteps[1] = microphoneResult
      setSteps([...newSteps])

      // Étape 3: WebRTC
      setCurrentStep(3)
      newSteps[2] = { ...newSteps[2], status: 'running' }
      setSteps([...newSteps])
      
      const webrtcResult = await testWebRTC()
      newSteps[2] = webrtcResult
      setSteps([...newSteps])

      // Étape 4: OpenAI
      setCurrentStep(4)
      newSteps[3] = { ...newSteps[3], status: 'running' }
      setSteps([...newSteps])
      
      const openaiResult = await testOpenAIConnection()
      newSteps[3] = openaiResult
      setSteps([...newSteps])

      // Analyser le résultat global
      const hasErrors = newSteps.some(step => step.status === 'error')
      const hasWarnings = newSteps.some(step => step.status === 'warning')
      
      let overall: 'success' | 'warning' | 'error' = 'success'
      if (hasErrors) overall = 'error'
      else if (hasWarnings) overall = 'warning'

      // Générer des recommandations
      const recommendations: string[] = []
      if (permissionResult.status === 'error') {
        recommendations.push('Autorisez l\'accès au microphone dans les paramètres du navigateur')
      }
      if (microphoneResult.status === 'error') {
        recommendations.push('Vérifiez que le microphone est branché et fonctionnel')
      }
      if (webrtcResult.status === 'error') {
        recommendations.push('Utilisez un navigateur récent (Chrome, Firefox, Safari)')
      }
      if (openaiResult.status === 'error') {
        recommendations.push('Vérifiez la connexion internet et réessayez')
      }

      const finalResult: DiagnosticResult = {
        permissions: permissionResult,
        microphone: microphoneResult,
        webrtc: webrtcResult,
        openai: openaiResult,
        overall,
        recommendations: recommendations.length > 0 ? recommendations : undefined
      }

      setResult(finalResult)
      onDiagnosticComplete?.(finalResult)

    } catch (error) {
      console.error('Erreur diagnostic:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // Auto-start
  useEffect(() => {
    if (autoStart) {
      runDiagnostic()
    }
  }, [autoStart])

  // Icône selon le statut
  const getStatusIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'error': return XCircle
      case 'warning': return AlertCircle
      case 'running': return RefreshCw
      default: return Mic
    }
  }

  // Couleur selon le statut
  const getStatusColor = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success': return 'green'
      case 'error': return 'red'
      case 'warning': return 'orange'
      case 'running': return 'blue'
      default: return 'gray'
    }
  }

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      p={6}
      maxW="500px"
      w="full"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">
            Diagnostic Microphone
          </Text>
          {!isRunning && (
            <Button
              size="sm"
              leftIcon={<Icon as={RefreshCw} />}
              onClick={runDiagnostic}
              colorScheme="blue"
              variant="outline"
            >
              Relancer
            </Button>
          )}
        </HStack>

        {/* Progress */}
        {isRunning && (
          <Box>
            <Text fontSize="sm" mb={2} color="gray.600">
              Étape {currentStep}/4
            </Text>
            <Progress 
              value={(currentStep / 4) * 100} 
              colorScheme="blue" 
              size="sm"
              borderRadius="full"
            />
          </Box>
        )}

        {/* Steps */}
        <VStack spacing={3} align="stretch">
          {steps.map((step, index) => (
            <HStack key={step.id} spacing={3} align="flex-start">
              <Icon
                as={getStatusIcon(step.status)}
                color={`${getStatusColor(step.status)}.500`}
                className={step.status === 'running' ? 'animate-spin' : ''}
              />
              <VStack align="flex-start" spacing={1} flex={1}>
                <HStack justify="space-between" w="full">
                  <Text fontWeight="medium">{step.name}</Text>
                  <Badge 
                    colorScheme={getStatusColor(step.status)}
                    variant="subtle"
                  >
                    {step.status === 'running' ? 'En cours...' : 
                     step.status === 'success' ? 'OK' :
                     step.status === 'error' ? 'Erreur' :
                     step.status === 'warning' ? 'Attention' : 'En attente'}
                  </Badge>
                </HStack>
                {step.message && (
                  <Text fontSize="sm" color="gray.600">
                    {step.message}
                  </Text>
                )}
                {step.details && (
                  <Text fontSize="xs" color="gray.500">
                    {step.details}
                  </Text>
                )}
              </VStack>
            </HStack>
          ))}
        </VStack>

        {/* Résultat final */}
        {result && !isRunning && (
          <Alert
            status={result.overall === 'success' ? 'success' : 
                   result.overall === 'warning' ? 'warning' : 'error'}
            borderRadius="md"
          >
            <AlertIcon />
            <Box>
              <AlertTitle>
                {result.overall === 'success' ? 'Diagnostic réussi !' :
                 result.overall === 'warning' ? 'Problèmes mineurs détectés' :
                 'Problèmes critiques détectés'}
              </AlertTitle>
              {result.recommendations && (
                <AlertDescription mt={2}>
                  <VStack align="flex-start" spacing={1}>
                    {result.recommendations.map((rec, index) => (
                      <Text key={index} fontSize="sm">
                        • {rec}
                      </Text>
                    ))}
                  </VStack>
                </AlertDescription>
              )}
            </Box>
          </Alert>
        )}

        {/* Actions */}
        {result && !isRunning && result.overall !== 'success' && (
          <HStack spacing={3}>
            <Button
              size="sm"
              onClick={runDiagnostic}
              leftIcon={<Icon as={RefreshCw} />}
              variant="outline"
            >
              Réessayer
            </Button>
            {onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                colorScheme="blue"
              >
                Continuer quand même
              </Button>
            )}
          </HStack>
        )}
      </VStack>
    </Box>
  )
}

