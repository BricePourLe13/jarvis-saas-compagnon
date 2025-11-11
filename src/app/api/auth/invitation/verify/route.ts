import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/invitation/verify
 * Vérifie si un token d'invitation est valide
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role pour bypass RLS
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

    // Récupérer l'invitation
    const { data: invitation, error } = await supabase
      .from('manager_invitations')
      .select(`
        id,
        email,
        full_name,
        gym_id,
        expires_at,
        accepted_at,
        gyms(name, city)
      `)
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
    }

    // Vérifier si déjà acceptée
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation déjà utilisée' }, { status: 410 })
    }

    // Vérifier si expirée
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expirée' }, { status: 410 })
    }

    const gym = (invitation as any).gyms

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        full_name: invitation.full_name,
        gym_name: gym?.name || 'Salle inconnue',
        gym_city: gym?.city || '',
        expires_at: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('[API] Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

