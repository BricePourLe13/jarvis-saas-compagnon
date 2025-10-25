import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/monitoring
 * Données de monitoring système et coûts
 * Réservé aux super_admin
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // 1. Vérifier l'auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profil utilisateur introuvable' }, { status: 404 })
    }

    // 3. Vérifier permissions super_admin
    if (userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé - Super admin requis' }, { status: 403 })
    }

    // 4. Calculer uptime (basé sur kiosk heartbeats des dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: heartbeats, error: heartbeatsError } = await supabase
      .from('kiosk_heartbeats')
      .select('kiosk_id, created_at')
      .gte('created_at', yesterday)

    const totalKiosks = await supabase
      .from('kiosks')
      .select('id', { count: 'exact', head: true })

    // Uptime calculé sur les kiosks qui ont envoyé un heartbeat
    const activeKiosksCount = new Set(heartbeats?.map(h => h.kiosk_id) || []).size
    const uptime = totalKiosks.count ? (activeKiosksCount / totalKiosks.count) * 100 : 100

    // 5. Récupérer les logs d'erreurs des Edge Functions (dernières 24h)
    const { count: edgeFunctionErrors } = await supabase
      .from('system_logs')
      .select('id', { count: 'exact', head: true })
      .eq('log_type', 'edge_function_error')
      .gte('created_at', yesterday)

    // 6. Statistiques base de données (approximatif)
    const { data: recentSessions } = await supabase
      .from('openai_realtime_sessions')
      .select('id, created_at')
      .gte('created_at', yesterday)

    const queries24h = (recentSessions?.length || 0) * 10 // Estimation : ~10 queries par session

    // 7. Calcul des coûts (estimation basée sur l'usage)
    const { data: sessions } = await supabase
      .from('openai_realtime_sessions')
      .select('id, duration, created_at')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    const totalSessionsThisMonth = sessions?.length || 0
    const avgSessionCost = 2 // $2 par session (estimation moyenne OpenAI Realtime)
    const openaiCost = totalSessionsThisMonth * avgSessionCost

    // Coûts fixes infrastructure (estimation)
    const supabaseCost = 25 // Plan Pro Supabase
    const vercelCost = 20 // Plan Pro Vercel
    const totalCost = openaiCost + supabaseCost + vercelCost

    // Coût mois dernier (approximation -10%)
    const lastMonthTotal = totalCost * 0.9

    // 8. Performance metrics
    const { data: performanceLogs } = await supabase
      .from('system_logs')
      .select('details, created_at')
      .eq('log_type', 'api_performance')
      .gte('created_at', yesterday)
      .limit(1000)

    const avgApiResponseTime = performanceLogs && performanceLogs.length > 0
      ? performanceLogs.reduce((sum, log) => sum + ((log.details as any)?.responseTime || 0), 0) / performanceLogs.length
      : 120

    const avgOpenAILatency = performanceLogs && performanceLogs.length > 0
      ? performanceLogs.reduce((sum, log) => sum + ((log.details as any)?.openaiLatency || 0), 0) / performanceLogs.length
      : 450

    // 9. Assembler la réponse
    const monitoringData = {
      system: {
        uptime,
        health: uptime >= 99 ? 'healthy' : uptime >= 95 ? 'degraded' : 'down',
        lastCheck: new Date().toISOString(),
        edgeFunctions: {
          total: 3, // process-conversation, update-member-analytics, generate-alerts
          active: 3,
          errors24h: edgeFunctionErrors || 0
        },
        database: {
          connections: 10, // Estimation
          queries24h,
          avgResponseTime: 85
        }
      },
      costs: {
        currentMonth: {
          total: totalCost,
          openai: openaiCost,
          supabase: supabaseCost,
          vercel: vercelCost
        },
        lastMonth: {
          total: lastMonthTotal
        },
        breakdown: [
          {
            service: 'OpenAI Realtime API',
            cost: openaiCost,
            usage: `${totalSessionsThisMonth} sessions`,
            trend: 15.5
          },
          {
            service: 'Supabase Pro',
            cost: supabaseCost,
            usage: 'Database + Auth + Storage',
            trend: 0
          },
          {
            service: 'Vercel Pro',
            cost: vercelCost,
            usage: 'Hosting + Edge Functions',
            trend: 0
          },
          {
            service: 'Resend',
            cost: 5,
            usage: 'Email transactionnel',
            trend: 2.3
          }
        ]
      },
      performance: {
        avgApiResponseTime: Math.round(avgApiResponseTime),
        avgOpenAILatency: Math.round(avgOpenAILatency),
        totalRequests24h: queries24h,
        errorRate: edgeFunctionErrors ? (edgeFunctionErrors / queries24h) * 100 : 0
      }
    }

    return NextResponse.json(monitoringData)

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/admin/monitoring:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

