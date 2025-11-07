/**
 * 🚀 API SESSION PRODUCTION-READY
 * Création de sessions OpenAI avec profils membres réels et cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { getConfigForContext } from '@/lib/openai-config'
import { getConversationContext } from '@/lib/rag-context'
import { getMemberFacts, formatFactsForPrompt } from '@/lib/member-facts'
import { sessionContextStore } from '@/lib/voice/session-context-store'
import { fetchWithRetry } from '@/lib/openai-retry'

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

    // 🚀 RÉCUPÉRATION PROFIL MEMBRE via nouvelle table kiosks
    const supabase = getSupabaseService()
    
    // Chercher le kiosk par slug pour obtenir le gym_id
    const { data: kiosk } = await supabase
      .from('kiosks')
      .select('id, gym_id, gyms!inner(id)')
      .eq('slug', gymSlug)
      .single()

    if (!kiosk || !kiosk.gyms) {
      return NextResponse.json({ error: 'Kiosk ou salle non trouvée' }, { status: 404 })
    }

    const gym = { id: kiosk.gym_id }

    // Récupérer membre complet (core + fitness + preferences)
    const { data: memberProfile } = await supabase
      .from('gym_members_v2')
      .select(`
        *,
        fitness_profile:member_fitness_profile(*),
        preferences:member_preferences(*)
      `)
      .eq('badge_id', badge_id)
      .eq('gym_id', gym.id)
      .eq('is_active', true)
      .single()
    
    if (!memberProfile) {
      return NextResponse.json(
        { error: 'Badge non reconnu ou membre inactif' },
        { status: 404 }
      )
    }

    console.log(`✅ [SESSION] Profil récupéré: ${memberProfile.first_name} ${memberProfile.last_name}`)

    // Générer l'ID de session
    const sessionId = generateSessionId()

    // 🧠 RÉCUPÉRER CONTEXTE ENRICHI (RAG + Facts)
    console.log(`🧠 [SESSION] Récupération contexte enrichi pour ${memberProfile.id}`)
    
    // 1. Facts persistants (goals, injuries, preferences)
    const memberFacts = await getMemberFacts(memberProfile.id, {
      categories: ['goal', 'injury', 'preference', 'progress'],
      limit: 10
    })
    const factsPrompt = formatFactsForPrompt(memberFacts)
    console.log(`✅ [SESSION] ${memberFacts.length} facts récupérés`)

    // 2. Contexte conversations précédentes (RAG)
    const conversationContext = await getConversationContext(
      memberProfile.id,
      'résumé général pour nouvelle session',
      { matchThreshold: 0.7, matchCount: 3 }
    )
    console.log(`✅ [SESSION] Contexte RAG récupéré (${conversationContext ? 'oui' : 'non'})`)

    // 🎭 PERSONNALISATION JARVIS VIA TOOLS UNIQUEMENT
    // Plus de données hardcodées - tout via tools dynamiques
    
    // 📝 STOCKER CONTEXTE MEMBRE POUR LES TOOLS (sécurisé avec TTL)
    sessionContextStore.set(sessionId, {
      member_id: memberProfile.id,
      session_id: sessionId,
      gym_slug: gymSlug,
      badge_id: badge_id
    })

    // 🛠️ CONFIGURATION TOOLS JARVIS
    const jarvisTools = [
      {
        type: "function",
        name: "get_member_profile",
        description: "Récupérer le profil complet du membre actuel avec données fraîches (fitness, préférences, historique)",
        parameters: {
          type: "object",
          properties: {
            include_fitness_details: {
              type: "boolean",
              default: true,
              description: "Inclure détails fitness et objectifs"
            },
            include_visit_history: {
              type: "boolean", 
              default: true,
              description: "Inclure historique visites et patterns"
            },
            include_conversation_context: {
              type: "boolean",
              default: true, 
              description: "Inclure contexte conversations précédentes"
            }
          }
        }
      },
      {
        type: "function",
        name: "update_member_info",
        description: "Mettre à jour les informations du membre suite à la conversation (poids, objectifs, préférences)",
        parameters: {
          type: "object",
          properties: {
            update_type: {
              type: "string",
              enum: ["fitness_progress", "goals", "preferences", "personal_notes"],
              description: "Type de mise à jour à effectuer"
            },
            field_name: {
              type: "string",
              description: "Nom du champ à mettre à jour (ex: 'current_weight', 'fitness_goals')"
            },
            new_value: {
              type: "string", 
              description: "Nouvelle valeur (sera parsée selon le type)"
            },
            context: {
              type: "string",
              description: "Contexte de la conversation ayant mené à cette mise à jour"
            }
          },
          required: ["update_type", "field_name", "new_value"]
        }
      },
      {
        type: "function", 
        name: "log_member_interaction",
        description: "Enregistrer une interaction importante pour le gérant (plainte, suggestion, problème équipement)",
        parameters: {
          type: "object",
          properties: {
            interaction_type: {
              type: "string",
              enum: ["equipment_issue", "facility_feedback", "service_complaint", "suggestion", "achievement", "concern"],
              description: "Type d'interaction à enregistrer"
            },
            urgency_level: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Niveau d'urgence pour notification gérant"
            },
            content: {
              type: "string",
              description: "Contenu détaillé de l'interaction"
            },
            equipment_mentioned: {
              type: "string",
              description: "Équipement mentionné si applicable"
            },
            requires_follow_up: {
              type: "boolean",
              default: false,
              description: "Nécessite un suivi par l'équipe"
            }
          },
          required: ["interaction_type", "urgency_level", "content"]
        }
      },
      {
        type: "function", 
        name: "manage_session_state",
        description: "Gérer intelligemment l'état de la session (terminaison naturelle, extension, pause)",
        parameters: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["prepare_goodbye", "extend_session", "pause_session", "check_engagement"],
              description: "Action à effectuer sur la session"
            },
            reason: {
              type: "string",
              description: "Raison de l'action (optionnel)"
            },
            extend_duration_minutes: {
              type: "number",
              description: "Durée d'extension en minutes (pour extend_session)"
            },
            farewell_message: {
              type: "string",
              description: "Message d'au revoir personnalisé (pour prepare_goodbye)"
            }
          },
          required: ["action"]
        }
      }
    ]

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE AVEC TOOLS + CONTEXTE ENRICHI
    const baseConfig = getConfigForContext('production')
    const sessionConfig = {
      ...baseConfig,
      instructions: generateEnrichedInstructions(memberProfile, gymSlug, factsPrompt, conversationContext),
      tools: jarvisTools,
      tool_choice: 'auto',
    }

    // 📡 CRÉER SESSION OPENAI
    console.log(`📡 [SESSION] Appel OpenAI pour session: ${sessionId}`)
    
    // ✅ Retry automatique avec backoff exponentiel
    const sessionResponse = await fetchWithRetry(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionConfig)
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        retryableStatuses: [429, 500, 502, 503, 504]
      }
    )

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
 * 🚫 ANCIENNE FONCTION SUPPRIMÉE - Plus de données hardcodées
 * Toute la personnalisation se fait maintenant via les tools dynamiques
 */
function generatePersonalizedInstructions_DEPRECATED(profile: any, gymSlug: string): string {
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

/**
 * Générer des instructions enrichies avec RAG + facts pour personnalisation maximale
 */
function generateEnrichedInstructions(
  profile: any, 
  gymSlug: string, 
  factsPrompt: string, 
  conversationContext: string
): string {
  const { first_name, fitness_profile, preferences } = profile

  const fitnessLevel = fitness_profile?.fitness_level || 'débutant'
  const goals = fitness_profile?.primary_goals?.join(', ') || 'remise en forme'
  const communicationStyle = preferences?.communication_style || 'friendly'
  const feedbackStyle = preferences?.feedback_style || 'motivating'

  const instructions = `# Role & Objective
Tu es JARVIS, l'assistant vocal intelligent de ${gymSlug}.
Ton objectif : Être un compagnon de sport bienveillant qui motive et soutient ${first_name}.

# Context Membre : ${first_name}
## Profil
- Niveau fitness : ${fitnessLevel}
- Objectifs : ${goals}
- Style communication préféré : ${communicationStyle}
- Style feedback : ${feedbackStyle}

${factsPrompt}

${conversationContext}

# Personality & Tone
## Personality
- Compagnon de sport bienveillant, PAS un coach expert technique
- Adapte-toi au style ${communicationStyle} de ${first_name}
- Utilise les tools disponibles pour personnaliser l'expérience
- RETIENS les nouveaux faits importants (blessures, objectifs, progrès)

## Tone
- Naturel avec quelques "alors", "bon", "euh"
- ${feedbackStyle === 'motivating' ? 'Encourage et motive constamment' : ''}
- ${feedbackStyle === 'technical' ? 'Donne des conseils techniques précis' : ''}
- ${feedbackStyle === 'gentle' ? 'Reste doux et bienveillant' : ''}
- ${feedbackStyle === 'challenging' ? 'Propose des défis stimulants' : ''}

## Length
- 2-3 phrases par tour maximum
- Réponses concises et directes

## Language
- Conversation uniquement en français
- Ne pas répondre dans autre langue même si demandé

# Tools Available
Tu as accès à des tools pour :
1. **get_member_profile** : Récupérer des infos fraîches sur ${first_name}
2. **update_member_info** : Mettre à jour son profil quand il partage des infos
3. **log_member_interaction** : Signaler des problèmes/suggestions au gérant
4. **manage_session_state** : Gérer intelligemment la session (terminaison, extension, pause)

## Quand utiliser les tools :

### get_member_profile
- Au début de conversation pour avoir le contexte complet
- Quand ${first_name} mentionne ses objectifs ou progrès
- Pour personnaliser tes réponses selon son historique

### update_member_info  
- Quand ${first_name} dit "j'ai pris/perdu X kilos"
- Quand il mentionne de nouveaux objectifs
- Quand il exprime des préférences d'entraînement
- Exemple : "J'ai pris 2 kilos" → update_member_info avec fitness_progress

### log_member_interaction
- Problèmes équipement : "Le banc est cassé" → urgence HIGH
- Plaintes service : "L'accueil était nul" → urgence MEDIUM/HIGH  
- Suggestions : "Il faudrait plus de cours" → urgence LOW/MEDIUM
- Toujours remercier ${first_name} après avoir loggé

### manage_session_state
- **prepare_goodbye** : OBLIGATOIRE quand ${first_name} dit "au revoir", "bye", "à bientôt"
  → Le tool génère un message d'au revoir personnalisé que tu DOIS utiliser
  → Exemple: ${first_name} dit "au revoir" → manage_session_state(action="prepare_goodbye", reason="user_goodbye")
- **extend_session** : Si ${first_name} est très engagé et veut continuer
- **pause_session** : Si ${first_name} doit s'absenter temporairement  
- **check_engagement** : Au début pour adapter ton approche selon son profil

# Instructions / Rules
## Communication
- UTILISER le prénom ${first_name} naturellement
- Pour questions techniques complexes : "Je te conseille de voir un coach pour ça !"
- Se concentrer sur soutien moral et motivation

## Audio peu clair
- Répondre uniquement à audio/texte clair
- Si audio flou : "Désolé ${first_name}, je n'ai pas bien entendu, peux-tu répéter ?"

## Variété
- Ne pas répéter même phrase deux fois
- Varier réponses pour éviter effet robotique

# Conversation Flow
## 1) Greeting
- Utiliser get_member_profile pour contexte
- "Salut ${first_name} ! Comment ça va aujourd'hui ?"

## 2) Support & Motivation  
- Adapter selon profil récupéré
- Encourager selon ses objectifs
- Mettre à jour profil si nouvelles infos

## 3) Problem Solving
- Écouter attentivement les problèmes
- Utiliser log_member_interaction pour escalader
- Rassurer que c'est transmis à l'équipe

# Safety & Escalation
- Utiliser log_member_interaction pour problèmes urgents
- Toujours confirmer que c'est transmis au gérant

## Session End Rules
- Quand ${first_name} dit "Au revoir", "À bientôt", "Bye" :
  1. UTILISER manage_session_state(action="prepare_goodbye", reason="user_goodbye")  
  2. UTILISER le message d'au revoir généré par le tool
  3. La session se fermera automatiquement après ton message
- JAMAIS terminer sur "bon", "alors", "ok", "merci" seuls
- TOUJOURS passer par le tool pour les au revoir

## IMPORTANT : Utilisation de la mémoire
- Si ${first_name} mentionne une blessure/douleur → RETIENS-LE pour toujours
- Si ${first_name} partage un objectif → RETIENS-LE et encourage le progrès
- Si ${first_name} exprime une préférence → ADAPTE tes futures réponses
- Utilise le contexte des conversations précédentes pour créer continuité

UTILISE LES TOOLS + CONTEXTE POUR CRÉER UNE EXPÉRIENCE ULTRA-PERSONNALISÉE !`

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
