import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'

/**
 * 🗑️ DELETE /api/admin/kiosks/[id]
 * 
 * Supprime un kiosk (Super Admin uniquement)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component, ignore
            }
          },
        },
      }
    )

    // 1. Vérifier l'utilisateur
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Vérifier le rôle super_admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      logger.warn(`❌ [KIOSK DELETE] Accès refusé pour ${user.id}`, { userId: user.id }, { component: 'KioskDelete' })
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // 3. Supprimer le kiosk
    const { error: deleteError } = await supabase
      .from('kiosks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error(`❌ [KIOSK DELETE] Erreur suppression kiosk ${id}`, { error: deleteError.message }, { component: 'KioskDelete' })
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du kiosk' },
        { status: 500 }
      )
    }

    logger.info(`✅ [KIOSK DELETE] Kiosk ${id} supprimé`, { kioskId: id }, { component: 'KioskDelete' })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('❌ [KIOSK DELETE] Erreur', { error: error.message }, { component: 'KioskDelete' })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

