"use client"

import { Box, Container, VStack, Heading, Text, Button, HStack, Grid, GridItem, Flex, SimpleGrid } from '@chakra-ui/react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import LiquidEther from '@/components/LiquidEther'
import Dock from '@/components/Dock'
import { VscHome, VscArchive, VscAccount, VscSettingsGear, VscMail, VscCreditCard } from 'react-icons/vsc'
import Avatar3D from '@/components/kiosk/Avatar3D'
import CardSwap, { Card } from '@/components/CardSwap'
import TiltedCard from '@/components/TiltedCard'
import { useResponsive } from '@/hooks/useResponsive'

// Lazy loading des composants lourds pour optimiser les performances
const LazyTiltedCard = lazy(() => import('@/components/TiltedCard'))
const LazyCardSwap = lazy(() => import('@/components/CardSwap'))

// Mobile version inline - plus d'import externe

// Page client-only pour la landing page

export default function LandingClientPage() {
  // 📱 RESPONSIVE DETECTION
  const { showMobileVersion, showDesktopVersion } = useResponsive()

  // 🎭 SECTION CONTEXTUELLE POUR SPHÈRE INTELLIGENTE
  const [currentSection, setCurrentSection] = useState<'hero' | 'social-proof' | 'solutions' | 'benefits'>('hero')
  
  // 🎯 REF POUR SECTION TARIFICATION
  const tarifsRef = useRef<HTMLDivElement>(null)

  // Throttle function pour optimiser les performances
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }, [])

  // 🎭 DÉTECTION DE SECTION POUR COMPORTEMENT CONTEXTUEL (optimisé)
  useEffect(() => {
    const handleScroll = throttle(() => {
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
    }, 100) // Throttle à 100ms pour de meilleures performances

    // Écouter le scroll
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Appel initial

    return () => window.removeEventListener('scroll', handleScroll)
  }, [throttle])


  // Fonction de navigation smooth scroll avec offset pour le dock (optimisée)
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -150; // Offset augmenté pour meilleur positionnement
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  }, []);

  // Configuration du Dock - Navigation fonctionnelle (optimisée)
  const dockItems = useMemo(() => [
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
  ], [scrollToSection]);

  // 📱 CONDITIONAL RENDERING : MOBILE vs DESKTOP
  if (showMobileVersion) {
    return (
      <Box 
        minH="100vh"
        position="relative"
        width="100vw"
        overflowX="hidden"
        // BACKGROUND SOBRE - GRIS FONCÉ ÉLÉGANT
        background="linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 30%, #1f1f1f 60%, #0a0a0a 100%)"
        _before={{
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: `
            radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.02) 0%, transparent 60%),
            radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.01) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.015) 0%, transparent 55%)
          `,
          animation: 'backgroundPulseSubtle 12s ease-in-out infinite',
          zIndex: -1
        }}
      >
        {/* STYLE INLINE POUR ANIMATION SOBRE */}
        <style jsx>{`
          @keyframes backgroundPulseSubtle {
            0%, 100% {
              background: 
                radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.02) 0%, transparent 60%),
                radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.01) 0%, transparent 50%),
                radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.015) 0%, transparent 55%);
            }
            50% {
              background: 
                radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.015) 0%, transparent 55%),
                radial-gradient(circle at 20% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 60%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.01) 0%, transparent 50%);
            }
          }
        `}</style>

        {/* CONTENU MOBILE COMPLET */}
        <VStack spacing={0} position="relative" zIndex={1} width="100%" maxW="100vw">
          
          {/* === SECTION HERO === */}
          <Box 
            w="100%" 
            minH="100vh" 
            position="relative"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            px={4}
            overflow="hidden"
            id="hero-mobile"
          >
            {/* SPHÈRE JARVIS - POSITIONNÉE EN ARRIÈRE-PLAN */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 0.3, scale: 0.8, rotate: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "15%",
                right: "-10%",
                width: "300px",
                height: "300px",
                zIndex: 0
              }}
            >
              <Avatar3D 
                status="contextual"
              />
            </motion.div>

            {/* CONTENU PRINCIPAL - AU PREMIER PLAN */}
            <VStack 
              spacing={6} 
              textAlign="left"
              alignItems="flex-start"
              position="relative"
              zIndex={2}
              w="100%"
              maxW="320px"
              pl={4}
            >
              {/* TITRE PRINCIPAL */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <VStack spacing={3} alignItems="flex-start">
                  <Heading 
                    fontSize="3xl" 
                    color="white" 
                    fontWeight="bold"
                    textShadow="0 0 20px rgba(255, 255, 255, 0.2)"
                    lineHeight="1.1"
                  >
                    JARVIS
                  </Heading>
                  <Text 
                    fontSize="lg" 
                    color="rgba(255,255,255,0.9)" 
                    lineHeight="1.4"
                    fontWeight="medium"
                  >
                    révolutionne l'expérience
                    <br />
                    salle de sport
                  </Text>
                </VStack>
              </motion.div>

              {/* POINTS CLÉS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <VStack spacing={4} mt={6} alignItems="flex-start">
                  <Text fontSize="sm" color="rgba(255,255,255,0.8)" display="flex" alignItems="center">
                    <Box as="span" mr={3} fontSize="md">⚡</Box>
                    Coach virtuel personnalisé
                  </Text>
                  <Text fontSize="sm" color="rgba(255,255,255,0.8)" display="flex" alignItems="center">
                    <Box as="span" mr={3} fontSize="md">📊</Box>
                    Analytics en temps réel
                  </Text>
                  <Text fontSize="sm" color="rgba(255,255,255,0.8)" display="flex" alignItems="center">
                    <Box as="span" mr={3} fontSize="md">🎯</Box>
                    Expérience membre immersive
                  </Text>
                </VStack>
              </motion.div>

              {/* CTA PRINCIPAL */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Button
                  size="lg"
                  px={8}
                  py={4}
                  bg="rgba(255, 255, 255, 0.12)"
                  color="white"
                  border="1px solid rgba(255, 255, 255, 0.25)"
                  borderRadius="full"
                  fontWeight="medium"
                  fontSize="md"
                  backdropFilter="blur(15px)"
                  boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.18)",
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                  }}
                  transition="all 0.3s ease"
                  mt={8}
                >
                  Parler à JARVIS
                </Button>
              </motion.div>
            </VStack>
          </Box>

          {/* === SECTION PROBLÈMES === */}
          <Box w="100%" py={16} px={6} id="problemes-mobile">
            <VStack spacing={8} maxW="400px" mx="auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Heading fontSize="xl" color="white" textAlign="center" fontWeight="semibold">
                  Les défis du fitness aujourd'hui
                </Heading>
              </motion.div>
              
              <VStack spacing={6}>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  style={{ width: '100%' }}
                >
                  <Box 
                    p={4} 
                    bg="rgba(255, 255, 255, 0.03)" 
                    borderRadius="lg" 
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    w="100%"
                  >
                    <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium" mb={2}>
                      📉 Taux d'abandon élevé
                    </Text>
                    <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                      40% des membres abandonnent dans les 6 premiers mois
                    </Text>
                  </Box>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  style={{ width: '100%' }}
                >
                  <Box 
                    p={4} 
                    bg="rgba(255, 255, 255, 0.03)" 
                    borderRadius="lg" 
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    w="100%"
                  >
                    <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium" mb={2}>
                      🤷 Manque d'accompagnement
                    </Text>
                    <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                      Les membres se sentent perdus sans guidance
                    </Text>
                  </Box>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  style={{ width: '100%' }}
                >
                  <Box 
                    p={4} 
                    bg="rgba(255, 255, 255, 0.03)" 
                    borderRadius="lg" 
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    w="100%"
                  >
                    <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium" mb={2}>
                      📊 Données inexploitées
                    </Text>
                    <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                      Aucune analyse comportementale des membres
                    </Text>
                  </Box>
                </motion.div>
              </VStack>
            </VStack>
          </Box>

          {/* === SECTION SOLUTIONS === */}
          <Box w="100%" py={16} px={6} bg="rgba(255, 255, 255, 0.02)" id="solutions-mobile">
            <VStack spacing={8} maxW="400px" mx="auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <Heading fontSize="xl" color="white" textAlign="center" fontWeight="semibold">
                  La solution JARVIS
                </Heading>
              </motion.div>
              
              <VStack spacing={6}>
                <Box 
                  p={4} 
                  bg="rgba(255, 255, 255, 0.05)" 
                  borderRadius="lg" 
                  border="1px solid rgba(255, 255, 255, 0.15)"
                  w="100%"
                >
                  <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium" mb={2}>
                    🤖 Coach IA personnalisé
                  </Text>
                  <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                    Accompagnement 24/7 adapté à chaque membre
                  </Text>
                </Box>

                <Box 
                  p={4} 
                  bg="rgba(255, 255, 255, 0.05)" 
                  borderRadius="lg" 
                  border="1px solid rgba(255, 255, 255, 0.15)"
                  w="100%"
                >
                  <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium" mb={2}>
                    📱 Interface immersive
                  </Text>
                  <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                    Miroir digital interactif et expérience gamifiée
                  </Text>
                </Box>

                <Box 
                  p={4} 
                  bg="rgba(255, 255, 255, 0.05)" 
                  borderRadius="lg" 
                  border="1px solid rgba(255, 255, 255, 0.15)"
                  w="100%"
                >
                  <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium" mb={2}>
                    📊 Dashboard gérant
                  </Text>
                  <Text fontSize="xs" color="rgba(255,255,255,0.7)">
                    Analytics avancés et insights business
                  </Text>
                </Box>
              </VStack>
            </VStack>
          </Box>

          {/* === SECTION COMMENT ÇA MARCHE === */}
          <Box w="100%" py={16} px={6} id="comment-mobile">
            <VStack spacing={8} maxW="400px" mx="auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Heading fontSize="xl" color="white" textAlign="center" fontWeight="semibold">
                  Comment ça marche ?
                </Heading>
              </motion.div>
              
              <VStack spacing={8}>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  style={{ width: '100%' }}
                >
                  <HStack spacing={4} align="start" w="100%">
                    <Box 
                      w="30px" 
                      h="30px" 
                      bg="rgba(255, 255, 255, 0.1)" 
                      borderRadius="full" 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="sm" color="white" fontWeight="bold">1</Text>
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium">
                        Badge d'identification
                      </Text>
                      <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                        Le membre scanne son badge pour démarrer sa session
                      </Text>
                    </VStack>
                  </HStack>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  style={{ width: '100%' }}
                >
                  <HStack spacing={4} align="start" w="100%">
                    <Box 
                      w="30px" 
                      h="30px" 
                      bg="rgba(255, 255, 255, 0.1)" 
                      borderRadius="full" 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="sm" color="white" fontWeight="bold">2</Text>
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium">
                        Interaction avec JARVIS
                      </Text>
                      <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                        L'IA analyse et propose un programme personnalisé
                      </Text>
                    </VStack>
                  </HStack>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  style={{ width: '100%' }}
                >
                  <HStack spacing={4} align="start" w="100%">
                    <Box 
                      w="30px" 
                      h="30px" 
                      bg="rgba(255, 255, 255, 0.1)" 
                      borderRadius="full" 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="sm" color="white" fontWeight="bold">3</Text>
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium">
                        Suivi en temps réel
                      </Text>
                      <Text fontSize="xs" color="rgba(255,255,255,0.6)">
                        Analytics et feedback continu pour optimiser les résultats
                      </Text>
                    </VStack>
                  </HStack>
                </motion.div>
              </VStack>
            </VStack>
          </Box>

          {/* === SECTION TARIFICATION === */}
          <Box w="100%" py={16} px={6} bg="rgba(255, 255, 255, 0.02)" id="tarifs-mobile">
            <VStack spacing={8} maxW="400px" mx="auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Heading fontSize="xl" color="white" textAlign="center" fontWeight="semibold">
                  Modèle tarifaire
                </Heading>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                style={{ width: '100%' }}
              >
                <Box 
                  p={6} 
                  bg="rgba(255, 255, 255, 0.05)" 
                  borderRadius="xl" 
                  border="1px solid rgba(255, 255, 255, 0.15)"
                  w="100%"
                >
                <VStack spacing={4}>
                  <Text fontSize="lg" color="white" fontWeight="semibold" textAlign="center">
                    Solution complète
                  </Text>
                  
                  <VStack spacing={3} w="100%">
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm" color="rgba(255,255,255,0.8)">
                        Installation & Formation
                      </Text>
                      <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium">
                        Sur devis
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm" color="rgba(255,255,255,0.8)">
                        Abonnement mensuel
                      </Text>
                      <Text fontSize="sm" color="rgba(255,255,255,0.9)" fontWeight="medium">
                        Forfait + usage
                      </Text>
                    </HStack>
                  </VStack>

                  <Button
                    size="md"
                    w="100%"
                    bg="rgba(255, 255, 255, 0.1)"
                    color="white"
                    border="1px solid rgba(255, 255, 255, 0.2)"
                    borderRadius="lg"
                    fontWeight="medium"
                    fontSize="sm"
                    backdropFilter="blur(10px)"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.15)",
                      transform: 'translateY(-1px)'
                    }}
                    transition="all 0.3s ease"
                    mt={4}
                  >
                    Demander un devis
                  </Button>
                </VStack>
                </Box>
              </motion.div>
            </VStack>
          </Box>

          {/* === SECTION CONTACT === */}
          <Box w="100%" py={16} px={6} id="contact-mobile">
            <VStack spacing={8} maxW="400px" mx="auto" textAlign="center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Heading fontSize="xl" color="white" fontWeight="semibold">
                  Prêt à révolutionner votre salle ?
                </Heading>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Text fontSize="sm" color="rgba(255,255,255,0.7)" lineHeight="1.6">
                  Découvrez comment JARVIS peut transformer l'expérience de vos membres et optimiser votre business.
                </Text>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                style={{ width: '100%' }}
              >
                <VStack spacing={4} w="100%">
                <Button
                  size="lg"
                  w="100%"
                  bg="rgba(255, 255, 255, 0.1)"
                  color="white"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  borderRadius="lg"
                  fontWeight="medium"
                  fontSize="md"
                  backdropFilter="blur(10px)"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.15)",
                    transform: 'translateY(-1px)'
                  }}
                  transition="all 0.3s ease"
                >
                  Parler à JARVIS
                </Button>

                <Button
                  size="md"
                  w="100%"
                  bg="transparent"
                  color="rgba(255,255,255,0.8)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="lg"
                  fontWeight="normal"
                  fontSize="sm"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                    color: "white"
                  }}
                  transition="all 0.3s ease"
                >
                  Réserver une démo
                </Button>
                </VStack>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Text fontSize="xs" color="rgba(255,255,255,0.5)" mt={8}>
                  © 2024 JARVIS Group - L'avenir du fitness
                </Text>
              </motion.div>
            </VStack>
          </Box>

        </VStack>

        {/* === DOCK ÉLÉGANT === */}
        <Box
          position="fixed"
          bottom="25px"
          left="50%"
          transform="translateX(-50%)"
          zIndex={1000}
        >
          <HStack
            spacing={4}
            bg="rgba(255, 255, 255, 0.06)"
            backdropFilter="blur(15px)"
            borderRadius="full"
            px={4}
            py={3}
            border="1px solid rgba(255, 255, 255, 0.1)"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.15)"
          >
            {/* HOME */}
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="rgba(255, 255, 255, 0.5)"
              _hover={{ 
                bg: "rgba(255, 255, 255, 0.7)",
                transform: "scale(1.2)"
              }}
              transition="all 0.2s ease"
              onClick={() => {
                console.log('Navigating to hero-mobile');
                document.getElementById('hero-mobile')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
            />

            {/* PROBLÈMES & SOLUTIONS */}
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="rgba(255, 255, 255, 0.2)"
              _hover={{ 
                bg: "rgba(255, 255, 255, 0.5)",
                transform: "scale(1.2)"
              }}
              transition="all 0.2s ease"
              onClick={() => {
                console.log('Navigating to problemes-mobile');
                document.getElementById('problemes-mobile')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
            />

            {/* COMMENT ÇA MARCHE */}
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="rgba(255, 255, 255, 0.2)"
              _hover={{ 
                bg: "rgba(255, 255, 255, 0.5)",
                transform: "scale(1.2)"
              }}
              transition="all 0.2s ease"
              onClick={() => {
                console.log('Navigating to comment-mobile');
                document.getElementById('comment-mobile')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
            />

            {/* TARIFS */}
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="rgba(255, 255, 255, 0.2)"
              _hover={{ 
                bg: "rgba(255, 255, 255, 0.5)",
                transform: "scale(1.2)"
              }}
              transition="all 0.2s ease"
              onClick={() => {
                console.log('Navigating to tarifs-mobile');
                document.getElementById('tarifs-mobile')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
            />

            {/* CONTACT */}
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="rgba(255, 255, 255, 0.2)"
              _hover={{ 
                bg: "rgba(255, 255, 255, 0.5)",
                transform: "scale(1.2)"
              }}
              transition="all 0.2s ease"
              onClick={() => {
                console.log('Navigating to contact-mobile');
                document.getElementById('contact-mobile')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
            />
          </HStack>
        </Box>
      </Box>
    )
  }

  // 🖥️ VERSION DESKTOP (INCHANGÉE)
  return (
    <Box bg="transparent" position="relative" minH="100vh">
      {/* BOUTON CONNEXION FIXE EN HAUT À DROITE */}
      <Box
        position="fixed"
        top={6}
        right={6}
        zIndex={1000}
        pointerEvents="auto"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <Button
            variant="outline"
            size="md"
            bg="rgba(59, 130, 246, 0.15)"
            backdropFilter="blur(20px)"
            border="2px solid rgba(59, 130, 246, 0.4)"
            color="white"
            fontWeight="semibold"
            boxShadow="0 4px 15px rgba(59, 130, 246, 0.2)"
            _hover={{
              bg: "rgba(59, 130, 246, 0.25)",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
              borderColor: "rgba(59, 130, 246, 0.6)"
            }}
            transition="all 0.3s ease"
            onClick={() => window.location.href = '/login'}
          >
            <HStack spacing={2}>
              <Text fontSize="sm">Déjà client ?</Text>
              <Box fontSize="xs">→</Box>
            </HStack>
          </Button>
        </motion.div>
      </Box>

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

      {/* LOGO JARVIS DISCRET EN HAUT À GAUCHE */}
      <Box
        position="fixed"
        top={6}
        left={6}
        zIndex={1000}
        pointerEvents="auto"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <Heading 
            fontSize={{ base: "xl", md: "2xl" }}
            color="white" 
            fontWeight="semibold"
            letterSpacing="0.05em"
            pointerEvents="none"
            fontFamily="system-ui, -apple-system, sans-serif"
            opacity={0.8}
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
          justify="center"
          minH="100vh"
          textAlign="center"
          pointerEvents="none"
        >

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
                <VStack spacing={4} align="flex-start">
                <Text 
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.300" 
                  lineHeight="1.6"
                  textAlign="left"
                  pointerEvents="none"
                >
                  JARVIS transforme chaque interaction membre en expérience personnalisée 24/7. 
                  </Text>
                  <Text 
                    fontSize={{ base: "lg", md: "xl" }}
                    color="gray.300" 
                    lineHeight="1.6"
                    textAlign="left"
                    pointerEvents="none"
                  >
                  Réduisez votre churn de 67% avec l'IA conversationnelle la plus avancée du fitness.
                </Text>
                </VStack>
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
                
                {/* Bouton élégant pour clients existants */}
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
                  status="contextual"
                  currentSection={currentSection}
                />
                

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
                  containerHeight="260px"
                  containerWidth="100%"
                  imageHeight="260px"
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
                  containerHeight="260px"
                  containerWidth="100%"
                  imageHeight="260px"
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
                  containerHeight="260px"
                  containerWidth="100%"
                  imageHeight="260px"
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
                    containerHeight="260px"
                    containerWidth="100%"
                    imageHeight="260px"
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
                    containerHeight="260px"
                    containerWidth="100%"
                    imageHeight="260px"
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
                    containerHeight="260px"
                    containerWidth="100%"
                    imageHeight="260px"
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
      <Container id="comment-ca-marche" maxW="6xl" px={6} py={20} mt={20} position="relative" zIndex={5} style={{ scrollMarginTop: '160px' }}>
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
      <Box id="dashboard" w="100vw" position="relative" zIndex={10} py={20} mt={20} overflow="hidden" minH="700px" pointerEvents="none" style={{ scrollMarginTop: '160px' }}>
        <Container maxW="6xl" px={6} pointerEvents="none">
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
                           <Image 
                             src="/images/dashboard-gerant.jpg"
                             alt="Dashboard JARVIS - Vue d'ensemble"
                             width={800}
                             height={600}
                             priority={false}
                             loading="lazy"
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
      <Container maxW="6xl" px={6} position="relative" zIndex={10} py={20} pointerEvents="none">
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
       <Container id="tarifs" ref={tarifsRef} maxW="6xl" px={6} py={20} mt={20} position="relative" zIndex={10} pointerEvents="none" style={{ scrollMarginTop: '160px' }}>
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
                    color="white"
                  >
                    Modèle Tarification
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

               {/* Espacement pour voir le titre et description */}
              <Box h="30vh" />

              {/* Tarification Simplifiée - Carousel */}
               <VStack spacing={12}>
                 {/* Carte 1 - Installation & Formation */}
                 <Box
                   w="full"
                   maxW={{ base: "95vw", md: "1200px", lg: "1600px" }}
                   h={{ base: "600px", md: "700px", lg: "800px" }}
                    borderRadius="3xl"
                   position="relative"
                    overflow="hidden"
                   bg="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                   border="2px solid rgba(255, 255, 255, 0.15)"
                   boxShadow="0 30px 60px rgba(0, 0, 0, 0.7)"
                   backdropFilter="blur(30px)"
                   _before={{
                     content: '""',
                     position: 'absolute',
                     inset: 0,
                     bg: 'rgba(15, 23, 42, 0.85)',
                     zIndex: 1
                   }}
                 >
                       {/* Image de fond */}
                    <Box
                      position="absolute"
                         inset={0}
                         backgroundImage="url('/images/installation-bg.jpg')"
                         backgroundSize="cover"
                         backgroundPosition="center"
                         opacity={0.2}
                         filter="blur(2px)"
                       />
                       
                       {/* Contenu */}
                       <Flex h="full" align="center" justify="space-between" p={12} position="relative" zIndex={3}>
                         <VStack align="flex-start" spacing={6} flex="1" maxW="55%">
                           <Box>
                             <motion.div
                               animate={{ 
                                 rotate: [0, 5, -5, 0],
                                 scale: [1, 1.1, 1]
                               }}
                               transition={{ 
                                 duration: 4,
                                 repeat: Infinity,
                                 ease: "easeInOut"
                               }}
                             >
                               <Text fontSize="5xl" mb={4}>🚀</Text>
                             </motion.div>
                             <motion.div
                               initial={{ opacity: 0, y: 20 }}
                               whileInView={{ opacity: 1, y: 0 }}
                               transition={{ duration: 0.8, delay: 0.2 }}
                             >
                               <Heading fontSize="3xl" fontWeight="black" color="white" mb={4}>
                                 Installation & Formation
                               </Heading>
                             </motion.div>
                             <motion.div
                               initial={{ opacity: 0, y: 20 }}
                               whileInView={{ opacity: 1, y: 0 }}
                               transition={{ duration: 0.8, delay: 0.4 }}
                             >
                               <Text fontSize="lg" color="rgba(255,255,255,0.9)" lineHeight="1.5">
                                 Déploiement complet sur site avec formation personnalisée de votre équipe. 
                                 Configuration IA adaptée à votre environnement.
                               </Text>
                             </motion.div>
                    </Box>

                           <VStack align="flex-start" spacing={4}>
                             {[
                               { icon: "🔧", title: "Installation matérielle complète", desc: "Miroirs digitaux, capteurs IA, infrastructure réseau" },
                               { icon: "🤖", title: "Configuration IA personnalisée", desc: "Calibrage vocal, reconnaissance faciale, données membres" },
                               { icon: "👥", title: "Formation équipe (2 jours)", desc: "Prise en main, maintenance, support technique" },
                               { icon: "📊", title: "Dashboard manager intégré", desc: "Analytics temps réel, insights membres, ROI tracking" },
                               { icon: "🔄", title: "Synchronisation cloud", desc: "Backup automatique, mises à jour OTA, monitoring 24/7" }
                             ].map((item, i) => (
                    <motion.div
                                 key={i}
                                 initial={{ opacity: 0, x: -20 }}
                                 whileInView={{ opacity: 1, x: 0 }}
                                 transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                               >
                                 <HStack spacing={3} align="flex-start">
                                   <motion.div
                      animate={{
                                       scale: [1, 1.1, 1],
                                       rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                                       delay: i * 0.5
                                     }}
                                   >
                                     <Text fontSize="xl">{item.icon}</Text>
                                   </motion.div>
                                   <VStack align="flex-start" spacing={0.5}>
                                     <Text fontSize="md" fontWeight="bold" color="white">{item.title}</Text>
                                     <Text fontSize="sm" color="rgba(255,255,255,0.7)" lineHeight="1.3">{item.desc}</Text>
                                   </VStack>
                                 </HStack>
                               </motion.div>
                             ))}
                           </VStack>
                           
                           <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             whileInView={{ opacity: 1, scale: 1 }}
                             transition={{ duration: 0.6, delay: 0.8 }}
                             whileHover={{ scale: 1.05 }}
                           >
                             <Box
                               bg="rgba(255,255,255,0.2)"
                               px={6}
                               py={3}
                               borderRadius="full"
                               backdropFilter="blur(10px)"
                               position="relative"
                               overflow="hidden"
                             >
                               <Text fontSize="lg" fontWeight="bold" color="white">
                                 💰 Sur devis personnalisé
                          </Text>
                             </Box>
                           </motion.div>
                      </VStack>

                         {/* Illustration droite */}
                         <Box flex="0 0 40%" h="full" position="relative">
                          <motion.div
                             animate={{
                               y: [0, -20, 0],
                               rotateY: [0, 5, 0]
                             }}
                            transition={{ 
                               duration: 6,
                               repeat: Infinity,
                               ease: "easeInOut"
                             }}
                             style={{ height: "100%" }}
                           >
                             <Box
                               w="full"
                               h="80%"
                               bg="rgba(255,255,255,0.1)"
                               borderRadius="2xl"
                               border="2px solid rgba(255,255,255,0.2)"
                               backdropFilter="blur(10px)"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                               position="relative"
                               overflow="hidden"
                             >
                               <Text fontSize="8xl" opacity={0.3}>🏗️</Text>
                               
                               {/* Particules flottantes */}
                               {[...Array(6)].map((_, i) => (
                                 <motion.div
                                   key={i}
                                   style={{
                                     position: "absolute",
                                     width: "4px",
                                     height: "4px",
                                     background: "white",
                                     borderRadius: "50%",
                                     left: `${20 + i * 12}%`,
                                     top: `${20 + i * 10}%`
                                   }}
                                   animate={{
                                     y: [0, -15, 0],
                                     opacity: [0.3, 1, 0.3]
                                   }}
                                   transition={{
                                     duration: 2 + i * 0.5,
                                     repeat: Infinity,
                                     delay: i * 0.3
                                   }}
                                 />
                               ))}
                             </Box>
                           </motion.div>
                         </Box>
                       </Flex>
                              </Box>

                 {/* Carte 2 - Abonnement Mensuel */}
                 <Box
                   w="full"
                   maxW={{ base: "95vw", md: "1200px", lg: "1600px" }}
                   h={{ base: "600px", md: "700px", lg: "800px" }}
                   borderRadius="3xl"
                   position="relative"
                   overflow="hidden"
                   bg="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                   border="2px solid rgba(34, 197, 94, 0.3)"
                   boxShadow="0 30px 60px rgba(34, 197, 94, 0.2)"
                   backdropFilter="blur(30px)"
                   _before={{
                     content: '""',
                     position: 'absolute',
                     inset: 0,
                     bg: 'rgba(15, 23, 42, 0.85)',
                     zIndex: 1
                   }}
                 >
                       {/* Badge Populaire */}
                       <Box
                         position="absolute"
                         top={8}
                         right={8}
                         bg="rgba(255,255,255,0.9)"
                         color="green.600"
                         px={4}
                         py={2}
                         borderRadius="full"
                         fontSize="sm"
                         fontWeight="bold"
                         zIndex={10}
                       >
                         ⭐ POPULAIRE
                       </Box>
                       
                       <Flex h="full" align="center" justify="space-between" p={12} position="relative" zIndex={3}>
                         <VStack align="flex-start" spacing={6} flex="1" maxW="55%">
                           <Box>
                             <Text fontSize="4xl" mb={3}>💎</Text>
                             <Heading fontSize="3xl" fontWeight="black" color="white" mb={3}>
                               Abonnement Mensuel
                             </Heading>
                             <Text fontSize="lg" color="rgba(255,255,255,0.9)" lineHeight="1.5">
                               Accès complet à JARVIS avec toutes les fonctionnalités IA, 
                               support 24/7 et mises à jour automatiques.
                                </Text>
                           </Box>
                           
                           <VStack align="flex-start" spacing={3}>
                             {[
                               { icon: "🤖", title: "IA conversationnelle illimitée", desc: "Interactions membres sans limite" },
                               { icon: "📊", title: "Dashboard analytics avancé", desc: "Métriques temps réel et insights" },
                               { icon: "🛟", title: "Support prioritaire 24/7", desc: "Assistance technique dédiée" },
                               { icon: "🔄", title: "Mises à jour automatiques", desc: "Nouvelles fonctionnalités incluses" },
                               { icon: "☁️", title: "Stockage cloud illimité", desc: "Données membres sécurisées" },
                               { icon: "📱", title: "App mobile manager", desc: "Contrôle à distance de votre salle" }
                             ].map((feature, i) => (
                               <motion.div
                                 key={i}
                                 initial={{ opacity: 0, x: -15 }}
                                 whileInView={{ opacity: 1, x: 0 }}
                                 transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                               >
                                 <HStack spacing={3} align="flex-start">
                                   <Text fontSize="lg">{feature.icon}</Text>
                                   <VStack align="flex-start" spacing={0}>
                                     <Text fontSize="md" fontWeight="semibold" color="white">{feature.title}</Text>
                                     <Text fontSize="sm" color="rgba(255,255,255,0.7)">{feature.desc}</Text>
                              </VStack>
                            </HStack>
                          </motion.div>
                        ))}
                      </VStack>

                           <Box
                             bg="rgba(255,255,255,0.2)"
                             px={6}
                             py={3}
                             borderRadius="full"
                             backdropFilter="blur(10px)"
                           >
                             <Text fontSize="lg" fontWeight="bold" color="white">
                               💳 Forfait mensuel flexible
                             </Text>
                           </Box>
                         </VStack>
                         
                         <Box flex="0 0 40%" h="full" position="relative">
                      <motion.div
                             animate={{
                               scale: [1, 1.05, 1],
                               rotateZ: [0, 2, -2, 0]
                             }}
                             transition={{
                               duration: 4,
                               repeat: Infinity,
                               ease: "easeInOut"
                             }}
                             style={{ height: "100%" }}
                           >
                             <Box
                          w="full"
                               h="80%"
                               bg="rgba(255,255,255,0.1)"
                               borderRadius="2xl"
                               border="2px solid rgba(255,255,255,0.2)"
                               backdropFilter="blur(10px)"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                               position="relative"
                               overflow="hidden"
                             >
                               <Text fontSize="8xl" opacity={0.3}>📊</Text>
                               
                               {/* Effet de pulsation */}
                               <motion.div
                                 style={{
                                   position: "absolute",
                                   inset: 0,
                                   background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                                   borderRadius: "16px"
                                 }}
                                 animate={{
                                   opacity: [0.1, 0.3, 0.1]
                                 }}
                                 transition={{
                                   duration: 3,
                                   repeat: Infinity
                                 }}
                               />
                  </Box>
                </motion.div>
                         </Box>
                       </Flex>
                     </Box>
                 {/* Carte 3 - Support & Évolutions */}
                 <Box
                   w="full"
                   maxW={{ base: "95vw", md: "1200px", lg: "1600px" }}
                   h={{ base: "600px", md: "700px", lg: "800px" }}
                   borderRadius="3xl"
                   position="relative"
                   overflow="hidden"
                   bg="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                   border="2px solid rgba(249, 115, 22, 0.3)"
                   boxShadow="0 30px 60px rgba(249, 115, 22, 0.2)"
                   backdropFilter="blur(30px)"
                   _before={{
                     content: '""',
                     position: 'absolute',
                     inset: 0,
                     bg: 'rgba(15, 23, 42, 0.85)',
                     zIndex: 1
                   }}
                 >
                       <Flex h="full" align="center" justify="space-between" p={12} position="relative" zIndex={3}>
                         <VStack align="flex-start" spacing={6} flex="1" maxW="55%">
                           <Box>
                             <Text fontSize="4xl" mb={3}>🛠️</Text>
                             <Heading fontSize="3xl" fontWeight="black" color="white" mb={3}>
                               Support & Évolutions
                             </Heading>
                             <Text fontSize="lg" color="rgba(255,255,255,0.9)" lineHeight="1.5">
                               Maintenance proactive, mises à jour continues et évolutions 
                               technologiques pour rester à la pointe de l'innovation.
                             </Text>
              </Box>

                           <VStack align="flex-start" spacing={2}>
                             <HStack spacing={3}>
                               <Box w="4px" h="4px" bg="white" borderRadius="50%" />
                               <Text fontSize="sm" color="rgba(255,255,255,0.8)">Maintenance préventive</Text>
                             </HStack>
                             <HStack spacing={3}>
                               <Box w="4px" h="4px" bg="white" borderRadius="50%" />
                               <Text fontSize="sm" color="rgba(255,255,255,0.8)">Mises à jour automatiques</Text>
                             </HStack>
                             <HStack spacing={3}>
                               <Box w="4px" h="4px" bg="white" borderRadius="50%" />
                               <Text fontSize="sm" color="rgba(255,255,255,0.8)">Nouvelles fonctionnalités</Text>
                             </HStack>
                           </VStack>
                           
                           <Box
                             bg="rgba(255,255,255,0.2)"
                             px={4}
                             py={2}
                             borderRadius="full"
                             backdropFilter="blur(10px)"
                           >
                             <Text fontSize="md" fontWeight="bold" color="white">
                               🔧 Inclus dans l'abonnement
                             </Text>
                           </Box>
                         </VStack>
                         
                         <Box flex="0 0 40%" h="full" position="relative">
              <motion.div
                             animate={{
                               rotateY: [0, 10, -10, 0],
                               y: [0, -10, 0]
                             }}
                             transition={{
                               duration: 5,
                               repeat: Infinity,
                               ease: "easeInOut"
                             }}
                             style={{ height: "100%" }}
              >
                <Box
                               w="full"
                               h="80%"
                               bg="rgba(255,255,255,0.1)"
                  borderRadius="2xl"
                               border="2px solid rgba(255,255,255,0.2)"
                               backdropFilter="blur(10px)"
                               display="flex"
                               alignItems="center"
                               justifyContent="center"
                  position="relative"
                  overflow="hidden"
                >
                               <Text fontSize="8xl" opacity={0.3}>⚙️</Text>
                               
                               {/* Engrenages animés */}
                               {[...Array(3)].map((_, i) => (
                  <motion.div
                                   key={i}
                    style={{
                      position: "absolute",
                                     width: "20px",
                                     height: "20px",
                                     border: "2px solid rgba(255,255,255,0.4)",
                                     borderRadius: "50%",
                                     left: `${30 + i * 20}%`,
                                     top: `${30 + i * 15}%`
                    }}
                    animate={{
                                     rotate: [0, 360]
                    }}
                    transition={{
                                     duration: 3 + i,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                               ))}
                             </Box>
                           </motion.div>
                         </Box>
                       </Flex>
                     </Box>
                 {/* Carte 4 - CTA Final */}
                 <Box
                   w="full"
                   maxW={{ base: "95vw", md: "1200px", lg: "1600px" }}
                   h={{ base: "600px", md: "700px", lg: "800px" }}
                   borderRadius="3xl"
                   position="relative"
                   overflow="hidden"
                   bg="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                   border="2px solid rgba(139, 92, 246, 0.3)"
                   boxShadow="0 30px 60px rgba(139, 92, 246, 0.2)"
                   backdropFilter="blur(30px)"
                   _before={{
                     content: '""',
                     position: 'absolute',
                     inset: 0,
                     bg: 'rgba(15, 23, 42, 0.85)',
                     zIndex: 1
                   }}
                 >
                       <Flex h="full" align="center" justify="center" p={12} position="relative" zIndex={3}>
                         <VStack spacing={8} textAlign="center" maxW="600px">
                           <Box>
                             <Text fontSize="8xl" mb={6}>✨</Text>
                             <Heading fontSize="5xl" fontWeight="black" color="white" mb={6}>
                               Prêt à transformer votre salle ?
                             </Heading>
                             <Text fontSize="xl" color="rgba(255,255,255,0.9)" lineHeight="1.6" mb={8}>
                               Rejoignez les salles de sport qui révolutionnent l'expérience membre 
                               avec l'IA conversationnelle JARVIS.
                    </Text>
                           </Box>
                           
                           <HStack spacing={6} justify="center" flexWrap="wrap">
                             <motion.div
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                             >
                               <Button
                                 size="xl"
                                 px={12}
                                 py={8}
                                 borderRadius="2xl"
                                 fontWeight="black"
                                 fontSize="xl"
                                 bg="rgba(255,255,255,0.9)"
                                 color="purple.600"
                                 _hover={{
                                   bg: "white",
                                   transform: "translateY(-2px)",
                                   boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                                 }}
                                 transition="all 0.3s"
                               >
                                 🚀 Commencer maintenant
                               </Button>
                             </motion.div>
                             
                             <motion.div
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                             >
                               <Button
                                 size="xl"
                                 px={12}
                                 py={8}
                                 borderRadius="2xl"
                                 fontWeight="black"
                                 fontSize="xl"
                                 variant="outline"
                                 borderColor="rgba(255,255,255,0.4)"
                                 color="white"
                                 _hover={{
                                   borderColor: "white",
                                   bg: "rgba(255,255,255,0.1)",
                                   transform: "translateY(-2px)"
                                 }}
                                 transition="all 0.3s"
                               >
                                 📞 Parler à un expert
                               </Button>
                             </motion.div>
                           </HStack>
                           
                  </VStack>
                       </Flex>
                       
                </Box>
               </VStack>

               {/* Espacement pour voir la dernière carte */}
               <Box h="30vh" />
            </VStack>
          </motion.div>
        </Container>


      {/* SECTION CONTACT */}
      <Container id="contact" maxW="4xl" px={6} py={20} mt={20} mb={20} position="relative" zIndex={5} style={{ scrollMarginTop: '160px' }}>
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
