/**
 * 💉 API INJECTION ÉVÉNEMENTS AUDIO REALTIME
 * Endpoint pour injecter les événements OpenAI depuis le frontend
 */

import { NextRequest, NextResponse } from 'next/server'
import { realtimeAudioInjector } from '@/lib/realtime-audio-injector'

export async function POST(request: NextRequest) {
  try {
    const { 
      action, 
      sessionId, 
      gymId, 
      memberId, 
      transcript, 
      confidence, 
      duration 
    } = await request.json()

    if (!sessionId || !gymId || !memberId || !action) {
      return NextResponse.json(
        { error: 'sessionId, gymId, memberId et action requis' },
        { status: 400 }
      )
    }

    // Injecter l'événement selon l'action
    switch (action) {
      case 'user_speech_start':
        await realtimeAudioInjector.injectUserSpeechStart(sessionId, gymId, memberId)
        break

      case 'user_speech_end':
        await realtimeAudioInjector.injectUserSpeechEnd(sessionId, gymId, memberId, duration)
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
        await realtimeAudioInjector.injectJarvisResponseEnd(sessionId, gymId, memberId, duration)
        break

      case 'jarvis_transcript':
        if (!transcript) {
          return NextResponse.json({ error: 'transcript requis pour jarvis_transcript' }, { status: 400 })
        }
        await realtimeAudioInjector.injectJarvisTranscript(sessionId, gymId, memberId, transcript, duration)
        break

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Événement ${action} injecté avec succès`
    })

  } catch (error: any) {
    console.error('❌ [INJECT API] Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}



