# 🗄️ BASE DE DONNÉES JARVIS - GUIDE COMPLET

**Dernière mise à jour** : 23 octobre 2025  
**Statut** : ✅ **REFONTE COMPLÉTÉE** (Phase 1) | ⏳ **Code Next.js à adapter** (Phase 2)

---

## 📊 ARCHITECTURE ACTUELLE

### **9 Tables Opérationnelles**

```
┌─ DATA FOUNDATION (3 tables)
│  ✅ gym_members_v2          12 rows   (profils core - 15 colonnes)
│  ✅ member_fitness_profile  12 rows   (module fitness optionnel)
│  ✅ member_preferences      12 rows   (préférences JARVIS)
│
├─ MEMORY SYSTEM (3 tables)
│  ✅ member_facts            0 rows    (faits persistants structurés)
│  ✅ conversation_summaries  0 rows    (résumés + embeddings 1536D RAG)
│  ✅ conversation_events     0 rows    (événements bruts temps réel)
│
└─ ANALYTICS (3 tables)
   ✅ member_analytics        0 rows    (métriques + churn prediction)
   ✅ manager_alerts          0 rows    (alertes intelligentes)
   ✅ insights_reports        0 rows    (rapports automatiques)
```

---

## 🔄 CHANGEMENTS vs ANCIEN SYSTÈME

### ❌ **Supprimé** (3 tables)
- `gym_members` (57 colonnes bordéliques) → remplacé par `gym_members_v2` (15 colonnes)
- `jarvis_conversation_logs` → remplacé par `conversation_events` + `conversation_summaries`
- `openai_realtime_audio_events` → remplacé par `conversation_events`

### ✅ **Améliorations**
- **-73% colonnes** : 57 → 15 colonnes core
- **Normalisation** : Tables modulaires (fitness, preferences, facts, analytics séparés)
- **Sécurité** : 36 RLS policies strictes (isolation gym_id)
- **RAG** : pgvector embeddings 1536D pour contexte conversations
- **Analytics** : Churn prediction, sentiment analysis, alertes automatiques

---

## 📐 SCHÉMAS SQL

### Table: `gym_members_v2` (Core Profile)
```sql
CREATE TABLE gym_members_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Identité
  badge_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  profile_photo_url TEXT,
  
  -- Abonnement
  membership_type TEXT DEFAULT 'standard',
  member_since DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_expires DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: gym_manager + gym_staff peuvent SELECT/INSERT/UPDATE leurs membres
-- RLS: service_role peut tout faire
```

### Table: `conversation_summaries` (RAG System)
```sql
CREATE TABLE conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES gym_members_v2(id),
  gym_id UUID NOT NULL REFERENCES gyms(id),
  
  summary_text TEXT NOT NULL,
  key_topics TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  
  -- RAG: pgvector embeddings 1536D (OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  session_duration_seconds INTEGER,
  turn_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pgvector IVFFlat pour RAG search
CREATE INDEX idx_conv_summaries_embedding 
ON conversation_summaries 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Fonction RAG search
CREATE FUNCTION match_conversation_summaries(
  query_embedding vector(1536),
  filter_member_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
) RETURNS TABLE (...);
```

### Table: `member_facts` (Structured Memory)
```sql
CREATE TABLE member_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES gym_members_v2(id),
  
  category TEXT NOT NULL CHECK (category IN ('goal', 'injury', 'preference', 'progress', 'concern')),
  fact_key TEXT NOT NULL,
  fact_value JSONB NOT NULL,
  
  confidence NUMERIC(3,2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  source_session_id TEXT,
  source_quote TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  UNIQUE(member_id, category, fact_key)
);
```

**Exemple fact** :
```json
{
  "member_id": "uuid",
  "category": "injury",
  "fact_key": "knee_pain",
  "fact_value": {
    "location": "right_knee",
    "severity": "moderate",
    "exercises_to_avoid": ["squats", "lunges"]
  },
  "confidence": 0.95,
  "source_quote": "J'ai mal au genou droit depuis janvier"
}
```

---

## 🔐 SÉCURITÉ (RLS Policies)

### **36 RLS Policies actives**

**Règles générales** :
- ✅ `super_admin` → Accès total
- ✅ `gym_manager` + `gym_staff` → Accès leurs gyms via `gym_access` array
- ✅ `service_role` (auth.uid() IS NULL) → Accès système pour analytics/events automatiques

**Exemple policy** :
```sql
-- gym_members_v2: SELECT
CREATE POLICY "Gym managers can view members" ON gym_members_v2
FOR SELECT USING (
  gym_id IN (
    SELECT gym_id FROM UNNEST(
      (SELECT gym_access FROM users WHERE id = auth.uid())
    ) AS gym_id
  )
);
```

---

## 💻 UTILISATION DANS NEXT.JS

### 1. **Types TypeScript**

**Fichier** : `src/types/member.ts`
```typescript
export interface GymMemberCore {
  id: string
  gym_id: string
  badge_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  profile_photo_url: string | null
  membership_type: string
  member_since: string
  membership_expires: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MemberFitnessProfile {
  member_id: string
  height_cm: number | null
  current_weight_kg: number | null
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
  primary_goals: string[]
  // ...
}

export interface GymMemberComplete extends GymMemberCore {
  fitness_profile?: MemberFitnessProfile
  preferences?: MemberPreferences
}
```

### 2. **Queries Supabase**

```typescript
// Récupérer membre avec modules
const { data: member } = await supabase
  .from('gym_members_v2')
  .select(`
    *,
    fitness_profile:member_fitness_profile(*),
    preferences:member_preferences(*)
  `)
  .eq('id', memberId)
  .single()

// Recherche RAG conversations similaires
const { data: context } = await supabase.rpc('match_conversation_summaries', {
  query_embedding: embedding,
  filter_member_id: memberId,
  match_threshold: 0.7,
  match_count: 3
})
```

### 3. **Implémenter RAG Context**

**Fichier** : `src/lib/rag-context.ts`
```typescript
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

export async function getConversationContext(
  memberId: string,
  currentQuestion: string
): Promise<string> {
  // 1. Générer embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: currentQuestion
  })
  
  // 2. Rechercher conversations similaires
  const { data: similarConvs } = await supabase.rpc(
    'match_conversation_summaries',
    {
      query_embedding: embeddingResponse.data[0].embedding,
      filter_member_id: memberId,
      match_threshold: 0.7,
      match_count: 3
    }
  )
  
  // 3. Formatter contexte
  return similarConvs
    .map(c => `[${c.created_at}] ${c.summary_text}`)
    .join('\n')
}
```

### 4. **Extraire Facts Automatiquement**

**Fichier** : `src/lib/member-facts.ts`
```typescript
export async function extractFactsFromConversation(
  memberId: string,
  sessionId: string,
  transcript: string
): Promise<void> {
  // 1. LLM extrait facts
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: `Extrait faits importants (goals, injuries, preferences, progress, concerns).
JSON: { "facts": [{"category": "goal", "fact_key": "...", "fact_value": {...}, "confidence": 0.8}] }`
    }, {
      role: 'user',
      content: transcript
    }],
    response_format: { type: 'json_object' }
  })
  
  // 2. Sauvegarder dans BDD
  const { facts } = JSON.parse(completion.choices[0].message.content)
  for (const fact of facts) {
    await supabase.from('member_facts').upsert({
      member_id: memberId,
      category: fact.category,
      fact_key: fact.fact_key,
      fact_value: fact.fact_value,
      confidence: fact.confidence,
      source_session_id: sessionId,
      is_active: true
    }, { onConflict: 'member_id,category,fact_key' })
  }
}
```

---

## 📦 MIGRATIONS SUPABASE

**6 migrations appliquées** :
1. `20251023000001_create_core_tables.sql` → gym_members_v2 + fitness + preferences
2. `20251023000002_create_memory_tables_fixed.sql` → facts + summaries + events
3. `20251023000003_create_analytics_tables.sql` → analytics + alerts + reports
4. `20251023000004_migrate_existing_gym_members_data_fixed.sql` → Migration 12 membres
5. `20251023000005_setup_complete_rls_policies_fixed.sql` → 36 RLS policies
6. `20251023000006_cleanup_old_tables_safe.sql` → Suppression anciennes tables

**Commande validation** :
```bash
npm run supabase:migration list
npm run supabase:types  # Générer types TypeScript
```

---

## 🚀 PROCHAINES ÉTAPES (TODO)

### ✅ Phase 1 : Database (COMPLÉTÉE)
- [x] Concevoir nouveau schéma normalisé
- [x] Créer migrations SQL
- [x] Migrer données existantes (12 adhérents)
- [x] Setup RLS policies (36 policies)
- [x] Supprimer anciennes tables
- [x] Tests validation

### ⏳ Phase 2 : Code Next.js (EN COURS)
- [ ] Mettre à jour types TypeScript (`src/types/member.ts`)
- [ ] Migrer API routes vers `gym_members_v2`
- [ ] Implémenter RAG context (`src/lib/rag-context.ts`)
- [ ] Implémenter facts extraction (`src/lib/member-facts.ts`)
- [ ] Implémenter summary generation (`src/lib/conversation-summary.ts`)
- [ ] Tests unitaires

### ⏳ Phase 3 : Background Jobs
- [ ] Setup pg_cron (daily reports, analytics, cleanup)
- [ ] OU Upstash QStash (alternative robuste)
- [ ] Monitoring Sentry

---

## 💰 COÛTS ESTIMÉS (MENSUEL)

```
Supabase Pro      : ~$25/mois  (pgvector + pg_cron)
OpenAI API        : ~$150/mois (realtime-mini + embeddings + analytics)
Upstash QStash    : ~$10/mois  (optionnel - background jobs)
Sentry            : ~$12/mois  (monitoring)
─────────────────────────────────────────────
TOTAL             : ~$197/mois (vs $500+ avant)
```

---

## 📚 RESSOURCES

### Documentation
- [DATABASE_REFONTE_RECAP.md](./DATABASE_REFONTE_RECAP.md) - Détails complets architecture (1028 lignes)
- [MIGRATION_COMPLETE_SUMMARY.md](./MIGRATION_COMPLETE_SUMMARY.md) - Résumé migrations appliquées

### Migrations SQL
- `supabase/migrations/20251023000001-6_*.sql` - Toutes les migrations appliquées

### Code exemples
- Voir sections ci-dessus pour RAG, facts extraction, types TypeScript

---

## 🔧 COMMANDES UTILES

```bash
# Générer types TypeScript depuis Supabase
npm run supabase:types

# Lister migrations appliquées
npm run supabase:migration list

# Rollback dernière migration (SI BESOIN)
npm run supabase:migration down

# Tests API routes
npm run test:api

# Déploiement production
vercel --prod
```

---

**Auteur** : Expert DevOps/MLOps  
**Date** : 23 octobre 2025  
**Status** : ✅ Phase 1 complète | ⏳ Phase 2 en cours

