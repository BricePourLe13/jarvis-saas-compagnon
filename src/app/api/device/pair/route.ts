import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'
import crypto from 'crypto'

/**
 * 🔗 POST /api/device/pair
 * 
 * Appaire un écran (code) avec un kiosk et génère un token sécurisé.
 * AUTHENTIFIÉ (Super Admin ou Gym Manager uniquement)
 * 
 * Body:
 * {
 *   code: "123-456",
 *   kiosk_id: "uuid-of-kiosk"
 * }
 */

function generateDeviceToken(): string {
  // Token cryptographiquement sécurisé (256 bits)
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* Server Component */ }
          },
        },
      }
    )

    // Vérifier authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé. Connexion requise.' },
        { status: 401 }
      )
    }

    // Vérifier rôle
    const { data: profile } = await supabase
      .from('users')
      .select('role, gym_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'gym_manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Accès refusé. Seuls les admins et gérants peuvent appareiller un écran.' },
        { status: 403 }
      )
    }

    // Récupérer body
    const { code, kiosk_id } = await request.json()

    if (!code || !kiosk_id) {
      return NextResponse.json(
        { error: 'Code et kiosk_id requis' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Vérifier que le code existe et est valide
    const { data: pairingCode, error: codeError } = await supabaseAdmin
      .from('device_pairing_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (codeError || !pairingCode) {
      logger.warn('❌ [DEVICE] Code invalide', { code }, { component: 'DevicePair' })
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 404 }
      )
    }

    if (pairingCode.status !== 'pending') {
      return NextResponse.json(
        { error: `Ce code a déjà été ${pairingCode.status === 'paired' ? 'utilisé' : 'expiré'}` },
        { status: 400 }
      )
    }

    if (new Date(pairingCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Code expiré. L\'écran doit générer un nouveau code.' },
        { status: 400 }
      )
    }

    // 2. Vérifier que le kiosk existe
    const { data: kiosk, error: kioskError } = await supabaseAdmin
      .from('kiosks')
      .select('id, gym_id, name')
      .eq('id', kiosk_id)
      .single()

    if (kioskError || !kiosk) {
      return NextResponse.json(
        { error: 'Kiosk introuvable' },
        { status: 404 }
      )
    }

    // 3. Vérifier permissions
    if (profile.role === 'gym_manager' && kiosk.gym_id !== profile.gym_id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez appareiller que les écrans de votre propre salle' },
        { status: 403 }
      )
    }

    // 4. Générer le token device
    const deviceToken = generateDeviceToken()
    const deviceTokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex')

    // 5. Associer le kiosk au code ET au token
    const now = new Date().toISOString()

    // Mettre à jour le kiosk
    const { error: updateKioskError } = await supabaseAdmin
      .from('kiosks')
      .update({
        device_token_hash: deviceTokenHash,
        device_paired_at: now,
        device_last_seen: now,
        device_fingerprint: pairingCode.device_fingerprint,
        status: 'online', // Activer le kiosk immédiatement
      })
      .eq('id', kiosk_id)

    if (updateKioskError) {
      logger.error('❌ [DEVICE] Erreur mise à jour kiosk', { error: updateKioskError.message }, { component: 'DevicePair' })
      return NextResponse.json(
        { error: 'Erreur lors de l\'appairage' },
        { status: 500 }
      )
    }

    // Mettre à jour le code (avec le token en clair pour que l'écran puisse le récupérer)
    const { error: updateCodeError } = await supabaseAdmin
      .from('device_pairing_codes')
      .update({
        status: 'paired',
        paired_at: now,
        paired_by: user.id,
        paired_kiosk_id: kiosk_id,
        device_token_plain: deviceToken, // Token en clair (temporaire, sera nettoyé après récupération)
      })
      .eq('code', code)

    if (updateCodeError) {
      logger.error('❌ [DEVICE] Erreur mise à jour code', { error: updateCodeError.message }, { component: 'DevicePair' })
    }

    logger.success('✅ [DEVICE] Écran appairé avec succès', {
      code,
      kioskId: kiosk_id,
      kioskName: kiosk.name,
      gymId: kiosk.gym_id,
      pairedBy: user.email,
    }, { component: 'DevicePair' })

    return NextResponse.json({
      success: true,
      message: `Écran "${kiosk.name}" appairé avec succès !`,
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        gym_id: kiosk.gym_id,
      },
      // NE PAS renvoyer le token ici (il sera récupéré par l'écran via check-status)
    })

  } catch (error: any) {
    logger.error('❌ [DEVICE] Erreur serveur inattendue', { error: error.message, stack: error.stack }, { component: 'DevicePair' })
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

