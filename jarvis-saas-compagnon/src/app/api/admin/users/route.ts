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

interface UserWithProfile {
  id: string
  email: string
  full_name: string
  role: string
  franchise_access?: string[]
  gym_access?: string[]
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
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
// 🎯 ENDPOINT PRINCIPAL
// ===========================================

export async function GET(request: NextRequest) {
  try {
    // 1. Initialiser Supabase avec cookies
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
    
    // 2. Vérifier authentification Super Admin
    const authResult = await validateSuperAdmin(supabase)
    if (!authResult.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error,
          message: 'Vous devez être connecté en tant que super admin'
        } as ApiResponse<null>,
        { status: 401 }
      )
    }

    // 3. Récupération des utilisateurs avec filtres
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        franchise_access,
        gym_access,
        is_active,
        last_login,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Filtres optionnels
    if (role && ['super_admin', 'franchise_owner', 'gym_manager', 'gym_staff'].includes(role)) {
      query = query.eq('role', role)
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur base de données',
          message: 'Impossible de récupérer les utilisateurs'
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 4. Compter le total pour pagination
    let countQuery = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (role && ['super_admin', 'franchise_owner', 'gym_manager', 'gym_staff'].includes(role)) {
      countQuery = countQuery.eq('role', role)
    }

    if (status === 'active') {
      countQuery = countQuery.eq('is_active', true)
    } else if (status === 'inactive') {
      countQuery = countQuery.eq('is_active', false)
    }

    const { count, error: countError } = await countQuery

    // 5. Enrichir les données (optionnel)
    const enrichedUsers: UserWithProfile[] = users?.map(user => ({
      ...user,
      // Masquer les informations sensibles si nécessaire
      // franchise_access: user.role === 'super_admin' ? user.franchise_access : undefined
    })) || []

    // 6. Réponse avec métadonnées
    const response: ApiResponse<{
      users: UserWithProfile[]
      pagination: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
      }
      stats: {
        total: number
        active: number
        inactive: number
        byRole: Record<string, number>
      }
    }> = {
      success: true,
      data: {
        users: enrichedUsers,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        },
        stats: {
          total: enrichedUsers.length,
          active: enrichedUsers.filter(u => u.is_active).length,
          inactive: enrichedUsers.filter(u => !u.is_active).length,
          byRole: enrichedUsers.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        }
      },
      message: `${enrichedUsers.length} utilisateur(s) récupéré(s)`
    }

    // Retour simple pour compatibilité frontend
    return NextResponse.json({
      success: true,
      data: enrichedUsers,
      message: `${enrichedUsers.length} utilisateur(s) récupéré(s)`
    })

  } catch (error: any) {
    console.error('💥 Erreur système récupération users:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur système',
        message: error.message || 'Une erreur inattendue s\'est produite'
      } as ApiResponse<null>,
      { status: error.message && error.message.includes('Accès refusé') ? 403 : 500 }
    )
  }
}

// ===========================================
// 🔒 MÉTHODES NON AUTORISÉES
// ===========================================

export async function POST() {
  return NextResponse.json(
    { error: 'Méthode non autorisée - Utilisez /api/admin/invitations/send' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
} 