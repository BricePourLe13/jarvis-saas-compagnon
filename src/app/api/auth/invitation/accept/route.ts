import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/production-logger'

// ============================================================================
// API: Accepter invitation et créer compte gérant
// Architecture: Utilise trigger Supabase natif (auth.users → public.users)
// Pattern: Officiel Supabase (zero-rollback, atomique par design)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    // 1. Validation input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Utiliser service role pour bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Vérifier l'invitation (status + expiration)
    const { data: invitation, error: invitError } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (invitError || !invitation) {
      logger.warn('❌ [INVITATION] Token invalide ou déjà utilisé', { token: token.substring(0, 10) })
      return NextResponse.json(
        { error: 'Invitation invalide ou déjà utilisée' },
        { status: 404 }
      )
    }

    // Vérifier expiration
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (expiresAt < now) {
      return NextResponse.json(
        { error: 'Invitation expirée' },
        { status: 400 }
      )
    }

    // 3. Créer Auth user (trigger auto-crée users entry via handle_new_user)
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        full_name: invitation.full_name,
        role: 'gym_manager',
        gym_id: invitation.gym_id, // Trigger lira cette valeur
      }
    })

    if (signUpError || !authData.user) {
      logger.error('❌ [INVITATION] Erreur création compte Auth', { error: signUpError })
      
      // Si email déjà utilisé
      if (signUpError?.message?.includes('already registered') || signUpError?.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    // 4. Marquer l'invitation comme acceptée
    const { error: updateError } = await supabaseAdmin
      .from('manager_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (updateError) {
      logger.error('❌ [INVITATION] Erreur update invitation', { error: updateError })
    }

    logger.success('✅ [INVITATION] Compte créé via trigger', {
      userId: authData.user.id,
      email: invitation.email,
      gymId: invitation.gym_id
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: invitation.full_name,
      }
    })

  } catch (error: any) {
    logger.error('❌ [INVITATION] Erreur serveur', { error: error.message })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
