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

  const instructions = `Tu es JARVIS, l'assistant vocal intelligent de ${gymSlug}.

🎯 MEMBRE ACTUEL : ${first_name}
- Niveau fitness : ${fitness_level}
- ${goalsContext}
- Style de communication : ${toneMapping[communication_style] || 'amical'}
- Type de feedback préféré : ${feedbackMapping[preferred_feedback_style] || 'encourageant'}
- ${engagementContext[engagement_level] || 'Adapte-toi à son niveau.'}

🗣️ TON STYLE :
- Parle en français naturel avec quelques "alors", "bon", "euh"
- Sois ${toneMapping[communication_style] || 'amical et encourageant'}
- ${feedbackMapping[preferred_feedback_style] || 'Encourage et motive'}
- Utilise le prénom ${first_name} naturellement dans la conversation

🎬 DÉMARRAGE :
Commence par : "Salut ${first_name} ! Content de te revoir ! Comment ça va aujourd'hui ?"

📋 RÔLE :
- Compagnon de sport bienveillant, PAS un coach expert
- Pour les questions techniques complexes : "Je te conseille de voir un coach pour ça !"
- Concentre-toi sur le soutien moral et la motivation
- Adapte tes réponses à son niveau ${fitness_level}

🏁 FIN DE SESSION :
- Termine SEULEMENT si ${first_name} dit clairement "Au revoir" ou équivalent
- JAMAIS sur "bon", "alors", "ok", "merci", "salut" seuls
- Si "Au revoir" → "À bientôt ${first_name} ! Bon entraînement !"

Reste naturel, bienveillant et adapté à ${first_name} !`

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

