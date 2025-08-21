export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const gymIdParam = searchParams.get('gymId')

    // Rôle utilisateur
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = (profile as any)?.role
    const isAdmin = role === 'super_admin' || role === 'franchise_owner' || role === 'franchise_admin'

    // Résoudre gymId accessible
    let gymId = gymIdParam || ''
    if (!isAdmin) {
      // Chercher la salle dont il est manager
      const { data: myGym } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('manager_id', user.id)
        .maybeSingle()
      if (!myGym) return NextResponse.json({ success: false, message: 'No managed gym' }, { status: 403 })
      gymId = myGym.id
    }

    if (!gymId) return NextResponse.json({ success: false, message: 'gymId required' }, { status: 400 })

    // Vue d’ensemble minimale (heuristique)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [sessionsTodayRes, activeSessionsRes, kioskRes, gymRes] = await Promise.all([
      supabase.from('openai_realtime_sessions').select('session_id').eq('gym_id', gymId).gte('session_started_at', startOfDay.toISOString()),
      supabase.from('openai_realtime_sessions').select('session_id').eq('gym_id', gymId).is('session_ended_at', null),
      supabase.from('kiosk_heartbeats').select('last_heartbeat').eq('gym_id', gymId).maybeSingle(),
      supabase.from('gyms').select('id,name').eq('id', gymId).maybeSingle(),
    ])

    const sessions_today = sessionsTodayRes.data?.length || 0
    const active_sessions = activeSessionsRes.data?.length || 0
    const lastHb = (kioskRes.data as any)?.last_heartbeat
    const isOnline = lastHb ? (Date.now() - new Date(lastHb).getTime() < 2 * 60 * 1000) : false
    const kiosk_status = isOnline ? 'online' : 'offline'

    // Satisfaction heuristique: placeholder 80
    const satisfaction_score = 80
    const alerts_count = isOnline ? 0 : 1

    return NextResponse.json({
      success: true,
      data: {
        gym_id: gymId,
        gym_name: (gymRes.data as any)?.name || 'Salle',
        satisfaction_score,
        alerts_count,
        sessions_today,
        active_sessions,
        kiosk_status,
      }
    })
  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}


