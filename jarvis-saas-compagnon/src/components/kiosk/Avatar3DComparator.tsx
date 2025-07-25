"use client"
import { useState, useEffect } from 'react'
import { Box, VStack, HStack, Text, Button, Badge, Flex, Card, CardBody } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar3D from './Avatar3D' // Version CSS originale
// import Avatar3D_R3F from './Avatar3D_R3F' // Version R3F basique
// import Avatar3D_R3F_Enhanced from './Avatar3D_R3F_Enhanced' // Version R3F enhanced

interface Avatar3DComparatorProps {
  status?: 'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting'
}

export default function Avatar3DComparator({ status = 'idle' }: Avatar3DComparatorProps) {
  const [currentVersion, setCurrentVersion] = useState<'original' | 'r3f' | 'enhanced'>('original')
  const [showComparison, setShowComparison] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0
  })

  // Versions disponibles
  const versions = [
    {
      id: 'original',
      name: 'CSS Original',
      description: 'Version actuelle CSS/Framer Motion',
      features: ['✨ Animations émotionnelles', '🎨 Effets marbrés CSS', '👁️ Yeux animés', '⚡ Performance stable'],
      pros: ['Léger', 'Compatible partout', 'Stable'],
      cons: ['Limité en 3D', 'Pas de PBR', 'Effets basiques']
    },
    {
      id: 'r3f',
      name: 'React Three Fiber',
      description: 'Version 3D WebGL avec shaders personnalisés',
      features: ['🔮 Vraie 3D WebGL', '🎨 Shaders Perlin noise', '✨ Iridescence réaliste', '⭐ Particules 3D'],
      pros: ['Rendu 3D réel', 'Shaders avancés', 'Qualité supérieure'],
      cons: ['Plus lourd', 'WebGL requis', 'Complexe']
    },
    {
      id: 'enhanced',
      name: 'Enhanced Cinematic',
      description: 'Version complète avec post-processing',
      features: ['🎬 Post-processing', '🌟 Bloom HDR', '🎯 Depth of field', '💎 PBR materials'],
      pros: ['Qualité cinéma', 'Effets photoréalistes', 'Profondeur 3D'],
      cons: ['Très gourmand', 'GPU requis', 'Complexité max']
    }
  ]

  const currentVersionData = versions.find(v => v.id === currentVersion)!

  // Animation de transition entre versions
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.6
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  }

  // Rendu conditionnel des avatars
  const renderAvatar = () => {
    const avatarProps = { status, size: 350 }
    
    switch (currentVersion) {
      case 'original':
        return <Avatar3D {...avatarProps} />
      case 'r3f':
        // return <Avatar3D_R3F {...avatarProps} />
        return (
          <Box 
            width="350px" 
            height="350px" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            borderRadius="50%"
            position="relative"
            overflow="hidden"
          >
            <Text color="white" fontSize="sm" textAlign="center" px={4}>
              🔮 React Three Fiber<br/>
              Version en cours<br/>
              d'installation
            </Text>
            <Box
              position="absolute"
              inset="0"
              bg="radial-gradient(circle, transparent 30%, rgba(255,255,255,0.1) 70%)"
              borderRadius="50%"
            />
          </Box>
        )
      case 'enhanced':
        // return <Avatar3D_R3F_Enhanced {...avatarProps} />
        return (
          <Box 
            width="350px" 
            height="350px" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            bg="linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)"
            borderRadius="50%"
            position="relative"
            overflow="hidden"
          >
            <Text color="white" fontSize="sm" textAlign="center" px={4}>
              🎬 Enhanced Cinematic<br/>
              Version avec post-processing<br/>
              en développement
            </Text>
            {/* Effet shimmer */}
            <motion.div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                borderRadius: '50%'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </Box>
        )
      default:
        return <Avatar3D {...avatarProps} />
    }
  }

  return (
    <Box minH="100vh" bg="#fafafa" py={8}>
      <VStack spacing={8} maxW="1200px" mx="auto" px={6}>
        {/* Header */}
        <VStack spacing={4} textAlign="center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Text fontSize="3xl" fontWeight="bold" color="gray.800">
              🚀 Avatar3D - Comparateur de Versions
            </Text>
            <Text color="gray.600" fontSize="lg" maxW="600px">
              Testez et comparez les différentes implémentations de l'avatar JARVIS
            </Text>
          </motion.div>
        </VStack>

        {/* Sélecteur de versions */}
        <Card bg="white" borderRadius="20px" border="1px solid" borderColor="gray.100" w="full">
          <CardBody>
            <HStack spacing={4} justify="center" wrap="wrap">
              {versions.map((version) => (
                <Button
                  key={version.id}
                  onClick={() => setCurrentVersion(version.id as any)}
                  variant={currentVersion === version.id ? "solid" : "outline"}
                  colorScheme={currentVersion === version.id ? "blue" : "gray"}
                  size="lg"
                  borderRadius="12px"
                  px={6}
                  _hover={{ transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  {version.name}
                </Button>
              ))}
            </HStack>
          </CardBody>
        </Card>

        {/* Interface principale */}
        <HStack spacing={8} align="start" w="full">
          {/* Avatar Display */}
          <Box flex="1">
            <Card bg="white" borderRadius="20px" border="1px solid" borderColor="gray.100">
              <CardBody>
                <VStack spacing={6}>
                  <HStack spacing={3} justify="center">
                    <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
                      {currentVersionData.name}
                    </Badge>
                    <Badge 
                      colorScheme={status === 'speaking' ? 'green' : status === 'listening' ? 'yellow' : 'gray'} 
                      variant="subtle" 
                      px={3} 
                      py={1} 
                      borderRadius="full"
                    >
                      {status}
                    </Badge>
                  </HStack>

                  {/* Avatar Container */}
                  <Box 
                    w="400px" 
                    h="400px" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    position="relative"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentVersion}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {renderAvatar()}
                      </motion.div>
                    </AnimatePresence>
                  </Box>

                  {/* Contrôles de test */}
                  <HStack spacing={3} wrap="wrap" justify="center">
                    {['idle', 'listening', 'speaking', 'thinking', 'connecting'].map((testStatus) => (
                      <Button
                        key={testStatus}
                        onClick={() => setCurrentVersion(currentVersion)} // Force re-render avec nouveau status
                        size="sm"
                        variant={status === testStatus ? "solid" : "outline"}
                        colorScheme="purple"
                        borderRadius="8px"
                      >
                        {testStatus}
                      </Button>
                    ))}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* Informations de version */}
          <Box w="350px">
            <VStack spacing={4} align="stretch">
              {/* Détails de la version */}
              <Card bg="white" borderRadius="16px" border="1px solid" borderColor="gray.100">
                <CardBody>
                  <VStack spacing={4} align="start">
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {currentVersionData.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {currentVersionData.description}
                      </Text>
                    </Box>

                    <Box w="full">
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                        Fonctionnalités :
                      </Text>
                      <VStack spacing={1} align="start">
                        {currentVersionData.features.map((feature, index) => (
                          <Text key={index} fontSize="sm" color="gray.600">
                            {feature}
                          </Text>
                        ))}
                      </VStack>
                    </Box>

                    <HStack spacing={4} w="full">
                      <Box flex="1">
                        <Text fontSize="xs" fontWeight="semibold" color="green.600" mb={1}>
                          ✅ Avantages
                        </Text>
                        {currentVersionData.pros.map((pro, index) => (
                          <Text key={index} fontSize="xs" color="gray.600">
                            • {pro}
                          </Text>
                        ))}
                      </Box>
                      <Box flex="1">
                        <Text fontSize="xs" fontWeight="semibold" color="orange.600" mb={1}>
                          ⚠️ Inconvénients
                        </Text>
                        {currentVersionData.cons.map((con, index) => (
                          <Text key={index} fontSize="xs" color="gray.600">
                            • {con}
                          </Text>
                        ))}
                      </Box>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Métriques de performance */}
              <Card bg="white" borderRadius="16px" border="1px solid" borderColor="gray.100">
                <CardBody>
                  <VStack spacing={3}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      📊 Performance
                    </Text>
                    
                    <VStack spacing={2} w="full">
                      <HStack justify="space-between" w="full">
                        <Text fontSize="sm" color="gray.600">FPS</Text>
                        <Badge colorScheme={performanceMetrics.fps > 50 ? 'green' : performanceMetrics.fps > 30 ? 'yellow' : 'red'}>
                          {performanceMetrics.fps}
                        </Badge>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <Text fontSize="sm" color="gray.600">Mémoire</Text>
                        <Text fontSize="sm" color="gray.800">
                          {performanceMetrics.memoryUsage.toFixed(1)} MB
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <Text fontSize="sm" color="gray.600">Rendu</Text>
                        <Text fontSize="sm" color="gray.800">
                          {performanceMetrics.renderTime.toFixed(1)} ms
                        </Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Actions */}
              <Card bg="white" borderRadius="16px" border="1px solid" borderColor="gray.100">
                <CardBody>
                  <VStack spacing={3}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      🎯 Actions
                    </Text>
                    
                    <Button
                      onClick={() => setShowComparison(!showComparison)}
                      variant="outline"
                      colorScheme="blue"
                      size="sm"
                      w="full"
                      borderRadius="8px"
                    >
                      {showComparison ? 'Masquer' : 'Afficher'} Comparaison
                    </Button>
                    
                    <Button
                      variant="solid"
                      colorScheme="green"
                      size="sm"
                      w="full"
                      borderRadius="8px"
                      isDisabled={currentVersion !== 'original'}
                    >
                      Adopter cette version
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Box>
        </HStack>

        {/* Comparaison côte à côte */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card bg="white" borderRadius="20px" border="1px solid" borderColor="gray.100" w="full">
                <CardBody>
                  <VStack spacing={6}>
                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                      🔍 Comparaison Visuelle
                    </Text>
                    
                    <HStack spacing={8} justify="center" wrap="wrap">
                      {versions.map((version) => (
                        <VStack key={version.id} spacing={3}>
                          <Badge colorScheme="gray" variant="subtle" px={3} py={1}>
                            {version.name}
                          </Badge>
                          <Box w="200px" h="200px" bg="gray.50" borderRadius="12px" display="flex" alignItems="center" justifyContent="center">
                            <Text fontSize="sm" color="gray.500" textAlign="center">
                              Preview<br/>{version.name}
                            </Text>
                          </Box>
                        </VStack>
                      ))}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </VStack>
    </Box>
  )
} 