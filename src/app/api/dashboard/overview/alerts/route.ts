import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API ROUTE : /api/dashboard/overview/alerts
 * Retourne les alertes ACTIONNABLES pour le dashboard gérant
 * - Membres à risque churn (avec détails)
 * - Feedbacks négatifs
 * - Anomalies détectées
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

    // 3. Déterminer le scope selon le rôle (MVP)
    let gymIds: string[] = []
    
    if (userProfile.role === 'super_admin') {
      const { data: allGyms } = await supabase
        .from('gyms')
        .select('id')
      gymIds = allGyms?.map(g => g.id) || []
    } else if (userProfile.role === 'gym_manager') {
      gymIds = [
        ...(userProfile.gym_id ? [userProfile.gym_id] : []),
        ...(userProfile.gym_access || [])
      ]
    }

    if (gymIds.length === 0) {
      return NextResponse.json({ alerts: [] })
    }

    const alerts: any[] = []
    const now = new Date()

    // 🚨 ALERTE 1 : MEMBRES À RISQUE CHURN (DÉTAILS)
    // Membres inactifs 14+ jours
    const { data: allActiveMembers } = await supabase
      .from('gym_members_v2')
      .select(`
        id,
        first_name,
        last_name,
        email,
        openai_realtime_sessions(session_start)
      `)
      .in('gym_id', gymIds)
      .eq('is_active', true)

    const membersAtRisk: any[] = []
    
    allActiveMembers?.forEach((member: any) => {
      const sessions = member.openai_realtime_sessions || []
      
      if (sessions.length === 0) {
        // Nouveau membre sans session = pas encore à risque
        return
      }
      
      // Dernière session
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
          membersAtRisk.push({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            email: member.email,
            daysInactive: daysSinceLastSession,
            lastSeen: lastSession.session_start
          })
        }
      }
    })

    if (membersAtRisk.length > 0) {
      // Trier par jours d'inactivité (plus critique en premier)
      membersAtRisk.sort((a, b) => b.daysInactive - a.daysInactive)

      alerts.push({
        id: 'churn-risk-detailed',
        type: 'warning',
        title: `${membersAtRisk.length} membre${membersAtRisk.length > 1 ? 's' : ''} à risque churn`,
        message: `${membersAtRisk.slice(0, 3).map(m => `${m.name} (${m.daysInactive}j)`).join(', ')}${membersAtRisk.length > 3 ? ` +${membersAtRisk.length - 3} autre${membersAtRisk.length - 3 > 1 ? 's' : ''}` : ''}`,
        created_at: now.toISOString(),
        metadata: {
          membersAtRisk: membersAtRisk.slice(0, 10), // Top 10 plus critiques
          totalCount: membersAtRisk.length
        },
        actions: [
          { label: 'Voir tous les membres à risque', href: '/dashboard/members?filter=at_risk' },
          { label: 'Envoyer email relance', action: 'send_reengagement_email' }
        ]
      })
    }

    // 😠 ALERTE 2 : FEEDBACKS NÉGATIFS (derniers 7 jours)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)

    const { data: negativeFeedbacks } = await supabase
      .from('openai_realtime_sessions')
      .select(`
        id,
        session_start,
        member_id,
        gym_members_v2(first_name, last_name),
        conversation_summaries(sentiment, main_topic, summary_text)
      `)
      .in('gym_id', gymIds)
      .gte('session_start', sevenDaysAgo.toISOString())
      .order('session_start', { ascending: false })

    const negativeInteractions = negativeFeedbacks
      ?.filter((session: any) => {
        const summaries = session.conversation_summaries || []
        return summaries.some((s: any) => s.sentiment && s.sentiment < 0.3) // sentiment négatif
      })
      .slice(0, 5) // Top 5 most recent
      .map((session: any) => {
        const member = session.gym_members_v2
        const summary = session.conversation_summaries?.[0]
        return {
          memberName: member ? `${member.first_name} ${member.last_name}` : 'Anonyme',
          topic: summary?.main_topic || 'Non spécifié',
          summary: summary?.summary_text || '',
          date: session.session_start
        }
      }) || []

    if (negativeInteractions.length > 0) {
      alerts.push({
        id: 'negative-feedbacks',
        type: 'error',
        title: `${negativeInteractions.length} feedback${negativeInteractions.length > 1 ? 's' : ''} négatif${negativeInteractions.length > 1 ? 's' : ''} cette semaine`,
        message: negativeInteractions.map(f => `${f.memberName}: ${f.topic}`).slice(0, 2).join(' | '),
        created_at: now.toISOString(),
        metadata: {
          negativeFeedbacks: negativeInteractions
        },
        actions: [
          { label: 'Voir détails', href: '/dashboard/sessions?filter=negative' },
          { label: 'Marquer résolu', action: 'mark_resolved' }
        ]
      })
    }

    // 📊 ALERTE 3 : BAISSE FRÉQUENTATION (vs semaine dernière)
    const lastWeekStart = new Date(now)
    lastWeekStart.setDate(now.getDate() - 14)
    const lastWeekEnd = new Date(now)
    lastWeekEnd.setDate(now.getDate() - 7)

    const { count: sessionsLastWeek } = await supabase
      .from('openai_realtime_sessions')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .gte('session_start', lastWeekStart.toISOString())
      .lte('session_start', lastWeekEnd.toISOString())

    const { count: sessionsThisWeek } = await supabase
      .from('openai_realtime_sessions')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .gte('session_start', lastWeekEnd.toISOString())

    if (sessionsLastWeek && sessionsThisWeek) {
      const dropPercentage = Math.round(((sessionsLastWeek - sessionsThisWeek) / sessionsLastWeek) * 100)
      
      if (dropPercentage > 20) {
        alerts.push({
          id: 'frequency-drop',
          type: 'warning',
          title: `Baisse fréquentation -${dropPercentage}%`,
          message: `${sessionsThisWeek} sessions cette semaine vs ${sessionsLastWeek} la semaine dernière`,
          created_at: now.toISOString(),
          actions: [
            { label: 'Voir analytics', href: '/dashboard/analytics' }
          ]
        })
      }
    }

    // ✅ ALERTE 4 : OPPORTUNITÉ D'ENGAGEMENT (membres sans JARVIS)
    const { count: membersWithoutJarvis } = await supabase
      .from('gym_members_v2')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .eq('is_active', true)

    const { count: membersWithJarvis } = await supabase
      .from('openai_realtime_sessions')
      .select('member_id', { count: 'exact', head: true })
      .in('gym_id', gymIds)

    const unusedPotential = (membersWithoutJarvis || 0) - (membersWithJarvis || 0)

    if (unusedPotential > 10) {
      alerts.push({
        id: 'unused-potential',
        type: 'info',
        title: `${unusedPotential} membres n'ont jamais utilisé JARVIS`,
        message: 'Opportunité d\'engagement et d\'amélioration de l\'expérience',
        created_at: now.toISOString(),
        actions: [
          { label: 'Campagne onboarding', action: 'send_jarvis_intro_email' }
        ]
      })
    }

    return NextResponse.json({ alerts })

  } catch (error) {
    console.error('[API] Erreur alerts overview:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
