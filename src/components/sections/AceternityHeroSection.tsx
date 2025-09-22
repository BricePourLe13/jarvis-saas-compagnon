"use client";
import React from "react";
import { HeroHighlight, Highlight } from "@/components/aceternity/HeroHighlight";
import { TypewriterEffectInstant } from "@/components/aceternity/TypewriterEffectFixed";
import { motion } from "framer-motion";
import Avatar3D from "@/components/kiosk/Avatar3D";
import { VStack, HStack, Text, Button } from "@chakra-ui/react";

export function AceternityHeroSection() {
  const words = [
    {
      text: "L'IA",
      className: "text-white",
    },
    {
      text: "qui",
      className: "text-white",
    },
    {
      text: "révolutionne",
      className: "text-blue-500 dark:text-blue-500",
    },
    {
      text: "l'expérience",
      className: "text-white",
    },
    {
      text: "salle",
      className: "text-white",
    },
    {
      text: "de",
      className: "text-white",
    },
    {
      text: "sport",
      className: "text-purple-500 dark:text-purple-500",
    },
  ];

  return (
    <HeroHighlight containerClassName="min-h-screen">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-8">
        {/* CONTENU GAUCHE - TEXTE */}
        <div className="flex-1 max-w-2xl">
          {/* Titre avec Typewriter Effect */}
          <TypewriterEffectInstant 
            words={words}
            className="text-left mb-8"
            cursorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
          />
          
          {/* Description avec Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.5 }}
            className="mb-8"
          >
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-4">
              JARVIS transforme chaque interaction membre en{" "}
              <Highlight className="text-black dark:text-white">
                expérience personnalisée 24/7
              </Highlight>
            </p>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              Réduisez votre churn de{" "}
              <span className="font-bold text-green-400">67%</span> avec l'IA 
              conversationnelle la plus avancée du fitness.
            </p>
          </motion.div>

          {/* Points clés avec animations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3 }}
            className="mb-8"
          >
            <VStack align="flex-start" spacing={4}>
              {[
                { icon: "💬", text: "IA conversationnelle : répond, conseille, montre des vidéos" },
                { icon: "📈", text: "Dashboard gérant : insights IA + recommandations automatiques" },
                { icon: "✨", text: "Interface immersive : miroir digital pour plus d'engagement" }
              ].map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 3.2 + index * 0.2 }}
                >
                  <HStack spacing={3}>
                    <Text fontSize="xl">{point.icon}</Text>
                    <Text color="gray.300" fontSize="md">
                      {point.text}
                    </Text>
                  </HStack>
                </motion.div>
              ))}
            </VStack>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              leftIcon={<span>🚀</span>}
            >
              Découvrir JARVIS
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-500 px-8 py-3 rounded-lg transition-all duration-300"
              leftIcon={<span>🎤</span>}
            >
              Parler à JARVIS
            </Button>
          </motion.div>
        </div>

        {/* CONTENU DROITE - AVATAR 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="flex-shrink-0 ml-16"
        >
          <div 
            className="relative w-96 h-96 hover:scale-105 transition-transform duration-500"
          >
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
            
            {/* Avatar 3D */}
            <Avatar3D />
            
            {/* Floating particles */}
            {[...Array(8)].map((_, index) => (
              <motion.div
                key={index}
                className="absolute w-2 h-2 bg-blue-400 rounded-full"
                style={{
                  left: `${20 + (index * 45)}%`,
                  top: `${15 + (index % 3) * 30}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </HeroHighlight>
  );
}
