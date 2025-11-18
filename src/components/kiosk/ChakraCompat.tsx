// ============================================================================
// COMPOSANTS COMPATIBILITÉ CHAKRA → TAILWIND (TEMPORAIRE)
// À SUPPRIMER après migration complète de la page kiosk
// ============================================================================

import React from 'react'
import { Loader2 } from 'lucide-react'

// Box → div avec Tailwind
export const Box: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

// VStack → div flex-col
export const VStack: React.FC<React.HTMLAttributes<HTMLDivElement> & { spacing?: number }> = ({ 
  children, 
  className, 
  spacing,
  ...props 
}) => {
  const gapClass = spacing ? `gap-${spacing}` : 'gap-4'
  return <div className={`flex flex-col ${gapClass} ${className || ''}`} {...props}>{children}</div>
}

// HStack → div flex-row
export const HStack: React.FC<React.HTMLAttributes<HTMLDivElement> & { spacing?: number }> = ({ 
  children, 
  className, 
  spacing,
  ...props 
}) => {
  const gapClass = spacing ? `gap-${spacing}` : 'gap-4'
  return <div className={`flex flex-row items-center ${gapClass} ${className || ''}`} {...props}>{children}</div>
}

// Text → p ou span
export const Text: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { as?: 'p' | 'span' }> = ({ 
  children, 
  className,
  as = 'p',
  ...props 
}) => {
  const Component = as
  return <Component className={className} {...props}>{children}</Component>
}

// Badge → span avec classes
export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { colorScheme?: string }> = ({ 
  children, 
  className,
  colorScheme,
  ...props 
}) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  
  const colorClass = colorScheme ? colorClasses[colorScheme as keyof typeof colorClasses] || colorClasses.gray : ''
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${colorClass} ${className || ''}`} 
      {...props}
    >
      {children}
    </span>
  )
}

// Spinner → Loader2 de lucide-react
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }
  
  return <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-600`} />
}

