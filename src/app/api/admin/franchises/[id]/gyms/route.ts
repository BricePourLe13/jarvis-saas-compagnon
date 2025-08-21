import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ApiResponse, PaginatedResponse, Gym } from '../../../../../../types/franchise'

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
// 🎯 ENDPOINT GET - Liste des salles d'une franchise
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Attendre les paramètres
    const resolvedParams = await params
    const franchiseId = resolvedParams.id

    // 2. Initialiser Supabase
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

    // 3. Vérifier authentification Super Admin
    const authResult = await validateSuperAdmin(supabase)
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error } as ApiResponse<null>,
        { status: 401 }
      )
    }

    if (!franchiseId) {
      return NextResponse.json(
        { success: false, error: 'ID de franchise requis' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // 4. Vérifier que la franchise existe
    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .select('id, name, contact_email')
      .eq('id', franchiseId)
      .single()

    if (franchiseError || !franchise) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Franchise introuvable',
          message: `Aucune franchise trouvée avec l'ID ${franchiseId}`
        } as ApiResponse<null>,
        { status: 404 }
      )
    }

    // 5. Parser les paramètres de requête pour pagination/filtres
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 par page
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    // 6. Construire la requête pour les salles
    let query = supabase
      .from('gyms')
      .select(`
        *
      `, { count: 'exact' })
      .eq('franchise_id', franchiseId)

    // Appliquer les filtres
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`)
    }

    // Tri par défaut : plus récent en premier
    query = query.order('created_at', { ascending: false })

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // 7. Exécuter la requête
    const { data: gyms, error: gymsError, count } = await query

    if (gymsError) {
      // Log supprimé pour production
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération des salles',
          message: gymsError.message,
          details: gymsError
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 8. Calculer les métadonnées de pagination
    const totalPages = Math.ceil((count || 0) / limit)
    
    // 9. Enrichir les données avec infos utiles
    const enrichedGyms = (gyms || []).map(gym => ({
      ...gym,
      franchise_name: franchise.name,
      // Extraire le code de provisioning depuis kiosk_config
      provisioning_code: gym.kiosk_config?.provisioning_code || null,
      kiosk_url: gym.kiosk_config?.kiosk_url_slug ? 
        `/kiosk/${gym.kiosk_config.kiosk_url_slug}` : null
    }))

    const response: PaginatedResponse<Gym & { 
      franchise_name: string; 
      provisioning_code: string | null;
      kiosk_url: string | null;
    }> & { 
      franchise?: {
        id: string;
        name: string;
        contact_email: string;
      }
    } = {
      data: enrichedGyms,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      franchise: {
        id: franchise.id,
        name: franchise.name,
        contact_email: franchise.contact_email
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
// 🚫 Méthodes non autorisées
// ===========================================

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée - Utilisez /api/admin/gyms/create' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
    { status: 405 }
  )
} 