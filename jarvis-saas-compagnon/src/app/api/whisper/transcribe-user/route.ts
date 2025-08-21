import { NextRequest, NextResponse } from 'next/server'

/**
 * 🎙️ WHISPER API - Transcription User Speech
 * 
 * Reçoit audio utilisateur → Whisper API → Log dans DB
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const sessionId = formData.get('session_id') as string
    const memberId = formData.get('member_id') as string
    const gymId = formData.get('gym_id') as string

    if (!audioFile || !sessionId || !memberId || !gymId) {
      return NextResponse.json({ 
        error: 'Missing required fields: audio, session_id, member_id, gym_id' 
      }, { status: 400 })
    }

    // Vérifier OPENAI_API_KEY
    if (!process.env.OPENAI_API_KEY) {
      // Log supprimé pour production
      return NextResponse.json({ 
        error: 'OPENAI_API_KEY configuration missing' 
      }, { status: 500 })
    }

    // Log supprimé pour production
      size: audioFile.size,
      type: audioFile.type,
      sessionId
    })

    // Préparer FormData pour OpenAI Whisper
    const whisperFormData = new FormData()
    
    // Renommer le fichier avec extension supportée
    const renamedFile = new File([audioFile], 'user-speech.webm', { 
      type: 'audio/webm' 
    })
    
    whisperFormData.append('file', renamedFile)
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'fr') // Français
    whisperFormData.append('response_format', 'verbose_json') // Avec métadonnées

    // Appel OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: whisperFormData
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      // Log supprimé pour production
      return NextResponse.json({ 
        error: 'Whisper transcription failed',
        details: error
      }, { status: 500 })
    }

    const whisperResult = await whisperResponse.json()
    const transcript = whisperResult.text?.trim()

    if (!transcript || transcript.length < 2) {
      // Log supprimé pour production
      return NextResponse.json({ 
        success: true,
        transcript: '',
        skipped: 'Empty transcript'
      })
    }

    // Log supprimé pour production

    // Logger l'interaction via API interne
    const logResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/debug/log-interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        member_id: memberId,
        gym_id: gymId,
        speaker: 'user',
        transcript,
        conversation_turn_number: Date.now(), // Temp turn number
        metadata: {
          confidence_score: whisperResult.language_probability || 0.95,
          duration_ms: whisperResult.duration ? Math.round(whisperResult.duration * 1000) : null,
          whisper_language: whisperResult.language,
          audio_size_bytes: audioFile.size
        }
      })
    })

    if (!logResponse.ok) {
      // Log supprimé pour production
    } else {
      // Log supprimé pour production
    }

    return NextResponse.json({
      success: true,
      transcript,
      metadata: {
        language: whisperResult.language,
        duration: whisperResult.duration,
        confidence: whisperResult.language_probability
      }
    })

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
