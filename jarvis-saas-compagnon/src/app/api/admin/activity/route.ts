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

interface ActivityLog {
  id: string
  user_id: string
  user_email: string
  user_role: string
  action_type: string
  target_type: string | null
  target_id: string | null
  target_name: string | null
  description: string
  details: Record<string, any>
  old_values: Record<string, any>
  new_values: Record<string, any>
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  success: boolean
  error_message: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  full_name: string
  time_category: 'just_now' | 'today' | 'this_week' | 'older'
}

interface ActivityStats {
  total_logs: number
  today_logs: number
  failed_logs: number
  high_risk_logs: number
  top_actions: Array<{ action_type: string; count: number }>
  top_users: Array<{ user_id: string; full_name: string; count: number }>
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
// 📋 GET ACTIVITY LOGS - GET
// ===========================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ logs: ActivityLog[], stats: ActivityStats }>>> {
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

    // Paramètres de pagination et filtres
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action_type = searchParams.get('action_type')
    const user_id = searchParams.get('user_id')
    const risk_level = searchParams.get('risk_level')
    const days = parseInt(searchParams.get('days') || '30')

    const offset = (page - 1) * limit

    // Construction de la requête avec filtres
    let query = supabase
      .from('recent_user_activities')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (action_type) {
      query = query.eq('action_type', action_type)
    }
    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    if (risk_level) {
      query = query.eq('risk_level', risk_level)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      console.error('❌ Erreur récupération logs:', logsError)
      return NextResponse.json(
        { success: false, error: logsError.message, message: 'Erreur lors de la récupération des logs' },
        { status: 500 }
      )
    }

    // Récupérer les statistiques - Pour l'instant sans RPC, on calculera côté client
    let stats: ActivityStats = {
      total_logs: logs?.length || 0,
      today_logs: logs?.filter(log => {
        const logDate = new Date(log.created_at)
        const today = new Date()
        return logDate.toDateString() === today.toDateString()
      }).length || 0,
      failed_logs: logs?.filter(log => !log.success).length || 0,
      high_risk_logs: logs?.filter(log => ['high', 'critical'].includes(log.risk_level)).length || 0,
      top_actions: [],
      top_users: []
    }

    console.log('✅ Logs d\'activité récupérés:', logs?.length || 0)

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        stats
      },
      message: 'Logs d\'activité récupérés avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API get activity logs:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}

// ===========================================
// 📝 CREATE ACTIVITY LOG - POST
// ===========================================

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<string>>> {
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

    // Vérification utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié', message: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Récupérer IP et User-Agent
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Utiliser la fonction SQL pour créer le log
    const { data: logId, error } = await supabase.rpc('log_user_activity', {
      p_user_id: user.id,
      p_action_type: body.action_type,
      p_description: body.description,
      p_target_type: body.target_type || null,
      p_target_id: body.target_id || null,
      p_target_name: body.target_name || null,
      p_details: body.details || {},
      p_old_values: body.old_values || {},
      p_new_values: body.new_values || {},
      p_risk_level: body.risk_level || 'low',
      p_severity: body.severity || 'info',
      p_ip_address: ip,
      p_user_agent: userAgent
    })

    if (error) {
      console.error('❌ Erreur création log activité:', error)
      return NextResponse.json(
        { success: false, error: error.message, message: 'Erreur lors de la création du log' },
        { status: 500 }
      )
    }

    console.log('✅ Log d\'activité créé:', logId)

    return NextResponse.json({
      success: true,
      data: logId,
      message: 'Log d\'activité créé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API create activity log:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}