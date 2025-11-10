import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/gyms
 * Liste toutes les salles avec leurs stats
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

    // 4. Récupérer toutes les salles (MVP)
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        city,
        address,
        postal_code,
        status,
        legacy_franchise_name,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (gymsError) {
      console.error('[API] Error fetching gyms:', gymsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des salles' }, { status: 500 })
    }

    // 5. Pour chaque gym, récupérer le nombre de kiosks et membres
    const gymsWithStats = await Promise.all(
      (gyms || []).map(async (gym: any) => {
        // Compter les kiosks
        const { count: kiosksCount } = await supabase
          .from('kiosks')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', gym.id)

        // Compter les membres
        const { count: membersCount } = await supabase
          .from('gym_members')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', gym.id)

        return {
          id: gym.id,
          name: gym.name,
          city: gym.city,
          address: gym.address,
          postal_code: gym.postal_code,
          status: gym.status,
          legacy_franchise_name: gym.legacy_franchise_name,
          total_kiosks: kiosksCount || 0,
          total_members: membersCount || 0,
          created_at: gym.created_at
        }
      })
    )

    // 6. Calculer métriques globales
    const metrics = {
      totalGyms: gymsWithStats.length,
      activeGyms: gymsWithStats.filter(g => g.status === 'active').length,
      suspendedGyms: gymsWithStats.filter(g => g.status === 'suspended').length,
      totalMembers: gymsWithStats.reduce((sum, g) => sum + g.total_members, 0)
    }

    return NextResponse.json({
      gyms: gymsWithStats,
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


