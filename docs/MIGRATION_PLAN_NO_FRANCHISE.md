# 🔄 PLAN DE MIGRATION : SUPPRESSION FRANCHISES

**Date :** 9 Novembre 2025  
**Objectif :** Simplifier l'architecture MVP en passant de 3 rôles à 2 rôles  
**Durée estimée :** 6-8 heures (réparties sur 2 jours)

---

## 📊 **AUDIT COMPLET**

### **67 fichiers sources mentionnent "franchise"**
### **4 migrations SQL mentionnent "franchise"**

---

## 🎯 **STRATÉGIE GLOBALE**

### **Philosophie**
- ✅ **Migration progressive** (pas de Big Bang)
- ✅ **Backward compatibility** pendant 1 mois
- ✅ **Tests à chaque étape**
- ✅ **Rollback possible** à tout moment

### **3 Phases principales**
1. **Phase 1 : Préparation** (1-2h) - Analyser + Backup
2. **Phase 2 : Migration Code** (3-4h) - Modifier fichiers critiques
3. **Phase 3 : Migration BDD** (2h) - Schema + Data migration

---

## 📋 **PHASE 1 : PRÉPARATION & ANALYSE (1-2h)**

### **1.1 Catégorisation des 67 fichiers**

#### **🔴 CRITIQUES - À modifier avec précaution**
```
src/contexts/GymContext.tsx                     ← Context principal
src/middleware.ts                               ← Auth & routing
src/components/dashboard/DashboardShell.tsx     ← Navigation
src/lib/auth-helpers.ts                         ← Helpers auth
src/types/database.ts                           ← Types DB
```

#### **🟡 IMPORTANTS - À adapter**
```
src/components/dashboard/ContextSwitcher.tsx
src/components/auth/AuthGuard.tsx
src/app/login/page.tsx
src/lib/secure-queries.ts
src/lib/validation.ts
```

#### **🟢 PAGES ADMIN - À supprimer ou déplacer**
```
src/app/dashboard/admin/franchises/*            ← Supprimer
src/app/api/dashboard/admin/franchises/*        ← Supprimer
src/app/api/admin/franchises/*                  ← Supprimer
src/components/admin/FranchiseCreateFormSimple.tsx ← Supprimer
```

#### **🔵 RÉFÉRENCES - À nettoyer**
```
src/lib/jarvis-expert-functions.ts              ← Docs/comments
src/lib/voice/contexts/vitrine-config.ts        ← Comments
src/app/franchise/page.tsx                      ← Supprimer
src/types/franchise.ts                          ← Supprimer
```

### **1.2 Analyse BDD (CRITIQUE)**

```sql
-- Tables affectées
franchises                    ← À supprimer ?
gyms (colonne franchise_id)   ← À modifier
gym_managers                  ← OK (pas de ref franchise)
users/profiles                ← À vérifier (role franchise_owner)

-- RLS Policies affectées
Toutes policies mentionnant "franchise_owner"
```

### **1.3 Backup complet**

```bash
# 1. Backup code (Git)
git checkout -b backup-before-no-franchise
git push origin backup-before-no-franchise

# 2. Backup BDD (Supabase)
# Via Supabase Dashboard → Database → Backups
# Créer snapshot manuel avant migration

# 3. Export data franchises (si besoin restauration)
-- Exporter toutes les franchises existantes
-- Exporter mappings gym → franchise
```

---

## 🔧 **PHASE 2 : MIGRATION CODE (3-4h)**

### **Jour 1 Matin : Fichiers critiques (2h)**

#### **Étape 2.1 : Types (30min)**

**`src/types/database.ts`**
```typescript
// AVANT
export type UserRole = 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'

// APRÈS
export type UserRole = 'super_admin' | 'gym_manager'

// Supprimer type Franchise
export interface Franchise { ... } ← SUPPRIMER

// Modifier Gym
export interface Gym {
  id: string
  name: string
  franchise_id?: string  ← SUPPRIMER cette ligne
  address?: string
  // ...
}
```

**`src/types/franchise.ts`**
```bash
# Supprimer complètement ce fichier
rm src/types/franchise.ts
```

#### **Étape 2.2 : GymContext (45min)**

**`src/contexts/GymContext.tsx`**
```typescript
// Analyser ligne par ligne
// Retirer toute logique "franchise_owner"
// Simplifier à 2 rôles uniquement

interface GymContextType {
  currentGym: Gym | null
  availableGyms: Gym[]
  // franchiseId?: string  ← SUPPRIMER
  // isMultiFranchise: boolean ← SUPPRIMER
  userRole: 'super_admin' | 'gym_manager'
  // ...
}

// Retirer queries franchises
// Simplifier loadAvailableGyms()
```

#### **Étape 2.3 : Middleware (30min)**

**`src/middleware.ts`**
```typescript
// Retirer checks franchise_owner
// Simplifier à 2 rôles

export async function middleware(request: NextRequest) {
  const { role } = await getCurrentUser()
  
  // AVANT
  if (role === 'franchise_owner' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/franchise', request.url))
  }
  
  // APRÈS (supprimer ce check)
  // Seuls super_admin et gym_manager existent
  
  if (role !== 'super_admin' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

#### **Étape 2.4 : DashboardShell (15min)**

**`src/components/dashboard/DashboardShell.tsx`**
```typescript
// Supprimer navigationSections pour franchise_owner
// Garder uniquement :
// - superAdminNav
// - gymManagerNav

const navigationSections = useMemo(() => {
  // AVANT
  switch (userRole) {
    case 'super_admin': return superAdminNav
    case 'franchise_owner': return franchiseOwnerNav ← SUPPRIMER
    case 'gym_manager': return gymManagerNav
  }
  
  // APRÈS
  return userRole === 'super_admin' ? superAdminNav : gymManagerNav
}, [userRole])
```

### **Jour 1 Après-midi : Routes & API (2h)**

#### **Étape 2.5 : Supprimer routes franchises**

```bash
# Pages
rm -rf src/app/franchise/
rm -rf src/app/dashboard/admin/franchises/
rm -rf src/app/api/dashboard/admin/franchises/
rm -rf src/app/api/admin/franchises/

# Composants
rm src/components/admin/FranchiseCreateFormSimple.tsx

# Types
rm src/types/franchise.ts
```

#### **Étape 2.6 : Nettoyer API routes**

**Fichiers à modifier :**
```
src/app/api/dashboard/members/route.ts
src/app/api/dashboard/sessions/route.ts
src/app/api/dashboard/analytics/route.ts
src/app/api/admin/gyms/route.ts
src/app/api/admin/users/route.ts
```

**Pour chaque fichier :**
```typescript
// 1. Retirer imports franchise
import { Franchise } from '@/types/franchise' ← SUPPRIMER

// 2. Retirer checks franchise_owner
if (role === 'franchise_owner') { ... } ← SUPPRIMER

// 3. Simplifier queries
// AVANT
if (role === 'franchise_owner') {
  query = query.eq('franchise_id', userFranchiseId)
}

// APRÈS (supprimer ce block)
```

#### **Étape 2.7 : Nettoyer composants admin**

**Fichiers à modifier :**
```
src/components/admin/GymCreateFormSimple.tsx     (retirer select franchise)
src/components/admin/EditUserModal.tsx           (retirer role franchise_owner)
src/components/admin/AccessManagementModal.tsx   (retirer ref franchise)
```

---

## 🗄️ **PHASE 3 : MIGRATION BDD (2h)**

### **Jour 2 Matin : Schema Migration**

#### **Étape 3.1 : Analyser schema actuel**

```sql
-- 1. Lister toutes les contraintes
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE conname LIKE '%franchise%';

-- 2. Lister toutes les policies
SELECT 
  schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE '%franchise%';

-- 3. Compter data existante
SELECT COUNT(*) FROM franchises;
SELECT COUNT(*) FROM gyms WHERE franchise_id IS NOT NULL;
```

#### **Étape 3.2 : Migration data AVANT suppression**

```sql
-- Si des franchises existent en prod, migrer data vers gyms
-- Exemple: Créer attribut "group_name" dans gyms pour préserver info

-- Ajouter colonne temporaire
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS legacy_franchise_name TEXT;

-- Copier noms franchises
UPDATE gyms g
SET legacy_franchise_name = f.name
FROM franchises f
WHERE g.franchise_id = f.id;

-- Vérifier
SELECT id, name, legacy_franchise_name FROM gyms LIMIT 10;
```

#### **Étape 3.3 : Créer migration SQL**

**`supabase/migrations/20251110000001_remove_franchises.sql`**
```sql
-- ============================================
-- MIGRATION : Suppression système franchises
-- Date : 10 Novembre 2025
-- ============================================

-- 1. BACKUP data (dans colonne temporaire si besoin)
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS legacy_franchise_name TEXT;
UPDATE gyms g
SET legacy_franchise_name = f.name
FROM franchises f
WHERE g.franchise_id = f.id;

-- 2. SUPPRIMER foreign key constraint
ALTER TABLE gyms DROP CONSTRAINT IF EXISTS gyms_franchise_id_fkey;

-- 3. SUPPRIMER colonne franchise_id
ALTER TABLE gyms DROP COLUMN IF EXISTS franchise_id;

-- 4. SUPPRIMER policies franchise
DROP POLICY IF EXISTS "Franchise owners can view their franchises" ON franchises;
DROP POLICY IF EXISTS "Franchise owners can view their gyms" ON gyms;
-- ... toutes les autres policies franchise

-- 5. METTRE À JOUR policies existantes
-- Retirer checks franchise_owner de toutes policies

-- 6. SUPPRIMER table franchises
DROP TABLE IF EXISTS franchises CASCADE;

-- 7. NETTOYER role dans profiles
UPDATE profiles SET role = 'gym_manager' WHERE role = 'franchise_owner';

-- 8. VÉRIFICATIONS
DO $$
BEGIN
  -- Vérifier qu'aucune ref franchise reste
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gyms' AND column_name = 'franchise_id'
  ) THEN
    RAISE EXCEPTION 'Column franchise_id still exists!';
  END IF;
  
  -- Vérifier qu'aucun role franchise_owner reste
  IF EXISTS (SELECT 1 FROM profiles WHERE role = 'franchise_owner') THEN
    RAISE EXCEPTION 'franchise_owner role still exists!';
  END IF;
  
  RAISE NOTICE 'Migration successful!';
END $$;
```

#### **Étape 3.4 : Tester migration (local)**

```bash
# 1. Appliquer sur BDD locale
supabase db reset

# 2. Vérifier schema
supabase db diff

# 3. Tester application
npm run dev
# Tester login super_admin
# Tester login gym_manager
# Vérifier pas de 500 errors
```

---

## ✅ **PHASE 4 : VALIDATION & TESTS (1-2h)**

### **Tests manuels**

#### **Super Admin**
```
✅ Login super_admin
✅ Dashboard visible
✅ /admin/gyms → Liste salles (sans colonne franchise)
✅ /admin/managers → Liste gérants
✅ Créer nouvelle salle (sans select franchise)
✅ Monitoring fonctionne
✅ Logs fonctionnent
```

#### **Gym Manager**
```
✅ Login gym_manager
✅ Dashboard visible
✅ Navigation (Membres, JARVIS, Analytics)
✅ /dashboard/members → Liste membres SA salle
✅ /dashboard/jarvis/sessions → Sessions
✅ /dashboard/jarvis/tools → Custom tools
✅ Kiosk accessible
✅ Switch gym (si multi-salles)
```

#### **Redirections**
```
✅ /franchise → 404 ou redirect /dashboard
✅ /dashboard/admin/franchises → 404 ou redirect /admin/gyms
✅ Anciennes URLs franchise_owner → redirect
```

### **Tests automatisés**

```bash
# Linter
npm run lint

# Type checking
npm run type-check

# Build
npm run build

# Tests E2E (si disponibles)
npm run test:e2e
```

---

## 🚨 **POINTS D'ATTENTION CRITIQUES**

### **1. Utilisateurs existants avec role franchise_owner**

**Problème :**
```sql
-- Si users en prod ont role = 'franchise_owner'
SELECT COUNT(*) FROM profiles WHERE role = 'franchise_owner';
```

**Solution :**
```sql
-- AVANT suppression, migrer vers gym_manager
UPDATE profiles 
SET role = 'gym_manager' 
WHERE role = 'franchise_owner';

-- Notifier ces users du changement (email)
```

### **2. Salles orphelines (sans franchise_id)**

**Vérifier :**
```sql
SELECT COUNT(*) FROM gyms WHERE franchise_id IS NULL;
-- Doit être > 0 (OK)

SELECT COUNT(*) FROM gyms WHERE franchise_id IS NOT NULL;
-- Si > 0 → Migrer data AVANT suppression
```

### **3. RLS Policies complexes**

**Audit complet :**
```sql
-- Lister TOUTES policies mentionnant franchise
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  definition
FROM pg_policies
WHERE definition LIKE '%franchise%';

-- Pour chaque policy :
-- 1. Analyser impact suppression
-- 2. Créer nouvelle policy sans franchise
-- 3. Tester accès avant/après
```

### **4. Logs & Analytics historiques**

**Conserver data :**
```sql
-- Ne PAS supprimer conversations historiques
-- Garder colonne legacy_franchise_name si besoin analytics
ALTER TABLE gyms ADD COLUMN legacy_franchise_name TEXT;
```

---

## 📝 **CHECKLIST MIGRATION COMPLÈTE**

### **Préparation**
- [ ] Audit 67 fichiers fait
- [ ] Audit 4 migrations SQL fait
- [ ] Backup Git créé (`backup-before-no-franchise`)
- [ ] Backup BDD Supabase créé
- [ ] Export data franchises existantes

### **Code (Phase 2)**
- [ ] `src/types/database.ts` modifié
- [ ] `src/types/franchise.ts` supprimé
- [ ] `src/contexts/GymContext.tsx` simplifié
- [ ] `src/middleware.ts` nettoyé
- [ ] `src/components/dashboard/DashboardShell.tsx` 2 rôles
- [ ] Routes `/franchise/*` supprimées
- [ ] Routes `/admin/franchises/*` supprimées
- [ ] Composants admin nettoyés
- [ ] API routes nettoyées
- [ ] Tous imports franchise retirés

### **BDD (Phase 3)**
- [ ] Migration SQL créée
- [ ] Data franchises migrée (legacy_franchise_name)
- [ ] Foreign keys supprimées
- [ ] Colonne `franchise_id` supprimée de `gyms`
- [ ] Table `franchises` supprimée
- [ ] Policies franchise supprimées
- [ ] Role `franchise_owner` migré → `gym_manager`
- [ ] Migration testée en local

### **Tests (Phase 4)**
- [ ] Login super_admin OK
- [ ] Login gym_manager OK
- [ ] Navigation super_admin OK
- [ ] Navigation gym_manager OK
- [ ] Création salle OK (sans franchise)
- [ ] RLS fonctionne (isolation gyms)
- [ ] Kiosk fonctionne
- [ ] Custom tools fonctionnent
- [ ] Redirections anciennes URLs OK
- [ ] Build production OK
- [ ] Linter 0 errors

### **Production**
- [ ] Communication users (email si franchise_owner)
- [ ] Appliquer migration SQL prod
- [ ] Vérifier 0 errors Sentry
- [ ] Monitorer 24h
- [ ] Documentation MAJ

---

## 🔄 **ROLLBACK PLAN (si problème)**

### **Si migration casse production**

```bash
# 1. Rollback Git
git checkout backup-before-no-franchise
git push origin main --force

# 2. Rollback BDD
# Via Supabase Dashboard → Restore from backup

# 3. Redéployer
vercel --prod

# 4. Vérifier
# Tester login, navigation, fonctionnalités critiques
```

---

## 📊 **TIMELINE DÉTAILLÉE**

### **Jour 1 : Code (4h)**
```
09h00 - 10h30 : Phase 1 - Audit + Backup (1.5h)
10h30 - 12h30 : Phase 2.1-2.4 - Fichiers critiques (2h)
14h00 - 16h00 : Phase 2.5-2.7 - Routes & API (2h)
```

### **Jour 2 : BDD + Tests (3h)**
```
09h00 - 11h00 : Phase 3 - Migration BDD (2h)
11h00 - 12h00 : Phase 4 - Tests & Validation (1h)
```

**Total : 7h réparties sur 2 jours**

---

## 🎯 **SUCCESS CRITERIA**

### **MVP Opérationnel avec 2 rôles**
✅ Super Admin peut gérer salles + gérants  
✅ Gym Manager peut gérer SA salle  
✅ Aucune référence "franchise" dans le code  
✅ Schema BDD simplifié (pas de table franchises)  
✅ RLS fonctionne (2 rôles uniquement)  
✅ 0 errors production  
✅ Build time < 5 min  
✅ Tests passent

---

## 📞 **COMMUNICATION**

### **Si users franchise_owner existent en prod**

**Email template :**
```
Objet : Évolution JARVIS - Simplification de votre accès

Bonjour,

Nous simplifions JARVIS pour une meilleure expérience.

CHANGEMENTS :
- Votre accès "Propriétaire Franchise" devient "Gérant de Salle"
- Vous conservez l'accès à toutes vos salles
- Navigation simplifiée et plus rapide

IMPACT :
- Aucun (vos données et accès restent identiques)
- Nouvelle navigation disponible dès demain

Questions ? support@jarvis-group.net

L'équipe JARVIS
```

---

## ✅ **VALIDATION FINALE**

**Avant de démarrer, je vais :**
1. ✅ Créer backup Git
2. ✅ Analyser chaque fichier critique
3. ✅ Créer migration SQL testée
4. ✅ Exécuter étape par étape
5. ✅ Tester après chaque modification
6. ✅ Documenter tous les changements

**Tu es d'accord avec ce plan ?**

Si oui, je commence **immédiatement** avec Phase 1 (Audit détaillé).

Si tu veux ajuster quelque chose, dis-le moi maintenant ! 👇

