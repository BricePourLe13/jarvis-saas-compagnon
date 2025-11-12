import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/gyms/[id]
 * Récupère les détails complets d'une salle
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: params is now a Promise
    const params = await props.params
    const gymId = params.id

    console.log('[API GYM DETAILS] Fetching gym:', gymId)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(cookie => ({ name: cookie.name, value: cookie.value })),
          setAll: () => {}
        }
      }
    )

    // Vérifier auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier rôle super_admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Fetch gym details
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        address,
        city,
        postal_code,
        phone,
        created_at,
        status,
        manager_id,
        legacy_franchise_name
      `)
      .eq('id', gymId)
      .single()

    if (gymError) {
      console.error('[API GYM DETAILS] Error fetching gym:', gymError)
      return NextResponse.json({ error: 'Salle non trouvée' }, { status: 404 })
    }

    // Fetch manager info
    let manager = null
    if (gym.manager_id) {
      const { data: managerData } = await supabase
        .from('users')
        .select('id, full_name, email, created_at')
        .eq('id', gym.manager_id)
        .single()
      
      manager = managerData
    }

    // Fetch kiosks
    const { data: kiosks } = await supabase
      .from('kiosks')
      .select('id, name, status, last_heartbeat')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: true })

    // Count members
    const { count: membersCount } = await supabase
      .from('gym_members_v2')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)

    // Count sessions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: sessionsCount } = await supabase
      .from('openai_realtime_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Last activity
    const { data: lastSession } = await supabase
      .from('openai_realtime_sessions')
      .select('created_at')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastActivity = lastSession?.created_at || null

    console.log('[API GYM DETAILS] Success for gym:', gymId)

    return NextResponse.json({
      gym: {
        ...gym,
        manager,
        kiosks: kiosks || [],
        stats: {
          membersCount: membersCount || 0,
          sessionsCount: sessionsCount || 0,
          kiosksCount: kiosks?.length || 0,
          lastActivity
        }
      }
    })

  } catch (error) {
    console.error('[API GYM DETAILS] Fatal error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
