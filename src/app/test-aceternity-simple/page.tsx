"use client";

import React from "react";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function TestAceternitySimple() {
  const words = [
    { text: "ACETERNITY" },
    { text: "UI" },
    { text: "FONCTIONNE" },
    { text: "!" },
  ];

  return (
    <main className="min-h-screen relative flex items-center justify-center">
      {/* 🎯 INDICATEUR DE SUCCÈS */}
      <div className="fixed top-4 right-4 bg-green-500 text-black px-4 py-2 rounded-lg font-bold z-50">
        ✅ ACETERNITY UI CHARGÉE !
      </div>

      {/* Background */}
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(0, 0, 0)"
        gradientBackgroundEnd="rgb(0, 0, 0)"
        firstColor="18, 113, 255"
        secondColor="221, 74, 255"
        thirdColor="100, 220, 255"
        className="absolute inset-0"
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        <TypewriterEffectSmooth 
          words={words}
          className="text-4xl font-bold text-white"
        />
        <p className="text-white mt-8 text-xl">
          Si tu vois ce texte qui s'anime caractère par caractère, 
          <br />
          alors Aceternity UI fonctionne parfaitement !
        </p>
      </div>
    </main>
  );
}

