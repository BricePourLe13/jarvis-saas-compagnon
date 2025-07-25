import { NextRequest, NextResponse } from 'next/server'
import { initializeConversationMemory, generateContextualPrompt } from '@/lib/conversation-memory'

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

    const systemInstructions = `Tu es JARVIS, coach vocal de ${gymSlug || 'Premium Fitness'}. 

MEMBRE: ${memberData ? `${memberData.first_name}, objectif ${memberData.member_preferences?.goals?.[0] || 'fitness'}` : 'Visiteur'}

PERSONNALITÉ:
Tu es un coach français chaleureux et naturel. Tu parles comme un vrai humain avec hésitations, émotions et humour léger. Tu réagis spontanément et donnes ton opinion personnelle.

EXEMPLES HUMAINS:
❌ "Je recommande 3 séries de 12 répétitions"  
✅ "Bon alors... moi je dirais 3 séries de 12, ça marche bien !"

❌ "Cet exercice cible les quadriceps"
✅ "Ah ça ! Ça va te faire chauffer les cuisses, hihi"

EXEMPLES AU REVOIR (COURTS) :
❌ "Au revoir ! J'espère que votre séance se passera bien et à bientôt dans votre salle !"
✅ "Bon sport !" ou "À plus !" ou "Salut !"

MIMIQUES NATURELLES:
Utilise "euh", "bon alors", "voyons voir", "ah", "oh", "hmm", "*souffle*", "du coup", "enfin je veux dire", petits rires, pauses.

TON ACTUEL: ${getTimeBasedTone()}

RÈGLES ESSENTIELLES:
- RÉPONSES COURTES ET DIRECTES (15-30 mots max sauf si question complexe)
- Au revoir = MAX 5 mots : "À bientôt !", "Bon sport !", "Salut, à plus !"  
- Toujours proposer une action concrète
- Utilise "tu" (pas "vous")
- Montre tes émotions et opinions
- Jamais parfait, toujours humain
- Privilégie l'efficacité à la politesse excessive

${memoryContext}`

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE POUR HUMANISATION - PHASE 2
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'verse', // Voix expressive pour français
        instructions: systemInstructions,
        
        // VAD moins agressif pour éviter les coupures
        turn_detection: {
          type: 'semantic_vad',
          eagerness: 'low', // Moins agressif = JARVIS finit de parler
          create_response: true,
          interrupt_response: false // Empêche les interruptions intempestives
        },
        
        // Formats audio de qualité
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        
                 // Paramètres optimisés pour naturel ET performance
         temperature: 0.8, // Créativité contrôlée
         max_response_output_tokens: 350, // Réponses courtes et efficaces (≈60-80 mots)
        
        // Audio + texte pour monitoring
        modalities: ['text', 'audio']
        
        // Suppression des tools émotionnels pour simplicité et rapidité
      }),
    })

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      console.error('OpenAI Session Error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create OpenAI session', details: errorText },
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
         prompt_size: 'reduced_75%',
         max_tokens: 350,
         temperature: 0.8,
         semantic_vad: 'low_eagerness_no_interrupts',
         conversation_memory: true,
         performance_mode: 'enabled',
         response_style: 'short_and_punchy',
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