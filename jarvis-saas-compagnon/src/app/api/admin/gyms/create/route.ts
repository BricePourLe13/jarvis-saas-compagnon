import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { GymCreateRequest, ApiResponse, Gym } from '../../../../../types/franchise'

// ===========================================
// 🔧 Utilitaires
// ===========================================

function generateProvisioningCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateGymSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'gym-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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

function validateGymData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.franchise_id) {
    errors.push('ID de franchise requis')
  }

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Le nom de la salle est requis (minimum 2 caractères)')
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push('Adresse complète requise (minimum 5 caractères)')
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.push('Ville requise')
  }

  if (!data.postal_code || data.postal_code.trim().length < 2) {
    errors.push('Code postal requis')
  }

  return { valid: errors.length === 0, errors }
}

// ===========================================
// 🎯 ENDPOINT PRINCIPAL
// ===========================================

export async function POST(request: NextRequest) {
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

    // 3. Parser et valider les données
    const body: GymCreateRequest = await request.json()
    const validation = validateGymData(body)
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          message: validation.errors.join(', ') 
        } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // 4. Vérifier que la franchise existe
    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .select('id, name')
      .eq('id', body.franchise_id)
      .single()

    if (franchiseError || !franchise) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Franchise introuvable',
          message: `Aucune franchise trouvée avec l'ID ${body.franchise_id}`
        } as ApiResponse<null>,
        { status: 404 }
      )
    }

    // 5. Préparer la configuration JARVIS par défaut
    const defaultKioskConfig = {
      provisioning_code: generateProvisioningCode(),
      kiosk_url_slug: generateGymSlug(),
      provisioning_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h
      is_provisioned: false,
      provisioned_at: null,
      installation_token: crypto.randomUUID(),
      rfid_reader_id: null,
      hardware_version: "1.0",
      last_sync: null,
      last_heartbeat: null,
      jarvis_config: {
        avatar_customization: {},
        brand_colors: {
          primary: '#2563eb',
          secondary: '#1e40af',
          accent: '#3b82f6'
        },
        welcome_message: body.welcome_message || `Bienvenue à ${body.name} !`,
        features_enabled: ['analytics', 'reports', 'voice_interaction']
      }
    }

    // 6. Créer la salle
    const gymData = {
      franchise_id: body.franchise_id,
      name: body.name.trim(),
      address: body.address.trim(),
      city: body.city.trim(),
      postal_code: body.postal_code.trim(),
      kiosk_config: defaultKioskConfig,
      opening_hours: body.opening_hours || {
        monday: { open: "06:00", close: "22:00" },
        tuesday: { open: "06:00", close: "22:00" },
        wednesday: { open: "06:00", close: "22:00" },
        thursday: { open: "06:00", close: "22:00" },
        friday: { open: "06:00", close: "22:00" },
        saturday: { open: "08:00", close: "20:00" },
        sunday: { open: "08:00", close: "20:00" }
      },
      features: ['cardio', 'musculation', 'cours-collectifs'], // Valeur par défaut
      manager_id: null, // Sera ajouté plus tard
      status: 'active' as const
    }

    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .insert(gymData)
      .select()
      .single()

    if (gymError) {
      console.error('Erreur création salle:', gymError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la création de la salle',
          message: gymError.message 
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 7. Réponse de succès avec infos utiles
    const response: ApiResponse<Gym & { franchise_name: string; provisioning_code: string }> = {
      success: true,
      data: {
        ...gym,
        franchise_name: franchise.name,
        provisioning_code: defaultKioskConfig.provisioning_code
      },
      message: `Salle "${gym.name}" créée avec succès dans la franchise "${franchise.name}"`
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Erreur inattendue:', error)
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

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée - Utilisez /api/admin/franchises/[id]/gyms' },
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