/**
 * 🧹 NETTOYAGE SESSIONS ORPHELINES
 * Utilitaires pour détecter et fermer les sessions OpenAI orphelines
 */

import { getSupabaseService } from './supabase-service'

/**
 * Nettoie les sessions actives depuis plus de X minutes
 */
export async function cleanupOrphanedSessions(maxAgeMinutes: number = 15) {
  try {
    console.log(`🧹 [CLEANUP] Recherche sessions orphelines (>${maxAgeMinutes}min)...`)
    
    const supabase = getSupabaseService()
    
    // Trouver les sessions actives anciennes
    const { data: orphanedSessions, error } = await supabase
      .from('openai_realtime_sessions')
      .select('session_id, session_started_at, member_badge_id, gym_id')
      .is('session_ended_at', null)
      .lt('session_started_at', new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString())
    
    if (error) {
      console.error('❌ [CLEANUP] Erreur recherche sessions:', error)
      return { cleaned: 0, error: error.message }
    }
    
    if (!orphanedSessions || orphanedSessions.length === 0) {
      console.log('✅ [CLEANUP] Aucune session orpheline trouvée')
      return { cleaned: 0, error: null }
    }
    
    console.log(`🚨 [CLEANUP] ${orphanedSessions.length} sessions orphelines trouvées:`)
    orphanedSessions.forEach(session => {
      console.log(`  - ${session.session_id} (${session.member_badge_id}, ${session.session_started_at})`)
    })
    
    // Fermer chaque session orpheline
    let cleanedCount = 0
    for (const session of orphanedSessions) {
      try {
        const { error: closeError } = await supabase.rpc('close_session_robust', {
          p_session_id: session.session_id,
          p_reason: 'orphaned_cleanup'
        })
        
        if (!closeError) {
          cleanedCount++
          console.log(`✅ [CLEANUP] Session fermée: ${session.session_id}`)
        } else {
          console.error(`❌ [CLEANUP] Erreur fermeture ${session.session_id}:`, closeError)
        }
      } catch (err) {
        console.error(`❌ [CLEANUP] Exception fermeture ${session.session_id}:`, err)
      }
    }
    
    console.log(`🧹 [CLEANUP] ${cleanedCount}/${orphanedSessions.length} sessions nettoyées`)
    return { cleaned: cleanedCount, error: null }
    
  } catch (error) {
    console.error('🚨 [CLEANUP] Erreur globale:', error)
    return { cleaned: 0, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

/**
 * Démarre un nettoyage automatique périodique
 * ⚠️ NOTE: Cette fonction ne doit PAS être appelée côté client (pas d'accès service_role)
 * Le nettoyage doit être fait via API route côté serveur
 */
export function startPeriodicCleanup(intervalMinutes: number = 30) {
  // ⚠️ DÉSACTIVÉ côté client - utiliser l'API route /api/admin/sessions?action=cleanup
  if (typeof window !== 'undefined') {
    console.warn('⚠️ [CLEANUP] Nettoyage automatique désactivé côté client (utiliser API route)')
    return () => {} // Noop
  }
  
  console.log(`🔄 [CLEANUP] Démarrage nettoyage automatique (${intervalMinutes}min)`)
  
  const cleanup = () => {
    cleanupOrphanedSessions().catch(error => {
      console.error('🚨 [CLEANUP] Erreur nettoyage automatique:', error)
    })
  }
  
  // Nettoyage initial
  setTimeout(cleanup, 5000) // 5 secondes après le démarrage
  
  // Puis périodique
  const interval = setInterval(cleanup, intervalMinutes * 60 * 1000)
  
  return () => {
    clearInterval(interval)
    console.log('🛑 [CLEANUP] Nettoyage automatique arrêté')
  }
}



