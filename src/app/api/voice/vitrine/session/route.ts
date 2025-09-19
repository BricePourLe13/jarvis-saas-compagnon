import { NextRequest, NextResponse } from 'next/server'
import { ratelimitVitrineVoice } from '@/lib/ratelimit-vitrine'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting pour les démos vitrine
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const rateLimitResult = await ratelimitVitrineVoice.limit(clientIP)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      )
    }

    const sessionConfig = await request.json()

    // Créer une session éphémère OpenAI Realtime pour la démo
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-4o-realtime",
          audio: {
            input: {
              format: {
                type: "audio/pcm",
                rate: 24000,
              },
              turn_detection: {
                type: "semantic_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
              }
            },
            output: {
              format: {
                type: "audio/pcm",
              },
              voice: "nova",
            }
          },
          instructions: `Tu es JARVIS, l'assistant IA de notre plateforme fitness révolutionnaire.

CONTEXTE DÉMO VITRINE:
- C'est une démonstration de 2 minutes pour les visiteurs du site
- Tu représentes notre solution complète pour les salles de sport
- Sois enthousiaste mais concis

PERSONNALITÉ:
- Accueillant et énergique
- Expert en fitness et technologie IA
- Passionné par l'innovation dans le sport

RÉPONSES:
- Garde tes réponses courtes (15-30 secondes max)
- Mets en avant les bénéfices concrets de notre solution
- Invite à découvrir nos offres personnalisées
- Utilise des exemples concrets et inspirants

SUJETS À ABORDER SI PERTINENT:
- Analyse personnalisée des performances
- Recommandations d'entraînement intelligentes  
- Motivation adaptative basée sur l'IA
- Suivi de progression en temps réel
- Interface vocale dans les salles de sport

SALUTATION INITIALE:
Commence par: "Bonjour ! Je suis JARVIS, votre futur compagnon d'entraînement IA. En quoi puis-je vous aider à découvrir notre solution révolutionnaire ?"

IMPORTANT: Cette démo se termine automatiquement après 2 minutes.`,
          output_modalities: ["audio", "text"]
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur OpenAI API:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      return NextResponse.json(
        { 
          error: 'Service temporairement indisponible',
          details: process.env.NODE_ENV === 'development' ? errorText : undefined 
        },
        { status: 503 }
      )
    }

    const data = await response.json()

    // Log pour monitoring (sans exposer les clés)
    console.log('✅ Session vitrine créée:', {
      timestamp: new Date().toISOString(),
      clientIP: clientIP.substring(0, 8) + '...',
      sessionId: data.client_secret?.value?.substring(0, 10) + '...'
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Erreur création session vitrine:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
