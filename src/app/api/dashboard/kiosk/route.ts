import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/kiosk
 * Récupère la liste des kiosks avec filtrage selon le rôle utilisateur
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
      .select('id, role, gym_id, franchise_id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profil utilisateur introuvable' }, { status: 404 })
    }

    // 3. Construire la query avec filtrage RLS
    const { searchParams } = new URL(request.url)
    const gymIdFilter = searchParams.get('gym_id')

    let query = supabase
      .from('kiosks')
      .select(`
        id,
        gym_id,
        slug,
        name,
        status,
        last_heartbeat,
        version,
        device_info,
        gyms!inner(id, name)
      `)
      .order('name', { ascending: true })

    // Filtrage selon le rôle
    if (userProfile.role === 'gym_manager' && userProfile.gym_id) {
      // Gym manager: voir uniquement les kiosks de sa salle
      query = query.eq('gym_id', userProfile.gym_id)
    } else if (userProfile.role === 'franchise_owner' && userProfile.franchise_id) {
      // Franchise owner: voir les kiosks de toutes ses salles
      query = query.eq('gyms.franchise_id', userProfile.franchise_id)
      
      // Si un gym_id spécifique est demandé, le filtrer
      if (gymIdFilter) {
        query = query.eq('gym_id', gymIdFilter)
      }
    } else if (userProfile.role === 'super_admin') {
      // Super admin: voir tous les kiosks (avec filtre optionnel)
      if (gymIdFilter) {
        query = query.eq('gym_id', gymIdFilter)
      }
    } else {
      // Autres rôles: pas d'accès
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { data: kiosks, error: kiosksError } = await query

    if (kiosksError) {
      console.error('[API] Error fetching kiosks:', kiosksError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des kiosks' }, { status: 500 })
    }

    // 4. Formatter les données
    const formattedKiosks = (kiosks || []).map((k: any) => ({
      id: k.id,
      gym_id: k.gym_id,
      gym_name: k.gyms?.name || 'N/A',
      slug: k.slug,
      name: k.name,
      status: k.status || 'offline',
      last_heartbeat: k.last_heartbeat,
      version: k.version,
      device_info: k.device_info
    }))

    // 5. Calculer les métriques
    const totalKiosks = formattedKiosks.length
    const onlineKiosks = formattedKiosks.filter(k => k.status === 'online').length
    const offlineKiosks = formattedKiosks.filter(k => k.status === 'offline').length
    const errorKiosks = formattedKiosks.filter(k => k.status === 'error').length
    
    // Uptime moyen (estimation basée sur les kiosks online)
    const avgUptime = totalKiosks > 0 ? (onlineKiosks / totalKiosks) * 100 : 0

    return NextResponse.json({
      kiosks: formattedKiosks,
      metrics: {
        totalKiosks,
        onlineKiosks,
        offlineKiosks,
        errorKiosks,
        avgUptime
      }
    })
  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/kiosk:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

