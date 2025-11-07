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
        // ⚠️ Si IP = 'unknown', ne pas marquer comme active (évite blocage global)
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
            daily_duration_seconds: 0, // ✅ Nouvelle colonne pour durée quotidienne
            is_session_active: true // ✅ Marquer comme active (sera nettoyé automatiquement si orpheline)
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

      // 3. 🔒 SIMPLIFICATION : Pour la vitrine, on autorise toujours une nouvelle session
      // On réinitialise automatiquement le flag si la dernière session date de plus de 30 secondes
      // Cela permet de gérer les fermetures brutales sans bloquer l'utilisateur
      if (sessionData.is_session_active) {
        const lastSession = new Date(sessionData.last_session_at)
        const timeSinceLastSession = (now.getTime() - lastSession.getTime()) / 1000 // secondes
        
        // Si la dernière session date de plus de 30 secondes, considérer comme terminée
        if (timeSinceLastSession > 30) {
          // Session orpheline, réinitialiser automatiquement
          console.log(`🔓 Session orpheline détectée (${Math.floor(timeSinceLastSession)}s) - Réinitialisation automatique`)
          await supabase
            .from('vitrine_demo_sessions')
            .update({ is_session_active: false })
            .eq('ip_address', ipAddress)
          // ✅ Continuer la création de session après nettoyage
        } else {
          // Session très récente (< 30s) : peut-être un double-clic, autoriser quand même mais logger
          console.log(`⚠️ Session active récente (${Math.floor(timeSinceLastSession)}s) - Autorisation quand même pour éviter blocage`)
          await supabase
            .from('vitrine_demo_sessions')
            .update({ is_session_active: false })
            .eq('ip_address', ipAddress)
          // ✅ Autoriser la nouvelle session (on ferme l'ancienne automatiquement)
        }
      }

      // 4. Reset quotidien si nécessaire
      // ✅ FIX : Utiliser daily_duration_seconds (colonne séparée) pour la limite quotidienne
      let dailyDurationSeconds = (sessionData.daily_duration_seconds as number) || 0
      
      if (sessionData.daily_reset_date !== today) {
        // Nouveau jour : reset de la durée quotidienne
        dailyDurationSeconds = 0
        // Mettre à jour daily_reset_date et reset daily_duration_seconds
        await supabase
          .from('vitrine_demo_sessions')
          .update({ 
            daily_reset_date: today,
            daily_duration_seconds: 0
          })
          .eq('ip_address', ipAddress)
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
          is_session_active: true, // ✅ Marquer comme active (sera nettoyé automatiquement si orpheline)
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
      const today = new Date().toISOString().split('T')[0]
      
      const { data: sessionData } = await supabase
        .from('vitrine_demo_sessions')
        .select('total_duration_seconds, daily_duration_seconds, daily_reset_date')
        .eq('ip_address', ipAddress)
        .single()

      if (!sessionData) return false

      const newTotalDuration = (sessionData.total_duration_seconds || 0) + durationSeconds
      
      // ✅ Calculer daily_duration_seconds correctement
      let newDailyDuration = (sessionData.daily_duration_seconds as number) || 0
      if (sessionData.daily_reset_date === today) {
        // Même jour : ajouter à la durée quotidienne
        newDailyDuration += durationSeconds
      } else {
        // Nouveau jour : reset et commencer avec la nouvelle durée
        newDailyDuration = durationSeconds
      }

      const { error } = await supabase
        .from('vitrine_demo_sessions')
        .update({
          total_duration_seconds: newTotalDuration,
          daily_duration_seconds: newDailyDuration,
          daily_reset_date: today, // Mettre à jour la date de reset
          is_session_active: false, // ✅ CRITIQUE : Marquer comme inactive pour permettre nouvelle session
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress)
        
      // ✅ Double vérification : s'assurer que le flag est bien à false
      if (error) {
        console.error('❌ Erreur fin de session:', error)
        // Même en cas d'erreur, essayer de réinitialiser is_session_active
        await supabase
          .from('vitrine_demo_sessions')
          .update({ is_session_active: false })
          .eq('ip_address', ipAddress)
          .catch(() => {}) // Ignorer erreur si déjà à false
        return false
      }

      console.log(`✅ Session terminée: ${durationSeconds}s utilisées (quotidien: ${newDailyDuration}s, total: ${newTotalDuration}s)`)
      console.log(`🔓 Session marquée comme inactive - nouvelle connexion possible`)
      
      // ✅ Triple vérification : vérifier que is_session_active est bien à false
      const { data: verifyData } = await supabase
        .from('vitrine_demo_sessions')
        .select('is_session_active')
        .eq('ip_address', ipAddress)
        .single()
        
      if (verifyData?.is_session_active) {
        console.warn('⚠️ Flag is_session_active toujours à true après update - correction forcée')
        await supabase
          .from('vitrine_demo_sessions')
          .update({ is_session_active: false })
          .eq('ip_address', ipAddress)
      }
      
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
