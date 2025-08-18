/**
 * 🧠 API CONTEXTE MEMBRE ENRICHI
 * Récupère TOUT le contexte disponible sur un membre pour JARVIS
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { simpleLogger } from '@/lib/jarvis-simple-logger'

interface MemberContextParams {
  params: Promise<{
    slug: string
    badgeId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: MemberContextParams
) {
  try {
    const { slug, badgeId } = await params

    console.log('🧠 [MEMBER CONTEXT] Récupération contexte pour:', badgeId)

    // 1. Initialiser Supabase
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

    // 2. Trouver la salle
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('kiosk_config->kiosk_url_slug', slug)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({
        found: false,
        error: 'Salle introuvable'
      }, { status: 404 })
    }

    // 3. Récupérer le membre avec TOUTES les données
    const { data: member, error: memberError } = await supabase
      .from('gym_members')
      .select(`
        id,
        badge_id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
        profile_photo_url,
        
        -- Membership
        membership_type,
        member_since,
        membership_expires,
        
        -- Fitness profil
        fitness_level,
        fitness_goals,
        target_weight_kg,
        current_weight_kg,
        height_cm,
        
        -- Préférences workout
        preferred_workout_times,
        workout_frequency_per_week,
        preferred_workout_duration,
        favorite_equipment,
        avoided_equipment,
        
        -- Santé
        dietary_restrictions,
        allergies,
        medical_conditions,
        
        -- Mental & social
        motivation_type,
        workout_style,
        social_preference,
        music_preferences,
        coaching_interest,
        
        -- Stats comportementales
        avg_session_duration_minutes,
        favorite_visit_days,
        peak_visit_hours,
        consistency_score,
        engagement_level,
        
        -- Profil conversationnel
        communication_style,
        conversation_topics_of_interest,
        jarvis_interaction_frequency,
        preferred_feedback_style,
        
        -- Objectifs
        current_goals,
        completed_goals,
        goal_achievement_rate,
        
        -- Méta
        profile_completeness_percent,
        jarvis_personalization_score,
        
        -- Stats de base
        total_visits,
        last_visit,
        is_active,
        can_use_jarvis
      `)
      .eq('badge_id', badgeId)
      .eq('gym_id', gym.id)
      .eq('is_active', true)
      .single()

    if (memberError || !member) {
      console.warn(`Badge ${badgeId} non trouvé:`, memberError)
      return NextResponse.json({
        found: false,
        error: 'Badge non reconnu'
      }, { status: 404 })
    }

    // 4. Récupérer l'historique des conversations récentes
    const { data: recentConversations } = await supabase
      .from('jarvis_conversation_logs')
      .select(`
        timestamp,
        speaker,
        message_text,
        detected_intent,
        sentiment_score,
        topic_category,
        mentioned_equipment,
        mentioned_activities,
        mentioned_goals
      `)
      .eq('member_id', member.id)
      .order('timestamp', { ascending: false })
      .limit(20)

    // 5. Récupérer les stats de conversation
    const conversationStats = await simpleLogger.getQuickStats(member.id, 30)

    // 6. Calculer des insights contextuels
    const contextualInsights = generateContextualInsights(member, recentConversations || [])

    // 7. Mettre à jour la dernière visite
    await supabase
      .from('gym_members')
      .update({
        last_visit: new Date().toISOString(),
        total_visits: (member.total_visits || 0) + 1
      })
      .eq('id', member.id)

    console.log('✅ [MEMBER CONTEXT] Contexte complet récupéré')

    return NextResponse.json({
      found: true,
      member: {
        // Données de base
        ...member,
        
        // Contexte enrichi
        recent_conversations: recentConversations || [],
        conversation_stats: conversationStats,
        contextual_insights: contextualInsights,
        
        // Meta contexte
        context_generated_at: new Date().toISOString(),
        gym_info: {
          id: gym.id,
          name: gym.name
        }
      }
    })

  } catch (error) {
    console.error('💥 [MEMBER CONTEXT] Exception:', error)
    return NextResponse.json({
      found: false,
      error: 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * 🎯 Générer des insights contextuels pour JARVIS
 */
function generateContextualInsights(member: any, conversations: any[]) {
  const insights = {
    personality_profile: generatePersonalityProfile(member, conversations),
    conversation_style: generateConversationStyle(member, conversations),
    current_focus: generateCurrentFocus(member, conversations),
    recommendations: generateRecommendations(member, conversations),
    alerts: generateAlerts(member, conversations)
  }

  return insights
}

function generatePersonalityProfile(member: any, conversations: any[]) {
  const profile = {
    social_level: member.social_preference || 'mixed',
    communication_style: member.communication_style || 'friendly',
    motivation_type: member.motivation_type || 'health',
    engagement_level: member.engagement_level || 'new'
  }

  // Ajuster selon les conversations récentes
  const recentEngagement = conversations.filter(c => 
    c.speaker === 'user' && c.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  ).length

  if (recentEngagement > 15) profile.engagement_level = 'enthusiast'
  else if (recentEngagement > 5) profile.engagement_level = 'regular'

  return profile
}

function generateConversationStyle(member: any, conversations: any[]) {
  const style = {
    preferred_topics: member.conversation_topics_of_interest || ['motivation'],
    interaction_frequency: member.jarvis_interaction_frequency || 'normal',
    feedback_style: member.preferred_feedback_style || 'encouraging',
    typical_session_length: member.avg_session_duration_minutes || 60
  }

  // Analyser les sujets récents
  const recentTopics = conversations
    .filter(c => c.topic_category)
    .map(c => c.topic_category)
    .slice(0, 10)

  const topicFrequency = recentTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  style.preferred_topics = Object.keys(topicFrequency)
    .sort((a, b) => topicFrequency[b] - topicFrequency[a])
    .slice(0, 3)

  return style
}

function generateCurrentFocus(member: any, conversations: any[]) {
  const focus = {
    primary_goals: member.current_goals || member.fitness_goals || [],
    recent_interests: [],
    equipment_preferences: member.favorite_equipment || [],
    current_challenges: []
  }

  // Analyser les mentions récentes d'équipements et activités
  const recentMentions = conversations
    .filter(c => c.mentioned_equipment?.length > 0 || c.mentioned_activities?.length > 0)
    .slice(0, 5)

  const equipment = recentMentions.flatMap(c => c.mentioned_equipment || [])
  const activities = recentMentions.flatMap(c => c.mentioned_activities || [])

  focus.recent_interests = [...new Set([...equipment, ...activities])]

  // Détecter les défis récents (plaintes, problèmes)
  const challenges = conversations
    .filter(c => c.detected_intent?.includes('issue') || c.contains_complaint)
    .slice(0, 3)
    .map(c => c.message_text?.substring(0, 100))

  focus.current_challenges = challenges

  return focus
}

function generateRecommendations(member: any, conversations: any[]) {
  const recommendations = []

  // Recommandations basées sur le niveau de fitness
  if (member.fitness_level === 'beginner') {
    recommendations.push({
      type: 'workout',
      priority: 'high',
      message: 'Commencer par des exercices de base et du cardio léger'
    })
  }

  // Recommandations basées sur les objectifs
  if (member.fitness_goals?.includes('lose_weight')) {
    recommendations.push({
      type: 'cardio',
      priority: 'medium',
      message: 'Augmenter les séances de cardio à 3-4 fois par semaine'
    })
  }

  // Recommandations basées sur la consistance
  if (member.consistency_score < 0.5) {
    recommendations.push({
      type: 'motivation',
      priority: 'high',
      message: 'Proposer un planning plus régulier et des objectifs atteignables'
    })
  }

  return recommendations
}

function generateAlerts(member: any, conversations: any[]) {
  const alerts = []

  // Alerte engagement faible
  const recentComplaints = conversations.filter(c => c.contains_complaint).length
  if (recentComplaints > 2) {
    alerts.push({
      type: 'engagement',
      severity: 'medium',
      message: 'Plusieurs plaintes récentes détectées'
    })
  }

  // Alerte sentiment négatif
  const avgSentiment = conversations
    .filter(c => c.sentiment_score !== null)
    .reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / conversations.length

  if (avgSentiment < -0.3) {
    alerts.push({
      type: 'satisfaction',
      severity: 'high',
      message: 'Sentiment généralement négatif dans les conversations'
    })
  }

  return alerts
}

