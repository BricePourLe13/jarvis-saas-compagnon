import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * API ROUTE : /api/dashboard/members-v2
 * Retourne la liste des membres avec filtres
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

    // 3. Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'all', 'active', 'inactive', 'churn-risk'
    const search = searchParams.get('search') // recherche par nom/email/badge
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 4. Déterminer le scope selon le rôle
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
      return NextResponse.json({ members: [], total: 0 })
    }

    // 5. Construire la query de base
    let query = supabase
      .from('gym_members_v2')
      .select(`
        id,
        badge_id,
        first_name,
        last_name,
        email,
        phone,
        membership_type,
        is_active,
        last_visit,
        total_visits,
        member_since,
        membership_expires,
        gyms(name)
      `, { count: 'exact' })
      .in('gym_id', gymIds)
      .order('created_at', { ascending: false })

    // 6. Appliquer les filtres
    if (filter === 'active') {
      query = query.eq('is_active', true)
    } else if (filter === 'inactive') {
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      query = query
        .eq('is_active', true)
        .or(`last_visit.is.null,last_visit.lt.${fourteenDaysAgo.toISOString()}`)
    } else if (filter === 'churn-risk') {
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      query = query
        .eq('is_active', true)
        .or(`last_visit.is.null,last_visit.lt.${fourteenDaysAgo.toISOString()}`)
    }

    // 7. Recherche textuelle
    if (search && search.trim()) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,badge_id.ilike.%${search}%`)
    }

    // 8. Pagination
    query = query.range(offset, offset + limit - 1)

    // 9. Exécuter la query
    const { data: members, error, count } = await query

    if (error) {
      console.error('[API] Erreur query members:', error)
      return NextResponse.json(
        { error: 'Erreur récupération membres' },
        { status: 500 }
      )
    }

    // 10. Enrichir les données (calculer churn risk)
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        // Calculer le churn risk
        let churnRisk: 'low' | 'medium' | 'high' = 'low'
        
        if (member.last_visit) {
          const daysSinceVisit = Math.floor(
            (Date.now() - new Date(member.last_visit).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (daysSinceVisit > 21) churnRisk = 'high'
          else if (daysSinceVisit > 14) churnRisk = 'medium'
        } else {
          churnRisk = 'high' // Jamais venu
        }

        return {
          ...member,
          churnRisk,
          gym_name: member.gyms?.name || 'N/A'
        }
      })
    )

    return NextResponse.json({
      members: enrichedMembers,
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('[API] Erreur members-v2:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

