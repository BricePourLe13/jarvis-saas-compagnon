"use client"

import { Box, BoxProps } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { useResponsive } from '@/hooks/useResponsive'

export interface UniversalGridProps extends BoxProps {
  /** Taille des éléments de grille */
  itemSize?: 'sm' | 'md' | 'lg'
  /** Mode de grille */
  gridMode?: 'auto' | 'masonry' | 'standard'
  /** Espacement entre les éléments */
  gap?: '1' | '2' | '3' | '4' | '6' | '8'
  /** Nombre minimum de colonnes */
  minColumns?: number
  /** Nombre maximum de colonnes */
  maxColumns?: number
  /** Largeur minimale des éléments */
  minItemWidth?: string
}

/**
 * UniversalGrid - Grille auto-adaptative universelle
 * S'adapte intelligemment selon le device et le contenu
 */
const UniversalGrid = forwardRef<HTMLDivElement, UniversalGridProps>(({
  itemSize = 'md',
  gridMode = 'auto',
  gap = '4',
  minColumns = 1,
  maxColumns = 6,
  minItemWidth,
  className = '',
  children,
  ...props
}, ref) => {
  const { universal, isCompact, isMedium, isUltrawide } = useResponsive()

  // Calcul de la largeur minimale des éléments
  const getMinItemWidth = () => {
    if (minItemWidth) return minItemWidth
    
    // Adaptation contextuelle selon le device
    if (isCompact) {
      return itemSize === 'sm' ? '200px' : itemSize === 'lg' ? '280px' : '240px'
    }
    if (isMedium) {
      return itemSize === 'sm' ? '220px' : itemSize === 'lg' ? '320px' : '280px'
    }
    if (isUltrawide) {
      return itemSize === 'sm' ? '280px' : itemSize === 'lg' ? '400px' : '350px'
    }
    
    // Standard desktop
    return itemSize === 'sm' ? '250px' : itemSize === 'lg' ? '350px' : '300px'
  }

  // Calcul du nombre de colonnes adaptatif
  const getAdaptiveColumns = () => {
    const viewportWidth = universal.viewport.width
    const itemWidth = parseInt(getMinItemWidth())
    const gapSize = parseInt(gap) * 16 // Conversion en px approximative
    
    const possibleColumns = Math.floor((viewportWidth - 64) / (itemWidth + gapSize)) // 64px pour les marges
    return Math.max(minColumns, Math.min(maxColumns, possibleColumns))
  }

  // Construction des classes CSS
  const gridClasses = [
    gridMode === 'auto' && 'universal-auto-grid',
    gridMode === 'masonry' && 'universal-masonry',
    gridMode === 'standard' && `universal-grid${itemSize !== 'md' ? `-${itemSize}` : ''}`,
    className
  ].filter(Boolean).join(' ')

  // Styles adaptatifs
  const adaptiveStyles = {
    ...(gridMode === 'standard' && {
      gridTemplateColumns: `repeat(${getAdaptiveColumns()}, 1fr)`,
    }),
    ...(gridMode === 'auto' && {
      gridTemplateColumns: `repeat(auto-fit, minmax(${getMinItemWidth()}, 1fr))`,
    }),
    gap: `var(--fluid-space-${gap})`,
    // Adaptation pour écrans très larges
    ...(isUltrawide && {
      maxWidth: '100%',
      justifyContent: 'center'
    })
  }

  return (
    <Box
      ref={ref}
      className={gridClasses}
      display="grid"
      {...adaptiveStyles}
      {...props}
    >
      {children}
    </Box>
  )
})

UniversalGrid.displayName = 'UniversalGrid'

export default UniversalGrid


