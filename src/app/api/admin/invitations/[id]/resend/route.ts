import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/production-logger'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

// ============================================================================
// POST: Renvoyer une invitation (génère nouveau token + email)
// ============================================================================
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Récupérer l'invitation existante
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('manager_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !invitation) {
      logger.error('❌ [INVITATION] Invitation non trouvée', { id })
      return NextResponse.json({ error: 'Invitation non trouvée' }, { status: 404 })
    }

    // Vérifier que l'invitation n'est pas déjà acceptée
    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: 'Cette invitation a déjà été acceptée' }, { status: 400 })
    }

    // Générer un nouveau token et prolonger l'expiration
    const newToken = crypto.randomUUID()
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 jours

    // Mettre à jour l'invitation
    const { error: updateError } = await supabaseAdmin
      .from('manager_invitations')
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
        status: 'pending',
      })
      .eq('id', id)

    if (updateError) {
      logger.error('❌ [INVITATION] Erreur mise à jour', { id, error: updateError.message })
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    // Renvoyer l'email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitation/${newToken}`

    try {
      await resend.emails.send({
        from: 'JARVIS <noreply@jarvis-group.net>',
        to: invitation.email,
        subject: '🔄 Nouvelle invitation JARVIS - Créez votre compte gérant',
        html: `
          <h2>Nouvelle invitation JARVIS</h2>
          <p>Bonjour ${invitation.full_name},</p>
          <p>Une nouvelle invitation vous a été envoyée pour créer votre compte gérant JARVIS.</p>
          <p><a href="${invitationUrl}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Créer mon compte</a></p>
          <p>Ce lien expire le <strong>${newExpiresAt.toLocaleDateString('fr-FR')}</strong>.</p>
          <p>Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
        `,
      })

      logger.success('✅ [INVITATION] Invitation renvoyée', { id, email: invitation.email })
      return NextResponse.json({ message: 'Invitation renvoyée avec succès' }, { status: 200 })
    } catch (emailError: any) {
      logger.error('❌ [INVITATION] Erreur envoi email', { error: emailError.message })
      return NextResponse.json({ error: 'Invitation mise à jour mais email non envoyé' }, { status: 500 })
    }
  } catch (error: any) {
    logger.error('❌ [INVITATION] Erreur serveur', { error: error.message })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

