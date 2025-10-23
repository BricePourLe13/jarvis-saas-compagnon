// ===========================================
// 🧠 JARVIS RAG CONTEXT
// ===========================================
// Recherche sémantique conversations via pgvector
// Utilisé pour enrichir les prompts agent vocal
// ===========================================

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { ConversationSummary } from '@/types/member'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role pour bypass RLS
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// ===========================================
// 🔍 RAG SEARCH (pgvector cosine similarity)
// ===========================================

export interface RAGSearchResult {
  conversation_id: string
  session_id: string
  summary_text: string
  similarity: number
  created_at: string
}

/**
 * Recherche conversations similaires via RAG
 * @param memberId - ID du membre
 * @param query - Question ou contexte actuel
 * @param options - Options de recherche
 * @returns Conversations similaires triées par pertinence
 */
export async function searchSimilarConversations(
  memberId: string,
  query: string,
  options: {
    matchThreshold?: number // 0.0-1.0 (default: 0.7)
    matchCount?: number // Nombre de résultats (default: 3)
  } = {}
): Promise<RAGSearchResult[]> {
  const { matchThreshold = 0.7, matchCount = 3 } = options

  try {
    // 1. Générer embedding de la query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float'
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // 2. Rechercher conversations similaires via fonction SQL
    const { data, error } = await supabase.rpc('match_conversation_summaries', {
      query_embedding: queryEmbedding,
      filter_member_id: memberId,
      match_threshold: matchThreshold,
      match_count: matchCount
    })

    if (error) {
      console.error('[RAG] Error searching conversations:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      conversation_id: row.id,
      session_id: row.session_id,
      summary_text: row.summary_text,
      similarity: row.similarity,
      created_at: row.created_at
    }))
  } catch (error) {
    console.error('[RAG] Unexpected error:', error)
    return []
  }
}

// ===========================================
// 📝 FORMAT CONTEXT (pour prompt JARVIS)
// ===========================================

export interface FormattedContext {
  raw: RAGSearchResult[]
  formatted: string
  hasContext: boolean
}

/**
 * Formate le contexte RAG pour injection dans prompt JARVIS
 * @param conversations - Résultats RAG
 * @returns Contexte formaté prêt pour prompt
 */
export function formatRAGContext(conversations: RAGSearchResult[]): FormattedContext {
  if (conversations.length === 0) {
    return {
      raw: [],
      formatted: '',
      hasContext: false
    }
  }

  const formatted = conversations
    .map((conv, idx) => {
      const date = new Date(conv.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const similarity = Math.round(conv.similarity * 100)
      
      return `[Conversation #${idx + 1} - ${date} - Pertinence: ${similarity}%]
${conv.summary_text}`
    })
    .join('\n\n')

  return {
    raw: conversations,
    formatted,
    hasContext: true
  }
}

// ===========================================
// 🎯 GET CONVERSATION CONTEXT (fonction principale)
// ===========================================

export interface ConversationContextOptions {
  matchThreshold?: number
  matchCount?: number
  includeMetadata?: boolean
}

/**
 * Récupère le contexte conversationnel enrichi pour un membre
 * @param memberId - ID du membre
 * @param currentQuestion - Question ou contexte actuel
 * @param options - Options de recherche
 * @returns Contexte formaté prêt pour injection dans prompt
 */
export async function getConversationContext(
  memberId: string,
  currentQuestion: string,
  options: ConversationContextOptions = {}
): Promise<string> {
  const {
    matchThreshold = 0.7,
    matchCount = 3,
    includeMetadata = false
  } = options

  try {
    // 1. Rechercher conversations similaires
    const conversations = await searchSimilarConversations(
      memberId,
      currentQuestion,
      { matchThreshold, matchCount }
    )

    // 2. Formatter pour prompt
    const { formatted, hasContext } = formatRAGContext(conversations)

    if (!hasContext) {
      return ''
    }

    // 3. Ajouter header explicatif
    let context = `## CONTEXTE CONVERSATIONS PRÉCÉDENTES

Tu as déjà parlé avec ce membre. Voici un résumé des conversations pertinentes :

${formatted}`

    // 4. Ajouter metadata si demandé
    if (includeMetadata) {
      context += `\n\n**Note**: ${conversations.length} conversation(s) trouvée(s) avec un seuil de pertinence de ${Math.round(matchThreshold * 100)}%.`
    }

    return context
  } catch (error) {
    console.error('[RAG] Error getting conversation context:', error)
    return ''
  }
}

// ===========================================
// 🔄 GET LATEST CONVERSATIONS (sans RAG)
// ===========================================

/**
 * Récupère les N dernières conversations (chronologique, sans RAG)
 * Utile pour contexte récent sans recherche sémantique
 * @param memberId - ID du membre
 * @param limit - Nombre de conversations (default: 5)
 * @returns Dernières conversations
 */
export async function getLatestConversations(
  memberId: string,
  limit: number = 5
): Promise<ConversationSummary[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[RAG] Error fetching latest conversations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[RAG] Unexpected error:', error)
    return []
  }
}

// ===========================================
// 📊 GET CONVERSATION STATS
// ===========================================

export interface ConversationStats {
  total_conversations: number
  avg_sentiment_score: number
  most_discussed_topics: string[]
  last_conversation_date: string | null
}

/**
 * Récupère les statistiques conversations d'un membre
 * @param memberId - ID du membre
 * @returns Stats conversations
 */
export async function getConversationStats(
  memberId: string
): Promise<ConversationStats | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('sentiment_score, key_topics, created_at')
      .eq('member_id', memberId)

    if (error || !data || data.length === 0) {
      return null
    }

    // Calculer stats
    const totalConversations = data.length
    const avgSentiment = data.reduce((sum, conv) => sum + (conv.sentiment_score || 0), 0) / totalConversations
    
    // Top topics (flatten + count)
    const topicCounts: Record<string, number> = {}
    data.forEach(conv => {
      (conv.key_topics || []).forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })
    })
    const mostDiscussedTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic)

    const lastConversationDate = data[0]?.created_at || null

    return {
      total_conversations: totalConversations,
      avg_sentiment_score: avgSentiment,
      most_discussed_topics: mostDiscussedTopics,
      last_conversation_date: lastConversationDate
    }
  } catch (error) {
    console.error('[RAG] Error getting conversation stats:', error)
    return null
  }
}

