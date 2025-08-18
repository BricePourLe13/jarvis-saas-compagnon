/**
 * 🧹 MINIMAL LOG CLEANER
 * Garde uniquement les logs essentiels du Kiosk Logger
 */

// Patterns à garder (logs importants)
const KEEP_PATTERNS = [
  '[SESSION]',
  '[TRACKING]', 
  '[AUDIO]',
  '[API]',
  '❌', // Erreurs
  '⚠️', // Warnings
  '✅' // Succès
]

// Patterns à supprimer (bruit)
const FILTER_PATTERNS = [
  '📝 [TRANSCRIPT]',
  '🎵 Track audio',
  '🎤 Début de parole',
  '🤐 Fin de parole', 
  '📨 Événement serveur non géré',
  '💓 [HEARTBEAT]',
  'WebRTC stats',
  'WebSocket',
  'Canvas 2D Context'
]

export function activateMinimalLogCleaner() {
  if (typeof window === 'undefined') return

  const originalConsoleLog = console.log

  console.log = (...args: any[]) => {
    const message = args.join(' ')
    
    // Garder les logs importants
    for (const pattern of KEEP_PATTERNS) {
      if (message.includes(pattern)) {
        originalConsoleLog(...args)
        return
      }
    }
    
    // Filtrer le bruit
    for (const pattern of FILTER_PATTERNS) {
      if (message.includes(pattern)) {
        return // Supprimer
      }
    }
    
    // Par défaut : garder
    originalConsoleLog(...args)
  }

  console.log('🧹 [LOG CLEANER] Mode minimal activé - Logs Kiosk Logger uniquement')
}

// Auto-activation en production
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  setTimeout(activateMinimalLogCleaner, 2000)
}
