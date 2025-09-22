"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// 🎯 ACETERNITY UI COMPONENTS
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { FlipWords } from "@/components/ui/flip-words";
import { FloatingDock } from "@/components/ui/floating-dock";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { CometCard } from "@/components/ui/comet-card";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { GlareCard } from "@/components/ui/glare-card";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { MacbookScroll } from "@/components/ui/macbook-scroll";
// Timeline removed - replaced by custom solution

// 🎯 BUSINESS COMPONENTS
import Avatar3D from "@/components/kiosk/Avatar3D";
import VoiceVitrineInterface from "@/components/vitrine/VoiceVitrineInterface";

// 🎯 ICONS
import { 
  VscHome, 
  VscRobot, 
  VscGraph, 
  VscMail, 
  VscPlay,
  VscShield,
  VscHeart,
  VscGear,
  VscArrowUp,
  VscPieChart
} from 'react-icons/vsc';

export default function LandingClientAceternityPage() {
  // 🎯 VOICE INTERFACE STATE
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // 🎯 DATA DEFINITIONS FOR ACETERNITY COMPONENTS

  // Navigation items for FloatingDock
  const dockItems = [
    {
      title: "Accueil",
      icon: <VscHome className="h-full w-full text-black" />,
      href: "#hero",
    },
    {
      title: "Comment ça marche",
      icon: <VscGear className="h-full w-full text-black" />,
      href: "#comment-ca-marche",
    },
    {
      title: "Dashboard",
      icon: <VscGraph className="h-full w-full text-black" />,
      href: "#dashboard",
    },
    {
      title: "Parler à JARVIS",
      icon: <VscRobot className="h-full w-full text-gray-600" />,
      href: "#",
      onClick: () => setIsVoiceModalOpen(true),
    },
    {
      title: "Contact",
      icon: <VscMail className="h-full w-full text-black" />,
      href: "#contact",
    },
  ];

  // Words for FlipWords
  const heroWords = ["intelligente", "innovante", "révolutionnaire", "personnalisée", "sur-mesure"];


  // 🔧 FONCTION D'ENCODAGE UTF-8 SAFE
  const encodeToBase64 = (str: string) => {
    try {
      // Encode to UTF-8 first, then to Base64
      return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
      // Fallback: remove accented characters and encode
      const cleanStr = str
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ÉÈÊË]/g, 'E')
        .replace(/[ÀÂÄÁ]/g, 'A')
        .replace(/[ÎÏ]/g, 'I')
        .replace(/[ÔÖ]/g, 'O')
        .replace(/[ÙÛÜ]/g, 'U')
        .replace(/[Ç]/g, 'C');
      return btoa(cleanStr);
    }
  };

  // 🎨 FONCTION POUR GÉNÉRER LES IMAGES DES PROBLÈMES
  const generateProblemImage = (metrics: string, subtitle: string, bgColor: string) => {
    const svg = `
      <svg width="320" height="180" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="problemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor}40"/>
            <stop offset="100%" style="stop-color:${bgColor}20"/>
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#problemGrad)" rx="12"/>
        <rect x="1" y="1" width="318" height="178" fill="none" stroke="${bgColor}30" stroke-width="1" rx="12"/>
        <text x="160" y="70" text-anchor="middle" fill="${bgColor}" font-family="Inter, sans-serif" font-size="32" font-weight="bold">${metrics}</text>
        <text x="160" y="110" text-anchor="middle" fill="${bgColor}CC" font-family="Inter, sans-serif" font-size="12" font-weight="500">${subtitle}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${encodeToBase64(svg)}`;
  };

  // 🎨 FONCTION POUR GÉNÉRER LES IMAGES DES SOLUTIONS
  const generateSolutionImage = (metrics: string, benefit: string, bgColor: string) => {
    const svg = `
      <svg width="320" height="180" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="solutionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor}40"/>
            <stop offset="100%" style="stop-color:${bgColor}20"/>
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#solutionGrad)" rx="12"/>
        <rect x="1" y="1" width="318" height="178" fill="none" stroke="${bgColor}30" stroke-width="1" rx="12"/>
        <text x="160" y="70" text-anchor="middle" fill="${bgColor}" font-family="Inter, sans-serif" font-size="32" font-weight="bold">${metrics}</text>
        <text x="160" y="105" text-anchor="middle" fill="${bgColor}CC" font-family="Inter, sans-serif" font-size="10" font-weight="600" text-transform="uppercase" letter-spacing="1px">${benefit}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${encodeToBase64(svg)}`;
  };

  // 🎯 DONNÉES TRANSFORMATION - CHIFFRES RÉELS FRANCE
  const transformationSteps = [
    {
      title: "La Réalité du Marché Français",
      description: "30-50% des membres abandonnent chaque année. En France, le secteur perd collectivement 570M€ à 950M€ par an. Votre salle moyenne perd entre 107K€ et 179K€ annuellement.",
      metrics: { main: "40%", sub: "de churn annuel", impact: "€143K perdus/an" }
    },
    {
      title: "L'Impact Concret Sur Votre Salle",
      description: "Sur un CA moyen de 358K€, vous perdez jusqu'à 179K€ par an. Stress constant, équipes débordées, clients qui partent silencieusement. Vous gérez les urgences au lieu de développer.",
      metrics: { main: "€179K", sub: "manque à gagner", impact: "50% de votre CA" }
    },
    {
      title: "Votre Futur Avec JARVIS",
      description: "Réduction de 5 points de churn = +€17,925/an récupérés. Détection précoce, engagement personnalisé, feedback temps réel. ROI prouvé dès le 3ème mois.",
      metrics: { main: "+€18K", sub: "récupérés/an", impact: "ROI immédiat" }
    }
  ];

  // 🎯 DONNÉES CARDS PROBLÈMES/SOLUTIONS ÉPURÉES
  const problemsData = [
    {
      id: 0,
      problem: {
        title: "Taux d'abandon critique",
        subtitle: "40% des membres quittent leur salle dans les 6 premiers mois",
        description: "Les données du marché révèlent une opportunité majeure pour l'IA conversationnelle",
        metrics: "81%",
        impact: "Perte de revenus récurrents"
      },
      solution: {
        title: "Réduction du churn",
        subtitle: "Engagement 24/7 et rapport instantané",
        description: "JARVIS accompagne personnellement chaque adhérent avec un suivi intelligent et une motivation constante.",
        metrics: "+67%",
        benefit: "Amélioration JARVIS"
      }
    },
    {
      id: 1,
      problem: {
        title: "Coût d'acquisition",
        subtitle: "247€ par nouveau membre",
        description: "Marketing et onboarding traditionnel",
        metrics: "247€",
        impact: "Investissement marketing élevé"
      },
      solution: {
        title: "Économie JARVIS",
        subtitle: "Onboarding automatisé et engagement immédiat",
        description: "Interface premium avec IA conversationnelle qui transforme l'expérience utilisateur dès le premier contact.",
        metrics: "-52%",
        benefit: "Réduction des coûts"
      }
    },
    {
      id: 2,
      problem: {
        title: "Temps d'attente",
        subtitle: "18min moyenne d'attente",
        description: "Pour obtenir des informations",
        metrics: "18min",
        impact: "Frustration et abandon des demandes"
      },
      solution: {
        title: "Instantané JARVIS",
        subtitle: "Réponses immédiates 24h/24 et 7j/7",
        description: "Conversation naturelle par la voix avec compréhension contextuelle et réponses expertes instantanées.",
        metrics: "0sec",
        benefit: "Temps d'attente"
      }
    },
    {
      id: 3,
      problem: {
        title: "Suivi limité",
        subtitle: "1 coach pour 200 adhérents",
        description: "Impossible de personnaliser le suivi",
        metrics: "1/200",
        impact: "Potentiel inexploité des membres"
      },
      solution: {
        title: "Suivi 100%",
        subtitle: "IA complément du coach humain",
        description: "JARVIS devient l'assistant personnel de chaque adhérent, libérant le coach pour les interactions humaines stratégiques.",
        metrics: "100%",
        benefit: "Couverture complète"
      }
    }
  ];

  // Features for BentoGrid
  const features = [
    {
      title: "Conversations Intelligentes",
      description: "JARVIS comprend et répond en temps réel aux adhérents avec une IA conversationnelle avancée.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscRobot className="h-12 w-12 text-gray-300" /></div>,
      className: "md:col-span-2",
      icon: <VscRobot className="h-4 w-4 text-neutral-300" />,
    },
    {
      title: "Analytics Avancées",
      description: "Dashboard complet pour analyser les interactions et améliorer l'expérience adhérent.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscPieChart className="h-12 w-12 text-gray-400" /></div>,
      className: "md:col-span-1",
      icon: <VscPieChart className="h-4 w-4 text-neutral-300" />,
    },
    {
      title: "Sécurité Renforcée",
      description: "Protection des données adhérents avec chiffrement bout en bout et conformité RGPD.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscShield className="h-12 w-12 text-gray-500" /></div>,
      className: "md:col-span-1",
      icon: <VscShield className="h-4 w-4 text-neutral-300" />,
    },
    {
      title: "ROI Prouvé",
      description: "Augmentation mesurable de la satisfaction client et réduction du churn.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscHeart className="h-12 w-12 text-gray-200" /></div>,
      className: "md:col-span-2",
      icon: <VscHeart className="h-4 w-4 text-neutral-300" />,
    },
  ];

  // Process data for 3D Cards
  const parcoursData = [
    {
      title: "Installation",
      description: "Mise en place des équipements et configuration de JARVIS dans votre salle.",
      icon: <VscGear className="h-8 w-8 text-gray-300" />,
      step: "1"
    },
    {
      title: "Formation",
      description: "Formation complète de vos équipes pour une utilisation optimale.",
      icon: <VscPlay className="h-8 w-8 text-gray-400" />,
      step: "2"
    },
    {
      title: "Suivi",
      description: "Accompagnement continu et optimisation basée sur les analytics.",
      icon: <VscArrowUp className="h-8 w-8 text-gray-500" />,
      step: "3"
    }
  ];

  // Content for StickyScroll
  const stickyContent = [
    {
      title: "Détection Automatique",
      description: "L'adhérent s'approche du miroir digital et scanne son badge. JARVIS récupère automatiquement son profil complet pour une conversation ultra-personnalisée.",
      content: (
        <div className="h-full w-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white">
          <VscRobot className="h-20 w-20" />
        </div>
      ),
    },
    {
      title: "Conversation Intelligente",
      description: "L'IA comprend le contexte, l'historique et les besoins spécifiques de chaque adhérent pour fournir des réponses pertinentes et engageantes.",
      content: (
        <div className="h-full w-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white">
          <VscGraph className="h-20 w-20" />
        </div>
      ),
    },
    {
      title: "Analyse Post-Interaction",
      description: "Chaque conversation est analysée pour détecter les signaux de satisfaction, de churn, et générer des insights actionnables pour votre équipe.",
      content: (
        <div className="h-full w-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white">
          <VscPieChart className="h-20 w-20" />
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* 🎯 HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6">
        <div className="text-2xl font-bold text-white tracking-wider">
          JARVIS-GROUP
        </div>
        <motion.button
          onClick={() => window.location.href = '/login'}
          className="relative px-6 py-2.5 text-sm font-medium text-white/90 rounded-full 
                     bg-white/5 backdrop-blur-sm border border-white/10
                     hover:bg-white/10 hover:border-white/20 hover:text-white
                     transition-all duration-300 ease-out
                     shadow-lg shadow-white/5
                     group overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          >
          {/* Effet de lueur subtile animée */}
            <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
              ease: 'linear',
              repeatDelay: 2
            }}
          />
          
          {/* Particules flottantes subtiles */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {[...Array(3)].map((_, i) => (
                  <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                    style={{
                  left: `${20 + i * 30}%`,
                      top: '50%',
                    }}
                    animate={{
                  y: [-5, 5, -5],
                  opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{
                  duration: 2,
                      repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeInOut'
                    }}
                  />
                ))}
          </div>
          
          {/* Texte principal */}
          <span className="relative z-10 tracking-wide">
            Déjà client ?
          </span>
          
          {/* Effet de brillance au hover */}
                  <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </header>

      {/* 🎯 SHOOTING STARS + STARS BACKGROUND - MONOCHROME */}
      <ShootingStars 
        minSpeed={5}
        maxSpeed={15}
        minDelay={3000}
        maxDelay={8000}
        starColor="#FFFFFF"
        trailColor="#CCCCCC"
        starWidth={8}
        starHeight={1}
      />
      <StarsBackground 
        starDensity={0.0002}
        allStarsTwinkle={true}
        twinkleProbability={0.8}
        minTwinkleSpeed={0.5}
        maxTwinkleSpeed={1.5}
      />

      {/* 🎯 FLOATING NAVIGATION */}
      <FloatingDock
        items={dockItems}
        desktopClassName="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
        mobileClassName="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40"
      />

      {/* 🎯 HERO SECTION - ÉQUILIBRÉ ET CENTRÉ */}
      <section id="hero" className="relative min-h-screen overflow-hidden">
        <div className="w-full max-w-6xl mx-auto px-8 h-screen flex items-center relative z-10">
          
          {/* Hero content - Équilibré */}
          <div className="flex-1 pr-6 md:pr-12">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
                L'IA <FlipWords words={heroWords} className="text-white" duration={2000} /> <br />
                <span className="text-3xl md:text-4xl lg:text-5xl text-neutral-300">
                  pour salles de sport
                </span>
              </div>
              
              <motion.p 
                className="text-lg md:text-xl text-neutral-300 mb-8 max-w-lg leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Solution complète <span className="text-white font-bold text-xl md:text-2xl">sur devis</span> : 
                installation, formation et abonnement mensuel.
              </motion.p>
              
                <motion.div
                className="flex gap-4 flex-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.button 
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="bg-white text-black px-6 py-3 rounded-lg font-semibold text-base hover:bg-neutral-200 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <VscPlay className="h-5 w-5" />
                  Parler à JARVIS
                </motion.button>
                
                <motion.button 
                  className="border border-white text-white px-6 py-3 rounded-lg font-semibold text-base hover:bg-white hover:text-black transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Demander un devis
                </motion.button>
                </motion.div>
                
              {/* Stats / Badges plus compacts */}
        <motion.div
                className="flex gap-6 mt-12 pt-8 border-t border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white">24/7</div>
                  <div className="text-xs text-neutral-400">Disponibilité</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white">IA</div>
                  <div className="text-xs text-neutral-400">Avancée</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white">ROI</div>
                  <div className="text-xs text-neutral-400">Immédiat</div>
                </div>
                  </motion.div>
        </motion.div>
          </div>

          {/* Avatar 3D - Mieux centré */}
          <div className="flex-1 flex justify-center items-center pl-6 md:pl-12">
          <motion.div
              className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96"
              initial={{ opacity: 0, scale: 0.8, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <Avatar3D currentSection="hero" status="idle" />
              
              {/* Effet de lueur subtil */}
                    <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 blur-2xl"
                      animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.2, 0.4, 0.2] 
                      }}
                      transition={{
                  duration: 4, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
            </motion.div>
          </div>
        </div>
      </section>


      {/* 🚀 STRUCTURE SAAS - STYLE NOTION/SLACK/LINEAR */}

      {/* SECTION 1: QU'EST-CE QUE JARVIS ? */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ShootingStars />
        <StarsBackground />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-left"
            >
              <h2 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Un miroir
                <br />
                intelligent
                <br />
                dans votre
                <br />
                salle
              </h2>
              <p className="text-xl text-neutral-400 max-w-lg mb-8 leading-relaxed">
                Vos membres parlent à JARVIS comme à un humain. L'IA analyse tout, vous révèle l'invisible et transforme chaque interaction en opportunité business.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  "💬 Conversations naturelles speech-to-speech",
                  "🎯 Détection précoce du churn en temps réel", 
                  "📊 Analytics comportementaux automatisés",
                  "💰 Revenus publicitaires contextualisés"
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 text-neutral-300"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="text-lg">{feature.split(' ')[0]}</div>
                    <div>{feature.substring(feature.indexOf(' ') + 1)}</div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <motion.div
                  className="text-center"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl font-bold text-blue-400">-40%</div>
                  <div className="text-sm text-neutral-400">churn moyen</div>
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, type: "spring" }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl font-bold text-green-400">ROI</div>
                  <div className="text-sm text-neutral-400">prouvé</div>
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.9, type: "spring" }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl font-bold text-purple-400">24/7</div>
                  <div className="text-sm text-neutral-400">disponible</div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative w-80 h-96">
                {/* Miroir mockup */}
                <motion.div
                  className="w-full h-full bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-3xl border-4 border-neutral-600 shadow-2xl overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Cadre du miroir */}
                  <div className="absolute inset-4 bg-black rounded-2xl flex flex-col items-center justify-center">
                    {/* Avatar JARVIS dans le miroir */}
                    <motion.div
                      className="w-32 h-32 mb-4"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.3 }}
                      viewport={{ once: true }}
                    >
                      <Avatar3D currentSection="hero" status="idle" />
                    </motion.div>
                    
                    {/* Interface conversation */}
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <div className="text-white text-sm mb-2">👋 Salut Marc !</div>
                      <div className="text-neutral-400 text-xs mb-3">
                        "Comment te sens-tu aujourd'hui ?"
                      </div>
                      
                      {/* Indicateur audio */}
                      <motion.div 
                        className="flex items-center justify-center gap-1"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        viewport={{ once: true }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-blue-400 rounded-full"
                            animate={{ 
                              height: [4, 16, 8, 20, 4],
                              opacity: [0.4, 1, 0.6, 1, 0.4]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              delay: i * 0.1 
                            }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  {/* Base du miroir */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-neutral-700 rounded-t-lg" />
                </motion.div>

                {/* Effets de données autour */}
                {[
                  { text: "Churn Risk: 15%", angle: 0, color: "green" },
                  { text: "Satisfaction: 9/10", angle: 90, color: "blue" },
                  { text: "Engagement: +25%", angle: 180, color: "purple" },
                  { text: "Revenue: +25%", angle: 270, color: "orange" }
                ].map((data, i) => (
                  <motion.div
                    key={i}
                    className={`absolute text-xs font-semibold px-3 py-2 rounded-lg border backdrop-blur-sm ${
                      data.color === 'green' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                      data.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                      data.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                      'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    }`}
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${data.angle}deg) translateX(180px) rotate(-${data.angle}deg)`
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 + i * 0.2 }}
                    viewport={{ once: true }}
                  >
                    {data.text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: POUR CHAQUE ÉQUIPE */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ShootingStars />
        <StarsBackground />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              Pour chaque
              <br />
              membre de
              <br />
              votre équipe
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                role: "Gérant",
                color: "blue",
                icon: (
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                    <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3L8 7L12 11L16 7L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                features: [
                  "Dashboard temps réel",
                  "Analytics prédictifs", 
                  "Alertes intelligentes",
                  "Rapports automatisés"
                ],
                metric: "85%",
                subtitle: "précision prédictive"
              },
              {
                role: "Coaches", 
                color: "purple",
                icon: (
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-400">
                    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21V19C23 17.1362 21.7252 15.5701 20 15.126" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.12598C17.7252 3.56992 19 5.13616 19 7C19 8.86384 17.7252 10.4301 16 10.874" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                features: [
                  "Suivi personnalisé",
                  "Programmes adaptatifs",
                  "Feedback automatique", 
                  "Motivation ciblée"
                ],
                metric: "+60%",
                subtitle: "engagement membres"
              },
              {
                role: "Accueil",
                color: "green", 
                icon: (
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                features: [
                  "Check-in intelligent",
                  "Résolution assistée",
                  "Upsell guidé",
                  "Support intégré"
                ],
                metric: "+25%",
                subtitle: "revenus moyens"
              }
            ].map((team, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-8">
                  <motion.div 
                    className={`w-48 h-48 mx-auto rounded-full border-2 ${
                      team.color === 'blue' ? 'border-blue-400 bg-blue-500/10' :
                      team.color === 'purple' ? 'border-purple-400 bg-purple-500/10' : 
                      'border-green-400 bg-green-500/10'
                    } flex items-center justify-center`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    {team.icon}
                  </motion.div>
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-6">{team.role}</h3>
                
                <div className="space-y-3 mb-8">
                  {team.features.map((feature, i) => (
                    <div key={i} className="text-neutral-300 flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        team.color === 'blue' ? 'bg-blue-400' :
                        team.color === 'purple' ? 'bg-purple-400' : 
                        'bg-green-400'
                      }`} />
                      {feature}
                    </div>
                  ))}
                </div>

                <motion.div
                  className={`text-4xl font-bold mb-2 ${
                    team.color === 'blue' ? 'text-blue-400' :
                    team.color === 'purple' ? 'text-purple-400' :
                    'text-green-400'
                  }`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.5, type: "spring" }}
                  viewport={{ once: true }}
                >
                  {team.metric}
                </motion.div>
                <p className="text-neutral-400">{team.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: MODULES PUISSANTS */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ShootingStars />
        <StarsBackground />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-left"
            >
              <h2 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Modules
                <br />
                puissants
                <br />
                intégration
                <br />
                simple
              </h2>
              <p className="text-xl text-neutral-400 max-w-lg mb-8">
                Architecture modulaire qui s'adapte à vos besoins et grandit avec votre business.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Rétention", status: "✓ Actif", metric: "85%" },
                  { name: "Analytics", status: "✓ Actif", metric: "24/7" },
                  { name: "Engagement", status: "✓ Actif", metric: "+60%" },
                  { name: "Revenue", status: "✓ Actif", metric: "+25%" }
                ].map((module, i) => (
                  <motion.div 
                    key={i} 
                    className="border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="font-semibold text-white">{module.name}</div>
                    <div className="text-sm text-green-400 mb-2">{module.status}</div>
                    <div className="text-2xl font-bold text-blue-400">{module.metric}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative w-80 h-80">
                {/* Dashboard mockup central */}
                <motion.div
                  className="w-full h-full bg-gradient-to-br from-neutral-900/90 to-black/90 backdrop-blur-sm border border-white/10 rounded-3xl p-6 flex flex-col justify-between"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-4">JARVIS Dashboard</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {[
                        { label: "Membres", value: "1,247", color: "blue" },
                        { label: "Rétention", value: "85%", color: "green" },
                        { label: "Revenus", value: "+25%", color: "purple" },
                        { label: "Alertes", value: "12", color: "orange" }
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          className="text-center"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div className={`text-lg font-bold ${
                            stat.color === 'blue' ? 'text-blue-400' :
                            stat.color === 'green' ? 'text-green-400' :
                            stat.color === 'purple' ? 'text-purple-400' :
                            'text-orange-400'
                          }`}>
                            {stat.value}
                          </div>
                          <div className="text-xs text-neutral-400">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: "85%" }}
                        transition={{ duration: 2, delay: 0.5 }}
                        viewport={{ once: true }}
                      />
                    </div>
                    <div className="text-center text-xs text-neutral-400 mt-2">
                      Performance globale
                    </div>
                  </div>
                </motion.div>

                {/* Modules flottants autour */}
                {[
                  { name: "Rétention", angle: 0, color: "blue" },
                  { name: "Analytics", angle: 90, color: "purple" },
                  { name: "Engagement", angle: 180, color: "green" },
                  { name: "Revenue", angle: 270, color: "orange" }
                ].map((module, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-xs font-bold bg-black/50 backdrop-blur-sm"
                    style={{
                      borderColor: module.color === 'blue' ? '#3B82F6' :
                                   module.color === 'purple' ? '#8B5CF6' :
                                   module.color === 'green' ? '#10B981' : '#F59E0B',
                      color: module.color === 'blue' ? '#3B82F6' :
                             module.color === 'purple' ? '#8B5CF6' :
                             module.color === 'green' ? '#10B981' : '#F59E0B',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${module.angle}deg) translateX(140px) rotate(-${module.angle}deg)`
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.2 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {module.name.slice(0, 3)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ÉVOLUEZ SANS LIMITE */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ShootingStars />
        <StarsBackground />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="flex justify-center order-2 lg:order-1"
            >
              <div className="relative w-80 h-80">
                {/* Visualisation scaling - network de points */}
                <motion.div 
                  className="w-full h-full flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  viewport={{ once: true }}
                >
                  {/* Network de salles */}
                  <div className="relative w-72 h-72">
                    {/* Salle centrale */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      viewport={{ once: true }}
                    >
                      <span className="text-blue-400 font-bold text-sm">HQ</span>
                    </motion.div>

                    {/* Salles satellites */}
                    {[
                      { angle: 0, delay: 0.4, color: "purple", label: "1" },
                      { angle: 60, delay: 0.6, color: "green", label: "2" },
                      { angle: 120, delay: 0.8, color: "orange", label: "3" },
                      { angle: 180, delay: 1.0, color: "cyan", label: "4" },
                      { angle: 240, delay: 1.2, color: "pink", label: "5" },
                      { angle: 300, delay: 1.4, color: "yellow", label: "6" }
                    ].map((node, i) => (
                      <motion.div
                        key={i}
                        className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold bg-black/50 backdrop-blur-sm`}
                        style={{
                          borderColor: node.color === 'purple' ? '#8B5CF6' :
                                       node.color === 'green' ? '#10B981' :
                                       node.color === 'orange' ? '#F59E0B' :
                                       node.color === 'cyan' ? '#06B6D4' :
                                       node.color === 'pink' ? '#EC4899' : '#EAB308',
                          color: node.color === 'purple' ? '#8B5CF6' :
                                 node.color === 'green' ? '#10B981' :
                                 node.color === 'orange' ? '#F59E0B' :
                                 node.color === 'cyan' ? '#06B6D4' :
                                 node.color === 'pink' ? '#EC4899' : '#EAB308',
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${node.angle}deg) translateX(100px) rotate(-${node.angle}deg)`
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: node.delay }}
                        viewport={{ once: true }}
                      >
                        {node.label}
                      </motion.div>
                    ))}

                    {/* Lignes de connexion */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                      <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 origin-left h-0.5 bg-gradient-to-r from-blue-400/50 to-transparent"
                        style={{
                          width: '100px',
                          transform: `translate(0, -50%) rotate(${angle}deg)`
                        }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.2 }}
                        viewport={{ once: true }}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Indicateur scaling */}
                <motion.div
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-center"
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.6 }}
                  viewport={{ once: true }}
                >
                  <div className="text-2xl font-bold text-white">1 → ∞</div>
                  <div className="text-sm text-neutral-400">réseau</div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-left order-1 lg:order-2"
            >
              <h2 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Évoluez
                <br />
                sans
                <br />
                limite
              </h2>
              
              <div className="space-y-6 mb-8">
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Une salle</div>
                    <div className="text-neutral-400">Setup en 24h</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center">
                    <span className="text-purple-400 font-bold">5+</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Multi-sites</div>
                    <div className="text-neutral-400">Gestion centralisée</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-400 flex items-center justify-center">
                    <span className="text-green-400 font-bold">∞</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Franchise</div>
                    <div className="text-neutral-400">Analytics globales</div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="text-6xl font-bold text-green-400 mb-4"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
                viewport={{ once: true }}
              >
                ROI
              </motion.div>
              <p className="text-xl text-neutral-400">immédiat prouvé</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CTA FINAL */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ShootingStars />
        <StarsBackground />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Prêt à
              <br />
              révolutionner
              <br />
              votre salle ?
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
              <motion.button
                onClick={() => setIsVoiceModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center"
              >
                <VscPlay className="h-6 w-6 mr-3" />
                Parler à JARVIS
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-12 py-6 rounded-2xl font-bold text-xl hover:bg-white hover:text-black transition-all duration-300"
              >
                Demander un devis
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 🎯 VOTRE PARCOURS JARVIS SECTION - 3D CARDS */}
      <section id="parcours" className="relative py-32 w-full">
        <div className="w-full px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Votre Parcours JARVIS</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto">
              De l'installation à l'optimisation continue, nous vous accompagnons à chaque étape.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {parcoursData.map((item, index) => (
              <CardContainer key={index} className="inter-var">
                <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[25rem] h-auto rounded-xl p-6 border">
                  <CardItem
                    translateZ="50"
                    className="text-xl font-bold text-neutral-600 dark:text-white mb-4"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="60"
                    className="text-neutral-500 text-sm max-w-sm dark:text-neutral-300"
                  >
                    {item.description}
                  </CardItem>
                  <CardItem translateZ="100" className="w-full mt-6">
                    <div className="h-32 w-full rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">#{item.step}</span>
                    </div>
                  </CardItem>
                </CardBody>
              </CardContainer>
            ))}
          </div>
        </div>
      </section>

      {/* 🎯 FEATURES SECTION - BENTO GRID */}
      <section id="features" className="relative py-32 w-full">
        <div className="w-full px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Fonctionnalités Clés</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto">
              Une suite complète d'outils IA pour révolutionner l'expérience de vos adhérents.
            </p>
          </div>
          
          <BentoGrid className="max-w-4xl mx-auto">
            {features.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                icon={item.icon}
                className={item.className}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* 🎯 COMMENT ÇA MARCHE SECTION - STICKY SCROLL */}
      <section id="comment-ca-marche" className="relative py-40 w-full">
        <div className="relative z-10 w-full">
          <div className="text-center mb-20 px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Comment ça marche ?</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto">
              Un processus simple et automatisé pour une expérience adhérent exceptionnelle.
            </p>
          </div>
          
          <StickyScroll content={stickyContent} />
        </div>
      </section>

      {/* 🎯 DASHBOARD SECTION - MACBOOK SCROLL */}
      <section id="dashboard" className="relative py-40 w-full">
        <div className="relative z-10 w-full">
          <MacbookScroll
            title="Dashboard Intelligence IA"
            badge="Analytics Avancées"
            src="/images/dashboard-gerant.jpg"
            showGradient={false}
          />
        </div>
      </section>

      {/* 🎯 ROI SECTION */}
      <section id="roi" className="relative py-32 w-full">
        <div className="w-full px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Un Investissement qui se Rentabilise
            </h2>
            <p className="text-xl text-neutral-300 mb-8">
              JARVIS ne coûte pas, il rapporte. Réduction du churn, augmentation de la satisfaction, 
              et nouvelles opportunités de revenus grâce aux insights IA.
            </p>
            <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Calculer votre ROI
            </button>
          </div>
        </div>
      </section>

      {/* 🎯 CONTACT SECTION */}
      <section id="contact" className="relative py-32 w-full">
        <div className="w-full px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à Révolutionner Votre Salle ?
            </h2>
            <p className="text-xl text-neutral-300 mb-8">
              Contactez-nous pour une démonstration personnalisée et un devis sur mesure.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button 
                onClick={() => setIsVoiceModalOpen(true)}
                className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                <VscRobot className="h-5 w-5" />
                Parler à JARVIS
              </button>
              <button className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors">
                <VscMail className="h-5 w-5 inline-block mr-2" />
                Demander un devis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 VOICE INTERFACE MODAL */}
      {isVoiceModalOpen && (
        <VoiceVitrineInterface 
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
        />
      )}
    </main>
  );
}
