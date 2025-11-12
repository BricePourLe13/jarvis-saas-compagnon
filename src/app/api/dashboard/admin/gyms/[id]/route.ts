import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Vérifier l'auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Super admin requis' },
        { status: 403 }
      )
    }

    const gymId = params.id

    // Fetch gym details
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select(`
        *,
        manager:users!gym_manager_id (
          id,
          full_name,
          email
        ),
        kiosks (
          id,
          name,
          status,
          last_heartbeat
        )
      `)
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json(
        { error: 'Gym not found' },
        { status: 404 }
      )
    }

    // Fetch member count
    const { count: memberCount } = await supabase
      .from('gym_members_v2')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)

    // Fetch session count
    const { count: sessionCount } = await supabase
      .from('openai_realtime_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)

    // Fetch last activity (most recent session)
    const { data: lastSession } = await supabase
      .from('openai_realtime_sessions')
      .select('created_at')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Format response
    const gymDetails = {
      ...gym,
      manager_name: gym.manager?.full_name || null,
      manager_email: gym.manager?.email || null,
      total_members: memberCount || 0,
      total_kiosks: gym.kiosks?.length || 0,
      total_sessions: sessionCount || 0,
      last_activity: lastSession?.created_at || null
    }

    return NextResponse.json({ gym: gymDetails })
  } catch (error) {
    console.error('Error fetching gym details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

