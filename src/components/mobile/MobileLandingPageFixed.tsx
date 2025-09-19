"use client"

import { Box, VStack, Heading, Text } from '@chakra-ui/react'
import { VscHome, VscArchive, VscAccount, VscMail, VscCreditCard } from 'react-icons/vsc'
import { useState, useRef } from 'react'
import MobileHero from './MobileHero'
import MobileNavigation from './MobileNavigation'
import MobileCarousel from './MobileCarousel'
import MobileStepper from './MobileStepper'
import MobilePricing from './MobilePricing'

const MobileLandingPageFixed = () => {
  const [activeSection, setActiveSection] = useState('hero')

  // Data pour le carousel Problème/Solution
  const problemSolutionItems = [
    {
      id: 'problem1',
      emoji: '📉',
      title: 'Abandon Élevé',
      description: 'Les membres abandonnent rapidement faute d\'accompagnement personnalisé'
    },
    {
      id: 'problem2', 
      emoji: '⏰',
      title: 'Temps d\'Attente',
      description: 'Les coachs sont débordés et ne peuvent pas aider tout le monde'
    },
    {
      id: 'problem3',
      emoji: '💸',
      title: 'Coûts Élevés',
      description: 'Embaucher plus de coachs coûte cher et n\'est pas rentable'
    },
    {
      id: 'solution1',
      emoji: '🤖',
      title: 'Coach IA 24/7',
      description: 'JARVIS accompagne chaque membre personnellement, à tout moment'
    },
    {
      id: 'solution2',
      emoji: '⚡',
      title: 'Réponse Instantanée',
      description: 'Conseils immédiats sur les exercices, nutrition et motivation'
    },
    {
      id: 'solution3',
      emoji: '💰',
      title: 'ROI Optimisé',
      description: 'Réduisez les coûts tout en améliorant l\'expérience membre'
    }
  ]

  // Data pour le stepper Comment ça marche
  const howItWorksSteps = [
    {
      id: 'step1',
      number: 1,
      emoji: '📱',
      title: 'Installation Simple',
      description: 'Nous installons JARVIS dans votre salle en quelques heures'
    },
    {
      id: 'step2',
      number: 2,
      emoji: '🎯',
      title: 'Configuration',
      description: 'Personnalisation selon vos équipements et programmes'
    },
    {
      id: 'step3',
      number: 3,
      emoji: '🚀',
      title: 'Lancement',
      description: 'Vos membres profitent immédiatement du coaching IA'
    }
  ]

  // Data pour le pricing
  const pricingCards = [
    {
      id: 'installation',
      title: 'Installation & Formation',
      emoji: '🔧',
      description: 'Mise en place complète de JARVIS dans votre salle',
      features: [
        { text: 'Installation complète', included: true },
        { text: 'Formation de votre équipe', included: true },
        { text: 'Configuration personnalisée', included: true },
        { text: 'Support technique', included: true }
      ],
      ctaText: 'Demander un devis',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      id: 'subscription',
      title: 'Abonnement Mensuel',
      emoji: '💎',
      description: 'Accès complet à JARVIS pour vos membres',
      features: [
        { text: 'Accès illimité à JARVIS', included: true },
        { text: 'Mises à jour automatiques', included: true },
        { text: 'Support client prioritaire', included: true },
        { text: 'Analytics détaillés', included: true }
      ],
      isPopular: true,
      ctaText: 'Commencer maintenant',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    }
  ]

  // Refs pour la navigation
  const heroRef = useRef<HTMLDivElement>(null)
  const problemRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Navigation items
  const navigationItems = [
    { id: 'hero', label: 'Accueil', icon: VscHome, ref: heroRef },
    { id: 'problem', label: 'Problème', icon: VscArchive, ref: problemRef },
    { id: 'solution', label: 'Solution', icon: VscAccount, ref: howItWorksRef },
    { id: 'tarifs', label: 'Tarifs', icon: VscCreditCard, ref: pricingRef },
    { id: 'contact', label: 'Contact', icon: VscMail, ref: contactRef }
  ]

  const scrollToSection = (sectionId: string) => {
    const item = navigationItems.find(nav => nav.id === sectionId)
    if (item?.ref.current) {
      item.ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)
    }
  }

  return (
    <Box 
      minH="100vh"
      pb="80px" // Espace pour la navigation mobile
      position="relative"
    >
      {/* BACKGROUND INFAILLIBLE - INLINE */}
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
        {/* BACKGROUND GARANTI - JAMAIS BLANC */}
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
            showDots={true}
          />
        </VStack>
      </Box>

      {/* SECTION COMMENT ÇA MARCHE */}
      <Box ref={howItWorksRef} id="how-it-works" py={16} px={4} position="relative" zIndex={1}>
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading fontSize="2xl" color="white" fontWeight="black">
              ⚡ Comment ça marche ?
            </Heading>
            <Text fontSize="md" color="rgba(255,255,255,0.8)" textAlign="center" maxW="300px">
              3 étapes simples pour révolutionner votre salle
            </Text>
          </VStack>
          
          <MobileStepper 
            steps={howItWorksSteps}
            currentStep={1}
          />
        </VStack>
      </Box>

      {/* SECTION TARIFICATION */}
      <Box ref={pricingRef} id="pricing" py={16} px={4} position="relative" zIndex={1}>
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading fontSize="2xl" color="white" fontWeight="black">
              💎 Modèle Tarification
            </Heading>
            <Text fontSize="md" color="rgba(255,255,255,0.8)" textAlign="center" maxW="300px">
              Une solution adaptée à votre budget
            </Text>
          </VStack>
          
          <MobilePricing 
            cards={pricingCards}
          />
        </VStack>
      </Box>

      {/* SECTION CONTACT */}
      <Box ref={contactRef} id="contact" py={16} px={4} position="relative" zIndex={1}>
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading fontSize="2xl" color="white" fontWeight="black">
              🚀 Prêt à révolutionner votre salle ?
            </Heading>
            <Text fontSize="md" color="rgba(255,255,255,0.8)" textAlign="center" maxW="300px">
              Contactez-nous pour une démonstration personnalisée
            </Text>
          </VStack>
          
          <VStack spacing={4}>
            <Box
              as="button"
              px={8}
              py={4}
              bg="linear-gradient(135deg, #3b82f6, #8b5cf6)"
              color="white"
              borderRadius="full"
              fontWeight="bold"
              fontSize="lg"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)'
              }}
              transition="all 0.3s ease"
            >
              Parler à JARVIS
            </Box>
            
            <Text fontSize="sm" color="rgba(255,255,255,0.6)" textAlign="center">
              Réponse sous 24h • Démonstration gratuite
            </Text>
          </VStack>
        </VStack>
      </Box>

      {/* NAVIGATION MOBILE */}
      <MobileNavigation 
        items={navigationItems}
        activeSection={activeSection}
        onSectionChange={scrollToSection}
      />
    </Box>
  )
}

export default MobileLandingPageFixed
