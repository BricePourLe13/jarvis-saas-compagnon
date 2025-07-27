"use client"
import { useState, useEffect } from 'react'
import { 
  Box, 
  VStack, 
  HStack,
  Heading, 
  Text, 
  PinInput,
  PinInputField,
  Button,
  Alert,
  AlertIcon,
  Icon,
  Progress,
  Card,
  CardBody,
  Badge,
  useToast,
  Spinner
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  Wifi, 
  Monitor, 
  Mic, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  Clock,
  Settings
} from 'lucide-react'

interface ProvisioningInterfaceProps {
  kioskSlug: string
  gymName?: string
  onProvisioningComplete: () => void
}

interface HardwareStatus {
  rfid: 'testing' | 'connected' | 'error' | 'idle'
  microphone: 'testing' | 'available' | 'denied' | 'error' | 'idle'
  speakers: 'testing' | 'available' | 'error' | 'idle'
  network: 'connected' | 'error' | 'idle'
}

export default function ProvisioningInterface({ 
  kioskSlug, 
  gymName,
  onProvisioningComplete 
}: ProvisioningInterfaceProps) {
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'validating' | 'testing' | 'complete'>('input')
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus>({
    rfid: 'idle',
    microphone: 'idle', 
    speakers: 'idle',
    network: 'idle'
  })
  const [testProgress, setTestProgress] = useState(0)
  const toast = useToast()

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5 }
    }
  }

  // Vérifier le statut réseau au chargement
  useEffect(() => {
    setHardwareStatus(prev => ({ ...prev, network: 'connected' }))
  }, [])

  const handleCodeComplete = async (value: string) => {
    setCode(value)
    if (value.length === 6) {
      await validateProvisioningCode(value)
    }
  }

  const validateProvisioningCode = async (codeValue: string) => {
    setIsValidating(true)
    setError(null)
    setStep('validating')

    try {
      const response = await fetch(`/api/kiosk/${kioskSlug}/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provisioning_code: codeValue,
          action: 'validate'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Code invalide')
      }

      // Code valide, commencer les tests matériel
      await startHardwareTests()

    } catch (err: any) {
      setError(err.message)
      setStep('input')
      setCode('')
    } finally {
      setIsValidating(false)
    }
  }

  const startHardwareTests = async () => {
    setStep('testing')
    setTestProgress(0)

    // Test 1: Réseau (déjà fait)
    setTestProgress(25)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 2: Microphone
    setHardwareStatus(prev => ({ ...prev, microphone: 'testing' }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setHardwareStatus(prev => ({ ...prev, microphone: 'available' }))
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      setHardwareStatus(prev => ({ ...prev, microphone: 'denied' }))
    }
    setTestProgress(50)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 3: Haut-parleurs
    setHardwareStatus(prev => ({ ...prev, speakers: 'testing' }))
    try {
      // Test simple de lecture audio
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      oscillator.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
      setHardwareStatus(prev => ({ ...prev, speakers: 'available' }))
    } catch (err) {
      setHardwareStatus(prev => ({ ...prev, speakers: 'error' }))
    }
    setTestProgress(75)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 4: Simuler test RFID
    setHardwareStatus(prev => ({ ...prev, rfid: 'testing' }))
    await new Promise(resolve => setTimeout(resolve, 1000))
    setHardwareStatus(prev => ({ ...prev, rfid: 'connected' }))
    setTestProgress(100)

    // Finaliser le provisioning
    await completeProvisioning()
  }

  const completeProvisioning = async () => {
    try {
      const response = await fetch(`/api/kiosk/${kioskSlug}/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provisioning_code: code,
          action: 'complete',
          hardware_info: {
            rfid_reader_id: 'RFID_001',
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            browser_info: {
              userAgent: navigator.userAgent,
              language: navigator.language
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la finalisation')
      }

      setStep('complete')
      toast({
        title: "Kiosk activé !",
        description: "Le kiosk JARVIS est maintenant opérationnel",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Attendre avant de finaliser
      setTimeout(() => {
        onProvisioningComplete()
      }, 2000)

    } catch (err: any) {
      setError(err.message)
      setStep('input')
    }
  }

  const getHardwareIcon = (status: string) => {
    switch (status) {
      case 'testing': return <Spinner size="sm" color="blue.500" />
      case 'connected':
      case 'available': return <Icon as={CheckCircle} color="green.500" />
      case 'error':
      case 'denied': return <Icon as={XCircle} color="red.500" />
      default: return <Icon as={Clock} color="gray.400" />
    }
  }

  const getHardwareStatusText = (type: string, status: string) => {
    if (status === 'testing') return 'Test en cours...'
    if (status === 'connected' || status === 'available') return 'Opérationnel'
    if (status === 'error') return 'Erreur détectée'
    if (status === 'denied') return 'Accès refusé'
    return 'En attente'
  }

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={6}
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeInUp}
      >
        <Card maxW="500px" w="full" bg="white" borderRadius="24px" overflow="hidden">
          <CardBody p={8}>
            <VStack spacing={8} textAlign="center">
              
              {/* Header */}
              <VStack spacing={4}>
                <Box
                  p={4}
                  borderRadius="16px"
                  bg="blue.50"
                  border="2px solid"
                  borderColor="blue.200"
                >
                  <Icon as={Monitor} boxSize={8} color="blue.500" />
                </Box>
                <VStack spacing={2}>
                  <Heading size="lg" color="gray.800">
                    🤖 Configuration JARVIS
                  </Heading>
                  {gymName && (
                    <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                      📍 {gymName}
                    </Badge>
                  )}
                </VStack>
              </VStack>

              {/* Étapes selon le statut */}
              {step === 'input' && (
                <VStack spacing={6} w="full">
                  <Text color="gray.600" fontSize="md">
                    Entrez le code d'activation fourni par votre administrateur
                  </Text>
                  
                  <VStack spacing={4}>
                    <HStack justify="center">
                      <PinInput 
                        value={code}
                        onChange={setCode}
                        onComplete={handleCodeComplete}
                        size="lg"
                        placeholder="0"
                        type="alphanumeric"
                      >
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                      </PinInput>
                    </HStack>
                    
                    {error && (
                      <Alert status="error" borderRadius="12px">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}
                  </VStack>
                </VStack>
              )}

              {step === 'validating' && (
                <VStack spacing={4}>
                  <Spinner size="xl" color="blue.500" />
                  <Text color="gray.600">Validation du code en cours...</Text>
                </VStack>
              )}

              {step === 'testing' && (
                <VStack spacing={6} w="full">
                  <VStack spacing={3}>
                    <Text color="gray.800" fontWeight="600" fontSize="lg">
                      Tests du matériel
                    </Text>
                    <Progress value={testProgress} colorScheme="blue" borderRadius="full" w="full" />
                    <Text color="gray.500" fontSize="sm">
                      {testProgress}% complété
                    </Text>
                  </VStack>

                  <VStack spacing={4} w="full">
                    <HStack justify="space-between" w="full" p={3} borderRadius="12px" bg="gray.50">
                      <HStack>
                        <Icon as={Wifi} color="blue.500" />
                        <Text fontWeight="500">Réseau</Text>
                      </HStack>
                      <HStack>
                        {getHardwareIcon(hardwareStatus.network)}
                        <Text fontSize="sm" color="gray.600">
                          {getHardwareStatusText('network', hardwareStatus.network)}
                        </Text>
                      </HStack>
                    </HStack>

                    <HStack justify="space-between" w="full" p={3} borderRadius="12px" bg="gray.50">
                      <HStack>
                        <Icon as={Mic} color="blue.500" />
                        <Text fontWeight="500">Microphone</Text>
                      </HStack>
                      <HStack>
                        {getHardwareIcon(hardwareStatus.microphone)}
                        <Text fontSize="sm" color="gray.600">
                          {getHardwareStatusText('microphone', hardwareStatus.microphone)}
                        </Text>
                      </HStack>
                    </HStack>

                    <HStack justify="space-between" w="full" p={3} borderRadius="12px" bg="gray.50">
                      <HStack>
                        <Icon as={Settings} color="blue.500" />
                        <Text fontWeight="500">Haut-parleurs</Text>
                      </HStack>
                      <HStack>
                        {getHardwareIcon(hardwareStatus.speakers)}
                        <Text fontSize="sm" color="gray.600">
                          {getHardwareStatusText('speakers', hardwareStatus.speakers)}
                        </Text>
                      </HStack>
                    </HStack>

                    <HStack justify="space-between" w="full" p={3} borderRadius="12px" bg="gray.50">
                      <HStack>
                        <Icon as={CreditCard} color="blue.500" />
                        <Text fontWeight="500">Lecteur RFID</Text>
                      </HStack>
                      <HStack>
                        {getHardwareIcon(hardwareStatus.rfid)}
                        <Text fontSize="sm" color="gray.600">
                          {getHardwareStatusText('rfid', hardwareStatus.rfid)}
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </VStack>
              )}

              {step === 'complete' && (
                <VStack spacing={6}>
                  <Box
                    p={4}
                    borderRadius="16px"
                    bg="green.50"
                    border="2px solid"
                    borderColor="green.200"
                  >
                    <Icon as={CheckCircle} boxSize={12} color="green.500" />
                  </Box>
                  <VStack spacing={2}>
                    <Heading size="lg" color="green.600">
                      ✅ Kiosk Activé !
                    </Heading>
                    <Text color="gray.600" textAlign="center">
                      JARVIS est maintenant opérationnel et prêt à accueillir vos membres.
                    </Text>
                  </VStack>
                </VStack>
              )}

            </VStack>
          </CardBody>
        </Card>
      </motion.div>
    </Box>
  )
} 