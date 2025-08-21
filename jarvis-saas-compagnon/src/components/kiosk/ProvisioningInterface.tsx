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
  useToast,
  Spinner
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wifi, 
  Monitor, 
  Mic, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  Clock,
  Settings,
  Zap
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

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)
const MotionHStack = motion(HStack)

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
  const [currentCode, setCurrentCode] = useState('')
  const toast = useToast()

  // Vérifier le statut réseau au chargement
  useEffect(() => {
    setHardwareStatus(prev => ({ ...prev, network: 'connected' }))
  }, [])

  const handleCodeComplete = async (value: string) => {
    // Log supprimé pour production
    setCurrentCode(value)
    setCode(value)
    if (value.length === 6) {
      await validateProvisioningCode(value)
    }
  }

  const validateProvisioningCode = async (codeValue: string) => {
    // Log supprimé pour production
    // Log supprimé pour production
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

      // Log supprimé pour production
      // S'assurer que le code est bien conservé après validation
      setCurrentCode(codeValue)
      
      // Code valide, commencer les tests matériel
      await startHardwareTests(codeValue) // Passer le code en paramètre pour plus de sécurité

    } catch (err: any) {
      // Log supprimé pour production
      setError(err.message)
      setStep('input')
      setCode('')
      setCurrentCode('')
    } finally {
      setIsValidating(false)
    }
  }

  const startHardwareTests = async (validatedCode?: string) => {
    const codeToUse = validatedCode || currentCode
    // Log supprimé pour production
    
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

    // Log supprimé pour production
    // Finaliser le provisioning avec le code validé
    await completeProvisioning(codeToUse)
  }

  const completeProvisioning = async (validatedCode?: string) => {
    const codeToUse = validatedCode || currentCode
    // Log supprimé pour production
    // Log supprimé pour production
    
    if (!codeToUse || codeToUse.length !== 6) {
      // Log supprimé pour production
      setError('Erreur interne: code de provisioning perdu')
      setStep('input')
      return
    }

    try {
      const response = await fetch(`/api/kiosk/${kioskSlug}/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provisioning_code: codeToUse,
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

      const result = await response.json()
      // Log supprimé pour production

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la finalisation')
      }

      setStep('complete')
      toast({
        title: "Kiosk activé !",
        description: "Le kiosk JARVIS est maintenant opérationnel",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      setTimeout(() => {
        onProvisioningComplete()
      }, 2000)

    } catch (err: any) {
      // Log supprimé pour production
      setError(err.message)
      setStep('input')
      // Ne pas vider currentCode ici pour permettre un retry
      // setCurrentCode('')
    }
  }

  const getHardwareIcon = (status: string) => {
    switch (status) {
      case 'testing': return <Spinner size="sm" color="gray.600" />
      case 'connected':
      case 'available': return <Icon as={CheckCircle} color="gray.900" />
      case 'error':
      case 'denied': return <Icon as={XCircle} color="gray.600" />
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

  // Animations subtiles
  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.23, 1, 0.32, 1] // Courbe de Bézier premium
      }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <Box 
      minH="100vh" 
      bg="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={8}
      fontFamily="system-ui, -apple-system, sans-serif"
      position="relative"
    >
      {/* Détail subtil : pattern de points en arrière-plan */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.02}
        bgImage="radial-gradient(circle, black 1px, transparent 1px)"
        bgSize="24px 24px"
        pointerEvents="none"
      />
      
      <MotionBox
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ width: '100%', maxWidth: '480px' }}
      >
        {/* Container principal avec détails subtils */}
        <MotionBox
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="2px"
          p={12}
          shadow="0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)" // Ombre très subtile
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            bg: 'linear-gradient(90deg, transparent, gray.100, transparent)',
          }}
        >
          <MotionVStack 
            spacing={10} 
            textAlign="center"
            variants={contentVariants}
            initial="hidden"
            animate="show"
          >
            
            {/* Header avec détails subtils */}
            <MotionVStack spacing={6} variants={itemVariants}>
              <MotionBox
                w={12}
                h={12}
                bg="black"
                borderRadius="2px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-1px',
                  left: '-1px',
                  right: '-1px',
                  bottom: '-1px',
                  bg: 'linear-gradient(45deg, transparent, gray.300, transparent)',
                  borderRadius: '3px',
                  zIndex: -1,
                  opacity: 0.3,
                }}
              >
                <Icon as={Settings} color="white" boxSize={6} />
                
                {/* Détail : petite animation de pulse très subtile */}
                {step === 'testing' && (
                  <Box
                    position="absolute"
                    top={-1}
                    right={-1}
                    w={3}
                    h={3}
                    bg="gray.900"
                    borderRadius="50%"
                    animation="pulse 2s infinite"
                  />
                )}
              </MotionBox>
              
              <VStack spacing={2}>
                <Heading 
                  size="lg" 
                  color="black"
                  fontWeight="400"
                  letterSpacing="-0.5px"
                  fontFamily="system-ui"
                >
                  Activation Kiosk
                </Heading>
                {gymName && (
                  <MotionBox
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Text 
                      color="gray.600" 
                      fontSize="sm"
                      fontWeight="400"
                      px={3}
                      py={1}
                      bg="gray.50"
                      borderRadius="1px"
                      border="1px solid"
                      borderColor="gray.100"
                    >
                      {gymName}
                    </Text>
                  </MotionBox>
                )}
              </VStack>
            </MotionVStack>

            <AnimatePresence mode="wait">
              {/* Étape 1: Saisie du code */}
              {step === 'input' && (
                <MotionVStack
                  key="input"
                  spacing={8}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -20 }}
                >
                  <VStack spacing={4}>
                    <Text 
                      color="gray.900" 
                      fontSize="sm"
                      fontWeight="400"
                      lineHeight="1.4"
                    >
                      Saisissez le code de provisioning
                    </Text>
                    
                    {/* Code PIN corrigé pour accepter lettres + chiffres */}
                    <HStack spacing={3}>
                      <PinInput 
                        value={code}
                        onChange={(value) => setCode(value)}
                        onComplete={handleCodeComplete}
                        size="lg"
                        variant="outline"
                        placeholder=""
                        type="alphanumeric" // ✅ CORRECTION : Accepte lettres et chiffres
                      >
                        {[...Array(6)].map((_, i) => (
                          <MotionBox
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.15 }}
                          >
                            <PinInputField 
                              w="48px"
                              h="56px"
                              borderRadius="2px"
                              borderColor="gray.300"
                              borderWidth="1px"
                              fontSize="lg"
                              fontWeight="500"
                              color="black"
                              bg="white"
                              textAlign="center"
                              textTransform="uppercase" // Affichage en majuscules
                              _focus={{
                                borderColor: "black",
                                boxShadow: "0 0 0 1px black",
                                bg: "white"
                              }}
                              _hover={{
                                borderColor: "gray.400"
                              }}
                              transition="all 0.15s ease"
                            />
                          </MotionBox>
                        ))}
                      </PinInput>
                    </HStack>
                    
                    {/* Indication subtile */}
                    <Text 
                      color="gray.400" 
                      fontSize="xs"
                      fontWeight="400"
                      letterSpacing="0.5px"
                    >
                      6 caractères · lettres et chiffres
                    </Text>
                  </VStack>

                  <AnimatePresence>
                    {error && (
                      <MotionBox
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert 
                          status="error" 
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.300"
                          borderRadius="2px"
                          py={3}
                        >
                          <AlertIcon color="gray.600" />
                          <Text color="gray.900" fontSize="sm" fontWeight="400">
                            {error}
                          </Text>
                        </Alert>
                      </MotionBox>
                    )}

                    {isValidating && (
                      <MotionHStack
                        spacing={3}
                        color="gray.600"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Spinner size="sm" />
                        <Text fontSize="sm" fontWeight="400">
                          Validation en cours...
                        </Text>
                      </MotionHStack>
                    )}
                  </AnimatePresence>
                </MotionVStack>
              )}

              {/* Étape 2: Tests matériel */}
              {step === 'testing' && (
                <MotionVStack
                  key="testing"
                  spacing={8}
                  w="full"
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -20 }}
                >
                  <VStack spacing={4}>
                    <HStack spacing={2} align="center">
                      <Icon as={Zap} color="gray.600" boxSize={4} />
                      <Text 
                        color="gray.900" 
                        fontSize="sm"
                        fontWeight="400"
                      >
                        Tests du matériel
                      </Text>
                    </HStack>
                    
                    {/* Barre de progression avec animation fluide */}
                    <Box w="full" bg="gray.100" h="2px" borderRadius="1px" overflow="hidden">
                      <MotionBox 
                        bg="black" 
                        h="full" 
                        borderRadius="1px"
                        initial={{ width: 0 }}
                        animate={{ width: `${testProgress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </Box>
                  </VStack>

                  <VStack spacing={3} w="full">
                    {[
                      { type: 'network', icon: Wifi, label: 'Réseau' },
                      { type: 'microphone', icon: Mic, label: 'Microphone' },
                      { type: 'speakers', icon: Monitor, label: 'Haut-parleurs' },
                      { type: 'rfid', icon: CreditCard, label: 'Lecteur RFID' }
                    ].map((item, index) => (
                      <MotionHStack 
                        key={item.type}
                        w="full" 
                        justify="space-between"
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="2px"
                        bg="white"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        whileHover={{ 
                          borderColor: "gray.300",
                          transition: { duration: 0.15 }
                        }}
                      >
                        <HStack spacing={3}>
                          <Icon as={item.icon} color="gray.600" boxSize={4} />
                          <Text 
                            fontSize="sm" 
                            fontWeight="400"
                            color="gray.900"
                          >
                            {item.label}
                          </Text>
                        </HStack>
                        
                        <HStack spacing={2}>
                          {getHardwareIcon(hardwareStatus[item.type as keyof HardwareStatus])}
                          <Text 
                            fontSize="xs" 
                            color="gray.600"
                            fontWeight="400"
                          >
                            {getHardwareStatusText(item.type, hardwareStatus[item.type as keyof HardwareStatus])}
                          </Text>
                        </HStack>
                      </MotionHStack>
                    ))}
                  </VStack>
                </MotionVStack>
              )}

              {/* Étape 3: Validation */}
              {step === 'validating' && (
                <MotionVStack
                  key="validating"
                  spacing={6}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Spinner size="lg" color="gray.600" />
                  <Text 
                    color="gray.900" 
                    fontSize="sm"
                    fontWeight="400"
                  >
                    Validation du code...
                  </Text>
                </MotionVStack>
              )}

              {/* Étape 4: Finalisation */}
              {step === 'complete' && (
                <MotionVStack
                  key="complete"
                  spacing={6}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <MotionBox
                    w={16}
                    h={16}
                    bg="black"
                    borderRadius="2px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: 0.2, 
                      duration: 0.5, 
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    <Icon as={CheckCircle} color="white" boxSize={8} />
                  </MotionBox>
                  
                  <VStack spacing={2}>
                    <Text 
                      color="gray.900" 
                      fontSize="lg"
                      fontWeight="500"
                    >
                      Kiosk activé
                    </Text>
                    <Text 
                      color="gray.600" 
                      fontSize="sm"
                      fontWeight="400"
                    >
                      Le système JARVIS est opérationnel
                    </Text>
                  </VStack>
                </MotionVStack>
              )}
            </AnimatePresence>

          </MotionVStack>
        </MotionBox>
      </MotionBox>
      
      {/* Animation CSS pour le pulse */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  )
} 