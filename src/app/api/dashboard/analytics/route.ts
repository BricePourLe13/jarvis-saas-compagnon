import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API ROUTE : /api/dashboard/analytics-v2
 * Retourne les analytics détaillées pour les graphiques
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

    // 3. Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // '7d', '30d', '90d', '1y'

    // 4. Déterminer le scope selon le rôle (MVP: super_admin, gym_manager)
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
        visitsTrend: [],
        sessionsPerDay: [],
        topMembers: [],
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        topicsDistribution: []
      })
    }

    // 5. Calculer les dates selon la période
    const now = new Date()
    let startDate = new Date()
    let groupBy = 'day'
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        groupBy = 'day'
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        groupBy = 'day'
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        groupBy = 'week'
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        groupBy = 'month'
        break
    }

    // 6. Récupérer les sessions pour la période
    const { data: sessions, error: sessionsError } = await supabase
      .from('openai_realtime_sessions')
      .select(`
        id,
        session_start,
        duration_seconds,
        member_id,
        gym_members_v2(id, first_name, last_name),
        conversation_summaries(sentiment, key_topics)
      `)
      .in('gym_id', gymIds)
      .gte('session_start', startDate.toISOString())
      .order('session_start', { ascending: true })

    if (sessionsError) {
      console.error('[API] Erreur query sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Erreur récupération sessions' },
        { status: 500 }
      )
    }

    // 7. Traiter les données pour les graphiques

    // 7.1 Sessions per day
    const sessionsPerDay: { [key: string]: number } = {}
    sessions?.forEach((session) => {
      const date = new Date(session.session_start).toISOString().split('T')[0]
      sessionsPerDay[date] = (sessionsPerDay[date] || 0) + 1
    })

    const sessionsPerDayChart = Object.entries(sessionsPerDay).map(([date, count]) => ({
      date,
      sessions: count
    }))

    // 7.2 Top members
    const membersSessions: { [memberId: string]: { name: string; count: number } } = {}
    sessions?.forEach((session) => {
      if (session.member_id && session.gym_members_v2) {
        const member = session.gym_members_v2
        const name = `${member.first_name} ${member.last_name}`
        
        if (!membersSessions[session.member_id]) {
          membersSessions[session.member_id] = { name, count: 0 }
        }
        membersSessions[session.member_id].count++
      }
    })

    const topMembers = Object.values(membersSessions)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(m => ({ name: m.name, sessions: m.count }))

    // 7.3 Sentiment distribution
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
    sessions?.forEach((session) => {
      const summary = Array.isArray(session.conversation_summaries) && session.conversation_summaries.length > 0
        ? session.conversation_summaries[0]
        : null
      
      if (summary?.sentiment) {
        sentimentCounts[summary.sentiment as keyof typeof sentimentCounts]++
      }
    })

    // 7.4 Topics distribution
    const topicsMap: { [topic: string]: number } = {}
    sessions?.forEach((session) => {
      const summary = Array.isArray(session.conversation_summaries) && session.conversation_summaries.length > 0
        ? session.conversation_summaries[0]
        : null
      
      if (summary?.key_topics && Array.isArray(summary.key_topics)) {
        summary.key_topics.forEach((topic: string) => {
          topicsMap[topic] = (topicsMap[topic] || 0) + 1
        })
      }
    })

    const topicsDistribution = Object.entries(topicsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }))

    // 7.5 Visits trend (simulé - à améliorer avec member_visits si table existe)
    const visitsTrend = sessionsPerDayChart.map(item => ({
      date: item.date,
      visits: Math.round(item.sessions * 1.5) // Simulé: ~1.5 visites par session
    }))

    // 8. Retourner les analytics
    return NextResponse.json({
      period,
      visitsTrend,
      sessionsPerDay: sessionsPerDayChart,
      topMembers,
      sentimentDistribution: sentimentCounts,
      topicsDistribution
    })

  } catch (error) {
    console.error('[API] Erreur analytics-v2:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

