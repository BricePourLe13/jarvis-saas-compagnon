import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API ROUTE : /api/dashboard/overview/stats
 * Retourne les métriques pour la page Overview
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
      .select('id, role, gym_id, gym_access')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Profil utilisateur introuvable' },
        { status: 404 }
      )
    }

    // 3. Déterminer le scope selon le rôle (MVP: super_admin, gym_manager)
    let gymIds: string[] = []
    
    if (userProfile.role === 'super_admin') {
      const { data: allGyms } = await supabase
        .from('gyms')
        .select('id')
      gymIds = allGyms?.map(g => g.id) || []
    } else if (userProfile.role === 'gym_manager') {
      // gym_manager: accès via gym_id + gym_access[]
      gymIds = [
        ...(userProfile.gym_id ? [userProfile.gym_id] : []),
        ...(userProfile.gym_access || [])
      ]
    }

    if (gymIds.length === 0) {
      return NextResponse.json({
        totalMembers: 0,
        activeMembersToday: 0,
        totalSessions: 0,
        sessionsToday: 0,
        avgSentiment: 0,
        churnRisk: 0,
        membersTrend: 0,
        sessionsTrend: 0
      })
    }

    // 4. Calculer les métriques pour dashboard GÉRANT
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // 4.1 Membres totaux (actifs)
    const { count: totalMembers } = await supabase
      .from('gym_members_v2')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .eq('is_active', true)

    // 4.2 Membres actifs aujourd'hui (ont eu une session aujourd'hui)
    const { data: todaySessions } = await supabase
      .from('openai_realtime_sessions')
      .select('member_id')
      .in('gym_id', gymIds)
      .gte('session_start', today.toISOString())

    const activeMembersToday = new Set(todaySessions?.map(s => s.member_id).filter(Boolean) || []).size

    // 4.3 Sessions totales
    const { count: totalSessions } = await supabase
      .from('openai_realtime_sessions')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)

    // 4.4 Sessions aujourd'hui
    const { count: sessionsToday } = await supabase
      .from('openai_realtime_sessions')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .gte('session_start', today.toISOString())

    // 4.5 Sentiment moyen (dernières 30 sessions)
    const { data: recentSessionsWithSentiment } = await supabase
      .from('openai_realtime_sessions')
      .select(`
        id,
        conversation_summaries(sentiment)
      `)
      .in('gym_id', gymIds)
      .order('session_start', { ascending: false })
      .limit(30)

    const sentiments = recentSessionsWithSentiment
      ?.flatMap(s => (s as any).conversation_summaries || [])
      .map((cs: any) => cs.sentiment)
      .filter((s: any) => s && typeof s === 'number') || []

    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((sum: number, s: number) => sum + s, 0) / sentiments.length
      : 0

    // 4.6 CHURN RISK DETECTION 🔥 (LA VALEUR AJOUTÉE)
    // Critères: Membres inactifs 14+ jours
    const { data: allActiveMembers } = await supabase
      .from('gym_members_v2')
      .select(`
        id,
        openai_realtime_sessions(session_start)
      `)
      .in('gym_id', gymIds)
      .eq('is_active', true)

    let churnRiskCount = 0
    allActiveMembers?.forEach((member: any) => {
      const sessions = member.openai_realtime_sessions || []
      if (sessions.length === 0) {
        // Nouveau membre sans session = pas à risque immédiat
        return
      }
      
      // Dernière session du membre
      const lastSession = sessions.reduce((latest: any, session: any) => {
        const sessionDate = new Date(session.session_start)
        const latestDate = latest ? new Date(latest.session_start) : new Date(0)
        return sessionDate > latestDate ? session : latest
      }, null)

      if (lastSession) {
        const daysSinceLastSession = Math.floor(
          (now.getTime() - new Date(lastSession.session_start).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLastSession >= 14) {
          churnRiskCount++
        }
      }
    })

    // 4.7 Trends (vs mois dernier)
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const { count: membersLastMonth } = await supabase
      .from('gym_members_v2')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .eq('is_active', true)
      .lte('created_at', lastDayLastMonth.toISOString())

    const { count: sessionsLastMonth } = await supabase
      .from('openai_realtime_sessions')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .gte('session_start', firstDayLastMonth.toISOString())
      .lte('session_start', lastDayLastMonth.toISOString())

    const membersTrend = membersLastMonth 
      ? Math.round((((totalMembers || 0) - membersLastMonth) / membersLastMonth) * 100)
      : 0

    const sessionsTrend = sessionsLastMonth
      ? Math.round((((totalSessions || 0) - sessionsLastMonth) / sessionsLastMonth) * 100)
      : 0

    // 5. Retourner les KPIs Dashboard GÉRANT
    return NextResponse.json({
      totalMembers: totalMembers || 0,
      activeMembersToday: activeMembersToday,
      totalSessions: totalSessions || 0,
      sessionsToday: sessionsToday || 0,
      avgSentiment: avgSentiment,
      churnRisk: churnRiskCount,
      membersTrend: membersTrend,
      sessionsTrend: sessionsTrend
    })

  } catch (error) {
    console.error('[API] Erreur stats overview:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

