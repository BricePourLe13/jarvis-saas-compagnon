import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * API ROUTE : /api/dashboard/overview/alerts
 * Retourne les alertes pour la page Overview
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
      const { data: allGyms } = await supabase
        .from('gyms')
        .select('id')
      gymIds = allGyms?.map(g => g.id) || []
    } else if (userProfile.role === 'franchise_owner' || userProfile.role === 'franchise_admin') {
      if (userProfile.franchise_id) {
        const { data: franchiseGyms } = await supabase
          .from('gyms')
          .select('id')
          .eq('franchise_id', userProfile.franchise_id)
        gymIds = franchiseGyms?.map(g => g.id) || []
      }
    } else if (userProfile.role === 'manager' || userProfile.role === 'staff') {
      if (userProfile.gym_id) {
        gymIds = [userProfile.gym_id]
      }
    }

    if (gymIds.length === 0) {
      return NextResponse.json({ alerts: [] })
    }

    // 4. Générer des alertes basées sur les données réelles
    const alerts = []

    // ALERTE 1 : Membres à risque de churn (inactifs depuis 14+ jours)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { count: inactiveMembers } = await supabase
      .from('gym_members_v2')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .eq('is_active', true)
      .or(`last_visit.is.null,last_visit.lt.${fourteenDaysAgo.toISOString()}`)

    if (inactiveMembers && inactiveMembers > 0) {
      alerts.push({
        id: 'churn-risk',
        type: 'warning' as const,
        priority: 'high' as const,
        title: `${inactiveMembers} membre${inactiveMembers > 1 ? 's' : ''} à risque de churn`,
        description: `${inactiveMembers} membre${inactiveMembers > 1 ? 's n\'ont' : ' n\'a'} pas visité depuis 14 jours`,
        action: {
          label: 'Voir les membres',
          href: '/dashboard/members-v2?filter=inactive'
        }
      })
    }

    // ALERTE 2 : Membres sans session JARVIS
    const { count: membersWithoutSession } = await supabase
      .from('gym_members_v2')
      .select(`
        id,
        openai_realtime_sessions(id)
      `, { count: 'exact', head: true })
      .in('gym_id', gymIds)
      .eq('is_active', true)
      .is('openai_realtime_sessions.id', null)

    if (membersWithoutSession && membersWithoutSession > 5) {
      alerts.push({
        id: 'no-jarvis-usage',
        type: 'info' as const,
        priority: 'medium' as const,
        title: `${membersWithoutSession} membres n'ont jamais utilisé JARVIS`,
        description: 'Opportunité d\'engagement et d\'onboarding',
        action: {
          label: 'Envoyer invitation',
          href: '/dashboard/members-v2?filter=no-jarvis'
        }
      })
    }

    // ALERTE 3 : Prédiction de fréquentation (mock pour l'instant)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayOfWeek = tomorrow.getDay()
    
    // Samedi (6) et Dimanche (0) généralement plus fréquentés
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      alerts.push({
        id: 'peak-prediction',
        type: 'info' as const,
        priority: 'low' as const,
        title: 'Pic de fréquentation prévu demain',
        description: `${dayOfWeek === 6 ? 'Samedi' : 'Dimanche'} - Affluence estimée +40%`,
        action: {
          label: 'Voir prévisions',
          href: '/dashboard/analytics-v2'
        }
      })
    }

    return NextResponse.json({ alerts })

  } catch (error) {
    console.error('[API] Erreur alerts overview:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

