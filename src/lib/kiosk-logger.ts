/**
 * 🎯 KIOSK LOGGER
 * Système de logs optimisé pour debugging kiosk
 * - Logs clairs et concis
 * - Groupage par catégorie
 * - Niveau de verbosité configurable
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success'
type LogCategory = 'SESSION' | 'TRACKING' | 'AUDIO' | 'API' | 'SYSTEM'

interface LogOptions {
  category: LogCategory
  level: LogLevel
  sessionId?: string
  details?: any
}

class KioskLogger {
  private verbose = process.env.NODE_ENV === 'development'
  private sessionPrefix = ''

  /**
   * 🎯 Configurer session pour prefixer les logs
   */
  setSession(sessionId: string, memberName: string) {
    this.sessionPrefix = `[${memberName}|${sessionId.slice(-6)}]`
  }

  /**
   * 📝 Log principal avec formatage intelligent
   */
  log(message: string, options: LogOptions) {
    const { category, level, details } = options
    const prefix = `${this.getIcon(level)} ${this.sessionPrefix} [${category}]`
    const formattedMessage = `${prefix} ${message}`

    switch (level) {
      case 'error':
        console.error(formattedMessage, details || '')
        break
      case 'warn':
        console.warn(formattedMessage, details || '')
        break
      case 'success':
        console.log(`%c${formattedMessage}`, 'color: #22c55e', details || '')
        break
      default:
        console.log(formattedMessage, details || '')
    }
  }

  /**
   * 🎯 Logs spécialisés par catégorie
   */
  session(message: string, level: LogLevel = 'info', details?: any) {
    this.log(message, { category: 'SESSION', level, details })
  }

  tracking(message: string, level: LogLevel = 'info', details?: any) {
    this.log(message, { category: 'TRACKING', level, details })
  }

  audio(message: string, level: LogLevel = 'info', details?: any) {
    this.log(message, { category: 'AUDIO', level, details })
  }

  api(message: string, level: LogLevel = 'info', details?: any) {
    this.log(message, { category: 'API', level, details })
  }

  system(message: string, level: LogLevel = 'info', details?: any) {
    this.log(message, { category: 'SYSTEM', level, details })
  }

  /**
   * 🎨 Icônes pour chaque niveau
   */
  private getIcon(level: LogLevel): string {
    switch (level) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warn': return '⚠️'
      default: return '🎯'
    }
  }

  /**
   * 📊 Log état complet de session
   */
  sessionStatus(status: {
    sessionId: string
    member: string
    phase: string
    duration?: number
    interactions?: number
  }) {
    const { sessionId, member, phase, duration, interactions } = status
    const details = {
      durée: duration ? `${Math.round(duration)}s` : 'N/A',
      interactions: interactions || 0
    }
    
    this.session(`${member} • ${phase}`, 'info', details)
  }

  /**
   * 🚨 Log erreur avec contexte
   */
  error(message: string, error: any, category: LogCategory = 'SYSTEM') {
    const errorDetails = {
      message: error?.message || 'Unknown error',
      stack: this.verbose ? error?.stack : undefined
    }
    
    this.log(message, { 
      category, 
      level: 'error', 
      details: errorDetails 
    })
  }
}

export const kioskLogger = new KioskLogger()
