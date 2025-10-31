import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

/**
 * CRON JOB QUOTIDIEN - Nettoyage Données Anciennes
 * 
 * Exécuté tous les jours à 4h00 AM
 * 
 * - Supprime conversation_events > 90 jours (RGPD)
 * - Archive system_logs > 180 jours
 * - Nettoie sessions OpenAI closed > 30 jours
 * 
 * Configuration Upstash QStash:
 * - URL: https://jarvis-group.net/api/cron/cleanup-old-data
 * - Schedule: 0 4 * * * (tous les jours à 4h00 AM)
 * - Method: POST
 */

export async function POST(request: NextRequest) {
  try {
    // Vérifier la signature Upstash (sécurité)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting cleanup old data')

    const supabase = createSimpleClient()
    
    // Dates limites
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const oneEightyDaysAgo = new Date()
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const results = {
      conversation_events_deleted: 0,
      system_logs_deleted: 0,
      sessions_cleaned: 0,
      errors: 0
    }

    // 1. Supprimer conversation_events > 90 jours (RGPD - données brutes)
    try {
      const { data: eventsToDelete, error: countError } = await supabase
        .from('conversation_events')
        .select('id', { count: 'exact', head: true })
        .lt('timestamp', ninetyDaysAgo.toISOString())

      if (!countError) {
        const { error: deleteError } = await supabase
          .from('conversation_events')
          .delete()
          .lt('timestamp', ninetyDaysAgo.toISOString())

        if (!deleteError) {
          results.conversation_events_deleted = eventsToDelete?.length || 0
          console.log(`[CRON] Deleted ${results.conversation_events_deleted} old conversation events`)
        } else {
          throw deleteError
        }
      }
    } catch (error) {
      console.error('[CRON] Error deleting conversation_events:', error)
      results.errors++
    }

    // 2. Supprimer system_logs > 180 jours (garder historique 6 mois)
    try {
      const { data: logsToDelete, error: countError } = await supabase
        .from('system_logs')
        .select('id', { count: 'exact', head: true })
        .lt('timestamp', oneEightyDaysAgo.toISOString())

      if (!countError) {
        const { error: deleteError } = await supabase
          .from('system_logs')
          .delete()
          .lt('timestamp', oneEightyDaysAgo.toISOString())

        if (!deleteError) {
          results.system_logs_deleted = logsToDelete?.length || 0
          console.log(`[CRON] Deleted ${results.system_logs_deleted} old system logs`)
        } else {
          throw deleteError
        }
      }
    } catch (error) {
      console.error('[CRON] Error deleting system_logs:', error)
      results.errors++
    }

    // 3. Nettoyer détails sessions OpenAI closed > 30 jours (garder métriques, supprimer metadata)
    try {
      const { error: updateError, count } = await supabase
        .from('openai_realtime_sessions')
        .update({
          session_metadata: {}
        })
        .eq('state', 'closed')
        .lt('session_ended_at', thirtyDaysAgo.toISOString())
        .not('session_metadata', 'is', null)

      if (!updateError) {
        results.sessions_cleaned = count || 0
        console.log(`[CRON] Cleaned metadata from ${results.sessions_cleaned} old sessions`)
      } else {
        throw updateError
      }
    } catch (error) {
      console.error('[CRON] Error cleaning sessions:', error)
      results.errors++
    }

    // 4. Log système
    await supabase
      .from('system_logs')
      .insert({
        log_type: 'cron_cleanup',
        message: `Nettoyage données terminé`,
        details: results
      })

    console.log('[CRON] Cleanup old data completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Cleanup old data completed',
      results
    })

  } catch (error) {
    console.error('[CRON] Error in cleanup old data:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Bloquer les autres méthodes HTTP
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed - Use POST only' },
    { status: 405 }
  )
}


