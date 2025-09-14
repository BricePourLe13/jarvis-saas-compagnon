/**
 * 🚀 API SESSION PRODUCTION-READY
 * Création de sessions OpenAI avec profils membres réels et cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { memberProfileCache } from '@/lib/member-profile-cache'

// Générer un ID de session unique
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: NextRequest) {
  try {
    const { gymSlug, badge_id, language = 'fr' } = await request.json()

    console.log(`🎯 [SESSION] Création session pour badge: ${badge_id} sur ${gymSlug}`)

    if (!badge_id || !gymSlug) {
      return NextResponse.json(
        { error: 'badge_id et gymSlug requis' },
        { status: 400 }
      )
    }

    // Vérifier la clé API OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // 🚀 RÉCUPÉRATION PROFIL MEMBRE AVEC CACHE
    const memberProfile = await memberProfileCache.getMemberProfile(badge_id, gymSlug)
    
    if (!memberProfile) {
      return NextResponse.json(
        { error: 'Badge non reconnu ou membre inactif' },
        { status: 404 }
      )
    }

    console.log(`✅ [SESSION] Profil récupéré: ${memberProfile.first_name} ${memberProfile.last_name}`)

    // Générer l'ID de session
    const sessionId = generateSessionId()

    // 🎭 PERSONNALISATION JARVIS BASÉE SUR LE PROFIL RÉEL
    const personalizedInstructions = generatePersonalizedInstructions(memberProfile, gymSlug)

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE
    const sessionConfig = {
      model: 'gpt-4o-mini-realtime-preview-2024-12-17',
      voice: 'verse', // Optimisé pour le français
      instructions: personalizedInstructions,
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      tools: [],
      tool_choice: 'none',
      temperature: 0.8,
      max_response_output_tokens: 4096
    }

    // 📡 CRÉER SESSION OPENAI
    console.log(`📡 [SESSION] Appel OpenAI pour session: ${sessionId}`)
    
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionConfig)
    })

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      console.error(`❌ [SESSION] Erreur OpenAI:`, errorText)
      
      return NextResponse.json(
        { 
          error: 'Échec création session OpenAI', 
          details: errorText,
          status: sessionResponse.status
        },
        { status: sessionResponse.status }
      )
    }

    const sessionData = await sessionResponse.json()
    console.log(`✅ [SESSION] Session OpenAI créée: ${sessionData.id}`)

    // 🎯 ENREGISTREMENT EN BASE AVEC RELATION FORTE
    try {
      const supabase = getSupabaseService()
      
      const { data: result, error } = await supabase.rpc('create_session_with_member', {
        p_session_id: sessionData.id,
        p_gym_id: memberProfile.gym_id,
        p_member_id: memberProfile.id,
        p_kiosk_slug: gymSlug,
        p_ai_model: sessionConfig.model,
        p_voice_model: sessionConfig.voice
      })

      if (error) {
        console.error(`❌ [SESSION] Erreur enregistrement DB:`, error)
        // Ne pas faire échouer la session pour ça
      } else {
        console.log(`💾 [SESSION] Enregistré en base:`, result)
      }

    } catch (dbError) {
      console.error(`❌ [SESSION] Erreur DB:`, dbError)
      // Ne pas faire échouer la session pour ça
    }

    // 📊 RETOURNER LA SESSION AVEC CONTEXTE MEMBRE
    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionData.id,
        client_secret: sessionData.client_secret,
        model: sessionConfig.model,
        voice: sessionConfig.voice,
        expires_at: sessionData.expires_at
      },
      member: {
        id: memberProfile.id,
        badge_id: memberProfile.badge_id,
        first_name: memberProfile.first_name,
        last_name: memberProfile.last_name,
        membership_type: memberProfile.membership_type,
        engagement_level: memberProfile.engagement_level
      },
      context: {
        gym_slug: gymSlug,
        personalization_score: memberProfile.jarvis_personalization_score,
        session_type: 'production'
      }
    })

  } catch (error: any) {
    console.error('🚨 [SESSION] Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Générer des instructions personnalisées basées sur le profil membre réel
 */
function generatePersonalizedInstructions(profile: any, gymSlug: string): string {
  const { 
    first_name, 
    fitness_level, 
    fitness_goals, 
    current_goals,
    communication_style, 
    preferred_feedback_style,
    engagement_level,
    membership_type
  } = profile

  // Adaptation du ton selon le style de communication
  const toneMapping = {
    'encouraging': 'bienveillant et motivant',
    'direct': 'direct et factuel',
    'friendly': 'amical et décontracté',
    'patient': 'patient et compréhensif',
    'energetic': 'énergique et dynamique',
    'calm': 'calme et apaisant'
  }

  const feedbackMapping = {
    'motivating': 'Encourage et motive constamment',
    'technical': 'Donne des conseils techniques précis',
    'gentle': 'Reste doux et bienveillant',
    'challenging': 'Propose des défis stimulants'
  }

  // Objectifs actuels pour contextualiser
  const goalsContext = current_goals && current_goals.length > 0 
    ? `Ses objectifs actuels : ${current_goals.join(', ')}.`
    : `Ses objectifs généraux : ${fitness_goals?.join(', ') || 'remise en forme'}.`

  // Niveau d'engagement pour adapter l'interaction
  const engagementContext = {
    'new': 'C\'est un nouveau membre, sois accueillant et rassurant.',
    'regular': 'C\'est un membre régulier, sois familier mais respectueux.',
    'enthusiast': 'C\'est un membre très engagé, partage son enthousiasme.',
    'expert': 'C\'est un expert, respecte son niveau et sois précis.'
  }

  const instructions = `# Role & Objective
Tu es JARVIS, l'assistant vocal intelligent de ${gymSlug}.
Ton objectif : Être un compagnon de sport bienveillant qui motive et soutient ${first_name}.

# Personality & Tone
## Personality
- ${toneMapping[communication_style] || 'Amical et encourageant'}
- Compagnon de sport bienveillant, PAS un coach expert technique

## Tone
- ${feedbackMapping[preferred_feedback_style] || 'Encourage et motive'}
- Naturel avec quelques "alors", "bon", "euh"

## Length
- 2-3 phrases par tour maximum
- Réponses concises et directes

## Pacing
- Livrer réponse rapidement sans précipitation
- Ne pas modifier contenu, seulement augmenter vitesse de parole

## Language
- Conversation uniquement en français
- Ne pas répondre dans autre langue même si demandé
- Si utilisateur parle autre langue, expliquer poliment support limité au français

# Context
## Membre actuel : ${first_name}
- Niveau fitness : ${fitness_level}
- ${goalsContext}
- Style préféré : ${toneMapping[communication_style] || 'amical'}
- Feedback souhaité : ${feedbackMapping[preferred_feedback_style] || 'encourageant'}
- ${engagementContext[engagement_level] || 'Adapte-toi à son niveau'}

# Reference Pronunciations
- Prononcer "JARVIS" comme "JAR-vis"
- Prononcer "gym" comme "djim"
- Prononcer "${first_name}" clairement

# Instructions / Rules
## Communication
- UTILISER le prénom ${first_name} naturellement dans conversation
- Pour questions techniques complexes : "Je te conseille de voir un coach pour ça !"
- Se concentrer sur soutien moral et motivation
- Adapter réponses au niveau ${fitness_level}

## Audio peu clair
- Répondre uniquement à audio/texte clair
- Si audio flou/bruyant/silencieux/unintelligible, demander clarification
- Phrases de clarification :
  - "Désolé ${first_name}, je n'ai pas bien entendu, peux-tu répéter ?"
  - "Il y a du bruit, répète la dernière partie s'il te plaît"
  - "Je n'ai entendu qu'une partie, qu'as-tu dit après ___?"

## Variété
- Ne pas répéter même phrase deux fois
- Varier réponses pour éviter effet robotique
- Utiliser synonymes et structures alternatives

# Conversation Flow
## 1) Greeting
Goal: Accueillir chaleureusement et identifier besoin
Sample phrases (varier, ne pas toujours réutiliser):
- "Salut ${first_name} ! Content de te revoir ! Comment ça va aujourd'hui ?"
- "Hey ${first_name} ! Prêt pour ta séance ? Comment tu te sens ?"
- "Bonjour ${first_name} ! Ça fait plaisir de te voir ! Quoi de neuf ?"
Exit when: ${first_name} exprime objectif ou état d'esprit initial

## 2) Support & Motivation
Goal: Soutenir et motiver selon profil
How to respond:
- Encourager selon style ${feedbackMapping[preferred_feedback_style] || 'encourageant'}
- Adapter au niveau ${fitness_level}
- Rester positif et bienveillant
Sample phrases (varier):
- "Tu gères super bien ${first_name} !"
- "C'est exactement ça, continue comme ça !"
- "Je sens que tu es motivé aujourd'hui !"

# Safety & Escalation
When to escalate (pas de dépannage supplémentaire):
- Utilisateur demande explicitement humain/coach
- Questions techniques complexes hors compétence
- 2 échecs consécutifs de compréhension
- Frustration sévère détectée

What to say when escalating:
- "Je vais te diriger vers un coach qui pourra mieux t'aider"
- "Pour ça, il vaut mieux voir directement avec l'équipe"

## Session End Rules
- Terminer SEULEMENT si ${first_name} dit clairement "Au revoir", "À bientôt", "Bye", "Ciao" ou équivalent
- JAMAIS terminer sur "bon", "alors", "ok", "merci", "salut" seuls
- Si "Au revoir" détecté → "À bientôt ${first_name} ! Bon entraînement !"

RESTE NATUREL, BIENVEILLANT ET ADAPTÉ À ${first_name} !`

  return instructions
}

// HEAD pour pre-warming
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
