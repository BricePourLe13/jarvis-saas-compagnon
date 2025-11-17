import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'

/**
 * ✅ PATCH /api/admin/gyms/[id]/approve
 * 
 * Admin approuve une salle créée par un gérant
 * 
 * Body:
 *   - approved: boolean (true = approve, false = reject)
 *   - rejection_reason: string (required si approved = false)
 * 
 * Flow:
 *   1. Vérifie que user est super_admin
 *   2. Vérifie que gym existe et status = pending_approval
 *   3. Approuve → status: active, approved_at, approved_by
 *   4. Rejette → status: cancelled, rejection_reason
 */

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const gymId = params.id

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
    const { approved, rejection_reason } = await request.json()

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Le champ "approved" (boolean) est requis' },
        { status: 400 }
      )
    }

    if (!approved && !rejection_reason) {
      return NextResponse.json(
        { success: false, error: 'Une raison de rejet est requise' },
        { status: 400 }
      )
    }

    // 4. Vérifier que la gym existe et est pending_approval
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, status, manager_id')
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'Salle non trouvée' },
        { status: 404 }
      )
    }

    if (gym.status !== 'pending_approval') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cette salle ne peut pas être approuvée (status actuel: ${gym.status})` 
        },
        { status: 400 }
      )
    }

    // 5. Approuver ou rejeter
    const updateData = approved 
      ? {
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: userProfile.id,
          rejection_reason: null
        }
      : {
          status: 'cancelled',
          approved_at: null,
          approved_by: null,
          rejection_reason: rejection_reason
        }

    const { error: updateError } = await supabase
      .from('gyms')
      .update(updateData)
      .eq('id', gymId)

    if (updateError) {
      logger.error('Erreur mise à jour gym approval', { error: updateError, gym_id: gymId }, { component: 'GymApproval' })
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    logger.info(`Gym ${approved ? 'approuvée' : 'rejetée'}`, { 
      gym_id: gymId, 
      gym_name: gym.name, 
      admin_id: userProfile.id,
      admin_name: userProfile.full_name,
      approved 
    }, { component: 'GymApproval' })

    return NextResponse.json({
      success: true,
      message: approved 
        ? `Salle "${gym.name}" approuvée avec succès`
        : `Salle "${gym.name}" rejetée`,
      data: {
        gym_id: gymId,
        new_status: updateData.status
      }
    })

  } catch (error) {
    logger.error('Erreur serveur gym approval', { error }, { component: 'GymApproval' })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

