import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
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
    const { memberId } = params
    
    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'manager') {
      return NextResponse.json({ error: 'Accès refusé - Role manager requis' }, { status: 403 })
    }

    // Récupérer les détails du membre
    const { data: member, error: memberError } = await supabase
      .from('gym_members')
      .select(`
        *,
        gyms!inner(
          id,
          name,
          manager_id
        )
      `)
      .eq('id', memberId)
      .eq('gyms.manager_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Membre non trouvé ou accès refusé' }, { status: 404 })
    }

    // Récupérer l'historique des conversations (30 derniers jours)
    const { data: conversations, error: conversationsError } = await supabase
      .from('jarvis_conversation_logs')
      .select(`
        id,
        session_id,
        timestamp,
        speaker,
        message_text,
        detected_intent,
        sentiment_score,
        emotion_detected,
        topic_category,
        mentioned_equipment,
        mentioned_activities,
        contains_complaint,
        contains_feedback,
        user_engagement_level,
        conversation_turn_number
      `)
      .eq('member_id', memberId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(500) // Limiter pour éviter les gros volumes

    if (conversationsError) {
      console.error('❌ Erreur récupération conversations:', conversationsError)
      return NextResponse.json({ error: 'Erreur récupération conversations' }, { status: 500 })
    }

    // Grouper les conversations par session
    const conversationsBySession = (conversations || []).reduce((acc, conv) => {
      if (!acc[conv.session_id]) {
        acc[conv.session_id] = []
      }
      acc[conv.session_id].push(conv)
      return acc
    }, {} as Record<string, any[]>)

    // Calculer les statistiques
    const totalSessions = Object.keys(conversationsBySession).length
    const totalMessages = conversations?.length || 0
    const userMessages = conversations?.filter(c => c.speaker === 'user').length || 0
    const jarvisMessages = conversations?.filter(c => c.speaker === 'jarvis').length || 0
    
    // Sentiment moyen
    const sentimentScores = conversations?.filter(c => c.sentiment_score !== null).map(c => c.sentiment_score) || []
    const avgSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
      : null

    // Intents les plus fréquents
    const intents = conversations?.filter(c => c.detected_intent).map(c => c.detected_intent) || []
    const intentCounts = intents.reduce((acc, intent) => {
      acc[intent] = (acc[intent] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topIntents = Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }))

    // Équipements mentionnés
    const allEquipment = conversations?.flatMap(c => c.mentioned_equipment || []) || []
    const equipmentCounts = allEquipment.reduce((acc, eq) => {
      acc[eq] = (acc[eq] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topEquipment = Object.entries(equipmentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([equipment, count]) => ({ equipment, count }))

    return NextResponse.json({
      success: true,
      member: {
        ...member,
        stats: {
          total_sessions_30d: totalSessions,
          total_messages_30d: totalMessages,
          user_messages_30d: userMessages,
          jarvis_messages_30d: jarvisMessages,
          avg_sentiment_30d: avgSentiment,
          top_intents: topIntents,
          top_equipment: topEquipment,
          last_conversation_at: conversations?.[0]?.timestamp || null
        }
      },
      conversations: conversations || [],
      conversationsBySession
    })

  } catch (error) {
    console.error('❌ Erreur API détail membre:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
