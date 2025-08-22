import { NextRequest, NextResponse } from 'next/server'
// Removed legacy simple-conversation-logger import

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const interaction = await request.json()

    // Log supprimé pour production

    // Valider les données requises
    if (!interaction.session_id || !interaction.speaker || !interaction.message_text) {
      return NextResponse.json(
        { success: false, error: 'Données requises manquantes' },
        { status: 400 }
      )
    }

    // Logger avec le système simple
    const success = await conversationLogger.logMessage({
      session_id: interaction.session_id,
      speaker: interaction.speaker,
      message: interaction.message_text,
      member_id: interaction.member_id,
      gym_id: interaction.gym_id
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Message loggé avec succès'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Erreur lors du logging' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    // Log supprimé pour production
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
