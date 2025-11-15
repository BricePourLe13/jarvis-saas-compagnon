/**
 * Rate Limiter pour Kiosks
 * 
 * Prévient l'abus et contrôle les coûts OpenAI :
 * - Max 10 sessions/membre/jour
 * - Max 30 min consécutives/session
 * - Alertes si > 50 sessions/gym/jour
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RateLimitResult {
  allowed: boolean
  remainingToday: number
  reason?: string
  currentSessionCount: number
}

/**
 * Vérifie le rate limit pour un membre sur un kiosk
 */
export async function checkKioskRateLimit(
  memberId: string,
  gymId: string
): Promise<RateLimitResult> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Compter les sessions du membre aujourd'hui
    const { count: sessionCount, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('started_at', `${today}T00:00:00Z`)
      .lte('started_at', `${today}T23:59:59Z`)
    
    if (error) {
      console.error('❌ [RATE LIMIT] Erreur vérification:', error)
      // En cas d'erreur, autoriser (fail-open pour ne pas bloquer le service)
      return {
        allowed: true,
        remainingToday: 10,
        currentSessionCount: 0,
        reason: 'Error checking limit, allowing'
      }
    }
    
    const MAX_SESSIONS_PER_DAY = 10
    const currentCount = sessionCount || 0
    const remaining = Math.max(0, MAX_SESSIONS_PER_DAY - currentCount)
    
    // Vérifier limite
    if (currentCount >= MAX_SESSIONS_PER_DAY) {
      console.warn(`⚠️ [RATE LIMIT] Membre ${memberId} a atteint la limite (${currentCount}/${MAX_SESSIONS_PER_DAY})`)
      return {
        allowed: false,
        remainingToday: 0,
        currentSessionCount: currentCount,
        reason: `Limite quotidienne atteinte (${MAX_SESSIONS_PER_DAY} sessions/jour)`
      }
    }
    
    return {
      allowed: true,
      remainingToday: remaining,
      currentSessionCount: currentCount
    }
    
  } catch (error) {
    console.error('❌ [RATE LIMIT] Erreur globale:', error)
    // Fail-open en cas d'erreur
    return {
      allowed: true,
      remainingToday: 10,
      currentSessionCount: 0,
      reason: 'Error, allowing'
    }
  }
}

/**
 * Vérifie les sessions globales d'une gym (pour alertes)
 */
export async function checkGymDailyUsage(gymId: string): Promise<{
  totalSessionsToday: number
  shouldAlert: boolean
  threshold: number
}> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('started_at', `${today}T00:00:00Z`)
      .lte('started_at', `${today}T23:59:59Z`)
    
    if (error) {
      console.error('❌ [GYM USAGE] Erreur vérification:', error)
      return { totalSessionsToday: 0, shouldAlert: false, threshold: 50 }
    }
    
    const ALERT_THRESHOLD = 50
    const totalToday = count || 0
    
    if (totalToday >= ALERT_THRESHOLD) {
      console.warn(`🚨 [GYM USAGE] Gym ${gymId} : ${totalToday} sessions aujourd'hui (seuil: ${ALERT_THRESHOLD})`)
    }
    
    return {
      totalSessionsToday: totalToday,
      shouldAlert: totalToday >= ALERT_THRESHOLD,
      threshold: ALERT_THRESHOLD
    }
    
  } catch (error) {
    console.error('❌ [GYM USAGE] Erreur globale:', error)
    return { totalSessionsToday: 0, shouldAlert: false, threshold: 50 }
  }
}

/**
 * Vérifie la durée d'une session en cours
 */
export async function checkSessionDuration(sessionId: string): Promise<{
  durationMinutes: number
  shouldWarn: boolean
  maxDuration: number
}> {
  try {
    const { data: session, error } = await supabase
      .from('conversations')
      .select('started_at')
      .eq('session_id', sessionId)
      .single()
    
    if (error || !session) {
      return { durationMinutes: 0, shouldWarn: false, maxDuration: 30 }
    }
    
    const startTime = new Date(session.started_at).getTime()
    const now = Date.now()
    const durationMs = now - startTime
    const durationMinutes = Math.floor(durationMs / 1000 / 60)
    
    const MAX_DURATION_MINUTES = 30
    
    if (durationMinutes >= MAX_DURATION_MINUTES) {
      console.warn(`⚠️ [SESSION DURATION] Session ${sessionId} dépasse ${MAX_DURATION_MINUTES} min`)
    }
    
    return {
      durationMinutes,
      shouldWarn: durationMinutes >= MAX_DURATION_MINUTES,
      maxDuration: MAX_DURATION_MINUTES
    }
    
  } catch (error) {
    console.error('❌ [SESSION DURATION] Erreur:', error)
    return { durationMinutes: 0, shouldWarn: false, maxDuration: 30 }
  }
}
