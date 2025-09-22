"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// 🎯 ACETERNITY UI COMPONENTS
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { FloatingDock } from "@/components/ui/floating-dock";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { MacbookScroll } from "@/components/ui/macbook-scroll";

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
  VscStar,
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
      icon: <VscHome className="h-full w-full text-neutral-300" />,
      href: "#hero",
    },
    {
      title: "Comment ça marche",
      icon: <VscGear className="h-full w-full text-neutral-300" />,
      href: "#comment-ca-marche",
    },
    {
      title: "Dashboard",
      icon: <VscGraph className="h-full w-full text-neutral-300" />,
      href: "#dashboard",
    },
    {
      title: "Parler à JARVIS",
      icon: <VscRobot className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: () => setIsVoiceModalOpen(true),
    },
    {
      title: "Contact",
      icon: <VscMail className="h-full w-full text-neutral-300" />,
      href: "#contact",
    },
  ];

  // Words for TypewriterEffect
  const heroWords = [
    { text: "L'IA" },
    { text: "pour" },
    { text: "salles" },
    { text: "de" },
    { text: "sport" },
  ];

  // Features for BentoGrid
  const features = [
    {
      title: "Conversations Intelligentes",
      description: "JARVIS comprend et répond en temps réel aux adhérents avec une IA conversationnelle avancée.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscRobot className="h-12 w-12 text-blue-400" /></div>,
      className: "md:col-span-2",
      icon: <VscRobot className="h-4 w-4 text-neutral-300" />,
    },
    {
      title: "Analytics Avancées",
      description: "Dashboard complet pour analyser les interactions et améliorer l'expérience adhérent.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscPieChart className="h-12 w-12 text-green-400" /></div>,
      className: "md:col-span-1",
      icon: <VscPieChart className="h-4 w-4 text-neutral-300" />,
    },
    {
      title: "Sécurité Renforcée",
      description: "Protection des données adhérents avec chiffrement bout en bout et conformité RGPD.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscShield className="h-12 w-12 text-purple-400" /></div>,
      className: "md:col-span-1",
      icon: <VscShield className="h-4 w-4 text-neutral-300" />,
    },
    {
      title: "ROI Prouvé",
      description: "Augmentation mesurable de la satisfaction client et réduction du churn.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 items-center justify-center"><VscStar className="h-12 w-12 text-yellow-400" /></div>,
      className: "md:col-span-2",
      icon: <VscStar className="h-4 w-4 text-neutral-300" />,
    },
  ];

  // Process data for 3D Cards
  const parcoursData = [
    {
      title: "Installation",
      description: "Mise en place des équipements et configuration de JARVIS dans votre salle.",
      icon: <VscGear className="h-8 w-8 text-blue-400" />,
      step: "1"
    },
    {
      title: "Formation",
      description: "Formation complète de vos équipes pour une utilisation optimale.",
      icon: <VscPlay className="h-8 w-8 text-green-400" />,
      step: "2"
    },
    {
      title: "Suivi",
      description: "Accompagnement continu et optimisation basée sur les analytics.",
      icon: <VscArrowUp className="h-8 w-8 text-purple-400" />,
      step: "3"
    }
  ];

  // Content for StickyScroll
  const stickyContent = [
    {
      title: "Détection Automatique",
      description: "L'adhérent s'approche du miroir digital et scanne son badge. JARVIS récupère automatiquement son profil complet pour une conversation ultra-personnalisée.",
      content: (
        <div className="h-full w-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white">
          <VscRobot className="h-20 w-20" />
        </div>
      ),
    },
    {
      title: "Conversation Intelligente",
      description: "L'IA comprend le contexte, l'historique et les besoins spécifiques de chaque adhérent pour fournir des réponses pertinentes et engageantes.",
      content: (
        <div className="h-full w-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white">
          <VscGraph className="h-20 w-20" />
        </div>
      ),
    },
    {
      title: "Analyse Post-Interaction",
      description: "Chaque conversation est analysée pour détecter les signaux de satisfaction, de churn, et générer des insights actionnables pour votre équipe.",
      content: (
        <div className="h-full w-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white">
          <VscPieChart className="h-20 w-20" />
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* 🎯 INDICATEUR VERSION ACETERNITY */}
      <div className="fixed top-4 right-4 bg-green-500 text-black px-4 py-2 rounded-lg text-center font-bold z-50">
        ✅ VERSION ACETERNITY UI PURE !
      </div>

      {/* 🎯 BACKGROUND ANIMATION */}
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(0, 0, 0)"
        gradientBackgroundEnd="rgb(0, 0, 0)"
        firstColor="18, 113, 255"
        secondColor="221, 74, 255"
        thirdColor="100, 220, 255"
        fourthColor="200, 50, 50"
        fifthColor="180, 180, 50"
        pointerColor="140, 100, 255"
        size="80%"
        blendingValue="hard-light"
        className="absolute inset-0"
        containerClassName="absolute inset-0"
      />

      {/* 🎯 FLOATING NAVIGATION */}
      <FloatingDock
        items={dockItems}
        desktopClassName="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
        mobileClassName="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40"
      />

      {/* 🎯 HERO SECTION */}
      <section id="hero" className="relative min-h-screen overflow-hidden">
        <div className="container mx-auto px-6 h-screen flex items-center justify-between relative z-10">
          
          {/* Hero content */}
          <div className="flex-1 max-w-2xl">
            <TypewriterEffectSmooth 
              words={heroWords}
              className="text-4xl md:text-6xl font-bold mb-6"
              cursorClassName="bg-white"
            />
            <p className="text-xl text-neutral-300 mb-8 max-w-xl">
              Solution complète <span className="text-white font-semibold">sur devis</span> : 
              installation, formation et abonnement mensuel.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button 
                onClick={() => setIsVoiceModalOpen(true)}
                className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                <VscPlay className="h-5 w-5" />
                Parler à JARVIS
              </button>
              <button className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors">
                Demander un devis
              </button>
            </div>
          </div>

          {/* Avatar 3D */}
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-96 h-96">
              <Avatar3D currentSection="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 VOTRE PARCOURS JARVIS SECTION - 3D CARDS */}
      <section id="parcours" className="relative py-20">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Votre Parcours JARVIS</h2>
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
                    <div className="h-32 w-full rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
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
      <section id="features" className="relative py-20">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fonctionnalités Clés</h2>
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
      <section id="comment-ca-marche" className="relative py-20">
        <div className="relative z-10">
          <div className="text-center mb-16 px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto">
              Un processus simple et automatisé pour une expérience adhérent exceptionnelle.
            </p>
          </div>
          
          <StickyScroll content={stickyContent} />
        </div>
      </section>

      {/* 🎯 DASHBOARD SECTION - MACBOOK SCROLL */}
      <section id="dashboard" className="relative py-20">
        <div className="relative z-10">
          <MacbookScroll
            title="Dashboard Intelligence IA"
            badge="Analytics Avancées"
            src="/images/dashboard-gerant.jpg"
            showGradient={false}
          />
        </div>
      </section>

      {/* 🎯 ROI SECTION */}
      <section id="roi" className="relative py-20">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Un Investissement qui se Rentabilise
            </h2>
            <p className="text-xl text-neutral-300 mb-8">
              JARVIS ne coûte pas, il rapporte. Réduction du churn, augmentation de la satisfaction, 
              et nouvelles opportunités de revenus grâce aux insights IA.
            </p>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Calculer votre ROI
            </button>
          </div>
        </div>
      </section>

      {/* 🎯 CONTACT SECTION */}
      <section id="contact" className="relative py-20">
        <div className="container mx-auto px-6 relative z-10">
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

