import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/insights/alerts
 * Récupère les alertes pour une salle spécifique
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gym_id')

    if (!gymId) {
      return NextResponse.json({ error: 'gym_id requis' }, { status: 400 })
    }

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

    // 2. Vérifier que l'utilisateur a accès à cette salle
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, gym_id, franchise_id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profil utilisateur introuvable' }, { status: 404 })
    }

    // Vérifier les permissions
    if (userProfile.role === 'gym_manager' && userProfile.gym_id !== gymId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 3. Récupérer les alertes des derniers 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: alerts, error: alertsError } = await supabase
      .from('manager_alerts')
      .select(`
        *,
        gym_members_v2(first_name, last_name)
      `)
      .eq('gym_id', gymId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(100)

    if (alertsError) {
      console.error('[API] Error fetching alerts:', alertsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des alertes' }, { status: 500 })
    }

    // 4. Enrichir les alertes
    const enrichedAlerts = (alerts || []).map(alert => ({
      id: alert.id,
      type: alert.alert_type,
      priority: alert.priority,
      title: alert.title,
      message: alert.message,
      member_id: alert.member_id,
      member_name: alert.gym_members_v2 
        ? `${alert.gym_members_v2.first_name} ${alert.gym_members_v2.last_name}`
        : null,
      action_url: alert.action_url,
      created_at: alert.created_at,
      is_read: alert.is_read || false
    }))

    return NextResponse.json({
      alerts: enrichedAlerts
    })

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/insights/alerts:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}




