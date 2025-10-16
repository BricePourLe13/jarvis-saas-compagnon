import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface VitrineLimiterConfig {
  maxDailyCredits: number        // Crédits quotidiens (1 crédit = 1 minute)
  maxTotalCredits: number        // Crédits totaux (lifetime)
  creditValue: number            // Valeur d'un crédit en minutes
  blockAfterExcessive: boolean
  allowOnError: boolean          // ❌ FAIL SAFE : Bloquer en cas d'erreur (false)
}

const DEFAULT_CONFIG: VitrineLimiterConfig = {
  maxDailyCredits: 5,            // ✅ 5 minutes par jour (augmenté de 3)
  maxTotalCredits: 15,           // ✅ 15 minutes au total (augmenté de 10)
  creditValue: 1,                // 1 crédit = 1 minute
  blockAfterExcessive: true,
  allowOnError: false            // 🔒 FAIL SAFE : Bloquer en cas d'erreur
}

export interface VitrineLimiterResult {
  allowed: boolean
  reason?: string
  remainingCredits: number       // Crédits restants (en minutes)
  resetTime?: Date
  isBlocked: boolean
  hasActiveSession?: boolean     // Session déjà active
}

export class VitrineIPLimiter {
  private config: VitrineLimiterConfig

  constructor(config: Partial<VitrineLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async checkAndUpdateLimit(
    ipAddress: string, 
    userAgent?: string
  ): Promise<VitrineLimiterResult> {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      
      // 1. Récupérer ou créer l'entrée pour cette IP
      let { data: sessionData, error } = await supabase
        .from('vitrine_demo_sessions')
        .select('*')
        .eq('ip_address', ipAddress)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = pas de résultat
        console.error('❌ Erreur Supabase vitrine limiter:', error)
        // 🔒 FAIL SAFE : Bloquer en cas d'erreur au lieu d'autoriser
        return { 
          allowed: this.config.allowOnError, 
          reason: 'Erreur système, veuillez réessayer',
          remainingCredits: 0, 
          isBlocked: false 
        }
      }

      const now = new Date()

      if (!sessionData) {
        // Première visite : créer une nouvelle entrée
        const { error: insertError } = await supabase
          .from('vitrine_demo_sessions')
          .insert({
            ip_address: ipAddress,
            session_count: 1,
            daily_session_count: 1,
            daily_reset_date: today,
            user_agent: userAgent,
            first_session_at: now.toISOString(),
            last_session_at: now.toISOString(),
            total_duration_seconds: 0,
            is_session_active: true // ✅ Initialiser comme active
          })

        if (insertError) {
          console.error('❌ Erreur insertion vitrine session:', insertError)
          // 🔒 FAIL SAFE : Bloquer en cas d'erreur
          return { 
            allowed: this.config.allowOnError,
            reason: 'Erreur création session',
            remainingCredits: 0, 
            isBlocked: false 
          }
        }

        return {
          allowed: true,
          remainingCredits: this.config.maxDailyCredits - 1,
          isBlocked: false
        }
      }

      // 2. Vérifier si l'IP est bloquée
      if (sessionData.blocked) {
        return {
          allowed: false,
          reason: sessionData.blocked_reason || 'IP bloquée pour usage excessif',
          remainingCredits: 0,
          isBlocked: true
        }
      }

      // 3. 🔒 NOUVEAU : Vérifier si une session est déjà active (anti multi-onglets)
      if (sessionData.is_session_active) {
        const lastSession = new Date(sessionData.last_session_at)
        const timeSinceLastSession = (now.getTime() - lastSession.getTime()) / 1000 // secondes
        
        // ✅ FIX : Réduire timeout à 30s (au lieu de 5 min) pour permettre reconnexion rapide
        // + Vérifier flag is_session_active
        if (timeSinceLastSession < 30) {
          return {
            allowed: false,
            reason: 'Session déjà active. Fermez les autres onglets.',
            remainingCredits: 0,
            isBlocked: false,
            hasActiveSession: true
          }
        } else {
          // Timeout dépassé : réinitialiser le flag
          await supabase
            .from('vitrine_demo_sessions')
            .update({ is_session_active: false })
            .eq('ip_address', ipAddress)
        }
      }

      // 4. Reset quotidien si nécessaire
      let dailyDurationSeconds = sessionData.total_duration_seconds || 0
      if (sessionData.daily_reset_date !== today) {
        dailyDurationSeconds = 0 // Reset du compteur quotidien
      }

      // Convertir en crédits (1 crédit = 60 secondes)
      const dailyCreditsUsed = Math.ceil(dailyDurationSeconds / 60)
      const totalCreditsUsed = Math.ceil((sessionData.total_duration_seconds || 0) / 60)
      
      // 5. Vérifier les limites de crédits
      
      // Limite quotidienne
      if (dailyCreditsUsed >= this.config.maxDailyCredits) {
        const resetTime = new Date()
        resetTime.setDate(resetTime.getDate() + 1)
        resetTime.setHours(0, 0, 0, 0)
        
        return {
          allowed: false,
          reason: `Limite quotidienne atteinte (${this.config.maxDailyCredits} minutes/jour)`,
          remainingCredits: 0,
          resetTime,
          isBlocked: false
        }
      }

      // Limite totale
      if (totalCreditsUsed >= this.config.maxTotalCredits) {
        // Bloquer définitivement si configuré
        if (this.config.blockAfterExcessive) {
          await supabase
            .from('vitrine_demo_sessions')
            .update({
              blocked: true,
              blocked_reason: `Dépassement limite totale (${this.config.maxTotalCredits} minutes)`
            })
            .eq('ip_address', ipAddress)
        }

        return {
          allowed: false,
          reason: `Limite totale atteinte (${this.config.maxTotalCredits} minutes)`,
          remainingCredits: 0,
          isBlocked: this.config.blockAfterExcessive
        }
      }

      // 6. Mettre à jour pour marquer session active
      const newTotalCount = (sessionData.session_count || 0) + 1

      const { error: updateError } = await supabase
        .from('vitrine_demo_sessions')
        .update({
          session_count: newTotalCount,
          daily_session_count: (sessionData.daily_session_count || 0) + 1,
          daily_reset_date: today,
          last_session_at: now.toISOString(),
          is_session_active: true, // ✅ FIX : Marquer comme active
          user_agent: userAgent,
          updated_at: now.toISOString()
        })
        .eq('ip_address', ipAddress)

      if (updateError) {
        console.error('❌ Erreur mise à jour vitrine session:', updateError)
        // 🔒 FAIL SAFE
        return { 
          allowed: this.config.allowOnError,
          reason: 'Erreur mise à jour session',
          remainingCredits: 0, 
          isBlocked: false 
        }
      }

      return {
        allowed: true,
        remainingCredits: this.config.maxDailyCredits - dailyCreditsUsed,
        isBlocked: false
      }

    } catch (error) {
      console.error('❌ Erreur vitrine IP limiter:', error)
      // 🔒 FAIL SAFE : En cas d'erreur, on BLOQUE (sécurité)
      return { 
        allowed: this.config.allowOnError, 
        reason: 'Erreur système, veuillez réessayer dans quelques instants',
        remainingCredits: 0, 
        isBlocked: false 
      }
    }
  }

  /**
   * 🔒 NOUVEAU : Marquer la fin d'une session et comptabiliser le temps utilisé
   */
  async endSession(ipAddress: string, durationSeconds: number): Promise<boolean> {
    try {
      const { data: sessionData } = await supabase
        .from('vitrine_demo_sessions')
        .select('total_duration_seconds')
        .eq('ip_address', ipAddress)
        .single()

      if (!sessionData) return false

      const newTotalDuration = (sessionData.total_duration_seconds || 0) + durationSeconds

      const { error } = await supabase
        .from('vitrine_demo_sessions')
        .update({
          total_duration_seconds: newTotalDuration,
          is_session_active: false, // ✅ FIX : Marquer comme inactive pour permettre nouvelle session
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress)

      if (error) {
        console.error('❌ Erreur fin de session:', error)
        return false
      }

      console.log(`✅ Session terminée: ${durationSeconds}s utilisées (total: ${newTotalDuration}s)`)
      console.log(`🔓 Session marquée comme inactive - nouvelle connexion possible`)
      return true

    } catch (error) {
      console.error('❌ Erreur endSession:', error)
      return false
    }
  }

  async getSessionStats(ipAddress: string) {
    try {
      const { data, error } = await supabase
        .from('vitrine_demo_sessions')
        .select('*')
        .eq('ip_address', ipAddress)
        .single()

      if (error) return null
      return data
    } catch {
      return null
    }
  }

  async adminUnblockIP(ipAddress: string) {
    try {
      const { error } = await supabase
        .from('vitrine_demo_sessions')
        .update({
          blocked: false,
          blocked_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress)

      return !error
    } catch {
      return false
    }
  }
}

// Instance globale avec config par défaut
export const vitrineIPLimiter = new VitrineIPLimiter()
