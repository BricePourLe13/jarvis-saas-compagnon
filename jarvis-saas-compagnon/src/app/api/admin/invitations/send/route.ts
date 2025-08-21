import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient, getEnvironmentConfig, createServerClientWithConfig } from '@/lib/supabase-admin'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface InviteAdminRequest {
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner' | 'franchise_admin'
  franchise_access?: string[] // Pour franchise_owner uniquement
  department?: string // Pour franchise_admin
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message: string
}

// ===========================================
// 🛡️ VALIDATION & SÉCURITÉ
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

function validateInviteRequest(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Email validation
  if (!body.email || typeof body.email !== 'string') {
    errors.push('Email requis')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('Format email invalide')
  }
  
  // Nom complet
  if (!body.full_name || typeof body.full_name !== 'string' || body.full_name.trim().length < 2) {
    errors.push('Nom complet requis (minimum 2 caractères)')
  }
  
  // Rôle validation - Supporte franchise_admin pour cohérence avec le code frontend
  if (!body.role || !['super_admin', 'franchise_owner', 'franchise_admin'].includes(body.role)) {
    errors.push('Rôle invalide (super_admin, franchise_owner, ou franchise_admin uniquement)')
  }
  
  // Franchise access pour franchise_owner
  if (body.role === 'franchise_owner') {
    if (!body.franchise_access || !Array.isArray(body.franchise_access) || body.franchise_access.length === 0) {
      errors.push('Au moins une franchise requise pour franchise_owner')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

// ===========================================
// 🎯 ENDPOINT PRINCIPAL
// ===========================================

export async function POST(request: NextRequest) {
  try {
    // 1. Initialiser Supabase avec cookies pour auth
    const cookieStore = await cookies()
    const supabase = createServerClientWithConfig(cookieStore)
    
    // Client admin pour les invitations
    const adminSupabase = createAdminClient()
    
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

    // 3. Parsing et validation des données
    const body: InviteAdminRequest = await request.json()
    const { isValid, errors } = validateInviteRequest(body)
    
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          message: errors.join(', ')
        } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // 4. Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', body.email.toLowerCase())
      .single()
      
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Utilisateur existant',
          message: `Un utilisateur avec l'email ${body.email} existe déjà`
        } as ApiResponse<null>,
        { status: 409 }
      )
    }

    // 5. 🔥 INVITATION NATIVE SUPABASE
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      body.email.toLowerCase(),
      {
        data: {
          full_name: body.full_name.trim(),
          role: body.role,
          franchise_access: body.franchise_access || [],
          invited_by: authResult.user.id,
          invitation_type: 'admin_access'
        },
        redirectTo: `${getEnvironmentConfig().appUrl}/auth/setup?type=admin&role=${body.role}`
      }
    )

    if (inviteError) {
      // Log supprimé pour production
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur invitation',
          message: inviteError.message || 'Impossible d\'envoyer l\'invitation'
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 6. Créer le profil utilisateur en attente
    const { error: profileError } = await adminSupabase
      .from('users')
      .insert({
        id: inviteData.user.id,
        email: body.email.toLowerCase(),
        full_name: body.full_name.trim(),
        role: body.role,
        franchise_access: body.franchise_access || [],
        is_active: false, // Sera activé lors de la première connexion
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      // Log supprimé pour production
      // L'invitation a été envoyée mais le profil n'a pas pu être créé
      // On continue quand même, le profil sera créé au callback
    }

    // 7. Log de l'action (pour audit)
    await adminSupabase
      .from('jarvis_errors_log')
      .insert({
        type: 'admin_invitation_sent',
        details: {
          invited_email: body.email,
          invited_role: body.role,
          invited_by: authResult.user.id,
          invitation_id: inviteData.user.id
        },
        timestamp: new Date().toISOString()
      })

    // 8. Réponse de succès
    const response: ApiResponse<{ invitation_id: string; email: string }> = {
      success: true,
      data: {
        invitation_id: inviteData.user.id,
        email: body.email
      },
      message: `Invitation envoyée avec succès à ${body.email}`
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    // Log supprimé pour production
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur système',
        message: error.message || 'Une erreur inattendue s\'est produite'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}

// ===========================================
// 🔒 MÉTHODES NON AUTORISÉES
// ===========================================

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
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