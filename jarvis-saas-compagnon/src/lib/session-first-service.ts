/**
 * 🚀 SESSION-FIRST SERVICE - Élimination Race Conditions
 * 
 * PROBLÈME ACTUEL:
 * 1. Session OpenAI créée → sess_xxx
 * 2. Audio events déclenchés IMMÉDIATEMENT
 * 3. Instrumentation cherche session en DB → INTROUVABLE (406 error)
 * 4. Session DB créée PLUS TARD lors finalizeSessionTracking
 * 
 * SOLUTION:
 * Pattern "Session-First" - Créer DB record AVANT OpenAI session
 */

import { getSupabaseSingleton } from './supabase-singleton'

export interface SessionFirstData {
  sessionId: string
  gymId: string
  gymSlug: string
  franchiseId?: string
  memberData?: {
    first_name: string
    last_name: string
    badge_id?: string
  }
}

export interface PreCreatedSession {
  dbSessionId: string // notre ID interne
  openaiSessionId?: string // sera rempli après création OpenAI
  isReady: boolean
}

/**
 * 🎯 Service Session-First Enterprise
 */
export class SessionFirstService {
  private static instance: SessionFirstService
  private pendingSessions = new Map<string, PreCreatedSession>()

  static getInstance(): SessionFirstService {
    if (!SessionFirstService.instance) {
      SessionFirstService.instance = new SessionFirstService()
    }
    return SessionFirstService.instance
  }

  /**
   * 🚀 ÉTAPE 1: Pré-créer session en DB AVANT OpenAI
   */
  async createSessionRecord(data: SessionFirstData): Promise<PreCreatedSession> {
    const supabase = getSupabaseSingleton()
    const dbSessionId = `jarvis_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    console.log('📊 [SESSION-FIRST] Création record DB en premier:', dbSessionId)

    try {
      // Insérer session record avec colonnes minimales
      const { data: sessionRecord, error } = await supabase
        .from('openai_realtime_sessions')
        .insert({
          session_id: dbSessionId, // Notre ID unique
          gym_id: data.gymId,
          kiosk_slug: data.gymSlug,
          session_started_at: new Date().toISOString(),
          // Colonnes de base avec valeurs par défaut
          total_input_tokens: 0,
          total_output_tokens: 0,
          total_input_audio_tokens: 0,
          total_output_audio_tokens: 0,
          total_user_turns: 0,
          total_ai_turns: 0,
          total_interruptions: 0,
          total_cost_usd: 0,
          // Métadonnées membre si disponibles
          member_name: data.memberData ? 
            `${data.memberData.first_name} ${data.memberData.last_name}` : null,
          member_badge_id: data.memberData?.badge_id || null,
          // Statut initial
          session_metadata: {
            status: 'initializing',
            created_by: 'session_first_service',
            franchise_id: data.franchiseId
          }
        })
        .select()
        .single()

      if (error) {
        console.error('❌ [SESSION-FIRST] Erreur création DB:', error)
        throw new Error(`Échec création session DB: ${error.message}`)
      }

      const preSession: PreCreatedSession = {
        dbSessionId,
        isReady: true
      }

      // Mémoriser session en attente
      this.pendingSessions.set(dbSessionId, preSession)
      
      console.log('✅ [SESSION-FIRST] Session DB créée:', sessionRecord)
      return preSession

    } catch (error) {
      console.error('💥 [SESSION-FIRST] Erreur fatale:', error)
      throw error
    }
  }

  /**
   * 🔗 ÉTAPE 2: Lier OpenAI session ID au record DB
   */
  async linkOpenAISession(dbSessionId: string, openaiSessionId: string): Promise<void> {
    const supabase = getSupabaseSingleton()

    console.log('🔗 [SESSION-FIRST] Liaison OpenAI:', { dbSessionId, openaiSessionId })

    try {
      const { error } = await supabase
        .from('openai_realtime_sessions')
        .update({
          session_metadata: {
            status: 'active',
            openai_session_id: openaiSessionId,
            linked_at: new Date().toISOString()
          }
        })
        .eq('session_id', dbSessionId)

      if (error) {
        console.error('❌ [SESSION-FIRST] Erreur liaison OpenAI:', error)
        throw error
      }

      // Mettre à jour cache local
      const pending = this.pendingSessions.get(dbSessionId)
      if (pending) {
        pending.openaiSessionId = openaiSessionId
        this.pendingSessions.set(dbSessionId, pending)
      }

      console.log('✅ [SESSION-FIRST] Liaison OpenAI réussie')

    } catch (error) {
      console.error('💥 [SESSION-FIRST] Erreur liaison:', error)
      throw error
    }
  }

  /**
   * 🔍 ÉTAPE 3: Résoudre session DB depuis OpenAI session ID
   */
  async resolveSessionByOpenAI(openaiSessionId: string): Promise<string | null> {
    // 1. Chercher dans cache local d'abord
    for (const [dbId, session] of this.pendingSessions.entries()) {
      if (session.openaiSessionId === openaiSessionId) {
        console.log('🎯 [SESSION-FIRST] Session trouvée en cache:', dbId)
        return dbId
      }
    }

    // 2. Fallback vers DB
    const supabase = getSupabaseSingleton()
    
    try {
      const { data, error } = await supabase
        .from('openai_realtime_sessions')
        .select('session_id')
        .contains('session_metadata', { openai_session_id: openaiSessionId })
        .single()

      if (error || !data) {
        console.warn('⚠️ [SESSION-FIRST] Session OpenAI non trouvée en DB:', openaiSessionId)
        return null
      }

      console.log('🎯 [SESSION-FIRST] Session trouvée en DB:', data.session_id)
      return data.session_id

    } catch (error) {
      console.error('💥 [SESSION-FIRST] Erreur résolution:', error)
      return null
    }
  }

  /**
   * 🧹 Nettoyer session terminée
   */
  cleanup(dbSessionId: string): void {
    this.pendingSessions.delete(dbSessionId)
    console.log('🧹 [SESSION-FIRST] Nettoyage session:', dbSessionId)
  }

  /**
   * 📊 Statistiques debug
   */
  getStats(): { pending: number, sessions: string[] } {
    return {
      pending: this.pendingSessions.size,
      sessions: Array.from(this.pendingSessions.keys())
    }
  }
}

/**
 * 🎯 Instance singleton
 */
export const sessionFirstService = SessionFirstService.getInstance()

/**
 * 🔧 Utilitaires pour migration progressive
 */
export interface SessionMigrationHelper {
  // Pour compatibilité avec code existant
  adaptToExistingFlow(legacySessionId: string): Promise<PreCreatedSession>
  
  // Pour debug et monitoring
  validateSessionIntegrity(dbSessionId: string): Promise<boolean>
}

/**
 * 📋 Interface pour intégration avec useVoiceChat
 */
export interface VoiceChatIntegration {
  // Remplacement de initializeSessionTracking
  createSessionFirst(data: SessionFirstData): Promise<PreCreatedSession>
  
  // Remplacement partiel de createSession
  linkWithOpenAI(dbSessionId: string, openaiSession: any): Promise<void>
  
  // Remplacement de recordAudioEvent
  recordEventWithSession(dbSessionId: string, event: any): Promise<void>
}