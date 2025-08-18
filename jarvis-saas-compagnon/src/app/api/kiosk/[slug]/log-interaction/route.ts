import { NextRequest, NextResponse } from 'next/server'
import { simpleLogger } from '@/lib/jarvis-simple-logger'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const interaction = await request.json()

    console.log(`📝 [LOG INTERACTION] Nouveau log pour kiosk ${slug}:`, interaction)

    // Valider les données requises
    if (!interaction.session_id || !interaction.speaker || !interaction.message_text) {
      return NextResponse.json(
        { success: false, error: 'Données requises manquantes' },
        { status: 400 }
      )
    }

    // Utiliser le simple logger pour sauvegarder
    const success = await simpleLogger.logMessage({
      session_id: interaction.session_id,
      member_id: interaction.member_id,
      gym_id: interaction.gym_id,
      speaker: interaction.speaker,
      message_text: interaction.message_text,
      turn_number: interaction.conversation_turn_number || interaction.turn_number || 1,
      timestamp: interaction.timestamp ? new Date(interaction.timestamp) : new Date()
    })

    if (success) {
      console.log('✅ [LOG INTERACTION] Message sauvé avec succès!')
      return NextResponse.json({
        success: true,
        message: 'Interaction sauvée avec succès'
      })
    } else {
      console.error('❌ [LOG INTERACTION] Échec sauvegarde')
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('💥 [LOG INTERACTION] Exception:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
