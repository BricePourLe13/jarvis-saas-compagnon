"use client"

import { Box, VStack, Heading, Text } from '@chakra-ui/react'
import { VscHome, VscArchive, VscAccount, VscMail, VscCreditCard } from 'react-icons/vsc'
import { useState, useRef } from 'react'
import MobileHero from './MobileHero'
import MobileNavigation from './MobileNavigation'
import MobileCarousel from './MobileCarousel'
import MobileStepper from './MobileStepper'
import MobilePricing from './MobilePricing'
// Background inline - plus d'import externe nécessaire

const MobileLandingPage = () => {
  const [activeSection, setActiveSection] = useState('hero')

  // Data pour le carousel Problème/Solution
  const problemSolutionItems = [
    {
      id: 'problem1',
      emoji: '📉',
      title: 'Churn Rate Élevé',
      description: '40% des membres abandonnent leur abonnement dans les 6 premiers mois par manque d\'engagement.',
      color: '#EF4444'
    },
    {
      id: 'problem2', 
      emoji: '😴',
      title: 'Expérience Impersonnelle',
      description: 'Les membres se sentent perdus sans guidance personnalisée adaptée à leurs objectifs.',
      color: '#F59E0B'
    },
    {
      id: 'solution1',
      emoji: '🤖',
      title: 'IA Conversationnelle',
      description: 'JARVIS accompagne chaque membre avec des conseils personnalisés en temps réel.',
      color: '#3B82F6'
    },
    {
      id: 'solution2',
      emoji: '📊',
      title: 'Analytics Prédictifs',
      description: 'Anticipez les besoins et réduisez le churn grâce à l\'intelligence artificielle.',
      color: '#8B5CF6'
    }
  ]

  // Data pour le stepper "Comment ça marche"
  const howItWorksSteps = [
    {
      id: 'step1',
      number: 1,
      title: 'Installation Express',
      description: 'Notre équipe installe JARVIS dans votre salle en une journée avec formation complète.',
      emoji: '🚀'
    },
    {
      id: 'step2', 
      number: 2,
      title: 'Configuration IA',
      description: 'Personnalisation de l\'IA selon vos équipements et programmes d\'entraînement.',
      emoji: '⚙️'
    },
    {
      id: 'step3',
      number: 3,
      title: 'Lancement & Suivi',
      description: 'Vos membres découvrent JARVIS et vous suivez les performances en temps réel.',
      emoji: '📈'
    }
  ]

  // Data pour le pricing mobile
  const pricingCards = [
    {
      id: 'installation',
      title: 'Installation & Formation',
      emoji: '🚀',
      description: 'Déploiement complet sur site avec formation personnalisée',
      features: [
        { text: 'Installation matérielle complète', included: true },
        { text: 'Configuration IA personnalisée', included: true },
        { text: 'Formation équipe (2 jours)', included: true },
        { text: 'Dashboard manager intégré', included: true },
        { text: 'Support technique 30 jours', included: true }
      ],
      ctaText: 'Sur Devis',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    },
    {
      id: 'subscription',
      title: 'Abonnement Mensuel',
      emoji: '💎',
      description: 'Accès complet à JARVIS avec toutes les fonctionnalités IA',
      features: [
        { text: 'IA conversationnelle illimitée', included: true },
        { text: 'Dashboard analytics avancé', included: true },
        { text: 'Support prioritaire 24/7', included: true },
        { text: 'Mises à jour automatiques', included: true },
        { text: 'Stockage cloud illimité', included: true }
      ],
      isPopular: true,
      ctaText: 'Forfait Mensuel',
      gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    }
  ]
  
  // Refs pour le scroll
  const heroRef = useRef<HTMLDivElement>(null)
  const problemRef = useRef<HTMLDivElement>(null)
  const solutionRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Fonction de scroll smooth
  const scrollToSection = (sectionId: string) => {
    const refs = {
      hero: heroRef,
      problem: problemRef,
      solution: solutionRef,
      pricing: pricingRef,
      contact: contactRef
    }

    const targetRef = refs[sectionId as keyof typeof refs]
    if (targetRef?.current) {
      const yOffset = -80 // Offset pour la navigation mobile
      const element = targetRef.current
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset

      window.scrollTo({
        top: y,
        behavior: 'smooth'
      })
    }
    setActiveSection(sectionId)
  }

  // Items de navigation mobile
  const navItems = [
    {
      id: 'hero',
      icon: <VscHome size={20} />,
      label: 'Accueil',
      onClick: () => scrollToSection('hero')
    },
    {
      id: 'problem',
      icon: <VscArchive size={20} />,
      label: 'Problème',
      onClick: () => scrollToSection('problem')
    },
    {
      id: 'solution',
      icon: <VscAccount size={20} />,
      label: 'Solution',
      onClick: () => scrollToSection('solution')
    },
    {
      id: 'pricing',
      icon: <VscCreditCard size={20} />,
      label: 'Tarifs',
      onClick: () => scrollToSection('pricing')
    },
    {
      id: 'contact',
      icon: <VscMail size={20} />,
      label: 'Contact',
      onClick: () => scrollToSection('contact')
    }
  ]

  return (
    <Box 
      minH="100vh"
      pb="80px" // Espace pour la navigation mobile
      position="relative"
    >
      {/* BACKGROUND ANIMÉ MOBILE - DARKVEIL */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={-1}
        pointerEvents="none"
        overflow="hidden"
      >
        {/* BACKGROUND INFAILLIBLE - INLINE */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          background="linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #312e81 60%, #0f172a 100%)"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.4) 0%, transparent 60%),
              radial-gradient(circle at 70% 60%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(79, 70, 229, 0.25) 0%, transparent 55%)
            `,
            animation: 'backgroundPulse 8s ease-in-out infinite'
          }}
        />
        
        {/* STYLE INLINE POUR ANIMATION */}
        <style jsx>{`
          @keyframes backgroundPulse {
            0%, 100% {
              background: 
                radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.4) 0%, transparent 60%),
                radial-gradient(circle at 70% 60%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 50% 80%, rgba(79, 70, 229, 0.25) 0%, transparent 55%);
            }
            33% {
              background: 
                radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.35) 0%, transparent 55%),
                radial-gradient(circle at 20% 70%, rgba(147, 51, 234, 0.4) 0%, transparent 60%),
                radial-gradient(circle at 80% 20%, rgba(79, 70, 229, 0.3) 0%, transparent 50%);
            }
            66% {
              background: 
                radial-gradient(circle at 50% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 40%, rgba(147, 51, 234, 0.35) 0%, transparent 55%),
                radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.4) 0%, transparent 60%);
            }
          }
        `}</style>
      </Box>
      {/* HERO SECTION */}
      <Box ref={heroRef} id="hero" position="relative" zIndex={1}>
        <MobileHero />
      </Box>

      {/* SECTION PROBLÈME & SOLUTION */}
      <Box ref={problemRef} id="problem" py={16} px={4} position="relative" zIndex={1}>
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading fontSize="2xl" color="white" fontWeight="black">
              🏋️‍♂️ Le Fitness a un Problème
            </Heading>
            <Text fontSize="md" color="rgba(255,255,255,0.8)" textAlign="center" maxW="300px">
              Découvrez les défis et nos solutions innovantes
            </Text>
          </VStack>
          
          <MobileCarousel 
            items={problemSolutionItems}
            autoPlay={true}
            autoPlayDelay={5000}
          />
        </VStack>
      </Box>

      {/* SECTION COMMENT ÇA MARCHE */}
      <Box ref={solutionRef} id="solution" py={16} px={4} position="relative" zIndex={1}>
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading fontSize="2xl" color="white" fontWeight="black">
              ⚙️ Comment ça marche ?
            </Heading>
            <Text fontSize="md" color="rgba(255,255,255,0.8)" textAlign="center" maxW="300px">
              3 étapes simples pour révolutionner votre salle
            </Text>
          </VStack>
          
          <MobileStepper steps={howItWorksSteps} />
        </VStack>
      </Box>

      {/* SECTION PRICING */}
      <Box ref={pricingRef} id="pricing" py={16} px={4} position="relative" zIndex={1}>
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading fontSize="2xl" color="white" fontWeight="black">
              💎 Modèle Tarification
            </Heading>
            <Text fontSize="md" color="rgba(255,255,255,0.8)" textAlign="center" maxW="300px">
              Installation + abonnement mensuel. Pas de frais cachés.
            </Text>
          </VStack>
          
          <MobilePricing cards={pricingCards} />
        </VStack>
      </Box>

      {/* SECTION CONTACT */}
      <Box ref={contactRef} id="contact" py={16} px={4} position="relative" zIndex={1}>
        <VStack spacing={8} textAlign="center">
          <Box
            bg="rgba(34, 197, 94, 0.1)"
            backdropFilter="blur(10px)"
            borderRadius="2xl"
            p={8}
            border="1px solid rgba(34, 197, 94, 0.3)"
          >
            <VStack spacing={6}>
              <Box fontSize="4xl">📞</Box>
              <Box fontSize="xl" fontWeight="bold" color="white">
                Prêt à révolutionner votre salle ?
              </Box>
              <Box fontSize="md" color="rgba(255,255,255,0.8)" textAlign="center">
                Contactez-nous pour une démonstration personnalisée de JARVIS.
              </Box>
              <Box
                as="button"
                bg="linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)"
                color="white"
                px={8}
                py={4}
                borderRadius="xl"
                fontSize="lg"
                fontWeight="bold"
                boxShadow="0 8px 32px rgba(59, 130, 246, 0.3)"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4)'
                }}
                _active={{
                  transform: 'translateY(0px)'
                }}
                transition="all 0.2s"
              >
                🎤 Parler à JARVIS
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* NAVIGATION MOBILE */}
      <Box position="relative" zIndex={10}>
        <MobileNavigation items={navItems} activeItem={activeSection} />
      </Box>
    </Box>
  )
}

export default MobileLandingPage
