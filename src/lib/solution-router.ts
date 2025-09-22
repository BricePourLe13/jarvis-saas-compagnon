/**
 * 🚀 JARVIS GROUP - SOLUTION ROUTER
 * Système de routage intelligent pour les différentes solutions
 */

export type SolutionType = 'fitness' | 'museums'

export interface SolutionConfig {
  id: SolutionType
  name: string
  displayName: string
  description: string
  status: 'active' | 'beta' | 'coming_soon'
  baseUrl: string
  authUrl: string
  dashboardUrl: string
  kioskUrl?: string
  color: string
  icon: string
}

export const SOLUTIONS: Record<SolutionType, SolutionConfig> = {
  fitness: {
    id: 'fitness',
    name: 'fitness',
    displayName: 'JARVIS Fitness',
    description: 'Assistant IA pour salles de sport',
    status: 'active',
    baseUrl: '/fitness',
    authUrl: '/fitness/auth/login',
    dashboardUrl: '/dashboard', // Garde l'ancien système pour l'instant
    kioskUrl: '/kiosk',
    color: 'blue',
    icon: 'FaDumbbell'
  },
  museums: {
    id: 'museums',
    name: 'museums',
    displayName: 'JARVIS Museums',
    description: 'Guide IA pour musées',
    status: 'coming_soon',
    baseUrl: '/museums',
    authUrl: '/museums/auth/login',
    dashboardUrl: '/museums/dashboard',
    kioskUrl: '/museums/kiosk',
    color: 'purple',
    icon: 'FaUniversity'
  }
}

/**
 * Détermine la solution basée sur l'URL ou le contexte
 */
export function detectSolution(pathname: string): SolutionType | null {
  if (pathname.startsWith('/fitness')) return 'fitness'
  if (pathname.startsWith('/museums')) return 'museums'
  
  // Routes legacy qui appartiennent à fitness
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/kiosk') || 
      pathname.startsWith('/auth')) {
    return 'fitness'
  }
  
  return null
}

/**
 * Obtient la configuration d'une solution
 */
export function getSolutionConfig(solution: SolutionType): SolutionConfig {
  return SOLUTIONS[solution]
}

/**
 * Génère l'URL pour une action dans une solution
 */
export function getSolutionUrl(
  solution: SolutionType, 
  action: 'auth' | 'dashboard' | 'kiosk' | 'base',
  params?: Record<string, string>
): string {
  const config = getSolutionConfig(solution)
  
  let url: string
  switch (action) {
    case 'auth':
      url = config.authUrl
      break
    case 'dashboard':
      url = config.dashboardUrl
      break
    case 'kiosk':
      url = config.kioskUrl || config.baseUrl + '/kiosk'
      break
    case 'base':
    default:
      url = config.baseUrl
      break
  }
  
  // Ajouter les paramètres si fournis
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += '?' + searchParams.toString()
  }
  
  return url
}

/**
 * Vérifie si une solution est disponible
 */
export function isSolutionAvailable(solution: SolutionType): boolean {
  const config = getSolutionConfig(solution)
  return config.status === 'active' || config.status === 'beta'
}

/**
 * Obtient toutes les solutions disponibles
 */
export function getAvailableSolutions(): SolutionConfig[] {
  return Object.values(SOLUTIONS).filter(solution => 
    solution.status === 'active' || solution.status === 'beta'
  )
}

/**
 * Obtient toutes les solutions (y compris coming soon)
 */
export function getAllSolutions(): SolutionConfig[] {
  return Object.values(SOLUTIONS)
}

/**
 * Redirige vers la bonne solution basée sur l'utilisateur
 */
export function getDefaultSolutionForUser(userRole?: string): SolutionType {
  // Pour l'instant, tout le monde va vers fitness
  // Plus tard, on pourra avoir une logique plus complexe
  return 'fitness'
}

/**
 * Génère les métadonnées pour une solution
 */
export function getSolutionMetadata(solution: SolutionType) {
  const config = getSolutionConfig(solution)
  
  return {
    title: config.displayName,
    description: config.description,
    keywords: [
      'JARVIS',
      config.name,
      'intelligence artificielle',
      'assistant vocal',
      'IA conversationnelle'
    ].join(', '),
    openGraph: {
      title: config.displayName,
      description: config.description,
      type: 'website'
    }
  }
}


