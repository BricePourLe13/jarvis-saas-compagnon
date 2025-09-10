/**
 * 📊 API RÉSUMÉ DE SESSION
 * Consulter le résumé complet d'une session avec événements et conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const supabase = getSupabaseService()

    // 1. Récupérer les infos de session
    const { data: sessionInfo, error: sessionError } = await supabase
      .from('openai_realtime_sessions')
      .select(`
        session_id,
        gym_id,
        member_id,
        session_started_at,
        session_ended_at,
        total_user_turns,
        total_ai_turns,
        end_reason,
        ai_model,
        voice_model,
        gyms(name),
        gym_members(first_name, last_name, badge_id)
      `)
      .eq('session_id', sessionId)
      .single()

    if (sessionError || !sessionInfo) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // 2. Récupérer les événements Realtime
    const { data: events, error: eventsError } = await supabase
      .from('openai_realtime_audio_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('event_timestamp')

    // 3. Récupérer les conversations loggées (si disponibles)
    const { data: conversations, error: convError } = await supabase
      .from('jarvis_conversation_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('conversation_turn_number')

    // 4. Analyser les événements pour créer un résumé
    const userTranscripts = events?.filter(e => e.event_type === 'user_transcript' && e.user_transcript) || []
    const jarvisTranscripts = events?.filter(e => e.event_type === 'jarvis_transcript' && e.jarvis_transcript) || []
    
    const speechEvents = events?.filter(e => 
      e.event_type === 'user_speech_start' || 
      e.event_type === 'user_speech_end'
    ) || []

    // 5. Calculer les statistiques
    const duration = sessionInfo.session_ended_at && sessionInfo.session_started_at
      ? Math.round((new Date(sessionInfo.session_ended_at).getTime() - new Date(sessionInfo.session_started_at).getTime()) / 1000)
      : null

    const stats = {
      duration_seconds: duration,
      total_events: events?.length || 0,
      user_messages: userTranscripts.length,
      jarvis_responses: jarvisTranscripts.length,
      speech_events: speechEvents.length,
      conversation_turns: Math.max(sessionInfo.total_user_turns || 0, sessionInfo.total_ai_turns || 0),
      end_reason: sessionInfo.end_reason
    }

    // 6. Créer la timeline des interactions
    const timeline = events?.map(event => ({
      timestamp: event.event_timestamp,
      type: event.event_type,
      content: event.user_transcript || event.jarvis_transcript || null,
      turn_number: event.turn_number
    })) || []

    // 7. Résumé de la conversation
    const conversationSummary = {
      user_messages: userTranscripts.map(e => ({
        timestamp: e.event_timestamp,
        message: e.user_transcript,
        turn: e.turn_number
      })),
      jarvis_responses: jarvisTranscripts.map(e => ({
        timestamp: e.event_timestamp,
        message: e.jarvis_transcript,
        turn: e.turn_number
      }))
    }

    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionId,
        member: {
          name: `${sessionInfo.gym_members?.first_name} ${sessionInfo.gym_members?.last_name}`,
          badge_id: sessionInfo.gym_members?.badge_id
        },
        gym: {
          name: sessionInfo.gyms?.name
        },
        started_at: sessionInfo.session_started_at,
        ended_at: sessionInfo.session_ended_at,
        ai_model: sessionInfo.ai_model,
        voice_model: sessionInfo.voice_model
      },
      stats,
      timeline,
      conversation_summary,
      raw_events: events || [],
      logged_conversations: conversations || []
    })

  } catch (error: any) {
    console.error('❌ [SESSION SUMMARY] Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
