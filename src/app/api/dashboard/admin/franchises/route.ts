import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/franchises
 * Récupère la liste des franchises (super_admin uniquement)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
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

    // 2. Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profil utilisateur introuvable' }, { status: 404 })
    }

    // 3. Vérifier le rôle super_admin
    if (userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 4. Récupérer toutes les franchises
    const { data: franchises, error: franchisesError } = await supabase
      .from('franchises')
      .select('*')
      .order('name', { ascending: true })

    if (franchisesError) {
      console.error('[API] Error fetching franchises:', franchisesError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des franchises' }, { status: 500 })
    }

    // 5. Pour chaque franchise, récupérer le nombre de gyms et membres
    const franchisesWithStats = await Promise.all(
      (franchises || []).map(async (franchise) => {
        // Compter les gyms
        const { count: gymsCount } = await supabase
          .from('gyms')
          .select('*', { count: 'exact', head: true })
          .eq('franchise_id', franchise.id)

        // Compter les membres (via gym_members_v2)
        const { data: gyms } = await supabase
          .from('gyms')
          .select('id')
          .eq('franchise_id', franchise.id)

        let membersCount = 0
        if (gyms && gyms.length > 0) {
          const gymIds = gyms.map(g => g.id)
          const { count } = await supabase
            .from('gym_members_v2')
            .select('*', { count: 'exact', head: true })
            .in('gym_id', gymIds)
          
          membersCount = count || 0
        }

        return {
          id: franchise.id,
          name: franchise.name,
          city: franchise.city,
          country: franchise.country || 'France',
          status: franchise.status || 'active',
          total_gyms: gymsCount || 0,
          total_members: membersCount,
          created_at: franchise.created_at
        }
      })
    )

    // 6. Calculer les métriques globales
    const totalFranchises = franchisesWithStats.length
    const activeFranchises = franchisesWithStats.filter(f => f.status === 'active').length
    const totalGyms = franchisesWithStats.reduce((sum, f) => sum + f.total_gyms, 0)
    const totalMembers = franchisesWithStats.reduce((sum, f) => sum + f.total_members, 0)

    return NextResponse.json({
      franchises: franchisesWithStats,
      metrics: {
        totalFranchises,
        activeFranchises,
        totalGyms,
        totalMembers
      }
    })
  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/admin/franchises:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

