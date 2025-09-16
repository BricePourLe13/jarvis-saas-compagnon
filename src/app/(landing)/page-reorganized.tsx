"use client"

import { Box, Container, VStack, Heading, Text, Button, HStack, Grid, GridItem, Flex, SimpleGrid } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import LiquidEther from '@/components/LiquidEther'
import Dock from '@/components/Dock'
import GradualBlur from '@/components/GradualBlur'
import { VscHome, VscArchive, VscAccount, VscSettingsGear, VscMail } from 'react-icons/vsc'
import JarvisSimpleCards from '@/components/JarvisSimpleCards'
import Avatar3D from '@/components/kiosk/Avatar3D'
import TiltedCard from '@/components/TiltedCard'

// ARCHIVED: kept for reference only. Not part of the app routing.
export default function ReactBitsLandingPageReorganizedArchived() {
  // 🎭 SECTION CONTEXTUELLE POUR SPHÈRE INTELLIGENTE
  const [currentSection, setCurrentSection] = useState<'hero' | 'social-proof' | 'solutions' | 'benefits'>('hero')

  // 🎭 DÉTECTION DE SECTION POUR COMPORTEMENT CONTEXTUEL
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight

      // Définir les seuils de sections basés sur la hauteur de viewport
      if (scrollY < windowHeight * 0.8) {
        setCurrentSection('hero')
      } else if (scrollY < windowHeight * 1.3) {
        setCurrentSection('social-proof')
      } else if (scrollY < windowHeight * 2.2) {
        setCurrentSection('solutions')
      } else {
        setCurrentSection('benefits')
      }
    }

    // Écouter le scroll
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Appel initial

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Configuration du Dock - Style React Bits Original
  const dockItems = [
    {
      icon: <VscHome size={22} color="#ffffff" />,
      label: "Home",
      onClick: () => console.log("Home")
    },
    {
      icon: <VscArchive size={22} color="#ffffff" />,
      label: "Archive",
      onClick: () => console.log("Archive")
    },
    {
      icon: <VscAccount size={22} color="#ffffff" />,
      label: "Profile",
      onClick: () => console.log("Profile")
    },
    {
      icon: <VscSettingsGear size={22} color="#ffffff" />,
      label: "Settings",
      onClick: () => console.log("Settings")
    }
  ];

  return (
    <Box bg="transparent" position="relative" minH="100vh">
      {/* Background LiquidEther - FIXE ET INTERACTIF */}
      <Box 
        position="fixed" 
        inset={0} 
        zIndex={0}
        w="100vw"
        h="100vh"
      >
        <LiquidEther
          colors={['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da']}
          mouseForce={12}
          cursorSize={150}
          isViscous={false}
          viscous={15}
          iterationsViscous={20}
          iterationsPoisson={20}
          resolution={0.3}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.2}
          autoIntensity={1.2}
          takeoverDuration={0.5}
          autoResumeDelay={4000}
          autoRampDuration={1.0}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {/* DOCK NAVIGATION - STYLE REACT BITS */}
      <Box position="fixed" bottom={4} left="50%" transform="translateX(-50%)" zIndex={100}>
        <Dock 
          items={dockItems}
          panelHeight={90}
          baseItemSize={70}
          magnification={100}
          distance={200}
        />
      </Box>

      {/* 1. HERO SECTION - LAYOUT CENTRÉ ÉLÉGANT */}
      <Container maxW="8xl" px={8} position="relative" zIndex={10} pointerEvents="none">
        <VStack 
          spacing={12}
          justify="flex-start"
          minH="100vh"
          textAlign="center"
          pointerEvents="none"
          pt={16}
        >
          {/* LOGO JARVIS AVEC EFFET GLITCH/GLOW */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.1 }}
            style={{ marginTop: '-40px' }}
          >
            <motion.div
              animate={{
                textShadow: [
                  "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.2)",
                  "0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(59,130,246,0.5), 0 0 90px rgba(59,130,246,0.3)",
                  "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.2)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Heading 
                fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                color="white" 
                fontWeight="black"
                letterSpacing="0.1em"
                pointerEvents="none"
                textAlign="center"
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #ffffff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                JARVIS
              </Heading>
            </motion.div>
          </motion.div>

          {/* CONTENU PRINCIPAL HORIZONTAL - TEXTE + SPHÈRE */}
          <Flex 
            align="center" 
            justify="space-between" 
            w="full" 
            maxW="7xl"
            gap={16}
            pointerEvents="none"
          >
            {/* CONTENU GAUCHE - TEXTE ET DÉTAILS */}
            <VStack align="flex-start" spacing={8} flex="1" maxW="600px" pointerEvents="none">
              {/* Titre principal */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Heading 
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  color="white" 
                  fontWeight="bold"
                  lineHeight="1.2"
                  textAlign="left"
                  pointerEvents="none"
                >
                  L'IA qui révolutionne{" "}
                  <Text as="span" color="#3b82f6">
                    l'expérience salle de sport
                  </Text>
                </Heading>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Text 
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.300" 
                  lineHeight="1.6"
                  textAlign="left"
                  pointerEvents="none"
                >
                  JARVIS transforme chaque interaction membre en expérience personnalisée 24/7. 
                  Réduisez votre churn de 67% avec l'IA conversationnelle la plus avancée du fitness.
                </Text>
              </motion.div>

              {/* Points clés */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <VStack align="flex-start" spacing={4} pointerEvents="none">
                  {[
                    { icon: "🤖", text: "IA conversationnelle : répond, conseille, montre des vidéos" },
                    { icon: "📊", text: "Dashboard gérant : insights IA + recommandations automatiques" },
                    { icon: "💰", text: "Interface immersive : miroir digital pour plus d'engagement" }
                  ].map((point, index) => (
                    <HStack key={index} spacing={3} pointerEvents="none">
                      <Text fontSize="xl">{point.icon}</Text>
                      <Text color="gray.300" fontSize="md" pointerEvents="none">
                        {point.text}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </motion.div>

              {/* CTA Principal */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                style={{ pointerEvents: "auto" }}
              >
                <HStack spacing={4}>
                  <Button 
                    bg="#3b82f6"
                    color="white"
                    size="lg" 
                    px={8}
                    py={6}
                    borderRadius="full"
                    fontWeight="bold"
                    fontSize="lg"
                    pointerEvents="auto"
                    _hover={{ 
                      transform: 'translateY(-2px)',
                      bg: "#2563eb",
                      shadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
                    }}
                    transition="all 0.2s"
                  >
                    🚀 Réserver une démo
                  </Button>
                  <Button 
                    variant="outline"
                    borderColor="gray.600"
                    color="gray.300"
                    size="lg"
                    px={8}
                    py={6}
                    borderRadius="full"
                    fontWeight="bold"
                    fontSize="lg"
                    pointerEvents="auto"
                    _hover={{ 
                      borderColor: "gray.400",
                      color: "white",
                      transform: 'translateY(-2px)'
                    }}
                    transition="all 0.2s"
                  >
                    📖 En savoir plus
                  </Button>
                </HStack>
              </motion.div>
            </VStack>

            {/* SPHÈRE JARVIS À DROITE */}
            <Box flex="0 0 400px" h="400px" position="relative" pointerEvents="none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1.0, delay: 0.5 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Avatar3D 
                  currentSection={currentSection}
                  style={{ width: '100%', height: '100%' }}
                />
                
                {/* Cercles orbitaux autour de la sphère */}
                {[1, 2, 3].map((index) => (
                  <motion.div
                    key={index}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: `${220 + index * 40}px`,
                      height: `${220 + index * 40}px`,
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }}
                    animate={{
                      rotate: index % 2 === 0 ? 360 : -360
                    }}
                    transition={{
                      duration: 20 + index * 5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                ))}

                {/* Points orbitaux */}
                {[1, 2, 3, 4].map((index) => (
                  <motion.div
                    key={`point-${index}`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '4px',
                      height: '4px',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
                    }}
                    animate={{
                      x: [0, Math.cos(index * 90 * Math.PI / 180) * (140 + index * 20), 0],
                      y: [0, Math.sin(index * 90 * Math.PI / 180) * (140 + index * 20), 0],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 8 + index * 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                  />
                ))}

                {/* Particules flottantes */}
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <motion.div
                    key={`particle-${index}`}
                    style={{
                      position: 'absolute',
                      top: `${20 + index * 10}%`,
                      left: `${15 + index * 12}%`,
                      width: '2px',
                      height: '2px',
                      background: '#60a5fa',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px rgba(96, 165, 250, 0.6)'
                    }}
                    animate={{
                      y: [-10, 10, -10],
                      opacity: [0.2, 0.8, 0.2]
                    }}
                    transition={{
                      duration: 3 + index * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.3
                    }}
                  />
                ))}
              </motion.div>
            </Box>
          </Flex>
        </VStack>
      </Container>

      {/* 2. SECTION PROBLÈME - TILTEDCARDS STATS */}
      <Container maxW="6xl" px={6} position="relative" zIndex={10} py={16} pointerEvents="none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ pointerEvents: "none" }}
        >
          <VStack spacing={16} textAlign="center" pointerEvents="none">
            {/* Titre principal - Étude de marché */}
            <VStack spacing={4}>
              <Text 
                fontSize="4xl" 
                fontWeight="900" 
                color="white"
                lineHeight="1.2"
              >
                Le fitness a un problème.
              </Text>
              <Text 
                fontSize="4xl" 
                fontWeight="900" 
                color="#f59e0b"
                lineHeight="1.2"
                textShadow="0 0 20px rgba(245, 158, 11, 0.3)"
              >
                JARVIS a la solution.
              </Text>
              <Text 
                fontSize="lg" 
                color="gray.400" 
                maxW="600px"
                mt={4}
              >
                Les données du marché révèlent une opportunité majeure pour l'IA conversationnelle
              </Text>
            </VStack>

            {/* Statistiques avec TiltedCards */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full" maxW="900px" pointerEvents="none">
              {/* Stat 1: Abandon */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                style={{ pointerEvents: "auto" }}
              >
                <TiltedCard
                  imageSrc="/images/stat-abandon-bg.svg"
                  altText="Taux d'abandon critique"
                  captionText=""
                  containerHeight={{ base: "300px", md: "320px" }}
                  containerWidth="100%"
                  imageHeight={{ base: "300px", md: "320px" }}
                  imageWidth="100%"
                  rotateAmplitude={18}
                  scaleOnHover={1.08}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      textAlign="center"
                      p={6}
                    >
                      <Text fontSize="5xl" fontWeight="900" color="#ef4444" textShadow="0 0 20px rgba(239, 68, 68, 0.6)" mb={2}>
                        81%
                      </Text>
                      <Text fontSize="xs" color="#fca5a5" textTransform="uppercase" letterSpacing="wider" mb={3}>
                        Abandon
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
                        Taux d'abandon critique
                      </Text>
                      <Text fontSize="sm" color="gray.300" lineHeight="1.5">
                        des membres quittent leur salle dans les 6 premiers mois
                      </Text>
                    </Box>
                  }
                />
              </motion.div>

              {/* Stat 2: Coût d'acquisition */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                style={{ pointerEvents: "auto" }}
              >
                <TiltedCard
                  imageSrc="/images/stat-cost-bg.svg"
                  altText="Coût d'acquisition élevé"
                  captionText=""
                  containerHeight={{ base: "300px", md: "320px" }}
                  containerWidth="100%"
                  imageHeight={{ base: "300px", md: "320px" }}
                  imageWidth="100%"
                  rotateAmplitude={20}
                  scaleOnHover={1.09}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      textAlign="center"
                      p={6}
                    >
                      <Text fontSize="5xl" fontWeight="900" color="#f97316" textShadow="0 0 20px rgba(249, 115, 22, 0.6)" mb={2}>
                        247€
                      </Text>
                      <Text fontSize="xs" color="#fdba74" textTransform="uppercase" letterSpacing="wider" mb={3}>
                        Coût d'acquisition
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
                        Par nouveau membre
                      </Text>
                      <Text fontSize="sm" color="gray.300" lineHeight="1.5">
                        marketing + onboarding traditionnel
                      </Text>
                    </Box>
                  }
                />
              </motion.div>

              {/* Stat 3: Temps d'attente */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                style={{ pointerEvents: "auto" }}
              >
                <TiltedCard
                  imageSrc="/images/stat-wait-bg.svg"
                  altText="Temps d'attente frustrant"
                  captionText=""
                  containerHeight={{ base: "300px", md: "320px" }}
                  containerWidth="100%"
                  imageHeight={{ base: "300px", md: "320px" }}
                  imageWidth="100%"
                  rotateAmplitude={22}
                  scaleOnHover={1.10}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      textAlign="center"
                      p={6}
                    >
                      <Text fontSize="5xl" fontWeight="900" color="#8b5cf6" textShadow="0 0 20px rgba(139, 92, 246, 0.6)" mb={2}>
                        18min
                      </Text>
                      <Text fontSize="xs" color="#c4b5fd" textTransform="uppercase" letterSpacing="wider" mb={3}>
                        Temps d'attente
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
                        Moyenne d'attente
                      </Text>
                      <Text fontSize="sm" color="gray.300" lineHeight="1.5">
                        pour obtenir des informations
                      </Text>
                    </Box>
                  }
                />
              </motion.div>

              {/* Stat 4: Solution JARVIS - MISE EN VALEUR SPÉCIALE */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.3 }}
                viewport={{ once: true }}
                style={{ position: 'relative', pointerEvents: "auto" }}
              >
                {/* Effet de glow autour de la carte JARVIS */}
                <Box
                  position="absolute"
                  inset="-4px"
                  bg="linear-gradient(135deg, rgba(34,197,94,0.4), rgba(16,185,129,0.3))"
                  borderRadius="20px"
                  filter="blur(8px)"
                  zIndex={-1}
                />
                
                <TiltedCard
                  imageSrc="/images/stat-jarvis-bg.svg"
                  altText="Réduction du churn avec JARVIS"
                  captionText=""
                  containerHeight={{ base: "320px", md: "350px" }}
                  containerWidth="100%"
                  imageHeight={{ base: "320px", md: "350px" }}
                  imageWidth="100%"
                  rotateAmplitude={25}
                  scaleOnHover={1.12}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={true}
                  className="tilted-card-jarvis"
                  overlayContent={
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      textAlign="center"
                      p={6}
                      position="relative"
                    >
                      {/* Badge "SOLUTION" */}
                      <Box
                        position="absolute"
                        top={4}
                        right={4}
                        bg="rgba(34,197,94,0.9)"
                        color="white"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Solution
                      </Box>
                      
                      <Text fontSize="6xl" fontWeight="900" color="#22c55e" textShadow="0 0 30px rgba(34, 197, 94, 0.8)" mb={2}>
                        +67%
                      </Text>
                      <Text fontSize="sm" color="#4ade80" textTransform="uppercase" letterSpacing="wider" mb={3} fontWeight="bold">
                        🚀 Amélioration JARVIS
                      </Text>
                      <Text fontSize="xl" fontWeight="black" color="white" mb={2} textShadow="0 0 10px rgba(255,255,255,0.3)">
                        Réduction du churn
                      </Text>
                      <Text fontSize="sm" color="gray.200" lineHeight="1.5" fontWeight="medium">
                        engagement 24/7 et support instantané
                      </Text>
                    </Box>
                  }
                />
              </motion.div>
            </SimpleGrid>
          </VStack>
        </motion.div>
      </Container>

      {/* 3. SECTION COMMENT ÇA MARCHE - SOLUTION */}
      <Container maxW="6xl" px={6} py={20} pointerEvents="none">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <VStack spacing={16} textAlign="center" pointerEvents="none">
            <VStack spacing={6} pointerEvents="none">
              <Heading 
                fontSize={{ base: "3xl", md: "5xl" }}
                color="white" 
                fontWeight="bold"
                pointerEvents="none"
              >
                Comment ça marche ?
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="2xl"
                pointerEvents="none"
              >
                JARVIS transforme l'expérience d'accueil en 3 étapes simples
              </Text>
            </VStack>

            {/* Étapes du processus */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full" pointerEvents="none">
              {[
                { 
                  step: "01", 
                  title: "Le membre s'approche", 
                  desc: "JARVIS détecte la présence et lance l'accueil vocal personnalisé", 
                  icon: "👋",
                  color: "#22c55e"
                },
                { 
                  step: "02", 
                  title: "Conversation naturelle", 
                  desc: "Reconnaissance vocale avancée pour répondre aux questions en temps réel", 
                  icon: "🎤",
                  color: "#3b82f6"
                },
                { 
                  step: "03", 
                  title: "Actions personnalisées", 
                  desc: "Informations planning, réservations, conseils adaptés au profil membre", 
                  icon: "⚡",
                  color: "#f59e0b"
                }
              ].map((step, index) => (
                <GridItem key={index} pointerEvents="none">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <VStack spacing={6} pointerEvents="none">
                      {/* Numéro d'étape */}
                      <Box
                        w="80px"
                        h="80px"
                        borderRadius="50%"
                        bg={`${step.color}20`}
                        border="2px solid"
                        borderColor={`${step.color}40`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        position="relative"
                        pointerEvents="none"
                      >
                        <Text 
                          fontSize="2xl" 
                          fontWeight="black" 
                          color={step.color}
                          pointerEvents="none"
                        >
                          {step.icon}
                        </Text>
                        
                        {/* Numéro en arrière-plan */}
                        <Text
                          position="absolute"
                          fontSize="6xl"
                          fontWeight="900"
                          color={`${step.color}10`}
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          zIndex={-1}
                          pointerEvents="none"
                        >
                          {step.step}
                        </Text>
                      </Box>
                      
                      <VStack spacing={3} pointerEvents="none">
                        <Heading 
                          size="md" 
                          color="white" 
                          textAlign="center"
                          pointerEvents="none"
                        >
                          {step.title}
                        </Heading>
                        <Text 
                          color="gray.300" 
                          textAlign="center" 
                          fontSize="sm"
                          lineHeight="1.6"
                          pointerEvents="none"
                        >
                          {step.desc}
                        </Text>
                      </VStack>
                    </VStack>
                  </motion.div>
                </GridItem>
              ))}
            </Grid>
          </VStack>
        </motion.div>
      </Container>

      {/* 4. SECTION BÉNÉFICES CHIFFRÉS */}
      <Container maxW="6xl" px={6} py={20} pointerEvents="none">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <VStack spacing={16} textAlign="center" pointerEvents="none">
            <VStack spacing={6} pointerEvents="none">
              <Heading 
                fontSize={{ base: "3xl", md: "5xl" }}
                color="white" 
                fontWeight="bold"
                pointerEvents="none"
              >
                Résultats Mesurables
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="2xl"
                pointerEvents="none"
              >
                L'impact de JARVIS sur votre business en chiffres concrets
              </Text>
            </VStack>

            {/* Statistiques principales avec graphiques visuels */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full" pointerEvents="none">
              {[
                { 
                  metric: "+40%", 
                  label: "Engagement membre", 
                  desc: "Interactions spontanées avec JARVIS", 
                  icon: "📈",
                  color: "#22c55e",
                  detail: "vs. accueil traditionnel"
                },
                { 
                  metric: "-60%", 
                  label: "Temps d'attente", 
                  desc: "Réponses instantanées 24/7", 
                  icon: "⚡",
                  color: "#3b82f6",
                  detail: "Réduction moyenne observée"
                },
                { 
                  metric: "+25%", 
                  label: "Satisfaction NPS", 
                  desc: "Expérience client améliorée", 
                  icon: "⭐",
                  color: "#f59e0b",
                  detail: "Score Net Promoter moyen"
                }
              ].map((benefit, index) => (
                <GridItem key={index} pointerEvents="none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Box 
                      p={8} 
                      borderRadius="2xl" 
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      backdropFilter="blur(20px)"
                      pointerEvents="auto"
                      position="relative"
                      overflow="hidden"
                      _hover={{ 
                        borderColor: `${benefit.color}40`,
                        transform: "translateY(-8px)",
                        boxShadow: `0 20px 40px ${benefit.color}20`
                      }}
                      transition="all 0.4s"
                    >
                      {/* Glow effect */}
                      <Box
                        position="absolute"
                        top="-50%"
                        left="-50%"
                        w="200%"
                        h="200%"
                        bg={`radial-gradient(circle, ${benefit.color}15 0%, transparent 70%)`}
                        pointerEvents="none"
                      />
                      
                      <VStack spacing={6} position="relative" pointerEvents="none">
                        <Text fontSize="4xl" pointerEvents="none">{benefit.icon}</Text>
                        
                        <VStack spacing={2} pointerEvents="none">
                          <Text 
                            fontSize="4xl" 
                            fontWeight="black" 
                            color={benefit.color}
                            lineHeight="1"
                            pointerEvents="none"
                          >
                            {benefit.metric}
                          </Text>
                          <Heading 
                            size="md" 
                            color="white" 
                            pointerEvents="none"
                            textAlign="center"
                          >
                            {benefit.label}
                          </Heading>
                        </VStack>
                        
                        <VStack spacing={2} pointerEvents="none">
                          <Text 
                            color="gray.300" 
                            textAlign="center" 
                            fontSize="md"
                            pointerEvents="none"
                          >
                            {benefit.desc}
                          </Text>
                          <Text 
                            color="gray.500" 
                            textAlign="center" 
                            fontSize="sm"
                            fontStyle="italic"
                            pointerEvents="none"
                          >
                            {benefit.detail}
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  </motion.div>
                </GridItem>
              ))}
            </Grid>
          </VStack>
        </motion.div>
      </Container>

      {/* 5. SECTION DASHBOARD GÉRANT */}
      <Container maxW="6xl" px={6} position="relative" zIndex={10} py={20}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <VStack spacing={16} textAlign="center">
            <VStack spacing={6}>
              <Heading 
                fontSize={{ base: "3xl", md: "5xl" }}
                color="white" 
                fontWeight="bold"
              >
                Dashboard Gérant
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="2xl"
              >
                Pilotez votre salle avec l'intelligence artificielle
              </Text>
            </VStack>

            <Text 
              fontSize="lg" 
              color="gray.300" 
              maxW="4xl"
              lineHeight="1.6"
            >
              Le dashboard JARVIS vous offre une vue d'ensemble complète de votre activité avec des insights IA personnalisés, 
              des recommandations automatiques et un suivi en temps réel de l'engagement de vos membres.
            </Text>
          </VStack>
        </motion.div>
      </Container>

      {/* 6. SECTION SOCIAL PROOF */}
      <Container maxW="6xl" px={6} position="relative" zIndex={10} py={16} pointerEvents="none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ pointerEvents: "none" }}
        >
          <VStack spacing={16} textAlign="center" pointerEvents="none">
            <VStack spacing={6} pointerEvents="none">
              <Heading 
                fontSize={{ base: "3xl", md: "4xl" }}
                color="white" 
                fontWeight="bold"
                pointerEvents="none"
              >
                Ils nous font confiance
              </Heading>
              <Text 
                fontSize="lg" 
                color="gray.400" 
                maxW="600px"
                pointerEvents="none"
              >
                Rejoignez les salles de sport qui révolutionnent l'expérience membre avec JARVIS
              </Text>
            </VStack>

            {/* Statistiques de crédibilité */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full" pointerEvents="none">
              {[
                { 
                  number: "24/7", 
                  label: "Disponibilité", 
                  desc: "Support client continu",
                  icon: "🕐"
                },
                { 
                  number: "100%", 
                  label: "Personnalisé", 
                  desc: "Conversations adaptées",
                  icon: "🎯"
                },
                { 
                  number: "∞", 
                  label: "Potentiel", 
                  desc: "Revenus additionnels",
                  icon: "💰"
                }
              ].map((stat, index) => (
                <GridItem key={index} pointerEvents="none">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <VStack spacing={4} pointerEvents="none">
                      <Text fontSize="3xl">{stat.icon}</Text>
                      <Text 
                        fontSize="3xl" 
                        fontWeight="black" 
                        color="#3b82f6"
                        pointerEvents="none"
                      >
                        {stat.number}
                      </Text>
                      <VStack spacing={1} pointerEvents="none">
                        <Text 
                          fontSize="lg" 
                          fontWeight="bold" 
                          color="white"
                          pointerEvents="none"
                        >
                          {stat.label}
                        </Text>
                        <Text 
                          fontSize="sm" 
                          color="gray.400"
                          pointerEvents="none"
                        >
                          {stat.desc}
                        </Text>
                      </VStack>
                    </VStack>
                  </motion.div>
                </GridItem>
              ))}
            </Grid>
          </VStack>
        </motion.div>
      </Container>

      {/* 7. SECTION PRICING - MODÈLE TARIFAIRE */}
      <Container maxW="6xl" px={6} position="relative" zIndex={10} py={20}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <VStack spacing={16} textAlign="center">
            <VStack spacing={6}>
              <Heading 
                fontSize={{ base: "3xl", md: "5xl" }}
                color="white" 
                fontWeight="bold"
              >
                Modèle Tarifaire
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="2xl"
              >
                Une approche transparente et flexible pour votre investissement
              </Text>
            </VStack>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={8} w="full" maxW="800px">
              {[
                {
                  title: "Installation & Formation",
                  desc: "Mise en place complète de JARVIS dans votre salle",
                  price: "Sur devis",
                  features: ["Installation matérielle", "Configuration IA", "Formation équipe", "Support 30 jours"],
                  color: "#3b82f6"
                },
                {
                  title: "Abonnement Mensuel",
                  desc: "Accès complet à l'écosystème JARVIS",
                  price: "Forfait mensuel",
                  features: ["IA conversationnelle", "Dashboard gérant", "Mises à jour", "Support technique"],
                  color: "#22c55e"
                }
              ].map((plan, index) => (
                <GridItem key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Box
                      p={8}
                      borderRadius="2xl"
                      border="2px solid"
                      borderColor={`${plan.color}40`}
                      bg="rgba(0, 0, 0, 0.3)"
                      backdropFilter="blur(20px)"
                      position="relative"
                      overflow="hidden"
                      _hover={{
                        borderColor: `${plan.color}60`,
                        transform: "translateY(-8px)",
                        boxShadow: `0 20px 40px ${plan.color}20`
                      }}
                      transition="all 0.4s"
                    >
                      <VStack spacing={6} align="stretch">
                        <VStack spacing={3}>
                          <Heading size="lg" color="white">
                            {plan.title}
                          </Heading>
                          <Text color="gray.300" textAlign="center">
                            {plan.desc}
                          </Text>
                        </VStack>

                        <Text 
                          fontSize="3xl" 
                          fontWeight="black" 
                          color={plan.color}
                          textAlign="center"
                        >
                          {plan.price}
                        </Text>

                        <VStack spacing={3} align="stretch">
                          {plan.features.map((feature, i) => (
                            <HStack key={i} spacing={3}>
                              <Box w="6px" h="6px" bg={plan.color} borderRadius="50%" />
                              <Text color="gray.300" fontSize="sm">
                                {feature}
                              </Text>
                            </HStack>
                          ))}
                        </VStack>
                      </VStack>
                    </Box>
                  </motion.div>
                </GridItem>
              ))}
            </Grid>
          </VStack>
        </motion.div>
      </Container>

      {/* 8. CTA FINAL */}
      <Container maxW="4xl" px={6} position="relative" zIndex={10} py={20}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <VStack spacing={12} textAlign="center">
            <VStack spacing={6}>
              <Heading 
                fontSize={{ base: "3xl", md: "5xl" }}
                color="white" 
                fontWeight="bold"
              >
                Prêt à révolutionner votre salle ?
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="2xl"
                lineHeight="1.6"
              >
                Rejoignez les salles de sport qui transforment l'expérience membre avec JARVIS. 
                Réservez votre démo personnalisée dès aujourd'hui.
              </Text>
            </VStack>

            <HStack spacing={6} flexWrap="wrap" justify="center">
              <Button 
                bg="#3b82f6"
                color="white"
                size="xl" 
                px={12}
                py={8}
                borderRadius="full"
                fontWeight="bold"
                fontSize="xl"
                _hover={{ 
                  transform: 'translateY(-4px)',
                  bg: "#2563eb",
                  shadow: '0 20px 40px rgba(59, 130, 246, 0.4)'
                }}
                transition="all 0.3s"
              >
                🚀 Réserver ma démo JARVIS
              </Button>
              <Button 
                variant="outline"
                borderColor="gray.600"
                color="gray.300"
                size="xl"
                px={12}
                py={8}
                borderRadius="full"
                fontWeight="bold"
                fontSize="xl"
                _hover={{ 
                  borderColor: "gray.400",
                  color: "white",
                  transform: 'translateY(-4px)'
                }}
                transition="all 0.3s"
              >
                📞 Nous contacter
              </Button>
            </HStack>
          </VStack>
        </motion.div>
      </Container>
    </Box>
  )
}
