/**
 * 📖 API CONSULTATION CONVERSATIONS
 * Récupérer l'historique des conversations d'une session
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = getSupabaseService()

    // Récupérer les conversations de la session
    const { data: conversations, error } = await supabase
      .from('jarvis_conversation_logs')
      .select(`
        id,
        timestamp,
        speaker,
        message_text,
        conversation_turn_number,
        confidence_score,
        detected_intent,
        sentiment_score,
        emotion_detected,
        topic_category,
        mentioned_equipment,
        mentioned_activities,
        mentioned_goals,
        mentioned_issues,
        response_time_ms,
        user_engagement_level,
        requires_follow_up,
        contains_feedback,
        contains_complaint,
        contains_goal_update,
        needs_human_review
      `)
      .eq('session_id', sessionId)
      .order('conversation_turn_number', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ [API CONV] Erreur récupération:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur récupération conversations' },
        { status: 500 }
      )
    }

    // Calculer les statistiques de la conversation
    const stats = {
      total_messages: conversations?.length || 0,
      user_messages: conversations?.filter(c => c.speaker === 'user').length || 0,
      jarvis_messages: conversations?.filter(c => c.speaker === 'jarvis').length || 0,
      avg_response_time: 0,
      avg_sentiment: 0,
      topics: [] as string[],
      engagement_levels: {} as Record<string, number>
    }

    if (conversations && conversations.length > 0) {
      // Temps de réponse moyen
      const responseTimes = conversations
        .filter(c => c.response_time_ms)
        .map(c => c.response_time_ms)
      
      if (responseTimes.length > 0) {
        stats.avg_response_time = Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        )
      }

      // Sentiment moyen
      const sentiments = conversations
        .filter(c => c.sentiment_score !== null)
        .map(c => c.sentiment_score)
      
      if (sentiments.length > 0) {
        stats.avg_sentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      }

      // Topics uniques
      stats.topics = [...new Set(
        conversations
          .filter(c => c.topic_category)
          .map(c => c.topic_category)
      )]

      // Niveaux d'engagement
      conversations.forEach(c => {
        if (c.user_engagement_level) {
          stats.engagement_levels[c.user_engagement_level] = 
            (stats.engagement_levels[c.user_engagement_level] || 0) + 1
        }
      })
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      conversations: conversations || [],
      stats,
      pagination: {
        offset,
        limit,
        total: conversations?.length || 0
      }
    })

  } catch (error: any) {
    console.error('❌ [API CONV] Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

