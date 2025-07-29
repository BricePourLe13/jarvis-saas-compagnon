import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

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

async function verifyAdminAccess(supabase: any, userId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
    
  if (error || !user) {
    throw new Error('Utilisateur non trouvé')
  }
  
  if (user.role !== 'super_admin') {
    throw new Error('Accès refusé - Super admin requis')
  }
  
  return true
}

// ===========================================
// 🎯 ENDPOINT PRINCIPAL
// ===========================================

export async function GET(request: NextRequest) {
  try {
    // 1. Initialisation Supabase
    const supabase = createSimpleClient()
    
    // 2. Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Non authentifié',
          message: 'Vous devez être connecté'
        } as ApiResponse<null>,
        { status: 401 }
      )
    }

    // 3. Vérification permissions admin
    await verifyAdminAccess(supabase, user.id)

    // 4. Récupération des utilisateurs avec filtres
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

    // 5. Compter le total pour pagination
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

    // 6. Enrichir les données (optionnel)
    const enrichedUsers: UserWithProfile[] = users?.map(user => ({
      ...user,
      // Masquer les informations sensibles si nécessaire
      // franchise_access: user.role === 'super_admin' ? user.franchise_access : undefined
    })) || []

    // 7. Réponse avec métadonnées
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

    // Pour la compatibilité avec le composant, on retourne aussi les users directement
    return NextResponse.json({
      ...response,
      data: enrichedUsers // Compatibilité simple
    })

  } catch (error: any) {
    console.error('💥 Erreur système récupération users:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur système',
        message: error.message || 'Une erreur inattendue s\'est produite'
      } as ApiResponse<null>,
      { status: error.message.includes('Accès refusé') ? 403 : 500 }
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