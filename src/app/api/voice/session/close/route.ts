/**
 * 🔚 API VOICE SESSION CLOSE
 * Fermeture propre de session + calcul coûts finaux
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'
import { simpleLogger } from '@/lib/jarvis-simple-logger'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason = 'user_request' } = await request.json()
    
    console.log('🔚 [SESSION CLOSE] Fermeture session:', { sessionId, reason })

    const supabase = getSupabaseSingleton()

    // 1. Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('openai_realtime_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('❌ [SESSION CLOSE] Session introuvable:', sessionError)
      return NextResponse.json({
        error: 'Session introuvable'
      }, { status: 404 })
    }

    // 2. Calculer durée et coûts finaux
    const endTime = new Date()
    const startTime = new Date(session.session_started_at)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = Math.round(durationMs / 60000)

    // Coût estimé basique (à affiner)
    const estimatedCost = (durationMinutes * 0.02) + (session.total_user_turns * 0.01)

    // 3. Mettre à jour la session
    const { error: updateError } = await supabase
      .from('openai_realtime_sessions')
      .update({
        session_ended_at: endTime.toISOString(),
        session_duration_minutes: durationMinutes,
        session_end_reason: reason,
        total_cost_usd: estimatedCost,
        session_metadata: {
          ...session.session_metadata,
          status: 'completed',
          end_reason: reason,
          final_cost_calculated: true
        }
      })
      .eq('session_id', sessionId)

    if (updateError) {
      console.error('❌ [SESSION CLOSE] Erreur mise à jour:', updateError)
    }

    // 4. Finaliser les analytics de conversation si membre connecté
    if (session.member_id) {
      try {
        await finalizeConversationAnalytics(supabase, session, durationMinutes)
      } catch (error) {
        console.error('❌ [SESSION CLOSE] Erreur analytics:', error)
      }
    }

    console.log('✅ [SESSION CLOSE] Session fermée avec succès')

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      duration_minutes: durationMinutes,
      estimated_cost: estimatedCost,
      reason
    })

  } catch (error) {
    console.error('💥 [SESSION CLOSE] Exception:', error)
    return NextResponse.json({
      error: 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * 📊 Finaliser les analytics de conversation
 */
async function finalizeConversationAnalytics(supabase: any, session: any, durationMinutes: number) {
  // Récupérer toutes les conversations de cette session
  const { data: conversations } = await supabase
    .from('jarvis_conversation_logs')
    .select('*')
    .eq('session_id', session.session_id)
    .order('conversation_turn_number', { ascending: true })

  if (!conversations || conversations.length === 0) {
    console.log('📊 [ANALYTICS] Aucune conversation à analyser')
    return
  }

  // Calculer les métriques
  const totalExchanges = conversations.length
  const userMessages = conversations.filter(c => c.speaker === 'user')
  const jarvisMessages = conversations.filter(c => c.speaker === 'jarvis')
  
  // Sentiment moyen (si disponible)
  const sentimentScores = conversations
    .filter(c => c.sentiment_score !== null)
    .map(c => c.sentiment_score)
  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
    : 0

  // Détecter les indicateurs importants
  const containedComplaint = conversations.some(c => c.contains_complaint)
  const showedInterestInServices = conversations.some(c => 
    c.detected_intent?.includes('service') || c.detected_intent?.includes('coaching')
  )
  const highEngagement = userMessages.length > 10 || durationMinutes > 15
  const potentialChurnSignals = avgSentiment < -0.3 || containedComplaint

  // Extraire les nouveaux insights
  const newGoalsMentioned = conversations
    .flatMap(c => c.mentioned_goals || [])
    .filter((goal, index, array) => array.indexOf(goal) === index)

  const newPreferencesDiscovered = conversations
    .flatMap(c => c.mentioned_equipment || [])
    .filter((equipment, index, array) => array.indexOf(equipment) === index)

  const issuesReported = conversations
    .filter(c => c.contains_complaint || c.detected_intent?.includes('issue'))
    .map(c => c.message_text?.substring(0, 100))

  // Créer l'enregistrement analytics
  await supabase
    .from('member_session_analytics')
    .insert({
      member_id: session.member_id,
      session_id: session.session_id,
      session_date: session.session_started_at.split('T')[0],
      session_start: session.session_started_at,
      session_end: new Date().toISOString(),
      duration_minutes: durationMinutes,
      total_exchanges: totalExchanges,
      user_initiated_topics: userMessages.length,
      jarvis_suggestions_accepted: 0, // À implémenter plus tard
      avg_sentiment_score: avgSentiment,
      new_preferences_discovered: newPreferencesDiscovered,
      goals_mentioned: newGoalsMentioned,
      issues_reported: issuesReported,
      satisfaction_indicators: conversations
        .filter(c => c.contains_feedback && c.sentiment_score > 0.3)
        .map(c => c.detected_intent),
      high_engagement: highEngagement,
      contained_complaint: containedComplaint,
      showed_interest_in_services: showedInterestInServices,
      potential_churn_signals: potentialChurnSignals
    })

  console.log('📊 [ANALYTICS] Analytics session créées:', {
    totalExchanges,
    avgSentiment,
    highEngagement,
    containedComplaint
  })
}

