import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/franchises/[id]
 * Récupère les détails d'une franchise avec ses salles
 * Réservé aux super_admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const franchiseId = resolvedParams.id
    
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

    // 4. Récupérer la franchise
    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .select('*')
      .eq('id', franchiseId)
      .single()

    if (franchiseError || !franchise) {
      return NextResponse.json({ error: 'Franchise introuvable' }, { status: 404 })
    }

    // 5. Récupérer les salles de la franchise
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id, name, city, status, created_at')
      .eq('franchise_id', franchiseId)
      .order('name')

    if (gymsError) {
      console.error('[API] Error fetching gyms:', gymsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des salles' }, { status: 500 })
    }

    // 6. Pour chaque salle, compter membres et kiosks
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
          ...gym,
          total_kiosks: kiosksCount || 0,
          total_members: membersCount || 0
        }
      })
    )

    return NextResponse.json({
      ...franchise,
      gyms: gymsWithStats
    })

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/admin/franchises/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}


