export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const gymId = searchParams.get('gymId')
  if (!gymId) return NextResponse.json({ success: false, message: 'gymId required' }, { status: 400 })

  const { data } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('gym_id', gymId)
    .maybeSingle()

  return NextResponse.json({ success: true, data: data || null })
}


