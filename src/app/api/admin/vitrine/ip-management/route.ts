import { NextRequest, NextResponse } from 'next/server'
import { vitrineIPLimiter } from '@/lib/vitrine-ip-limiter'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Lister les IPs avec leurs stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const showBlocked = searchParams.get('blocked') === 'true'

    let query = supabase
      .from('vitrine_demo_sessions')
      .select('*')
      .order('last_session_at', { ascending: false })

    if (showBlocked) {
      query = query.eq('blocked', true)
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('❌ Erreur GET IP management:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Actions sur les IPs (débloquer, statistiques)
export async function POST(request: NextRequest) {
  try {
    const { action, ip_address } = await request.json()

    if (!ip_address) {
      return NextResponse.json({ error: 'IP address requis' }, { status: 400 })
    }

    switch (action) {
      case 'unblock':
        const success = await vitrineIPLimiter.adminUnblockIP(ip_address)
        if (success) {
          return NextResponse.json({ 
            success: true, 
            message: `IP ${ip_address} débloquée avec succès` 
          })
        } else {
          return NextResponse.json({ error: 'Échec du déblocage' }, { status: 500 })
        }

      case 'stats':
        const stats = await vitrineIPLimiter.getSessionStats(ip_address)
        return NextResponse.json({ success: true, stats })

      case 'block':
        const { reason } = await request.json()
        const { error } = await supabase
          .from('vitrine_demo_sessions')
          .update({
            blocked: true,
            blocked_reason: reason || 'Bloqué manuellement par admin',
            updated_at: new Date().toISOString()
          })
          .eq('ip_address', ip_address)

        if (error) {
          return NextResponse.json({ error: 'Erreur blocage' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: `IP ${ip_address} bloquée avec succès` 
        })

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Erreur POST IP management:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Reset complète d'une IP
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ip_address = searchParams.get('ip')

    if (!ip_address) {
      return NextResponse.json({ error: 'IP address requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('vitrine_demo_sessions')
      .delete()
      .eq('ip_address', ip_address)

    if (error) {
      return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Historique IP ${ip_address} supprimé avec succès` 
    })

  } catch (error) {
    console.error('❌ Erreur DELETE IP management:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
