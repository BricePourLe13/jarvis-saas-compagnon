import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '../../../../lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { kioskSlug } = await request.json()

    if (!kioskSlug) {
      return NextResponse.json(
        { error: 'kioskSlug requis' },
        { status: 400 }
      )
    }

    const supabase = createSimpleClient()
    const now = new Date().toISOString()

    // 1. Récupérer le kiosk pour avoir le gym_id
    const { data: kiosk, error: fetchError } = await supabase
      .from('kiosks')
      .select('id, gym_id')
      .eq('slug', kioskSlug)
      .single()

    if (fetchError || !kiosk) {
      return NextResponse.json(
        { error: 'Kiosk non trouvé' },
        { status: 404 }
      )
    }

    // 2. Update kiosk last_heartbeat dans la table kiosks
    const { error: kioskError } = await supabase
      .from('kiosks')
      .update({
        last_heartbeat: now,
        status: 'online',
        updated_at: now
      })
      .eq('slug', kioskSlug)

    if (kioskError) {
      return NextResponse.json(
        { error: 'Erreur mise à jour kiosk' },
        { status: 500 }
      )
    }

    // 3. Maintenir kiosk_heartbeats pour compatibilité legacy (optionnel)
    await supabase
      .from('kiosk_heartbeats')
      .upsert([{
        gym_id: kiosk.gym_id,
        kiosk_slug: kioskSlug,
        last_heartbeat: now,
        status: 'online'
      }], {
        onConflict: 'gym_id'
      })

    return NextResponse.json({ 
      success: true,
      timestamp: now,
      gym_id: kiosk.gym_id
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSimpleClient()
    
    // ⚡ Récupérer tous les heartbeats récents (moins de 45 secondes)
    const fortyFiveSecondsAgo = new Date(Date.now() - 45 * 1000).toISOString()
    
    const { data: heartbeats, error } = await supabase
      .from('kiosk_heartbeats')
      .select('*')
      .gte('last_heartbeat', fortyFiveSecondsAgo)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur récupération heartbeats' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      heartbeats: heartbeats || [],
      count: heartbeats?.length || 0
    })

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 