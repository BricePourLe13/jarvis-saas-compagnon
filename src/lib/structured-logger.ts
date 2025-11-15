/**
 * ========================================
 * SYSTÈME DE LOGGING STRUCTURÉ PRODUCTION
 * ========================================
 * Remplace les console.log/error dispersés par un système centralisé.
 * 
 * FEATURES:
 * - Logging structuré (JSON en production)
 * - Niveaux de log (debug, info, warn, error, fatal)
 * - Contexte enrichi automatique
 * - Intégration Sentry pour les erreurs
 * - Désactivation automatique en production (sauf erreurs)
 * 
 * MIGRATION:
 * ```typescript
 * // ❌ AVANT
 * console.log('[API] Creating gym:', data)
 * console.error('Error:', error)
 * 
 * // ✅ APRÈS
 * import { logger } from '@/lib/structured-logger'
 * 
 * logger.info('Creating gym', { data })
 * logger.error('Failed to create gym', { error })
 * ```
 */

import * as Sentry from '@sentry/nextjs'
import { env, isProduction, isDevelopment, isVerbose } from './env-validation'

// ========================================
// 1. TYPES
// ========================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  /** Composant/fichier source du log */
  component?: string
  /** ID utilisateur (si applicable) */
  userId?: string
  /** ID gym (si applicable) */
  gymId?: string
  /** ID session (si applicable) */
  sessionId?: string
  /** Métadonnées additionnelles */
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  levelName: string
  message: string
  context?: LogContext
  data?: unknown
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// ========================================
// 2. CONFIGURATION
// ========================================

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.FATAL]: '\x1b[35m', // Magenta
}

const RESET_COLOR = '\x1b[0m'

// Niveau minimum de log en production
const MIN_PRODUCTION_LEVEL = LogLevel.WARN

// ========================================
// 3. CLASSE LOGGER
// ========================================

class StructuredLogger {
  private minLevel: LogLevel

  constructor() {
    // En production: seulement WARN et plus
    // En dev: DEBUG si verbose, sinon INFO
    this.minLevel = isProduction
      ? MIN_PRODUCTION_LEVEL
      : isVerbose
      ? LogLevel.DEBUG
      : LogLevel.INFO
  }

  /**
   * Vérifie si un niveau de log doit être affiché
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  /**
   * Formatte un log entry pour l'affichage
   */
  private formatForConsole(entry: LogEntry): string {
    const color = LOG_LEVEL_COLORS[entry.level]
    const levelName = LOG_LEVEL_NAMES[entry.level].padEnd(5)
    const componentStr = entry.context?.component
      ? ` [${entry.context.component}]`
      : ''

    return `${color}[${levelName}]${RESET_COLOR}${componentStr} ${entry.message}`
  }

  /**
   * Formatte un log entry en JSON pour production
   */
  private formatForProduction(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      levelName: LOG_LEVEL_NAMES[entry.level],
    })
  }

  /**
   * Envoie un log entry à Sentry (erreurs uniquement)
   */
  private sendToSentry(entry: LogEntry): void {
    if (entry.level >= LogLevel.ERROR && entry.error) {
      const errorObj = new Error(entry.error.message)
      errorObj.name = entry.error.name
      if (entry.error.stack) {
        errorObj.stack = entry.error.stack
      }

      Sentry.captureException(errorObj, {
        level: entry.level === LogLevel.FATAL ? 'fatal' : 'error',
        tags: {
          component: entry.context?.component,
          gymId: entry.context?.gymId,
        },
        contexts: {
          additional: entry.context,
        },
        extra: entry.data,
      })
    }
  }

  /**
   * Écrit un log entry
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      context,
      data,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    }

    // Output console
    if (isDevelopment) {
      // Dev: format lisible avec couleurs
      console.log(this.formatForConsole(entry))
      if (data) {
        console.log('  Data:', data)
      }
      if (error) {
        console.error('  Error:', error)
      }
    } else {
      // Production: JSON structuré
      console.log(this.formatForProduction(entry))
    }

    // Envoi Sentry pour erreurs
    if (level >= LogLevel.ERROR) {
      this.sendToSentry(entry)
    }
  }

  /**
   * Log de debug (développement uniquement)
   */
  debug(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, data, context)
  }

  /**
   * Log informatif
   */
  info(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.INFO, message, data, context)
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.WARN, message, data, context)
  }

  /**
   * Log d'erreur (envoyé à Sentry)
   */
  error(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, data, context, error)
  }

  /**
   * Log d'erreur fatale (crash imminent)
   */
  fatal(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, data, context, error)
  }

  /**
   * Crée un logger avec contexte pré-rempli
   */
  withContext(defaultContext: LogContext): ContextLogger {
    return new ContextLogger(this, defaultContext)
  }
}

// ========================================
// 4. LOGGER AVEC CONTEXTE
// ========================================

class ContextLogger {
  constructor(
    private logger: StructuredLogger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context }
  }

  debug(message: string, data?: unknown, context?: LogContext): void {
    this.logger.debug(message, data, this.mergeContext(context))
  }

  info(message: string, data?: unknown, context?: LogContext): void {
    this.logger.info(message, data, this.mergeContext(context))
  }

  warn(message: string, data?: unknown, context?: LogContext): void {
    this.logger.warn(message, data, this.mergeContext(context))
  }

  error(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.logger.error(message, error, data, this.mergeContext(context))
  }

  fatal(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.logger.fatal(message, error, data, this.mergeContext(context))
  }
}

// ========================================
// 5. EXPORT SINGLETON
// ========================================

/**
 * Logger global structuré
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/structured-logger'
 * 
 * // Log simple
 * logger.info('User logged in')
 * 
 * // Log avec données
 * logger.info('Creating gym', { name: 'Fitness Plus' })
 * 
 * // Log avec contexte
 * logger.info('Session started', 
 *   { duration: 120 }, 
 *   { component: 'VoiceAPI', gymId: 'gym-123' }
 * )
 * 
 * // Log d'erreur (envoyé à Sentry)
 * logger.error('Failed to create gym', error, { gymId: 'gym-123' })
 * ```
 */
export const logger = new StructuredLogger()

// ========================================
// 6. HELPERS SPÉCIALISÉS
// ========================================

/**
 * Logger pour les API Routes
 */
export function createApiLogger(route: string) {
  return logger.withContext({ component: `API:${route}` })
}

/**
 * Logger pour les composants React
 */
export function createComponentLogger(componentName: string) {
  return logger.withContext({ component: componentName })
}

/**
 * Logger pour une gym spécifique
 */
export function createGymLogger(gymId: string) {
  return logger.withContext({ gymId })
}

/**
 * Logger pour une session spécifique
 */
export function createSessionLogger(sessionId: string, gymId?: string) {
  return logger.withContext({ sessionId, gymId })
}

// ========================================
// 7. MIGRATION HELPER
// ========================================

/**
 * Wrapper temporaire pour migration progressive
 * À supprimer après migration complète
 * 
 * @deprecated Utiliser `logger` directement
 */
export const console_legacy = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[LEGACY]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    console.error('[LEGACY]', ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn('[LEGACY]', ...args)
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[LEGACY]', ...args)
    }
  },
}

 * ========================================
 * SYSTÈME DE LOGGING STRUCTURÉ PRODUCTION
 * ========================================
 * Remplace les console.log/error dispersés par un système centralisé.
 * 
 * FEATURES:
 * - Logging structuré (JSON en production)
 * - Niveaux de log (debug, info, warn, error, fatal)
 * - Contexte enrichi automatique
 * - Intégration Sentry pour les erreurs
 * - Désactivation automatique en production (sauf erreurs)
 * 
 * MIGRATION:
 * ```typescript
 * // ❌ AVANT
 * console.log('[API] Creating gym:', data)
 * console.error('Error:', error)
 * 
 * // ✅ APRÈS
 * import { logger } from '@/lib/structured-logger'
 * 
 * logger.info('Creating gym', { data })
 * logger.error('Failed to create gym', { error })
 * ```
 */

import * as Sentry from '@sentry/nextjs'
import { env, isProduction, isDevelopment, isVerbose } from './env-validation'

// ========================================
// 1. TYPES
// ========================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  /** Composant/fichier source du log */
  component?: string
  /** ID utilisateur (si applicable) */
  userId?: string
  /** ID gym (si applicable) */
  gymId?: string
  /** ID session (si applicable) */
  sessionId?: string
  /** Métadonnées additionnelles */
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  levelName: string
  message: string
  context?: LogContext
  data?: unknown
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// ========================================
// 2. CONFIGURATION
// ========================================

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.FATAL]: '\x1b[35m', // Magenta
}

const RESET_COLOR = '\x1b[0m'

// Niveau minimum de log en production
const MIN_PRODUCTION_LEVEL = LogLevel.WARN

// ========================================
// 3. CLASSE LOGGER
// ========================================

class StructuredLogger {
  private minLevel: LogLevel

  constructor() {
    // En production: seulement WARN et plus
    // En dev: DEBUG si verbose, sinon INFO
    this.minLevel = isProduction
      ? MIN_PRODUCTION_LEVEL
      : isVerbose
      ? LogLevel.DEBUG
      : LogLevel.INFO
  }

  /**
   * Vérifie si un niveau de log doit être affiché
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  /**
   * Formatte un log entry pour l'affichage
   */
  private formatForConsole(entry: LogEntry): string {
    const color = LOG_LEVEL_COLORS[entry.level]
    const levelName = LOG_LEVEL_NAMES[entry.level].padEnd(5)
    const componentStr = entry.context?.component
      ? ` [${entry.context.component}]`
      : ''

    return `${color}[${levelName}]${RESET_COLOR}${componentStr} ${entry.message}`
  }

  /**
   * Formatte un log entry en JSON pour production
   */
  private formatForProduction(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      levelName: LOG_LEVEL_NAMES[entry.level],
    })
  }

  /**
   * Envoie un log entry à Sentry (erreurs uniquement)
   */
  private sendToSentry(entry: LogEntry): void {
    if (entry.level >= LogLevel.ERROR && entry.error) {
      const errorObj = new Error(entry.error.message)
      errorObj.name = entry.error.name
      if (entry.error.stack) {
        errorObj.stack = entry.error.stack
      }

      Sentry.captureException(errorObj, {
        level: entry.level === LogLevel.FATAL ? 'fatal' : 'error',
        tags: {
          component: entry.context?.component,
          gymId: entry.context?.gymId,
        },
        contexts: {
          additional: entry.context,
        },
        extra: entry.data,
      })
    }
  }

  /**
   * Écrit un log entry
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      context,
      data,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    }

    // Output console
    if (isDevelopment) {
      // Dev: format lisible avec couleurs
      console.log(this.formatForConsole(entry))
      if (data) {
        console.log('  Data:', data)
      }
      if (error) {
        console.error('  Error:', error)
      }
    } else {
      // Production: JSON structuré
      console.log(this.formatForProduction(entry))
    }

    // Envoi Sentry pour erreurs
    if (level >= LogLevel.ERROR) {
      this.sendToSentry(entry)
    }
  }

  /**
   * Log de debug (développement uniquement)
   */
  debug(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, data, context)
  }

  /**
   * Log informatif
   */
  info(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.INFO, message, data, context)
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.WARN, message, data, context)
  }

  /**
   * Log d'erreur (envoyé à Sentry)
   */
  error(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, data, context, error)
  }

  /**
   * Log d'erreur fatale (crash imminent)
   */
  fatal(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, data, context, error)
  }

  /**
   * Crée un logger avec contexte pré-rempli
   */
  withContext(defaultContext: LogContext): ContextLogger {
    return new ContextLogger(this, defaultContext)
  }
}

// ========================================
// 4. LOGGER AVEC CONTEXTE
// ========================================

class ContextLogger {
  constructor(
    private logger: StructuredLogger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context }
  }

  debug(message: string, data?: unknown, context?: LogContext): void {
    this.logger.debug(message, data, this.mergeContext(context))
  }

  info(message: string, data?: unknown, context?: LogContext): void {
    this.logger.info(message, data, this.mergeContext(context))
  }

  warn(message: string, data?: unknown, context?: LogContext): void {
    this.logger.warn(message, data, this.mergeContext(context))
  }

  error(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.logger.error(message, error, data, this.mergeContext(context))
  }

  fatal(message: string, error?: Error, data?: unknown, context?: LogContext): void {
    this.logger.fatal(message, error, data, this.mergeContext(context))
  }
}

// ========================================
// 5. EXPORT SINGLETON
// ========================================

/**
 * Logger global structuré
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/structured-logger'
 * 
 * // Log simple
 * logger.info('User logged in')
 * 
 * // Log avec données
 * logger.info('Creating gym', { name: 'Fitness Plus' })
 * 
 * // Log avec contexte
 * logger.info('Session started', 
 *   { duration: 120 }, 
 *   { component: 'VoiceAPI', gymId: 'gym-123' }
 * )
 * 
 * // Log d'erreur (envoyé à Sentry)
 * logger.error('Failed to create gym', error, { gymId: 'gym-123' })
 * ```
 */
export const logger = new StructuredLogger()

// ========================================
// 6. HELPERS SPÉCIALISÉS
// ========================================

/**
 * Logger pour les API Routes
 */
export function createApiLogger(route: string) {
  return logger.withContext({ component: `API:${route}` })
}

/**
 * Logger pour les composants React
 */
export function createComponentLogger(componentName: string) {
  return logger.withContext({ component: componentName })
}

/**
 * Logger pour une gym spécifique
 */
export function createGymLogger(gymId: string) {
  return logger.withContext({ gymId })
}

/**
 * Logger pour une session spécifique
 */
export function createSessionLogger(sessionId: string, gymId?: string) {
  return logger.withContext({ sessionId, gymId })
}

// ========================================
// 7. MIGRATION HELPER
// ========================================

/**
 * Wrapper temporaire pour migration progressive
 * À supprimer après migration complète
 * 
 * @deprecated Utiliser `logger` directement
 */
export const console_legacy = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[LEGACY]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    console.error('[LEGACY]', ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn('[LEGACY]', ...args)
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[LEGACY]', ...args)
    }
  },
}

