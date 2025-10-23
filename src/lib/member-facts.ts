// ===========================================
// 🧠 JARVIS MEMBER FACTS
// ===========================================
// Extraction et gestion des faits persistants
// (goals, injuries, preferences, progress, concerns)
// ===========================================

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { MemberFact, FactCategory, CreateMemberFact } from '@/types/member'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role pour bypass RLS
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// ===========================================
// 🤖 EXTRACT FACTS (via LLM)
// ===========================================

export interface ExtractedFact {
  category: FactCategory
  fact_key: string
  fact_value: Record<string, any>
  confidence: number // 0.0-1.0
  source_quote: string
}

/**
 * Extrait les faits importants d'un transcript via LLM
 * @param transcript - Transcript complet de la conversation
 * @returns Liste de faits extraits
 */
export async function extractFactsFromTranscript(
  transcript: string
): Promise<ExtractedFact[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un extracteur de faits importants depuis des conversations fitness.

Extrait UNIQUEMENT les faits persistants qui devraient être retenus pour les prochaines conversations :
- **goals** : Objectifs fitness (perte poids, prise muscle, endurance, etc.)
- **injury** : Blessures, douleurs, limitations physiques
- **preference** : Préférences entraînement (équipements aimés/évités, horaires, etc.)
- **progress** : Progrès accomplis, milestones atteints
- **concern** : Préoccupations, problèmes, questions récurrentes

Ignore :
- Les salutations, politesses
- Les questions simples répondues immédiatement
- Les informations temporaires

Retourne un JSON array de facts:
{
  "facts": [
    {
      "category": "goal" | "injury" | "preference" | "progress" | "concern",
      "fact_key": "string (unique identifier, snake_case)",
      "fact_value": {...},
      "confidence": 0.0-1.0,
      "source_quote": "extrait exact du transcript qui justifie le fait"
    }
  ]
}

Exemples:
- category: "injury", fact_key: "knee_pain", fact_value: {"location": "right_knee", "severity": "moderate", "since": "2025-01-15", "exercises_to_avoid": ["squats", "lunges"]}
- category: "goal", fact_key: "weight_loss", fact_value: {"target_kg": 75, "current_kg": 85, "deadline": "2025-06-01"}
- category: "preference", fact_key: "workout_time", fact_value: {"preferred_time": "morning", "reason": "plus d'énergie"}
`
        },
        {
          role: 'user',
          content: `Transcript:\n${transcript}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3 // Faible température pour cohérence
    })

    const response = JSON.parse(completion.choices[0].message.content || '{"facts": []}')
    return response.facts || []
  } catch (error) {
    console.error('[Facts] Error extracting facts:', error)
    return []
  }
}

// ===========================================
// 💾 SAVE FACTS (dans BDD)
// ===========================================

/**
 * Sauvegarde des faits extraits dans la BDD
 * Utilise UPSERT pour mettre à jour les faits existants
 * @param memberId - ID du membre
 * @param sessionId - ID de la session source
 * @param facts - Faits extraits
 * @returns Nombre de faits sauvegardés
 */
export async function saveFacts(
  memberId: string,
  sessionId: string,
  facts: ExtractedFact[]
): Promise<number> {
  if (facts.length === 0) {
    return 0
  }

  try {
    const factsToInsert: CreateMemberFact[] = facts.map(fact => ({
      member_id: memberId,
      category: fact.category,
      fact_key: fact.fact_key,
      fact_value: fact.fact_value,
      confidence: fact.confidence,
      source_session_id: sessionId,
      source_quote: fact.source_quote,
      is_active: true,
      expires_at: null // Permanent par défaut
    }))

    const { error } = await supabase
      .from('member_facts')
      .upsert(factsToInsert, {
        onConflict: 'member_id,category,fact_key'
      })

    if (error) {
      console.error('[Facts] Error saving facts:', error)
      return 0
    }

    console.log(`[Facts] Saved ${facts.length} facts for member ${memberId}`)
    return facts.length
  } catch (error) {
    console.error('[Facts] Unexpected error saving facts:', error)
    return 0
  }
}

// ===========================================
// 🔍 GET FACTS (depuis BDD)
// ===========================================

export interface GetFactsOptions {
  categories?: FactCategory[]
  includeInactive?: boolean
  limit?: number
}

/**
 * Récupère les faits d'un membre
 * @param memberId - ID du membre
 * @param options - Options de filtrage
 * @returns Liste de faits
 */
export async function getMemberFacts(
  memberId: string,
  options: GetFactsOptions = {}
): Promise<MemberFact[]> {
  const {
    categories,
    includeInactive = false,
    limit = 50
  } = options

  try {
    let query = supabase
      .from('member_facts')
      .select('*')
      .eq('member_id', memberId)

    // Filtrer par catégories
    if (categories && categories.length > 0) {
      query = query.in('category', categories)
    }

    // Filtrer actifs seulement
    if (!includeInactive) {
      query = query
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
    }

    // Limiter + trier
    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('[Facts] Error getting facts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Facts] Unexpected error getting facts:', error)
    return []
  }
}

// ===========================================
// 📝 FORMAT FACTS (pour prompt JARVIS)
// ===========================================

/**
 * Formate les faits pour injection dans prompt JARVIS
 * @param facts - Liste de faits
 * @returns Texte formaté prêt pour prompt
 */
export function formatFactsForPrompt(facts: MemberFact[]): string {
  if (facts.length === 0) {
    return ''
  }

  const factsByCategory: Record<FactCategory, MemberFact[]> = {
    goal: [],
    injury: [],
    preference: [],
    progress: [],
    concern: []
  }

  facts.forEach(fact => {
    factsByCategory[fact.category].push(fact)
  })

  const sections = []

  // Goals
  if (factsByCategory.goal.length > 0) {
    sections.push(`**Objectifs** :
${factsByCategory.goal.map(f => `- ${f.fact_key}: ${JSON.stringify(f.fact_value)}`).join('\n')}`)
  }

  // Injuries
  if (factsByCategory.injury.length > 0) {
    sections.push(`**Blessures/Limitations** :
${factsByCategory.injury.map(f => `- ${f.fact_key}: ${JSON.stringify(f.fact_value)} (⚠️ IMPORTANT)`).join('\n')}`)
  }

  // Preferences
  if (factsByCategory.preference.length > 0) {
    sections.push(`**Préférences** :
${factsByCategory.preference.map(f => `- ${f.fact_key}: ${JSON.stringify(f.fact_value)}`).join('\n')}`)
  }

  // Progress
  if (factsByCategory.progress.length > 0) {
    sections.push(`**Progrès** :
${factsByCategory.progress.map(f => `- ${f.fact_key}: ${JSON.stringify(f.fact_value)}`).join('\n')}`)
  }

  // Concerns
  if (factsByCategory.concern.length > 0) {
    sections.push(`**Préoccupations** :
${factsByCategory.concern.map(f => `- ${f.fact_key}: ${JSON.stringify(f.fact_value)}`).join('\n')}`)
  }

  return `## FAITS IMPORTANTS À RETENIR

${sections.join('\n\n')}`
}

// ===========================================
// 🔄 UPDATE FACT
// ===========================================

/**
 * Met à jour un fait existant
 * @param factId - ID du fait
 * @param updates - Champs à mettre à jour
 * @returns Succès
 */
export async function updateFact(
  factId: string,
  updates: {
    fact_value?: Record<string, any>
    confidence?: number
    is_active?: boolean
    expires_at?: string | null
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('member_facts')
      .update(updates)
      .eq('id', factId)

    if (error) {
      console.error('[Facts] Error updating fact:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Facts] Unexpected error updating fact:', error)
    return false
  }
}

// ===========================================
// 🗑️ DELETE/DEACTIVATE FACT
// ===========================================

/**
 * Désactive un fait (soft delete)
 * @param factId - ID du fait
 * @returns Succès
 */
export async function deactivateFact(factId: string): Promise<boolean> {
  return updateFact(factId, { is_active: false })
}

/**
 * Supprime définitivement un fait (hard delete)
 * @param factId - ID du fait
 * @returns Succès
 */
export async function deleteFact(factId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('member_facts')
      .delete()
      .eq('id', factId)

    if (error) {
      console.error('[Facts] Error deleting fact:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Facts] Unexpected error deleting fact:', error)
    return false
  }
}

// ===========================================
// 🎯 EXTRACT AND SAVE (fonction combinée)
// ===========================================

/**
 * Extrait ET sauvegarde les faits d'une conversation
 * @param memberId - ID du membre
 * @param sessionId - ID de la session
 * @param transcript - Transcript complet
 * @returns Nombre de faits sauvegardés
 */
export async function extractAndSaveFacts(
  memberId: string,
  sessionId: string,
  transcript: string
): Promise<number> {
  // 1. Extraire facts
  const extractedFacts = await extractFactsFromTranscript(transcript)

  if (extractedFacts.length === 0) {
    console.log(`[Facts] No facts extracted for session ${sessionId}`)
    return 0
  }

  // 2. Sauvegarder
  const savedCount = await saveFacts(memberId, sessionId, extractedFacts)

  console.log(`[Facts] Extracted and saved ${savedCount}/${extractedFacts.length} facts for member ${memberId}`)

  return savedCount
}

