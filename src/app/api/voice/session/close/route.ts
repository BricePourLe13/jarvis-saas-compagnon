/**
 * 🏁 API FERMETURE SESSION SIMPLE
 * Ferme proprement une session OpenAI Realtime
 */

import { NextRequest, NextResponse } from 'next/server'
// Removed legacy simple-session-manager import

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId requis' }, 
        { status: 400 }
      )
    }

    // Log supprimé pour production

    const success = await sessionManager.endSession(sessionId, reason || 'user_goodbye')

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