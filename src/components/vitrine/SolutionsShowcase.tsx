'use client'

import { Box, VStack, HStack, Text, Grid, Badge, Icon, Flex, Container } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FaDumbbell, FaBuildingColumns, FaRocket, FaChartLine, FaClock, FaUsers } from 'react-icons/fa'
import { InteractiveSolutionCard } from './InteractiveCard'
import AnimatedText from './AnimatedText'
import { 
  VitrineSection, 
  VitrineHeading, 
  VitrineText, 
  VitrineButton,
  SpectacularReveal,
  FloatingElement,
  vitrineTheme 
} from './VitrineDesignSystem'

// 🏋️ SOLUTION CARD COMPONENT
const SolutionCard = ({ 
  title, 
  subtitle, 
  description, 
  icon, 
  features, 
  status = 'available',
  mockupImage,
  gradient,
  delay = 0 
}: any) => {
  const isComingSoon = status === 'coming-soon'
  
  return (
    <SpectacularReveal delay={delay}>
      <motion.div
        whileHover={{ y: -10, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          bg="white"
          borderRadius="2xl"
          p={8}
          shadow="xl"
          border="1px solid"
          borderColor={vitrineTheme.colors.gray[200]}
          position="relative"
          overflow="hidden"
          h="full"
          opacity={isComingSoon ? 0.8 : 1}
        >
          {/* Gradient d'arrière-plan */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="4px"
            bgGradient={gradient}
          />
          
          {/* Badge de statut */}
          {isComingSoon && (
            <Badge
              position="absolute"
              top={4}
              right={4}
              colorScheme="purple"
              variant="solid"
              borderRadius="full"
              px={3}
              py={1}
            >
              Bientôt disponible
            </Badge>
          )}

          <VStack spacing={6} align="start" h="full">
            {/* Icône et titre */}
            <HStack spacing={4}>
              <Box
                p={3}
                borderRadius="xl"
                bgGradient={gradient}
                color="white"
              >
                <Icon as={icon} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="800" color={vitrineTheme.colors.gray[800]}>
                  {title}
                </Text>
                <Text fontSize="md" color={vitrineTheme.colors.primary[600]} fontWeight="600">
                  {subtitle}
                </Text>
              </VStack>
            </HStack>

            {/* Description */}
            <Text color={vitrineTheme.colors.gray[600]} lineHeight="1.6">
              {description}
            </Text>

            {/* Mockup/Illustration */}
            <Box
              w="full"
              h="200px"
              bg={vitrineTheme.colors.gray[100]}
              borderRadius="xl"
              position="relative"
              overflow="hidden"
            >
              {/* Simulation d'interface */}
              <Box position="absolute" inset={0} p={4}>
                <VStack spacing={3} align="start">
                  <HStack spacing={2}>
                    <Box w="3" h="3" bg="red.400" borderRadius="full" />
                    <Box w="3" h="3" bg="yellow.400" borderRadius="full" />
                    <Box w="3" h="3" bg="green.400" borderRadius="full" />
                  </HStack>
                  <Box w="full" h="2" bg={vitrineTheme.colors.gray[300]} borderRadius="sm" />
                  <Box w="80%" h="2" bg={vitrineTheme.colors.gray[300]} borderRadius="sm" />
                  <Box w="60%" h="2" bg={vitrineTheme.colors.primary[300]} borderRadius="sm" />
                </VStack>
              </Box>
              
              {isComingSoon && (
                <Flex
                  position="absolute"
                  inset={0}
                  bg="rgba(0,0,0,0.7)"
                  align="center"
                  justify="center"
                  color="white"
                  fontSize="lg"
                  fontWeight="600"
                >
                  Aperçu bientôt disponible
                </Flex>
              )}
            </Box>

            {/* Features */}
            <VStack spacing={3} align="start" flex={1}>
              {features.map((feature: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 * index }}
                >
                  <HStack spacing={3}>
                    <Box
                      w="2"
                      h="2"
                      bg={vitrineTheme.colors.primary[500]}
                      borderRadius="full"
                    />
                    <Text fontSize="sm" color={vitrineTheme.colors.gray[600]}>
                      {feature}
                    </Text>
                  </HStack>
                </motion.div>
              ))}
            </VStack>

            {/* CTA Button */}
            <VitrineButton
              variant={isComingSoon ? "secondary" : "primary"}
              w="full"
              isDisabled={isComingSoon}
            >
              {isComingSoon ? "Être notifié du lancement" : "Découvrir la solution"}
            </VitrineButton>
          </VStack>
        </Box>
      </motion.div>
    </SpectacularReveal>
  )
}

// 📊 STATS SECTION
const StatsSection = () => {
  const stats = [
    { icon: FaUsers, value: "50+", label: "Établissements connectés" },
    { icon: FaChartLine, value: "98%", label: "Satisfaction client" },
    { icon: FaClock, value: "24/7", label: "Disponibilité IA" },
    { icon: FaRocket, value: "<2s", label: "Temps de réponse" }
  ]

  return (
    <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={8}>
      {stats.map((stat, index) => (
        <SpectacularReveal key={index} delay={0.2 * index}>
          <VStack spacing={3} textAlign="center">
            <Box
              p={4}
              borderRadius="xl"
              bg={vitrineTheme.colors.primary[50]}
              color={vitrineTheme.colors.primary[600]}
            >
              <Icon as={stat.icon} boxSize={6} />
            </Box>
            <Text fontSize="2xl" fontWeight="800" color={vitrineTheme.colors.gray[800]}>
              {stat.value}
            </Text>
            <Text fontSize="sm" color={vitrineTheme.colors.gray[600]} textAlign="center">
              {stat.label}
            </Text>
          </VStack>
        </SpectacularReveal>
      ))}
    </Grid>
  )
}

export default function SolutionsShowcase() {
  const solutions = [
    {
      title: "JARVIS Fitness",
      subtitle: "Intelligence pour salles de sport",
      description: "Révolutionnez l'expérience de vos membres avec un assistant IA qui connaît leurs objectifs, répond à leurs questions et les motive 24h/24.",
      icon: FaDumbbell,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      features: [
        "Accueil personnalisé par badge RFID",
        "Conseils d'entraînement adaptatifs",
        "Suivi des objectifs en temps réel",
        "Gestion des réservations vocales",
        "Analytics de satisfaction avancés"
      ],
      status: "available"
    },
    {
      title: "JARVIS Museums",
      subtitle: "Guide IA pour espaces culturels",
      description: "Transformez la visite de vos expositions avec un guide virtuel intelligent qui s'adapte aux intérêts de chaque visiteur.",
      icon: FaBuildingColumns,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      features: [
        "Guides personnalisés par œuvre",
        "Parcours adaptatifs intelligents",
        "Informations contextuelles riches",
        "Support multilingue avancé",
        "Analytics de parcours visiteurs"
      ],
      status: "coming-soon"
    }
  ]

  return (
          <Box id="solutions" bg="transparent" py={{ base: 20, md: 32 }} minH="100vh" display="flex" alignItems="center">
      <Container maxW="7xl" px={6}>
        <VStack spacing={16}>
        {/* Header */}
        <VStack spacing={6} textAlign="center" maxW="4xl">
          <SpectacularReveal>
            <VitrineHeading>
              Nos Solutions
              <Text as="span" color={vitrineTheme.colors.primary[600]}>
                {" "}Intelligentes
              </Text>
            </VitrineHeading>
          </SpectacularReveal>
          
          <SpectacularReveal delay={0.2}>
            <VitrineText variant="subtitle">
              Découvrez comment JARVIS transforme l'expérience client dans différents secteurs 
              grâce à une intelligence artificielle conversationnelle de pointe.
            </VitrineText>
          </SpectacularReveal>
        </VStack>

        {/* Solutions Grid */}
        <Grid 
          templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} 
          gap={12} 
          w="full"
          maxW="6xl"
        >
          {solutions.map((solution, index) => (
            <SpectacularReveal key={solution.title} delay={0.3 + index * 0.2}>
              <InteractiveSolutionCard
                title={solution.title}
                subtitle={solution.subtitle}
                description={solution.description}
                icon={solution.icon}
                isComingSoon={solution.status === "coming-soon"}
                onClick={() => console.log(`Clicked ${solution.title}`)}
              />
            </SpectacularReveal>
          ))}
        </Grid>

        {/* Stats Section */}
        <Box w="full" maxW="5xl">
          <VStack spacing={12}>
            <SpectacularReveal delay={0.8}>
              <VitrineText variant="subtitle" color={vitrineTheme.colors.gray[700]}>
                Des résultats qui parlent d'eux-mêmes
              </VitrineText>
            </SpectacularReveal>
            
            <StatsSection />
          </VStack>
        </Box>

        {/* CTA Section */}
        <SpectacularReveal delay={1}>
          <VStack spacing={6} textAlign="center">
            <VitrineText variant="body" maxW="2xl">
              Prêt à révolutionner l'expérience client dans votre établissement ?
            </VitrineText>
            <HStack spacing={4}>
              <VitrineButton variant="gradient" size="lg">
                Demander une démo
              </VitrineButton>
              <VitrineButton variant="secondary" size="lg">
                Voir les tarifs
              </VitrineButton>
            </HStack>
          </VStack>
        </SpectacularReveal>
        </VStack>
      </Container>
    </Box>
  )
}
