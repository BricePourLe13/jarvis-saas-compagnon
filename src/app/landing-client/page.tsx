"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";

// 🎯 ACETERNITY UI COMPONENTS (Optimisés)
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { FlipWords } from "@/components/ui/flip-words";
import { FloatingDock } from "@/components/ui/floating-dock";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

// 🎯 LAZY LOADED COMPONENTS (Chargés à la demande)
const VoiceVitrineInterface = dynamic(
  () => import("@/components/vitrine/VoiceVitrineInterface"),
  { ssr: false }
);

const Avatar3D = dynamic(
  () => import("@/components/kiosk/Avatar3DOptimized"),
  { ssr: false }
);

const ContactForm = dynamic(
  () => import("@/components/vitrine/ContactForm"),
  { ssr: false }
);

// 🎯 HOOKS
import { useVoiceVitrineChat } from "@/hooks/useVoiceVitrineChat";

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
  VscWarning,
  VscChromeMinimize,
  VscCheckAll,
  VscTarget,
  VscRocket,
  VscCheck
} from 'react-icons/vsc';

// 🎯 CUSTOM HOOK FOR PERFORMANCE
const useInView = (threshold = 0.1) => {
  const [inView, setInView] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
};

export default function LandingClientOptimizedPage() {
  // 🎯 STATE
  
  // 🎤 VOICE INTEGRATION STATE
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceTimeRemaining, setVoiceTimeRemaining] = useState(120);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  // 🎯 DEVICE DETECTION
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // 🎤 VOICE CHAT HOOK
  const {
    connect: connectVoice,
    disconnect: disconnectVoice,
    isConnected: isVoiceConnected,
    error: voiceError,
    currentTranscript,
    isAISpeaking
  } = useVoiceVitrineChat({
    onStatusChange: setVoiceStatus,
    onTranscriptUpdate: setVoiceTranscript,
    maxDuration: 120
  });

  // 🎤 VOICE FUNCTIONS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartVoice = async () => {
    try {
      setIsVoiceActive(true);
      setVoiceStatus('connecting');
      
      const result = await connectVoice();
      
      setVoiceStatus('connected');
      
      // Timer de démo
      const timer = setInterval(() => {
        setVoiceTimeRemaining(prev => {
          if (prev <= 1) {
            handleEndVoice();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Stocker le timer pour le nettoyer
      (window as any).voiceTimer = timer;
    } catch (error: any) {
      console.error('Erreur connexion vocale:', error);
      setVoiceStatus('error');
      setIsVoiceActive(false);
      
      // ✅ FIX : Afficher l'erreur de limitation visuellement
      // L'erreur sera affichée via voiceError qui est déjà dans le hook
    }
  };

  const handleEndVoice = async () => {
    try {
      await disconnectVoice();
      
      // Nettoyage
      if ((window as any).voiceTimer) {
        clearInterval((window as any).voiceTimer);
        (window as any).voiceTimer = null;
      }
      
      setIsVoiceActive(false);
      setVoiceStatus('idle');
      setVoiceTranscript('');
      setVoiceTimeRemaining(120);
    } catch (error) {
      console.error('Erreur déconnexion vocale:', error);
    }
  };

  // 🎯 DATA DEFINITIONS

  // Navigation items pour FloatingDock (Desktop - JSX)
  const dockItemsDesktop = [
    {
      title: "Accueil",
      icon: <VscHome className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
      href: "#hero",
    },
    {
      title: "Problème",
      icon: <VscWarning className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
      href: "#problems",
    },
    {
      title: "Solution",
      icon: <VscRobot className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
      href: "#solution",
    },
    {
      title: "Process",
      icon: <VscGear className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
      href: "#process",
    },
    {
      title: "Résultats",
      icon: <VscGraph className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
      href: "#results",
    },
    {
      title: "Contact",
      icon: <VscMail className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
      href: "#contact",
    }
  ];

  // Navigation items pour Mobile (Composants)
  const dockItemsMobile = [
    { title: "Accueil", icon: VscHome, href: "#hero" },
    { title: "Problème", icon: VscWarning, href: "#problems" },
    { title: "Solution", icon: VscRobot, href: "#solution" },
    { title: "Contact", icon: VscMail, href: "#contact" }
  ];

  // Hero words pour FlipWords
  const heroWords = ["révolutionnaire", "conversationnelle", "prédictive", "personnalisée"];

  // Pain points des gérants
  const painPoints = [
    {
      icon: <VscWarning className="w-8 h-8 text-red-400" />,
      title: "Churn invisible",
      description: "30% de vos membres partent sans prévenir. Vous découvrez les problèmes trop tard.",
      stat: "30% de churn moyen",
      color: "red"
    },
    {
      icon: <VscChromeMinimize className="w-8 h-8 text-orange-400" />,
      title: "Staff débordé",
      description: "Vos coachs passent 60% de leur temps sur des questions répétitives basiques.",
      stat: "60% du temps perdu",
      color: "orange"
    },
    {
      icon: <VscGraph className="w-8 h-8 text-yellow-400" />,
      title: "Données inexploitées", 
      description: "Vous avez des centaines d'interactions par jour, mais aucun insight actionnable.",
      stat: "0% d'analytics comportementaux",
      color: "yellow"
    }
  ];

  // Solution benefits
  const solutionBenefits = [
    {
      icon: <VscGraph className="w-8 h-8 text-green-400" />,
      title: "Détection churn 60 jours avant",
      description: "JARVIS analyse chaque conversation et vous alerte sur les membres à risque",
      metric: "85% de précision"
    },
    {
      icon: <VscHeart className="w-8 h-8 text-blue-400" />, 
      title: "+40% satisfaction membre",
      description: "Réponses instantanées 24/7, personnalisées selon le profil de chaque adhérent",
      metric: "24/7 disponible"
    },
    {
      icon: <VscRobot className="w-8 h-8 text-purple-400" />,
      title: "70% des questions automatisées",
      description: "Vos coachs se concentrent sur l'accompagnement à haute valeur ajoutée",
      metric: "70% d'automatisation"
    },
    {
      icon: <VscGraph className="w-8 h-8 text-green-400" />,
      title: "ROI moyen +25% dès 6 mois",
      description: "Rétention améliorée + revenus publicitaires partagés",
      metric: "ROI garanti"
    }
  ];

  // Process steps
  const processSteps = [
    {
      number: "01",
      title: "Installation & Formation",
      description: "Nous installons les miroirs digitaux et formons votre équipe en 2 jours",
      duration: "2 jours",
      icon: <VscGear className="w-8 h-8" />
    },
    {
      number: "02", 
      title: "Déploiement personnalisé",
      description: "JARVIS apprend votre salle, vos services et commence à converser avec vos membres",
      duration: "1 semaine",
      icon: <VscRobot className="w-8 h-8" />
    },
    {
      number: "03",
      title: "Insights & Optimisation",
      description: "Vous recevez des analytics et recommandations IA pour optimiser votre business",
      duration: "En continu",
      icon: <VscGraph className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      
      {/* 🎯 HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold text-white"
          >
            JARVIS-GROUP
          </motion.div>

          {/* CTA Header */}
          <motion.a
            href="/login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative px-6 py-2 border border-neutral-600 rounded-full text-neutral-300 font-semibold hover:border-neutral-400 hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">Déjà client ?</span>
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
          </motion.a>
        </div>
      </header>

      {/* 🎯 BACKGROUND EFFECTS - Désactivé sur mobile pour performance */}
      {!isMobile && (
        <>
          <ShootingStars 
            minSpeed={8}
            maxSpeed={20}
            minDelay={4000}
            maxDelay={10000}
            starColor="#FFFFFF"
            trailColor="#CCCCCC"
            starWidth={6}
            starHeight={1}
          />
          <StarsBackground 
            starDensity={0.0001}
            allStarsTwinkle={true}
            twinkleProbability={0.6}
            minTwinkleSpeed={0.8}
            maxTwinkleSpeed={2}
          />
        </>
      )}

      {/* 🎯 FLOATING NAVIGATION */}
      {/* Desktop: FloatingDock normal */}
      <div className="hidden lg:block">
            <FloatingDock
              items={dockItemsDesktop}
          desktopClassName="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
        />
      </div>
      
      {/* Mobile: Dock horizontal compact */}
      <div className="lg:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center space-x-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
          {dockItemsMobile.map((item) => (
            <motion.button
              key={item.title}
              onClick={() => {
                const element = document.getElementById(item.href.slice(1));
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon className="w-4 h-4 text-white" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* 🎯 SECTION 1: HERO IMPACT */}
      <section id="hero" className="relative min-h-screen lg:min-h-screen flex items-center pt-20 pb-20 lg:pb-0">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 lg:gap-12 items-center">
          
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Headline */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium"
              >
                🚀 Révolution IA pour salles de sport
              </motion.div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                Une IA{" "}
                <FlipWords words={heroWords} className="text-white" duration={3000} />
                <br />
                <span className="text-white">qui garde vos membres</span>{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  40% plus longtemps
                </span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-neutral-300 leading-relaxed max-w-2xl">
                JARVIS détecte les membres qui vont partir <span className="text-white font-semibold">avant qu'ils ne partent</span>. Plus de churn surprise.
              </p>
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center gap-4 text-neutral-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🚀</span>
                </div>
                <span className="text-sm">MVP prêt à tester</span>
              </div>
              <div className="w-px h-6 bg-neutral-600" />
              <span className="text-sm font-medium text-white">Recherche partenaires pilotes</span>
            </motion.div>

            {/* CTA supprimé - Interface vocale maintenant intégrée à la sphère */}

            {/* Proof Points Subtils */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex justify-center sm:justify-start items-center gap-8 pt-6 border-t border-neutral-800/50"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">-40%</div>
                <div className="text-xs text-neutral-500">churn</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">1 mois</div>
                <div className="text-xs text-neutral-500">ROI</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">24/7</div>
                <div className="text-xs text-neutral-500">actif</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          {/* CONTAINER PROPRE SANS TRANSFORMS PARASITES */}
          <div className="relative flex justify-center order-last lg:order-last pt-8 lg:pt-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="flex flex-col items-center space-y-6"
            >
              
              {/* 🎯 INTERFACE VOCALE REFONTE COMPLÈTE */}
              <div className="relative">
                {/* Container principal centré */}
                <div className="flex flex-col items-center justify-center space-y-8">
                  
                  {/* Texte d'instruction (au dessus) */}
                  {!isVoiceActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center"
                    >
                      <motion.p 
                        className="text-white/90 text-lg font-medium px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
                        animate={{ 
                          opacity: [0.8, 1, 0.8],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        👇 Cliquez pour parler à JARVIS
                      </motion.p>
                    </motion.div>
                  )}

                  {/* Timer (quand actif) */}
                  {isVoiceActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="text-red-400 font-bold text-2xl">
                        {formatTime(voiceTimeRemaining)}
                      </div>
                      <div className="text-sm text-neutral-400 mt-1">
                        Démo gratuite • Session temporaire
                      </div>
                    </motion.div>
                  )}

                  {/* ✅ NOUVEAU : Message d'erreur de limitation */}
                  {voiceError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md mx-auto"
                    >
                      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="text-center">
                          <div className="text-red-400 text-lg font-bold mb-2">
                            ⚠️ {voiceError}
                          </div>
                          <div className="text-red-300/80 text-sm">
                            Pour un accès illimité, contactez-nous :<br />
                            <a href="mailto:contact@jarvis-group.net" className="text-cyan-400 hover:text-cyan-300 underline">
                              contact@jarvis-group.net
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* SPHÈRE JARVIS - Container parfaitement centré */}
                  <motion.div 
                    className="relative cursor-pointer"
                    onClick={!isVoiceActive ? handleStartVoice : undefined}
                    whileHover={!isVoiceActive ? { scale: 1.02 } : {}}
                    whileTap={!isVoiceActive ? { scale: 0.98 } : {}}
                  >
                    {/* Container de la sphère avec dimensions responsives */}
                    <div className="w-72 h-72 md:w-[480px] md:h-[480px] flex items-center justify-center relative">
                      <div className="scale-75 md:scale-100">
                        <Avatar3D 
                          size={480} // Taille originale, scale CSS pour mobile
                        currentSection="hero" 
                        status={voiceStatus === 'speaking' ? 'speaking' : 
                               voiceStatus === 'listening' ? 'listening' : 
                               voiceStatus === 'connecting' ? 'connecting' : 'idle'} 
                      />
                      </div>
                      
                      {/* ✅ Effet de lueur PASTEL (style JARVIS Kiosk) - PLUS VISIBLE */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200/40 via-cyan-200/40 to-blue-200/40 blur-3xl"
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.4, 0.8, 0.4] 
                        }}
                        transition={{
                          duration: 3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Status et contrôles (en dessous, parfaitement centrés) */}
                  {isVoiceActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center space-y-4"
                    >
                      {/* Status text */}
                      <div className="text-center">
                        <p className="text-white text-lg font-medium bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                          {voiceStatus === 'connecting' ? '⚡ Connexion...' :
                           voiceStatus === 'listening' ? '🎤 JARVIS vous écoute' :
                           voiceStatus === 'speaking' ? '🗣️ JARVIS répond' :
                           '✨ Session active'}
                        </p>
                      </div>
                      
                      {/* Bouton terminer */}
                      <button
                        onClick={handleEndVoice}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        Terminer
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Transcript - En dessous si nécessaire */}
              {isVoiceActive && voiceTranscript && (
                <div className="max-w-md w-full">
                  <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <p className="text-white text-sm text-center">{voiceTranscript}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🎯 SECTION 2: PROBLÈMES (Pain Points) */}
      <section id="problems" className="relative py-16 md:py-24 lg:py-32 bg-gradient-to-b from-black via-neutral-950/30 to-black">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Votre salle perd{" "}
              <span className="text-red-400">30% de ses membres</span>
              {" "}chaque année
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Découvrez les 3 problèmes silencieux qui tuent votre business... et comment les résoudre.
            </p>
          </motion.div>

          {/* Pain Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <CardContainer className="inter-var">
                  <CardBody className={`relative group/card hover:shadow-2xl hover:shadow-${point.color}-500/[0.1] bg-black border-white/[0.1] w-full h-auto rounded-xl p-8 border transition-all duration-500`}>
                    {/* Icon */}
                    <CardItem translateZ="50" className="mb-6">
                      {point.icon}
                    </CardItem>

                    {/* Title */}
                    <CardItem translateZ="100" className="text-2xl font-bold text-white mb-4">
                      {point.title}
                    </CardItem>

                    {/* Description */}
                    <CardItem translateZ="60" className="text-neutral-300 mb-6 leading-relaxed">
                      {point.description}
                    </CardItem>

                    {/* Stat */}
                    <CardItem translateZ="80" className={`text-lg font-bold text-${point.color}-400`}>
                      {point.stat}
                    </CardItem>
                  </CardBody>
                </CardContainer>
              </motion.div>
            ))}
          </div>

          {/* Transition CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12 md:mt-16 lg:mt-20"
          >
            <h3 className="text-3xl font-bold text-white mb-6">
              Et si vous pouviez les voir venir ?
            </h3>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl"
            >
              👇
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 🎯 SECTION 3: SOLUTION - DÉMONSTRATION INTERACTIVE */}
      <section id="solution" className="relative py-16 md:py-24 lg:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              JARVIS : Votre{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                directeur commercial
              </span>
              {" "}virtuel
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Découvrez notre MVP en action : conversation réelle → insights automatiques
            </p>
          </motion.div>

          {/* Demo Interactive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Conversation Simulation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold">👤</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Marc, 34 ans</div>
                    <div className="text-neutral-400 text-sm">Membre depuis 8 mois</div>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="bg-neutral-800 rounded-lg p-3 ml-8"
                  >
                    <p className="text-white text-sm">"Salut JARVIS, j'ai mal au dos depuis 2 séances... je sais plus quoi faire"</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mr-8"
                  >
                    <p className="text-white text-sm">"Je comprends Marc. Basé sur votre profil, je recommande de voir Sarah notre coach spécialisée. Voulez-vous que je vous réserve un créneau ?"</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-neutral-800 rounded-lg p-3 ml-8"
                  >
                    <p className="text-white text-sm">"Oui merci, et franchement la salle est devenue bruyante le soir..."</p>
                  </motion.div>
                </div>
              </div>
              
              {/* Voice Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                viewport={{ once: true }}
                className="flex items-center justify-center gap-2 text-neutral-400"
              >
                <span className="text-sm">🎤 Conversation naturelle speech-to-speech</span>
                <motion.div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-blue-400 rounded-full"
                      animate={{ 
                        height: [4, 12, 6, 16],
                        opacity: [0.4, 1, 0.6, 1]
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
            </motion.div>

            {/* Right: Dashboard Live */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">📊 Insights Temps Réel</h3>
                
                {/* Alerts */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                      <div>
                        <div className="text-red-400 font-semibold text-sm">🚨 Risque Churn Détecté</div>
                        <div className="text-neutral-300 text-xs">Marc - Douleur + Insatisfaction bruit</div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <div>
                        <div className="text-blue-400 font-semibold text-sm">📅 Action Suggérée</div>
                        <div className="text-neutral-300 text-xs">RDV coach + enquête acoustique</div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    viewport={{ once: true }}
                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <div>
                        <div className="text-green-400 font-semibold text-sm">✅ Réservation Auto</div>
                        <div className="text-neutral-300 text-xs">Marc → Sarah demain 19h</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">85%</div>
                    <div className="text-xs text-neutral-400">Précision prédictive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">60j</div>
                    <div className="text-xs text-neutral-400">Anticipation moyenne</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-12 md:mt-16 lg:mt-20"
          >
            {solutionBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="mb-4 flex justify-center">
                  {benefit.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-3">{benefit.title}</h4>
                <p className="text-sm text-neutral-400 mb-4">{benefit.description}</p>
                <div className="text-lg font-bold text-white">{benefit.metric}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 🎯 SECTION 4: PROCESS - 3 ÉTAPES */}
      <section id="process" className="relative py-16 md:py-24 lg:py-32 bg-gradient-to-b from-black via-neutral-950/30 to-black">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              De l'installation au{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                ROI en 3 étapes
              </span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Un processus simple et éprouvé pour transformer votre salle en 2 semaines
            </p>
          </motion.div>

          {/* Process Timeline */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-y-1/2 hidden lg:block"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
              {processSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative text-center"
                >
                  {/* Step Number */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 + 0.3, type: "spring" }}
                    viewport={{ once: true }}
                    className="relative mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 z-10"
                  >
                    <span className="text-white font-bold text-xl">{step.number}</span>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
                    viewport={{ once: true }}
                    className="space-y-4"
                  >
                    <div className="flex justify-center items-center text-6xl mb-4">{step.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-neutral-400 mb-4 leading-relaxed">{step.description}</p>
                    <div className="inline-block px-4 py-2 bg-white/10 rounded-full">
                      <span className="text-sm font-semibold text-white">{step.duration}</span>
                    </div>
                  </motion.div>

                  {/* Decorative Elements */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: index * 0.2 + 0.8 }}
                    viewport={{ once: true }}
                    className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500/20 rounded-full"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: index * 0.2 + 1 }}
                    viewport={{ once: true }}
                    className="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-500/20 rounded-full"
                  />
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 👤 SECTION JARVIS-GROUP - REFONTE PREMIUM */}
      <section className="relative py-32 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden">
        {/* Grid background subtil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
          
          {/* Header Premium */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-sm text-blue-400 font-medium">Le système complet</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Bien plus qu'un chatbot
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              JARVIS est un <strong className="text-white">écosystème complet</strong> : IA conversationnelle, 
              analytics prédictifs, dashboard actionnable et agents IA autonomes.
            </p>
          </div>

          {/* Grid 2 colonnes : Fonctionnalités + Dashboard Preview */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            
            {/* Colonne gauche : Capacités clés */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-8">Capacités du système</h3>
              
              {/* Feature cards (liste variée) */}
              <div className="space-y-4">
                <div className="group bg-gradient-to-r from-blue-500/5 to-transparent border-l-2 border-blue-500 p-4 rounded-r-lg hover:from-blue-500/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Détection churn prédictive</h4>
                      <p className="text-sm text-neutral-400">Analyse émotions & tonalité pour détecter insatisfactions <strong className="text-white">60 jours avant</strong> le départ</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-purple-500/5 to-transparent border-l-2 border-purple-500 p-4 rounded-r-lg hover:from-purple-500/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Dashboard temps réel</h4>
                      <p className="text-sm text-neutral-400">Heatmaps horaires, alertes critiques, top sujets mentionnés, objectifs IA auto-générés</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-cyan-500/5 to-transparent border-l-2 border-cyan-500 p-4 rounded-r-lg hover:from-cyan-500/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Fiches adhérents enrichies</h4>
                      <p className="text-sm text-neutral-400">Timeline interactions, tags auto-générés (intentions, émotions), scores (fidélité, satisfaction, churn)</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-green-500/5 to-transparent border-l-2 border-green-500 p-4 rounded-r-lg hover:from-green-500/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Missions vocales automatisées</h4>
                      <p className="text-sm text-neutral-400">Diffuser messages ciblés via l'IA (promo, événement, rappel), suivi statistiques</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-orange-500/5 to-transparent border-l-2 border-orange-500 p-4 rounded-r-lg hover:from-orange-500/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Signalement incidents auto</h4>
                      <p className="text-sm text-neutral-400">Équipements HS, propreté, sécurité → tickets ouverts automatiquement, priorisation intelligente</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-r from-pink-500/5 to-transparent border-l-2 border-pink-500 p-4 rounded-r-lg hover:from-pink-500/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Multi-langues & accessibilité</h4>
                      <p className="text-sm text-neutral-400">Interface vocale adaptée (seniors, PMR, déficients visuels), support multi-langues pour internationaux</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite : Dashboard Preview */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-8">Dashboard gérant</h3>
              
              {/* Mock dashboard UI */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">Vue d'ensemble</h4>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    Temps réel
                  </span>
                </div>
                
                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">8</div>
                    <div className="text-xs text-neutral-400">Alertes actives</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-400">3</div>
                    <div className="text-xs text-neutral-400">Profils à risque</div>
                  </div>
                </div>

                {/* Suggestion IA */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Suggestion IA</div>
                      <p className="text-xs text-neutral-300">
                        <strong className="text-purple-400">Marie D.</strong> mentionne tapis défaillant 3x. Prioriser maintenance zone cardio.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top sujets */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-400 uppercase mb-2">Top sujets mentionnés</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">Équipements cardio</span>
                    <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">42 mentions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">Horaires cours yoga</span>
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">28 mentions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">Vestiaires</span>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">19 mentions</span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">-30%</div>
                  <div className="text-xs text-neutral-500">Churn</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">+40%</div>
                  <div className="text-xs text-neutral-500">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-xs text-neutral-500">Assistance</div>
                </div>
              </div>
            </div>
          </div>

          {/* Founder + Tech Stack (inline) */}
          <div className="border-t border-neutral-800 pt-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Founder */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">BP</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Brice PRADET</div>
                  <div className="text-sm text-neutral-400">Founder · Expert IA & Systèmes</div>
                </div>
              </div>

              {/* Tech badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-400">Next.js</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-400">OpenAI Realtime</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-400">Supabase</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-400">CrewAI</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 💰 SECTION REVENUS PUBLICITAIRES (Déplacée après À propos) */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-black to-neutral-950">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-green-950/20 border border-green-500/20 rounded-3xl p-8 md:p-12 relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <VscGraph className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  JARVIS génère des revenus <span className="text-green-400">passifs</span> pour votre salle
                </h3>
              </div>
              
              <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
                Grâce aux <strong className="text-white">partenariats publicitaires contextuels</strong>, JARVIS propose subtilement des produits pertinents (nutrition, équipement) à vos adhérents lors des conversations. Vous touchez une part des revenus publicitaires.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-neutral-900/50 border border-green-500/30 rounded-xl p-6 text-center"
                >
                  <div className="text-3xl font-bold text-green-400 mb-2">Revenus passifs</div>
                  <div className="text-sm text-neutral-400">Partenariats marques premium</div>
                  <div className="text-xs text-neutral-500 mt-2">Potentiel significatif selon taille salle</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-neutral-900/50 border border-green-500/30 rounded-xl p-6 text-center"
                >
                  <div className="text-4xl font-bold text-green-400 mb-2">100%</div>
                  <div className="text-sm text-neutral-400">Pub contextuelle</div>
                  <div className="text-xs text-neutral-500 mt-2">Pertinente selon profil adhérent</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-neutral-900/50 border border-green-500/30 rounded-xl p-6 text-center"
                >
                  <div className="text-4xl font-bold text-green-400 mb-2">ROI négatif</div>
                  <div className="text-sm text-neutral-400">JARVIS peut devenir gratuit</div>
                  <div className="text-xs text-neutral-500 mt-2">Amortissement complet possible</div>
                </motion.div>
              </div>
              
              <div className="mt-8 p-4 bg-neutral-900/50 border border-neutral-700 rounded-xl">
                <p className="text-sm text-neutral-400 text-center">
                  💡 <strong className="text-white">Différenciateur clé</strong> : JARVIS ne coûte pas, il <span className="text-green-400">rapporte</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 🎯 SECTION 5: PROGRAMME PILOTE MVP */}
      <section id="results" className="relative py-16 md:py-24 lg:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Rejoignez notre{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                programme pilote
              </span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Soyez parmi les premiers à tester JARVIS et co-construire l'avenir des salles de sport
            </p>
          </motion.div>

          {/* MVP Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-16 lg:mb-20"
          >
            {[
              {
                value: "MVP",
                label: "Prêt à tester",
                description: "Version fonctionnelle complète"
              },
              {
                value: "5",
                label: "Places pilotes",
                description: "Sélection exclusive"
              },
              {
                value: "0€",
                label: "Coût de test",
                description: "Partenariat gratuit"
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center p-8 bg-neutral-900/50 border border-white/10 rounded-xl"
              >
                <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-neutral-300 mb-2">{stat.label}</div>
                <div className="text-sm text-neutral-500">{stat.description}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pilot Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-16 lg:mb-20">
            {[
              {
                icon: "🚀",
                title: "Test MVP gratuit pendant 3 mois",
                description: "Installation complète, formation équipe, support dédié. Aucun coût pour vous, juste vos retours précieux.",
                benefit: "Valeur : +15K€"
              },
              {
                icon: "🤝",
                title: "Co-création produit",
                description: "Vos besoins orientent directement nos développements. Vous construisez avec nous la solution idéale pour votre métier.",
                benefit: "Influence directe sur la roadmap"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-neutral-900/50 border border-white/10 rounded-xl p-8"
              >
                <div className="mb-6">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-neutral-300 text-lg leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">{item.benefit}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Expertise Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Un MVP prêt, transparent et ambitieux
                </h3>
                <p className="text-neutral-300 mb-6 leading-relaxed">
                  <strong className="text-white">Soyons honnêtes</strong> : nous sommes au stade MVP. Pas encore de clients en production, mais un produit <strong className="text-white">fonctionnel</strong> développé avec les dernières technologies (OpenAI Realtime API). 
                  C'est pourquoi nous cherchons des <strong className="text-blue-400">partenaires pilotes</strong> pour co-construire ensemble.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <VscCheck className="w-5 h-5 text-green-400" />
                    <span className="text-neutral-300"><strong className="text-white">Speech-to-speech fonctionnel</strong> (testez-le ci-dessus !)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VscCheck className="w-5 h-5 text-blue-400" />
                    <span className="text-neutral-300"><strong className="text-white">Stack pro</strong> : Next.js, OpenAI Realtime, Supabase</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VscCheck className="w-5 h-5 text-purple-400" />
                    <span className="text-neutral-300"><strong className="text-white">Métriques basées</strong> sur études sectorielles reconnues</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VscWarning className="w-5 h-5 text-yellow-400" />
                    <span className="text-neutral-300"><strong className="text-white">Pas encore testé en condition réelle</strong> → C'est votre rôle !</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-black/30 rounded-lg">
                  <div className="text-3xl font-bold text-blue-400 mb-2">OpenAI</div>
                  <div className="text-neutral-400 text-sm mb-2">Technologie</div>
                  <div className="text-lg font-bold text-white">Realtime API</div>
                </div>
                <div className="text-center p-6 bg-black/30 rounded-lg">
                  <div className="text-3xl font-bold text-green-400 mb-2">3 mois</div>
                  <div className="text-neutral-400 text-sm mb-2">Développement</div>
                  <div className="text-lg font-bold text-white">MVP Ready</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🎯 FORMULAIRE DE CONTACT */}
          <motion.div
            id="contact"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="mt-12 md:mt-16 lg:mt-20"
          >
            <div className="max-w-3xl mx-auto">
              {/* Header formulaire */}
              <div className="text-center mb-8">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Prêt à rejoindre l'aventure ?
                </h3>
                <p className="text-lg text-neutral-400">
                  Remplissez le formulaire ci-dessous et recevez une réponse sous 24h
                </p>
              </div>

              {/* Formulaire */}
              <div className="bg-neutral-900/30 border border-white/10 rounded-2xl p-6 md:p-8">
                <ContactForm leadType="pilot" />
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-neutral-500 text-sm">
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>Réponse sous 24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Données sécurisées RGPD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>5 places exclusives</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Voice Interface Modal */}
      <VoiceVitrineInterface
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
