/**
 * 🔒 STORE SÉCURISÉ POUR CONTEXTE DE SESSION
 * 
 * Remplace global.currentMemberContext avec :
 * - Map avec TTL automatique (nettoyage après 1h)
 * - Pas de fuite mémoire
 * - Thread-safe (pour Node.js)
 * 
 * @version 1.0.0
 */

interface SessionContext {
  member_id: string
  session_id: string
  gym_slug: string
  badge_id: string
  createdAt: number
}

class SessionContextStore {
  private store: Map<string, SessionContext> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly TTL_MS = 60 * 60 * 1000 // 1 heure

  constructor() {
    // Nettoyage automatique toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Stocker contexte pour une session
   */
  set(sessionId: string, context: Omit<SessionContext, 'createdAt'>): void {
    this.store.set(sessionId, {
      ...context,
      createdAt: Date.now()
    })
  }

  /**
   * Récupérer contexte pour une session
   */
  get(sessionId: string): SessionContext | undefined {
    const context = this.store.get(sessionId)
    
    // Vérifier expiration
    if (context && Date.now() - context.createdAt > this.TTL_MS) {
      this.store.delete(sessionId)
      return undefined
    }
    
    return context
  }

  /**
   * Supprimer contexte pour une session
   */
  delete(sessionId: string): void {
    this.store.delete(sessionId)
  }

  /**
   * Nettoyer les contextes expirés
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [sessionId, context] of this.store.entries()) {
      if (now - context.createdAt > this.TTL_MS) {
        this.store.delete(sessionId)
      }
    }
  }

  /**
   * Nettoyer tous les contextes (pour tests)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Arrêter le nettoyage automatique (pour tests)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Singleton global (thread-safe pour Node.js)
export const sessionContextStore = new SessionContextStore()




