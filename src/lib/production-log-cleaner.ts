/**
 * 🔇 PRODUCTION LOG CLEANER
 * Nettoie les logs console en mode production
 */

// Patterns à filtrer en production
const PRODUCTION_FILTER_PATTERNS = [
  // Warnings Node.js
  'punycode module is deprecated',
  'Multiple GoTrueClient instances',
  
  // Logs debug développement
  '[CONNECT DEBUG]',
  '[DEBUG SESSION]',
  'Événement serveur non géré',
  
  // Logs tracking verbeux (garder erreurs importantes)
  '[TRACKING] Récupération infos gym',
  '[TRACKING] Réponse gym API',
  '[TRACKING] Données gym complètes',
  
  // Heartbeat spam (garder erreurs)
  '💓 [HEARTBEAT] Page visible',
  '💓 [HEARTBEAT] Page masquée',
  
  // Console interceptor deprecated
  '[CONSOLE INTERCEPTOR]',
  '[PLAN B]'
]

class ProductionLogCleaner {
  private originalConsole: {
    log: typeof console.log
    warn: typeof console.warn
    error: typeof console.error
    info: typeof console.info
  }

  constructor() {
    // Sauvegarder les méthodes originales
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console), 
      error: console.error.bind(console),
      info: console.info.bind(console)
    }
  }

  /**
   * Activer le nettoyage en mode production
   */
  activate() {
    // Seulement en production
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    // Override console.log
    console.log = (...args: any[]) => {
      const message = args.join(' ')
      
      if (this.shouldFilter(message)) {
        return // Filtré silencieusement
      }
      
      this.originalConsole.log(...args)
    }

    // Override console.warn (plus permissif)
    console.warn = (...args: any[]) => {
      const message = args.join(' ')
      
      // Filtrer seulement les warnings très verbeux
      const verboseWarnings = [
        'punycode module is deprecated',
        'Multiple GoTrueClient instances'
      ]
      
      if (verboseWarnings.some(pattern => message.includes(pattern))) {
        return // Filtré
      }
      
      this.originalConsole.warn(...args)
    }

    // console.error et console.info inchangés (toujours importantes)
  }

  /**
   * Vérifier si un message doit être filtré
   */
  private shouldFilter(message: string): boolean {
    return PRODUCTION_FILTER_PATTERNS.some(pattern => 
      message.includes(pattern)
    )
  }

  /**
   * Désactiver le nettoyage (restaurer console normale)
   */
  deactivate() {
    console.log = this.originalConsole.log
    console.warn = this.originalConsole.warn
    console.error = this.originalConsole.error
    console.info = this.originalConsole.info
  }
}

// Instance singleton
export const productionLogCleaner = new ProductionLogCleaner()

// Auto-activation en production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  productionLogCleaner.activate()
  console.info('🔇 [PRODUCTION] Logs nettoyés pour la production')
}

