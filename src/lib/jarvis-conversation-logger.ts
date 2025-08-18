/**
 * 💬 JARVIS CONVERSATION LOGGER
 * Service pour logger toutes les interactions en temps réel
 */

import { getSupabaseSingleton } from './supabase-singleton'

export interface ConversationLogEntry {
  session_id: string
  member_id?: string
  gym_id: string
  speaker: 'user' | 'jarvis'
  message_text: string
  conversation_turn_number: number
  
  // Optionnel - analyse IA
  detected_intent?: string
  sentiment_score?: number
  emotion_detected?: string
  topic_category?: string
  confidence_score?: number
  
  // Entités extraites
  mentioned_equipment?: string[]
  mentioned_activities?: string[]
  mentioned_goals?: string[]
  mentioned_issues?: string[]
  
  // Flags
  requires_follow_up?: boolean
  contains_feedback?: boolean
  contains_complaint?: boolean
  contains_goal_update?: boolean
  needs_human_review?: boolean
  
  // Métriques
  response_time_ms?: number
  user_engagement_level?: 'low' | 'medium' | 'high'
}

export interface SessionMetrics {
  total_exchanges: number
  user_initiated_topics: number
  jarvis_suggestions_accepted: number
  avg_sentiment_score: number
  high_engagement: boolean
  contained_complaint: boolean
  showed_interest_in_services: boolean
  potential_churn_signals: boolean
}

class JarvisConversationLogger {
  private static instance: JarvisConversationLogger
  private supabase = getSupabaseSingleton()
  
  // Cache pour les métriques de session en cours
  private sessionMetrics = new Map<string, SessionMetrics>()
  
  static getInstance(): JarvisConversationLogger {
    if (!JarvisConversationLogger.instance) {
      JarvisConversationLogger.instance = new JarvisConversationLogger()
    }
    return JarvisConversationLogger.instance
  }

  /**
   * 📝 Logger une interaction en temps réel
   */
  async logInteraction(entry: ConversationLogEntry): Promise<boolean> {
    try {
      console.log('📝 [JARVIS LOGGER] Nouvelle interaction:', {
        session: entry.session_id,
        speaker: entry.speaker,
        turn: entry.conversation_turn_number,
        intent: entry.detected_intent
      })

      const { error } = await this.supabase
        .from('jarvis_conversation_logs')
        .insert({
          session_id: entry.session_id,
          member_id: entry.member_id,
          gym_id: entry.gym_id,
          speaker: entry.speaker,
          message_text: entry.message_text,
          conversation_turn_number: entry.conversation_turn_number,
          detected_intent: entry.detected_intent,
          sentiment_score: entry.sentiment_score,
          emotion_detected: entry.emotion_detected,
          topic_category: entry.topic_category,
          confidence_score: entry.confidence_score,
          mentioned_equipment: entry.mentioned_equipment || [],
          mentioned_activities: entry.mentioned_activities || [],
          mentioned_goals: entry.mentioned_goals || [],
          mentioned_issues: entry.mentioned_issues || [],
          requires_follow_up: entry.requires_follow_up || false,
          contains_feedback: entry.contains_feedback || false,
          contains_complaint: entry.contains_complaint || false,
          contains_goal_update: entry.contains_goal_update || false,
          needs_human_review: entry.needs_human_review || false,
          response_time_ms: entry.response_time_ms,
          user_engagement_level: entry.user_engagement_level
        })

      if (error) {
        console.error('❌ [JARVIS LOGGER] Erreur insertion:', error)
        return false
      }

      // Mettre à jour les métriques de session
      await this.updateSessionMetrics(entry)
      
      // Analyser si on doit déclencher des actions automatiques
      await this.analyzeForActions(entry)

      console.log('✅ [JARVIS LOGGER] Interaction loggée avec succès')
      return true

    } catch (error) {
      console.error('💥 [JARVIS LOGGER] Exception:', error)
      return false
    }
  }

  /**
   * 🎯 Analyser l'intent et les entités d'un message
   * Simple MVP - on peut brancher du NLP plus tard
   */
  analyzeMessage(message: string, speaker: 'user' | 'jarvis'): Partial<ConversationLogEntry> {
    const analysis: Partial<ConversationLogEntry> = {}
    const lowerMessage = message.toLowerCase()

    // Intent detection basique
    if (speaker === 'user') {
      if (lowerMessage.includes('heure') || lowerMessage.includes('ouvert') || lowerMessage.includes('ferme')) {
        analysis.detected_intent = 'question_hours'
        analysis.topic_category = 'schedule'
      } else if (lowerMessage.includes('problème') || lowerMessage.includes('marche pas') || lowerMessage.includes('cassé')) {
        analysis.detected_intent = 'equipment_issue'
        analysis.topic_category = 'equipment'
        analysis.contains_complaint = true
        analysis.needs_human_review = true
      } else if (lowerMessage.includes('objectif') || lowerMessage.includes('but') || lowerMessage.includes('veux')) {
        analysis.detected_intent = 'goal_discussion'
        analysis.topic_category = 'motivation'
        analysis.contains_goal_update = true
      } else if (lowerMessage.includes('merci') || lowerMessage.includes('super') || lowerMessage.includes('parfait')) {
        analysis.detected_intent = 'positive_feedback'
        analysis.contains_feedback = true
        analysis.sentiment_score = 0.8
      } else if (lowerMessage.includes('nul') || lowerMessage.includes('pas bien') || lowerMessage.includes('déçu')) {
        analysis.detected_intent = 'negative_feedback'
        analysis.contains_feedback = true
        analysis.contains_complaint = true
        analysis.sentiment_score = -0.6
        analysis.needs_human_review = true
      }

      // Détection d'équipements mentionnés
      const equipment = []
      if (lowerMessage.includes('tapis')) equipment.push('treadmill')
      if (lowerMessage.includes('vélo')) equipment.push('bike')
      if (lowerMessage.includes('poids') || lowerMessage.includes('haltère')) equipment.push('weights')
      if (lowerMessage.includes('rameur')) equipment.push('rowing')
      if (equipment.length > 0) analysis.mentioned_equipment = equipment

      // Détection d'activités
      const activities = []
      if (lowerMessage.includes('cardio')) activities.push('cardio')
      if (lowerMessage.includes('musculation')) activities.push('strength')
      if (lowerMessage.includes('course')) activities.push('running')
      if (lowerMessage.includes('yoga')) activities.push('yoga')
      if (activities.length > 0) analysis.mentioned_activities = activities

      // Engagement level basique
      if (message.length > 50 && (lowerMessage.includes('?') || analysis.detected_intent)) {
        analysis.user_engagement_level = 'high'
      } else if (message.length > 20) {
        analysis.user_engagement_level = 'medium'
      } else {
        analysis.user_engagement_level = 'low'
      }
    }

    return analysis
  }

  /**
   * 📊 Mettre à jour les métriques de session
   */
  private async updateSessionMetrics(entry: ConversationLogEntry) {
    const sessionId = entry.session_id
    let metrics = this.sessionMetrics.get(sessionId)

    if (!metrics) {
      metrics = {
        total_exchanges: 0,
        user_initiated_topics: 0,
        jarvis_suggestions_accepted: 0,
        avg_sentiment_score: 0,
        high_engagement: false,
        contained_complaint: false,
        showed_interest_in_services: false,
        potential_churn_signals: false
      }
    }

    // Mise à jour
    metrics.total_exchanges++
    
    if (entry.speaker === 'user') {
      if (entry.user_engagement_level === 'high') {
        metrics.high_engagement = true
      }
      if (entry.contains_complaint) {
        metrics.contained_complaint = true
      }
      if (entry.sentiment_score && entry.sentiment_score < -0.5) {
        metrics.potential_churn_signals = true
      }
    }

    // Sauvegarder en cache
    this.sessionMetrics.set(sessionId, metrics)
  }

  /**
   * 🎬 Finaliser une session et créer les analytics
   */
  async finalizeSession(sessionId: string, memberId?: string): Promise<void> {
    try {
      const metrics = this.sessionMetrics.get(sessionId)
      if (!metrics || !memberId) return

      // Récupérer infos de session
      const { data: sessionInfo } = await this.supabase
        .from('openai_realtime_sessions')
        .select('gym_id, session_started_at, session_ended_at')
        .eq('session_id', sessionId)
        .single()

      if (!sessionInfo) return

      // Calculer durée
      const start = new Date(sessionInfo.session_started_at)
      const end = sessionInfo.session_ended_at ? new Date(sessionInfo.session_ended_at) : new Date()
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000)

      // Calculer sentiment moyen
      const { data: logs } = await this.supabase
        .from('jarvis_conversation_logs')
        .select('sentiment_score')
        .eq('session_id', sessionId)
        .not('sentiment_score', 'is', null)

      const avgSentiment = logs?.length > 0 
        ? logs.reduce((sum, log) => sum + (log.sentiment_score || 0), 0) / logs.length 
        : 0

      // Créer l'analytics record
      await this.supabase
        .from('member_session_analytics')
        .insert({
          member_id: memberId,
          session_id: sessionId,
          session_date: start.toISOString().split('T')[0],
          session_start: sessionInfo.session_started_at,
          session_end: sessionInfo.session_ended_at,
          duration_minutes: durationMinutes,
          total_exchanges: metrics.total_exchanges,
          user_initiated_topics: metrics.user_initiated_topics,
          jarvis_suggestions_accepted: metrics.jarvis_suggestions_accepted,
          avg_sentiment_score: avgSentiment,
          high_engagement: metrics.high_engagement,
          contained_complaint: metrics.contained_complaint,
          showed_interest_in_services: metrics.showed_interest_in_services,
          potential_churn_signals: metrics.potential_churn_signals
        })

      // Nettoyer le cache
      this.sessionMetrics.delete(sessionId)

      console.log('📊 [JARVIS LOGGER] Session analytics créées:', sessionId)

    } catch (error) {
      console.error('❌ [JARVIS LOGGER] Erreur finalisation session:', error)
    }
  }

  /**
   * 🚨 Analyser pour déclencher des actions automatiques
   */
  private async analyzeForActions(entry: ConversationLogEntry) {
    // Si plainte détectée, créer une action pour le manager
    if (entry.contains_complaint && entry.member_id) {
      try {
        await this.supabase
          .from('manager_actions')
          .insert({
            gym_id: entry.gym_id,
            title: `Plainte adhérent détectée`,
            type: 'complaint_follow_up',
            state: 'pending'
          })
        
        console.log('🚨 [JARVIS LOGGER] Action manager créée pour plainte')
      } catch (error) {
        console.error('❌ [JARVIS LOGGER] Erreur création action:', error)
      }
    }

    // Si objectif mentionné, trigger une mise à jour potentielle du profil
    if (entry.contains_goal_update && entry.mentioned_goals?.length > 0) {
      // TODO: Déclencher mise à jour profil membre
      console.log('🎯 [JARVIS LOGGER] Objectifs détectés, mise à jour profil nécessaire')
    }
  }

  /**
   * 📈 Récupérer les stats de conversation pour un membre
   */
  async getMemberConversationStats(memberId: string, days: number = 30) {
    try {
      const { data: stats } = await this.supabase
        .from('jarvis_conversation_logs')
        .select(`
          detected_intent,
          sentiment_score,
          topic_category,
          contains_complaint,
          contains_feedback,
          user_engagement_level
        `)
        .eq('member_id', memberId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      return stats || []
    } catch (error) {
      console.error('❌ [JARVIS LOGGER] Erreur récupération stats:', error)
      return []
    }
  }
}

export const jarvisLogger = JarvisConversationLogger.getInstance()
export default jarvisLogger

