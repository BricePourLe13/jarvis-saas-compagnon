import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/production-logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// DELETE: Supprimer une invitation (admin uniquement)
// ============================================================================
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Supprimer l'invitation
    const { error } = await supabaseAdmin
      .from('manager_invitations')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('❌ [INVITATION] Erreur suppression', { id, error: error.message })
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    logger.success('✅ [INVITATION] Invitation supprimée', { id })
    return NextResponse.json({ message: 'Invitation supprimée' }, { status: 200 })
  } catch (error: any) {
    logger.error('❌ [INVITATION] Erreur serveur', { error: error.message })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

