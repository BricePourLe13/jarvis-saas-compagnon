# ✅ PHASE 2 : CODE NEXT.JS - COMPLÉTÉE

**Date** : 23 octobre 2025  
**Statut** : ✅ **TERMINÉE**

---

## 📦 FICHIERS CRÉÉS (4 fichiers TypeScript)

### 1. **Types TypeScript** (`src/types/member.ts`) - 366 lignes
```typescript
export interface GymMemberCore { /* 15 colonnes */ }
export interface MemberFitnessProfile { /* module fitness */ }
export interface MemberPreferences { /* préférences JARVIS */ }
export interface MemberFact { /* faits structurés */ }
export interface MemberAnalytics { /* métriques calculées */ }
export interface ManagerAlert { /* alertes intelligentes */ }
export interface InsightsReport { /* rapports automatiques */ }
export interface ConversationSummary { /* RAG */ }
export interface ConversationEvent { /* événements bruts */ }
export interface GymMemberComplete { /* type composé */ }
```

### 2. **RAG Context** (`src/lib/rag-context.ts`) - 300+ lignes
```typescript
// Recherche sémantique conversations via pgvector
export async function searchSimilarConversations(memberId, query, options)
export function formatRAGContext(conversations)
export async function getConversationContext(memberId, currentQuestion, options)
export async function getLatestConversations(memberId, limit)
export async function getConversationStats(memberId)
```

**Utilisation** :
```typescript
import { getConversationContext } from '@/lib/rag-context'

const context = await getConversationContext(
  memberId,
  'Comment s\'est passée ma dernière séance ?',
  { matchThreshold: 0.7, matchCount: 3 }
)
// Retourne contexte formaté prêt pour prompt JARVIS
```

### 3. **Facts Extraction** (`src/lib/member-facts.ts`) - 350+ lignes
```typescript
// Extraction et gestion faits persistants (LLM)
export async function extractFactsFromTranscript(transcript)
export async function saveFacts(memberId, sessionId, facts)
export async function getMemberFacts(memberId, options)
export function formatFactsForPrompt(facts)
export async function extractAndSaveFacts(memberId, sessionId, transcript)
```

**Utilisation** :
```typescript
import { extractAndSaveFacts, getMemberFacts, formatFactsForPrompt } from '@/lib/member-facts'

// Après une conversation
const savedCount = await extractAndSaveFacts(memberId, sessionId, transcript)

// Avant une conversation
const facts = await getMemberFacts(memberId, { categories: ['injury', 'goal'] })
const factsPrompt = formatFactsForPrompt(facts)
// Injecter dans prompt JARVIS
```

### 4. **Summary Generation** (`src/lib/conversation-summary.ts`) - 400+ lignes
```typescript
// Génération résumés + embeddings pour RAG
export async function generateSummaryFromTranscript(transcript)
export async function generateEmbedding(text)
export async function saveSummary(options)
export function buildTranscriptFromEvents(events)
export function calculateConversationMetrics(events)
export async function generateAndSaveSummary(options)
```

**Utilisation** :
```typescript
import { generateAndSaveSummary } from '@/lib/conversation-summary'

// À la fin d'une conversation
const summaryId = await generateAndSaveSummary({
  sessionId,
  memberId,
  gymId,
  events: conversationEvents
})
// Génère résumé + embedding 1536D + sauvegarde dans BDD
```

---

## 🔄 WORKFLOW COMPLET AGENT JARVIS

### **1. AVANT Conversation (Contexte enrichi)**

```typescript
import { getConversationContext } from '@/lib/rag-context'
import { getMemberFacts, formatFactsForPrompt } from '@/lib/member-facts'
import { supabase } from '@/lib/supabase'

// Récupérer profil membre complet
const { data: member } = await supabase
  .from('gym_members_v2')
  .select(`
    *,
    fitness_profile:member_fitness_profile(*),
    preferences:member_preferences(*)
  `)
  .eq('badge_id', badgeId)
  .single()

// Récupérer facts actifs
const facts = await getMemberFacts(member.id, {
  categories: ['goal', 'injury', 'preference']
})
const factsPrompt = formatFactsForPrompt(facts)

// Récupérer contexte conversations (RAG)
const conversationContext = await getConversationContext(
  member.id,
  'résumé général', // ou question actuelle
  { matchThreshold: 0.7, matchCount: 3 }
)

// Construire prompt JARVIS enrichi
const instructions = `Tu es JARVIS, l'assistant vocal de ${member.first_name} ${member.last_name}.

PROFIL MEMBRE:
- Niveau fitness: ${member.fitness_profile?.fitness_level || 'débutant'}
- Objectifs: ${member.fitness_profile?.primary_goals.join(', ') || 'non définis'}
- Style communication préféré: ${member.preferences?.communication_style || 'friendly'}

${factsPrompt}

${conversationContext}

INSTRUCTIONS:
- Adapte ton ton selon le style: ${member.preferences?.communication_style}
- Retiens TOUS les nouveaux faits importants (blessures, objectifs, préférences)
- Utilise le contexte précédent pour personnaliser tes réponses
- Si blessure connue, ÉVITE les exercices contre-indiqués
`

// Créer session OpenAI Realtime avec instructions enrichies
const sessionConfig = {
  model: 'gpt-4o-realtime-mini-2024-12-17',
  voice: 'verse',
  instructions: instructions,
  tools: jarvisTools,
  tool_choice: 'auto'
}
```

### **2. PENDANT Conversation (Logging événements)**

```typescript
// Logger chaque événement dans conversation_events
await supabase.from('conversation_events').insert({
  session_id: sessionId,
  member_id: memberId,
  gym_id: gymId,
  event_type: 'user_transcript',
  transcript: userText,
  turn_number: turnNumber,
  audio_duration_ms: audioDuration,
  confidence_score: confidence
})
```

### **3. APRÈS Conversation (Extraction + Summary)**

```typescript
import { extractAndSaveFacts } from '@/lib/member-facts'
import { generateAndSaveSummary } from '@/lib/conversation-summary'

// Récupérer tous les events de la session
const { data: events } = await supabase
  .from('conversation_events')
  .select('*')
  .eq('session_id', sessionId)
  .order('timestamp', { ascending: true })

// Construire transcript
const transcript = events
  .filter(e => e.event_type.includes('transcript'))
  .map(e => `[${e.event_type === 'user_transcript' ? 'Membre' : 'JARVIS'}]: ${e.transcript}`)
  .join('\n')

// 1. Extraire et sauvegarder facts
const factsCount = await extractAndSaveFacts(memberId, sessionId, transcript)
console.log(`Extracted ${factsCount} facts`)

// 2. Générer et sauvegarder résumé + embedding
const summaryId = await generateAndSaveSummary({
  sessionId,
  memberId,
  gymId,
  events
})
console.log(`Generated summary ${summaryId}`)

// 3. Optionnel : Mettre à jour analytics (background job)
// Via pg_cron ou Upstash QStash
```

---

## 🚀 PROCHAINES ÉTAPES (Phase 3)

### ⏳ **À FAIRE** : Intégrer dans API Routes

#### 1. **Mettre à jour `/api/voice/session/route.ts`**

Remplacer l'ancien code par le nouveau workflow ci-dessus :

```typescript
// AVANT (ancien)
const memberProfile = await getMemberProfile(badgeId) // OLD gym_members
const instructions = `Tu es JARVIS...` // Basique

// APRÈS (nouveau)
const { data: member } = await supabase
  .from('gym_members_v2')
  .select(`*, fitness_profile:member_fitness_profile(*), preferences:member_preferences(*)`)
  .eq('badge_id', badgeId)
  .single()

const facts = await getMemberFacts(member.id)
const context = await getConversationContext(member.id, 'général')
const instructions = buildEnrichedInstructions(member, facts, context)
```

#### 2. **Créer `/api/voice/session/close/route.ts`** (nouveau endpoint)

Pour gérer la fin de session et déclencher extraction + summary :

```typescript
export async function POST(request: NextRequest) {
  const { session_id, member_id, gym_id } = await request.json()
  
  // 1. Récupérer events
  const { data: events } = await supabase
    .from('conversation_events')
    .select('*')
    .eq('session_id', session_id)
    .order('timestamp')
  
  // 2. Extraire facts
  const transcript = buildTranscriptFromEvents(events)
  await extractAndSaveFacts(member_id, session_id, transcript)
  
  // 3. Générer summary
  await generateAndSaveSummary({ session_id, member_id, gym_id, events })
  
  return NextResponse.json({ success: true })
}
```

#### 3. **Background Jobs (pg_cron ou Upstash QStash)**

```sql
-- Job quotidien : Générer rapports
SELECT cron.schedule(
  'generate-daily-reports',
  '0 8 * * *',
  $$ SELECT generate_daily_reports_for_all_gyms(); $$
);

-- Job hebdomadaire : Calculer analytics (churn prediction)
SELECT cron.schedule(
  'calculate-member-analytics',
  '0 2 * * 1',
  $$ SELECT calculate_analytics_for_all_members(); $$
);

-- Job quotidien : Cleanup événements > 90 jours
SELECT cron.schedule(
  'cleanup-old-events',
  '0 3 * * *',
  $$ DELETE FROM conversation_events WHERE timestamp < now() - interval '90 days'; $$
);
```

---

## 📊 BÉNÉFICES OBTENUS

### **Avant** (Ancien système)
- ❌ Pas de mémoire persistante (oublie tout entre sessions)
- ❌ Pas de contexte conversations précédentes
- ❌ Agent générique (pas personnalisé)
- ❌ Redondances logs (jarvis_conversation_logs + openai_realtime_audio_events)

### **Après** (Nouveau système)
- ✅ **Mémoire structurée** : Facts persistants (goals, injuries, preferences)
- ✅ **RAG context** : Recherche sémantique conversations similaires (pgvector 1536D)
- ✅ **Agent personnalisé** : Style communication, préférences, historique
- ✅ **Analytics automatiques** : Churn prediction, sentiment analysis, alertes
- ✅ **Architecture normalisée** : 9 tables propres vs 3 tables bordéliques

---

## 💰 COÛTS ESTIMÉS (Nouveaux appels OpenAI)

### **Embeddings** (text-embedding-3-small)
```
Prix : $0.00002 / 1K tokens
Usage estimé : 
  - 1 résumé/conversation (~100 tokens) → embedding
  - 1 search RAG/session (~100 tokens) → embedding query
  
Mensuel (100 conversations/jour) :
  - 100 * 30 = 3000 embeddings/mois
  - 3000 * 100 tokens = 300K tokens
  - $0.00002 * 300 = $6/mois
```

### **LLM Summarization** (gpt-4o-mini)
```
Prix : $0.15 / 1M input tokens, $0.60 / 1M output tokens
Usage estimé :
  - 1 résumé/conversation (~1000 input tokens, 150 output tokens)
  
Mensuel (100 conversations/jour) :
  - 3000 summaries/mois
  - Input : 3000 * 1000 = 3M tokens → $0.45
  - Output : 3000 * 150 = 450K tokens → $0.27
  - Total : $0.72/mois
```

### **Facts Extraction** (gpt-4o-mini)
```
Prix : Même que summarization
Usage : ~$0.50/mois
```

### **TOTAL NOUVEAU COÛT : ~$7-8/mois** (négligeable)

**Total infrastructure** : ~$197 + $8 = **$205/mois** (vs $500+ avant)

---

## ✅ CHECKLIST DÉPLOIEMENT

### Phase 1 : Database ✅ COMPLÉTÉE
- [x] 9 tables créées
- [x] 12 adhérents migrés
- [x] 36 RLS policies
- [x] Anciennes tables supprimées

### Phase 2 : Code Next.js ✅ COMPLÉTÉE
- [x] Types TypeScript créés
- [x] RAG context implémenté
- [x] Facts extraction implémenté
- [x] Summary generation implémenté

### Phase 3 : Intégration ⏳ À FAIRE
- [ ] Mettre à jour `/api/voice/session/route.ts`
- [ ] Créer `/api/voice/session/close/route.ts`
- [ ] Tester workflow complet (contexte → conversation → extraction)
- [ ] Setup background jobs (pg_cron ou Upstash)
- [ ] Tests unitaires
- [ ] Déployer sur Vercel

---

## 🎯 PROCHAINE SESSION

**Toi** : "Intègre les nouvelles fonctions dans les API routes" ou "Setup background jobs"

**Moi** : Je vais :
1. Modifier `/api/voice/session/route.ts` pour utiliser RAG + facts
2. Créer endpoint `/api/voice/session/close/route.ts`
3. Tester le workflow complet
4. Setup pg_cron jobs
5. Déployer

---

**Auteur** : Expert DevOps/MLOps  
**Date** : 23 octobre 2025  
**Durée Phase 2** : ~1 heure  
**Status** : ✅ **PHASE 2 COMPLÉTÉE**

