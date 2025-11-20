import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
          remove: (name: string, options: any) => cookieStore.set({ name, value: '', ...options }),
        },
      }
    )

    // 1. Auth & Role Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, gym_id')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'gym_manager' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const targetGymId = profile.gym_id
    if (!targetGymId && profile.role === 'gym_manager') {
       return NextResponse.json({ error: 'Aucune salle associée' }, { status: 400 })
    }

    // 2. Validate Body
    const body = await request.json()
    const { first_name, last_name, email, badge_id } = body

    if (!first_name || !last_name || !badge_id) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // 3. Insert
    const { data, error } = await supabase
      .from('gym_members_v2')
      .insert({
        gym_id: targetGymId,
        first_name,
        last_name,
        email: email || null,
        badge_id,
        is_active: true,
        member_since: new Date().toISOString(),
        can_use_jarvis: true
      })
      .select()
      .single()

    if (error) {
      logger.error('Erreur création membre', { error }, { component: 'MemberCreate' })
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Ce badge est déjà assigné dans votre salle.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, member: data })

  } catch (error: any) {
    logger.error('Erreur serveur création membre', { error }, { component: 'MemberCreate' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

