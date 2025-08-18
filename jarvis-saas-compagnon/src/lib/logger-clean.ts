/**
 * 🧹 JARVIS CLEAN LOGGER
 * 
 * Version épurée, lisible, professionnelle
 * Fini le bordel de logs !
 */

// 📊 Niveaux de logs clairs
export enum LogLevel {
  ERROR = '❌',
  WARN = '⚠️', 
  INFO = '✅',
  DEBUG = '🔍',
  SESSION = '🎯',
  VOICE = '🎤',
  DATA = '📊'
}

// 🎯 Interface de log structuré
interface CleanLogEntry {
  level: LogLevel
  category: string
  message: string
  data?: any
  sessionId?: string
}

class CleanLogger {
  private static instance: CleanLogger
  private isDev = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  static getInstance(): CleanLogger {
    if (!CleanLogger.instance) {
      CleanLogger.instance = new CleanLogger()
    }
    return CleanLogger.instance
  }

  /**
   * 🎯 Log principal - format unifié
   */
  private log(entry: CleanLogEntry) {
    const timestamp = new Date().toISOString().substr(11, 8) // HH:MM:SS
    const prefix = `${entry.level} [${entry.category.toUpperCase()}]`
    
    // 📱 Production : logs essentiels seulement
    if (this.isProduction && entry.level === LogLevel.DEBUG) {
      return
    }

    // 💻 Dev : tous les logs
    console.log(`${timestamp} ${prefix} ${entry.message}`)
    
    if (entry.data && this.isDev) {
      console.log(`   └─ Data:`, entry.data)
    }
    
    if (entry.sessionId) {
      console.log(`   └─ Session: ${entry.sessionId.substr(-8)}`) // 8 derniers chars
    }
  }

  // 🎯 Methods spécialisées par domaine
  session(message: string, sessionId?: string, data?: any) {
    this.log({ level: LogLevel.SESSION, category: 'session', message, sessionId, data })
  }

  voice(message: string, sessionId?: string, data?: any) {
    this.log({ level: LogLevel.VOICE, category: 'voice', message, sessionId, data })
  }

  database(message: string, data?: any) {
    this.log({ level: LogLevel.DATA, category: 'database', message, data })
  }

  error(message: string, error?: any) {
    this.log({ level: LogLevel.ERROR, category: 'error', message, data: error })
  }

  success(message: string, data?: any) {
    this.log({ level: LogLevel.INFO, category: 'success', message, data })
  }

  debug(message: string, data?: any) {
    this.log({ level: LogLevel.DEBUG, category: 'debug', message, data })
  }

  warn(message: string, data?: any) {
    this.log({ level: LogLevel.WARN, category: 'warning', message, data })
  }

  /**
   * 📝 Log spécialisé pour conversations JARVIS
   */
  conversation(speaker: 'user' | 'jarvis', message: string, sessionId: string, turn: number) {
    const emoji = speaker === 'user' ? '👤' : '🤖'
    const name = speaker === 'user' ? 'USER' : 'JARVIS'
    
    this.log({
      level: LogLevel.SESSION,
      category: 'conversation',
      message: `${emoji} ${name} (T${turn}): "${message.substr(0, 50)}${message.length > 50 ? '...' : ''}"`,
      sessionId
    })
  }

  /**
   * 🎯 Log de session lifecycle
   */
  sessionStart(sessionId: string, member: string) {
    this.session(`🚀 Session démarrée pour ${member}`, sessionId)
  }

  sessionEnd(sessionId: string, reason: string) {
    this.session(`🏁 Session fermée: ${reason}`, sessionId)
  }

  /**
   * 🔧 Remplacer tous les console.log existants
   */
  static replace() {
    const clean = CleanLogger.getInstance()
    
    // Override console methods
    const originalLog = console.log
    console.log = (...args) => {
      const message = args.join(' ')
      
      // Identifier le type de log ancien
      if (message.includes('❌')) {
        clean.error(message.replace('❌', '').trim())
      } else if (message.includes('✅')) {
        clean.success(message.replace('✅', '').trim())
      } else if (message.includes('🎯')) {
        clean.session(message.replace('🎯', '').trim())
      } else if (message.includes('🎤')) {
        clean.voice(message.replace('🎤', '').trim())
      } else {
        // Log générique
        originalLog(...args)
      }
    }
  }
}

export const cleanLogger = CleanLogger.getInstance()
