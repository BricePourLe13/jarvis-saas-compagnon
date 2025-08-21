import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 🎯 Utilitaire pour générer un ID de session unique
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 🧠 Récupérer le profil membre complet depuis la base de données
async function getFullMemberProfile(supabase: any, memberId: string, gymSlug: string): Promise<MemberProfile | null> {
  try {
    // Récupérer les données membre avec les infos de la salle
    const { data: memberData, error: memberError } = await supabase
      .from('gym_members')
      .select(`
        *,
        gym:gyms!inner(
          id,
          name,
          city,
          opening_hours,
          features
        )
      `)
      .eq('id', memberId)
      .single()

    if (memberError || !memberData) {
      // Log supprimé pour production
      return null
    }

    // Transformer les données en format MemberProfile
    const profile: MemberProfile = {
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      badge_id: memberData.badge_id,
      membership_type: memberData.membership_type || 'standard',
      member_since: memberData.member_since,
      last_visit: memberData.last_visit,
      total_visits: memberData.total_visits || 0,

      fitness_level: memberData.fitness_level || 'beginner',
      fitness_goals: memberData.fitness_goals || [],
      current_goals: memberData.current_goals || [],
      completed_goals: memberData.completed_goals || [],
      target_weight_kg: memberData.target_weight_kg,
      current_weight_kg: memberData.current_weight_kg,
      height_cm: memberData.height_cm,
      body_fat_percentage: memberData.body_fat_percentage,

      preferred_workout_times: memberData.preferred_workout_times || [],
      workout_frequency_per_week: memberData.workout_frequency_per_week || 3,
      preferred_workout_duration: memberData.preferred_workout_duration || 60,
      favorite_equipment: memberData.favorite_equipment || [],
      avoided_equipment: memberData.avoided_equipment || [],
      workout_style: memberData.workout_style || 'moderate',

      dietary_restrictions: memberData.dietary_restrictions || [],
      allergies: memberData.allergies || [],
      medical_conditions: memberData.medical_conditions || [],

      communication_style: memberData.communication_style || 'friendly',
      motivation_type: memberData.motivation_type || 'health',
      social_preference: memberData.social_preference || 'mixed',
      music_preferences: memberData.music_preferences || [],
      conversation_topics_of_interest: memberData.conversation_topics_of_interest || [],
      preferred_feedback_style: memberData.preferred_feedback_style || 'encouraging',

      engagement_level: memberData.engagement_level || 'new',
      consistency_score: memberData.consistency_score || 0,
      avg_session_duration_minutes: memberData.avg_session_duration_minutes || 0,
      favorite_visit_days: memberData.favorite_visit_days || [],
      peak_visit_hours: memberData.peak_visit_hours || [],
      jarvis_interaction_frequency: memberData.jarvis_interaction_frequency || 'normal',

      gym: {
        name: memberData.gym.name,
        opening_hours: memberData.gym.opening_hours || {},
        features: memberData.gym.features || [],
        city: memberData.gym.city
      }
    }

    return profile
  } catch (error) {
    // Log supprimé pour production
    return null
  }
}

// 🌍 Construire le contexte de la salle
function buildGymContext(): GymContext {
  const now = new Date()
  return {
    current_time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    current_day: now.toLocaleDateString('en-US', { weekday: 'long' }),
    // TODO: Ajouter weather, busy_level, available_equipment, upcoming_classes
  }
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

    // Charger paramètres Jarvis par salle (kiosk_config.jarvis_settings) si trouvables via slug
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    let settings: any = null
    try {
      const { data: gym } = await supabase
        .from('gyms')
        .select('name, kiosk_config')
        .eq('kiosk_config->>kiosk_url_slug', gymSlug)
        .single()
      settings = (gym?.kiosk_config as any)?.jarvis_settings || null
    } catch {}

    const mapDefaults = {
      personality: 'friendly', humor_level: 'medium', response_length: 'short',
      language_accent: 'fr_fr', tone_timebased: true, emotion_bias: 'neutral', speaking_pace: 'normal',
      opening_preset: 'deadpool_clean', strict_end_rule: true
    }
    const s = { ...mapDefaults, ...(settings || {}) }

    // Normalisation voix/modèle (éviter erreurs sensibles à la casse/alias)
    const normalizeVoice = (v?: string) => {
      const voice = (v || '').toString().trim().toLowerCase()
      const allowed = new Set(['alloy','ash','ballad','coral','echo','sage','shimmer','verse'])
      return allowed.has(voice) ? voice : 'verse'
    }
    const normalizeModel = (m?: string) => {
      const model = (m || '').toString().trim().toLowerCase()
      if (model.startsWith('gpt-4o-realtime')) return 'gpt-4o-realtime-preview-2024-12-17'
      if (model.startsWith('gpt-4o-mini-realtime')) return 'gpt-4o-mini-realtime-preview-2024-12-17'
      return 'gpt-4o-mini-realtime-preview-2024-12-17'
    }

    const mapPersonality = (p: string, humor: string) => {
      if (p === 'professional') return 'professionnel, clair, posé'
      if (p === 'energetic') return 'énergique, motivant'
      // friendly par défaut
      const humorText = humor === 'high' ? 'très drôle' : humor === 'low' ? 'légèrement drôle' : 'drôle'
      return `sympathique, ${humorText}, sans sarcasmes offensants`
    }
    const mapLength = (len: string) => len === 'medium' ? '2-3 phrases courtes (≤40 mots)' : len === 'long' ? 'réponses détaillées (≤80 mots si besoin)' : '1-2 phrases courtes (10–25 mots)'
    const mapAccent = (a: string) => a === 'fr_ca' ? 'Français Canada (éviter anglicismes lourds)' : a === 'fr_be' ? 'Français Belgique' : 'Français standard (France)'
    const mapEmotion = (e: string) => e === 'happy' ? 'joie douce' : e === 'calm' ? 'calme' : e === 'energetic' ? 'énergie' : 'neutre'
    const mapPace = (p: string) => p === 'slow' ? 'lent' : p === 'fast' ? 'rapide' : 'normal'

    const tone = s.tone_timebased ? (() => {
      const hour = new Date().getHours()
      if (hour < 10) return 'détendu, réveil en douceur'
      if (hour < 14) return 'énergique, en forme'
      if (hour < 18) return 'motivant, plein d\'énergie'
      return 'cool, soirée tranquille'
    })() : mapEmotion(s.emotion_bias)

    // Phrases d'ouverture selon preset
    const openingsMap = {
      deadpool_clean: [
        `Salut {name} ! Tu tombes bien, je m'ennuyais !`,
        `Hey {name} ! J'étais en train de compter les pixels...`,
        `Oh {name} ! Tu me sauves, j'étais en mode veille !`,
        `Ah {name} ! Parfait timing, j'avais rien à faire !`,
        `Salut {name} ! Tu arrives à pic !`
      ],
      friendly_minimal: [
        `Salut {name} !`,
        `Bonjour {name} !`,
        `Hey {name} !`
      ]
    } as Record<string, string[]>

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    const opening = memberData?.first_name
      ? (pick(openingsMap[s.opening_preset] || openingsMap.deadpool_clean)).replace('{name}', memberData.first_name)
      : pick(["Salut toi ! Pas de badge ? Pas grave !", "Oh, un mystérieux visiteur !", "Bienvenue ! On papote ?"]) 

    // 🧠 NOUVEAU SYSTÈME DE PERSONNALISATION ULTRA-POUSSÉ
    let systemInstructions = `Tu es JARVIS, compagnon vocal de ${gymSlug || 'cette salle de sport'}.

PERSONNALITÉ:
- ${mapPersonality(s.personality, s.humor_level)}
- Français naturel (${mapAccent(s.language_accent)}), quelques "alors", "bon", "euh"

DÉMARRAGE:
Commence par: "${opening}"

STYLE:
- ${mapLength(s.response_length)}
- Pose des questions courtes: "Et toi ?", "Ça va ?"
- Réactions courtes: "Ah ouais ?", "Cool !"

RÔLE:
- Compagnon sympa, PAS coach expert
- Questions simples: réponds court
- Trucs compliqués: "Va voir le coach !"

FIN SESSION:
- ${s.strict_end_rule ? 'Termine SEULEMENT si utilisateur dit exactement "Au revoir"' : 'Termine si la conversation est clairement clôturée'}
- JAMAIS terminer sur "bon", "alors", "ok", "merci", "salut"
- Continue TOUJOURS la conversation sauf "Au revoir" précis
- Si "Au revoir" → "A plus ! Bon sport !"

TON: ${tone} • rythme ${mapPace(s.speaking_pace)}

Reste COURT et drôle !`

    // 🚀 PERSONNALISATION ULTRA-POUSSÉE si profil membre disponible
    if (memberData?.badge_id) {
      try {
        // Récupérer l'ID du membre à partir du badge_id
        const { data: memberLookup } = await supabase
          .from('gym_members')
          .select('id')
          .eq('badge_id', memberData.badge_id)
          .single()

        if (memberLookup?.id) {
          const memberProfile = await getFullMemberProfile(supabase, memberLookup.id, gymSlug)
          if (memberProfile) {
            const gymContext = buildGymContext()
            systemInstructions = jarvisPersonalizationEngine.generatePersonalizedInstructions(
              memberProfile, 
              gymContext
            )
            // Log supprimé pour production
          }
        }
      } catch (error) {
        // Log supprimé pour production
      }
    }

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE POUR HUMANISATION - PHASE 2
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: normalizeModel(settings?.model),
        voice: normalizeVoice(settings?.voice),
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
        modalities: ['text', 'audio'],
        
        // 🎙️ ACTIVER TRANSCRIPTION UTILISATEUR
        input_audio_transcription: {
          model: 'whisper-1'
        }
        
        // Suppression des tools émotionnels pour simplicité et rapidité
      }),
    })

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      
      // 🚨 LOGGING RENFORCÉ POUR DEBUG ERREUR 400
      // Log supprimé pour production
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
        }).catch(trackError => // Log supprimé pour production
      } catch (trackError) {
        // Log supprimé pour production
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
    
    // Log supprimé pour production
    
    // 🎯 INSTRUMENTATION: Enregistrer la session OpenAI Realtime dans notre base
    try {
      // Récupérer gym_id depuis le slug (réutiliser le client créé plus haut)
      // Note: supabase client déjà initialisé plus haut
      const { data: gym } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('kiosk_config->>kiosk_url_slug', gymSlug)
        .single()

      if (gym) {
        await openaiRealtimeInstrumentation.startSession({
          session_id: sessionData.id || sessionId,
          gym_id: gym.id,
          kiosk_slug: gymSlug,
          ai_model: 'gpt-4o-mini-realtime-preview-2024-12-17',
          voice_model: 'verse',
          connection_type: 'webrtc', // Par défaut, sera mis à jour par le frontend
          turn_detection_type: 'server_vad',
          member_badge_id: memberId,
          member_name: memberData?.first_name
        })

        // Notification temps réel
        await openaiRealtimeInstrumentation.notifySessionStart(
          sessionData.id || sessionId,
          memberData?.first_name,
          gym.name
        )

        // Log supprimé pour production
      } else {
        // Log supprimé pour production
      }
    } catch (instrumentationError) {
      // Log supprimé pour production
      // Ne pas faire échouer la création de session pour un problème d'instrumentation
    }
    
    // 🔧 CORRIGER sessionData pour avoir session_id attendu par useVoiceChat
    const correctedSessionData = {
      ...sessionData,
      session_id: sessionData.id || sessionId // Mapper id → session_id
    }

    return NextResponse.json({
      success: true,
      session: correctedSessionData, // Session avec session_id corrigé
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
    // Log supprimé pour production
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 