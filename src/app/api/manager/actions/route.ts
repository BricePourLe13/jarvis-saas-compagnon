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
      { cookies: { get: (n: string) => cookieStore.get(n)?.value } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const gymIdParam = searchParams.get('gymId')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    const role = (profile as any)?.role
    const isAdmin = role === 'super_admin' || role === 'franchise_owner' || role === 'franchise_admin'

    let gymId = gymIdParam || ''
    if (!isAdmin) {
      const { data: myGym } = await supabase.from('gyms').select('id').eq('manager_id', user.id).maybeSingle()
      if (!myGym) return NextResponse.json({ success: false, message: 'No managed gym' }, { status: 403 })
      gymId = myGym.id
    }
    if (!gymId) return NextResponse.json({ success: false, message: 'gymId required' }, { status: 400 })

    const { data, error } = await supabase
      .from('manager_actions')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return NextResponse.json({ success: true, data: [] })
    return NextResponse.json({ success: true, data: data || [] })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionId, state, ignored_reason } = body as { actionId: string; state: 'completed' | 'ignored' | 'pending'; ignored_reason?: string }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: (n: string) => cookieStore.get(n)?.value } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

    // Mise à jour idempotente
    const { error } = await supabase
      .from('manager_actions')
      .update({ state, ignored_reason: ignored_reason || null, completed_at: state === 'completed' ? new Date().toISOString() : null })
      .eq('id', actionId)

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}


