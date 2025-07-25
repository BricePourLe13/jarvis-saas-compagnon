'use client'

import { useState, useEffect } from 'react'
import { Box, Button, Text, VStack, HStack, Badge, Alert, AlertIcon } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'

interface BrowserPermissionsFallbackProps {
  onPermissionGranted: () => void
  onPermissionDenied: () => void
  isVisible: boolean
}

// ✅ SOLUTION 3: Browser Permissions Fallback Component
export default function BrowserPermissionsFallback({
  onPermissionGranted,
  onPermissionDenied,
  isVisible
}: BrowserPermissionsFallbackProps) {
  const [browserInfo, setBrowserInfo] = useState<any>(null)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'checking' | 'blocked' | 'granted'>('unknown')
  const [troubleshootingStep, setTroubleshootingStep] = useState(0)

  // ✅ Detect browser and check permissions on mount
  useEffect(() => {
    if (isVisible) {
      const browser = detectBrowserClient()
      setBrowserInfo(browser)
      checkPermissionsStatus()
    }
  }, [isVisible])

  // ✅ Client-side browser detection
  const detectBrowserClient = () => {
    const userAgent = navigator.userAgent
    
    if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
      return {
        name: 'Chrome',
        version: parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || '0'),
        supportsPermissions: 'permissions' in navigator,
        hasMediaDevices: 'mediaDevices' in navigator
      }
    }
    
    if (/Firefox/.test(userAgent)) {
      return {
        name: 'Firefox', 
        version: parseInt(userAgent.match(/Firefox\/(\d+)/)?.[1] || '0'),
        supportsPermissions: 'permissions' in navigator,
        hasMediaDevices: 'mediaDevices' in navigator
      }
    }
    
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      return {
        name: 'Safari',
        version: parseInt(userAgent.match(/Version\/(\d+)/)?.[1] || '0'),
        supportsPermissions: 'permissions' in navigator,
        hasMediaDevices: 'mediaDevices' in navigator
      }
    }
    
    if (/Edg/.test(userAgent)) {
      return {
        name: 'Edge',
        version: parseInt(userAgent.match(/Edg\/(\d+)/)?.[1] || '0'),
        supportsPermissions: 'permissions' in navigator,
        hasMediaDevices: 'mediaDevices' in navigator
      }
    }
    
    return {
      name: 'Unknown',
      version: 0,
      supportsPermissions: false,
      hasMediaDevices: false
    }
  }

  // ✅ Check current permissions status
  const checkPermissionsStatus = async () => {
    setPermissionStatus('checking')
    
    try {
      // Method 1: Try navigator.permissions API
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        console.log('🎤 Permission status via Permissions API:', result.state)
        
        if (result.state === 'granted') {
          setPermissionStatus('granted')
          onPermissionGranted()
          return
        } else if (result.state === 'denied') {
          setPermissionStatus('blocked')
          return
        }
      }
      
      // Method 2: Try getUserMedia directly
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          console.log('🎤 Permission granted via getUserMedia')
          stream.getTracks().forEach(track => track.stop()) // Cleanup
          setPermissionStatus('granted')
          onPermissionGranted()
          return
        } catch (error: any) {
          console.log('🎤 Permission denied via getUserMedia:', error.name)
          if (error.name === 'NotAllowedError') {
            setPermissionStatus('blocked')
            return
          }
        }
      }
      
      // If we get here, permissions are unknown/problematic
      setPermissionStatus('blocked')
      
    } catch (error) {
      console.error('🎤 Error checking permissions:', error)
      setPermissionStatus('blocked')
    }
  }

  // ✅ Manual permission request with user gesture
  const requestPermissionsWithGesture = async () => {
    try {
      console.log('🎤 Requesting permissions with user gesture...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('🎤 Permission granted!')
      
      // Cleanup stream
      stream.getTracks().forEach(track => track.stop())
      
      setPermissionStatus('granted')
      onPermissionGranted()
    } catch (error: any) {
      console.error('🎤 Permission request failed:', error)
      setPermissionStatus('blocked')
      setTroubleshootingStep(1)
    }
  }

  // ✅ Get browser-specific instructions
  const getBrowserInstructions = () => {
    switch (browserInfo?.name) {
      case 'Chrome':
        return {
          icon: '🌐',
          steps: [
            'Cliquez sur l\'icône de cadenas/paramètres à gauche de l\'URL',
            'Autorisez l\'accès au microphone pour ce site',
            'Rechargez la page'
          ],
          note: 'Chrome bloque les permissions microphone par défaut pour la sécurité'
        }
      
      case 'Firefox':
        return {
          icon: '🦊',
          steps: [
            'Cliquez sur l\'icône bouclier à gauche de l\'URL',
            'Désactivez la protection pour ce site',
            'Autorisez l\'accès au microphone',
            'Rechargez la page'
          ],
          note: 'Firefox Enhanced Tracking Protection peut bloquer le microphone'
        }
      
      case 'Safari':
        return {
          icon: '🧭',
          steps: [
            'Menu Safari > Préférences > Sites web',
            'Sélectionnez Microphone dans la liste',
            'Autorisez pour ce site',
            'Rechargez la page'
          ],
          note: 'Safari nécessite une activation manuelle dans les préférences'
        }
      
      case 'Edge':
        return {
          icon: '🔵',
          steps: [
            'Cliquez sur l\'icône de cadenas à gauche de l\'URL',
            'Gérez les permissions pour ce site',
            'Autorisez l\'accès au microphone',
            'Rechargez la page'
          ],
          note: 'Edge utilise les mêmes paramètres que Chrome'
        }
      
      default:
        return {
          icon: '❓',
          steps: [
            'Vérifiez les paramètres de permissions de votre navigateur',
            'Autorisez l\'accès au microphone pour ce site',
            'Rechargez la page'
          ],
          note: 'Consultez la documentation de votre navigateur pour les permissions'
        }
    }
  }

  const instructions = getBrowserInstructions()

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          maxWidth: '580px',
          width: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        <VStack spacing={6} align="center">
          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <Text fontSize="2xl" fontWeight="600" color="white">
              {instructions.icon} Permissions Microphone
            </Text>
            
            {browserInfo && (
              <HStack>
                <Badge colorScheme="blue" variant="subtle">
                  {browserInfo.name} {browserInfo.version}
                </Badge>
                <Badge colorScheme={permissionStatus === 'granted' ? 'green' : permissionStatus === 'blocked' ? 'red' : 'yellow'}>
                  {permissionStatus === 'granted' ? 'Autorisé' : 
                   permissionStatus === 'blocked' ? 'Bloqué' : 
                   permissionStatus === 'checking' ? 'Vérification...' : 'Inconnu'}
                </Badge>
              </HStack>
            )}
          </VStack>

          {/* Status message */}
          {permissionStatus === 'checking' && (
            <Alert status="info" bg="rgba(59, 130, 246, 0.1)" borderColor="blue.500">
              <AlertIcon color="blue.400" />
              <Text color="blue.200">Vérification des permissions en cours...</Text>
            </Alert>
          )}

          {permissionStatus === 'blocked' && (
            <Alert status="warning" bg="rgba(251, 146, 60, 0.1)" borderColor="orange.500">
              <AlertIcon color="orange.400" />
              <Text color="orange.200">
                Les permissions microphone sont bloquées ou indisponibles.
              </Text>
            </Alert>
          )}

          {/* Try again button */}
          {permissionStatus !== 'checking' && permissionStatus !== 'granted' && (
            <Button
              onClick={requestPermissionsWithGesture}
              bg="linear-gradient(135deg, #3b82f6, #8b5cf6)"
              color="white"
              size="lg"
              px={8}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
              }}
            >
              🎤 Essayer d'autoriser le microphone
            </Button>
          )}

          {/* Browser-specific instructions */}
          {permissionStatus === 'blocked' && troubleshootingStep >= 1 && (
            <Box w="full">
              <Text fontSize="lg" fontWeight="600" color="white" mb={4}>
                Instructions pour {browserInfo?.name || 'votre navigateur'} :
              </Text>
              
              <VStack spacing={3} align="stretch">
                {instructions.steps.map((step, index) => (
                  <HStack key={index} align="flex-start" spacing={3}>
                    <Badge colorScheme="blue" minW="20px" textAlign="center">
                      {index + 1}
                    </Badge>
                    <Text color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                      {step}
                    </Text>
                  </HStack>
                ))}
              </VStack>

              <Alert status="info" mt={4} bg="rgba(59, 130, 246, 0.1)" borderColor="blue.500">
                <AlertIcon color="blue.400" />
                <Text color="blue.200" fontSize="sm">
                  {instructions.note}
                </Text>
              </Alert>
            </Box>
          )}

          {/* Action buttons */}
          <HStack spacing={4}>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              borderColor="rgba(255, 255, 255, 0.3)"
              color="white"
              _hover={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bg: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              🔄 Recharger la page
            </Button>
            
            <Button
              onClick={onPermissionDenied}
              variant="ghost"
              color="rgba(255, 255, 255, 0.6)"
              _hover={{
                color: 'white',
                bg: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              ❌ Continuer sans micro
            </Button>
          </HStack>

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && browserInfo && (
            <Box w="full" mt={4} p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="md">
              <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" fontFamily="mono">
                Debug: {browserInfo.name} v{browserInfo.version} | 
                Permissions API: {browserInfo.supportsPermissions ? '✅' : '❌'} | 
                MediaDevices: {browserInfo.hasMediaDevices ? '✅' : '❌'}
              </Text>
            </Box>
          )}
        </VStack>
      </motion.div>

      {/* Background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999
        }}
        onClick={onPermissionDenied}
      />
    </AnimatePresence>
  )
} 