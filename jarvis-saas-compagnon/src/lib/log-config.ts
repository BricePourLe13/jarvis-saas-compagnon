/**
 * 🧹 CONFIGURATION LOGS PROPRES
 * 
 * Contrôle centralisé de tous les logs
 */

// 🎯 Niveaux de logs
export enum LogLevel {
  PRODUCTION = 0,  // Logs critiques seulement
  DEMO = 1,        // Logs utiles pour démos
  DEBUG = 2        // Tous les logs (développement)
}

// 📊 Configuration actuelle
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.PRODUCTION 
  : LogLevel.DEMO

export class CleanLogConfig {
  static shouldLog(level: LogLevel): boolean {
    return level <= CURRENT_LOG_LEVEL
  }

  // 🎯 Messages simplifiés
  static conversation(speaker: 'user' | 'jarvis', message: string, turn: number): void {
    if (!this.shouldLog(LogLevel.DEMO)) return
    
    const emoji = speaker === 'user' ? '📥' : '📤'
    const shortMsg = message.length > 40 ? message.substring(0, 40) + '...' : message
    console.log(`${emoji} [${speaker.toUpperCase()}] T${turn}: "${shortMsg}"`)
  }

  static success(message: string): void {
    if (!this.shouldLog(LogLevel.DEMO)) return
    console.log(`✅ ${message}`)
  }

  static error(message: string, error?: any): void {
    if (!this.shouldLog(LogLevel.PRODUCTION)) return
    console.error(`❌ ${message}`, error || '')
  }

  static session(message: string, sessionId?: string): void {
    if (!this.shouldLog(LogLevel.DEMO)) return
    const shortSession = sessionId ? sessionId.substring(-8) : ''
    console.log(`🎯 [SESSION] ${message} ${shortSession}`)
  }

  static alert(message: string): void {
    if (!this.shouldLog(LogLevel.PRODUCTION)) return
    console.warn(`⚠️ [ALERT] ${message}`)
  }

  // 🧹 Désactiver les logs verbeux
  static disableVerbose(): void {
    // Override console.log sélectif
    const originalLog = console.log
    console.log = (...args: any[]) => {
      const message = args.join(' ')
      
      // Filtrer les logs verbeux
      if (message.includes('===== NOUVELLE INTERACTION =====')) return
      if (message.includes('[JARVIS LOGGER]')) return
      if (message.includes('[CONSOLE INTERCEPTOR]')) return
      if (message.includes('🔍 [INTERCEPTOR DEBUG]')) return
      if (message.includes('[DEBUG SESSION]')) return
      if (message.includes('[CONNECT DEBUG]')) return
      if (message.includes('🔄 [GOODBYE]') && !message.includes('AU REVOIR DÉTECTÉ')) return
      
      // Garder les logs importants
      originalLog(...args)
    }
  }
}

// 🚀 Activer le nettoyage automatique
if (typeof window !== 'undefined') {
  CleanLogConfig.disableVerbose()
}
