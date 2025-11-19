/**
 * 🏭 FACTORIES DE SESSIONS VOCALES
 * 
 * Séparation de la logique de création de session (kiosk vs vitrine)
 * du code WebRTC commun
 * 
 * @version 1.0.0
 * @date 2025-01-XX
 */

import { VoiceSession, VoiceSessionFactory } from './types'

/**
 * Factory pour sessions Kiosk (Production)
 * 
 * Crée une session avec authentification membre, RAG context, etc.
 */
export class KioskSessionFactory implements VoiceSessionFactory {
  constructor(
    private gymSlug: string,
    private badgeId: string,
    private language: string = 'fr'
  ) {}

  async createSession(): Promise<VoiceSession> {
    const response = await fetch('/api/voice/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymSlug: this.gymSlug,
        badge_id: this.badgeId,
        language: this.language
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Session creation failed: ${response.status} - ${errorData}`)
    }

    const responseData = await response.json()
    // L'API retourne { success: true, session: {...} }
    const session = responseData.session || responseData
    
    return {
      client_secret: session.client_secret || { value: session.client_secret },
      session_id: session.session_id,
      expires_at: session.expires_at
    }
  }
}






