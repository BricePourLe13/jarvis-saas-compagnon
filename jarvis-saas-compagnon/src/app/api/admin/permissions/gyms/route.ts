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

interface Gym {
  id: string
  name: string
  city: string
  franchise_id: string
  franchise_name: string
  manager_id: string | null
  status: string
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
// 📋 GET GYMS - GET
// ===========================================

export async function GET(): Promise<NextResponse<ApiResponse<Gym[]>>> {
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

    // Récupérer toutes les salles avec infos franchise
    const { data: gyms, error } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        city,
        franchise_id,
        manager_id,
        status,
        franchises!inner(
          name
        )
      `)
      .order('name')

    if (error) {
      console.error('❌ Erreur récupération salles:', error)
      return NextResponse.json(
        { success: false, error: error.message, message: 'Erreur lors de la récupération des salles' },
        { status: 500 }
      )
    }

    // Reformater les données
    const formattedGyms = gyms?.map((gym: any) => ({
      id: gym.id,
      name: gym.name,
      city: gym.city,
      franchise_id: gym.franchise_id,
      franchise_name: gym.franchises.name,
      manager_id: gym.manager_id,
      status: gym.status
    })) || []

    console.log('✅ Salles récupérées:', formattedGyms.length)

    return NextResponse.json({
      success: true,
      data: formattedGyms,
      message: 'Salles récupérées avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API get gyms:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}