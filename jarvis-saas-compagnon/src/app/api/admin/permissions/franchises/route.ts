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

interface Franchise {
  id: string
  name: string
  city: string
  owner_id: string
  is_active: boolean
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
// 📋 GET FRANCHISES - GET
// ===========================================

export async function GET(): Promise<NextResponse<ApiResponse<Franchise[]>>> {
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

    // Récupérer toutes les franchises
    const { data: franchises, error } = await supabase
      .from('franchises')
      .select('id, name, city, owner_id, is_active')
      .order('name')

    if (error) {
      // Log supprimé pour production
      return NextResponse.json(
        { success: false, error: error.message, message: 'Erreur lors de la récupération des franchises' },
        { status: 500 }
      )
    }

    // Log supprimé pour production

    return NextResponse.json({
      success: true,
      data: franchises || [],
      message: 'Franchises récupérées avec succès'
    })

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}