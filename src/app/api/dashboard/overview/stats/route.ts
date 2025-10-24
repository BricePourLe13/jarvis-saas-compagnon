import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * API ROUTE : /api/dashboard/overview/stats
 * Retourne les métriques pour la page Overview
 * Isolation par gym_id selon le rôle
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, gym_id, franchise_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Profil utilisateur introuvable' },
        { status: 404 }
      )
    }

    // 3. Déterminer le scope selon le rôle
    let gymIds: string[] = []
    
    if (userProfile.role === 'super_admin') {
      // Super admin : toutes les salles
      const { data: allGyms } = await supabase
        .from('gyms')
        .select('id')
      
      gymIds = allGyms?.map(g => g.id) || []
    } else if (userProfile.role === 'franchise_owner' || userProfile.role === 'franchise_admin') {
      // Franchise : toutes les salles de la franchise
      if (userProfile.franchise_id) {
        const { data: franchiseGyms } = await supabase
          .from('gyms')
          .select('id')
          .eq('franchise_id', userProfile.franchise_id)
        
        gymIds = franchiseGyms?.map(g => g.id) || []
      }
    } else if (userProfile.role === 'manager' || userProfile.role === 'staff') {
      // Manager/Staff : uniquement sa salle
      if (userProfile.gym_id) {
        gymIds = [userProfile.gym_id]
      }
    }

    if (gymIds.length === 0) {
      return NextResponse.json({
        membres_actifs: 0,
        sessions_mensuelles: 0,
        revenus_mensuels: 0,
        taux_retention: 0,
        trends: {
          membres: 0,
          sessions: 0,
          revenus: 0,
          retention: 0
        }
      })
    }

    // 4. Calculer les métriques
    const now = new Date()
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Membres actifs (ce mois)
    const { count: membresActifs } = await supabase
      .from('gym_members_v2')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .eq('is_active', true)

    // Membres actifs mois dernier (pour trend)
    const { count: membresLastMonth } = await supabase
      .from('gym_members_v2')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .eq('is_active', true)
      .lte('created_at', lastDayLastMonth.toISOString())

    // Sessions ce mois
    const { count: sessionsCount } = await supabase
      .from('openai_realtime_sessions')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .gte('session_start', firstDayCurrentMonth.toISOString())

    // Sessions mois dernier
    const { count: sessionsLastMonth } = await supabase
      .from('openai_realtime_sessions')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .gte('session_start', firstDayLastMonth.toISOString())
      .lte('session_start', lastDayLastMonth.toISOString())

    // Revenus (simulé - à adapter selon votre modèle)
    // Ex: 50€ par membre actif par mois
    const revenusEstimes = (membresActifs || 0) * 50
    const revenusLastMonthEstimes = (membresLastMonth || 0) * 50

    // Taux de rétention (membres qui ont fait une session dans les 30 derniers jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activeMembersWithSessions } = await supabase
      .from('gym_members_v2')
      .select(`
        id,
        openai_realtime_sessions!inner(id)
      `)
      .in('gym_id', gymIds)
      .eq('is_active', true)
      .gte('openai_realtime_sessions.session_start', thirtyDaysAgo.toISOString())

    const membresAvecActivite = new Set(activeMembersWithSessions?.map(m => m.id) || []).size
    const tauxRetention = membresActifs ? Math.round((membresAvecActivite / membresActifs) * 100) : 0

    // Calculer trends (pourcentage de changement)
    const trendMembres = membresLastMonth 
      ? Math.round(((membresActifs || 0) - membresLastMonth) / membresLastMonth * 100)
      : 0

    const trendSessions = sessionsLastMonth
      ? Math.round(((sessionsCount || 0) - sessionsLastMonth) / sessionsLastMonth * 100)
      : 0

    const trendRevenus = revenusLastMonthEstimes
      ? Math.round((revenusEstimes - revenusLastMonthEstimes) / revenusLastMonthEstimes * 100)
      : 0

    // 5. Retourner les métriques
    return NextResponse.json({
      membres_actifs: membresActifs || 0,
      sessions_mensuelles: sessionsCount || 0,
      revenus_mensuels: revenusEstimes,
      taux_retention: tauxRetention,
      trends: {
        membres: trendMembres,
        sessions: trendSessions,
        revenus: trendRevenus,
        retention: 0 // TODO: calculer trend retention
      }
    })

  } catch (error) {
    console.error('[API] Erreur stats overview:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

