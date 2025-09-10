/**
 * 🧪 API TEST CONVERSATIONS REALTIME
 * Endpoint pour tester le système complet de capture des conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { realtimeAudioInjector } from '@/lib/realtime-audio-injector'

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, gymId, memberId, transcript, confidence } = await request.json()

    if (!sessionId || !gymId || !memberId) {
      return NextResponse.json(
        { error: 'sessionId, gymId et memberId requis' },
        { status: 400 }
      )
    }

    console.log(`🧪 [TEST] Action: ${action} pour session ${sessionId}`)

    switch (action) {
      case 'user_speech_start':
        await realtimeAudioInjector.injectUserSpeechStart(sessionId, gymId, memberId)
        break

      case 'user_speech_end':
        await realtimeAudioInjector.injectUserSpeechEnd(sessionId, gymId, memberId)
        break

      case 'user_transcript':
        if (!transcript) {
          return NextResponse.json({ error: 'transcript requis pour user_transcript' }, { status: 400 })
        }
        await realtimeAudioInjector.injectUserTranscript(sessionId, gymId, memberId, transcript, confidence)
        break

      case 'jarvis_response_start':
        await realtimeAudioInjector.injectJarvisResponseStart(sessionId, gymId, memberId)
        break

      case 'jarvis_response_end':
        await realtimeAudioInjector.injectJarvisResponseEnd(sessionId, gymId, memberId)
        break

      case 'jarvis_transcript':
        if (!transcript) {
          return NextResponse.json({ error: 'transcript requis pour jarvis_transcript' }, { status: 400 })
        }
        await realtimeAudioInjector.injectJarvisTranscript(sessionId, gymId, memberId, transcript)
        break

      case 'simulate_conversation':
        // Simuler une conversation complète
        await simulateFullConversation(sessionId, gymId, memberId)
        break

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} exécutée avec succès`,
      session_id: sessionId
    })

  } catch (error: any) {
    console.error('❌ [TEST] Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * 🎭 Simuler une conversation complète
 */
async function simulateFullConversation(sessionId: string, gymId: string, memberId: string): Promise<void> {
  console.log(`🎭 [TEST] Simulation conversation complète pour ${sessionId}`)

  // Délai entre les événements
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  try {
    // 1. Utilisateur commence à parler
    await realtimeAudioInjector.injectUserSpeechStart(sessionId, gymId, memberId)
    await delay(500)

    // 2. Utilisateur arrête de parler
    await realtimeAudioInjector.injectUserSpeechEnd(sessionId, gymId, memberId, 2000)
    await delay(200)

    // 3. Transcript utilisateur
    await realtimeAudioInjector.injectUserTranscript(
      sessionId, 
      gymId, 
      memberId, 
      "Salut JARVIS ! Comment ça va ? J'aimerais des conseils pour mon entraînement aujourd'hui.",
      0.95
    )
    await delay(800)

    // 4. JARVIS commence à répondre
    await realtimeAudioInjector.injectJarvisResponseStart(sessionId, gymId, memberId)
    await delay(300)

    // 5. JARVIS arrête de répondre
    await realtimeAudioInjector.injectJarvisResponseEnd(sessionId, gymId, memberId, 3500)
    await delay(200)

    // 6. Transcript JARVIS
    await realtimeAudioInjector.injectJarvisTranscript(
      sessionId, 
      gymId, 
      memberId, 
      "Salut ! Je vais très bien, merci ! Pour ton entraînement aujourd'hui, je te recommande de commencer par un échauffement de 10 minutes, puis de te concentrer sur le haut du corps. Que penses-tu de ça ?"
    )
    await delay(1000)

    // 7. Deuxième échange
    await realtimeAudioInjector.injectUserSpeechStart(sessionId, gymId, memberId)
    await delay(400)
    await realtimeAudioInjector.injectUserSpeechEnd(sessionId, gymId, memberId, 1500)
    await delay(200)
    await realtimeAudioInjector.injectUserTranscript(
      sessionId, 
      gymId, 
      memberId, 
      "Parfait ! Et pour les poids, tu me conseilles quoi ?",
      0.92
    )
    await delay(600)

    await realtimeAudioInjector.injectJarvisResponseStart(sessionId, gymId, memberId)
    await delay(400)
    await realtimeAudioInjector.injectJarvisResponseEnd(sessionId, gymId, memberId, 2800)
    await delay(200)
    await realtimeAudioInjector.injectJarvisTranscript(
      sessionId, 
      gymId, 
      memberId, 
      "Excellente question ! Je te conseille de commencer avec 70% de ton 1RM pour 3 séries de 8-10 répétitions. N'oublie pas de bien contrôler le mouvement !"
    )

    console.log(`✅ [TEST] Conversation simulée complètement pour ${sessionId}`)

  } catch (error) {
    console.error(`❌ [TEST] Erreur simulation:`, error)
  }
}
