/**
 * 🧹 LOG CLEANER - Solution simple et efficace
 * 
 * Override console.log pour supprimer le bruit
 */

// 🎯 Patterns à filtrer (logs verbeux)
const VERBOSE_PATTERNS = [
  '===== NOUVELLE INTERACTION =====',
  '===== USER MESSAGE =====',
  '===== JARVIS RESPONSE =====',
  '👤 Qui parle:',
  '🔄 Tour:',
  '🎯 Intent détecté:',
  '😊 Sentiment:',
  '📂 Catégorie:',
  '⚡ Engagement:',
  '📅 Session ID:',
  '=============',
  '[JARVIS LOGGER]',
  '[CONSOLE INTERCEPTOR]',
  '🔍 [INTERCEPTOR DEBUG]',
  '[DEBUG SESSION ASSIGN]',
  '[CONNECT DEBUG]',
  'sessionRef.current assigné',
  'createSession() réussie',
  'initializeWebRTC() réussie',
  '🔄 [GOODBYE] Recognition terminée',
  '⚠️ [GOODBYE] Reconnaissance déjà active',
  '🎯 [CONSOLE INTERCEPTOR] Configuré pour session',
  '🎯 [VOICE INTERFACE] Intercepteur mis à jour'
]

// 🧹 Override console.log
const originalLog = console.log
let isCleanerActive = false

export function activateLogCleaner() {
  if (isCleanerActive) return
  
  console.log('🧹 [LOG CLEANER] Activation du nettoyage des logs')
  isCleanerActive = true
  
  console.log = (...args: any[]) => {
    const message = args.join(' ')
    
    // Filtrer les messages verbeux
    for (const pattern of VERBOSE_PATTERNS) {
      if (message.includes(pattern)) {
        return // Ne pas afficher
      }
    }
    
    // Afficher les logs importants
    originalLog(...args)
  }
}

export function deactivateLogCleaner() {
  if (!isCleanerActive) return
  
  console.log = originalLog
  isCleanerActive = false
  originalLog('🧹 [LOG CLEANER] Désactivé')
}

// 🚀 Auto-activation en production et démo
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  // Attendre 1 seconde pour laisser les logs initiaux passer
  setTimeout(activateLogCleaner, 1000)
}
