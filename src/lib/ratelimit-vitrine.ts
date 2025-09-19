// Simple in-memory rate limiter pour la vitrine
// Note: En production, utilisez Redis/Upstash pour une solution distribuée

interface RateLimitEntry {
  count: number
  resetTime: number
}

class SimpleRateLimit {
  private storage = new Map<string, RateLimitEntry>()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    
    // Nettoyage périodique
    setInterval(() => this.cleanup(), windowMs / 2)
  }

  async limit(identifier: string) {
    const now = Date.now()
    const entry = this.storage.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Nouvelle fenêtre ou première requête
      this.storage.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: new Date(now + this.windowMs)
      }
    }

    if (entry.count >= this.maxRequests) {
      // Limite atteinte
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: new Date(entry.resetTime)
      }
    }

    // Incrémenter le compteur
    entry.count++
    this.storage.set(identifier, entry)

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: new Date(entry.resetTime)
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key)
      }
    }
  }
}

// Rate limiter pour les démos vocales vitrine
// 3 essais par heure par IP pour éviter l'abus tout en permettant de tester
export const ratelimitVitrineVoice = new SimpleRateLimit(3, 60 * 60 * 1000) // 3 req/hour

// Rate limiter général pour les API vitrine
export const ratelimitVitrineGeneral = new SimpleRateLimit(10, 60 * 1000) // 10 req/min
