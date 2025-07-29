import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient, createAdminClient } from '@/lib/supabase-admin'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface InviteAdminRequest {
  email: string
  full_name: string
  role: 'super_admin' | 'franchise_owner'
  franchise_access?: string[] // Pour franchise_owner uniquement
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
  
  // Rôle validation
  if (!body.role || !['super_admin', 'franchise_owner'].includes(body.role)) {
    errors.push('Rôle invalide (super_admin ou franchise_owner uniquement)')
  }
  
  // Franchise access pour franchise_owner
  if (body.role === 'franchise_owner') {
    if (!body.franchise_access || !Array.isArray(body.franchise_access) || body.franchise_access.length === 0) {
      errors.push('Au moins une franchise requise pour franchise_owner')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

async function verifyInviterPermissions(supabase: any, inviterId: string, targetRole: string, franchiseAccess?: string[]) {
  // Récupérer le profil de l'inviteur
  const { data: inviter, error } = await supabase
    .from('users')
    .select('role, franchise_access')
    .eq('id', inviterId)
    .single()
    
  if (error || !inviter) {
    throw new Error('Inviteur non trouvé')
  }
  
  // Seuls les super_admin peuvent inviter
  if (inviter.role !== 'super_admin') {
    throw new Error('Seuls les super admins peuvent envoyer des invitations')
  }
  
  // Super admin peut tout faire
  if (inviter.role === 'super_admin') {
    return true
  }
  
  // Vérifications supplémentaires si besoin
  return true
}

// ===========================================
// 🎯 ENDPOINT PRINCIPAL
// ===========================================

export async function POST(request: NextRequest) {
  try {
    // 1. Initialisation clients Supabase
    const supabase = createSimpleClient() // Pour auth normale
    const adminSupabase = createAdminClient() // Pour invitations
    
    // 2. Vérification auth de l'inviteur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Non authentifié',
          message: 'Vous devez être connecté pour envoyer des invitations'
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

    // 4. Vérification des permissions de l'inviteur
    await verifyInviterPermissions(supabase, user.id, body.role, body.franchise_access)

    // 5. Vérifier si l'utilisateur existe déjà
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

    // 6. 🔥 INVITATION NATIVE SUPABASE
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      body.email.toLowerCase(),
      {
        data: {
          full_name: body.full_name.trim(),
          role: body.role,
          franchise_access: body.franchise_access || [],
          invited_by: user.id,
          invitation_type: 'admin_access'
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/setup?type=admin`
      }
    )

    if (inviteError) {
      console.error('❌ Erreur invitation Supabase:', inviteError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur invitation',
          message: inviteError.message || 'Impossible d\'envoyer l\'invitation'
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    // 7. Créer le profil utilisateur en attente
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
      console.error('❌ Erreur création profil:', profileError)
      // L'invitation a été envoyée mais le profil n'a pas pu être créé
      // On continue quand même, le profil sera créé au callback
    }

    // 8. Log de l'action (pour audit)
    await adminSupabase
      .from('jarvis_errors_log')
      .insert({
        type: 'admin_invitation_sent',
        details: {
          invited_email: body.email,
          invited_role: body.role,
          invited_by: user.id,
          invitation_id: inviteData.user.id
        },
        timestamp: new Date().toISOString()
      })

    // 9. Réponse de succès
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
    console.error('💥 Erreur système invitation:', error)
    
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