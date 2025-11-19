import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/production-logger'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Vérifier le token d'invitation
    const { data: invitation, error: invitError } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitError || !invitation) {
      logger.warn('❌ [INVITATION] Token invalide ou non trouvé', { token: token.substring(0, 10) })
      return NextResponse.json({ error: 'Invitation non trouvée' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation déjà ${invitation.status === 'accepted' ? 'acceptée' : 'révoquée'}` }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < now) {
      return NextResponse.json({ error: 'Invitation expirée' }, { status: 400 })
    }

    // 2. Créer le compte Supabase Auth
    // Le trigger DB handle_new_user() s'occupera d'insérer dans public.users
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.full_name,
        role: 'gym_manager',
        gym_id: invitation.gym_id,
      }
    })

    // GESTION D'ERREUR SPÉCIFIQUE
    if (signUpError) {
      const errorMsg = signUpError.message?.toLowerCase() || ''
      
      // Cas : Email déjà utilisé (422 Unprocessable Entity)
      if (errorMsg.includes('already registered') || errorMsg.includes('email address already exists') || signUpError.status === 422) {
        logger.warn('❌ [INVITATION] Email déjà existant', { email: invitation.email })
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email. Veuillez vous connecter ou demander une nouvelle invitation.' }, 
          { status: 409 } // 409 Conflict est plus approprié que 422 ou 500
        )
      }

      // Autres erreurs
      logger.error('❌ [INVITATION] Erreur création compte Auth', { error: signUpError.message })
      return NextResponse.json({ error: `Erreur création compte: ${signUpError.message}` }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Erreur inattendue: Utilisateur non créé' }, { status: 500 })
    }

    // 3. Marquer l'invitation comme acceptée
    const { error: updateError } = await supabaseAdmin
      .from('manager_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (updateError) {
      logger.error('❌ [INVITATION] Erreur update invitation', { error: updateError.message })
      // On ne bloque pas la réponse car le compte est créé
    }

    logger.success('✅ [INVITATION] Compte gérant créé via invitation', {
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
    logger.error('❌ [INVITATION] Erreur serveur inattendue', { error: error.message, stack: error.stack })
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
