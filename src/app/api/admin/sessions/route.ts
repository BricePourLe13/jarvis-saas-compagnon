/**
 * 👨‍💼 API ADMIN - MONITORING SESSIONS
 * Endpoints pour surveiller et gérer les sessions en production
 */

import { NextRequest, NextResponse } from 'next/server'
import { sessionMonitor } from '@/lib/session-monitor'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Vérifier les permissions admin
async function checkAdminPermissions(request: NextRequest) {
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

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Non authentifié')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['super_admin', 'franchise_owner', 'franchise_admin']
  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    throw new Error('Permissions insuffisantes')
  }

  return { user, profile }
}

// GET - Statistiques des sessions
export async function GET(request: NextRequest) {
  try {
    await checkAdminPermissions(request)

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = await sessionMonitor.getSessionStats()
        return NextResponse.json({ success: true, stats })

      case 'active':
        const activeSessions = await sessionMonitor.getActiveSessions()
        return NextResponse.json({ success: true, sessions: activeSessions })

      case 'cleanup':
        const cleanedCount = await sessionMonitor.cleanupOrphanSessions()
        return NextResponse.json({ 
          success: true, 
          message: `${cleanedCount} sessions nettoyées` 
        })

      default:
        // Par défaut, retourner les stats + sessions actives
        const [statsData, activeData] = await Promise.all([
          sessionMonitor.getSessionStats(),
          sessionMonitor.getActiveSessions()
        ])

        return NextResponse.json({
          success: true,
          stats: statsData,
          active_sessions: activeData,
          timestamp: new Date().toISOString()
        })
    }

  } catch (error: any) {
    console.error('❌ [ADMIN] Erreur monitoring:', error)
    
    if (error.message.includes('authentifié') || error.message.includes('Permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Actions sur les sessions
export async function POST(request: NextRequest) {
  try {
    await checkAdminPermissions(request)

    const { action, session_id, reason } = await request.json()

    switch (action) {
      case 'force_close':
        if (!session_id) {
          return NextResponse.json(
            { error: 'session_id requis pour force_close' },
            { status: 400 }
          )
        }

        const success = await sessionMonitor.forceCloseSession(
          session_id, 
          reason || 'admin_force_close'
        )

        return NextResponse.json({
          success,
          message: success 
            ? `Session ${session_id} fermée de force`
            : `Échec fermeture session ${session_id}`
        })

      case 'cleanup_all':
        const cleanedCount = await sessionMonitor.cleanupOrphanSessions()
        return NextResponse.json({
          success: true,
          cleaned_count: cleanedCount,
          message: `${cleanedCount} sessions orphelines nettoyées`
        })

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('❌ [ADMIN] Erreur action session:', error)
    
    if (error.message.includes('authentifié') || error.message.includes('Permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}