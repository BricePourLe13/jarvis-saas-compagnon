# 🤝 GUIDE DE CONTRIBUTION - JARVIS SaaS

**Version :** 1.0  
**Date :** 25 octobre 2025  
**Public :** Équipe dev interne

---

## 📋 AVANT DE COMMENCER

### Prérequis
- ✅ Lire **[agent.md](./agent.md)** (règles & principes projet)
- ✅ Lire **[PLAN_ARCHITECTURE_ENTREPRISE.md](./PLAN_ARCHITECTURE_ENTREPRISE.md)** (architecture cible)
- ✅ Lire **[ROADMAP_REFONTE.md](./ROADMAP_REFONTE.md)** (plan d'action phases)
- ✅ Accès Supabase, Vercel, GitHub
- ✅ Node.js 18+, npm, git

---

## 🔄 WORKFLOW DÉVELOPPEMENT

### 1. Récupérer le projet
```bash
# Clone
git clone https://github.com/jarvis-group/jarvis-saas-compagnon.git
cd jarvis-saas-compagnon

# Install dépendances
npm install

# Setup env vars
cp .env.example .env.local
# Éditer .env.local avec credentials Supabase + OpenAI

# Run migrations Supabase
# Via Supabase Dashboard > SQL Editor > Executer migrations dans supabase/migrations/

# Dev server
npm run dev
```

### 2. Créer une nouvelle feature
```bash
# Créer branch depuis main
git checkout main
git pull origin main
git checkout -b feature/nom-feature

# Exemple de noms de branches:
# feature/table-kiosks
# feature/edge-function-process-conversation
# fix/dashboard-loading-bug
# refactor/clean-api-routes
```

### 3. Coder la feature
```bash
1. Consulter agent.md (règles & principes)
2. Consulter ROADMAP si feature planifiée
3. Créer migration DB si nécessaire (supabase/migrations/)
4. Coder avec TypeScript strict (pas de any)
5. Ajouter error handling + logs Sentry
6. Tester manuellement (happy path + edge cases)
7. Linter: npm run lint (zéro erreur)
```

### 4. Commiter
```bash
# Conventions commits (Conventional Commits)
git add .
git commit -m "feat: ajouter table kiosks + migration"

# Types de commits:
# feat:     Nouvelle feature
# fix:      Correction bug
# refactor: Refactoring (pas de changement fonctionnel)
# docs:     Documentation uniquement
# test:     Ajout/modification tests
# chore:    Tâches maintenance (deps, config, build)
# perf:     Optimisation performance
# style:    Formatage code (pas de changement logique)
```

### 5. Push & Pull Request
```bash
# Push branch
git push origin feature/nom-feature

# Créer Pull Request sur GitHub
# Titre: feat: Ajouter table kiosks
# Description:
# - Créer migration 20251027_create_kiosks.sql
# - Ajouter RLS policies
# - Tester migration sur dev Supabase
# - Closes #XX (si lié à une issue)

# Review obligatoire avant merge
```

---

## 📐 CONVENTIONS CODE

### Naming
```typescript
// Fichiers
kebab-case.tsx           // Fichiers généraux
PascalCase.tsx           // Composants React
route.ts                 // API Routes Next.js

// Variables & fonctions
const userName = "Brice"           // camelCase
function calculateChurn() {}       // camelCase

// Constantes
const MAX_RETRIES = 3              // UPPER_SNAKE_CASE
const API_BASE_URL = "https://..."

// Types & Interfaces
interface UserProfile {}           // PascalCase
type SessionState = "active" | "closed"

// Tables database
users, gyms, kiosks                // snake_case
gym_members_v2                     // snake_case
```

### Structure fichiers
```
src/
├── app/
│   ├── [feature]/page.tsx         # Pages
│   └── api/[domain]/[action]/route.ts  # API Routes
│
├── components/
│   └── [domain]/ComponentName.tsx  # Composants
│
├── lib/
│   └── feature-name.ts            # Utilities
│
├── hooks/
│   └── useFeatureName.ts          # Custom hooks
│
└── types/
    └── feature.ts                 # Types TypeScript
```

### TypeScript
```typescript
// ✅ BON: Types stricts
interface User {
  id: string
  email: string
  role: 'super_admin' | 'gym_manager'
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ MAUVAIS: any interdit (sauf cas extrême)
function getUser(id: any): any {
  // ...
}

// ✅ BON: Error handling
try {
  const user = await getUser(id)
  if (!user) throw new Error('User not found')
  return user
} catch (error) {
  logger.error('Failed to get user', { error, userId: id })
  throw error
}

// ❌ MAUVAIS: Ignorer erreurs
const user = await getUser(id)
return user
```

### Commentaires
```typescript
// ✅ BON: WHY, pas WHAT
// Calculate churn risk using weighted factors (last visit, sentiment, engagement)
// Formula: 0.4 * visitFactor + 0.3 * sentimentFactor + 0.2 * engagementFactor
const churnRisk = calculateChurnRisk(member)

// ❌ MAUVAIS: Répète le code
// Get the user
const user = await getUser(id)
```

---

## 🗄️ CONVENTIONS DATABASE

### Migrations
```bash
# Toujours créer migration pour changements DB
# Format: supabase/migrations/YYYYMMDD_description.sql

# Exemple:
20251027_create_kiosks_table.sql
20251028_add_embedding_column.sql
20251029_alter_member_analytics.sql

# Contenu migration:
-- Description claire en haut
-- CREATE TABLE, ALTER TABLE, CREATE INDEX
-- RLS Policies
-- Triggers si nécessaire
```

### RLS Policies
```sql
-- TOUJOURS activer RLS
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;

-- Pattern policies:
-- 1. Super admin voit tout
CREATE POLICY "super_admin_all" ON kiosks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 2. Gym manager voit ses données
CREATE POLICY "gym_manager_own_data" ON kiosks
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())
  );
```

### Indexes
```sql
-- Sur toutes FK
CREATE INDEX idx_kiosks_gym ON kiosks(gym_id);

-- Sur colonnes de filtrage fréquent
CREATE INDEX idx_sessions_member ON sessions(member_id);
CREATE INDEX idx_sessions_created ON sessions(created_at);

-- Partial indexes pour filtres courants
CREATE INDEX idx_members_active ON members(gym_id) WHERE is_active = true;
```

---

## 🧪 TESTS

### Tests manuels (obligatoire)
```bash
# Avant chaque commit:
1. Tester happy path (cas nominal)
2. Tester edge cases (null, undefined, empty)
3. Tester error cases (API down, timeout)
4. Tester sur navigateurs (Chrome, Firefox, Safari)
```

### Tests E2E (pour features critiques)
```bash
# Playwright tests
npm run test:e2e

# Créer test si:
- Feature critique (auth, payment, data loss risk)
- Bug critique fixé (regression test)
- User flow complexe (onboarding, checkout)

# Fichier: tests/e2e/feature-name.spec.ts
```

---

## 🚫 CE QU'IL NE FAUT JAMAIS FAIRE

### Code
1. ❌ Commiter code non testé
2. ❌ Ignorer erreurs linter/TypeScript
3. ❌ Utiliser `any` (sauf cas extrême documenté)
4. ❌ Hardcoder secrets/API keys
5. ❌ Créer backups dans le code (use git)
6. ❌ Commenter code au lieu de le supprimer
7. ❌ Dupliquer logique (DRY principle)

### Database
1. ❌ Modifier schema sans migration
2. ❌ Désactiver RLS sur table
3. ❌ Oublier indexes sur FK
4. ❌ Modifier prod DB manuellement

### Git
1. ❌ Commit directement sur main
2. ❌ Force push (sauf cas exceptionnel validé)
3. ❌ Gros commits (>500 lignes si possible découper)
4. ❌ Messages commits vagues ("fix", "update")

---

## 🔍 CODE REVIEW

### Checklist reviewer
- [ ] Code suit conventions (naming, structure)
- [ ] TypeScript strict (pas de any)
- [ ] Error handling présent
- [ ] Tests manuels effectués (proof en PR)
- [ ] Migration DB si nécessaire
- [ ] RLS policies si nouvelle table
- [ ] Documentation mise à jour si changement architectural
- [ ] Pas de console.log oubliés
- [ ] Pas de TODOs non résolus

### Feedback
- ✅ Constructif et pédagogique
- ✅ Suggérer alternatives avec explications
- ✅ Pointer best practices manquées
- ❌ Pas de critique personnelle

---

## 🐛 DEBUG

### Logs
```typescript
// Production: Sentry automatique
// Dev: Console + Sentry

import { logger } from '@/lib/production-logger'

// ✅ BON: Logs structurés
logger.info('User logged in', { userId, timestamp })
logger.error('Failed to create session', { error, sessionId })

// ❌ MAUVAIS: console.log non structuré
console.log('User logged in')
```

### Supabase
```bash
# Voir logs en temps réel
Supabase Dashboard > Logs > API / Database / Auth

# Query manuelle (dev uniquement)
Supabase Dashboard > SQL Editor

# Voir RLS policies actives
SELECT * FROM pg_policies WHERE tablename = 'kiosks';
```

### Vercel
```bash
# Voir logs functions
Vercel Dashboard > Project > Functions > Logs

# Voir build logs
Vercel Dashboard > Project > Deployments > Select deployment > Build Logs
```

---

## 📚 RESSOURCES

### Documentation projet
1. [agent.md](./agent.md) - Instructions LLM (principes, règles)
2. [PLAN_ARCHITECTURE_ENTREPRISE.md](./PLAN_ARCHITECTURE_ENTREPRISE.md) - Architecture technique
3. [ROADMAP_REFONTE.md](./ROADMAP_REFONTE.md) - Plan phases

### Documentation externe
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🆘 BESOIN D'AIDE ?

### Questions techniques
1. Consulter agent.md (règles & principes)
2. Consulter docs projet
3. Rechercher dans issues GitHub
4. Demander en équipe (Slack #dev)

### Bugs bloquants
1. Vérifier logs (Sentry, Supabase, Vercel)
2. Reproduire localement
3. Créer issue GitHub avec reproduction steps
4. Notifier équipe si critique

---

## ✅ CHECKLIST AVANT MERGE

- [ ] Code testé manuellement
- [ ] Linter passe (npm run lint)
- [ ] TypeScript compile sans erreur
- [ ] Migration DB testée (si applicable)
- [ ] Documentation mise à jour (si changement architectural)
- [ ] PR review approuvée
- [ ] CI/CD passe (si configuré)
- [ ] Pas de TODO non résolus
- [ ] Pas de console.log oubliés

---

**Questions ? Consulte [agent.md](./agent.md) ou demande en équipe ! 🚀**


