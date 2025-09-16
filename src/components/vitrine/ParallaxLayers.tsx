'use client'

import { Box } from '@chakra-ui/react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { vitrineTheme } from './VitrineDesignSystem'

export default function ParallaxLayers() {
  const { scrollYProgress } = useScroll()

  // 🌊 COUCHES PARALLAX À DIFFÉRENTES VITESSES
  
  // Couche arrière-plan (très lente)
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -200])
  
  // Couche intermédiaire (vitesse moyenne)
  const midgroundY = useTransform(scrollYProgress, [0, 1], [0, -400])
  
  // Couche avant-plan (rapide)
  const foregroundY = useTransform(scrollYProgress, [0, 1], [0, -600])

  return (
    <>
      {/* 🌫️ COUCHE ARRIÈRE-PLAN - Formes géométriques lentes */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -3,
          y: backgroundY
        }}
      >
        {/* Grandes formes géométriques */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Box
            key={`bg-shape-${i}`}
            position="absolute"
            w={`${200 + i * 50}px`}
            h={`${200 + i * 50}px`}
            borderRadius={i % 2 === 0 ? "50%" : "20px"}
            bg={`linear-gradient(135deg, ${vitrineTheme.colors.gray[100]} 0%, ${vitrineTheme.colors.gray[200]} 100%)`}
            opacity={0.1}
            top={`${Math.random() * 80}%`}
            left={`${Math.random() * 80}%`}
            transform={`rotate(${Math.random() * 360}deg)`}
          />
        ))}
      </motion.div>

      {/* 🌊 COUCHE INTERMÉDIAIRE - Éléments décoratifs */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -2,
          y: midgroundY
        }}
      >
        {/* Lignes et connexions */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '120%',
            opacity: 0.1
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.line
              key={`mid-line-${i}`}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2={`${Math.random() * 100}%`}
              y2={`${Math.random() * 100}%`}
              stroke={vitrineTheme.colors.gray[400]}
              strokeWidth="1"
              strokeDasharray="5,5"
              animate={{
                strokeDashoffset: [0, -10],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                strokeDashoffset: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                },
                opacity: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2
                }
              }}
            />
          ))}
        </svg>

        {/* Cercles flottants */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`mid-circle-${i}`}
            style={{
              position: 'absolute',
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              borderRadius: '50%',
              border: `1px solid ${vitrineTheme.colors.gray[300]}`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2],
              rotate: [0, 360]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </motion.div>

      {/* ✨ COUCHE AVANT-PLAN - Particules rapides */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          y: foregroundY
        }}
      >
        {/* Particules brillantes */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`fg-particle-${i}`}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              backgroundColor: vitrineTheme.colors.gray[500],
              boxShadow: `0 0 4px ${vitrineTheme.colors.gray[500]}`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 3
            }}
          />
        ))}

        {/* Grilles dynamiques */}
        <Box
          position="absolute"
          inset={0}
          backgroundImage={`
            linear-gradient(${vitrineTheme.colors.gray[300]} 1px, transparent 1px),
            linear-gradient(90deg, ${vitrineTheme.colors.gray[300]} 1px, transparent 1px)
          `}
          backgroundSize="100px 100px"
          opacity={0.05}
          transform="perspective(1000px) rotateX(60deg)"
        />
      </motion.div>

      {/* 🌟 OVERLAY DE DÉGRADÉ UNIFIANT */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={-4}
        bg="radial-gradient(ellipse at center, transparent 0%, rgba(248, 250, 252, 0.3) 100%)"
        pointerEvents="none"
      />
    </>
  )
}
