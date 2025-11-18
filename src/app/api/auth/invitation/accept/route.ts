import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/production-logger'

// ============================================================================
// API: Accepter invitation et créer compte gérant
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

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

    // 1. Vérifier le token
    const { data: invitation, error: invitError } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitError || !invitation) {
      logger.warn('❌ [INVITATION] Token invalide', { token: token.substring(0, 10) })
      return NextResponse.json(
        { error: 'Invitation non trouvée' },
        { status: 404 }
      )
    }

    // 2. Vérifier statut et expiration
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation déjà ${invitation.status === 'accepted' ? 'acceptée' : 'révoquée'}` },
        { status: 400 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (expiresAt < now) {
      return NextResponse.json(
        { error: 'Invitation expirée' },
        { status: 400 }
      )
    }

    // 3. Vérifier si l'email existe déjà (TABLE USERS + AUTH)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', invitation.email)
      .single()

    // Si user dans DB, vérifier s'il existe aussi dans Auth
    if (existingUser) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingAuthUser = authUsers?.users?.find(u => u.email === invitation.email)
      
      if (existingAuthUser) {
        // Compte complet existe déjà
        logger.warn('❌ [INVITATION] Email déjà utilisé (Auth + DB)', { email: invitation.email }, { component: 'API:InvitationAccept' })
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' },
          { status: 409 }
        )
      } else {
        // Nettoyage orphelin: user dans DB mais pas dans Auth (rollback incomplet)
        logger.warn('🧹 [INVITATION] Nettoyage compte orphelin (DB sans Auth)', { userId: existingUser.id, email: invitation.email }, { component: 'API:InvitationAccept' })
        await supabaseAdmin.from('users').delete().eq('id', existingUser.id)
        // Continuer la création
      }
    }

    // 4. Créer le compte Supabase Auth
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        full_name: invitation.full_name,
        role: 'gym_manager',
      }
    })

    if (signUpError || !authData.user) {
      logger.error('❌ [INVITATION] Erreur création compte Auth', { error: signUpError })
      
      // Si email déjà utilisé
      if (signUpError?.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    // 5. Créer l'entrée dans la table users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: invitation.email,
        full_name: invitation.full_name,
        role: 'gym_manager',
        gym_id: invitation.gym_id, // Peut être null si pas de gym pré-assignée
        is_active: true,
      })

    if (userError) {
      logger.error('❌ [INVITATION] Erreur création user DB', { error: userError })
      
      // Rollback: supprimer le compte Auth créé
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 500 }
      )
    }

    // 6. Marquer l'invitation comme acceptée
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

    logger.success('✅ [INVITATION] Compte créé', {
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
