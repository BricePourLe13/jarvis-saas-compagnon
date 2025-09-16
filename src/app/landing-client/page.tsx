"use client"

import { Box, Container, VStack, Heading, Text, Button, HStack, Grid, GridItem, Flex, SimpleGrid } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import LiquidEther from '@/components/LiquidEther'
import Dock from '@/components/Dock'
import GradualBlur from '@/components/GradualBlur'
import { VscHome, VscArchive, VscAccount, VscSettingsGear, VscMail, VscCreditCard } from 'react-icons/vsc'
import JarvisSimpleCards from '@/components/JarvisSimpleCards'
import Avatar3D from '@/components/kiosk/Avatar3D'
import CardSwap, { Card } from '@/components/CardSwap'
import TiltedCard from '@/components/TiltedCard'

// Page client-only pour la landing page

export default function LandingClientPage() {
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

  // Fonction de navigation smooth scroll avec offset pour le dock
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -150; // Offset augmenté pour meilleur positionnement
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  // Configuration du Dock - Navigation fonctionnelle
  const dockItems = [
    {
      icon: <VscHome size={22} color="#ffffff" />,
      label: "Accueil",
      onClick: () => scrollToSection("hero")
    },
    {
      icon: <VscArchive size={22} color="#ffffff" />,
      label: "Problème & Solution",
      onClick: () => scrollToSection("probleme")
    },
    {
      icon: <VscAccount size={22} color="#ffffff" />,
      label: "Fonctionnement",
      onClick: () => scrollToSection("comment-ca-marche")
    },
    {
      icon: <VscCreditCard size={22} color="#ffffff" />,
      label: "Tarification",
      onClick: () => scrollToSection("tarifs")
    },
    {
      icon: <VscMail size={22} color="#ffffff" />,
      label: "Contact",
      onClick: () => scrollToSection("contact")
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
      <Container id="hero" maxW="8xl" px={8} position="relative" zIndex={10} pointerEvents="none" style={{ scrollMarginTop: '160px' }}>
        <VStack 
          spacing={8}
          justify="flex-start"
          minH="100vh"
          textAlign="center"
          pointerEvents="none"
          pt={8}
        >
          {/* LOGO JARVIS AVEC EFFET GLITCH/GLOW - RESTE EN HAUT */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.1 }}
            style={{ marginTop: '0px', marginBottom: '2rem' }}
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
            mt={16}
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
                  <Text 
                    as="span" 
                    style={{
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 30%, #7c3aed 70%, #3b82f6 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}
                  >
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
                    { icon: "💬", text: "IA conversationnelle : répond, conseille, montre des vidéos" },
                    { icon: "📈", text: "Dashboard gérant : insights IA + recommandations automatiques" },
                    { icon: "✨", text: "Interface immersive : miroir digital pour plus d'engagement" }
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
                    🗣️ Parler à JARVIS
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
                
                {/* Bouton discret pour clients existants */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                >
                  <Button
                    variant="ghost"
                    color="gray.400"
                    size="sm"
                    fontSize="sm"
                    pointerEvents="auto"
                    _hover={{ 
                      color: "white",
                      textDecoration: "underline"
                    }}
                    transition="all 0.3s"
                    onClick={() => window.location.href = '/login'}
                  >
                    Déjà client ? Se connecter →
                  </Button>
                </motion.div>
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
                
                {/* Cercles orbitaux autour de la sphère - PARFAITEMENT CENTRÉS */}
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={`orbital-${index}`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: `${160 + index * 35}px`,
                      height: `${160 + index * 35}px`,
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                    animate={{
                      rotate: index % 2 === 0 ? 360 : -360
                    }}
                    transition={{
                      duration: 25 + index * 8,
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
      <Container id="probleme" maxW="6xl" px={6} position="relative" zIndex={10} py={20} mt={20} pointerEvents="none" style={{ scrollMarginTop: '160px' }}>
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

            {/* Statistiques avec TiltedCards - PROBLÈMES + SOLUTION */}
            <VStack spacing={8} w="full" maxW="1200px" pointerEvents="none">
              {/* Titre des problèmes */}
              <Text fontSize="xl" color="gray.400" textAlign="center">
                Les défis du fitness traditionnel
              </Text>
              
              {/* 3 Problèmes en ligne */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full" pointerEvents="none">
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
                  containerHeight="240px"
                  containerWidth="100%"
                  imageHeight="240px"
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
                  containerHeight="240px"
                  containerWidth="100%"
                  imageHeight="240px"
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
                  containerHeight="240px"
                  containerWidth="100%"
                  imageHeight="240px"
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
              </SimpleGrid>

              {/* Transition vers solution */}
              <Box position="relative" w="full">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  viewport={{ once: true }}
                  style={{
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #ef4444, #f97316, #8b5cf6, #22c55e, transparent)",
                    marginBottom: "1rem",
                    transformOrigin: "center"
                  }}
                />
                
                <Text fontSize="lg" color="#22c55e" textAlign="center" fontWeight="bold">
                  La solution JARVIS
                </Text>
              </Box>

              {/* SOLUTIONS JARVIS - GRID HORIZONTAL */}
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full">
                {/* Solution 1: Réduction du churn */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  style={{ pointerEvents: "auto" }}
                >
                  <TiltedCard
                    imageSrc="/images/stat-jarvis-bg.svg"
                    altText="Réduction du churn avec JARVIS"
                    captionText=""
                    containerHeight="240px"
                    containerWidth="100%"
                    imageHeight="240px"
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

                {/* Solution 2: Réduction des coûts d'acquisition */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  style={{ pointerEvents: "auto" }}
                >
                  <TiltedCard
                    imageSrc="/images/stat-cost-bg.svg"
                    altText="Réduction coût d'acquisition avec JARVIS"
                    captionText=""
                    containerHeight="240px"
                    containerWidth="100%"
                    imageHeight="240px"
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
                        position="relative"
                      >
                        {/* Badge "SOLUTION" */}
                        <Box
                          position="absolute"
                          top={4}
                          right={4}
                          bg="rgba(249,115,22,0.9)"
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
                        
                        <Text fontSize="6xl" fontWeight="900" color="#f97316" textShadow="0 0 30px rgba(249, 115, 22, 0.8)" mb={2}>
                          -52%
                        </Text>
                        <Text fontSize="sm" color="#fdba74" textTransform="uppercase" letterSpacing="wider" mb={3} fontWeight="bold">
                          💰 Économie JARVIS
                        </Text>
                        <Text fontSize="xl" fontWeight="black" color="white" mb={2} textShadow="0 0 10px rgba(255,255,255,0.3)">
                          Coût d'acquisition
                        </Text>
                        <Text fontSize="sm" color="gray.200" lineHeight="1.5" fontWeight="medium">
                          onboarding automatisé et engagement immédiat
                        </Text>
                      </Box>
                    }
                  />
                </motion.div>

                {/* Solution 3: Élimination des temps d'attente */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  viewport={{ once: true }}
                  style={{ pointerEvents: "auto" }}
                >
                  <TiltedCard
                    imageSrc="/images/stat-wait-bg.svg"
                    altText="Élimination temps d'attente avec JARVIS"
                    captionText=""
                    containerHeight="240px"
                    containerWidth="100%"
                    imageHeight="240px"
                    imageWidth="100%"
                    rotateAmplitude={24}
                    scaleOnHover={1.11}
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
                        position="relative"
                      >
                        {/* Badge "SOLUTION" */}
                        <Box
                          position="absolute"
                          top={4}
                          right={4}
                          bg="rgba(139,92,246,0.9)"
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
                        
                        <Text fontSize="6xl" fontWeight="900" color="#8b5cf6" textShadow="0 0 30px rgba(139, 92, 246, 0.8)" mb={2}>
                          0sec
                        </Text>
                        <Text fontSize="sm" color="#c4b5fd" textTransform="uppercase" letterSpacing="wider" mb={3} fontWeight="bold">
                          ⚡ Instantané JARVIS
                        </Text>
                        <Text fontSize="xl" fontWeight="black" color="white" mb={2} textShadow="0 0 10px rgba(255,255,255,0.3)">
                          Temps d'attente
                        </Text>
                        <Text fontSize="sm" color="gray.200" lineHeight="1.5" fontWeight="medium">
                          réponses immédiates 24h/24 et 7j/7
                        </Text>
                      </Box>
                    }
                  />
                </motion.div>
              </SimpleGrid>

            </VStack>

          </VStack>
        </motion.div>
      </Container>

      {/* 3. SECTION COMMENT ÇA MARCHE - SOLUTION */}
      <Container id="comment-ca-marche" maxW="6xl" px={6} py={20} mt={24} position="relative" zIndex={5} style={{ scrollMarginTop: '160px' }}>
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
                Comment ça marche ?
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="2xl"
              >
                JARVIS transforme l'expérience d'accueil en 3 étapes simples
              </Text>
            </VStack>

            {/* Étapes du processus */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8} w="full">
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
                <GridItem key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    style={{ height: "100%" }}
                  >
                    <VStack spacing={6} h="full" justify="flex-start">
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
                        flexShrink={0}
                      >
                        <Text 
                          fontSize="2xl" 
                          fontWeight="black" 
                          color={step.color}
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
                          zIndex={0}
                        >
                          {step.step}
                        </Text>
                      </Box>
                      
                      <VStack spacing={3} flex="1">
                        <Heading 
                          size="md" 
                          color="white" 
                          textAlign="center"
                        >
                          {step.title}
                        </Heading>
                        <Text 
                          color="gray.300" 
                          textAlign="center" 
                          fontSize="sm"
                          lineHeight="1.6"
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

      {/* 4. SECTION DASHBOARD GÉRANT - AMÉLIORÉE AVEC CARDSWAP */}
      <Box id="dashboard" w="100vw" position="relative" zIndex={10} py={28} mt={24} overflow="hidden" minH="700px" pointerEvents="none" style={{ scrollMarginTop: '160px' }}>
        <Container maxW="8xl" px={8} pointerEvents="none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            style={{ pointerEvents: "none" }}
          >
            <Flex align="center" justify="space-between" minH="650px" gap={16} w="full" pointerEvents="none">
              {/* CONTENU GAUCHE - TEXTE DASHBOARD */}
              <Box 
                flex="1"
                textAlign="left"
                maxW="none"
                pr={10}
                pointerEvents="none"
              >
                {/* Titre principal */}
                <Box mb={8}>
                  <Heading 
                    fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                    color="white" 
                    fontWeight="black"
                    lineHeight="1.1"
                    letterSpacing="-0.02em"
                    mb={4}
                  >
                    <Text as="span">
                      Dashboard{" "}
                      <Text as="span" color="#3b82f6">
                        Intelligence IA
                      </Text>
                    </Text>
                  </Heading>
                  <Text 
                    fontSize={{ base: "lg", md: "xl" }}
                    color="gray.300" 
                    lineHeight="1.6"
                    maxW="none"
                    pr={20}
                  >
                    Pilotez votre salle avec des insights IA en temps réel, des recommandations automatiques 
                    et une vue d'ensemble complète de l'engagement de vos membres.
                  </Text>
                </Box>


                {/* CTA optimisé */}
                <HStack spacing={4} pointerEvents="auto">
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
                    📊 Voir le dashboard
                  </Button>
                </HStack>
              </Box>

              {/* CARDSWAP À DROITE - SCREENSHOTS DASHBOARD */}
              <Box 
                flex="0 0 50%"
                h="600px" 
                position="relative"
                display="flex" 
                justifyContent="flex-end" 
                alignItems="center"
                overflow="visible"
                pointerEvents="auto"
              >
                <Box 
                  position="relative"
                  transform="translateX(80px)"
                  pointerEvents="auto"
                >
                 <CardSwap
                   width={700}
                   height={500}
                   cardDistance={110}
                   verticalDistance={90}
                   delay={4500}
                   pauseOnHover={false}
                   skewAmount={8}
                   easing="elastic"
                 >
                   {/* Card 1: Vue d'ensemble Dashboard */}
                   <Card>
                     <Box
                       bg="#000000"
                       border="1px solid #333333"
                       borderRadius="12px"
                       h="full"
                       w="full"
                       display="flex"
                       flexDirection="column"
                       position="relative"
                       overflow="hidden"
                     >
                       {/* Header avec icône */}
                       <HStack spacing={3} p={4}>
                         <Box w="16px" h="16px" bg="white" borderRadius="2px" display="flex" alignItems="center" justifyContent="center">
                           <Text fontSize="10px" color="black" fontWeight="bold">📊</Text>
                         </Box>
                         <Text fontSize="sm" color="white" fontWeight="medium">
                           Vue d'ensemble
                         </Text>
                       </HStack>

                       {/* Contenu visuel principal */}
                       <Box 
                         flex={1} 
                         display="flex"
                         alignItems="center"
                         justifyContent="center"
                         position="relative"
                         bg="radial-gradient(ellipse at center, #1e3a8a 0%, #1e1b4b 50%, #0f172a 100%)"
                         p={3}
                       >
                         <Box 
                           position="relative" 
                           w="85%" 
                           h="85%" 
                           borderRadius="8px" 
                           overflow="hidden"
                           border="1px solid rgba(59, 130, 246, 0.3)"
                           boxShadow="0 0 25px rgba(59, 130, 246, 0.2)"
                         >
                           <img 
                             src="/images/DAHSBOARD GERANT.jpg"
                             alt="Dashboard JARVIS - Vue d'ensemble"
                             style={{
                               width: '100%',
                               height: '100%',
                               objectFit: 'contain',
                               filter: 'brightness(1.1) contrast(1.1)'
                             }}
                           />
                           
                           {/* Overlay avec effet glow */}
                           <Box
                             position="absolute"
                             inset={0}
                             bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%, rgba(59, 130, 246, 0.05) 100%)"
                             pointerEvents="none"
                           />
                         </Box>
                         
                         {/* Particules lumineuses */}
                         <Box
                           position="absolute"
                           top="20%"
                           right="15%"
                           w="4px"
                           h="4px"
                           bg="#3b82f6"
                           borderRadius="50%"
                           boxShadow="0 0 12px rgba(59, 130, 246, 0.9)"
                           zIndex={3}
                         />
                       </Box>
                     </Box>
                   </Card>

                   {/* Card 2: Analytics Détaillés */}
                   <Card>
                     <Box
                       bg="#000000"
                       border="1px solid #333333"
                       borderRadius="12px"
                       h="full"
                       w="full"
                       display="flex"
                       flexDirection="column"
                       position="relative"
                       overflow="hidden"
                     >
                       <HStack spacing={3} p={4}>
                         <Box w="16px" h="16px" bg="white" borderRadius="2px" display="flex" alignItems="center" justifyContent="center">
                           <Text fontSize="10px" color="black" fontWeight="bold">📈</Text>
                         </Box>
                         <Text fontSize="sm" color="white" fontWeight="medium">
                           Analytics Avancés
                         </Text>
                       </HStack>

                       <Box 
                         flex={1} 
                         position="relative"
                         overflow="hidden"
                         bg="radial-gradient(ellipse at center, #065f46 0%, #064e3b 30%, #0f172a 100%)"
                         display="flex"
                         flexDirection="column"
                         alignItems="center"
                         justifyContent="center"
                         p={6}
                       >
                         <Text 
                           fontSize="2xl" 
                           fontWeight="900" 
                           color="#22c55e" 
                           textAlign="center"
                           mb={4}
                           textShadow="0 0 15px rgba(34, 197, 94, 0.4)"
                         >
                           Analytics IA
                         </Text>
                         
                         <VStack spacing={4} align="stretch" w="100%" zIndex={2}>
                           <HStack spacing={3} align="center">
                             <Box
                               w="30px"
                               h="30px"
                               bg="#22c55e"
                               borderRadius="50%"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                               flexShrink={0}
                             >
                               <Text fontSize="sm" fontWeight="bold" color="black">📊</Text>
                             </Box>
                             <Text fontSize="sm" color="white" fontWeight="medium">
                               Engagement temps réel
                             </Text>
                           </HStack>
                           
                           <HStack spacing={3} align="center">
                             <Box
                               w="30px"
                               h="30px"
                               bg="#3b82f6"
                               borderRadius="50%"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                               flexShrink={0}
                             >
                               <Text fontSize="sm" fontWeight="bold" color="black">🎯</Text>
                             </Box>
                             <Text fontSize="sm" color="white" fontWeight="medium">
                               Prédictions comportementales
                             </Text>
                           </HStack>
                           
                           <HStack spacing={3} align="center">
                             <Box
                               w="30px"
                               h="30px"
                               bg="#f59e0b"
                               borderRadius="50%"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                               flexShrink={0}
                             >
                               <Text fontSize="sm" fontWeight="bold" color="black">⚡</Text>
                             </Box>
                             <Text fontSize="sm" color="white" fontWeight="medium">
                               Alertes automatiques
                             </Text>
                           </HStack>
                         </VStack>
                         
                         {/* Formes d'arrière-plan */}
                         <Box
                           position="absolute"
                           top="15%"
                           right="10%"
                           w="60px"
                           h="60px"
                           bg="rgba(34, 197, 94, 0.1)"
                           borderRadius="50%"
                           filter="blur(15px)"
                           zIndex={1}
                         />
                       </Box>
                     </Box>
                   </Card>

                   {/* Card 3: Contrôle JARVIS */}
                   <Card>
                     <Box
                       bg="#000000"
                       border="1px solid #333333"
                       borderRadius="12px"
                       h="full"
                       w="full"
                       display="flex"
                       flexDirection="column"
                       position="relative"
                       overflow="hidden"
                     >
                       <HStack spacing={3} p={4}>
                         <Box w="16px" h="16px" bg="white" borderRadius="2px" display="flex" alignItems="center" justifyContent="center">
                           <Text fontSize="10px" color="black" fontWeight="bold">🤖</Text>
                         </Box>
                         <Text fontSize="sm" color="white" fontWeight="medium">
                           Contrôle JARVIS
                         </Text>
                       </HStack>

                       <Box 
                         flex={1} 
                         position="relative"
                         overflow="hidden"
                         bg="radial-gradient(ellipse at center, #7c2d12 0%, #991b1b 30%, #0f172a 100%)"
                         display="flex"
                         flexDirection="column"
                         alignItems="center"
                         justifyContent="center"
                         p={6}
                       >
                         <Text 
                           fontSize="2xl" 
                           fontWeight="900" 
                           color="#f97316" 
                           textAlign="center"
                           mb={4}
                           textShadow="0 0 15px rgba(249, 115, 22, 0.4)"
                         >
                           Actions IA
                         </Text>
                         
                         <VStack spacing={4} align="stretch" w="100%" zIndex={2}>
                           <HStack spacing={3} align="center">
                             <Box
                               w="30px"
                               h="30px"
                               bg="#f97316"
                               borderRadius="50%"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                               flexShrink={0}
                             >
                               <Text fontSize="sm" fontWeight="bold" color="black">🎤</Text>
                             </Box>
                             <Text fontSize="sm" color="white" fontWeight="medium">
                               Monitoring conversations
                             </Text>
                           </HStack>
                           
                           <HStack spacing={3} align="center">
                             <Box
                               w="30px"
                               h="30px"
                               bg="#22c55e"
                               borderRadius="50%"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                               flexShrink={0}
                             >
                               <Text fontSize="sm" fontWeight="bold" color="black">⚙️</Text>
                             </Box>
                             <Text fontSize="sm" color="white" fontWeight="medium">
                               Configuration IA
                             </Text>
                           </HStack>
                           
                           <HStack spacing={3} align="center">
                             <Box
                               w="30px"
                               h="30px"
                               bg="#a855f7"
                               borderRadius="50%"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                               flexShrink={0}
                             >
                               <Text fontSize="sm" fontWeight="bold" color="black">📋</Text>
                             </Box>
                             <Text fontSize="sm" color="white" fontWeight="medium">
                               Logs et historiques
                             </Text>
                           </HStack>
                         </VStack>
                         
                         {/* Particules subtiles */}
                         <Box
                           position="absolute"
                           top="25%"
                           left="20%"
                           w="3px"
                           h="3px"
                           bg="#f97316"
                           borderRadius="50%"
                           boxShadow="0 0 8px rgba(249, 115, 22, 0.6)"
                           zIndex={3}
                         />
                       </Box>
                     </Box>
                   </Card>
                 </CardSwap>
                </Box>
              </Box>
            </Flex>
          </motion.div>
        </Container>
      </Box>

      {/* 5. SECTION TÉMOIGNAGE VIDÉO - MOINS RÉPÉTITIF */}
      <Container maxW="8xl" px={6} position="relative" zIndex={10} py={24} pointerEvents="none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ pointerEvents: "none" }}
        >
          <Flex align="center" justify="space-between" gap={16} w="full" pointerEvents="none">
            {/* CONTENU GAUCHE - TÉMOIGNAGE VISUEL (INVERSÉ) */}
            <Box flex="0 0 45%" position="relative" pointerEvents="none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1.0, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Box
                  position="relative"
                  p={8}
                  borderRadius="3xl"
                  border="2px solid rgba(34, 197, 94, 0.3)"
                  bg="rgba(0, 0, 0, 0.6)"
                  backdropFilter="blur(30px)"
                  overflow="hidden"
                  _hover={{
                    borderColor: "rgba(34, 197, 94, 0.6)",
                    transform: "translateY(-8px)",
                    boxShadow: "0 25px 50px rgba(34, 197, 94, 0.2)"
                  }}
                  transition="all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                  pointerEvents="auto"
                >
                  {/* Glow effect */}
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))",
                      borderRadius: "24px"
                    }}
                    animate={{
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  <VStack spacing={6} position="relative" zIndex={2} pointerEvents="none">
                    {/* Citation */}
                    <Box textAlign="center" pointerEvents="none">
                      <Text 
                        fontSize="3xl" 
                        color="#22c55e" 
                        fontWeight="black"
                        mb={4}
                        pointerEvents="none"
                      >
                        "
                      </Text>
                      <Text 
                        fontSize={{ base: "lg", md: "xl" }}
                        fontWeight="bold"
                        color="white"
                        textAlign="center"
                        lineHeight="1.6"
                        pointerEvents="none"
                      >
                        JARVIS a transformé notre approche client. 
                        L'engagement a explosé et nos membres sont ravis.
                      </Text>
                      <Text 
                        fontSize="3xl" 
                        color="#22c55e" 
                        fontWeight="black"
                        mt={4}
                        pointerEvents="none"
                      >
                        "
                      </Text>
                    </Box>

                    {/* Profil du témoignage */}
                    <HStack spacing={4} pointerEvents="none">
                      <Box
                        w="60px"
                        h="60px"
                        borderRadius="50%"
                        bg="linear-gradient(135deg, #22c55e, #16a34a)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        pointerEvents="none"
                      >
                        <Text fontSize="2xl" color="white" fontWeight="bold">
                          M
                        </Text>
                      </Box>
                      <VStack align="flex-start" spacing={1} pointerEvents="none">
                        <Text 
                          fontSize="lg" 
                          fontWeight="bold" 
                          color="white"
                          pointerEvents="none"
                        >
                          Marc Dubois
                        </Text>
                        <Text 
                          fontSize="md"
                          color="gray.400"
                          pointerEvents="none"
                        >
                          Gérant - FitnessPro Lyon
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Métriques de résultats */}
                    <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full" pointerEvents="none">
                      <Box textAlign="center" pointerEvents="none">
                        <Text fontSize="2xl" fontWeight="black" color="#22c55e" pointerEvents="none">
                          +67%
                        </Text>
                        <Text fontSize="sm" color="gray.400" pointerEvents="none">
                          Engagement
                        </Text>
                      </Box>
                      <Box textAlign="center" pointerEvents="none">
                        <Text fontSize="2xl" fontWeight="black" color="#3b82f6" pointerEvents="none">
                          -45%
                        </Text>
                        <Text fontSize="sm" color="gray.400" pointerEvents="none">
                          Churn
                        </Text>
                      </Box>
                    </Grid>
                  </VStack>
                </Box>
              </motion.div>
            </Box>

            {/* CONTENU DROITE - TEXTE (INVERSÉ) */}
            <VStack align="flex-start" spacing={8} flex="1" maxW="600px" pointerEvents="none">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Heading 
                  fontSize={{ base: "3xl", md: "5xl" }}
                  color="white" 
                  fontWeight="black"
                  lineHeight="1.2"
                  textAlign="left"
                  pointerEvents="none"
                >
                  L'innovation qui{" "}
                  <Text 
                    as="span" 
                    style={{
                      background: "linear-gradient(135deg, #22c55e 0%, #3b82f6 50%, #a855f7 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}
                  >
                    transforme
                  </Text>
                </Heading>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Text 
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.300" 
                  lineHeight="1.6"
                  textAlign="left"
                  pointerEvents="none"
                >
                  Découvrez comment JARVIS révolutionne l'expérience membre 
                  dans les salles de sport les plus innovantes.
                </Text>
              </motion.div>

              {/* Timeline des avantages */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <VStack align="flex-start" spacing={6} pointerEvents="none">
                  {[
                    { 
                      title: "Disponibilité 24/7", 
                      desc: "Support IA continu sans interruption",
                      color: "#22c55e"
                    },
                    { 
                      title: "Conversations personnalisées", 
                      desc: "Chaque interaction adaptée au profil membre",
                      color: "#3b82f6"
                    },
                    { 
                      title: "Évolution continue", 
                      desc: "IA qui apprend et s'améliore constamment",
                      color: "#f59e0b"
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
                      viewport={{ once: true }}
                    >
                      <HStack spacing={4} align="flex-start" pointerEvents="none">
                        <Box
                          w="4px"
                          h="60px"
                          bg={item.color}
                          borderRadius="full"
                          position="relative"
                          pointerEvents="none"
                        >
                          <Box
                            w="12px"
                            h="12px"
                            bg={item.color}
                            borderRadius="50%"
                            position="absolute"
                            top="0"
                            left="50%"
                            transform="translateX(-50%)"
                            boxShadow={`0 0 10px ${item.color}`}
                          />
                        </Box>
                        <VStack align="flex-start" spacing={2} pointerEvents="none">
                          <Text 
                            fontSize="lg" 
                            fontWeight="bold" 
                            color="white"
                            pointerEvents="none"
                          >
                            {item.title}
                          </Text>
                          <Text 
                            fontSize="md" 
                            color="gray.400"
                            pointerEvents="none"
                            lineHeight="1.5"
                          >
                            {item.desc}
                          </Text>
                        </VStack>
                      </HStack>
                    </motion.div>
                  ))}
                </VStack>
              </motion.div>
            </VStack>
          </Flex>
        </motion.div>
      </Container>

      {/* 6. SECTION MODÈLE TARIFICATION - DESIGN ÉPURÉ */}
      <Container id="tarifs" maxW="8xl" px={8} py={24} mt={28} position="relative" zIndex={10} pointerEvents="none" style={{ scrollMarginTop: '160px' }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            style={{ pointerEvents: "none" }}
          >
            <VStack spacing={12} textAlign="center" pointerEvents="none">
              {/* Titre avec effet holographique */}
              <VStack spacing={6} pointerEvents="none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.0, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Heading 
                    fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                    fontWeight="black"
                    pointerEvents="none"
                    textAlign="center"
                    lineHeight="1.1"
                    position="relative"
                  >
                    <motion.div
                      animate={{
                        background: [
                          "linear-gradient(45deg, #3b82f6 0%, #22c55e 50%, #f59e0b 100%)",
                          "linear-gradient(45deg, #22c55e 0%, #f59e0b 50%, #a855f7 100%)",
                          "linear-gradient(45deg, #f59e0b 0%, #a855f7 50%, #3b82f6 100%)",
                          "linear-gradient(45deg, #3b82f6 0%, #22c55e 50%, #f59e0b 100%)"
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                      }}
                    >
                      Modèle
                    </motion.div>
                    <Text as="span" color="white" ml={4}>
                      Tarification
                    </Text>
                  </Heading>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Text 
                    fontSize={{ base: "lg", md: "xl" }}
                    color="gray.300" 
                    maxW="700px"
                    pointerEvents="none"
                    lineHeight="1.6"
                  >
                    Un modèle tarifaire transparent et évolutif, conçu pour maximiser votre ROI 
                    dès le premier mois d'utilisation.
                  </Text>
                </motion.div>
              </VStack>

              {/* Processus tarifaire unifié */}
              <Box w="full" maxW="700px" pointerEvents="none">
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    type: "spring",
                    bounce: 0.3
                  }}
                  viewport={{ once: true }}
                >
                  <Box
                    position="relative"
                    p={8}
                    borderRadius="3xl"
                    border="2px solid rgba(34, 197, 94, 0.4)"
                    bg="rgba(0, 0, 0, 0.6)"
                    backdropFilter="blur(30px)"
                    overflow="hidden"
                    _hover={{
                      borderColor: "rgba(34, 197, 94, 0.6)",
                      transform: "translateY(-12px)",
                      boxShadow: "0 30px 60px rgba(34, 197, 94, 0.3)"
                    }}
                    transition="all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                    pointerEvents="auto"
                  >
                    {/* Badge "Solution Complète" */}
                    <Box
                      position="absolute"
                      top={-2}
                      left="50%"
                      transform="translateX(-50%)"
                      bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                      color="white"
                      px={8}
                      py={3}
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      zIndex={3}
                    >
                      ✨ Solution Complète
                    </Box>

                    {/* Glow effect animé */}
                    <motion.div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))",
                        borderRadius: "24px"
                      }}
                      animate={{
                        opacity: [0.1, 0.2, 0.1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    <VStack spacing={8} position="relative" zIndex={2} pointerEvents="none">
                      {/* Titre principal */}
                      <VStack spacing={4} textAlign="center" pointerEvents="none">
                        <Heading 
                          fontSize={{ base: "2xl", md: "3xl" }}
                          fontWeight="black"
                          color="white"
                          pointerEvents="none"
                        >
                          JARVIS Intégral
                        </Heading>
                        <Text 
                          fontSize="lg"
                          color="gray.300"
                          textAlign="center"
                          maxW="600px"
                          lineHeight="1.6"
                          pointerEvents="none"
                        >
                          Installation personnalisée + Formation + Abonnement mensuel
                          <br />
                          <Text as="span" color="#22c55e" fontWeight="bold">
                            Tout-en-un pour votre salle
                          </Text>
                        </Text>
                      </VStack>

                      {/* Processus en 3 étapes */}
                      <VStack spacing={6} w="full" pointerEvents="none">
                        {[
                          {
                            step: "1",
                            title: "Installation & Configuration",
                            desc: "Déploiement complet sur site avec configuration personnalisée",
                            price: "Sur devis",
                            color: "#3b82f6",
                            features: ["🔧 Installation matérielle", "🤖 Configuration IA", "🛡️ Tests & validation"]
                          },
                          {
                            step: "2", 
                            title: "Formation & Accompagnement",
                            desc: "Formation complète de votre équipe et mise en service",
                            price: "Inclus",
                            color: "#f59e0b",
                            features: ["👥 Formation équipe", "📚 Documentation", "🎯 Mise en service"]
                          },
                          {
                            step: "3",
                            title: "Abonnement Mensuel",
                            desc: "Accès complet aux fonctionnalités avec support continu",
                            price: "Forfait mensuel",
                            color: "#22c55e",
                            features: ["💬 IA conversationnelle", "📊 Dashboard gérant", "⚡ Support 24/7"]
                          }
                        ].map((phase, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ 
                              duration: 0.6, 
                              delay: index * 0.2
                            }}
                            viewport={{ once: true }}
                          >
                            <HStack spacing={4} align="center" w="full" pointerEvents="none">
                              {/* Numéro d'étape */}
                              <Box
                                w="50px"
                                h="50px"
                                borderRadius="50%"
                                bg={phase.color}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                                boxShadow={`0 0 20px ${phase.color}40`}
                              >
                                <Text fontSize="xl" fontWeight="black" color="white">
                                  {phase.step}
                                </Text>
                              </Box>

                              {/* Contenu de l'étape */}
                              <VStack align="flex-start" spacing={2} flex="1" pointerEvents="none">
                                <HStack justify="space-between" w="full" pointerEvents="none">
                                  <Text fontSize="lg" fontWeight="bold" color="white" pointerEvents="none">
                                    {phase.title}
                                  </Text>
                                  <Text fontSize="md" fontWeight="bold" color={phase.color} pointerEvents="none">
                                    {phase.price}
                                  </Text>
                                </HStack>
                                
                                <Text fontSize="sm" color="gray.400" lineHeight="1.5" pointerEvents="none">
                                  {phase.desc}
                                </Text>
                                
                                <HStack spacing={4} flexWrap="wrap" pointerEvents="none">
                                  {phase.features.map((feature, featureIndex) => (
                                    <Text key={featureIndex} fontSize="xs" color="gray.500" pointerEvents="none">
                                      {feature}
                                    </Text>
                                  ))}
                                </HStack>
                              </VStack>
                            </HStack>
                          </motion.div>
                        ))}
                      </VStack>

                      {/* CTA unifié */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ pointerEvents: "auto", width: "100%" }}
                      >
                        <Button
                          w="full"
                          size="xl"
                          bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                          color="white"
                          py={8}
                          borderRadius="xl"
                          fontWeight="bold"
                          fontSize="xl"
                          pointerEvents="auto"
                          _hover={{
                            transform: "translateY(-4px)",
                            boxShadow: "0 20px 40px rgba(34, 197, 94, 0.4)"
                          }}
                          transition="all 0.3s"
                        >
                          🚀 Démarrer avec JARVIS
                        </Button>
                      </motion.div>
                    </VStack>
                  </Box>
                </motion.div>
              </Box>

              {/* Message de garantie */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Box
                  p={8}
                  borderRadius="2xl"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  bg="rgba(0, 0, 0, 0.4)"
                  backdropFilter="blur(20px)"
                  maxW="600px"
                  position="relative"
                  overflow="hidden"
                >
                  <motion.div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "linear-gradient(90deg, #22c55e, #3b82f6, #f59e0b, #22c55e)"
                    }}
                    animate={{
                      backgroundPosition: ["0% 0%", "200% 0%"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  <VStack spacing={4} pointerEvents="none">
                    <Text 
                      fontSize="lg"
                      fontWeight="bold"
                      color="white"
                      textAlign="center"
                      pointerEvents="none"
                    >
                      🛡️ Garantie Satisfaction 30 jours
                    </Text>
                    <Text 
                      fontSize="md"
                      color="gray.300"
                      textAlign="center"
                      pointerEvents="none"
                      lineHeight="1.5"
                    >
                      Testez JARVIS sans risque. Si vous n'êtes pas entièrement satisfait, 
                      nous vous remboursons intégralement.
                    </Text>
                  </VStack>
                </Box>
              </motion.div>
            </VStack>
          </motion.div>
        </Container>

      {/* SECTION CONTACT */}
      <Container id="contact" maxW="6xl" px={6} py={24} mt={28} position="relative" zIndex={5} style={{ scrollMarginTop: '160px' }}>
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
              >
                Contactez-nous pour découvrir comment JARVIS peut transformer l'expérience de vos membres
              </Text>
            </VStack>

            <HStack spacing={8} flexWrap="wrap" justify="center">
              <Button 
                bg="linear-gradient(135deg, #22c55e, #16a34a)"
                color="white"
                size="xl"
                px={12}
                py={8}
                borderRadius="full"
                fontWeight="bold"
                fontSize="xl"
                _hover={{ 
                  transform: 'translateY(-4px) scale(1.05)',
                  boxShadow: '0 20px 40px rgba(34, 197, 94, 0.4)'
                }}
                transition="all 0.3s"
              >
                📧 contact@jarvis-group.net
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
                📞 +33 1 23 45 67 89
              </Button>
            </HStack>
          </VStack>
        </motion.div>
      </Container>
    </Box>
  )
}
