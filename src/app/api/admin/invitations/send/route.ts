import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/admin/invitations/send
 * Envoie une invitation par email à un nouveau gérant
 * Génère un token sécurisé et stocke l'invitation en BDD
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // 1. Vérifier l'auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Vérifier permissions super_admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé - Super admin requis' }, { status: 403 })
    }

    // 3. Parser body
    const body = await request.json()
    const { email, full_name, gym_id } = body

    if (!email || !full_name || !gym_id) {
      return NextResponse.json({ error: 'Email, nom et gym_id requis' }, { status: 400 })
    }

    // 4. Vérifier que la salle existe
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, city')
      .eq('id', gym_id)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    }

    // 5. Vérifier si l'email n'est pas déjà utilisé
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    // 6. Générer token sécurisé
    const token = randomBytes(32).toString('hex')

    // 7. Créer l'invitation en BDD
    const { data: invitation, error: invitationError } = await supabase
      .from('manager_invitations')
      .insert({
        email,
        full_name,
        gym_id,
        token,
        created_by: session.user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
      })
      .select()
      .single()

    if (invitationError) {
      console.error('[API] Error creating invitation:', invitationError)
      return NextResponse.json({ error: 'Erreur lors de la création de l\'invitation' }, { status: 500 })
    }

    // 8. Envoyer l'email via Resend
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitation/${token}`

    try {
      await resend.emails.send({
        from: 'JARVIS <no-reply@jarvis-group.net>',
        to: [email],
        subject: `Invitation à gérer ${gym.name} avec JARVIS`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 14px 28px; background: #000; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .button:hover { background: #333; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #000; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🤖 Bienvenue sur JARVIS</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Bonjour <strong>${full_name}</strong>,</p>
      
      <p>Vous avez été invité(e) à rejoindre JARVIS en tant que <strong>Gérant de salle</strong> pour :</p>
      
      <div class="info-box">
        <h3 style="margin: 0 0 10px 0;">🏋️ ${gym.name}</h3>
        <p style="margin: 0; color: #666;">${gym.city}</p>
      </div>
      
      <p><strong>JARVIS</strong> est votre assistant IA qui va révolutionner l'expérience de vos adhérents et vous aider à réduire le churn grâce à :</p>
      
      <ul style="line-height: 2;">
        <li>✅ Interface vocale 24/7 pour vos membres</li>
        <li>⚠️ Détection automatique des membres à risque</li>
        <li>📊 Dashboard avec insights actionnables</li>
        <li>🤖 Alertes intelligentes et recommandations</li>
      </ul>
      
      <p>Cliquez sur le bouton ci-dessous pour créer votre compte et accéder à votre dashboard :</p>
      
      <div style="text-align: center;">
        <a href="${invitationUrl}" class="button">
          Créer mon compte gérant
        </a>
      </div>
      
      <p style="font-size: 13px; color: #666; margin-top: 30px;">
        Ce lien est valable <strong>7 jours</strong>. Si vous n'avez pas demandé cette invitation, ignorez cet email.
      </p>
      
      <p style="font-size: 13px; color: #666;">
        Lien direct : <a href="${invitationUrl}" style="color: #000;">${invitationUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p>JARVIS Group © 2024 - Agent IA pour salles de sport</p>
      <p><a href="https://jarvis-group.net" style="color: #666;">jarvis-group.net</a></p>
    </div>
  </div>
</body>
</html>
        `
      })

      console.log('[API] Invitation email sent successfully to:', email)
    } catch (emailError) {
      console.error('[API] Error sending email:', emailError)
      // Continue quand même, l'invitation est créée en BDD
      // L'admin peut renvoyer l'email si nécessaire
    }

    // 9. Log action (audit trail)
    await supabase
      .from('system_logs')
      .insert({
        event_type: 'manager_invited',
        user_id: session.user.id,
        resource_type: 'manager_invitation',
        resource_id: invitation.id,
        metadata: {
          email,
          gym_id,
          gym_name: gym.name
        }
      })

    return NextResponse.json({
      success: true,
      invitation_id: invitation.id,
      invitation_url: invitationUrl,
      expires_at: invitation.expires_at
    })

  } catch (error) {
    console.error('[API] Unexpected error in POST /api/admin/invitations/send:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
