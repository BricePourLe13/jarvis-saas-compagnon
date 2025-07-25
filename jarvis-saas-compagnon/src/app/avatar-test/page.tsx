"use client"
import { useState } from 'react'
import { Box, Container, VStack, HStack, Text, Button, Badge, Card, CardBody } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import Avatar3DComparator from '@/components/kiosk/Avatar3DComparator'

export default function Avatar3DTestPage() {
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting'>('idle')
  const [autoTransition, setAutoTransition] = useState(false)

  // Cycle automatique des états pour démonstration
  const statusCycle = ['idle', 'listening', 'thinking', 'speaking', 'connecting'] as const
  
  const handleAutoTransition = () => {
    if (!autoTransition) {
      setAutoTransition(true)
      const interval = setInterval(() => {
        setCurrentStatus(prev => {
          const currentIndex = statusCycle.indexOf(prev)
          const nextIndex = (currentIndex + 1) % statusCycle.length
          return statusCycle[nextIndex]
        })
      }, 3000) // Change toutes les 3 secondes

      // Arrêt automatique après un cycle complet
      setTimeout(() => {
        clearInterval(interval)
        setAutoTransition(false)
      }, statusCycle.length * 3000)
    }
  }

  return (
    <Box minH="100vh" bg="#fafafa">
      {/* Header */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.100" py={4}>
        <Container maxW="7xl">
          <HStack spacing={4} justify="space-between">
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                🧪 Avatar3D - Laboratoire de Tests
              </Text>
              <Text color="gray.600" fontSize="sm">
                Testez et comparez les différentes implémentations de l'avatar JARVIS
              </Text>
            </VStack>
            
            <HStack spacing={3}>
              <Badge colorScheme="blue" variant="subtle" px={3} py={2} borderRadius="full">
                Status: {currentStatus}
              </Badge>
              <Button
                onClick={handleAutoTransition}
                colorScheme="purple"
                variant="outline"
                size="sm"
                isDisabled={autoTransition}
                borderRadius="full"
              >
                {autoTransition ? 'Demo en cours...' : '🎬 Démo Auto'}
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Contrôles de status */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.100" py={4}>
        <Container maxW="7xl">
          <VStack spacing={4}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.700">
              🎭 Contrôle des États Émotionnels
            </Text>
            
            <HStack spacing={3} wrap="wrap" justify="center">
              {statusCycle.map((status) => (
                <Button
                  key={status}
                  onClick={() => setCurrentStatus(status)}
                  variant={currentStatus === status ? "solid" : "outline"}
                  colorScheme={currentStatus === status ? "blue" : "gray"}
                  size="md"
                  borderRadius="12px"
                  px={6}
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                  isDisabled={autoTransition}
                >
                  {status === 'idle' && '😌 Repos'}
                  {status === 'listening' && '👂 Écoute'}
                  {status === 'speaking' && '🗣️ Parole'}
                  {status === 'thinking' && '🤔 Réflexion'}
                  {status === 'connecting' && '🔗 Connexion'}
                </Button>
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Comparateur principal */}
      <Container maxW="none" py={8}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Avatar3DComparator status={currentStatus} />
        </motion.div>
      </Container>

      {/* Informations techniques */}
      <Box bg="white" borderTop="1px solid" borderColor="gray.100" py={8}>
        <Container maxW="7xl">
          <VStack spacing={6}>
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              📋 Informations Techniques
            </Text>
            
            <HStack spacing={8} align="start" wrap="wrap" justify="center">
              {/* CSS Original */}
              <Card bg="white" borderRadius="16px" border="1px solid" borderColor="gray.100" w="300px">
                <CardBody>
                  <VStack spacing={3} align="start">
                    <Badge colorScheme="green" variant="subtle" px={3} py={1}>
                      ✅ CSS Original
                    </Badge>
                    <Text fontSize="sm" color="gray.600">
                      Version actuelle stable utilisant CSS pure et Framer Motion pour les animations.
                    </Text>
                    <VStack spacing={1} align="start" fontSize="xs" color="gray.500">
                      <Text>• 587 lignes de code</Text>
                      <Text>• Système émotionnel complet</Text>
                      <Text>• Compatible tous navigateurs</Text>
                      <Text>• Performance: ⭐⭐⭐⭐⭐</Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* React Three Fiber */}
              <Card bg="white" borderRadius="16px" border="1px solid" borderColor="gray.100" w="300px">
                <CardBody>
                  <VStack spacing={3} align="start">
                    <Badge colorScheme="blue" variant="subtle" px={3} py={1}>
                      🔮 React Three Fiber
                    </Badge>
                    <Text fontSize="sm" color="gray.600">
                      Version 3D WebGL avec shaders personnalisés et rendu photoréaliste.
                    </Text>
                    <VStack spacing={1} align="start" fontSize="xs" color="gray.500">
                      <Text>• Vraie géométrie 3D</Text>
                      <Text>• Shaders Perlin noise</Text>
                      <Text>• Particules volumétriques</Text>
                      <Text>• Performance: ⭐⭐⭐⭐</Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Enhanced Cinematic */}
              <Card bg="white" borderRadius="16px" border="1px solid" borderColor="gray.100" w="300px">
                <CardBody>
                  <VStack spacing={3} align="start">
                    <Badge colorScheme="purple" variant="subtle" px={3} py={1}>
                      🎬 Enhanced Cinematic
                    </Badge>
                    <Text fontSize="sm" color="gray.600">
                      Version complète avec post-processing bloom, depth-of-field et PBR materials.
                    </Text>
                    <VStack spacing={1} align="start" fontSize="xs" color="gray.500">
                      <Text>• Post-processing HDR</Text>
                      <Text>• Matériaux PBR</Text>
                      <Text>• Éclairage cinématographique</Text>
                      <Text>• Performance: ⭐⭐⭐</Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </HStack>

            {/* Instructions */}
            <Card bg="gray.50" borderRadius="16px" w="full" maxW="800px">
              <CardBody>
                <VStack spacing={4}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                    🎯 Comment tester
                  </Text>
                  
                  <VStack spacing={2} align="start" fontSize="sm" color="gray.600">
                    <Text>1. **Changez d'état émotionnel** : Utilisez les boutons ci-dessus pour voir les transitions</Text>
                    <Text>2. **Comparez les versions** : Sélectionnez différentes implémentations dans le comparateur</Text>
                    <Text>3. **Testez la performance** : Observez les métriques FPS et mémoire en temps réel</Text>
                    <Text>4. **Mode démo automatique** : Lancez le cycle automatique pour voir toutes les émotions</Text>
                    <Text>5. **Tests de compatibilité** : Vérifiez le fonctionnement sur différents devices</Text>
                  </VStack>

                  <Box bg="blue.50" borderRadius="8px" p={3} w="full">
                    <Text fontSize="sm" color="blue.800" fontWeight="medium">
                      💡 <strong>Astuce :</strong> Les versions React Three Fiber nécessitent WebGL. Si vous voyez des placeholders, 
                      c'est que les dépendances ne sont pas encore installées ou que WebGL n'est pas supporté.
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
} 