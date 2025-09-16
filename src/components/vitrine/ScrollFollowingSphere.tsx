'use client'

import { Box } from '@chakra-ui/react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import JarvisLogoSphere from './JarvisLogoSphere'
import { vitrineTheme } from './VitrineDesignSystem'

export default function ScrollFollowingSphere() {
  const { scrollYProgress } = useScroll()
  const [windowHeight, setWindowHeight] = useState(0)

  useEffect(() => {
    setWindowHeight(window.innerHeight)
    const handleResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 🌊 TRANSFORMATIONS BASÉES SUR LE SCROLL
  
  // Position verticale : la sphère suit le scroll de manière fluide
  const yPosition = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [0, windowHeight * 0.3, windowHeight * 0.8, windowHeight * 1.2, windowHeight * 1.5]
  )
  
  // Position horizontale : mouvement subtil de droite à gauche
  const xPosition = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    [0, -50, 30, -20]
  )
  
  // Taille : la sphère change de taille selon le scroll
  const scale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [1, 0.7, 1.2, 0.8, 0.6]
  )
  
  // Rotation : la sphère tourne en scrollant
  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 360]
  )
  
  // Opacité : la sphère s'estompe vers la fin
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.8, 1],
    [1, 1, 0.3]
  )

  // 🎭 ANIMATIONS FLUIDES AVEC SPRING
  const smoothY = useSpring(yPosition, { stiffness: 100, damping: 30 })
  const smoothX = useSpring(xPosition, { stiffness: 100, damping: 30 })
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 })
  const smoothRotate = useSpring(rotate, { stiffness: 100, damping: 30 })

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '50%',
        right: '10%',
        zIndex: 10,
        pointerEvents: 'none',
        y: smoothY,
        x: smoothX,
        scale: smoothScale,
        rotateY: smoothRotate,
        opacity
      }}
    >
      <Box position="relative">
        {/* Sphère JARVIS principale avec nouveau logo */}
        <JarvisLogoSphere size={200} animated={true} />



      </Box>
    </motion.div>
  )
}
