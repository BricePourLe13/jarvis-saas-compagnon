import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '../../../../lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { gymId, kioskSlug, timestamp } = await request.json()

    if (!gymId || !kioskSlug) {
      return NextResponse.json(
        { error: 'gymId et kioskSlug requis' },
        { status: 400 }
      )
    }

    const supabase = createSimpleClient()

    // Insérer ou mettre à jour le heartbeat
    const { error } = await supabase
      .from('kiosk_heartbeats')
      .upsert([{
        gym_id: gymId,
        kiosk_slug: kioskSlug,
        last_heartbeat: new Date().toISOString(),
        status: 'online'
      }], {
        onConflict: 'gym_id'
      })

    if (error) {
      console.error('❌ [HEARTBEAT] Erreur sauvegarde:', error)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [HEARTBEAT] Erreur:', error)
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
    console.error('❌ [HEARTBEAT] Erreur GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 