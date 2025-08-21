import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ApiResponse, PaginatedResponse, Franchise, FranchiseFilters } from '../../../../types/franchise'

// ===========================================
// 🔐 Validation & Auth
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
// 🔍 Construction des filtres
// ===========================================

function buildFranchiseQuery(supabase: any, filters: FranchiseFilters, page: number, limit: number) {
  let query = supabase
    .from('franchises')
    .select(`
      *,
      owner:users(id, email, full_name, is_active),
      gyms:gyms(id, name, status)
    `, { count: 'exact' })

  // Filtres
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.owner_id) {
    query = query.eq('owner_id', filters.owner_id)
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after)
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before)
  }

  // Tri par défaut : plus récent en premier
  query = query.order('created_at', { ascending: false })

  // Pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  return query
}

// ===========================================
// 🎯 ENDPOINT GET - Liste des franchises
// ===========================================

export async function GET(request: NextRequest) {
  try {
    // 1. Initialiser Supabase
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
        { success: false, error: authResult.error } as ApiResponse<null>,
        { status: 401 }
      )
    }

    // 3. Parser les paramètres de requête
    const { searchParams } = new URL(request.url)
    
    const filters: FranchiseFilters = {
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
      owner_id: searchParams.get('owner_id') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 par page

    // 4. Construire et exécuter la requête
    const query = buildFranchiseQuery(supabase, filters, page, limit)
    const { data: franchises, error, count } = await query

    if (error) {
      // Log supprimé pour production
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération des franchises',
          message: error.message 
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 5. Calculer les métadonnées de pagination
    const totalPages = Math.ceil((count || 0) / limit)
    
    const response: PaginatedResponse<Franchise> = {
      data: franchises || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur inattendue',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}

// ===========================================
// 🎯 ENDPOINT POST - Création rapide
// ===========================================

export async function POST(request: NextRequest) {
  // Rediriger vers l'endpoint de création dédié
  return NextResponse.redirect(new URL('/api/admin/franchises/create', request.url))
}

// ===========================================
// 🚫 Méthodes non autorisées
// ===========================================

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée - Utilisez /api/admin/franchises/[id]' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée - Utilisez /api/admin/franchises/[id]' },
    { status: 405 }
  )
} 