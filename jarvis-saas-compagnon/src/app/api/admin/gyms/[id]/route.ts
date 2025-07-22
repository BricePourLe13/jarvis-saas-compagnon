import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ApiResponse, Gym } from '../../../../../types/franchise'

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
// 🎯 ENDPOINT GET - Détails d'une salle
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Attendre les paramètres
    const resolvedParams = await params
    const gymId = resolvedParams.id

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

    // 3. Validation auth
    const authResult = await validateSuperAdmin(supabase)
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error } as ApiResponse<null>,
        { status: 401 }
      )
    }

    // 4. Récupérer la salle
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Salle introuvable',
          message: `Aucune salle trouvée avec l'ID ${gymId}`
        } as ApiResponse<null>,
        { status: 404 }
      )
    }

    // 5. Enrichir les données
    const enrichedGym = {
      ...gym,
      // Vérifier si le Kiosk est provisionné
      is_kiosk_provisioned: gym.kiosk_config?.is_provisioned || false,
      // URL complète du Kiosk
      kiosk_full_url: gym.kiosk_config?.kiosk_url_slug ? 
        `/kiosk/${gym.kiosk_config.kiosk_url_slug}` : null
    }

    // 6. Retourner les données
    return NextResponse.json({
      success: true,
      data: enrichedGym,
      message: 'Salle récupérée avec succès'
    } as ApiResponse<Gym>)

  } catch (error) {
    console.error('Erreur récupération salle:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur',
        message: 'Une erreur inattendue s\'est produite'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}

// ===========================================
// 🎯 ENDPOINT PUT - Mise à jour d'une salle
// ===========================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Attendre les paramètres
    const resolvedParams = await params
    const gymId = resolvedParams.id

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

    // 3. Validation auth
    const authResult = await validateSuperAdmin(supabase)
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error } as ApiResponse<null>,
        { status: 401 }
      )
    }

    // 4. Parser le body
    const body = await request.json()
    const {
      name,
      address,
      city,
      postal_code,
      status,
      member_count,
      kiosk_config
    } = body

    // 5. Validation des données
    if (!name?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          message: 'Le nom de la salle est requis'
        } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // 6. Vérifier que la salle existe
    const { data: existingGym, error: checkError } = await supabase
      .from('gyms')
      .select('id, kiosk_config')
      .eq('id', gymId)
      .single()

    if (checkError || !existingGym) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Salle introuvable',
          message: `Aucune salle trouvée avec l'ID ${gymId}`
        } as ApiResponse<null>,
        { status: 404 }
      )
    }

    // 7. Préparer les données de mise à jour
    const updateData = {
      name: name.trim(),
      address: address?.trim(),
      city: city?.trim(),
      postal_code: postal_code?.trim(),
      status: status || 'active',
      member_count: member_count || 0,
      kiosk_config: {
        ...existingGym.kiosk_config,
        ...kiosk_config
      },
      updated_at: new Date().toISOString()
    }

    // 8. Mettre à jour la salle
    const { data: updatedGym, error: updateError } = await supabase
      .from('gyms')
      .update(updateData)
      .eq('id', gymId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Erreur mise à jour salle:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la mise à jour',
          message: updateError.message
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 9. Retourner la salle mise à jour
    return NextResponse.json({
      success: true,
      data: updatedGym,
      message: 'Salle mise à jour avec succès'
    } as ApiResponse<Gym>)

  } catch (error) {
    console.error('Erreur mise à jour salle:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur',
        message: 'Une erreur inattendue s\'est produite'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
} 