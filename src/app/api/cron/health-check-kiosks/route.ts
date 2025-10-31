import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

/**
 * CRON JOB QUOTIDIEN - Health Check Kiosks
 * 
 * Exécuté tous les jours à 3h00 AM
 * 
 * - Vérifie l'état de tous les kiosks
 * - Marque comme "offline" si pas de heartbeat depuis 5 minutes
 * - Crée des alertes pour les kiosks problématiques
 * 
 * Configuration Upstash QStash:
 * - URL: https://jarvis-group.net/api/cron/health-check-kiosks
 * - Schedule: 0 3 * * * (tous les jours à 3h00 AM)
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

    console.log('[CRON] Starting health check kiosks')

    const supabase = createSimpleClient()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    // 1. Récupérer tous les kiosks
    const { data: kiosks, error: kiosksError } = await supabase
      .from('kiosks')
      .select(`
        id,
        name,
        slug,
        status,
        last_heartbeat,
        gym_id,
        gyms!inner(id, name)
      `)

    if (kiosksError) {
      throw new Error(`Failed to fetch kiosks: ${kiosksError.message}`)
    }

    if (!kiosks || kiosks.length === 0) {
      console.log('[CRON] No kiosks found')
      return NextResponse.json({
        success: true,
        message: 'No kiosks to check'
      })
    }

    console.log(`[CRON] Checking ${kiosks.length} kiosks`)

    const results = {
      total: kiosks.length,
      online: 0,
      offline: 0,
      errors: 0,
      statusChanged: 0,
      alertsCreated: 0
    }

    // 2. Vérifier chaque kiosk
    for (const kiosk of kiosks) {
      try {
        const isOffline = !kiosk.last_heartbeat || 
                         new Date(kiosk.last_heartbeat) < new Date(fiveMinutesAgo)

        const newStatus = isOffline ? 'offline' : 'online'
        const statusChanged = kiosk.status !== newStatus

        if (isOffline) {
          results.offline++
        } else {
          results.online++
        }

        // Mettre à jour le status si changé
        if (statusChanged) {
          const { error: updateError } = await supabase
            .from('kiosks')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', kiosk.id)

          if (updateError) {
            throw new Error(`Failed to update kiosk ${kiosk.id}: ${updateError.message}`)
          }

          results.statusChanged++

          // Créer une alerte si le kiosk passe offline
          if (newStatus === 'offline') {
            // Vérifier qu'une alerte n'existe pas déjà (dans les 24h)
            const oneDayAgo = new Date()
            oneDayAgo.setDate(oneDayAgo.getDate() - 1)

            const { data: existingAlert } = await supabase
              .from('manager_alerts')
              .select('id')
              .eq('gym_id', kiosk.gym_id)
              .eq('alert_type', 'equipment_issue')
              .eq('status', 'pending')
              .gte('created_at', oneDayAgo.toISOString())
              .like('title', `%${kiosk.name}%`)
              .single()

            if (!existingAlert) {
              const { error: alertError } = await supabase
                .from('manager_alerts')
                .insert({
                  gym_id: kiosk.gym_id,
                  member_id: null,
                  alert_type: 'equipment_issue',
                  priority: 'high',
                  title: `Kiosk hors ligne: ${kiosk.name}`,
                  description: `Le kiosk "${kiosk.name}" (/${kiosk.slug}) n'a pas envoyé de signal depuis plus de 5 minutes. Dernier heartbeat: ${kiosk.last_heartbeat || 'Jamais'}.`,
                  recommended_actions: [
                    { action: 'check_power', label: 'Vérifier l\'alimentation électrique' },
                    { action: 'check_network', label: 'Vérifier la connexion réseau' },
                    { action: 'restart_device', label: 'Redémarrer l\'équipement' },
                    { action: 'contact_support', label: 'Contacter le support technique' }
                  ],
                  status: 'pending'
                })

              if (!alertError) {
                results.alertsCreated++
              }
            }
          }
        }

      } catch (error) {
        console.error(`[CRON] Error checking kiosk ${kiosk.id}:`, error)
        results.errors++
      }
    }

    // 3. Log système
    await supabase
      .from('system_logs')
      .insert({
        log_type: 'cron_kiosk_health',
        message: `Health check kiosks terminé`,
        details: results
      })

    console.log('[CRON] Health check kiosks completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Health check kiosks completed',
      results
    })

  } catch (error) {
    console.error('[CRON] Error in health check kiosks:', error)
    
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


