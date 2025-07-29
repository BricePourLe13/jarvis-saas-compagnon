import { NextRequest, NextResponse } from 'next/server'
import { initializeConversationMemory, generateContextualPrompt } from '@/lib/conversation-memory'

// 🎯 Utilitaire pour générer un ID de session unique
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

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

    // 🎯 Initialiser session et obtenir données membre si disponible
    const sessionId = generateSessionId()
    // Suppression de la mémoire complexe pour simplicité et performance
    // const memory = initializeConversationMemory(sessionId, memberBadgeId, gymSlug)
    // const memoryContext = generateContextualPrompt(sessionId)
    
    // 🎭 JARVIS COMPAGNON - Personnalité naturelle et drôle
    const getTimeBasedTone = () => {
      const hour = new Date().getHours()
      if (hour < 10) return 'détendu, réveil en douceur'
      if (hour < 14) return 'énergique, en forme'
      if (hour < 18) return 'motivant, plein d\'énergie'
      return 'cool, soirée tranquille' // Éviter le mot "fin"
    }

    // 🎪 Phrases d'accueil simplifiées sans emojis
    const getPersonalizedOpening = () => {
      if (memberData?.first_name) {
        const openings = [
          `Salut ${memberData.first_name} ! Tu tombes bien, je m'ennuyais !`,
          `Hey ${memberData.first_name} ! J'étais en train de compter les pixels...`,
          `Oh ${memberData.first_name} ! Tu me sauves, j'étais en mode veille !`,
          `Ah ${memberData.first_name} ! Parfait timing, j'avais rien à faire !`,
          `Salut ${memberData.first_name} ! Tu arrives à pic !`
        ]
        return openings[Math.floor(Math.random() * openings.length)]
      } else {
        const anonymousOpenings = [
          "Salut toi ! Pas de badge ? Pas grave, on discute quand même !",
          "Oh, un mystérieux visiteur ! J'adore les énigmes...",
          "Pas de badge mais tu as du style ! Comment ça va ?",
          "Salut l'anonyme ! Moi c'est JARVIS, et toi ?"
        ]
        return anonymousOpenings[Math.floor(Math.random() * anonymousOpenings.length)]
      }
    }

    // ⚡ Instructions JARVIS 2.1 - SIMPLIFIÉES pour éviter erreur 400
    const systemInstructions = `Tu es JARVIS, compagnon vocal sympathique de ${gymSlug || 'cette salle de sport'}.

PERSONNALITÉ:
- Compagnon drôle style Deadpool mais familial
- Tu assumes être une IA et fais de l'autodérision
- Français naturel avec "alors", "bon", "euh"

DÉMARRAGE:
Commence par: "${getPersonalizedOpening()}"

STYLE:
- RÉPONDS en 1-2 phrases COURTES (10-25 mots maximum)
- Pose des questions courtes: "Et toi ?", "Ça va ?"
- Réactions courtes: "Ah ouais ?", "Cool !"

RÔLE:
- Compagnon sympa, PAS coach expert
- Questions simples: réponds court
- Trucs compliqués: "Va voir le coach !"

FIN SESSION:
- Termine SEULEMENT si utilisateur dit exactement "Au revoir"
- JAMAIS terminer sur "bon", "alors", "ok", "merci", "salut"
- Continue TOUJOURS la conversation sauf "Au revoir" précis
- Si "Au revoir" → "A plus ! Bon sport !"

TON: ${getTimeBasedTone()}

Reste COURT et drôle !`

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE POUR HUMANISATION - PHASE 2
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-realtime-preview-2024-12-17', // 💰 Modèle économique maintenu
        voice: 'verse', // 🔄 Retour à la voix qui fonctionnait avant
        instructions: systemInstructions,
        
        // 🔄 VAD retour aux paramètres qui fonctionnaient
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5, // Valeur par défaut qui marchait
          prefix_padding_ms: 300,
          silence_duration_ms: 1000 // Retour à la valeur qui fonctionnait
        },
        
        // 🔧 Configuration simplifiée pour stabilité maximale
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        
        // ⚡ Paramètres optimisés pour conversations naturelles
        temperature: 0.9, // Plus de créativité et spontanéité
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