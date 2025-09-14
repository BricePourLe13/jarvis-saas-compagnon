/**
 * 🛡️ SAFE LINK - Wrapper sécurisé pour Next.js Link
 * 
 * Évite les erreurs "href undefined" en fournissant un fallback automatique
 */

import Link from 'next/link'
import { ComponentProps, ReactNode } from 'react'

interface SafeLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href?: string | undefined | null
  children: ReactNode
  fallback?: string
}

export default function SafeLink({ 
  href, 
  children, 
  fallback = '/dashboard',
  ...props 
}: SafeLinkProps) {
  // Si href est undefined/null/empty, utiliser le fallback
  const safeHref = href && href.trim() !== '' ? href : fallback
  
  return (
    <Link href={safeHref} {...props}>
      {children}
    </Link>
  )
}

// Export aussi un hook pour les cas où on utilise router.push
export function useSafeNavigation() {
  const navigate = (href?: string | null, fallback = '/dashboard') => {
    const safeHref = href && href.trim() !== '' ? href : fallback
    return safeHref
  }
  
  return { navigate }
}
