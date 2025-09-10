/**
 * 📊 API STATISTIQUES SESSIONS
 * Endpoint pour obtenir les statistiques en temps réel des sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // 1. Sessions actives
    const { data: activeSessions, error: activeError } = await supabase
      .from('openai_realtime_sessions')
      .select('session_id, session_started_at, last_activity_at')
      .is('session_ended_at', null)

    if (activeError) throw activeError

    // 2. Sessions aujourd'hui
    const { data: todaySessions, error: todayError } = await supabase
      .from('openai_realtime_sessions')
      .select('session_id, session_started_at, session_ended_at, total_user_turns, total_ai_turns')
      .gte('session_started_at', today.toISOString())

    if (todayError) throw todayError

    // 3. Sessions cette semaine
    const { data: weekSessions, error: weekError } = await supabase
      .from('openai_realtime_sessions')
      .select('session_id, session_started_at, session_ended_at, total_user_turns, total_ai_turns')
      .gte('session_started_at', weekAgo.toISOString())

    if (weekError) throw weekError

    // 4. Événements récents (dernière heure)
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const { data: recentEvents, error: eventsError } = await supabase
      .from('openai_realtime_audio_events')
      .select('event_type, event_timestamp, session_id')
      .gte('event_timestamp', hourAgo.toISOString())

    if (eventsError) throw eventsError

    // 5. Calculer les statistiques
    const stats = {
      // Sessions actives
      active_sessions: activeSessions?.length || 0,
      
      // Sessions aujourd'hui
      today_sessions: todaySessions?.length || 0,
      today_completed: todaySessions?.filter(s => s.session_ended_at).length || 0,
      today_total_turns: todaySessions?.reduce((sum, s) => sum + (s.total_user_turns || 0) + (s.total_ai_turns || 0), 0) || 0,
      
      // Sessions cette semaine
      week_sessions: weekSessions?.length || 0,
      week_completed: weekSessions?.filter(s => s.session_ended_at).length || 0,
      week_total_turns: weekSessions?.reduce((sum, s) => sum + (s.total_user_turns || 0) + (s.total_ai_turns || 0), 0) || 0,
      
      // Événements récents
      recent_events: recentEvents?.length || 0,
      recent_user_messages: recentEvents?.filter(e => e.event_type === 'user_transcript').length || 0,
      recent_jarvis_responses: recentEvents?.filter(e => e.event_type === 'jarvis_transcript').length || 0,
      
      // Moyennes
      avg_turns_per_session_today: todaySessions?.length > 0 
        ? Math.round((todaySessions.reduce((sum, s) => sum + (s.total_user_turns || 0) + (s.total_ai_turns || 0), 0)) / todaySessions.length)
        : 0,
      
      avg_turns_per_session_week: weekSessions?.length > 0
        ? Math.round((weekSessions.reduce((sum, s) => sum + (s.total_user_turns || 0) + (s.total_ai_turns || 0), 0)) / weekSessions.length)
        : 0,
      
      // Durées moyennes (sessions terminées aujourd'hui)
      avg_duration_today: todaySessions?.filter(s => s.session_ended_at).length > 0
        ? Math.round(
            todaySessions
              .filter(s => s.session_ended_at)
              .reduce((sum, s) => {
                const duration = (new Date(s.session_ended_at!).getTime() - new Date(s.session_started_at).getTime()) / 1000
                return sum + duration
              }, 0) / todaySessions.filter(s => s.session_ended_at).length
          )
        : 0,
      
      // Sessions par heure (dernières 24h)
      hourly_distribution: Array.from({ length: 24 }, (_, hour) => {
        const hourStart = new Date(today)
        hourStart.setHours(hour, 0, 0, 0)
        const hourEnd = new Date(hourStart)
        hourEnd.setHours(hour + 1, 0, 0, 0)
        
        const count = todaySessions?.filter(s => {
          const sessionTime = new Date(s.session_started_at)
          return sessionTime >= hourStart && sessionTime < hourEnd
        }).length || 0
        
        return { hour, count }
      }),
      
      // Top gyms (cette semaine)
      top_gyms: [] // À implémenter si nécessaire
    }

    // 6. Détails des sessions actives
    const activeSessionsDetails = activeSessions?.map(session => {
      const lastActivity = new Date(session.last_activity_at)
      const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
      
      return {
        session_id: session.session_id,
        started_at: session.session_started_at,
        last_activity: session.last_activity_at,
        inactive_minutes: Math.round(inactiveMinutes),
        status: inactiveMinutes > 5 ? 'inactive' : 'active'
      }
    }) || []

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
      active_sessions_details: activeSessionsDetails,
      recent_events_sample: recentEvents?.slice(0, 10) || []
    })

  } catch (error: any) {
    console.error('❌ [ADMIN STATS] Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
