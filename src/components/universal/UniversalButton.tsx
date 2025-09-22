"use client"

import { Button, ButtonProps } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { useResponsive } from '@/hooks/useResponsive'

export interface UniversalButtonProps extends ButtonProps {
  /** Style universel du bouton */
  universalVariant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  /** Taille fluide */
  fluidSize?: 'sm' | 'md' | 'lg' | 'xl'
  /** Adaptation automatique touch/hover */
  adaptive?: boolean
}

/**
 * UniversalButton - Bouton avec interactions contextuelles
 * S'adapte automatiquement aux capacités du device (touch/hover)
 */
const UniversalButton = forwardRef<HTMLButtonElement, UniversalButtonProps>(({
  universalVariant = 'primary',
  fluidSize = 'md',
  adaptive = true,
  className = '',
  children,
  ...props
}, ref) => {
  const { 
    supportsHover, 
    supportsTouch, 
    prefersMotion,
    isHighRes,
    isDarkMode 
  } = useResponsive()

  // Styles de base selon la variante
  const getVariantStyles = () => {
    const baseStyles = {
      primary: {
        bg: 'linear-gradient(45deg, #FF8C00, #FFD700)',
        color: 'white',
        border: 'none',
        _hover: supportsHover ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)'
        } : {}
      },
      secondary: {
        bg: 'rgba(255, 255, 255, 0.1)',
        color: isDarkMode ? 'white' : 'gray.800',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        _hover: supportsHover ? {
          bg: 'rgba(255, 255, 255, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        } : {}
      },
      ghost: {
        bg: 'transparent',
        color: isDarkMode ? 'white' : 'gray.700',
        _hover: supportsHover ? {
          bg: 'rgba(255, 255, 255, 0.1)'
        } : {}
      },
      outline: {
        bg: 'transparent',
        color: isDarkMode ? 'white' : 'gray.700',
        border: '2px solid currentColor',
        _hover: supportsHover ? {
          bg: 'currentColor',
          color: isDarkMode ? 'black' : 'white'
        } : {}
      }
    }
    return baseStyles[universalVariant]
  }

  // Tailles fluides
  const getSizeStyles = () => {
    const sizes = {
      sm: {
        fontSize: 'var(--fluid-text-sm)',
        padding: 'var(--fluid-space-2) var(--fluid-space-3)',
        minHeight: supportsTouch ? '40px' : '32px'
      },
      md: {
        fontSize: 'var(--fluid-text-base)',
        padding: 'var(--fluid-space-3) var(--fluid-space-4)',
        minHeight: supportsTouch ? '44px' : '36px'
      },
      lg: {
        fontSize: 'var(--fluid-text-lg)',
        padding: 'var(--fluid-space-4) var(--fluid-space-6)',
        minHeight: supportsTouch ? '48px' : '40px'
      },
      xl: {
        fontSize: 'var(--fluid-text-xl)',
        padding: 'var(--fluid-space-6) var(--fluid-space-8)',
        minHeight: supportsTouch ? '56px' : '48px'
      }
    }
    return sizes[fluidSize]
  }

  // Classes CSS universelles
  const universalClasses = [
    'universal-button',
    supportsHover && 'universal-hover',
    supportsTouch && 'universal-touch',
    !prefersMotion && 'universal-motion-safe',
    className
  ].filter(Boolean).join(' ')

  // Styles adaptatifs complets
  const adaptiveStyles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    // Optimisations pour haute résolution
    ...(isHighRes && {
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }),
    // Transitions conditionnelles
    transition: prefersMotion ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    // Touch-friendly
    ...(supportsTouch && {
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation'
    }),
    // Bordure de focus accessible
    _focus: {
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px'
    },
    // États actifs pour touch
    ...(supportsTouch && {
      _active: {
        transform: 'scale(0.98)'
      }
    })
  }

  return (
    <Button
      ref={ref}
      className={universalClasses}
      borderRadius="var(--fluid-radius-md)"
      fontWeight="600"
      {...adaptiveStyles}
      {...props}
    >
      {children}
    </Button>
  )
})

UniversalButton.displayName = 'UniversalButton'

export default UniversalButton


