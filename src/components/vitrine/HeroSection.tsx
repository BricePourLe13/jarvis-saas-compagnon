'use client'

import { Box, VStack, HStack, Text, Grid, Flex, Container } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import JarvisAvatar from '@/components/common/JarvisAvatar'
import ParticleBackground from './ParticleBackground'
import AnimatedText from './AnimatedText'
import { 
  VitrineSection, 
  VitrineHeading, 
  VitrineText, 
  VitrineButton,
  SpectacularReveal,
  FloatingElement,
  GlowingOrb,
  vitrineTheme 
} from './VitrineDesignSystem'

// 🌟 MÉTRIQUES ANIMÉES
const AnimatedMetric = ({ value, label, delay = 0 }: { value: string, label: string, delay?: number }) => {
  const [displayValue, setDisplayValue] = useState('0')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: delay + 0.5 }}
    >
      <VStack spacing={1}>
        <Text 
          fontSize={{ base: 'xl', md: '2xl' }} 
          fontWeight="800" 
          color={vitrineTheme.colors.primary[600]}
        >
          {displayValue}
        </Text>
        <Text 
          fontSize="sm" 
          color={vitrineTheme.colors.gray[500]} 
          textTransform="uppercase" 
          letterSpacing="wider"
        >
          {label}
        </Text>
      </VStack>
    </motion.div>
  )
}

// 🎭 PARTICULES FLOTTANTES
const FloatingParticles = () => (
  <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: '4px',
          height: '4px',
          backgroundColor: vitrineTheme.colors.primary[400],
          borderRadius: '50%',
          opacity: 0.6
        }}
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10],
          opacity: [0.3, 0.8, 0.3],
          scale: [0.5, 1.2, 0.5]
        }}
        transition={{
          duration: 4 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 2,
          ease: "easeInOut"
        }}
      />
    ))}
  </Box>
)

// 🌊 VAGUES ANIMÉES EN ARRIÈRE-PLAN
const AnimatedWaves = () => (
  <Box position="absolute" inset={0} overflow="hidden" opacity={0.1}>
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        style={{
          position: 'absolute',
          bottom: `-${i * 20}%`,
          left: 0,
          right: 0,
          height: '200%',
          background: `linear-gradient(45deg, ${vitrineTheme.colors.primary[500]}, ${vitrineTheme.colors.primary[300]})`,
          borderRadius: '50%',
          transform: 'scale(2)'
        }}
        animate={{
          rotate: [0, 360],
          scale: [1.8, 2.2, 1.8]
        }}
        transition={{
          duration: 20 + i * 5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    ))}
  </Box>
)

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <Box
      id="hero"
      bg="transparent"
      position="relative"
      overflow="hidden"
      minH="100vh"
      display="flex"
      alignItems="center"
      pt="70px"
    >
      {/* Effets visuels d'arrière-plan */}
      <ParticleBackground />
      <AnimatedWaves />
      <FloatingParticles />
      
      {/* Orbes lumineux */}
      <GlowingOrb size={300} top="10%" left="10%" />
      <GlowingOrb size={200} bottom="20%" right="15%" color={vitrineTheme.colors.primary[300]} />
      
      <Container maxW="7xl" px={6}>
        <Grid 
          templateColumns={{ base: "1fr", lg: "1fr 1fr" }} 
          gap={12} 
          alignItems="center"
          minH="80vh"
          position="relative"
          zIndex={1}
        >
        {/* Colonne gauche - Contenu textuel */}
        <VStack spacing={8} align={{ base: "center", lg: "start" }} textAlign={{ base: "center", lg: "left" }}>
          
          {/* Badge "Nouveau" */}
          <SpectacularReveal delay={0.2}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Box
                bg={vitrineTheme.colors.primary[50]}
                color={vitrineTheme.colors.primary[700]}
                px={4}
                py={2}
                borderRadius="full"
                border="1px solid"
                borderColor={vitrineTheme.colors.primary[200]}
                fontSize="sm"
                fontWeight="600"
              >
                🚀 Nouvelle génération d'IA conversationnelle
              </Box>
            </motion.div>
          </SpectacularReveal>

          {/* Titre principal */}
          <SpectacularReveal delay={0.4}>
            <AnimatedText 
              variant="gradient" 
              delay={0.4}
              fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
              fontWeight="800"
              lineHeight="1.1"
              letterSpacing="-0.02em"
              textAlign="center"
            >
              L'Intelligence Artificielle qui Révolutionne l'Expérience Client
            </AnimatedText>
          </SpectacularReveal>

          {/* Sous-titre */}
          <SpectacularReveal delay={0.6}>
            <VitrineText variant="subtitle" maxW="600px">
              JARVIS transforme vos espaces physiques en environnements intelligents. 
              Salles de sport, musées, centres commerciaux : offrez une expérience client 
              personnalisée 24h/24 grâce à notre IA conversationnelle avancée.
            </VitrineText>
          </SpectacularReveal>

          {/* Métriques */}
          <SpectacularReveal delay={0.8}>
            <HStack spacing={8} flexWrap="wrap" justify={{ base: "center", lg: "start" }}>
              <AnimatedMetric value="50+" label="Établissements" delay={1} />
              <AnimatedMetric value="98%" label="Satisfaction" delay={1.2} />
              <AnimatedMetric value="24/7" label="Disponibilité" delay={1.4} />
            </HStack>
          </SpectacularReveal>

          {/* Boutons d'action */}
          <SpectacularReveal delay={1}>
            <VStack spacing={4} w="full">
              <HStack spacing={4} flexWrap="wrap" justify={{ base: "center", lg: "start" }}>
                <VitrineButton 
                  variant="gradient" 
                  spectacle 
                  size="lg"
                  rightIcon={
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  }
                >
                  Découvrir la Démo
                </VitrineButton>
                
                <VitrineButton variant="secondary" size="lg">
                  Parler à un Expert
                </VitrineButton>
              </HStack>
              
              <Text fontSize="sm" color={vitrineTheme.colors.gray[500]}>
                ✨ Démo interactive disponible • Sans engagement
              </Text>
            </VStack>
          </SpectacularReveal>
        </VStack>

        {/* Colonne droite - Espace pour la sphère qui suit le scroll */}
        <Flex justify="center" align="center" position="relative" minH="400px">
          <SpectacularReveal delay={0.8}>
            <Box 
              position="relative"
              w="300px"
              h="300px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* Indication subtile de l'emplacement de la sphère */}
              <Box
                w="200px"
                h="200px"
                borderRadius="50%"
                border="2px dashed"
                borderColor={vitrineTheme.colors.gray[300]}
                opacity={0.2}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="sm"
                color={vitrineTheme.colors.gray[400]}
                textAlign="center"
                fontStyle="italic"
              >
                JARVIS vous suit
                <br />
                pendant votre navigation
              </Box>
            </Box>
          </SpectacularReveal>
        </Flex>
        </Grid>
      </Container>

      {/* Indicateur de scroll */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <VStack spacing={2} opacity={0.6}>
          <Text fontSize="sm" color={vitrineTheme.colors.gray[600]}>
            Découvrir nos solutions
          </Text>
          <Box
            w="2px"
            h="30px"
            bg={vitrineTheme.colors.gray[400]}
            borderRadius="full"
          />
        </VStack>
      </motion.div>
    </Box>
  )
}
