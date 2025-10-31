import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/kiosk
 * Liste tous les kiosks accessibles selon le rôle et les permissions
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

    // 3. Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url)
    const gymIdFilter = searchParams.get('gym_id')

    // 4. Construire la requête selon le rôle
    let query = supabase
      .from('kiosks')
      .select(`
        id,
        gym_id,
        slug,
        name,
        status,
        last_heartbeat,
        software_version,
        device_id,
        hardware_info,
        gyms!inner(
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    // Filtrer selon le rôle
    if (userProfile.role === 'gym_manager') {
      if (!userProfile.gym_id) {
        return NextResponse.json({ 
          kiosks: [], 
          metrics: {
            totalKiosks: 0,
            onlineKiosks: 0,
            offlineKiosks: 0,
            errorKiosks: 0,
            avgUptime: 0
          }
        })
      }
      query = query.eq('gym_id', userProfile.gym_id)
    } else if (userProfile.role === 'franchise_owner') {
      // Récupérer les gyms de la franchise
      const { data: franchiseGyms } = await supabase
        .from('gyms')
        .select('id')
        .eq('franchise_id', userProfile.franchise_id)
      
      if (franchiseGyms && franchiseGyms.length > 0) {
        const gymIds = franchiseGyms.map(g => g.id)
        query = query.in('gym_id', gymIds)
      } else {
        return NextResponse.json({ 
          kiosks: [], 
          metrics: {
            totalKiosks: 0,
            onlineKiosks: 0,
            offlineKiosks: 0,
            errorKiosks: 0,
            avgUptime: 0
          }
        })
      }
    }
    // super_admin voit tous les kiosks

    // Appliquer le filtre gym_id si fourni
    if (gymIdFilter && gymIdFilter !== 'all') {
      query = query.eq('gym_id', gymIdFilter)
    }

    const { data: kiosks, error: kiosksError } = await query

    if (kiosksError) {
      console.error('[API] Error fetching kiosks:', kiosksError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des kiosks' }, { status: 500 })
    }

    // 5. Formater les kiosks
    const formattedKiosks = (kiosks || []).map((kiosk: any) => ({
      id: kiosk.id,
      gym_id: kiosk.gym_id,
      gym_name: kiosk.gyms?.name || 'N/A',
      slug: kiosk.slug,
      name: kiosk.name,
      status: kiosk.status,
      last_heartbeat: kiosk.last_heartbeat,
      version: kiosk.software_version,
      device_info: kiosk.hardware_info
    }))

    // 6. Calculer métriques
    const metrics = {
      totalKiosks: formattedKiosks.length,
      onlineKiosks: formattedKiosks.filter((k: any) => k.status === 'online').length,
      offlineKiosks: formattedKiosks.filter((k: any) => k.status === 'offline').length,
      errorKiosks: formattedKiosks.filter((k: any) => k.status === 'error').length,
      avgUptime: formattedKiosks.length > 0 
        ? (formattedKiosks.filter((k: any) => k.status === 'online').length / formattedKiosks.length) * 100 
        : 0
    }

    return NextResponse.json({
      kiosks: formattedKiosks,
      metrics
    })

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/kiosk:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
