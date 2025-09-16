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
import CardSwap, { Card } from '@/components/CardSwap'
import TiltedCard from '@/components/TiltedCard'

// ARCHIVED: kept for reference only. Not part of the app routing.
export default function ReactBitsLandingPageOldArchived() {
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

      {/* HERO SECTION - LAYOUT CENTRÉ ÉLÉGANT */}
      <Container maxW="8xl" px={8} position="relative" zIndex={10} pointerEvents="none">
        <VStack 
          spacing={12} // Espacement légèrement augmenté
          justify="flex-start" // Changé de center à flex-start
          minH="100vh"
          textAlign="center"
          pointerEvents="none"
          pt={16} // Padding top pour garder JARVIS haut
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
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))"
                }}
              >
                JARVIS
              </Heading>
            </motion.div>
          </motion.div>

          {/* CONTENU PRINCIPAL - LAYOUT HORIZONTAL OPTIMISÉ */}
          <Flex 
            align="center" 
            justify="space-between"
            w="full"
            direction={{ base: "column", lg: "row" }}
            gap={{ base: 12, lg: 12 }}
            pointerEvents="none"
            mt={16} // Espacement final pour un équilibre optimal
            px={{ base: 0, lg: 4 }} // Padding horizontal pour mieux occuper l'espace
          >
            {/* CONTENU GAUCHE - DÉTAILS */}
            <VStack 
              align={{ base: "center", lg: "flex-start" }} 
              spacing={8} 
              flex={1}
              textAlign={{ base: "center", lg: "left" }}
              pointerEvents="none"
              maxW={{ base: "100%", lg: "520px" }}
              pr={{ base: 0, lg: 6 }} // Padding right optimisé
            >
              {/* TITRE DESCRIPTIF */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.0, delay: 0.3 }}
              >
                <VStack spacing={4} align={{ base: "center", lg: "flex-start" }} pointerEvents="none">
                  <Heading 
                    fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                    color="white" 
                    fontWeight="bold"
                    lineHeight="1.2"
                    pointerEvents="none"
                  >
                    JARVIS : l'IA qui révolutionne{" "}
                    <Text as="span" display="block" color="#3b82f6" pointerEvents="none">
                      l'expérience salle de sport
                    </Text>
                  </Heading>
                  <Text 
                    fontSize={{ base: "lg", md: "xl" }}
                    color="gray.300"
                    fontWeight="medium"
                    pointerEvents="none"
                    maxW="540px"
                  >
                    Une IA conversationnelle avancée qui interagit avec vos membres, analyse leurs besoins 
                    et génère des insights précieux pour optimiser votre business.
                  </Text>
                </VStack>
              </motion.div>

            {/* POINTS CLÉS */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.0, delay: 0.4 }}
            >
              <VStack spacing={3} align={{ base: "center", lg: "flex-start" }} pointerEvents="none">
                <HStack spacing={3} pointerEvents="none">
                  <Box w="6px" h="6px" bg="#22c55e" borderRadius="50%" pointerEvents="none" />
                  <Text color="gray.300" fontSize="lg" pointerEvents="none">
                    IA conversationnelle : répond, conseille, montre des vidéos
                  </Text>
                </HStack>
                <HStack spacing={3} pointerEvents="none">
                  <Box w="6px" h="6px" bg="#3b82f6" borderRadius="50%" pointerEvents="none" />
                  <Text color="gray.300" fontSize="lg" pointerEvents="none">
                    Dashboard gérant : insights IA + recommandations automatiques
                  </Text>
                </HStack>
                <HStack spacing={3} pointerEvents="none">
                  <Box w="6px" h="6px" bg="#f59e0b" borderRadius="50%" pointerEvents="none" />
                  <Text color="gray.300" fontSize="lg" pointerEvents="none">
                    Interface immersive : miroir digital pour plus d'engagement
                  </Text>
                </HStack>
              </VStack>
            </motion.div>

            {/* BOUTONS D'ACTION OPTIMISÉS */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.0, delay: 0.6 }}
            >
              <VStack spacing={4} align={{ base: "center", lg: "flex-start" }} pointerEvents="none">
                <HStack spacing={4} pointerEvents="auto">
                  <Button 
                    bg="#22c55e"
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
                      bg: "#16a34a",
                      shadow: '0 10px 30px rgba(34, 197, 94, 0.4)'
                    }}
                    transition="all 0.2s"
                  >
                    🎯 Voir la démo en action
                  </Button>
                  <Button 
                    bg="rgba(255, 255, 255, 0.1)"
                    backdropFilter="blur(20px)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    color="white"
                    size="lg" 
                    px={8}
                    py={6}
                    borderRadius="full"
                    fontWeight="semibold"
                    fontSize="lg"
                    pointerEvents="auto"
                    _hover={{ 
                      transform: 'translateY(-2px)',
                      bg: "rgba(255, 255, 255, 0.2)",
                      borderColor: "rgba(255, 255, 255, 0.3)"
                    }}
                    transition="all 0.2s"
                  >
                    📞 Devis personnalisé
                  </Button>
                </HStack>
                <VStack spacing={2} pointerEvents="none">
                  <Text 
                    fontSize="sm" 
                    color="#22c55e" 
                    fontWeight="semibold"
                    pointerEvents="none"
                    textAlign={{ base: "center", lg: "left" }}
                  >
                    🚀 Lancement commercial 2025
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color="gray.400" 
                    pointerEvents="none"
                    textAlign={{ base: "center", lg: "left" }}
                  >
                    ✅ Installation clé en main • ✅ Formation équipe incluse • ✅ Support technique
                  </Text>
                </VStack>
              </VStack>
            </motion.div>
            </VStack>

            {/* SPHÈRE JARVIS PLUS À DROITE ET PLUS GRANDE */}
            <Box 
              flex={1.2} // Flex plus important pour pousser plus à droite
              display="flex" 
              justify={{ base: "center", lg: "flex-end" }} // Alignement à droite sur desktop
              align="center"
              pointerEvents="none"
              maxW={{ base: "350px", lg: "450px" }} // Taille max optimisée
              pl={{ base: 0, lg: 8 }} // Padding left optimisé
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 80 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.5 }}
                style={{ position: 'relative' }}
              >
                {/* CERCLES ORBITAUX SUBTILS */}
                <Box position="absolute" inset={0} pointerEvents="none">
                  {/* Cercle orbital 1 - Rotation lente */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '500px',
                      height: '500px',
                      marginTop: '-250px',
                      marginLeft: '-250px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      borderStyle: 'dashed',
                      borderDashArray: '8 12'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Cercle orbital 2 - Rotation moyenne */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '580px',
                      height: '580px',
                      marginTop: '-290px',
                      marginLeft: '-290px',
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      borderRadius: '50%',
                      borderStyle: 'dotted'
                    }}
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 30,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Cercle orbital 3 - Rotation rapide avec points */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '460px',
                      height: '460px',
                      marginTop: '-230px',
                      marginLeft: '-230px'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    {/* Points orbitaux */}
                    {[0, 90, 180, 270].map((angle, index) => (
                      <Box
                        key={index}
                        position="absolute"
                        top="50%"
                        left="50%"
                        w="4px"
                        h="4px"
                        bg="rgba(255, 255, 255, 0.3)"
                        borderRadius="50%"
                        transform={`translate(-50%, -50%) rotate(${angle}deg) translateY(-230px)`}
                        boxShadow="0 0 8px rgba(255, 255, 255, 0.5)"
                      />
                    ))}
                  </motion.div>
                  
                  {/* Particules flottantes */}
                  {[...Array(6)].map((_, index) => (
                    <motion.div
                      key={`particle-${index}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '2px',
                        height: '2px',
                        background: 'rgba(59, 130, 246, 0.6)',
                        borderRadius: '50%',
                        boxShadow: '0 0 4px rgba(59, 130, 246, 0.8)'
                      }}
                      animate={{
                        x: [0, Math.cos(index * 60 * Math.PI / 180) * 200, 0],
                        y: [0, Math.sin(index * 60 * Math.PI / 180) * 200, 0],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{
                        duration: 8 + index * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5
                      }}
                    />
                  ))}
                </Box>

                {/* SPHÈRE JARVIS AU CENTRE */}
                <Avatar3D 
                  status="contextual" 
                  size={350}
                  currentSection={currentSection}
                />
              </motion.div>
            </Box>
          </Flex>
        </VStack>
      </Container>

      {/* SECTION SOCIAL PROOF - CRÉDIBILITÉ IMMÉDIATE */}
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
                       {/* Titre principal étalé */}
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
                             L'écosystème IA qui{" "}
                             <Text as="span" color="#3b82f6">
                               révolutionne le fitness
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
                           JARVIS connecte membres, gérants et partenaires dans un écosystème intelligent 
                           qui génère de la valeur à chaque interaction.
                         </Text>
                       </Box>

                       {/* 3 Points clés en layout horizontal */}
                       <Grid templateColumns="repeat(3, 1fr)" gap={10} w="full" mb={8}>
                         <VStack align="flex-start" spacing={4}>
                           <Box 
                             w="60px" 
                             h="60px" 
                             bg="rgba(34, 197, 94, 0.2)" 
                             borderRadius="xl" 
                             display="flex" 
                             alignItems="center" 
                             justifyContent="center"
                             border="1px solid rgba(34, 197, 94, 0.3)"
                           >
                             <Text fontSize="2xl">🤖</Text>
                           </Box>
                           <VStack align="flex-start" spacing={2}>
                             <Text fontSize="xl" fontWeight="bold" color="white">
                               Expérience Membre
                             </Text>
                             <Text fontSize="md" color="gray.400" lineHeight="1.5">
                               IA conversationnelle + interface miroir digital
                             </Text>
                           </VStack>
                         </VStack>

                         <VStack align="flex-start" spacing={4}>
                           <Box 
                             w="60px" 
                             h="60px" 
                             bg="rgba(59, 130, 246, 0.2)" 
                             borderRadius="xl" 
                             display="flex" 
                             alignItems="center" 
                             justifyContent="center"
                             border="1px solid rgba(59, 130, 246, 0.3)"
                           >
                             <Text fontSize="2xl">📊</Text>
                           </Box>
                           <VStack align="flex-start" spacing={2}>
                             <Text fontSize="xl" fontWeight="bold" color="white">
                               Intelligence Business
                             </Text>
                             <Text fontSize="md" color="gray.400" lineHeight="1.5">
                               Dashboard IA avec insights automatiques
                             </Text>
                           </VStack>
                         </VStack>

                         <VStack align="flex-start" spacing={4}>
                           <Box 
                             w="60px" 
                             h="60px" 
                             bg="rgba(245, 158, 11, 0.2)" 
                             borderRadius="xl" 
                             display="flex" 
                             alignItems="center" 
                             justifyContent="center"
                             border="1px solid rgba(245, 158, 11, 0.3)"
                           >
                             <Text fontSize="2xl">💰</Text>
                           </Box>
                           <VStack align="flex-start" spacing={2}>
                             <Text fontSize="xl" fontWeight="bold" color="white">
                               Monétisation IA
                             </Text>
                             <Text fontSize="md" color="gray.400" lineHeight="1.5">
                               Revenus publicitaires + partenariats premium
                             </Text>
                           </VStack>
                         </VStack>
                       </Grid>

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
                           🚀 Découvrir l'écosystème
                         </Button>
                       </HStack>
                     </Box>

                     {/* CARDSWAP À DROITE - STYLE REACT BITS INCRUSTÉ */}
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
                         transform="translateX(80px)" // Moins décalé pour plus de visibilité
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
                {/* Card 1: Expérience Membre */}
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
                    {/* Header avec icône - Style React Bits exact */}
                    <HStack spacing={3} p={4}>
                      <Box w="16px" h="16px" bg="white" borderRadius="2px" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="10px" color="black" fontWeight="bold">🤖</Text>
                      </Box>
                      <Text fontSize="sm" color="white" fontWeight="medium">
                        Expérience Membre
                      </Text>
                    </HStack>

                    {/* Contenu visuel principal - Image JARVIS Kiosk PLEIN ÉCRAN */}
                    <Box 
                      flex={1} 
                      position="relative"
                      overflow="hidden"
                    >
                      {/* Image du kiosk JARVIS en plein écran */}
                      <img 
                        src="/images/Google_AI_Studio_2025-09-16T14_51_00.773Z.png"
                        alt="Interface JARVIS Kiosk"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'brightness(1.1) contrast(1.1)'
                        }}
                      />
                      
                      {/* Overlay avec effet glow vert */}
                      <Box
                        position="absolute"
                        inset={0}
                        bg="linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, transparent 50%, rgba(34, 197, 94, 0.1) 100%)"
                        pointerEvents="none"
                      />
                      
                      {/* Particules lumineuses flottantes */}
                      <Box
                        position="absolute"
                        top="15%"
                        right="10%"
                        w="4px"
                        h="4px"
                        bg="#22c55e"
                        borderRadius="50%"
                        boxShadow="0 0 12px rgba(34, 197, 94, 0.9)"
                        zIndex={3}
                      />
                      
                      <Box
                        position="absolute"
                        bottom="20%"
                        left="15%"
                        w="3px"
                        h="3px"
                        bg="#10b981"
                        borderRadius="50%"
                        boxShadow="0 0 10px rgba(16, 185, 129, 0.8)"
                        zIndex={3}
                      />
                    </Box>
                  </Box>
                </Card>

                {/* Card 2: Intelligence Gérant */}
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
                    {/* Header avec icône - Style React Bits exact */}
                    <HStack spacing={3} p={4}>
                      <Box w="16px" h="16px" bg="white" borderRadius="2px" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="10px" color="black" fontWeight="bold">📊</Text>
                      </Box>
                      <Text fontSize="sm" color="white" fontWeight="medium">
                        Intelligence Gérant
                      </Text>
                    </HStack>

                    {/* Contenu visuel principal - Image Dashboard Gérant AJUSTÉE */}
                    <Box 
                      flex={1} 
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                      bg="radial-gradient(ellipse at center, #1e1b4b 0%, #1e3a8a 50%, #0f172a 100%)"
                      p={3}
                    >
                      {/* Image du dashboard gérant avec taille ajustée */}
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
                          alt="Dashboard JARVIS Gérant"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'brightness(1.1) contrast(1.1)'
                          }}
                        />
                        
                        {/* Overlay avec effet glow bleu */}
                        <Box
                          position="absolute"
                          inset={0}
                          bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%, rgba(59, 130, 246, 0.05) 100%)"
                          pointerEvents="none"
                        />
                      </Box>
                      
                      {/* Particules lumineuses flottantes */}
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
                      
                      <Box
                        position="absolute"
                        bottom="25%"
                        left="20%"
                        w="3px"
                        h="3px"
                        bg="#2563eb"
                        borderRadius="50%"
                        boxShadow="0 0 10px rgba(37, 99, 235, 0.8)"
                        zIndex={3}
                      />
                    </Box>
                  </Box>
                </Card>

                {/* Card 3: Business Model */}
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
                    {/* Header avec icône - Style React Bits exact */}
                    <HStack spacing={3} p={4}>
                      <Box w="16px" h="16px" bg="white" borderRadius="2px" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="10px" color="black" fontWeight="bold">💰</Text>
                      </Box>
                      <Text fontSize="sm" color="white" fontWeight="medium">
                        Business Model
                      </Text>
                    </HStack>

                    {/* Contenu visuel principal - Business Model Simple et Efficace */}
                    <Box 
                      flex={1} 
                      position="relative"
                      overflow="hidden"
                      bg="radial-gradient(ellipse at center, #2d1b69 0%, #1e1b4b 30%, #0f0f23 100%)"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      p={6}
                    >
                      {/* Titre principal */}
                      <Text 
                        fontSize="2xl" 
                        fontWeight="900" 
                        color="#f59e0b" 
                        textAlign="center"
                        mb={4}
                        textShadow="0 0 15px rgba(245, 158, 11, 0.4)"
                      >
                        Modèle Rentable
                      </Text>
                      
                      {/* Étapes du business model */}
                      <VStack spacing={4} align="stretch" w="100%" zIndex={2}>
                        {/* Étape 1 */}
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
                            <Text fontSize="sm" fontWeight="bold" color="black">1</Text>
                          </Box>
                          <Text fontSize="sm" color="white" fontWeight="medium">
                            Installation + Formation
                          </Text>
                        </HStack>
                        
                        {/* Étape 2 */}
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
                            <Text fontSize="sm" fontWeight="bold" color="black">2</Text>
                          </Box>
                          <Text fontSize="sm" color="white" fontWeight="medium">
                            Abonnement Mensuel
                          </Text>
                        </HStack>
                        
                        {/* Étape 3 */}
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
                            <Text fontSize="sm" fontWeight="bold" color="black">3</Text>
                          </Box>
                          <Text fontSize="sm" color="white" fontWeight="medium">
                            Revenus Partagés
                          </Text>
                        </HStack>
                      </VStack>
                      
                      {/* CTA en bas */}
                      <Text 
                        fontSize="xs" 
                        color="gray.300" 
                        textAlign="center" 
                        mt={4}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Win-Win Garanti
                      </Text>
                      
                      {/* Formes d'arrière-plan simplifiées */}
                      <Box
                        position="absolute"
                        top="15%"
                        right="10%"
                        w="60px"
                        h="60px"
                        bg="rgba(245, 158, 11, 0.1)"
                        borderRadius="50%"
                        filter="blur(15px)"
                        zIndex={1}
                      />
                      
                      <Box
                        position="absolute"
                        bottom="20%"
                        left="15%"
                        w="80px"
                        h="40px"
                        bg="rgba(168, 85, 247, 0.1)"
                        borderRadius="20px"
                        transform="rotate(25deg)"
                        filter="blur(12px)"
                        zIndex={1}
                      />
                      
                      {/* Particules subtiles */}
                      <Box
                        position="absolute"
                        top="25%"
                        left="20%"
                        w="3px"
                        h="3px"
                        bg="#f59e0b"
                        borderRadius="50%"
                        boxShadow="0 0 8px rgba(245, 158, 11, 0.6)"
                        zIndex={3}
                      />
                      
                      <Box
                        position="absolute"
                        bottom="35%"
                        right="25%"
                        w="2px"
                        h="2px"
                        bg="#a855f7"
                        borderRadius="50%"
                        boxShadow="0 0 6px rgba(168, 85, 247, 0.5)"
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

      {/* SECTION SOCIAL PROOF - CRÉDIBILITÉ IMMÉDIATE */}
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

            {/* Statistiques - TiltedCards Optimisées */}
            <SimpleGrid 
              columns={{ base: 1, md: 2, lg: 4 }} 
              spacing={8} 
              w="100%" 
              maxW="1200px"
              pointerEvents="none"
            >
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
                  containerHeight="300px"
                  containerWidth="100%"
                  imageHeight="300px"
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

              {/* Stat 2: Coût acquisition */}
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
                  containerHeight="300px"
                  containerWidth="100%"
                  imageHeight="300px"
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
                      <Text fontSize="5xl" fontWeight="900" color="#f59e0b" textShadow="0 0 20px rgba(245, 158, 11, 0.6)" mb={2}>
                        247€
                      </Text>
                      <Text fontSize="xs" color="#fbbf24" textTransform="uppercase" letterSpacing="wider" mb={3}>
                        92% du budget marketing
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
                        Coût d'acquisition élevé
                      </Text>
                      <Text fontSize="sm" color="gray.300" lineHeight="1.5">
                        par nouveau membre (marketing + onboarding)
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
                  imageSrc="/images/stat-time-bg.svg"
                  altText="Temps d'attente frustrant"
                  captionText=""
                  containerHeight="300px"
                  containerWidth="100%"
                  imageHeight="300px"
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
                      <Text fontSize="5xl" fontWeight="900" color="#a855f7" textShadow="0 0 20px rgba(168, 85, 247, 0.6)" mb={2}>
                        18
                      </Text>
                      <Text fontSize="xs" color="#c084fc" textTransform="uppercase" letterSpacing="wider" mb={3}>
                        Minutes
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
                        Temps d'attente frustrant
                      </Text>
                      <Text fontSize="sm" color="gray.300" lineHeight="1.5">
                        pour obtenir une réponse du staff
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
                style={{ position: 'relative', pointerEvents: 'auto' }}
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
                  containerHeight="320px"
                  containerWidth="100%"
                  imageHeight="320px"
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

            {/* Expérience narrative immersive */}
            <Box mt={20} position="relative" pointerEvents="none">
              {/* Ligne de séparation animée avec particules */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 1.5, delay: 0.8 }}
                viewport={{ once: true }}
                style={{
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, #3b82f6, #f59e0b, #3b82f6, transparent)",
                  marginBottom: "3rem",
                  transformOrigin: "center"
                }}
              />

              {/* Message principal avec effet cinématique */}
              <VStack spacing={8} textAlign="center" pointerEvents="none">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.0, delay: 1.0 }}
                  viewport={{ once: true }}
                >
                  <Text 
                    fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                    fontWeight="900"
                    lineHeight="1.2"
                    mb={6}
                  >
                    <Text as="span" color="white">
                      Ces chiffres révèlent une{" "}
                    </Text>
                    <motion.span
                      style={{
                        background: "linear-gradient(45deg, #3b82f6, #f59e0b)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))"
                      }}
                      animate={{
                        filter: [
                          "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                          "drop-shadow(0 0 30px rgba(245, 158, 11, 0.7))",
                          "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))"
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      opportunité majeure
                    </motion.span>
                  </Text>
                </motion.div>

                {/* Sous-message avec animation décalée */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.4 }}
                  viewport={{ once: true }}
                >
                  <Text 
                    fontSize={{ base: "lg", md: "xl" }}
                    color="gray.300"
                    maxW="600px"
                    lineHeight="1.6"
                    mb={8}
                  >
                    Pendant que vos concurrents{" "}
                    <Text as="span" color="#ef4444" fontWeight="bold">
                      subissent
                    </Text>{" "}
                    ces problèmes,{" "}
                    <Text as="span" color="#f59e0b" fontWeight="black" textShadow="0 0 10px rgba(245, 158, 11, 0.3)">
                      JARVIS
                    </Text>{" "}
                    les transforme en{" "}
                    <Text as="span" color="#22c55e" fontWeight="bold">
                      avantages compétitifs
                    </Text>
                    .
                  </Text>
                </motion.div>

                {/* CTA immersif avec particules */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.8, type: "spring", bounce: 0.4 }}
                  viewport={{ once: true }}
                  style={{ position: "relative", pointerEvents: "auto" }}
                >
                  {/* Particules autour du bouton */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      style={{
                        position: "absolute",
                        width: "4px",
                        height: "4px",
                        background: "#3b82f6",
                        borderRadius: "50%",
                        top: "50%",
                        left: "50%"
                      }}
                      animate={{
                        x: [0, Math.cos(i * 60 * Math.PI / 180) * 80, 0],
                        y: [0, Math.sin(i * 60 * Math.PI / 180) * 80, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                  
                  <Button
                    size="lg"
                    bg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                    color="white"
                    px={10}
                    py={6}
                    fontSize="lg"
                    fontWeight="bold"
                    borderRadius="xl"
                    position="relative"
                    zIndex={2}
                    pointerEvents="auto"
                    _hover={{
                      transform: "translateY(-4px)",
                      boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)",
                      bg: "linear-gradient(135deg, #2563eb, #1e40af)"
                    }}
                    _active={{
                      transform: "translateY(-2px)"
                    }}
                    transition="all 0.3s ease"
                  >
                    🚀 Découvrir la solution JARVIS
                  </Button>
                </motion.div>
              </VStack>
            </Box>
          </VStack>
        </motion.div>
      </Container>

      {/* SECTION MODÈLE TARIFAIRE - TRANSPARENT ET HONNÊTE */}
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
                Un modèle tarifaire{" "}
                <Text as="span" color="#3b82f6">
                  transparent et équitable
                </Text>
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="3xl"
              >
                Investissement initial puis abonnement mensuel adapté à votre utilisation
              </Text>
            </VStack>

            {/* Modèle tarifaire en 2 étapes */}
            <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={8} w="full">
              {/* Étape 1: Installation */}
              <Box
                bg="rgba(59, 130, 246, 0.1)"
                border="1px solid rgba(59, 130, 246, 0.3)"
                borderRadius="2xl"
                p={8}
                backdropFilter="blur(20px)"
              >
                <VStack spacing={6}>
                  <VStack spacing={2}>
                    <Text fontSize="2xl">🚀</Text>
                    <Heading size="lg" color="#3b82f6">
                      Étape 1: Installation
                    </Heading>
                    <Text color="gray.400" fontSize="sm">
                      Paiement unique
                    </Text>
                  </VStack>
                  
                  <VStack spacing={4} w="full">
                    {[
                      { item: "Miroir digital + IA JARVIS", price: "Sur devis" },
                      { item: "Installation sur site", price: "Incluse" },
                      { item: "Formation équipe complète", price: "Incluse" },
                      { item: "Configuration personnalisée", price: "Incluse" }
                    ].map((cost, index) => (
                      <HStack key={index} justify="space-between" w="full">
                        <Text color="gray.300">{cost.item}</Text>
                        <Text color="white" fontWeight="semibold">{cost.price}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>

              {/* Étape 2: Abonnement */}
              <Box
                bg="rgba(34, 197, 94, 0.1)"
                border="1px solid rgba(34, 197, 94, 0.3)"
                borderRadius="2xl"
                p={8}
                backdropFilter="blur(20px)"
              >
                <VStack spacing={6}>
                  <VStack spacing={2}>
                    <Text fontSize="2xl">🔄</Text>
                    <Heading size="lg" color="#22c55e">
                      Étape 2: Abonnement
                    </Heading>
                    <Text color="gray.400" fontSize="sm">
                      Facturation mensuelle
                    </Text>
                  </VStack>
                  
                  <VStack spacing={4} w="full">
                    {[
                      { item: "Utilisation de base", price: "Forfait mensuel" },
                      { item: "Support technique 24/7", price: "Inclus" },
                      { item: "Mises à jour automatiques", price: "Incluses" },
                      { item: "Dépassement de quota", price: "Pay-per-use" }
                    ].map((revenue, index) => (
                      <HStack key={index} justify="space-between" w="full">
                        <Text color="gray.300">{revenue.item}</Text>
                        <Text color="white" fontWeight="semibold">{revenue.price}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </Grid>

            {/* Avantages du modèle */}
            <Box 
              bg="rgba(168, 85, 247, 0.1)" 
              border="1px solid rgba(168, 85, 247, 0.3)"
              borderRadius="2xl"
              p={8}
              w="full"
              maxW="4xl"
            >
              <VStack spacing={6}>
                <VStack spacing={2}>
                  <Text fontSize="2xl">💡</Text>
                  <Heading size="lg" color="#a855f7">
                    Pourquoi ce modèle ?
                  </Heading>
                </VStack>
                
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} w="full">
                  {[
                    { 
                      icon: "🎯", 
                      title: "Pas de surprise", 
                      desc: "Tarification claire dès le départ"
                    },
                    { 
                      icon: "📈", 
                      title: "Évolutif", 
                      desc: "Payez selon votre utilisation réelle"
                    },
                    { 
                      icon: "🤝", 
                      title: "Partenariat", 
                      desc: "Revenus publicitaires partagés"
                    }
                  ].map((benefit, index) => (
                    <VStack key={index} spacing={3}>
                      <Text fontSize="2xl">{benefit.icon}</Text>
                      <Text color="white" fontWeight="semibold" fontSize="md">
                        {benefit.title}
                      </Text>
                      <Text color="gray.300" fontSize="sm" textAlign="center">
                        {benefit.desc}
                      </Text>
                    </VStack>
                  ))}
                </Grid>
              </VStack>
            </Box>
          </VStack>
        </motion.div>
      </Container>

      {/* SECTION DASHBOARD GÉRANT - CENTRE DE COMMANDEMENT */}
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
                Dashboard gérant :{" "}
                <Text as="span" color="#a855f7">
                  votre centre de commandement IA
                </Text>
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="3xl"
              >
                Pilotez votre salle avec des insights IA, des recommandations personnalisées et un suivi en temps réel
              </Text>
            </VStack>

            {/* Fonctionnalités du dashboard */}
            <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={8} w="full">
              {/* Vue d'ensemble */}
              <Box
                bg="rgba(168, 85, 247, 0.1)"
                border="1px solid rgba(168, 85, 247, 0.3)"
                borderRadius="2xl"
                p={8}
                backdropFilter="blur(20px)"
              >
                <VStack spacing={6} align="start">
                  <HStack spacing={3}>
                    <Text fontSize="2xl">📊</Text>
                    <Heading size="lg" color="#a855f7">
                      Vue d'ensemble
                    </Heading>
                  </HStack>
                  
                  <VStack spacing={3} align="start" w="full">
                    {[
                      "Taux de satisfaction global (jauge temps réel)",
                      "Alertes critiques détectées automatiquement",
                      "Taux de churn estimé par IA",
                      "Activité horaire (heatmap)",
                      "Top 3 sujets les plus mentionnés"
                    ].map((item, index) => (
                      <HStack key={index} spacing={3} align="start">
                        <Box w="6px" h="6px" bg="#a855f7" borderRadius="50%" mt={2} />
                        <Text color="gray.300" fontSize="sm">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>

              {/* Fiches membres */}
              <Box
                bg="rgba(34, 197, 94, 0.1)"
                border="1px solid rgba(34, 197, 94, 0.3)"
                borderRadius="2xl"
                p={8}
                backdropFilter="blur(20px)"
              >
                <VStack spacing={6} align="start">
                  <HStack spacing={3}>
                    <Text fontSize="2xl">👥</Text>
                    <Heading size="lg" color="#22c55e">
                      Fiches Membres
                    </Heading>
                  </HStack>
                  
                  <VStack spacing={3} align="start" w="full">
                    {[
                      "Profil complet : photo, statut (actif/à risque)",
                      "Timeline des interactions vocales",
                      "Tags auto-générés (intentions, émotions)",
                      "Scores (fidélité, satisfaction, churn)",
                      "Recommandations IA personnalisées"
                    ].map((item, index) => (
                      <HStack key={index} spacing={3} align="start">
                        <Box w="6px" h="6px" bg="#22c55e" borderRadius="50%" mt={2} />
                        <Text color="gray.300" fontSize="sm">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>

              {/* Actions IA */}
              <Box
                bg="rgba(59, 130, 246, 0.1)"
                border="1px solid rgba(59, 130, 246, 0.3)"
                borderRadius="2xl"
                p={8}
                backdropFilter="blur(20px)"
              >
                <VStack spacing={6} align="start">
                  <HStack spacing={3}>
                    <Text fontSize="2xl">🎯</Text>
                    <Heading size="lg" color="#3b82f6">
                      Actions IA du Jour
                    </Heading>
                  </HStack>
                  
                  <VStack spacing={3} align="start" w="full">
                    {[
                      "3 recommandations concrètes par CrewAI",
                      "Actions cochables (effectuée/ignorée)",
                      "Suivi de l'impact post-action",
                      "Objectifs IA hebdomadaires auto-générés",
                      "Jauge de progression pour chaque objectif"
                    ].map((item, index) => (
                      <HStack key={index} spacing={3} align="start">
                        <Box w="6px" h="6px" bg="#3b82f6" borderRadius="50%" mt={2} />
                        <Text color="gray.300" fontSize="sm">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>

              {/* Missions JARVIS */}
              <Box
                bg="rgba(245, 158, 11, 0.1)"
                border="1px solid rgba(245, 158, 11, 0.3)"
                borderRadius="2xl"
                p={8}
                backdropFilter="blur(20px)"
              >
                <VStack spacing={6} align="start">
                  <HStack spacing={3}>
                    <Text fontSize="2xl">🎙️</Text>
                    <Heading size="lg" color="#f59e0b">
                      Missions à JARVIS
                    </Heading>
                  </HStack>
                  
                  <VStack spacing={3} align="start" w="full">
                    {[
                      "Création de missions vocales personnalisées",
                      "Ciblage : message, audience, style, durée",
                      "Statistiques de diffusion en temps réel",
                      "Classement de votre salle dans le réseau",
                      "Notifications intelligentes automatiques"
                    ].map((item, index) => (
                      <HStack key={index} spacing={3} align="start">
                        <Box w="6px" h="6px" bg="#f59e0b" borderRadius="50%" mt={2} />
                        <Text color="gray.300" fontSize="sm">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </Grid>

            {/* Exemple concret */}
            <Box 
              bg="rgba(0, 0, 0, 0.6)" 
              border="1px solid rgba(255, 255, 255, 0.2)"
              borderRadius="2xl"
              p={8}
              w="full"
              maxW="5xl"
            >
              <VStack spacing={6}>
                <VStack spacing={2}>
                  <Text fontSize="2xl">💡</Text>
                  <Heading size="lg" color="white">
                    Exemple d'insight IA
                  </Heading>
                </VStack>
                
                <Box 
                  bg="rgba(239, 68, 68, 0.1)"
                  border="1px solid rgba(239, 68, 68, 0.3)"
                  borderRadius="xl"
                  p={6}
                  w="full"
                >
                  <VStack spacing={4}>
                    <Text color="#ef4444" fontWeight="bold" fontSize="lg">
                      🚨 Alerte Churn Détectée
                    </Text>
                    <Text color="gray.300" textAlign="center">
                      <Text as="span" fontWeight="semibold" color="white">Marie D.</Text> a mentionné 3 fois cette semaine que 
                      "les machines cardio sont toujours en panne". 
                      <Text as="span" color="#ef4444" fontWeight="semibold"> Risque de départ : 85%</Text>
                    </Text>
                    <Box 
                      bg="rgba(34, 197, 94, 0.1)"
                      border="1px solid rgba(34, 197, 94, 0.3)"
                      borderRadius="lg"
                      p={4}
                      w="full"
                    >
                      <Text color="#22c55e" fontWeight="semibold" fontSize="sm">
                        💡 Recommandation IA : Contactez Marie sous 48h pour un geste commercial 
                        et planifiez la maintenance cardio cette semaine.
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </motion.div>
      </Container>

      {/* SECTIONS VISIBLES - SANS GRADUAL BLUR POUR L'INSTANT */}
      <Box position="relative" zIndex={10} py={20} pointerEvents="none">
        {/* Section Solutions */}
        <Container maxW="6xl" px={6} py={20} pointerEvents="none">
          <VStack spacing={16} textAlign="center" pointerEvents="none">
            <VStack spacing={6} pointerEvents="none">
              <Heading 
                fontSize={{ base: "3xl", md: "5xl" }}
                color="white" 
                fontWeight="bold"
                pointerEvents="none"
              >
                Nos Solutions IA
              </Heading>
              <Text 
                fontSize="xl" 
                color="gray.300" 
                maxW="2xl"
                pointerEvents="none"
              >
                Découvrez comment JARVIS transforme l'expérience dans vos espaces.
              </Text>
            </VStack>

            {/* JARVIS SIMPLE CARDS */}
            <JarvisSimpleCards />
          </VStack>
        </Container>

        {/* Section Comment ça marche */}
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
                            fontWeight="bold"
                            color={step.color}
                            pointerEvents="none"
                          >
                            {step.step}
                          </Text>
                          
                          {/* Icône flottante */}
                          <Box
                            position="absolute"
                            top="-10px"
                            right="-10px"
                            w="40px"
                            h="40px"
                            borderRadius="50%"
                            bg="rgba(0, 0, 0, 0.8)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="xl"
                            pointerEvents="none"
                          >
                            {step.icon}
                          </Box>
                        </Box>

                        {/* Contenu */}
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
                            fontSize="md"
                            maxW="250px"
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

              {/* CTA de démonstration */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <VStack spacing={4} pointerEvents="none">
                  <Text 
                    fontSize="lg" 
                    color="gray.400"
                    pointerEvents="none"
                  >
                    Curieux de voir JARVIS en action ?
                  </Text>
                  <Button 
                    bg="rgba(255, 255, 255, 0.1)"
                    backdropFilter="blur(20px)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    color="white"
                    size="lg" 
                    px={8}
                    py={6}
                    borderRadius="full"
                    fontWeight="semibold"
                    fontSize="lg"
                    pointerEvents="auto"
                    _hover={{ 
                      transform: 'translateY(-2px)',
                      bg: "rgba(255, 255, 255, 0.2)",
                      borderColor: "rgba(255, 255, 255, 0.3)"
                    }}
                    transition="all 0.2s"
                  >
                    🎥 Voir la démo vidéo
                  </Button>
                </VStack>
              </motion.div>
            </VStack>
          </motion.div>
        </Container>

        {/* Section Bénéfices Chiffrés - ROI Concret */}
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
                  Résultats mesurables dès le 1er mois
                </Heading>
                <Text 
                  fontSize="xl" 
                  color="gray.300" 
                  maxW="3xl"
                  pointerEvents="none"
                >
                  Nos clients constatent une amélioration immédiate de leurs KPIs business
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

              {/* CTA Section avec urgence */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <VStack spacing={6} pointerEvents="none">
                  <Box 
                    bg="rgba(59, 130, 246, 0.1)" 
                    border="1px solid rgba(59, 130, 246, 0.3)"
                    borderRadius="2xl"
                    p={8}
                    backdropFilter="blur(20px)"
                    maxW="600px"
                  >
                    <VStack spacing={4} pointerEvents="none">
                      <Text 
                        fontSize="xl" 
                        fontWeight="semibold" 
                        color="white"
                        textAlign="center"
                        pointerEvents="none"
                      >
                        🚀 Obtenez ces résultats dans votre salle
                      </Text>
                      <Text 
                        color="gray.300" 
                        textAlign="center"
                        pointerEvents="none"
                      >
                        Installation gratuite • Formation incluse • Support 24/7
                      </Text>
                      <Button 
                        bg="#3b82f6"
                        color="white"
                        size="lg" 
                        px={10}
                        py={6}
                        borderRadius="full"
                        fontWeight="bold"
                        fontSize="lg"
                        pointerEvents="auto"
                        _hover={{ 
                          transform: 'translateY(-3px)',
                          bg: "#2563eb",
                          shadow: '0 15px 35px rgba(59, 130, 246, 0.4)'
                        }}
                        transition="all 0.3s"
                      >
                        🎯 Réserver ma démo personnalisée
                      </Button>
                    </VStack>
                  </Box>
                </VStack>
              </motion.div>
            </VStack>
          </motion.div>
        </Container>
      </Box>
    </Box>
  )
}