import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 🔧 FIX: Utiliser le client serveur avec cookies pour l'auth
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
    
    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Vérification de l'authentification
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Non autorisé', 
        details: authError?.message || 'Utilisateur non connecté' 
      }, { status: 401 })
    }

    // Récupérer la salle du gérant
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Vérifier le profil utilisateur
    
    if (profileError) {
      // Erreur lors de la récupération du profil utilisateur
      return NextResponse.json({ error: 'Erreur récupération profil utilisateur' }, { status: 500 })
    }
    
    // 🔧 TEMP: Permettre tous les rôles admin pour debug
    const allowedRoles = ['manager', 'super_admin', 'franchise_admin', 'franchise_owner', 'gym_manager', 'gym_staff']
    if (!userProfile?.role || !allowedRoles.includes(userProfile.role)) {
      return NextResponse.json({ 
        error: `Accès refusé - Role autorisé requis. Role actuel: ${userProfile?.role}` 
      }, { status: 403 })
    }

    // 🔒 ISOLATION CRITIQUE: Déterminer gym_id selon le rôle
    const { searchParams } = new URL(request.url)
    const gymIdParam = searchParams.get('gymId')
    
    let gymId = gymIdParam || ''
    const isAdmin = ['super_admin', 'franchise_owner', 'franchise_admin'].includes(userProfile.role)
    
    if (!isAdmin) {
      // Manager/Staff ne peut voir QUE sa gym
      const { data: myGym } = await supabase
        .from('gyms')
        .select('id')
        .eq('manager_id', user.id)
        .maybeSingle()
      
      if (!myGym) {
        return NextResponse.json({ 
          error: 'Aucune salle assignée à ce manager' 
        }, { status: 403 })
      }
      gymId = myGym.id
    }
    
    if (!gymId) {
      return NextResponse.json({ 
        error: 'gymId requis pour ce rôle' 
      }, { status: 400 })
    }

    // Accès aux membres avec isolation par gym

    // 🔒 FIX CRITIQUE: Filtrer par gym_id pour isolation stricte
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
        gym_id
      `)
      .eq('is_active', true)
      .eq('gym_id', gymId)
      .order('last_visit', { ascending: false })
      .limit(20)

    if (membersError) {
      // Erreur lors de la récupération des membres
      return NextResponse.json({ error: 'Erreur récupération membres' }, { status: 500 })
    }

    // Récupérer les infos gyms séparément (workaround relation cassée)
    const gymIds = [...new Set(members?.map(m => m.gym_id) || [])]
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, name, manager_id')
      .in('id', gymIds)
    
    // Mapper les gyms aux membres
    const gymsMap = (gyms || []).reduce((acc, gym) => {
      acc[gym.id] = gym
      return acc
    }, {})

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
        gym: gymsMap[member.gym_id] || null, // Ajouter les infos gym
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
    // Log supprimé pour production
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
