import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const pageSizeParam = searchParams.get('pageSize') || '20'
    const isAll = pageSizeParam === 'all'
    const pageSize = isAll ? 100000 : Math.max(1, Math.min(1000, Number(pageSizeParam)))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Trouver l'id de la salle via le slug
    const { data: gym } = await supabase
      .from('gyms')
      .select('id')
      .eq('kiosk_config->>kiosk_url_slug', slug)
      .maybeSingle()

    if (!gym?.id) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    }

    let query = supabase
      .from('gym_members')
      .select('id,badge_id,first_name,last_name,email,membership_type,total_visits,last_visit,member_preferences')
      .eq('gym_id', gym.id)
      .order('last_visit', { ascending: false })
    if (!isAll) {
      query = (query as any).range(from, to)
    }

    if (q) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,badge_id.ilike.%${q}%`
      ) as any
    }

    const { data: members, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Erreur récupération membres' }, { status: 500 })
    }

    return NextResponse.json({ success: true, members, page, pageSize: isAll ? 'all' : pageSize })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


