import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/invitation/accept
 * Accepte une invitation et crée le compte gérant
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et password requis' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    // UTILISER SERVICE ROLE POUR BYPASSER RLS
    const supabase = getSupabaseService()

    // 1. Récupérer l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('manager_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
    }

    // 2. Vérifier validité
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation déjà utilisée' }, { status: 410 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expirée' }, { status: 410 })
    }

    // 3. Créer le compte auth.users via Supabase Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Email déjà confirmé via invitation
      user_metadata: {
        full_name: invitation.full_name
      }
    })

    if (authError || !authUser.user) {
      console.error('[API] Error creating auth user:', authError)
      return NextResponse.json({ 
        error: authError?.message || 'Erreur lors de la création du compte' 
      }, { status: 500 })
    }

    // 4. Mettre à jour le profil public.users (le trigger a déjà créé le profil avec auth.uid())
    console.log('[API ACCEPT] Updating user profile...')
    console.log('[API ACCEPT] User ID:', authUser.user.id)
    console.log('[API ACCEPT] Email:', invitation.email)
    console.log('[API ACCEPT] Full name:', invitation.full_name)
    console.log('[API ACCEPT] Gym ID:', invitation.gym_id)
    
    // Le trigger on_auth_user_created a créé le profil avec auth.uid()
    // On UPDATE simplement ce profil existant
    const { error: profileError } = await supabase
      .from('users')
      .update({
        full_name: invitation.full_name,
        role: 'gym_manager',
        gym_id: invitation.gym_id,
        gym_access: [invitation.gym_id],
        is_active: true
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('[API ACCEPT] ❌ ERROR creating user profile:', profileError)
      console.error('[API ACCEPT] Error code:', profileError.code)
      console.error('[API ACCEPT] Error message:', profileError.message)
      console.error('[API ACCEPT] Error details:', JSON.stringify(profileError, null, 2))
      
      // Rollback : supprimer le auth user
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ 
        error: `Erreur lors de la création du profil utilisateur: ${profileError.message}`,
        code: profileError.code
      }, { status: 500 })
    }
    
    console.log('[API ACCEPT] ✅ User profile created successfully')

    // 5. Marquer l'invitation comme acceptée
    await supabase
      .from('manager_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // 6. Log action
    await supabase
      .from('system_logs')
      .insert({
        event_type: 'manager_account_created',
        user_id: authUser.user.id,
        resource_type: 'user',
        resource_id: authUser.user.id,
        metadata: {
          email: invitation.email,
          gym_id: invitation.gym_id,
          via_invitation: true
        }
      })

    return NextResponse.json({
      success: true,
      user_id: authUser.user.id,
      email: invitation.email
    })

  } catch (error) {
    console.error('[API] Unexpected error in POST /api/auth/invitation/accept:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

