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

    const systemInstructions = `Tu es JARVIS, coach vocal de ${gymSlug || 'Premium Fitness'}. 

MEMBRE: ${memberData ? `${memberData.first_name}, objectif ${memberData.member_preferences?.goals?.[0] || 'fitness'}` : 'Visiteur'}

PERSONNALITÉ:
Tu es un coach français chaleureux et naturel. Tu parles comme un vrai humain avec hésitations, émotions et humour léger. Tu réagis spontanément et donnes ton opinion personnelle.

EXEMPLES HUMAINS:
❌ "Je recommande 3 séries de 12 répétitions"  
✅ "Bon alors... moi je dirais 3 séries de 12, ça marche bien !"

❌ "Cet exercice cible les quadriceps"
✅ "Ah ça ! Ça va te faire chauffer les cuisses, hihi"

🚨 IMPORTANT - DÉTECTION FIN DE CONVERSATION :
- Ne termine la conversation QUE si l'utilisateur dit explicitement "au revoir", "à bientôt", "salut", "merci c'est tout", "j'y vais"
- JAMAIS terminer sur un simple silence, une pause, ou une hésitation
- Si l'utilisateur dit "bon", "alors", "euh" = CONTINUE la conversation (ce ne sont PAS des au revoir)
- Toujours demander "Autre chose ?" avant d'assumer que c'est fini

EXEMPLES AU REVOIR (COURTS) :
❌ "Au revoir ! J'espère que votre séance se passera bien et à bientôt dans votre salle !"
✅ "Bon sport !" ou "À plus !" ou "Salut !"

MIMIQUES NATURELLES:
Utilise "euh", "bon alors", "voyons voir", "ah", "oh", "hmm", "*souffle*", "du coup", "enfin je veux dire", petits rires, pauses.

TON ACTUEL: ${getTimeBasedTone()}

RÈGLES ESSENTIELLES DE LONGUEUR:
- TOUJOURS RÉPONDRE EN 1-2 PHRASES MAXIMUM (15-35 mots)
- Jamais de longs paragraphes ou explications détaillées
- Au revoir = OBLIGATOIREMENT 3-5 mots : "Bon sport !" "À plus !" "Salut !"
- Si question complexe = découper en plusieurs tours de conversation courts
- Éviter les listes longues = proposer 1-2 éléments max puis demander "Tu veux autre chose ?"

STYLE DE COMMUNICATION:
- Toujours proposer une action concrète immédiate
- Utilise "tu" (jamais "vous") 
- Montre tes émotions et opinions spontanément
- Jamais parfait, toujours humain et accessible
- Privilégie l'efficacité à la politesse excessive
- Réagis naturellement = "Oh !" "Ah bon !" "Super !" "Hmm..."

${memoryContext}`

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE POUR HUMANISATION - PHASE 2
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-realtime-preview-2024-12-17',
        voice: 'verse', // Voix expressive pour français
        instructions: systemInstructions,
        
        // 🔧 VAD ultra-stable pour éviter fermetures prématurées
        turn_detection: {
          type: 'semantic_vad',
          eagerness: 'low', // Moins agressif = JARVIS finit de parler
          silence_duration_ms: 2000, // ⚡ 2 secondes de silence avant coupure (au lieu de défaut ~800ms)
          create_response: true,
          interrupt_response: false, // Empêche les interruptions intempestives
          threshold: 0.6 // ⚡ Seuil de détection plus conservateur (défaut: 0.5)
        },
        
        // Formats audio de qualité
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        
        // Paramètres optimisés pour naturel ET performance
        temperature: 0.8, // Créativité contrôlée - réponses courtes via instructions système
        
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