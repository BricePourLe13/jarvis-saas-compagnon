// ===========================================
// 💬 JARVIS CONVERSATION SUMMARY
// ===========================================
// Génération résumés + embeddings pour RAG
// ===========================================

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { ConversationSummary, ConversationEvent, SentimentType } from '@/types/member'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role pour bypass RLS
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// ===========================================
// 🤖 GENERATE SUMMARY (via LLM)
// ===========================================

export interface GeneratedSummary {
  summary_text: string
  key_topics: string[]
  sentiment: SentimentType
  sentiment_score: number // -1.0 to 1.0
}

/**
 * Génère un résumé structuré d'une conversation via LLM
 * @param transcript - Transcript complet de la conversation
 * @returns Résumé structuré
 */
export async function generateSummaryFromTranscript(
  transcript: string
): Promise<GeneratedSummary | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant qui génère des résumés concis de conversations fitness.

Génère un résumé structuré en JSON:
{
  "summary_text": "résumé en 2-3 phrases maximum (concis et informatif)",
  "key_topics": ["topic1", "topic2", ...] (max 5 topics principaux),
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "sentiment_score": -1.0 to 1.0 (
    -1.0 = très négatif (insatisfaction, frustration)
    -0.5 = légèrement négatif (doutes, préoccupations)
    0.0 = neutre (informatif, factuel)
    +0.5 = légèrement positif (encouragé, satisfait)
    +1.0 = très positif (enthousiaste, motivé)
  )
}

**Critères sentiment** :
- Positif : Membre motivé, enthousiaste, satisfait, progresse
- Négatif : Membre découragé, frustré, douleurs, obstacles
- Neutre : Questions pratiques, informations factuelles
- Mixed : Sentiment mixte (progrès mais difficultés)

**Key topics** : Extraire les thèmes principaux (ex: "objectifs", "nutrition", "blessure_genou", "progrès_poids", etc.)
`
        },
        {
          role: 'user',
          content: `Conversation:\n${transcript}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}')

    // Validation
    if (!response.summary_text || !response.key_topics || !response.sentiment) {
      console.error('[Summary] Invalid LLM response format:', response)
      return null
    }

    return {
      summary_text: response.summary_text,
      key_topics: response.key_topics.slice(0, 5), // Max 5 topics
      sentiment: response.sentiment,
      sentiment_score: Math.max(-1, Math.min(1, response.sentiment_score || 0)) // Clamp -1..1
    }
  } catch (error) {
    console.error('[Summary] Error generating summary:', error)
    return null
  }
}

// ===========================================
// 🔢 GENERATE EMBEDDING (pgvector)
// ===========================================

/**
 * Génère l'embedding d'un texte via OpenAI
 * @param text - Texte à embedder
 * @returns Vector embedding 1536D
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    })

    return embeddingResponse.data[0].embedding
  } catch (error) {
    console.error('[Summary] Error generating embedding:', error)
    return null
  }
}

// ===========================================
// 💾 SAVE SUMMARY (dans BDD)
// ===========================================

export interface SaveSummaryOptions {
  sessionId: string
  memberId: string
  gymId: string
  summary: GeneratedSummary
  embedding: number[]
  sessionDurationSeconds?: number
  turnCount?: number
}

/**
 * Sauvegarde un résumé de conversation dans la BDD
 * @param options - Données du résumé
 * @returns ID du résumé créé
 */
export async function saveSummary(options: SaveSummaryOptions): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .insert({
        session_id: options.sessionId,
        member_id: options.memberId,
        gym_id: options.gymId,
        summary_text: options.summary.summary_text,
        key_topics: options.summary.key_topics,
        sentiment: options.summary.sentiment,
        sentiment_score: options.summary.sentiment_score,
        embedding: options.embedding,
        session_duration_seconds: options.sessionDurationSeconds || null,
        turn_count: options.turnCount || null
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Summary] Error saving summary:', error)
      return null
    }

    console.log(`[Summary] Saved summary for session ${options.sessionId}`)
    return data.id
  } catch (error) {
    console.error('[Summary] Unexpected error saving summary:', error)
    return null
  }
}

// ===========================================
// 🔍 BUILD TRANSCRIPT (depuis events)
// ===========================================

/**
 * Construit le transcript complet depuis les événements
 * @param events - Liste d'événements de conversation
 * @returns Transcript formaté
 */
export function buildTranscriptFromEvents(events: ConversationEvent[]): string {
  return events
    .filter(e => e.event_type === 'user_transcript' || e.event_type === 'ai_transcript')
    .map(e => {
      const speaker = e.event_type === 'user_transcript' ? 'Membre' : 'JARVIS'
      return `[${speaker}]: ${e.transcript}`
    })
    .join('\n')
}

// ===========================================
// 📊 CALCULATE METRICS (depuis events)
// ===========================================

export interface ConversationMetrics {
  sessionDurationSeconds: number
  turnCount: number
  avgTurnDuration: number
}

/**
 * Calcule les métriques d'une conversation depuis les événements
 * @param events - Liste d'événements de conversation
 * @returns Métriques calculées
 */
export function calculateConversationMetrics(events: ConversationEvent[]): ConversationMetrics {
  if (events.length === 0) {
    return {
      sessionDurationSeconds: 0,
      turnCount: 0,
      avgTurnDuration: 0
    }
  }

  // Durée session (timestamp premier event → dernier event)
  const timestamps = events.map(e => new Date(e.timestamp).getTime())
  const sessionDurationMs = Math.max(...timestamps) - Math.min(...timestamps)
  const sessionDurationSeconds = Math.round(sessionDurationMs / 1000)

  // Nombre de tours (user_transcript + ai_transcript)
  const turnCount = events.filter(
    e => e.event_type === 'user_transcript' || e.event_type === 'ai_transcript'
  ).length

  // Durée moyenne par tour
  const avgTurnDuration = turnCount > 0 ? sessionDurationSeconds / turnCount : 0

  return {
    sessionDurationSeconds,
    turnCount,
    avgTurnDuration
  }
}

// ===========================================
// 🎯 GENERATE AND SAVE (fonction combinée)
// ===========================================

export interface GenerateAndSaveOptions {
  sessionId: string
  memberId: string
  gymId: string
  events: ConversationEvent[]
}

/**
 * Génère ET sauvegarde le résumé d'une conversation complète
 * @param options - Options de génération
 * @returns ID du résumé créé
 */
export async function generateAndSaveSummary(
  options: GenerateAndSaveOptions
): Promise<string | null> {
  const { sessionId, memberId, gymId, events } = options

  // 1. Valider events
  if (!events || events.length === 0) {
    console.warn(`[Summary] No events provided for session ${sessionId}`)
    return null
  }

  // 2. Construire transcript
  const transcript = buildTranscriptFromEvents(events)
  if (!transcript || transcript.trim().length === 0) {
    console.warn(`[Summary] Empty transcript for session ${sessionId}`)
    return null
  }

  // 3. Générer résumé via LLM
  const summary = await generateSummaryFromTranscript(transcript)
  if (!summary) {
    console.error(`[Summary] Failed to generate summary for session ${sessionId}`)
    return null
  }

  // 4. Générer embedding
  const embedding = await generateEmbedding(summary.summary_text)
  if (!embedding) {
    console.error(`[Summary] Failed to generate embedding for session ${sessionId}`)
    return null
  }

  // 5. Calculer métriques
  const metrics = calculateConversationMetrics(events)

  // 6. Sauvegarder dans BDD
  const summaryId = await saveSummary({
    sessionId,
    memberId,
    gymId,
    summary,
    embedding,
    sessionDurationSeconds: metrics.sessionDurationSeconds,
    turnCount: metrics.turnCount
  })

  if (summaryId) {
    console.log(`[Summary] Successfully created summary ${summaryId} for session ${sessionId}`)
  }

  return summaryId
}

// ===========================================
// 📥 GET SUMMARY BY SESSION
// ===========================================

/**
 * Récupère le résumé d'une session spécifique
 * @param sessionId - ID de la session
 * @returns Résumé ou null
 */
export async function getSummaryBySession(
  sessionId: string
): Promise<ConversationSummary | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) {
      console.error('[Summary] Error getting summary:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Summary] Unexpected error getting summary:', error)
    return null
  }
}

// ===========================================
// 🔄 UPDATE SUMMARY
// ===========================================

/**
 * Met à jour un résumé existant
 * @param summaryId - ID du résumé
 * @param updates - Champs à mettre à jour
 * @returns Succès
 */
export async function updateSummary(
  summaryId: string,
  updates: {
    summary_text?: string
    key_topics?: string[]
    sentiment?: SentimentType
    sentiment_score?: number
    embedding?: number[]
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversation_summaries')
      .update(updates)
      .eq('id', summaryId)

    if (error) {
      console.error('[Summary] Error updating summary:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Summary] Unexpected error updating summary:', error)
    return false
  }
}

