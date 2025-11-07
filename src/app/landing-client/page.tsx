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
  () => import("@/components/kiosk/Avatar3D"),
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
  const [voiceTimeRemaining, setVoiceTimeRemaining] = useState(300); // 5 minutes
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
    maxDuration: 300 // 5 minutes
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
      setVoiceTimeRemaining(300); // 5 minutes
    } catch (error) {
      console.error('Erreur déconnexion vocale:', error);
    }
  };

  // 🎯 DATA DEFINITIONS

  // Navigation items pour FloatingDock (Desktop - JSX)
  const dockItemsDesktop = [
    {
      title: "Accueil",
      icon: <VscHome className="h-full w-full text-white" />,
      href: "#hero",
    },
    {
      title: "Problème",
      icon: <VscWarning className="h-full w-full text-white" />,
      href: "#problems",
    },
    {
      title: "Solution",
      icon: <VscRobot className="h-full w-full text-white" />,
      href: "#solution",
    },
    {
      title: "Process",
      icon: <VscGear className="h-full w-full text-white" />,
      href: "#process",
    },
    {
      title: "Résultats",
      icon: <VscGraph className="h-full w-full text-white" />,
      href: "#results",
    },
    {
      title: "Contact",
      icon: <VscMail className="h-full w-full text-white" />,
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
  const heroWords = ["révolutionne", "transforme", "réinvente", "optimise"];

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
      icon: <VscGear className="w-8 h-8 text-orange-400" />,
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

  // Solution pilliers (architecture ouverte et évolutive)
  const solutionPillars = [
    {
      icon: "🎯",
      title: "Intelligence contextuelle",
      description: "JARVIS comprend votre salle, vos membres, votre équipe. Chaque conversation est personnalisée selon le contexte complet.",
      examples: "Conseils nutrition adaptés au profil · Tutoriels vidéo selon l'objectif · Recommandations coach selon disponibilité",
      color: "from-blue-500/10 to-blue-600/5",
      borderColor: "border-blue-500/20 hover:border-blue-500/40"
    },
    {
      icon: "⚡",
      title: "Actions automatiques",
      description: "JARVIS agit pour vous : réserve, inscrit, notifie, gère. Tout workflow répétitif devient automatique sans limite.",
      examples: "Réservation RDV coach · Inscription cours collectifs · Rappels SMS/Email · Gestion réclamations · Alertes équipe",
      color: "from-purple-500/10 to-purple-600/5",
      borderColor: "border-purple-500/20 hover:border-purple-500/40"
    },
    {
      icon: "📊",
      title: "Analytics prédictifs",
      description: "JARVIS analyse, prédit, recommande. Détection churn avancée, opportunités business, rapports automatiques.",
      examples: "Prédiction churn 60j avant · Sentiment analysis · Trends fréquentation · Opportunités upsell · ROI mesurable",
      color: "from-green-500/10 to-green-600/5",
      borderColor: "border-green-500/20 hover:border-green-500/40"
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

      {/* 🎯 BACKGROUND EFFECTS FIXES - Fond étoilé fixe au scroll */}
      {!isMobile && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="relative w-full h-full">
            <StarsBackground
              starDensity={0.0001}
              allStarsTwinkle={true}
              twinkleProbability={0.6}
              minTwinkleSpeed={0.8}
              maxTwinkleSpeed={2}
            />
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
          </div>
        </div>
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
      <div className="lg:hidden fixed bottom-6 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
      <section id="hero" className="relative z-10 min-h-screen flex items-start lg:items-center pt-24 pb-32 md:pt-32 lg:pt-16 lg:pb-0">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-6 md:px-8 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-24 lg:gap-16 items-center">
          
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 text-center lg:text-left"
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
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                L'IA qui{" "}
                <span className="inline-block min-w-[160px] sm:min-w-[220px] md:min-w-[280px]">
                  <FlipWords words={heroWords} className="text-white" duration={3000} />
                </span>
                <br />
                <span className="text-white">l'expérience client</span>
              </h1>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-base md:text-lg lg:text-xl font-semibold text-neutral-200 mt-3"
              >
                JARVIS engage vos adhérents comme jamais auparavant
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="text-xs sm:text-sm text-neutral-400 leading-relaxed mt-4"
              >
                Conversations naturelles · Actions concrètes · Résultats mesurables
              </motion.p>
            </div>

            {/* CTA supprimé - Interface vocale maintenant intégrée à la sphère */}

            {/* Proof Points Simplifiés (1 ligne) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="pt-4 border-t border-neutral-800/50"
            >
              <p className="text-xs sm:text-sm text-neutral-400 text-center lg:text-left">
                <span className="text-white font-bold">-40% churn</span> · 
                <span className="text-white font-bold"> 70% automatisé</span> · 
                <span className="text-white font-bold"> ROI en 1 mois</span>
              </p>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          {/* CONTAINER PROPRE SANS TRANSFORMS PARASITES */}
          <div className="relative flex justify-center order-2 lg:order-last mt-24 lg:mt-0">
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
                  
                  {/* Texte d'instruction (au dessus) - Desktop uniquement */}
                  {!isVoiceActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center hidden lg:block"
                    >
                      <motion.p 
                        className="text-white/90 text-lg font-light tracking-[0.15em] uppercase mb-8"
                        style={{
                          letterSpacing: '0.15em',
                          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                          fontWeight: 300
                        }}
                        animate={{ 
                          opacity: [0.7, 0.95, 0.7]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Parler avec JARVIS
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
                  
                  {/* SPHÈRE JARVIS - Desktop uniquement (Style Kiosk) */}
                  <motion.div 
                    className="relative cursor-pointer hidden lg:block"
                    onClick={!isVoiceActive ? handleStartVoice : undefined}
                  >
                    {/* Container de la sphère avec dimensions optimisées */}
                    <div className="w-80 h-80 2xl:w-[360px] 2xl:h-[360px] flex items-center justify-center relative">
                      {/* Glow effect supprimé pour éliminer la lueur blanche indésirable */}
                      
                      {/* Avatar JARVIS */}
                      <motion.div
                        whileHover={!isVoiceActive ? { scale: 1.03 } : {}}
                        whileTap={!isVoiceActive ? { scale: 0.97 } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Avatar3D 
                          size={320}
                          currentSection="hero" 
                          status={voiceStatus === 'speaking' ? 'speaking' : 
                                 voiceStatus === 'listening' ? 'listening' : 
                                 voiceStatus === 'connecting' ? 'connecting' : 'idle'}
                          eyeScale={1}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  {/* SPHÈRE MOBILE (petite taille) */}
                  <motion.div 
                    className="relative cursor-pointer lg:hidden"
                    onClick={!isVoiceActive ? handleStartVoice : undefined}
                  >
                    {/* Container de la sphère mobile - petite taille */}
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center relative">
                      {/* Glow effect supprimé pour éliminer la lueur blanche */}
                      
                      {/* Avatar JARVIS mobile */}
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10"
                      >
                        <Avatar3D 
                          size={200}
                          currentSection="hero" 
                          status={voiceStatus === 'speaking' ? 'speaking' : 
                                 voiceStatus === 'listening' ? 'listening' : 
                                 voiceStatus === 'connecting' ? 'connecting' : 'idle'}
                          eyeScale={1}
                        />
                      </motion.div>
                    </div>
                    
                    {/* Texte d'instruction mobile (en dessous de la sphère) */}
                    {!isVoiceActive && (
                      <motion.p 
                        className="text-white/90 text-base font-light tracking-[0.12em] uppercase text-center mt-4 lg:hidden"
                        style={{
                          letterSpacing: '0.12em',
                          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                          fontWeight: 300
                        }}
                        animate={{ 
                          opacity: [0.7, 0.95, 0.7]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Parler avec JARVIS
                      </motion.p>
                    )}
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


      {/* 🎯 SECTION 3: PROBLÈMES (Pain Points) */}
      <section id="problems" className="relative z-10 py-10 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-black/40 via-neutral-950/10 to-black/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 md:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
              Votre salle perd{" "}
              <span className="text-red-400">30% de ses membres</span>
              {" "}chaque année
            </h2>
            <p className="text-sm md:text-base text-neutral-400 max-w-3xl mx-auto">
              Découvrez les 3 problèmes silencieux qui tuent votre business... et comment les résoudre.
            </p>
          </motion.div>

          {/* Pain Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
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
                  <CardBody className={`relative group/card hover:shadow-2xl hover:shadow-${point.color}-500/[0.1] bg-black/30 border-white/[0.1] w-full h-auto rounded-xl p-4 md:p-6 border transition-all duration-500`}>
                    {/* Icon */}
                    <CardItem translateZ="50" className="mb-4 md:mb-6">
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
      <section id="solution" className="relative z-10 py-10 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-black/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              JARVIS : Votre{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                IA sur-mesure
              </span>
              {" "}qui s'adapte à votre salle
            </h2>
            <p className="text-sm md:text-base text-neutral-400 max-w-3xl mx-auto">
              Une plateforme extensible qui évolue avec vos besoins, pas une solution figée
            </p>
          </motion.div>

          {/* Demo Interactive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-stretch">
            
            {/* Left: Conversation Simulation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="space-y-6 flex flex-col"
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
              className="space-y-6 flex flex-col"
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
              </div>
            </motion.div>
          </div>

          {/* 🎯 3 PILLIERS : Architecture ouverte et évolutive */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-16 md:mt-20 lg:mt-24"
          >
            <div className="text-center mb-12">
              <h3 className="text-xl md:text-3xl font-bold text-white mb-3">
                3 Pilliers{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  infiniment extensibles
                </span>
              </h3>
              <p className="text-sm md:text-base text-neutral-400 max-w-3xl mx-auto">
                Une architecture modulaire qui s'adapte à vos besoins spécifiques, sans limite
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {solutionPillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  {/* Icon */}
                  <div className="text-5xl mb-4">{pillar.icon}</div>
                  
                  {/* Title */}
                  <h4 className="text-lg font-bold text-white mb-2">{pillar.title}</h4>
                  
                  {/* Description (1 ligne uniquement) */}
                  <p className="text-sm text-neutral-400">
                    {pillar.examples}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 💡 BLOC EXTENSIBILITÉ + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-16 md:mt-20"
          >
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-8 md:p-12 text-center">
              <div className="text-6xl mb-6">💡</div>
              <h3 className="text-xl md:text-3xl font-bold text-white mb-4">
                Votre salle a des besoins uniques ?
              </h3>
              <p className="text-sm md:text-base text-neutral-300 leading-relaxed mb-4">
                JARVIS est construit sur une <strong className="text-white">architecture extensible (MCP)</strong>.<br />
                <span className="text-cyan-400 font-semibold">25+ outils disponibles immédiatement</span>, création illimitée d'outils sur-mesure.
              </p>
              <p className="text-xs md:text-sm text-neutral-400 mb-6">
                Nutrition, kiné, partenaires locaux, événements, challenges, intégrations tierces ?<br />
                <strong className="text-white">Vos besoins spécifiques deviennent de nouveaux outils JARVIS.</strong>
              </p>
              
              {/* CTA */}
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
              >
                Discutons de vos besoins →
              </motion.a>
              
              <div className="mt-6 text-sm text-neutral-500">
                Réponse sous 24h · Consultation gratuite · 5 places pilotes disponibles
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 🎯 SECTION 4: PROCESS - 3 ÉTAPES */}
      <section id="process" className="relative z-10 py-10 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-black/40 via-neutral-950/10 to-black/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              De l'installation au{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                ROI en 3 étapes
              </span>
            </h2>
            <p className="text-sm md:text-base text-neutral-400 max-w-3xl mx-auto">
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
                    className="relative mx-auto w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 z-10"
                  >
                    <span className="text-white font-bold text-lg md:text-xl">{step.number}</span>
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


      {/* 🎯 SECTION 5: PROGRAMME PILOTE + À PROPOS + CONTACT (FUSIONNÉE) */}
      <section id="results" className="relative z-10 py-12 md:py-16 lg:py-20 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* SOUS-SECTION 1: Programme Pilote */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Rejoignez notre{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                programme pilote
              </span>
            </h2>
            <p className="text-sm md:text-base text-neutral-400 max-w-3xl mx-auto">
              Soyez parmi les premiers à tester JARVIS et co-construire l'avenir des salles de sport
            </p>
          </motion.div>

          {/* MVP Stats (Simplifié - inline) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-12 text-center"
          >
            <div>
              <span className="text-2xl md:text-3xl font-bold text-white">MVP</span>
              <span className="text-sm text-neutral-400 ml-2">prêt à tester</span>
            </div>
            <span className="text-neutral-600 hidden md:inline">·</span>
            <div>
              <span className="text-2xl md:text-3xl font-bold text-white">5</span>
              <span className="text-sm text-neutral-400 ml-2">places pilotes</span>
            </div>
            <span className="text-neutral-600 hidden md:inline">·</span>
            <div>
              <span className="text-2xl md:text-3xl font-bold text-white">0€</span>
              <span className="text-sm text-neutral-400 ml-2">coût de test</span>
            </div>
          </motion.div>

          {/* Pilot Benefits - ULTRA SIMPLIFIÉ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              Test MVP gratuit · 3 mois · 0€
            </h3>
            <p className="text-sm text-neutral-400 mb-6">
              Installation 2 jours · Formation incluse · Support 24/7
            </p>
          </motion.div>

          {/* DIVIDER */}
          <div className="max-w-xs mx-auto border-t border-neutral-800 mb-16"></div>

          {/* SOUS-SECTION 2: À Propos (ultra compact) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-4">
              À propos
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
              L'IA qui augmente l'humain
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed mb-4">
              Créer des systèmes d'IA conversationnelle qui <strong className="text-white">augmentent l'humain</strong> au lieu de le remplacer. 
              Premier terrain : les salles de sport. Demain : musées, retail, hôtellerie.
            </p>
            <p className="text-xs text-blue-400">
              Fondé en octobre 2024 · Brice PRADET, Ingénieur IA
            </p>
          </motion.div>

          {/* DIVIDER */}
          <div className="max-w-xs mx-auto border-t border-neutral-800 mb-16"></div>

          {/* SOUS-SECTION 3: FORMULAIRE DE CONTACT */}
          <motion.div
            id="contact"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="max-w-2xl mx-auto">
              {/* Header formulaire */}
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Prêt à rejoindre l'aventure ?
                </h3>
                <p className="text-xs md:text-sm text-neutral-400">
                  Réponse sous 24h · 5 places exclusives
                </p>
              </div>

              {/* Formulaire */}
              <div className="bg-neutral-900/30 border border-white/10 rounded-2xl p-4 md:p-6">
                <ContactForm leadType="pilot" />
              </div>

              {/* Trust signals (simplifié) */}
              <div className="flex flex-wrap justify-center items-center gap-4 mt-6 text-neutral-500 text-xs">
                <span>⚡ Réponse 24h</span>
                <span>·</span>
                <span>🔒 RGPD</span>
                <span>·</span>
                <span>🎯 5 places</span>
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
