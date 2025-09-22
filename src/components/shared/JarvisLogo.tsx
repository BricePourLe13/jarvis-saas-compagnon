'use client'

import { HStack, Icon, Heading, Text, VStack } from '@chakra-ui/react'
import { FaRobot } from 'react-icons/fa'

interface JarvisLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  variant?: 'default' | 'fitness' | 'museums'
  color?: string
}

const sizeConfig = {
  sm: { icon: 4, heading: 'sm', tagline: 'xs' },
  md: { icon: 6, heading: 'md', tagline: 'sm' },
  lg: { icon: 8, heading: 'lg', tagline: 'md' },
  xl: { icon: 12, heading: '2xl', tagline: 'lg' }
}

const variantConfig = {
  default: {
    color: 'blue.500',
    title: 'JARVIS Group',
    tagline: 'Intelligence Artificielle Conversationnelle'
  },
  fitness: {
    color: 'blue.500',
    title: 'JARVIS Fitness',
    tagline: 'Votre compagnon IA pour le fitness'
  },
  museums: {
    color: 'purple.500',
    title: 'JARVIS Museums',
    tagline: 'Guide IA pour expériences culturelles'
  }
}

export default function JarvisLogo({ 
  size = 'md', 
  showTagline = false, 
  variant = 'default',
  color 
}: JarvisLogoProps) {
  const config = sizeConfig[size]
  const variantStyle = variantConfig[variant]
  const logoColor = color || variantStyle.color

  if (showTagline) {
    return (
      <VStack spacing={1} align="start">
        <HStack spacing={3}>
          <Icon as={FaRobot} boxSize={config.icon} color={logoColor} />
          <Heading size={config.heading} color={logoColor}>
            {variantStyle.title}
          </Heading>
        </HStack>
        <Text fontSize={config.tagline} color="gray.600" fontWeight="medium">
          {variantStyle.tagline}
        </Text>
      </VStack>
    )
  }

  return (
    <HStack spacing={3}>
      <Icon as={FaRobot} boxSize={config.icon} color={logoColor} />
      <Heading size={config.heading} color={logoColor}>
        {variantStyle.title}
      </Heading>
    </HStack>
  )
}


