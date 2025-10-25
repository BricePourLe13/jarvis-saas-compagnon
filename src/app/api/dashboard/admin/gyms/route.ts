import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/gyms
 * Liste toutes les salles de sport avec métriques
 * Réservé aux super_admin
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

    // 3. Vérifier permissions super_admin
    if (userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé - Super admin requis' }, { status: 403 })
    }

    // 4. Récupérer toutes les salles avec leurs franchises
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        city,
        address,
        postal_code,
        status,
        franchise_id,
        created_at,
        franchises!inner(id, name)
      `)
      .order('created_at', { ascending: false })

    if (gymsError) {
      console.error('[API] Error fetching gyms:', gymsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des salles' }, { status: 500 })
    }

    // 5. Enrichir avec le nombre de kiosks et membres pour chaque gym
    const enrichedGyms = await Promise.all(
      (gyms || []).map(async (gym: any) => {
        // Compter les kiosks
        const { count: kiosksCount } = await supabase
          .from('kiosks')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', gym.id)

        // Compter les membres actifs
        const { count: membersCount } = await supabase
          .from('gym_members_v2')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', gym.id)
          .eq('is_active', true)

        return {
          ...gym,
          franchise_name: gym.franchises?.name || 'N/A',
          total_kiosks: kiosksCount || 0,
          total_members: membersCount || 0
        }
      })
    )

    // 6. Calculer métriques globales
    const metrics = {
      totalGyms: enrichedGyms.length,
      activeGyms: enrichedGyms.filter(g => g.status === 'active').length,
      suspendedGyms: enrichedGyms.filter(g => g.status === 'suspended').length,
      totalMembers: enrichedGyms.reduce((sum, g) => sum + g.total_members, 0)
    }

    return NextResponse.json({
      gyms: enrichedGyms,
      metrics
    })

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/admin/gyms:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

