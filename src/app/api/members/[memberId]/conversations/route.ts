/**
 * 👤 API CONVERSATIONS MEMBRE
 * Récupérer l'historique complet des conversations d'un adhérent
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const days = parseInt(searchParams.get('days') || '30') // Derniers X jours

    const supabase = getSupabaseService()

    // Date limite
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - days)

    // Récupérer les conversations du membre
    const { data: conversations, error } = await supabase
      .from('jarvis_conversation_logs')
      .select(`
        id,
        session_id,
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
      .eq('member_id', memberId)
      .gte('timestamp', dateLimit.toISOString())
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ [API MEMBER CONV] Erreur récupération:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur récupération conversations membre' },
        { status: 500 }
      )
    }

    // Grouper par session
    const conversationsBySession = (conversations || []).reduce((acc, conv) => {
      if (!acc[conv.session_id]) {
        acc[conv.session_id] = []
      }
      acc[conv.session_id].push(conv)
      return acc
    }, {} as Record<string, any[]>)

    // Calculer les statistiques globales
    const stats = {
      total_sessions: Object.keys(conversationsBySession).length,
      total_messages: conversations?.length || 0,
      user_messages: conversations?.filter(c => c.speaker === 'user').length || 0,
      jarvis_messages: conversations?.filter(c => c.speaker === 'jarvis').length || 0,
      avg_messages_per_session: 0,
      avg_response_time: 0,
      avg_sentiment: 0,
      most_discussed_topics: [] as Array<{ topic: string; count: number }>,
      engagement_distribution: {} as Record<string, number>,
      feedback_count: 0,
      complaints_count: 0,
      follow_ups_needed: 0,
      human_review_needed: 0
    }

    if (conversations && conversations.length > 0) {
      // Messages par session
      stats.avg_messages_per_session = stats.total_sessions > 0 
        ? Math.round(stats.total_messages / stats.total_sessions) 
        : 0

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

      // Topics les plus discutés
      const topicCounts = {} as Record<string, number>
      conversations.forEach(c => {
        if (c.topic_category) {
          topicCounts[c.topic_category] = (topicCounts[c.topic_category] || 0) + 1
        }
      })
      
      stats.most_discussed_topics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Distribution d'engagement
      conversations.forEach(c => {
        if (c.user_engagement_level) {
          stats.engagement_distribution[c.user_engagement_level] = 
            (stats.engagement_distribution[c.user_engagement_level] || 0) + 1
        }
      })

      // Compteurs spéciaux
      stats.feedback_count = conversations.filter(c => c.contains_feedback).length
      stats.complaints_count = conversations.filter(c => c.contains_complaint).length
      stats.follow_ups_needed = conversations.filter(c => c.requires_follow_up).length
      stats.human_review_needed = conversations.filter(c => c.needs_human_review).length
    }

    // Récupérer les infos du membre
    const { data: member } = await supabase
      .from('gym_members')
      .select('first_name, last_name, badge_id')
      .eq('id', memberId)
      .single()

    return NextResponse.json({
      success: true,
      member_id: memberId,
      member_info: member,
      period_days: days,
      conversations: conversations || [],
      conversations_by_session: conversationsBySession,
      stats,
      pagination: {
        offset,
        limit,
        total: conversations?.length || 0
      }
    })

  } catch (error: any) {
    console.error('❌ [API MEMBER CONV] Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
