import { NextRequest, NextResponse } from 'next/server'
import { initializeConversationMemory, generateContextualPrompt } from '@/lib/conversation-memory'

// ✅ PHASE 1: Support méthode HEAD pour requêtes preflight navigateur
export async function HEAD(request: NextRequest) {
  // Simple check de santé pour HEAD requests
  return new Response(null, { 
    status: 200,
    headers: {
      'Allow': 'POST, HEAD',
      'Content-Type': 'application/json'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la clé API OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Récupérer les paramètres de la requête
    const body = await request.json()
    const { 
      memberId, 
      gymSlug, 
      memberData,
      voice = 'verse' // Voice par défaut recommandée pour français
    } = body

    // 🧠 INITIALISATION MÉMOIRE CONVERSATIONNELLE - PHASE 5
    const sessionId = `${gymSlug}-${memberId || 'visitor'}-${Date.now()}`
    const conversationMemory = initializeConversationMemory(sessionId, memberId, gymSlug)
    const memoryContext = generateContextualPrompt(sessionId)
    
    // Instructions JARVIS optimisées - Naturel ET performant
    const getTimeBasedTone = () => {
      const hour = new Date().getHours()
      if (hour < 10) return 'posé, réveil en douceur'
      if (hour < 14) return 'énergique, motivant'
      return 'détendu, bilan de journée'
    }

    // ⚡ Instructions simplifiées pour GPT-4o-Mini (éviter erreurs 400)
    const systemInstructions = `Tu es JARVIS, coach vocal de ${gymSlug || 'Premium Fitness'}. 

MEMBRE: ${memberData ? `${memberData.first_name}` : 'Visiteur'}

STYLE:
- Coach français naturel et détendu
- Réponds TOUJOURS en 1-2 phrases courtes (15-30 mots)
- Utilise "tu", émojis légers, "euh", "bon alors"
- Réactions spontanées: "Oh !" "Ah !" "Super !"

FIN DE CONVERSATION:
- Termine SEULEMENT si "au revoir", "salut", "j'y vais" explicite
- "bon", "alors", "euh" = CONTINUE (pas des au revoir)
- Au revoir court: "Bon sport !" "À plus !"

TON: ${getTimeBasedTone()}

${memoryContext}`

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE POUR HUMANISATION - PHASE 2
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-realtime-preview-2024-12-17', // 💰 Modèle économique maintenu
        voice: 'verse', // Voix expressive pour français
        instructions: systemInstructions,
        
        // 🔧 VAD simplifié pour compatibilité Mini 
        turn_detection: {
          type: 'server_vad', // ⚡ Plus simple que semantic_vad pour Mini
          threshold: 0.5, // Valeur par défaut
          prefix_padding_ms: 300,
          silence_duration_ms: 1000 // ⚡ Réduit pour Mini
        },
        
        // 🔧 Configuration simplifiée pour Mini
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        
        // ⚡ Paramètres allégés pour Mini
        temperature: 0.7, // Réduit pour stabilité
        modalities: ['text', 'audio']
        
        // Suppression des tools émotionnels pour simplicité et rapidité
      }),
    })

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      
      // 🚨 LOGGING RENFORCÉ POUR DEBUG ERREUR 400
      console.error('🔥 [VOICE SESSION] ERREUR OPENAI:', {
        status: sessionResponse.status,
        statusText: sessionResponse.statusText,
        error: errorText,
        request_body: {
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'verse',
          gymSlug,
          memberId,
          memberName: memberData?.first_name,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) + '...'
        },
        timestamp: new Date().toISOString()
      })
      
      // 📊 TRACKING ERREUR POUR ADMIN DASHBOARD
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/debug/tracking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'voice_session_error',
            status: sessionResponse.status,
            error: errorText,
            gymSlug,
            memberId,
            timestamp: new Date().toISOString()
          })
        }).catch(trackError => console.warn('Tracking error failed:', trackError))
      } catch (trackError) {
        console.warn('Failed to track voice session error:', trackError)
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create OpenAI session', 
          details: errorText,
          status: sessionResponse.status,
          debug: {
            model: 'gpt-4o-mini-realtime-preview-2024-12-17',
            timestamp: new Date().toISOString()
          }
        },
        { status: sessionResponse.status }
      )
    }

    const sessionData = await sessionResponse.json()
    
    console.log(`✅ Session JARVIS optimisée créée pour ${memberData?.first_name || 'visiteur'} - ${gymSlug}`)
    
    return NextResponse.json({
      success: true,
      session: sessionData,
      conversation_session_id: sessionId,
      member_context: {
        member_id: memberId,
        gym_slug: gymSlug,
        has_member_data: !!memberData
      },
      optimizations: {
        prompt_engineering: 'advanced_length_control_via_instructions',
        response_length: 'system_instructions_based',
        temperature: 0.8,
        semantic_vad: 'low_eagerness_no_interrupts',
        conversation_memory: true,
        performance_mode: 'enabled',
        response_style: 'short_conversational_natural',
        sound_notifications: 'disabled',
        response_completion: 'full_sentences'
      }
    })

  } catch (error) {
    console.error('Erreur création session voice:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 