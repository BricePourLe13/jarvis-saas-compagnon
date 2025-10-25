import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

/**
 * CRON JOB QUOTIDIEN - Analyse Churn
 * 
 * Exécuté tous les jours à 2h00 AM
 * 
 * - Récupère tous les membres actifs
 * - Appelle update-member-analytics pour chaque membre
 * - Génère des alertes si churn risk élevé
 * 
 * Configuration Upstash QStash:
 * - URL: https://jarvis-group.net/api/cron/daily-churn-analysis
 * - Schedule: 0 2 * * * (tous les jours à 2h00 AM)
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

    console.log('[CRON] Starting daily churn analysis')

    const supabase = createSimpleClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // 1. Récupérer tous les membres actifs ayant eu au moins 1 conversation
    const { data: members, error: membersError } = await supabase
      .from('gym_members_v2')
      .select('id, first_name, last_name, gym_id')
      .eq('is_active', true)

    if (membersError) {
      throw new Error(`Failed to fetch members: ${membersError.message}`)
    }

    if (!members || members.length === 0) {
      console.log('[CRON] No active members found')
      return NextResponse.json({
        success: true,
        message: 'No members to analyze'
      })
    }

    console.log(`[CRON] Found ${members.length} active members`)

    // 2. Traiter les membres par batch de 10 (éviter timeout)
    const batchSize = 10
    const results = {
      total: members.length,
      processed: 0,
      errors: 0,
      highRisk: 0,
      criticalRisk: 0
    }

    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (member) => {
          try {
            // Appeler Edge Function update-member-analytics
            const response = await fetch(
              `${supabaseUrl}/functions/v1/update-member-analytics`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify({ member_id: member.id })
              }
            )

            if (!response.ok) {
              throw new Error(`Failed for member ${member.id}`)
            }

            const data = await response.json()
            results.processed++

            // Compter les risques
            if (data.analytics?.churn_risk_level === 'high') {
              results.highRisk++
            } else if (data.analytics?.churn_risk_level === 'critical') {
              results.criticalRisk++
            }

          } catch (error) {
            console.error(`[CRON] Error processing member ${member.id}:`, error)
            results.errors++
          }
        })
      )

      // Petit délai entre les batches pour ne pas surcharger
      if (i + batchSize < members.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // 3. Log système
    await supabase
      .from('system_logs')
      .insert({
        log_type: 'cron_daily_churn',
        message: `Analyse churn quotidienne terminée`,
        details: results
      })

    console.log('[CRON] Daily churn analysis completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Daily churn analysis completed',
      results
    })

  } catch (error) {
    console.error('[CRON] Error in daily churn analysis:', error)
    
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

