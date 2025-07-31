import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message: string
}

interface UserSession {
  id: string
  user_id: string
  user_email: string
  user_role: string
  session_token: string
  device_info: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  device_fingerprint: string | null
  location_data: Record<string, any>
  is_active: boolean
  last_activity: string
  session_duration: number
  login_method: string
  trust_level: 'trusted' | 'normal' | 'suspicious'
  failed_actions: number
  created_at: string
  expires_at: string
  terminated_at: string | null
  termination_reason: string | null
  terminated_by: string | null
  full_name: string
  status: 'online' | 'idle' | 'away' | 'inactive'
  session_age_seconds: number
  inactive_seconds: number
}

interface SessionStats {
  total_active_sessions: number
  online_users: number
  idle_users: number
  away_users: number
  inactive_users: number
  suspicious_sessions: number
  total_users: number
  sessions_by_role: Array<{ role: string; count: number }>
  top_devices: Array<{ device: string; count: number }>
  top_locations: Array<{ location: string; count: number }>
}

// ===========================================
// 🛡️ VÉRIFICATION PERMISSIONS
// ===========================================

async function validateSuperAdmin(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { valid: false, error: 'Non authentifié' }
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !userProfile || userProfile.role !== 'super_admin') {
    return { valid: false, error: 'Accès non autorisé - Super admin requis' }
  }

  return { valid: true, user }
}

// ===========================================
// 📋 GET ACTIVE SESSIONS - GET
// ===========================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ sessions: UserSession[], stats: SessionStats }>>> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    // Vérification permissions
    const validation = await validateSuperAdmin(supabase)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, message: 'Permission refusée' },
        { status: 403 }
      )
    }

    // Paramètres de filtrage
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // online, idle, away, inactive
    const role = searchParams.get('role')
    const trust_level = searchParams.get('trust_level')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Nettoyer les sessions expirées d'abord
    await supabase.rpc('cleanup_expired_sessions')

    // Récupérer les sessions actives
    let query = supabase
      .from('active_user_sessions')
      .select('*')
      .order('last_activity', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }
    if (role) {
      query = query.eq('user_role', role)
    }
    if (trust_level) {
      query = query.eq('trust_level', trust_level)
    }

    const { data: sessions, error: sessionsError } = await query

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError)
      return NextResponse.json(
        { success: false, error: sessionsError.message, message: 'Erreur lors de la récupération des sessions' },
        { status: 500 }
      )
    }

    // Calculer les statistiques
    const stats: SessionStats = {
      total_active_sessions: sessions?.length || 0,
      online_users: sessions?.filter(s => s.status === 'online').length || 0,
      idle_users: sessions?.filter(s => s.status === 'idle').length || 0,
      away_users: sessions?.filter(s => s.status === 'away').length || 0,
      inactive_users: sessions?.filter(s => s.status === 'inactive').length || 0,
      suspicious_sessions: sessions?.filter(s => s.trust_level === 'suspicious').length || 0,
      total_users: new Set(sessions?.map(s => s.user_id)).size || 0,
      sessions_by_role: [],
      top_devices: [],
      top_locations: []
    }

    // Statistiques par rôle
    if (sessions && sessions.length > 0) {
      const roleCount = sessions.reduce((acc, session) => {
        acc[session.user_role] = (acc[session.user_role] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      stats.sessions_by_role = Object.entries(roleCount).map(([role, count]) => ({
        role,
        count
      }))

      // Top devices
      const deviceCount = sessions.reduce((acc, session) => {
        const device = session.device_info?.browser || 'Unknown'
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      stats.top_devices = Object.entries(deviceCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([device, count]) => ({ device, count }))

      // Top locations
      const locationCount = sessions.reduce((acc, session) => {
        const location = session.location_data?.country || 'Unknown'
        acc[location] = (acc[location] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      stats.top_locations = Object.entries(locationCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }))
    }

    console.log('✅ Sessions actives récupérées:', sessions?.length || 0)

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions || [],
        stats
      },
      message: 'Sessions actives récupérées avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API get sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}

// ===========================================
// 🚫 TERMINATE SESSION - DELETE
// ===========================================

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<{ terminated_count: number }>>> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    // Vérification permissions
    const validation = await validateSuperAdmin(supabase)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, message: 'Permission refusée' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { session_token, user_id, terminate_all } = body

    let terminatedCount = 0

    if (terminate_all && user_id) {
      // Terminer toutes les sessions d'un utilisateur
      const { data: count, error } = await supabase.rpc('terminate_all_user_sessions', {
        p_user_id: user_id,
        p_reason: 'forced',
        p_terminated_by: validation.user.id
      })

      if (error) {
        console.error('❌ Erreur terminaison sessions:', error)
        return NextResponse.json(
          { success: false, error: error.message, message: 'Erreur lors de la terminaison des sessions' },
          { status: 500 }
        )
      }

      terminatedCount = count || 0
    } else if (session_token) {
      // Terminer une session spécifique
      const { data: success, error } = await supabase.rpc('terminate_user_session', {
        p_session_token: session_token,
        p_reason: 'forced',
        p_terminated_by: validation.user.id
      })

      if (error) {
        console.error('❌ Erreur terminaison session:', error)
        return NextResponse.json(
          { success: false, error: error.message, message: 'Erreur lors de la terminaison de la session' },
          { status: 500 }
        )
      }

      terminatedCount = success ? 1 : 0
    } else {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants', message: 'session_token ou user_id requis' },
        { status: 400 }
      )
    }

    // Log de l'activité
    // TODO: Intégrer logBulkOperation ici

    console.log(`✅ ${terminatedCount} session(s) terminée(s)`)

    return NextResponse.json({
      success: true,
      data: { terminated_count: terminatedCount },
      message: `${terminatedCount} session(s) terminée(s) avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur API terminate sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}