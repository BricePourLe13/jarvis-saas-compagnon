/**
 * 🧹 SYSTÈME DE LOGGING PROPRE ET CONFIGURABLE
 * 
 * Remplace les console.log éparpillés par un système structuré
 */

// 🎯 Niveaux de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 🏷️ Catégories pour organiser les logs
export type LogCategory = 
  | 'AUTH'
  | 'DATABASE'
  | 'VOICE'
  | 'KIOSK'
  | 'API'
  | 'MONITORING'
  | 'PERFORMANCE'
  | 'ERROR'

// ⚙️ Configuration logging
interface LogConfig {
  level: LogLevel
  enableConsole: boolean
  enableDatabase: boolean
  production: boolean
}

// 📊 Structure d'un log
interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: any
  sessionId?: string
  userId?: string
  gymId?: string
}

class Logger {
  private config: LogConfig

  constructor() {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableDatabase: process.env.ENABLE_DB_LOGGING === 'true',
      production: process.env.NODE_ENV === 'production'
    }
  }

  // 🎨 Couleurs pour console (dev uniquement)
  private getColorCode(level: LogLevel): string {
    if (this.config.production) return ''
    
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Vert
      warn: '\x1b[33m',  // Jaune
      error: '\x1b[31m'  // Rouge
    }
    return colors[level] || ''
  }

  private getIcon(category: LogCategory): string {
    const icons = {
      AUTH: '🔐',
      DATABASE: '💾',
      VOICE: '🎤',
      KIOSK: '📺',
      API: '🌐',
      MONITORING: '📊',
      PERFORMANCE: '⚡',
      ERROR: '🚨'
    }
    return icons[category] || '📝'
  }

  // 🏗️ Construire un log entry
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: {
      sessionId?: string
      userId?: string
      gymId?: string
    }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: this.config.production ? undefined : data,
      ...context
    }
  }

  // 🖥️ Log vers console (formaté)
  private logToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return

    const color = this.getColorCode(entry.level)
    const icon = this.getIcon(entry.category)
    const reset = this.config.production ? '' : '\x1b[0m'
    
    const prefix = `${color}${icon} [${entry.category}]${reset}`
    const timestamp = this.config.production ? '' : ` ${entry.timestamp.substring(11, 19)}`
    
    const logMessage = `${prefix}${timestamp} ${entry.message}`

    switch (entry.level) {
      case 'debug':
        console.debug(logMessage, entry.data || '')
        break
      case 'info':
        console.log(logMessage, entry.data || '')
        break
      case 'warn':
        console.warn(logMessage, entry.data || '')
        break
      case 'error':
        console.error(logMessage, entry.data || '')
        break
    }
  }

  // 💾 Log vers base de données (si activé)
  private async logToDatabase(entry: LogEntry) {
    if (!this.config.enableDatabase) return

    try {
      // Éviter import circulaire - utiliser fetch vers notre API
      await fetch('/api/internal/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(() => {}) // Fail silently pour éviter loops
    } catch (error) {
      // Ne pas logger les erreurs de logging (loop risk)
    }
  }

  // 🎯 Méthodes publiques de logging
  debug(category: LogCategory, message: string, data?: any, context?: any) {
    const entry = this.createLogEntry('debug', category, message, data, context)
    this.logToConsole(entry)
    this.logToDatabase(entry)
  }

  info(category: LogCategory, message: string, data?: any, context?: any) {
    const entry = this.createLogEntry('info', category, message, data, context)
    this.logToConsole(entry)
    this.logToDatabase(entry)
  }

  warn(category: LogCategory, message: string, data?: any, context?: any) {
    const entry = this.createLogEntry('warn', category, message, data, context)
    this.logToConsole(entry)
    this.logToDatabase(entry)
  }

  error(category: LogCategory, message: string, data?: any, context?: any) {
    const entry = this.createLogEntry('error', category, message, data, context)
    this.logToConsole(entry)
    this.logToDatabase(entry)
  }

  // 🎯 Méthodes spécialisées pour les cas fréquents
  voice(message: string, data?: any, sessionId?: string) {
    this.info('VOICE', message, data, { sessionId })
  }

  auth(message: string, data?: any, userId?: string) {
    this.info('AUTH', message, data, { userId })
  }

  database(message: string, data?: any) {
    this.debug('DATABASE', message, data)
  }

  api(message: string, data?: any) {
    this.info('API', message, data)
  }

  performance(message: string, data?: any) {
    this.debug('PERFORMANCE', message, data)
  }

  // 🚨 Log critique (toujours visible)
  critical(category: LogCategory, message: string, data?: any, context?: any) {
    // Force console même en production pour erreurs critiques
    const originalConsole = this.config.enableConsole
    this.config.enableConsole = true
    
    this.error(category, `🚨 CRITICAL: ${message}`, data, context)
    
    this.config.enableConsole = originalConsole
  }
}

// 🌍 Instance globale
export const logger = new Logger()

// 🔄 Helpers pour migration progressive
export const logVoice = logger.voice.bind(logger)
export const logAuth = logger.auth.bind(logger)
export const logDatabase = logger.database.bind(logger)
export const logApi = logger.api.bind(logger)
export const logPerformance = logger.performance.bind(logger)

// 🧹 Remplacements pour console.log existants
export function cleanLog(category: LogCategory, message: string, data?: any) {
  logger.info(category, message, data)
}

export default logger
