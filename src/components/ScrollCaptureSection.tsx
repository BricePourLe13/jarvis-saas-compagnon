"use client"

import React, { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from 'framer-motion'
import { Box } from '@chakra-ui/react'

interface ScrollCaptureSectionProps {
  children: React.ReactNode[]
  height?: string
}

/**
 * Version ultra-simple du scroll captif - approche minimaliste qui fonctionne
 */
const ScrollCaptureSection: React.FC<ScrollCaptureSectionProps> = ({
  children,
  height = "400vh"
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // Scroll progress avec spring pour fluidité
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.0001
  })
  
  // Animation de respiration pour la carte active
  const breathingScale = useMotionValue(1)
  
  useAnimationFrame(() => {
    const time = Date.now() * 0.002
    breathingScale.set(1 + Math.sin(time) * 0.02) // Pulsation subtile
  })
  
  // Suivi de la souris pour effets magnétiques
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // Détection de la carte active
  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (progress) => {
      const newIndex = Math.floor(progress * children.length)
      const clampedIndex = Math.max(0, Math.min(children.length - 1, newIndex))
      setActiveCardIndex(clampedIndex)
    })
    
    return unsubscribe
  }, [smoothProgress, children.length])

  return (
    <Box
      ref={containerRef}
      w="full"
      h={height}
      position="relative"
    >
      {/* Container sticky centré */}
      <Box
        position="sticky"
        top="50vh"
        transform="translateY(-50%)"
        w="full"
        h="800px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {/* Rendu avancé des cartes avec effets 3D */}
        {children.map((child, index) => {
          const cardStart = index / children.length
          const cardEnd = (index + 1) / children.length
          const isActive = index === activeCardIndex
          
          // Transformations 3D avancées
          const y = useTransform(
            smoothProgress,
            [cardStart, cardEnd],
            [80 * (children.length - index), -80 * index]
          )
          
          const opacity = useTransform(
            smoothProgress,
            [Math.max(0, cardStart - 0.2), cardStart - 0.1, cardStart, cardEnd, cardEnd + 0.1, Math.min(1, cardEnd + 0.2)],
            [0.1, 0.3, 1, 1, 0.3, 0.1]
          )
          
          const scale = useTransform(
            smoothProgress,
            [cardStart, (cardStart + cardEnd) / 2, cardEnd],
            [0.85, 1, 0.85]
          )
          
          // Pas de rotation pour éviter les déformations
          const rotateX = 0
          const rotateY = 0
          
          // Effet magnétique basé sur la souris
          const magneticX = isActive && typeof window !== 'undefined' 
            ? (mousePosition.x - window.innerWidth / 2) * 0.02 
            : 0
          const magneticY = isActive && typeof window !== 'undefined' 
            ? (mousePosition.y - window.innerHeight / 2) * 0.02 
            : 0
          
          return (
            <motion.div
              key={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                y,
                opacity,
                scale: isActive ? useTransform(breathingScale, (v) => scale.get() * v) : scale,
                x: magneticX,
                zIndex: isActive ? 10 : children.length - index
              }}
              animate={{
                filter: isActive 
                  ? `drop-shadow(0 0 30px rgba(59, 130, 246, 0.3)) brightness(1.1)`
                  : `drop-shadow(0 0 0px rgba(0, 0, 0, 0)) brightness(1)`
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Particules flottantes pour la carte active */}
              {isActive && (
                <Box position="absolute" inset={0} pointerEvents="none" overflow="hidden">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        background: 'rgba(59, 130, 246, 0.6)',
                        borderRadius: '50%',
                        left: `${20 + i * 10}%`,
                        top: `${20 + (i % 3) * 20}%`
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.3, 1, 0.3],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </Box>
              )}
              
              <Box
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={4}
                position="relative"
              >
                {child}
              </Box>
            </motion.div>
          )
        })}
      </Box>
    </Box>
  )
}

export default ScrollCaptureSection