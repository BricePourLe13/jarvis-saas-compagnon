"use client"

import { Text, TextProps } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { useResponsive } from '@/hooks/useResponsive'

export interface UniversalTextProps extends TextProps {
  /** Taille de texte fluide */
  fluidSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  /** Adaptation automatique selon le device */
  adaptive?: boolean
  /** Contraste amélioré pour l'accessibilité */
  highContrast?: boolean
}

/**
 * UniversalText - Composant Text avec typographie fluide
 * S'adapte automatiquement à la taille d'écran et aux préférences utilisateur
 */
const UniversalText = forwardRef<HTMLParagraphElement, UniversalTextProps>(({
  fluidSize = 'base',
  adaptive = true,
  highContrast = false,
  className = '',
  children,
  ...props
}, ref) => {
  const { 
    isCompact, 
    isMedium, 
    isHighRes,
    isDarkMode,
    universal 
  } = useResponsive()

  // Adaptation automatique de la taille selon le device
  const getAdaptiveSize = () => {
    if (!adaptive) return fluidSize
    
    // Réduction automatique sur petits écrans
    if (isCompact) {
      const sizeMap = {
        '6xl': '4xl', '5xl': '3xl', '4xl': '2xl', '3xl': 'xl',
        '2xl': 'lg', 'xl': 'base', 'lg': 'sm', 'base': 'sm', 'sm': 'xs'
      } as const
      return sizeMap[fluidSize] || fluidSize
    }
    
    // Augmentation sur écrans moyens
    if (isMedium && ['xs', 'sm'].includes(fluidSize)) {
      return fluidSize === 'xs' ? 'sm' : 'base'
    }
    
    return fluidSize
  }

  // Construction des classes CSS
  const textClasses = [
    `universal-text-${getAdaptiveSize()}`,
    className
  ].filter(Boolean).join(' ')

  // Styles adaptatifs
  const adaptiveStyles = {
    // Amélioration pour écrans haute résolution
    ...(isHighRes && {
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }),
    // Contraste amélioré
    ...(highContrast && {
      color: isDarkMode ? '#ffffff' : '#000000',
      textShadow: isDarkMode ? '0 0 1px rgba(255,255,255,0.5)' : '0 0 1px rgba(0,0,0,0.5)'
    }),
    // Line-height adaptatif
    lineHeight: isCompact ? '1.4' : '1.6'
  }

  return (
    <Text
      ref={ref}
      className={textClasses}
      {...adaptiveStyles}
      {...props}
    >
      {children}
    </Text>
  )
})

UniversalText.displayName = 'UniversalText'

export default UniversalText
