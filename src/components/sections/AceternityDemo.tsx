"use client";
import React from 'react';
import { FloatingNav } from '@/components/aceternity/FloatingNav';
import { AceternityHeroSection } from '@/components/sections/AceternityHeroSection';
import AuroraBackground from '@/components/backgrounds/AuroraBackground';
import { VscHome, VscArchive, VscAccount, VscSettingsGear, VscMail, VscCreditCard } from 'react-icons/vsc';

export default function AceternityDemo() {
  const navItems = [
    { name: "Accueil", link: "#hero", icon: <VscHome /> },
    { name: "Problème", link: "#probleme", icon: <VscArchive /> },
    { name: "Solution", link: "#comment-ca-marche", icon: <VscSettingsGear /> },
    { name: "Dashboard", link: "#dashboard", icon: <VscAccount /> },
    { name: "Tarifs", link: "#pricing", icon: <VscCreditCard /> },
    { name: "Contact", link: "#contact", icon: <VscMail /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Aurora */}
      <div className="fixed inset-0 z-0">
        <AuroraBackground showRadialGradient={true} />
      </div>

      {/* Navigation flottante */}
      <FloatingNav navItems={navItems} />

      {/* Hero Section */}
      <section id="hero" className="relative z-10">
        <AceternityHeroSection />
      </section>

      {/* Section démo */}
      <section className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            🎉 Aceternity Components Fonctionnent !
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Les composants Aceternity sont maintenant intégrés et prêts à être utilisés 
            pour refaire complètement le site JARVIS avec une esthétique wow !
          </p>
        </div>
      </section>
    </div>
  );
}


