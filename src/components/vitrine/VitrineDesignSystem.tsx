'use client'

import { Box, Container, Heading, Text, Button, VStack, HStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

// 🎨 DESIGN TOKENS ÉTENDUS POUR LE SITE VITRINE
export const vitrineTheme = {
  colors: {
    // 🎨 PALETTE MONOCHROME ÉLÉGANTE
    primary: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    },
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    accent: {
      gradient: 'linear-gradient(135deg, #64748b 0%, #334155 50%, #1e293b 100%)',
      glow: 'rgba(100, 116, 139, 0.3)',
      subtle: 'rgba(148, 163, 184, 0.1)'
    }
  },
  typography: {
    hero: {
      fontSize: { base: '3xl', md: '5xl', lg: '6xl' },
      fontWeight: '800',
      lineHeight: '1.1',
      letterSpacing: '-0.02em'
    },
    subtitle: {
      fontSize: { base: 'lg', md: 'xl', lg: '2xl' },
      fontWeight: '400',
      lineHeight: '1.4'
    },
    body: {
      fontSize: { base: 'md', md: 'lg' },
      lineHeight: '1.6'
    }
  },
  spacing: {
    section: { base: 16, md: 24, lg: 32 },
    container: { base: 4, md: 8, lg: 12 }
  },
  animations: {
    fadeInUp: {
      initial: { opacity: 0, y: 60 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    },
    fadeInLeft: {
      initial: { opacity: 0, x: -60 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    },
    fadeInRight: {
      initial: { opacity: 0, x: 60 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
    },
    stagger: {
      animate: {
        transition: {
          staggerChildren: 0.1
        }
      }
    }
  }
}

// 🌟 COMPOSANTS DE BASE RÉUTILISABLES

export const VitrineSection = ({ children, bg = 'transparent', py = vitrineTheme.spacing.section, ...props }: any) => (
  <Box bg={bg} py={py} {...props}>
    <Container maxW="7xl" px={vitrineTheme.spacing.container}>
      {children}
    </Container>
  </Box>
)

export const VitrineHeading = ({ children, gradient = false, ...props }: any) => (
  <Heading
    {...vitrineTheme.typography.hero}
    bgGradient={gradient ? vitrineTheme.colors.accent.gradient : undefined}
    bgClip={gradient ? 'text' : undefined}
    textAlign="center"
    {...props}
  >
    {children}
  </Heading>
)

export const VitrineText = ({ children, variant = 'body', ...props }: any) => (
  <Text
    {...vitrineTheme.typography[variant]}
    color={vitrineTheme.colors.gray[600]}
    textAlign="center"
    {...props}
  >
    {children}
  </Text>
)

export const VitrineButton = ({ 
  children, 
  variant = 'primary', 
  size = 'lg',
  spectacle = false,
  ...props 
}: any) => {
  const baseStyles = {
    size,
    borderRadius: 'xl',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    _hover: {
      transform: 'translateY(-2px)',
      shadow: spectacle ? `0 20px 40px ${vitrineTheme.colors.accent.glow}` : 'xl'
    },
    _active: {
      transform: 'translateY(0)'
    }
  }

  const variants = {
    primary: {
      ...baseStyles,
      bg: vitrineTheme.colors.primary[600],
      color: 'white',
      _hover: {
        ...baseStyles._hover,
        bg: vitrineTheme.colors.primary[700]
      }
    },
    secondary: {
      ...baseStyles,
      bg: 'transparent',
      color: vitrineTheme.colors.gray[700],
      border: '2px solid',
      borderColor: vitrineTheme.colors.gray[300],
      _hover: {
        ...baseStyles._hover,
        borderColor: vitrineTheme.colors.primary[500],
        color: vitrineTheme.colors.primary[600]
      }
    },
    gradient: {
      ...baseStyles,
      bgGradient: vitrineTheme.colors.accent.gradient,
      color: 'white',
      _hover: {
        ...baseStyles._hover,
        opacity: 0.9
      }
    }
  }

  return (
    <Button {...variants[variant]} {...props}>
      {children}
    </Button>
  )
}

// 🎭 ANIMATIONS SPECTACULAIRES
export const SpectacularReveal = ({ children, delay = 0, ...props }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 100, scale: 0.8 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ 
      duration: 1.2, 
      delay,
      ease: [0.25, 0.46, 0.45, 0.94] 
    }}
    {...props}
  >
    {children}
  </motion.div>
)

export const FloatingElement = ({ children, intensity = 1, ...props }: any) => (
  <motion.div
    animate={{
      y: [-10 * intensity, 10 * intensity, -10 * intensity],
      rotate: [-1 * intensity, 1 * intensity, -1 * intensity]
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    {...props}
  >
    {children}
  </motion.div>
)

export const GlowingOrb = ({ size = 200, color = vitrineTheme.colors.primary[500], ...props }: any) => (
  <Box
    position="absolute"
    w={`${size}px`}
    h={`${size}px`}
    borderRadius="50%"
    bg={color}
    opacity={0.1}
    filter="blur(40px)"
    {...props}
  />
)
