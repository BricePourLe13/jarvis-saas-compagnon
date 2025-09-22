import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface VitrineLimiterConfig {
  maxDailySessions: number
  maxTotalSessions: number
  sessionDurationLimitMinutes: number
  blockAfterExcessive: boolean
}

const DEFAULT_CONFIG: VitrineLimiterConfig = {
  maxDailySessions: 3,           // 3 sessions par jour max
  maxTotalSessions: 10,          // 10 sessions au total max
  sessionDurationLimitMinutes: 3, // 3 minutes max par session
  blockAfterExcessive: true      // Bloquer après usage excessif
}

export interface VitrineLimiterResult {
  allowed: boolean
  reason?: string
  remainingSessions: number
  resetTime?: Date
  isBlocked: boolean
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
        return { allowed: true, remainingSessions: 999, isBlocked: false } // Fail open
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
            user_agent,
            first_session_at: now.toISOString(),
            last_session_at: now.toISOString()
          })

        if (insertError) {
          console.error('❌ Erreur insertion vitrine session:', insertError)
          return { allowed: true, remainingSessions: 999, isBlocked: false }
        }

        return {
          allowed: true,
          remainingSessions: this.config.maxDailySessions - 1,
          isBlocked: false
        }
      }

      // 2. Vérifier si l'IP est bloquée
      if (sessionData.blocked) {
        return {
          allowed: false,
          reason: sessionData.blocked_reason || 'IP bloquée pour usage excessif',
          remainingSessions: 0,
          isBlocked: true
        }
      }

      // 3. Reset quotidien si nécessaire
      let dailyCount = sessionData.daily_session_count
      if (sessionData.daily_reset_date !== today) {
        dailyCount = 0 // Reset du compteur quotidien
      }

      // 4. Vérifier les limites
      const totalSessions = sessionData.session_count
      
      // Limite quotidienne
      if (dailyCount >= this.config.maxDailySessions) {
        const resetTime = new Date()
        resetTime.setDate(resetTime.getDate() + 1)
        resetTime.setHours(0, 0, 0, 0)
        
        return {
          allowed: false,
          reason: `Limite quotidienne atteinte (${this.config.maxDailySessions}/jour)`,
          remainingSessions: 0,
          resetTime,
          isBlocked: false
        }
      }

      // Limite totale
      if (totalSessions >= this.config.maxTotalSessions) {
        // Bloquer définitivement si configuré
        if (this.config.blockAfterExcessive) {
          await supabase
            .from('vitrine_demo_sessions')
            .update({
              blocked: true,
              blocked_reason: `Dépassement limite totale (${this.config.maxTotalSessions} sessions)`
            })
            .eq('ip_address', ipAddress)
        }

        return {
          allowed: false,
          reason: `Limite totale atteinte (${this.config.maxTotalSessions} sessions)`,
          remainingSessions: 0,
          isBlocked: this.config.blockAfterExcessive
        }
      }

      // 5. Mettre à jour les compteurs
      const newDailyCount = dailyCount + 1
      const newTotalCount = totalSessions + 1

      const { error: updateError } = await supabase
        .from('vitrine_demo_sessions')
        .update({
          session_count: newTotalCount,
          daily_session_count: newDailyCount,
          daily_reset_date: today,
          last_session_at: now.toISOString(),
          user_agent, // Update user agent au cas où
          updated_at: now.toISOString()
        })
        .eq('ip_address', ipAddress)

      if (updateError) {
        console.error('❌ Erreur mise à jour vitrine session:', updateError)
      }

      return {
        allowed: true,
        remainingSessions: this.config.maxDailySessions - newDailyCount,
        isBlocked: false
      }

    } catch (error) {
      console.error('❌ Erreur vitrine IP limiter:', error)
      // En cas d'erreur, on autorise (fail open)
      return { allowed: true, remainingSessions: 999, isBlocked: false }
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
