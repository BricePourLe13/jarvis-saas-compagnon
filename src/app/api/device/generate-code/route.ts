import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/production-logger'

/**
 * 🔐 POST /api/device/generate-code
 * 
 * Génère un code d'appairage temporaire pour un nouvel écran.
 * PUBLIC (pas d'auth - n'importe quel écran peut générer un code)
 */

function generatePairingCode(): string {
  // Format: XXX-XXX (6 chiffres)
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return `${code.slice(0, 3)}-${code.slice(3)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { device_fingerprint, socket_id } = body

    const supabase = createSimpleClient()

    // Générer un code unique
    let code = generatePairingCode()
    let attempts = 0

    // Vérifier l'unicité (très rare qu'il y ait collision sur 1M de codes)
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('device_pairing_codes')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) break
      code = generatePairingCode()
      attempts++
    }

    // Créer le code en base
    const { data: pairingCode, error } = await supabase
      .from('device_pairing_codes')
      .insert({
        code,
        socket_id: socket_id || null,
        device_fingerprint: device_fingerprint || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      logger.error('❌ [DEVICE] Erreur génération code', { error: error.message }, { component: 'DeviceGenerateCode' })
      return NextResponse.json(
        { error: 'Impossible de générer un code' },
        { status: 500 }
      )
    }

    logger.info('✅ [DEVICE] Code généré', { code, expiresAt: pairingCode.expires_at }, { component: 'DeviceGenerateCode' })

    return NextResponse.json({
      success: true,
      code: pairingCode.code,
      expires_at: pairingCode.expires_at,
      message: 'Code généré. Entrez-le dans le Dashboard pour activer cet écran.',
    })

  } catch (error: any) {
    logger.error('❌ [DEVICE] Erreur serveur inattendue', { error: error.message }, { component: 'DeviceGenerateCode' })
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

