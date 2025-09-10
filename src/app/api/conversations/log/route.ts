/**
 * 💬 API ENREGISTREMENT CONVERSATIONS
 * Endpoint pour logger les interactions adhérent ↔ JARVIS
 */

import { NextRequest, NextResponse } from 'next/server'
import { conversationLogger } from '@/lib/conversation-logger'

export async function POST(request: NextRequest) {
  try {
    const { 
      session_id, 
      member_id, 
      gym_id, 
      speaker, 
      message_text,
      metadata 
    } = await request.json()

    // Validation des données requises
    if (!session_id || !member_id || !gym_id || !speaker || !message_text) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données requises manquantes',
          required: ['session_id', 'member_id', 'gym_id', 'speaker', 'message_text']
        },
        { status: 400 }
      )
    }

    // Validation du speaker
    if (!['user', 'jarvis'].includes(speaker)) {
      return NextResponse.json(
        { success: false, error: 'Speaker doit être "user" ou "jarvis"' },
        { status: 400 }
      )
    }

    // Logger le message
    const success = await conversationLogger.logMessage({
      session_id,
      member_id,
      gym_id,
      speaker,
      message_text,
      ...metadata
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Conversation loggée avec succès'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Erreur lors du logging' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ [API CONV] Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

// GET pour obtenir les statistiques d'une session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id requis' },
        { status: 400 }
      )
    }

    const stats = conversationLogger.getSessionStats(session_id)

    return NextResponse.json({
      success: true,
      session_id,
      stats
    })

  } catch (error: any) {
    console.error('❌ [API CONV] Erreur stats:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
