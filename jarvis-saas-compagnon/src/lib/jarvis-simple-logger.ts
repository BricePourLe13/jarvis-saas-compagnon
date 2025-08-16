/**
 * 💬 JARVIS SIMPLE LOGGER
 * Version simplifiée pour MVP - focus sur l'essentiel
 */

import { getSupabaseSingleton } from './supabase-singleton'

export interface SimpleLogEntry {
  session_id: string
  member_id?: string
  gym_id?: string
  speaker: 'user' | 'jarvis'
  message_text: string
  turn_number: number
  timestamp?: Date
}

class JarvisSimpleLogger {
  private static instance: JarvisSimpleLogger
  private supabase = getSupabaseSingleton()
  private turnCounters = new Map<string, number>() // sessionId -> turnNumber
  
  static getInstance(): JarvisSimpleLogger {
    if (!JarvisSimpleLogger.instance) {
      JarvisSimpleLogger.instance = new JarvisSimpleLogger()
    }
    return JarvisSimpleLogger.instance
  }

  /**
   * 📝 Logger une interaction (version simple)
   */
  async logMessage(entry: SimpleLogEntry): Promise<boolean> {
    try {
      // Incrémenter le compteur de tour
      const currentTurn = this.turnCounters.get(entry.session_id) || 0
      const nextTurn = currentTurn + 1
      this.turnCounters.set(entry.session_id, nextTurn)

      // Analyse simple du message
      const analysis = this.simpleAnalysis(entry.message_text, entry.speaker)

      // 🎯 CONSOLE DEBUG COMPLET POUR TESTS
      console.log('🎤 [JARVIS LOGGER] ===== NOUVELLE INTERACTION =====')
      console.log('👤 Qui parle:', entry.speaker === 'user' ? '🗣️ UTILISATEUR' : '🤖 JARVIS')
      console.log('💬 Message:', `"${entry.message_text}"`)
      console.log('🔄 Tour:', nextTurn)
      console.log('🎯 Intent détecté:', analysis.detected_intent || 'non_défini')
      console.log('😊 Sentiment:', analysis.sentiment_score || 'neutre')
      console.log('📂 Catégorie:', analysis.topic_category || 'général')
      console.log('⚡ Engagement:', analysis.user_engagement_level || 'normal')
      if (analysis.mentioned_equipment?.length > 0) {
        console.log('🏋️ Équipements mentionnés:', analysis.mentioned_equipment)
      }
      if (analysis.mentioned_activities?.length > 0) {
        console.log('🏃 Activités mentionnées:', analysis.mentioned_activities)
      }
      if (analysis.contains_complaint) {
        console.log('⚠️ ALERTE: Plainte détectée!')
      }
      if (analysis.contains_feedback) {
        console.log('💭 Feedback détecté')
      }
      console.log('📅 Session ID:', entry.session_id)
      console.log('==================================================')

      const { error } = await this.supabase
        .from('jarvis_conversation_logs')
        .insert({
          session_id: entry.session_id,
          member_id: entry.member_id,
          gym_id: entry.gym_id,
          speaker: entry.speaker,
          message_text: entry.message_text,
          conversation_turn_number: nextTurn,
          timestamp: entry.timestamp?.toISOString() || new Date().toISOString(),
          
          // Analyse simple
          detected_intent: analysis.detected_intent,
          sentiment_score: analysis.sentiment_score,
          topic_category: analysis.topic_category,
          mentioned_equipment: analysis.mentioned_equipment || [],
          mentioned_activities: analysis.mentioned_activities || [],
          contains_complaint: analysis.contains_complaint || false,
          contains_feedback: analysis.contains_feedback || false,
          needs_human_review: analysis.needs_human_review || false,
          user_engagement_level: analysis.user_engagement_level
        })

      if (error) {
        console.error('❌ [JARVIS LOGGER] ERREUR BDD:', error)
        console.error('❌ Données tentées:', { entry, analysis })
        return false
      }

      console.log('✅ [JARVIS LOGGER] Message sauvé en BDD avec succès!')
      console.log('') // Ligne vide pour séparer les interactions
      return true

    } catch (error) {
      console.error('💥 [JARVIS SIMPLE LOGGER] Exception:', error)
      return false
    }
  }

  /**
   * 🔍 Analyse simple du message (MVP)
   */
  private simpleAnalysis(message: string, speaker: 'user' | 'jarvis') {
    const analysis: any = {}
    const lower = message.toLowerCase()

    if (speaker === 'user') {
      // Intent basique
      if (lower.includes('heure') || lower.includes('ouvert')) {
        analysis.detected_intent = 'question_hours'
        analysis.topic_category = 'schedule'
      } else if (lower.includes('problème') || lower.includes('marche pas')) {
        analysis.detected_intent = 'equipment_issue'
        analysis.topic_category = 'equipment'
        analysis.contains_complaint = true
        analysis.needs_human_review = true
      } else if (lower.includes('objectif') || lower.includes('but')) {
        analysis.detected_intent = 'goal_discussion'
        analysis.topic_category = 'motivation'
      } else if (lower.includes('merci') || lower.includes('super')) {
        analysis.detected_intent = 'positive_feedback'
        analysis.contains_feedback = true
        analysis.sentiment_score = 0.8
      } else if (lower.includes('nul') || lower.includes('pas bien')) {
        analysis.detected_intent = 'negative_feedback'
        analysis.contains_feedback = true
        analysis.contains_complaint = true
        analysis.sentiment_score = -0.6
        analysis.needs_human_review = true
      }

      // Équipements mentionnés
      const equipment = []
      if (lower.includes('tapis')) equipment.push('treadmill')
      if (lower.includes('vélo')) equipment.push('bike')
      if (lower.includes('poids')) equipment.push('weights')
      if (equipment.length > 0) analysis.mentioned_equipment = equipment

      // Activités mentionnées
      const activities = []
      if (lower.includes('cardio')) activities.push('cardio')
      if (lower.includes('musculation')) activities.push('strength')
      if (lower.includes('course')) activities.push('running')
      if (activities.length > 0) analysis.mentioned_activities = activities

      // Engagement
      if (message.length > 30) {
        analysis.user_engagement_level = 'high'
      } else if (message.length > 10) {
        analysis.user_engagement_level = 'medium'
      } else {
        analysis.user_engagement_level = 'low'
      }
    }

    return analysis
  }

  /**
   * 🏁 Nettoyer les données de session
   */
  clearSession(sessionId: string) {
    this.turnCounters.delete(sessionId)
    console.log('🧹 [JARVIS SIMPLE LOGGER] Session nettoyée:', sessionId)
  }

  /**
   * 📊 Stats rapides pour un membre
   */
  async getQuickStats(memberId: string, days: number = 7) {
    try {
      const { data } = await this.supabase
        .from('jarvis_conversation_logs')
        .select('detected_intent, sentiment_score, contains_complaint')
        .eq('member_id', memberId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (!data) return null

      const totalInteractions = data.length
      const complaints = data.filter(d => d.contains_complaint).length
      const avgSentiment = data
        .filter(d => d.sentiment_score !== null)
        .reduce((sum, d) => sum + (d.sentiment_score || 0), 0) / data.length

      return {
        total_interactions: totalInteractions,
        complaints_count: complaints,
        avg_sentiment: avgSentiment,
        engagement_level: totalInteractions > 20 ? 'high' : totalInteractions > 5 ? 'medium' : 'low'
      }
    } catch (error) {
      console.error('❌ [JARVIS SIMPLE LOGGER] Erreur stats:', error)
      return null
    }
  }
}

export const simpleLogger = JarvisSimpleLogger.getInstance()
export default simpleLogger
