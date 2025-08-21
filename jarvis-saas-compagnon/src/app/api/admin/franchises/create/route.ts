import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { FranchiseCreateRequest, ApiResponse, Franchise } from '../../../../../types/franchise'

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

function validateFranchiseData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Le nom de la franchise est requis (minimum 2 caractères)')
  }

  if (!data.contact_email || !data.contact_email.includes('@')) {
    errors.push('Email de contact valide requis')
  }

  if (data.owner_email && !data.owner_email.includes('@')) {
    errors.push('Email du propriétaire invalide')
  }

  if (data.owner_email && !data.owner_full_name?.trim()) {
    errors.push('Nom complet du propriétaire requis si email fourni')
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
    const body: FranchiseCreateRequest = await request.json()
    const validation = validateFranchiseData(body)
    
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

    // 4. La configuration JARVIS se fait au niveau des salles, pas de la franchise

    // 5. Pour l'instant, on crée juste la franchise sans propriétaire
    // La gestion des utilisateurs propriétaires sera ajoutée plus tard
    let ownerId: string | null = null
    
    // Log supprimé pour production
      name: body.name,
      contact_email: body.contact_email,
      create_owner: body.owner_email ? 'Yes' : 'No'
    })

    // 6. Créer la franchise (sans config JARVIS - elle se fait au niveau salle)
    const franchiseData = {
      name: body.name.trim(),
      contact_email: body.contact_email.trim(),
      phone: body.phone?.trim() || null,
      headquarters_address: body.headquarters_address?.trim() || null,
      city: body.city?.trim() || null,
      postal_code: body.postal_code?.trim() || null,
      owner_id: ownerId,
      status: 'active' as const
    }

    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .insert(franchiseData)
      .select()
      .single()

    if (franchiseError) {
      // Log supprimé pour production
      
      // Gestion spécifique des erreurs de contrainte unique
      let errorMessage = 'Erreur lors de la création de la franchise'
      if (franchiseError.code === '23505') {
        if (franchiseError.message.includes('franchises_email_unique')) {
          errorMessage = `L'email "${body.contact_email}" est déjà utilisé par une autre franchise`
        } else if (franchiseError.message.includes('franchises_name_unique')) {
          errorMessage = `Le nom "${body.name}" est déjà utilisé par une autre franchise`
        } else {
          errorMessage = 'Une franchise avec ces informations existe déjà'
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          message: franchiseError.message 
        } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // 7. Mettre à jour franchise_access de l'utilisateur si créé
    if (ownerId && franchise) {
      await supabase
        .from('users')
        .update({
          franchise_access: [franchise.id]
        })
        .eq('id', ownerId)
    }

    // 8. Réponse de succès
    const response: ApiResponse<Franchise> = {
      success: true,
      data: franchise,
      message: `Franchise "${franchise.name}" créée avec succès${ownerId ? ' avec propriétaire invité' : ''}`
    }

    return NextResponse.json(response, { status: 201 })

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

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Méthode non autorisée' },
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