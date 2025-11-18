import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'

/**
 * ✅ PATCH /api/admin/kiosks/[id]/approve
 * 
 * Admin approuve un kiosk après provisioning
 * 
 * Body:
 *   - approved: boolean (true = approve, false = reject)
 * 
 * Flow:
 *   1. Vérifie que user est super_admin
 *   2. Vérifie que kiosk existe et status = pending_approval
 *   3. Approuve → status: online, approved_at, approved_by
 *   4. Rejette → status: error (gérant doit reconfigurer)
 */

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const kioskId = params.id

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
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Vérifier que l'utilisateur est super_admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // 3. Récupérer les données
    const { approved } = await request.json()

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Le champ "approved" (boolean) est requis' },
        { status: 400 }
      )
    }

    // 4. Vérifier que le kiosk existe et est pending_approval
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select(`
        id,
        name,
        slug,
        status,
        gym_id,
        gyms!inner(id, name)
      `)
      .eq('id', kioskId)
      .single()

    if (kioskError || !kiosk) {
      return NextResponse.json(
        { success: false, error: 'Kiosk non trouvé' },
        { status: 404 }
      )
    }

    if (kiosk.status !== 'pending_approval') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Ce kiosk ne peut pas être approuvé (status actuel: ${kiosk.status})` 
        },
        { status: 400 }
      )
    }

    // 5. Approuver ou rejeter
    const updateData = approved 
      ? {
          status: 'online',
          approved_at: new Date().toISOString(),
          approved_by: userProfile.id,
        }
      : {
          status: 'error',
          notes: 'Rejeté par admin - Reconfiguration nécessaire'
        }

    const { error: updateError } = await supabase
      .from('kiosks')
      .update(updateData)
      .eq('id', kioskId)

    if (updateError) {
      logger.error('Erreur mise à jour kiosk approval', { error: updateError, kiosk_id: kioskId }, { component: 'KioskApproval' })
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    logger.info(`Kiosk ${approved ? 'approuvé' : 'rejeté'}`, { 
      kiosk_id: kioskId, 
      kiosk_name: kiosk.name,
      gym_name: (kiosk.gyms as any)?.name,
      admin_id: userProfile.id,
      admin_name: userProfile.full_name,
      approved 
    }, { component: 'KioskApproval' })

    return NextResponse.json({
      success: true,
      message: approved 
        ? `Kiosk "${kiosk.name}" approuvé et mis en ligne`
        : `Kiosk "${kiosk.name}" rejeté - Reconfiguration nécessaire`,
      data: {
        kiosk_id: kioskId,
        new_status: updateData.status
      }
    })

  } catch (error) {
    logger.error('Erreur serveur kiosk approval', { error }, { component: 'KioskApproval' })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}


