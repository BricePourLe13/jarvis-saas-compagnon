"use client"

import { Box, BoxProps } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { useResponsive } from '@/hooks/useResponsive'

export interface UniversalBoxProps extends BoxProps {
  /** Taille du conteneur fluide */
  containerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Espacement fluide */
  fluidSpacing?: '1' | '2' | '3' | '4' | '6' | '8' | '12' | '16' | '20'
  /** Typographie fluide */
  fluidText?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  /** Activation des interactions contextuelles */
  enableHover?: boolean
  /** Activation du mode touch-friendly */
  enableTouch?: boolean
  /** Respect des préférences de mouvement */
  respectMotion?: boolean
}

/**
 * UniversalBox - Composant Box avec design fluide universel
 * S'adapte automatiquement à tous les appareils (Apple/Tesla style)
 */
const UniversalBox = forwardRef<HTMLDivElement, UniversalBoxProps>(({
  containerSize,
  fluidSpacing,
  fluidText,
  enableHover = false,
  enableTouch = false,
  respectMotion = true,
  className = '',
  children,
  ...props
}, ref) => {
  const { 
    supportsHover, 
    supportsTouch, 
    prefersMotion,
    universal 
  } = useResponsive()

  // Construction des classes CSS universelles
  const universalClasses = [
    containerSize && `universal-container-${containerSize}`,
    fluidSpacing && `universal-p-${fluidSpacing}`,
    fluidText && `universal-text-${fluidText}`,
    enableHover && supportsHover && 'universal-hover',
    enableTouch && supportsTouch && 'universal-touch',
    respectMotion && !prefersMotion && 'universal-motion-safe',
    className
  ].filter(Boolean).join(' ')

  // Styles adaptatifs basés sur les capacités
  const adaptiveStyles = {
    // Curseur contextuel
    cursor: supportsHover && enableHover ? 'pointer' : 'default',
    // Taille minimale pour touch
    minHeight: supportsTouch && enableTouch ? '44px' : undefined,
    minWidth: supportsTouch && enableTouch ? '44px' : undefined,
    // Transitions conditionnelles
    transition: prefersMotion || !respectMotion ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
  }

  return (
    <Box
      ref={ref}
      className={universalClasses}
      {...adaptiveStyles}
      {...props}
    >
      {children}
    </Box>
  )
})

UniversalBox.displayName = 'UniversalBox'

export default UniversalBox


