import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'
import { openaiRealtimeInstrumentation } from '@/lib/openai-realtime-instrumentation'

type EndReason = 'user_goodbye' | 'timeout' | 'error' | 'manual'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason }: { sessionId?: string; reason?: EndReason } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })
    }

    const supabase = getSupabaseSingleton()

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

    // Finaliser via instrumentation (idempotent côté update)
    await openaiRealtimeInstrumentation.endSession(sessionId, {
      session_id: sessionId,
      session_duration_seconds: durationSeconds,
      total_user_turns: (session as any).total_user_turns || 0,
      total_ai_turns: (session as any).total_ai_turns || 0,
      total_interruptions: 0,
      end_reason: (reason || 'user_goodbye') as EndReason,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur', details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

