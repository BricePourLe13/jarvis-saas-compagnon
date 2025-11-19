import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/production-logger'

/**
 * 🔍 GET /api/device/check-status/[code]
 * 
 * Vérifie le statut d'un code d'appairage.
 * Utilisé par l'écran pour "poll" et savoir s'il a été activé par un Admin.
 * PUBLIC (pas d'auth - l'écran ne peut pas s'authentifier avant d'être appairé)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = createSimpleClient()

    // Récupérer le code
    const { data: pairingCode, error } = await supabase
      .from('device_pairing_codes')
      .select(`
        id,
        code,
        status,
        expires_at,
        paired_at,
        paired_kiosk_id,
        device_token_plain,
        kiosks!device_pairing_codes_paired_kiosk_id_fkey (
          id,
          slug,
          name,
          device_token_hash,
          gym_id,
          gyms!inner (
            id,
            name,
            city
          )
        )
      `)
      .eq('code', code)
      .single()

    if (error || !pairingCode) {
      return NextResponse.json(
        { status: 'not_found', message: 'Code invalide ou expiré' },
        { status: 404 }
      )
    }

    // Vérifier expiration
    if (new Date(pairingCode.expires_at) < new Date()) {
      // Marquer comme expiré si pas déjà fait
      await supabase
        .from('device_pairing_codes')
        .update({ status: 'expired' })
        .eq('code', code)

      return NextResponse.json({
        status: 'expired',
        message: 'Code expiré. Veuillez générer un nouveau code.',
      })
    }

    // Si pas encore appairé
    if (pairingCode.status === 'pending') {
      return NextResponse.json({
        status: 'pending',
        message: 'En attente d\'activation par un administrateur.',
        expires_at: pairingCode.expires_at,
      })
    }

    // Si appairé avec succès
    if (pairingCode.status === 'paired' && pairingCode.kiosks) {
      const kiosk = Array.isArray(pairingCode.kiosks) ? pairingCode.kiosks[0] : pairingCode.kiosks
      const gym = kiosk.gyms

      logger.info('✅ [DEVICE] Code appairé vérifié', { code, kioskId: kiosk.id }, { component: 'DeviceCheckStatus' })

      // Nettoyer le token en clair après récupération (sécurité)
      if (pairingCode.device_token_plain) {
        await supabase
          .from('device_pairing_codes')
          .update({ device_token_plain: null })
          .eq('code', code)
      }

      return NextResponse.json({
        status: 'paired',
        message: 'Écran activé avec succès !',
        kiosk: {
          id: kiosk.id,
          slug: kiosk.slug,
          name: kiosk.name,
          device_token: pairingCode.device_token_plain || kiosk.device_token_hash, // Token en clair si disponible
          gym: {
            id: gym.id,
            name: gym.name,
            city: gym.city,
          }
        },
        paired_at: pairingCode.paired_at,
      })
    }

    // Statut inattendu
    return NextResponse.json({
      status: pairingCode.status,
      message: 'Statut du code non reconnu.',
    }, { status: 400 })

  } catch (error: any) {
    logger.error('❌ [DEVICE] Erreur vérification statut', { error: error.message }, { component: 'DeviceCheckStatus' })
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

