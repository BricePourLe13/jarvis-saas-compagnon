/**
 * 🏁 API FERMETURE SESSION SIMPLE
 * Ferme proprement une session OpenAI Realtime
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId requis' }, 
        { status: 400 }
      )
    }

    console.log(`🏁 [API] Fermeture session: ${sessionId} (raison: ${reason})`)

    // Utiliser la fonction SQL pour fermer la session
    const supabase = getSupabaseSingleton()
    const { data, error } = await supabase.rpc('close_realtime_session', {
      p_session_id: sessionId,
      p_reason: reason || 'user_goodbye'
    })

    const success = !error && data === true

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Session fermée avec succès'
      })
    } else {
      return NextResponse.json(
        { error: 'Erreur lors de la fermeture de session' },
        { status: 500 }
      )
    }

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}