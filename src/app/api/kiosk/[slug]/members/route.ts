import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * 👥 GET /api/kiosk/[slug]/members
 * 
 * Récupère la liste des adhérents actifs de la gym associée au kiosk
 * PUBLIC (pas d'auth) - utilisé pour afficher les badges adhérents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    // 1. Récupérer le kiosk pour obtenir le gym_id
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select('gym_id')
      .eq('slug', slug)
      .single()

    if (kioskError || !kiosk) {
      return NextResponse.json(
        { members: [], error: 'Kiosk non trouvé' },
        { status: 404 }
      )
    }

    // 2. Récupérer les membres actifs de cette gym
    const { data: members, error: membersError } = await supabase
      .from('gym_members_v2')
      .select('*')
      .eq('gym_id', kiosk.gym_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (membersError) {
      return NextResponse.json(
        { members: [], error: 'Erreur récupération membres' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      members: members || [],
      count: members?.length || 0
    })

  } catch (error) {
    console.error('[KIOSK MEMBERS API] Erreur:', error)
    return NextResponse.json(
      { members: [], error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
