/**
 * 🔄 RETRY UTILITY POUR OPENAI API
 * 
 * Retry automatique avec backoff exponentiel pour appels OpenAI
 * Gère les erreurs temporaires (429, 503, 502, 500)
 * 
 * @version 1.0.0
 */

interface RetryConfig {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableStatuses?: number[]
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 seconde
  maxDelayMs: 10000, // 10 secondes max
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503, 504] // Rate limit + erreurs serveur
}

/**
 * Retry avec backoff exponentiel
 * 
 * @param fn Fonction à exécuter (doit retourner une Promise)
 * @param config Configuration du retry
 * @returns Résultat de la fonction
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | null = null
  let delay = finalConfig.initialDelayMs

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Vérifier si l'erreur est retryable
      const statusCode = error.status || error.statusCode || error.response?.status
      const isRetryable = 
        statusCode && finalConfig.retryableStatuses.includes(statusCode) ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('network')

      // Dernière tentative ou erreur non retryable
      if (attempt === finalConfig.maxRetries || !isRetryable) {
        throw error
      }

      // Calculer délai avec backoff exponentiel
      const waitTime = Math.min(delay, finalConfig.maxDelayMs)
      console.log(`🔄 [Retry] Tentative ${attempt + 1}/${finalConfig.maxRetries + 1} après ${waitTime}ms (status: ${statusCode})`)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
      delay *= finalConfig.backoffMultiplier
    }
  }

  throw lastError || new Error('Retry échoué')
}

/**
 * Wrapper pour fetch avec retry automatique
 * 
 * @param url URL à appeler
 * @param options Options fetch
 * @param retryConfig Configuration retry
 * @returns Response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options)
    
    // Si erreur HTTP, throw pour déclencher retry
    if (!response.ok && retryConfig.retryableStatuses?.includes(response.status)) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.response = response
      throw error
    }
    
    return response
  }, retryConfig)
}




