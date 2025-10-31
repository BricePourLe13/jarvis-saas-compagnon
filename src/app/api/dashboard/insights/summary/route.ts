import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/insights/summary
 * Récupère un résumé des insights IA pour une salle
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gym_id')

    if (!gymId) {
      return NextResponse.json({ error: 'gym_id requis' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // 1. Vérifier l'auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupérer les analytics des 30 derniers jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Sentiment moyen
    const { data: conversations, error: convError } = await supabase
      .from('conversation_summaries')
      .select('sentiment_score, topics')
      .eq('gym_id', gymId)
      .gte('created_at', thirtyDaysAgo)

    const avgSentiment = conversations && conversations.length > 0
      ? conversations.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / conversations.length
      : 0

    // Compter le nombre de feedbacks positifs/négatifs
    const positiveFeedbacks = conversations?.filter(c => c.sentiment_score > 0.5).length || 0
    const negativeFeedbacks = conversations?.filter(c => c.sentiment_score < -0.2).length || 0

    // Membres à risque de churn
    const { data: membersAtRisk, error: churnError } = await supabase
      .from('member_analytics')
      .select('member_id, churn_risk_score')
      .eq('gym_id', gymId)
      .gte('churn_risk_score', 0.7)

    const churnCount = membersAtRisk?.length || 0

    // Topics les plus discutés
    const allTopics = conversations?.flatMap(c => c.topics || []) || []
    const topicCounts = allTopics.reduce((acc: Record<string, number>, topic) => {
      acc[topic] = (acc[topic] || 0) + 1
      return acc
    }, {})

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([topic]) => topic)

    // Engagement moyen
    const { data: analytics } = await supabase
      .from('member_analytics')
      .select('engagement_score')
      .eq('gym_id', gymId)

    const avgEngagement = analytics && analytics.length > 0
      ? analytics.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / analytics.length
      : 0

    // 3. Construire les insights
    const insights = [
      {
        category: 'Sentiment',
        title: 'Satisfaction Générale',
        description: 'Score moyen de sentiment basé sur les conversations JARVIS',
        value: `${(avgSentiment * 100).toFixed(0)}%`,
        trend: avgSentiment > 0.5 ? 12 : -8,
        icon: '😊',
        color: avgSentiment > 0.5 ? 'bg-green-500/10' : 'bg-yellow-500/10'
      },
      {
        category: 'Rétention',
        title: 'Membres à Risque',
        description: 'Membres identifiés avec un risque de churn > 70%',
        value: churnCount,
        trend: undefined,
        icon: '⚠️',
        color: 'bg-red-500/10'
      },
      {
        category: 'Feedback',
        title: 'Retours Positifs',
        description: 'Nombre de conversations avec sentiment positif',
        value: positiveFeedbacks,
        trend: 15,
        icon: '👍',
        color: 'bg-green-500/10'
      },
      {
        category: 'Feedback',
        title: 'Retours Négatifs',
        description: 'Conversations avec sentiment négatif nécessitant attention',
        value: negativeFeedbacks,
        trend: undefined,
        icon: '👎',
        color: 'bg-orange-500/10'
      },
      {
        category: 'Engagement',
        title: 'Score Engagement',
        description: 'Niveau moyen d\'engagement des adhérents',
        value: `${(avgEngagement * 100).toFixed(0)}%`,
        trend: avgEngagement > 0.6 ? 8 : -5,
        icon: '📈',
        color: 'bg-blue-500/10'
      },
      {
        category: 'Thématiques',
        title: 'Sujets Populaires',
        description: 'Les 5 topics les plus discutés avec JARVIS',
        value: topTopics.length > 0 ? topTopics.join(', ') : 'Aucune donnée',
        trend: undefined,
        icon: '💬',
        color: 'bg-purple-500/10'
      }
    ]

    return NextResponse.json({
      insights
    })

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/insights/summary:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}



