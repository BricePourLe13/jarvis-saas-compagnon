import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSimpleClient()

    // Voir toutes les salles
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('*')
      .limit(20)

    // Voir toutes les franchises
    const { data: franchises, error: franchisesError } = await supabase
      .from('franchises')
      .select('*')
      .limit(20)

    // Voir si gym_members existe
    const { data: members, error: membersError } = await supabase
      .from('gym_members')
      .select('*')
      .limit(10)

    return NextResponse.json({
      gyms: {
        data: gyms,
        error: gymsError,
        count: gyms?.length || 0
      },
      franchises: {
        data: franchises,
        error: franchisesError,
        count: franchises?.length || 0
      },
      members: {
        data: members,
        error: membersError,
        count: members?.length || 0
      },
      kioskGyms: gyms?.filter(g => g.kiosk_config?.kiosk_url_slug) || []
    })

  } catch (error) {
    console.error('[DEBUG] Erreur:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 