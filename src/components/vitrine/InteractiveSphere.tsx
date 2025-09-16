'use client'

import { Box } from '@chakra-ui/react'
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

export default function InteractiveSphere() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const sphereRef = useRef<HTMLDivElement>(null)
  
  // Scroll tracking
  const { scrollYProgress } = useScroll()
  
  // Mouse tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Spring animations for smooth movement
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 })
  
  // Scroll-based transformations
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 800])
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [0, 720])
  const scrollScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 0.8])
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Suivre la souris avec un décalage
      const x = (e.clientX - window.innerWidth / 2) * 0.1
      const y = (e.clientY - window.innerHeight / 2) * 0.1
      
      mouseX.set(x)
      mouseY.set(y)
      
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    const handleScroll = () => {
      // La sphère réagit au scroll
      if (sphereRef.current) {
        const rect = sphereRef.current.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0
        setIsHovering(isVisible)
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [mouseX, mouseY])

  return (
    <motion.div
      ref={sphereRef}
      style={{
        position: 'fixed',
        top: '20%',
        right: '10%',
        zIndex: 50,
        pointerEvents: 'none',
        x: springX,
        y: springY,
        translateY: scrollY,
        rotate: scrollRotate,
        scale: scrollScale
      }}
    >
      <Box position="relative" w="200px" h="200px">
        {/* Sphère principale */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #64748b 0%, #334155 50%, #1e293b 100%)',
            boxShadow: `
              0 0 60px rgba(100, 116, 139, 0.4),
              inset 0 0 40px rgba(255, 255, 255, 0.1),
              inset 0 20px 40px rgba(255, 255, 255, 0.2)
            `,
            overflow: 'hidden'
          }}
          animate={{
            rotateY: [0, 360],
            boxShadow: isHovering 
              ? [
                  '0 0 60px rgba(100, 116, 139, 0.4)',
                  '0 0 80px rgba(100, 116, 139, 0.6)',
                  '0 0 60px rgba(100, 116, 139, 0.4)'
                ]
              : '0 0 60px rgba(100, 116, 139, 0.4)'
          }}
          transition={{
            rotateY: { duration: 20, repeat: Infinity, ease: "linear" },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Reflet principal */}
          <Box
            position="absolute"
            top="30px"
            left="40px"
            w="60px"
            h="80px"
            borderRadius="50%"
            bg="rgba(255, 255, 255, 0.4)"
            filter="blur(8px)"
            transform="rotate(-20deg)"
          />
          
          {/* Logo JARVIS au centre */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            fontSize="32px"
            fontWeight="800"
            color="white"
            textShadow="0 2px 4px rgba(0,0,0,0.5)"
            letterSpacing="2px"
          >
            J
          </Box>
          
          {/* Anneaux internes */}
          <Box
            position="absolute"
            top="40px"
            left="40px"
            w="120px"
            h="120px"
            borderRadius="50%"
            border="1px solid rgba(255, 255, 255, 0.1)"
          />
        </motion.div>

        {/* Anneaux orbitaux */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              inset: `-${30 + i * 20}px`,
              borderRadius: '50%',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              opacity: 0.6 - i * 0.1,
            }}
            animate={{
              rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              rotate: {
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 4 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }
            }}
          />
        ))}

        {/* Particules orbitales */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#64748b',
              boxShadow: '0 0 8px #64748b',
            }}
            animate={{
              x: [
                Math.cos((i * Math.PI * 2) / 8) * 140,
                Math.cos((i * Math.PI * 2) / 8 + Math.PI * 2) * 140
              ],
              y: [
                Math.sin((i * Math.PI * 2) / 8) * 140,
                Math.sin((i * Math.PI * 2) / 8 + Math.PI * 2) * 140
              ],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2
            }}
          />
        ))}

        {/* Effet de glow qui pulse */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '-60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(100, 116, 139, 0.3) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Traînée de particules */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '-100px',
            width: '100px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(100, 116, 139, 0.5), transparent)',
            transform: 'translateY(-50%)',
          }}
          animate={{
            opacity: [0, 1, 0],
            scaleX: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </Box>
    </motion.div>
  )
}
