import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// API: Vérifier invitation token
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      )
    }

    // Utiliser service role pour vérifier (pas de RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier le token dans manager_invitations
    const { data: invitation, error } = await supabase
      .from('manager_invitations')
      .select(`
        *,
        gyms (name, city)
      `)
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier statut
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation déjà ${invitation.status === 'accepted' ? 'acceptée' : 'révoquée'}` },
        { status: 400 }
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

    // Retourner les données d'invitation
    const gym = Array.isArray(invitation.gyms) ? invitation.gyms[0] : invitation.gyms

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        full_name: invitation.full_name,
        gym_name: gym?.name || 'À définir',
        gym_city: gym?.city || '',
        expires_at: invitation.expires_at,
      }
    })

  } catch (error: any) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

