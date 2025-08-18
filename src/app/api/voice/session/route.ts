/**
 * 🎤 API VOICE SESSION
 * Création de session OpenAI Realtime + tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export async function POST(request: NextRequest) {
  try {
    const { gymSlug, memberId, memberData } = await request.json()
    
    console.log('🎤 [VOICE SESSION] Création session pour:', { gymSlug, memberId })

    // 1. Récupérer les infos gym
    const supabase = getSupabaseSingleton()
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, franchise_id')
      .eq('kiosk_config->kiosk_url_slug', gymSlug)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({
        error: 'Salle introuvable'
      }, { status: 404 })
    }

    // 2. Créer session OpenAI avec token ephémère
    const openaiResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: generateJarvisInstructions(memberData, gym),
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' }, // ✅ TRANSCRIPTION ACTIVÉE
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [],
        temperature: 0.8,
        max_response_output_tokens: 4096
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('❌ [VOICE SESSION] Erreur OpenAI:', error)
      return NextResponse.json({
        error: 'Erreur création session OpenAI'
      }, { status: 500 })
    }

    const session = await openaiResponse.json()
    console.log('✅ [VOICE SESSION] Session OpenAI créée:', session.id)

    // 3. Créer enregistrement session en DB
    const sessionId = `jarvis_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    const { error: dbError } = await supabase
      .from('openai_realtime_sessions')
      .insert({
        session_id: sessionId,
        openai_session_id: session.id,
        gym_id: gym.id,
        kiosk_slug: gymSlug,
        member_id: memberId,
        member_name: memberData ? `${memberData.first_name} ${memberData.last_name}` : null,
        member_badge_id: memberData?.badge_id,
        session_started_at: new Date().toISOString(),
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_input_audio_tokens: 0,
        total_output_audio_tokens: 0,
        total_user_turns: 0,
        total_ai_turns: 0,
        total_interruptions: 0,
        total_cost_usd: 0,
        session_metadata: {
          status: 'active',
          gym_name: gym.name,
          franchise_id: gym.franchise_id,
          created_with_logging: true // ✅ FLAG LOGGING ACTIVÉ
        }
      })

    if (dbError) {
      console.error('❌ [VOICE SESSION] Erreur DB:', dbError)
    }

    return NextResponse.json({
      client_secret: session.client_secret,
      session_id: sessionId, // Notre ID interne
      openai_session_id: session.id, // ID OpenAI
      expires_at: session.expires_at,
      gym_id: gym.id,
      member_id: memberId
    })

  } catch (error) {
    console.error('💥 [VOICE SESSION] Exception:', error)
    return NextResponse.json({
      error: 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * 🧠 Générer les instructions JARVIS personnalisées
 */
function generateJarvisInstructions(memberData: any, gym: any): string {
  const baseInstructions = `Tu es JARVIS, l'assistant IA de la salle ${gym.name}. Tu es bienveillant, motivant et expert en fitness.`
  
  if (!memberData) {
    return `${baseInstructions}

CONTEXTE: Nouvel utilisateur anonyme.
MISSION: Accueillir chaleureusement et proposer ton aide pour découvrir la salle.

STYLE: Amical, professionnel, encourageant.
LANGUE: Français uniquement.
RÉPONSES: Courtes et claires (maximum 2-3 phrases).`
  }

  const personalizedInstructions = `${baseInstructions}

MEMBRE: ${memberData.first_name} ${memberData.last_name}
OBJECTIFS: ${(memberData.fitness_goals || []).join(', ') || 'Non définis'}
ACTIVITÉS PRÉFÉRÉES: ${(memberData.favorite_activities || []).join(', ') || 'À découvrir'}
NIVEAU: ${memberData.fitness_level || 'Débutant'}
DERNIÈRE VISITE: ${memberData.last_visit || 'Première visite'}
TOTAL VISITES: ${memberData.total_visits || 0}

STYLE COMMUNICATION: ${memberData.communication_style || 'Encourageant et motivant'}
RESTRICTIONS: ${(memberData.medical_conditions || []).join(', ') || 'Aucune connue'}

MISSION: 
- Personnaliser tes conseils selon son profil
- Te souvenir des conversations précédentes
- Être motivant et adapté à ses objectifs
- Proposer des exercices selon ses préférences
- Respecter ses restrictions médicales

STYLE: ${memberData.communication_style || 'motivational'}, professionnel, personnalisé.
LANGUE: Français uniquement.
RÉPONSES: Courtes et claires (maximum 2-3 phrases).

IMPORTANT: Tu connais ${memberData.first_name} personnellement. Utilise son prénom et fais référence à son historique.`

  return personalizedInstructions
}

