export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient, getEnvironmentConfig, createServerClientWithConfig } from '@/lib/supabase-admin'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface ResendInviteRequest {
  email: string
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

// ===========================================
// 🎯 ENDPOINT PRINCIPAL
// ===========================================

export async function POST(request: NextRequest) {
  try {
    // 1. Initialiser clients Supabase
    const cookieStore = await cookies()
    const supabase = createServerClientWithConfig(cookieStore)
    
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
    const body: ResendInviteRequest = await request.json()
    
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email invalide',
          message: 'Adresse email valide requise'
        } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // 4. Récupérer l'utilisateur existant
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', body.email.toLowerCase())
      .single()
      
    if (userError || !existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Utilisateur non trouvé',
          message: `Aucun utilisateur avec l'email ${body.email}`
        } as ApiResponse<null>,
        { status: 404 }
      )
    }

    // 5. Vérifier que l'utilisateur n'est pas déjà actif
    if (existingUser.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Utilisateur déjà actif',
          message: `L'utilisateur ${body.email} est déjà actif`
        } as ApiResponse<null>,
        { status: 409 }
      )
    }

    // 6. Supprimer l'utilisateur de Supabase Auth (si existe)
    try {
      await adminSupabase.auth.admin.deleteUser(existingUser.id)
      console.log(`🗑️ Ancien utilisateur Auth supprimé: ${existingUser.id}`)
    } catch (deleteError) {
      console.log(`ℹ️ Utilisateur Auth non trouvé (normal): ${existingUser.id}`)
    }

    // 7. Supprimer de la table users
    const { error: deleteUserError } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', existingUser.id)

    if (deleteUserError) {
      console.error('❌ Erreur suppression user:', deleteUserError)
    }

    // 8. 🔥 RENVOYER L'INVITATION
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      body.email.toLowerCase(),
      {
        data: {
          full_name: existingUser.full_name,
          role: existingUser.role,
          franchise_access: existingUser.franchise_access || [],
          invited_by: authResult.user.id,
          invitation_type: 'admin_access_resend'
        },
        redirectTo: `${getEnvironmentConfig().appUrl}/auth/setup?type=admin&role=${existingUser.role}`
      }
    )

    if (inviteError) {
      console.error('❌ Erreur réenvoi invitation:', inviteError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur invitation',
          message: inviteError.message || 'Impossible de renvoyer l\'invitation'
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 9. Recréer le profil utilisateur
    const { error: profileError } = await adminSupabase
      .from('users')
      .insert({
        id: inviteData.user.id,
        email: body.email.toLowerCase(),
        full_name: existingUser.full_name,
        role: existingUser.role,
        franchise_access: existingUser.franchise_access || [],
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('❌ Erreur recréation profil:', profileError)
    }

    // 10. Log de l'action
    await adminSupabase
      .from('jarvis_errors_log')
      .insert({
        type: 'admin_invitation_resent',
        details: {
          resent_email: body.email,
          resent_role: existingUser.role,
          resent_by: authResult.user.id,
          new_invitation_id: inviteData.user.id,
          old_user_id: existingUser.id
        },
        timestamp: new Date().toISOString()
      })

    // 11. Réponse de succès
    const response: ApiResponse<{ invitation_id: string; email: string }> = {
      success: true,
      data: {
        invitation_id: inviteData.user.id,
        email: body.email
      },
      message: `Invitation renvoyée avec succès à ${body.email}`
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('💥 Erreur système réenvoi invitation:', error)
    
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