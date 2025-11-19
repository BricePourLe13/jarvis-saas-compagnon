import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { logger } from '@/lib/production-logger'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * 📨 POST /api/admin/invitations/send
 * 
 * Invite un gérant à rejoindre JARVIS (avec ou sans gym déjà créée)
 * 
 * Body:
 *   - email: string (required)
 *   - full_name: string (required)
 *   - gym_id: string (optional - si gym déjà créée par admin)
 * 
 * Flow:
 *   1. Admin invite gérant (email + nom)
 *   2. Email envoyé avec lien onboarding
 *   3. Gérant accepte → créé son compte
 *   4. Gérant créé SA salle (self-service)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
          remove: (name: string, options: any) => cookieStore.set({ name, value: '', ...options }),
        },
      }
    )

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est super_admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // Récupérer les données de l'invitation
    const { email, full_name, gym_id } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Email et nom complet requis' },
        { status: 400 }
      )
    }

    // Vérifier si gym_id fourni et valide (optionnel)
    let gymName: string | null = null
    if (gym_id) {
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('id', gym_id)
        .single()

      if (gymError || !gym) {
        return NextResponse.json(
          { success: false, error: 'Salle non trouvée' },
          { status: 404 }
        )
      }
      gymName = gym.name
    }

    // Générer un token unique
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

    // Créer l'invitation (gym_id peut être NULL)
    const { error: invitationError } = await supabase
      .from('manager_invitations')
      .insert({
        email,
        full_name,
        gym_id: gym_id || null,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        status: 'pending',
      })

    if (invitationError) {
      logger.error('Erreur création invitation', { error: invitationError, email }, { component: 'InvitationSend' })
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de l\'invitation' },
        { status: 500 }
      )
    }

    // Envoyer l'email (adapté selon si gym associée ou non)
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitation/${token}`
    
    const emailSubject = gymName 
      ? `Invitation à gérer ${gymName} sur JARVIS`
      : `Invitation à rejoindre JARVIS`

    const emailBody = gymName
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bonjour ${full_name},</h2>
          <p>Vous avez été invité(e) à gérer la salle <strong>${gymName}</strong> sur la plateforme JARVIS.</p>
          <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accepter l'invitation
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Ce lien expire dans 7 jours.<br>
            Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            JARVIS Group - Agent Vocal IA pour Salles de Sport<br>
            <a href="https://jarvis-group.net" style="color: #3b82f6;">jarvis-group.net</a>
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bonjour ${full_name},</h2>
          <p>Vous avez été invité(e) à rejoindre JARVIS en tant que gérant de salle.</p>
          <p>JARVIS est la plateforme d'agent vocal IA pour salles de sport. Une fois votre compte créé, vous pourrez configurer votre salle et vos kiosks.</p>
          <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accepter l'invitation
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Ce lien expire dans 7 jours.<br>
            Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            JARVIS Group - Agent Vocal IA pour Salles de Sport<br>
            <a href="https://jarvis-group.net" style="color: #3b82f6;">jarvis-group.net</a>
          </p>
        </div>
      `
    
    const { error: emailError } = await resend.emails.send({
      from: 'no-reply@jarvis-group.net',
      to: email,
      subject: emailSubject,
      html: emailBody,
    })

    if (emailError) {
      logger.error('Erreur envoi email invitation', { error: emailError, email }, { component: 'InvitationSend' })
      // L'invitation est créée mais l'email a échoué
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invitation créée mais l\'email n\'a pas pu être envoyé',
          details: emailError 
        },
        { status: 500 }
      )
    }

    logger.info('Invitation envoyée avec succès', { email, gymName, gym_id }, { component: 'InvitationSend' })

    return NextResponse.json({
      success: true,
      message: `Invitation envoyée à ${email}`,
    })

  } catch (error) {
    logger.error('Erreur serveur lors envoi invitation', { error }, { component: 'InvitationSend' })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

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
