import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'

/**
 * 🏗️ POST /api/admin/kiosks/create
 * 
 * Super Admin crée un nouveau kiosk pour une gym.
 * Génère un code provisioning unique.
 * 
 * Body:
 *   - gym_id: string (required)
 *   - name: string (optional - auto-généré si absent)
 *   - location_in_gym: string (optional)
 */

function generateKioskSlug(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `gym-${random}`
}

function generateProvisioningCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
          remove: (name: string, options: any) => cookieStore.set({ name, value: '', ...options }),
        },
      }
    )

    // 1. Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Vérifier que l'utilisateur est super_admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 3. Récupérer les données
    const body = await request.json()
    const { gym_id, name, location_in_gym } = body

    if (!gym_id) {
      return NextResponse.json({ error: 'gym_id requis' }, { status: 400 })
    }

    // 4. Vérifier que la gym existe
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('id', gym_id)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Salle non trouvée' }, { status: 404 })
    }

    // 5. Générer slug et code provisioning
    const slug = generateKioskSlug()
    const provisioningCode = generateProvisioningCode()
    const provisioningExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h

    // 6. Créer le kiosk
    const kioskData = {
      gym_id: gym.id,
      slug,
      name: name || `${gym.name} - Kiosk Principal`,
      provisioning_code: provisioningCode,
      provisioning_code_expires_at: provisioningExpiresAt.toISOString(),
      status: 'provisioning',
      voice_model: 'alloy',
      language: 'fr',
      openai_model: 'gpt-4o-mini-realtime-preview-2024-12-17',
      location_in_gym: location_in_gym || 'Entrée principale',
      hardware_info: {
        hardware_version: '1.0'
      }
    }

    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .insert(kioskData)
      .select()
      .single()

    if (kioskError) {
      logger.error('❌ [ADMIN] Erreur création kiosk', { error: kioskError, gym_id }, { component: 'AdminKioskCreate' })
      return NextResponse.json({ error: 'Erreur lors de la création du kiosk' }, { status: 500 })
    }

    logger.success('✅ [ADMIN] Kiosk créé', { kiosk_id: kiosk.id, gym_id, slug }, { component: 'AdminKioskCreate' })

    return NextResponse.json({
      success: true,
      data: {
        kiosk_id: kiosk.id,
        slug,
        provisioning_code: provisioningCode,
        provisioning_code_expires_at: provisioningExpiresAt.toISOString(),
        provisioning_url: `${process.env.NEXT_PUBLIC_APP_URL}/kiosk/${slug}`,
      }
    }, { status: 201 })

  } catch (error: any) {
    logger.error('❌ [ADMIN] Erreur serveur création kiosk', { error: error.message }, { component: 'AdminKioskCreate' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

