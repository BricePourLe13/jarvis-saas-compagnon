import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService()
    
    const audit = {
      timestamp: new Date().toISOString(),
      tables: {},
      inconsistencies: [],
      recommendations: []
    }

    // 1. Audit jarvis_conversation_logs
    const { data: conversations, error: convError } = await supabase
      .from('jarvis_conversation_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (!convError) {
      audit.tables.jarvis_conversation_logs = {
        total_count: conversations?.length || 0,
        last_24h: conversations?.filter(c => new Date(c.timestamp) > new Date(Date.now() - 24*60*60*1000)).length || 0,
        recent_sessions: [...new Set(conversations?.slice(0, 10).map(c => c.session_id))],
        speakers: conversations?.reduce((acc, c) => {
          acc[c.speaker] = (acc[c.speaker] || 0) + 1
          return acc
        }, {}) || {}
      }
    }

    // 2. Audit openai_realtime_sessions  
    const { data: sessions, error: sessError } = await supabase
      .from('openai_realtime_sessions')
      .select('*')
      .order('session_started_at', { ascending: false })
      .limit(50)

    if (!sessError) {
      audit.tables.openai_realtime_sessions = {
        total_count: sessions?.length || 0,
        active_sessions: sessions?.filter(s => !s.session_ended_at).length || 0,
        last_24h: sessions?.filter(s => new Date(s.session_started_at) > new Date(Date.now() - 24*60*60*1000)).length || 0,
        avg_duration: sessions?.filter(s => s.session_ended_at).reduce((sum, s) => {
          const duration = new Date(s.session_ended_at).getTime() - new Date(s.session_started_at).getTime()
          return sum + duration / 1000
        }, 0) / Math.max(1, sessions?.filter(s => s.session_ended_at).length || 1) || 0,
        total_cost: sessions?.reduce((sum, s) => sum + (s.total_cost_usd || 0), 0) || 0
      }
    }

    // 3. Audit gym_members
    const { data: members, error: membError } = await supabase
      .from('gym_members_v2')
      .select('*')
      .limit(50)

    if (!membError) {
      audit.tables.gym_members_v2 = {
        total_count: members?.length || 0,
        active_members: members?.filter(m => m.is_active).length || 0,
        can_use_jarvis: members?.filter(m => m.can_use_jarvis).length || 0,
        recent_visits: members?.filter(m => m.last_visit && new Date(m.last_visit) > new Date(Date.now() - 7*24*60*60*1000)).length || 0
      }
    }

    // 4. Audit gyms
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('*')

    if (!gymsError) {
      audit.tables.gyms = {
        total_count: gyms?.length || 0,
        active_gyms: gyms?.filter(g => g.status === 'active').length || 0,
        with_manager: gyms?.filter(g => g.manager_id).length || 0,
        with_kiosk_config: gyms?.filter(g => g.kiosk_config).length || 0
      }
    }

    // 5. Détection d'incohérences
    if (conversations && sessions) {
      // Sessions dans conversations mais pas dans realtime_sessions
      const convSessionIds = new Set(conversations.map(c => c.session_id))
      const realtimeSessionIds = new Set(sessions.map(s => s.session_id))
      
      const orphanConversations = [...convSessionIds].filter(id => !realtimeSessionIds.has(id))
      if (orphanConversations.length > 0) {
        audit.inconsistencies.push({
          type: 'orphan_conversations',
          count: orphanConversations.length,
          description: 'Conversations sans sessions OpenAI correspondantes',
          sample: orphanConversations.slice(0, 3)
        })
      }
    }

    // 6. Recommandations
    if (audit.tables.jarvis_conversation_logs?.total_count === 0) {
      audit.recommendations.push({
        priority: 'HIGH',
        issue: 'Aucune conversation loggée',
        solution: 'Console interceptor ne fonctionne pas - ordre avec log cleaner'
      })
    }

    if (audit.tables.openai_realtime_sessions?.active_sessions > 10) {
      audit.recommendations.push({
        priority: 'MEDIUM', 
        issue: 'Trop de sessions actives',
        solution: 'Implémenter nettoyage automatique des sessions fantômes'
      })
    }

    return NextResponse.json({
      success: true,
      audit
    })

  } catch (error: any) {
    // Log supprimé pour production
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
