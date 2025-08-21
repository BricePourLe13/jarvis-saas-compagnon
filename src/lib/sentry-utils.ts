import * as Sentry from '@sentry/nextjs';

/**
 * 🔍 SENTRY UTILITIES - Monitoring Serverless
 * Utilitaires pour capturer les erreurs dans un environnement serverless
 */

export interface ErrorContext {
  userId?: string;
  gymId?: string;
  sessionId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Capture une erreur avec contexte enrichi
 */
export function captureError(error: Error, context?: ErrorContext) {
  Sentry.withScope((scope) => {
    // Ajouter le contexte utilisateur
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    // Ajouter des tags pour filtrage
    if (context?.gymId) {
      scope.setTag('gym_id', context.gymId);
    }
    
    if (context?.endpoint) {
      scope.setTag('endpoint', context.endpoint);
    }

    // Ajouter contexte supplémentaire
    scope.setContext('request_info', {
      userAgent: context?.userAgent,
      ip: context?.ip,
      sessionId: context?.sessionId,
    });

    // Capturer l'erreur
    Sentry.captureException(error);
  });
}

/**
 * Capture un message d'information
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context?.gymId) {
      scope.setTag('gym_id', context.gymId);
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Wrapper pour les API routes avec monitoring automatique
 */
export function withSentryApiRoute<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  routeName: string
) {
  return async (...args: T): Promise<R> => {
    const transaction = Sentry.startTransaction({
      name: routeName,
      op: 'api.route',
    });

    try {
      const result = await handler(...args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      
      captureError(error as Error, {
        endpoint: routeName,
      });
      
      throw error;
    } finally {
      transaction.finish();
    }
  };
}

/**
 * Monitor les performances des requêtes Supabase
 */
export function monitorSupabaseQuery(queryName: string) {
  return Sentry.startTransaction({
    name: `supabase.${queryName}`,
    op: 'db.query',
  });
}

/**
 * Monitor les appels OpenAI
 */
export function monitorOpenAICall(operation: string) {
  return Sentry.startTransaction({
    name: `openai.${operation}`,
    op: 'ai.request',
  });
}

