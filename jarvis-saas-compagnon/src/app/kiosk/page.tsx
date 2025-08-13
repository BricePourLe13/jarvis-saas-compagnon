"use client"
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack,
  HStack,
  Icon,
  Button,
  Badge,
  Circle,
  Flex
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Mic, Users, Zap, Play, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.1, 0.25, 1] as any
    } 
  }
}

const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: [0.25, 0.1, 0.25, 1] as any
  }
}

const kioskFeatures = [
  {
    icon: Mic,
    title: "Assistant vocal",
    description: "Interaction naturelle par la voix",
    color: "brand.500"
  },
  {
    icon: Users,
    title: "Accès par badge",
    description: "Identification sécurisée des membres",
    color: "green.500"
  },
  {
    icon: Zap,
    title: "Réponse instantanée",
    description: "IA conversationnelle en temps réel",
    color: "yellow.500"
  }
]

export default function KioskPage() {
  const [isActive, setIsActive] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
<Box minH="100vh" bg="bg.subtle" py={8}>
      <Container maxW="6xl">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
              }
            }
          }}
        >
          {/* Header avec status */}
          <motion.div variants={fadeInUp}>
            <VStack spacing={6} textAlign="center" mb={16}>
              <HStack spacing={3}>
                <Circle 
                  size="16px" 
                  bg={isActive ? "green.400" : "gray.300"}
                  position="relative"
                >
                  {isActive && (
                    <motion.div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.3)',
                      }}
                      animate={pulse}
                    />
                  )}
                </Circle>
                <Badge 
                  colorScheme={isActive ? "green" : "gray"} 
                  variant="subtle" 
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {isActive ? "En ligne" : "Hors ligne"}
                </Badge>
              </HStack>
              
              <Box
                p={6}
                borderRadius="24px"
                bg="white"
                border="1px solid"
                borderColor="gray.100"
                boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.04)"
              >
                <Icon as={Monitor} boxSize={12} color="brand.500" />
              </Box>
              
              <VStack spacing={3}>
                <Heading 
                  as="h1" 
                  size="2xl" 
                  color="gray.800" 
                  fontWeight="bold"
                  letterSpacing="-0.025em"
                >
                  Kiosk JARVIS
                </Heading>
                <Text color="gray.600" fontSize="lg" maxW="2xl" textAlign="center">
                  Interface interactive pour les membres de votre salle de sport. 
                  Assistant vocal intelligent et personnalisé.
                </Text>
              </VStack>
            </VStack>
          </motion.div>

          {/* Interface principale */}
          <motion.div variants={fadeInUp}>
            <Box
              bg="white"
              borderRadius="32px"
              p={12}
              boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              border="1px solid"
              borderColor="gray.100"
              position="relative"
              overflow="hidden"
              mb={12}
            >
              {/* Gradient subtil */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="4px"
                bgGradient="linear(to-r, brand.400, green.400, brand.400)"
              />
              
              <VStack spacing={8} textAlign="center">
                <VStack spacing={4}>
                  <Heading 
                    as="h2" 
                    size="xl" 
                    color="gray.800"
                    fontWeight="semibold"
                  >
                    Prêt à vous aider
                  </Heading>
                  <Text color="gray.600" fontSize="lg" maxW="md">
                    Approchez votre badge ou appuyez pour commencer une conversation
                  </Text>
                </VStack>
                
                <Box position="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsActive(!isActive)}
                  >
                    <Circle
                      size="120px"
                      bg="brand.500"
                      color="white"
                      cursor="pointer"
                      boxShadow="0 10px 15px -3px rgba(37, 99, 235, 0.3)"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        bg: "brand.600",
                        boxShadow: "0 20px 25px -5px rgba(37, 99, 235, 0.4)"
                      }}
                    >
                      <Icon as={isActive ? Settings : Play} boxSize={10} />
                    </Circle>
                  </motion.div>
                  
                  {/* Ondulation */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ scale: 1, opacity: 0 }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          border: '2px solid #2563eb',
                          borderRadius: '50%',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </AnimatePresence>
                </Box>
                
                <Text 
                  color="gray.500" 
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {isActive ? "Écoute en cours..." : "Appuyez pour activer"}
                </Text>
              </VStack>
            </Box>
          </motion.div>

          {/* Fonctionnalités */}
          <motion.div variants={fadeInUp}>
            <VStack spacing={6} mb={12}>
              <Heading 
                as="h3" 
                size="lg" 
                color="gray.800" 
                textAlign="center"
                fontWeight="semibold"
              >
                Fonctionnalités
              </Heading>
              
              <VStack spacing={4} w="full">
                {kioskFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.6 + index * 0.1 
                    }}
                    style={{ width: '100%' }}
                  >
                    <Box
                      bg="white"
                      p={6}
                      borderRadius="20px"
                      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.04)"
                      border="1px solid"
                      borderColor="gray.100"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.06)",
                        transform: "translateY(-2px)"
                      }}
                    >
                      <Flex align="center" gap={4}>
                        <Box
                          p={3}
                          borderRadius="12px"
                          bg={`${feature.color.split('.')[0]}.50`}
                        >
                          <Icon 
                            as={feature.icon} 
                            boxSize={6} 
                            color={feature.color}
                          />
                        </Box>
                        
                        <VStack align="start" spacing={1} flex={1}>
                          <Text 
                            fontWeight="semibold" 
                            fontSize="lg" 
                            color="gray.800"
                          >
                            {feature.title}
                          </Text>
                          <Text 
                            color="gray.600" 
                            fontSize="md"
                          >
                            {feature.description}
                          </Text>
                        </VStack>
                      </Flex>
                    </Box>
                  </motion.div>
                ))}
              </VStack>
            </VStack>
          </motion.div>

          {/* Status technique */}
          <motion.div variants={fadeInUp}>
            <Box
              bg="white"
              borderRadius="20px"
              p={6}
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.04)"
              border="1px solid"
              borderColor="gray.100"
            >
              <VStack spacing={4}>
                <Heading 
                  as="h4" 
                  size="md" 
                  color="gray.800"
                  fontWeight="semibold"
                >
                  État du système
                </Heading>
                
                <HStack spacing={6} w="full" justify="center" flexWrap="wrap">
                  <VStack spacing={1}>
                    <Circle size="12px" bg="green.400" />
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      API
                    </Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Circle size="12px" bg="green.400" />
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      Audio
                    </Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Circle size="12px" bg="yellow.400" />
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      RFID
                    </Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Circle size="12px" bg="green.400" />
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      Réseau
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  )
}
