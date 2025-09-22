/**
 * 🔒 Production Logger - Logs conditionnels selon l'environnement
 * Remplace console.log/warn/error par des logs sécurisés
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isClient = typeof window !== 'undefined'

interface LogContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
}

class ProductionLogger {
  /**
   * Log d'information - uniquement en développement
   */
  info(message: string, data?: any, context?: LogContext) {
    if (isDevelopment) {
      console.log(`ℹ️ [INFO]${context?.component ? ` [${context.component}]` : ''} ${message}`, data)
    }
  }

  /**
   * Log d'avertissement - toujours affiché mais sans données sensibles
   */
  warn(message: string, data?: any, context?: LogContext) {
    if (isDevelopment) {
      console.warn(`⚠️ [WARN]${context?.component ? ` [${context.component}]` : ''} ${message}`, data)
    } else {
      // En production, log minimal sans données
      console.warn(`⚠️ ${message}`)
    }
  }

  /**
   * Log d'erreur - toujours affiché mais sanitisé
   */
  error(message: string, error?: any, context?: LogContext) {
    if (isDevelopment) {
      console.error(`🚨 [ERROR]${context?.component ? ` [${context.component}]` : ''} ${message}`, error)
    } else {
      // En production, log sanitisé
      const sanitizedError = error?.message || 'Unknown error'
      console.error(`🚨 ${message}: ${sanitizedError}`)
      
      // Envoyer à Sentry si disponible
      if (isClient && (window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(`${message}: ${sanitizedError}`), {
          tags: {
            component: context?.component,
            action: context?.action
          },
          user: {
            id: context?.userId
          },
          extra: {
            sessionId: context?.sessionId
          }
        })
      }
    }
  }

  /**
   * Log de debug - uniquement en développement
   */
  debug(message: string, data?: any, context?: LogContext) {
    if (isDevelopment) {
      console.debug(`🐛 [DEBUG]${context?.component ? ` [${context.component}]` : ''} ${message}`, data)
    }
  }

  /**
   * Log de succès - uniquement en développement
   */
  success(message: string, data?: any, context?: LogContext) {
    if (isDevelopment) {
      console.log(`✅ [SUCCESS]${context?.component ? ` [${context.component}]` : ''} ${message}`, data)
    }
  }

  /**
   * Log système critique - toujours affiché
   */
  system(message: string, level: 'info' | 'warn' | 'error' = 'info', data?: any) {
    const prefix = level === 'error' ? '🚨' : level === 'warn' ? '⚠️' : 'ℹ️'
    
    if (isDevelopment) {
      console[level](`${prefix} [SYSTEM] ${message}`, data)
    } else {
      // En production, logs système minimaux
      console[level](`${prefix} [SYSTEM] ${message}`)
    }
  }
}

export const logger = new ProductionLogger()

// Exports pour compatibilité
export const log = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const debug = logger.debug.bind(logger)
export const success = logger.success.bind(logger)
export const system = logger.system.bind(logger)


