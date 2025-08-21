/**
 * 🛡️ GESTIONNAIRE D'ERREURS CENTRALISÉ
 * 
 * Gestion propre et cohérente des erreurs à travers l'app
 */

import { NextResponse } from 'next/server'

// 📊 Types d'erreurs standardisés
export type ErrorType = 
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_ERROR'

// 🎯 Interface d'erreur standardisée
export interface ApiError {
  type: ErrorType
  message: string
  details?: any
  code?: string
  timestamp: string
}

// 📝 Messages d'erreur user-friendly
const ERROR_MESSAGES: Record<ErrorType, string> = {
  AUTH_ERROR: 'Authentification requise. Veuillez vous reconnecter.',
  VALIDATION_ERROR: 'Les données fournies ne sont pas valides.',
  NOT_FOUND: 'La ressource demandée n\'a pas été trouvée.',
  PERMISSION_DENIED: 'Vous n\'avez pas les permissions nécessaires.',
  DATABASE_ERROR: 'Erreur de base de données. Veuillez réessayer.',
  EXTERNAL_API_ERROR: 'Service externe temporairement indisponible.',
  INTERNAL_ERROR: 'Erreur interne du serveur. Veuillez contacter le support.'
}

// 🔄 Codes de statut HTTP
const STATUS_CODES: Record<ErrorType, number> = {
  AUTH_ERROR: 401,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  PERMISSION_DENIED: 403,
  DATABASE_ERROR: 500,
  EXTERNAL_API_ERROR: 502,
  INTERNAL_ERROR: 500
}

/**
 * 🏗️ Créer une réponse d'erreur standardisée
 */
export function createErrorResponse(
  type: ErrorType,
  customMessage?: string,
  details?: any
): NextResponse {
  const error: ApiError = {
    type,
    message: customMessage || ERROR_MESSAGES[type],
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString()
  }

  // 📊 Log pour monitoring
  if (type === 'INTERNAL_ERROR' || type === 'DATABASE_ERROR') {
    console.error(`🚨 [${type}]`, error.message, details)
  } else {
    console.warn(`⚠️ [${type}]`, error.message)
  }

  return NextResponse.json(
    { success: false, error },
    { status: STATUS_CODES[type] }
  )
}

/**
 * 🎯 Gestionnaire d'erreurs Supabase
 */
export function handleSupabaseError(error: any, context?: string) {
  console.error(`💾 [SUPABASE ERROR${context ? ' - ' + context : ''}]`, error)

  // Erreurs spécifiques Supabase
  if (error.code === '42501') {
    return createErrorResponse(
      'PERMISSION_DENIED',
      'Permissions insuffisantes pour cette opération'
    )
  }

  if (error.code === '23505') {
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Cette donnée existe déjà'
    )
  }

  if (error.code === '23503') {
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Référence vers un élément inexistant'
    )
  }

  if (error.code === 'PGRST116') {
    return createErrorResponse(
      'NOT_FOUND',
      'Aucun résultat trouvé'
    )
  }

  // Erreur générique BDD
  return createErrorResponse(
    'DATABASE_ERROR',
    'Erreur lors de l\'accès aux données',
    { supabaseCode: error.code, supabaseMessage: error.message }
  )
}

/**
 * 🔐 Gestionnaire d'erreurs d'authentification
 */
export function handleAuthError(error: any) {
  if (error.message?.includes('JWT')) {
    return createErrorResponse(
      'AUTH_ERROR',
      'Session expirée. Veuillez vous reconnecter.'
    )
  }

  return createErrorResponse(
    'AUTH_ERROR',
    'Authentification échouée'
  )
}

/**
 * 🧪 Wrapper pour fonctions API avec gestion d'erreurs
 */
export function withErrorHandler(
  handler: (request: any, params?: any) => Promise<NextResponse>
) {
  return async (request: any, params?: any): Promise<NextResponse> => {
    try {
      return await handler(request, params)
    } catch (error: any) {
      console.error('🚨 [API ERROR]', error)

      // Erreurs connues
      if (error.name === 'SupabaseError' || error.code) {
        return handleSupabaseError(error)
      }

      if (error.name === 'AuthError') {
        return handleAuthError(error)
      }

      if (error.name === 'ValidationError') {
        return createErrorResponse(
          'VALIDATION_ERROR',
          error.message
        )
      }

      // Erreur inconnue
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Une erreur inattendue s\'est produite',
        { originalError: error.message, stack: error.stack }
      )
    }
  }
}

/**
 * ✅ Réponse de succès standardisée
 */
export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  })
}
