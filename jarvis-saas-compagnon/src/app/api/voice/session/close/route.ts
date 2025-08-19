import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
// Instrumentation supprimée - remplacée par Prisma

type EndReason = 'user_goodbye' | 'timeout' | 'error' | 'manual'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason }: { sessionId?: string; reason?: EndReason } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })
    }

    const supabase = getSupabaseService()

    // Récupérer l’état actuel de la session
    const { data: session, error } = await supabase
      .from('openai_realtime_sessions')
      .select('session_started_at, session_ended_at, total_user_turns, total_ai_turns')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Erreur base de données', details: error.message }, { status: 500 })
    }
    if (!session) {
      return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
    }

    if ((session as any).session_ended_at) {
      // Idempotent: déjà fermée
      return NextResponse.json({ success: true, alreadyClosed: true })
    }

    const startedAt = new Date((session as any).session_started_at)
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000))

    // TODO: Finaliser via Prisma
    // await instrumentation.endSession(sessionId, { ... })

    // Marquer l'état explicitement si besoin (déjà géré par endSession)
    await supabase
      .from('openai_realtime_sessions')
      .update({ state: 'closed', end_reason: (reason || 'user_goodbye') as string })
      .eq('session_id', sessionId)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur', details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

