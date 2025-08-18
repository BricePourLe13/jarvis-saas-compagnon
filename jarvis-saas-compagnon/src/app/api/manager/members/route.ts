import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseSingleton()
    
    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer la salle du gérant
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'manager') {
      return NextResponse.json({ error: 'Accès refusé - Role manager requis' }, { status: 403 })
    }

    // Récupérer les membres de la salle du gérant
    const { data: members, error: membersError } = await supabase
      .from('gym_members')
      .select(`
        id,
        badge_id,
        first_name,
        last_name,
        email,
        membership_type,
        is_active,
        total_visits,
        last_visit,
        engagement_level,
        jarvis_personalization_score,
        created_at,
        gym_id,
        gyms!inner(
          id,
          name,
          manager_id
        )
      `)
      .eq('gyms.manager_id', user.id)
      .eq('is_active', true)
      .order('last_visit', { ascending: false })

    if (membersError) {
      console.error('❌ Erreur récupération membres:', membersError)
      return NextResponse.json({ error: 'Erreur récupération membres' }, { status: 500 })
    }

    // Récupérer les statistiques de conversations récentes pour chaque membre
    const memberIds = members?.map(m => m.id) || []
    
    let conversationStats = []
    if (memberIds.length > 0) {
      const { data: stats } = await supabase
        .from('jarvis_conversation_logs')
        .select(`
          member_id,
          session_id,
          timestamp,
          speaker,
          detected_intent,
          sentiment_score
        `)
        .in('member_id', memberIds)
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 derniers jours
        .order('timestamp', { ascending: false })

      conversationStats = stats || []
    }

    // Calculer les métriques par membre
    const membersWithStats = members?.map(member => {
      const memberConversations = conversationStats.filter(c => c.member_id === member.id)
      const sessions = [...new Set(memberConversations.map(c => c.session_id))]
      const lastConversation = memberConversations[0]
      
      // Calculer sentiment moyen
      const sentimentScores = memberConversations
        .filter(c => c.sentiment_score !== null)
        .map(c => c.sentiment_score)
      const avgSentiment = sentimentScores.length > 0 
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
        : null

      return {
        ...member,
        conversation_stats: {
          total_sessions_7d: sessions.length,
          total_messages_7d: memberConversations.length,
          last_conversation_at: lastConversation?.timestamp || null,
          avg_sentiment_7d: avgSentiment,
          last_intent: lastConversation?.detected_intent || null
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      members: membersWithStats,
      total: membersWithStats.length
    })

  } catch (error) {
    console.error('❌ Erreur API membres:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
