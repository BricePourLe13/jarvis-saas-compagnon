/**
 * 🚦 Rate Limiter Simple - Protection basique sans dépendance externe
 * Utilise Map en mémoire pour les limites de taux
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class SimpleRateLimiter {
  private requests = new Map<string, RateLimitEntry>()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Nettoyage périodique des entrées expirées
    setInterval(() => this.cleanup(), windowMs)
  }

  /**
   * Vérifier si une requête est autorisée
   */
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    // Première requête ou fenêtre expirée
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      }
    }

    // Incrémenter le compteur
    entry.count++

    // Vérifier la limite
    if (entry.count > this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    return {
      activeEntries: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    }
  }
}

// Instances pour différents types de requêtes
export const apiRateLimiter = new SimpleRateLimiter(60000, 100) // 100 req/min pour API
export const voiceRateLimiter = new SimpleRateLimiter(60000, 30) // 30 req/min pour voice
export const authRateLimiter = new SimpleRateLimiter(900000, 5) // 5 req/15min pour auth

/**
 * Utilitaire pour obtenir un identifiant de client
 */
export function getClientIdentifier(request: Request): string {
  // Essayer d'obtenir l'IP réelle
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Ajouter User-Agent pour plus de précision
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = btoa(userAgent).slice(0, 8)
  
  return `${ip}-${userAgentHash}`
}


