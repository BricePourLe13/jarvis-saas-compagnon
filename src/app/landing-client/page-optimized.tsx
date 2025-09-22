"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

// 🎯 ACETERNITY UI COMPONENTS (Optimisés)
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { FlipWords } from "@/components/ui/flip-words";
import { FloatingDock } from "@/components/ui/floating-dock";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

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
  VscTrendingUp,
  VscShield,
  VscHeart,
  VscGear,
  VscAlert,
  VscClock,
  VscCheckAll
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
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // 🎯 DATA DEFINITIONS

  // Navigation items optimisée
  const dockItems = [
    {
      title: "Accueil",
      icon: <VscHome className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
      href: "#hero",
    },
    {
      title: "Problème",
      icon: <VscTrendingUp className="h-full w-full text-neutral-700 dark:text-neutral-300" />,
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

  // Hero words pour FlipWords
  const heroWords = ["révolutionnaire", "conversationnelle", "prédictive", "personnalisée"];

  // Pain points des gérants
  const painPoints = [
    {
      icon: <VscAlert className="w-8 h-8 text-red-400" />,
      title: "Churn invisible",
      description: "30% de vos membres partent sans prévenir. Vous découvrez les problèmes trop tard.",
      stat: "30% de churn moyen",
      color: "red"
    },
    {
      icon: <VscClock className="w-8 h-8 text-orange-400" />,
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
      icon: <VscTrendingUp className="w-8 h-8 text-green-400" />,
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
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
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => setIsVoiceModalOpen(true)}
            className="group relative px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold hover:shadow-lg transition-all duration-300"
          >
            <span className="relative z-10">Voir la démo → 3 min</span>
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </div>
      </header>

      {/* 🎯 BACKGROUND EFFECTS */}
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

      {/* 🎯 FLOATING NAVIGATION */}
      <FloatingDock
        items={dockItems}
        desktopClassName="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
        mobileClassName="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40"
      />

      {/* 🎯 SECTION 1: HERO IMPACT */}
      <section id="hero" className="relative min-h-screen flex items-center pt-20">
        <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
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
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Réduisez le churn de{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  40%
                </span>
                {" "}avec l'IA{" "}
                <FlipWords words={heroWords} className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent" duration={3000} />
              </h1>
              
              <p className="text-lg md:text-xl text-neutral-300 leading-relaxed max-w-2xl">
                Le miroir digital qui transforme vos adhérents frustrés en ambassadeurs fidèles grâce à l'intelligence artificielle conversationnelle.
              </p>
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 text-neutral-400"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-black" />
                  ))}
                </div>
                <span className="text-sm">Déjà adoptée par 12 salles</span>
              </div>
              <div className="w-px h-6 bg-neutral-600" />
              <span className="text-sm">+2.3M€ de revenus générés</span>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                onClick={() => setIsVoiceModalOpen(true)}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold text-lg hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <VscPlay className="w-5 h-5" />
                  Voir la démo → 3 min
                </span>
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              
              <motion.button
                className="px-8 py-4 border border-neutral-600 rounded-xl text-neutral-300 font-semibold text-lg hover:border-neutral-400 hover:text-white transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Obtenir mon devis gratuit
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-800"
            >
              {[
                { value: "-40%", label: "Churn moyen" },
                { value: "+25%", label: "ROI garanti" },
                { value: "24/7", label: "Disponible" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-neutral-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative flex justify-center"
            style={{ y }}
          >
            <div className="relative w-80 h-80 lg:w-96 lg:h-96">
              <Avatar3D currentSection="hero" status="idle" />
              
              {/* Effet de lueur optimisé */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 blur-3xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3] 
                }}
                transition={{
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Data points floating */}
              {[
                { text: "Churn: -40%", angle: 0, color: "green", delay: 1.2 },
                { text: "Satisfaction: +40%", angle: 90, color: "blue", delay: 1.4 },
                { text: "ROI: +25%", angle: 180, color: "purple", delay: 1.6 },
                { text: "Automatisation: 70%", angle: 270, color: "orange", delay: 1.8 }
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
                    transform: `translate(-50%, -50%) rotate(${data.angle}deg) translateX(220px) rotate(-${data.angle}deg)`
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: data.delay }}
                >
                  {data.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 🎯 SECTION 2: PROBLÈMES (Pain Points) */}
      <section id="problems" className="relative py-32 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto px-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            className="text-center mt-20"
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

      {/* Voice Interface Modal */}
      <VoiceVitrineInterface 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
