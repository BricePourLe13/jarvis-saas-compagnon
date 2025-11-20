import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/production-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; badgeId: string }> }
) {
  try {
    const { slug, badgeId } = await params
    const supabase = createAdminClient()

    // 1. Récupérer le kiosk et sa gym
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select('id, gym_id')
      .eq('slug', slug)
      .single()

    if (kioskError || !kiosk) {
      logger.warn(`❌ [KIOSK_MEMBER] Kiosk non trouvé: ${slug}`, { error: kioskError?.message }, { component: 'KioskMemberAPI' })
      return NextResponse.json({ error: 'Kiosk non trouvé' }, { status: 404 })
    }

    // 2. Récupérer le membre par badge_id et gym_id
    const { data: member, error: memberError } = await supabase
      .from('gym_members_v2')
      .select('*')
      .eq('gym_id', kiosk.gym_id)
      .eq('badge_id', badgeId)
      .eq('is_active', true)
      .single()

    if (memberError || !member) {
      logger.info(`⚠️ [KIOSK_MEMBER] Membre non trouvé pour badge ${badgeId} (gym: ${kiosk.gym_id})`, {}, { component: 'KioskMemberAPI' })
      return NextResponse.json({ error: 'Badge non reconnu' }, { status: 404 })
    }

    logger.info(`✅ [KIOSK_MEMBER] Membre trouvé: ${member.first_name} ${member.last_name} (badge: ${badgeId})`, {}, { component: 'KioskMemberAPI' })

    return NextResponse.json({ member })

  } catch (error: any) {
    logger.error('❌ [KIOSK_MEMBER] Erreur serveur', { error: error.message }, { component: 'KioskMemberAPI' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
