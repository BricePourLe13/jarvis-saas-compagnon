import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API ROUTE : /api/dashboard/sessions-v2
 * Retourne les sessions JARVIS avec filtres
 * Isolation par gym_id selon le rôle
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, gym_id, franchise_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Profil utilisateur introuvable' },
        { status: 404 }
      )
    }

    // 3. Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // 'all', 'today', 'week', 'month'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 4. Déterminer le scope selon le rôle
    let gymIds: string[] = []
    
    if (userProfile.role === 'super_admin') {
      const { data: allGyms } = await supabase
        .from('gyms')
        .select('id')
      gymIds = allGyms?.map(g => g.id) || []
    } else if (userProfile.role === 'franchise_owner' || userProfile.role === 'franchise_admin') {
      if (userProfile.franchise_id) {
        const { data: franchiseGyms } = await supabase
          .from('gyms')
          .select('id')
          .eq('franchise_id', userProfile.franchise_id)
        gymIds = franchiseGyms?.map(g => g.id) || []
      }
    } else if (userProfile.role === 'manager' || userProfile.role === 'staff') {
      if (userProfile.gym_id) {
        gymIds = [userProfile.gym_id]
      }
    }

    if (gymIds.length === 0) {
      return NextResponse.json({ sessions: [], total: 0 })
    }

    // 5. Construire la query de base
    let query = supabase
      .from('openai_realtime_sessions')
      .select(`
        id,
        session_start,
        session_end,
        duration_seconds,
        total_cost_usd,
        context_type,
        gym_members_v2(
          id,
          badge_id,
          first_name,
          last_name
        ),
        conversation_summaries(
          summary_text,
          key_topics,
          sentiment
        )
      `, { count: 'exact' })
      .in('gym_id', gymIds)
      .order('session_start', { ascending: false })

    // 6. Appliquer les filtres temporels
    const now = new Date()
    if (filter === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      query = query.gte('session_start', startOfDay.toISOString())
    } else if (filter === 'week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - 7)
      query = query.gte('session_start', startOfWeek.toISOString())
    } else if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      query = query.gte('session_start', startOfMonth.toISOString())
    }

    // 7. Pagination
    query = query.range(offset, offset + limit - 1)

    // 8. Exécuter la query
    const { data: sessions, error, count } = await query

    if (error) {
      console.error('[API] Erreur query sessions:', error)
      return NextResponse.json(
        { error: 'Erreur récupération sessions' },
        { status: 500 }
      )
    }

    // 9. Formater les données
    const formattedSessions = (sessions || []).map((session) => {
      const summary = Array.isArray(session.conversation_summaries) && session.conversation_summaries.length > 0
        ? session.conversation_summaries[0]
        : null
      
      const member = session.gym_members_v2
      
      return {
        id: session.id,
        date: session.session_start,
        duration: session.duration_seconds,
        member: member ? {
          name: `${member.first_name} ${member.last_name}`,
          badge: member.badge_id
        } : null,
        sentiment: summary?.sentiment || 'neutral',
        topics: summary?.key_topics || [],
        summary: summary?.summary_text || null,
        cost: session.total_cost_usd
      }
    })

    return NextResponse.json({
      sessions: formattedSessions,
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('[API] Erreur sessions-v2:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

