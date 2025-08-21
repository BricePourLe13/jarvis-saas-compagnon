// 🛡️ Rate Limiter pour la protection API
import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now()
    const userLimit = this.store[identifier]

    // Si pas d'entrée ou fenêtre expirée, créer/reset
    if (!userLimit || now > userLimit.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      }
      return { 
        allowed: true, 
        resetTime: this.store[identifier].resetTime,
        remaining: this.maxRequests - 1
      }
    }

    // Incrémenter le compteur
    userLimit.count++

    // Vérifier si limite atteinte
    if (userLimit.count > this.maxRequests) {
      return { 
        allowed: false, 
        resetTime: userLimit.resetTime,
        remaining: 0
      }
    }

    return { 
      allowed: true, 
      resetTime: userLimit.resetTime,
      remaining: this.maxRequests - userLimit.count
    }
  }

  // Nettoyage périodique des entrées expirées
  cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key]
      }
    })
  }
}

// Instances pour différents endpoints
export const apiLimiter = new RateLimiter(60000, 100) // 100 req/min pour API
export const authLimiter = new RateLimiter(900000, 5) // 5 req/15min pour auth
export const adminLimiter = new RateLimiter(60000, 50) // 50 req/min pour admin

// Utilitaire pour extraire l'identifiant client
export function getClientIdentifier(request: NextRequest): string {
  // Priorité: Header X-Forwarded-For (Vercel) > IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return ip
}

// Middleware helper pour les API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  limiter: RateLimiter = apiLimiter
) {
  return async (request: NextRequest): Promise<Response> => {
    const identifier = getClientIdentifier(request)
    const { allowed, resetTime, remaining } = limiter.isAllowed(identifier)

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime: resetTime,
          message: 'Trop de requêtes. Veuillez réessayer plus tard.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limiter['maxRequests'].toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime?.toString() || '',
            'Retry-After': Math.ceil((resetTime! - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Ajouter headers de rate limit à la réponse
    const response = await handler(request)
    response.headers.set('X-RateLimit-Limit', limiter['maxRequests'].toString())
    response.headers.set('X-RateLimit-Remaining', remaining?.toString() || '0')
    response.headers.set('X-RateLimit-Reset', resetTime?.toString() || '')

    return response
  }
}

// Nettoyage automatique toutes les heures
if (typeof window === 'undefined') {
  setInterval(() => {
    apiLimiter.cleanup()
    authLimiter.cleanup()
    adminLimiter.cleanup()
  }, 3600000) // 1 heure
}
