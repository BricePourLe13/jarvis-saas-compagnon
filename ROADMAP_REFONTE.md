# 🗺️ ROADMAP REFONTE JARVIS SaaS

**Version :** 1.0  
**Date début :** 25 octobre 2025  
**Statut :** 🟡 EN COURS - Phase 0

---

## 🎯 OBJECTIF GLOBAL

Transformer JARVIS d'un **prototype fonctionnel** en **SaaS niveau entreprise** prêt à vendre.

### Critères de succès
- ✅ Pipeline données opérationnel (conversations → insights automatiques)
- ✅ Architecture kiosks scalable (multi-kiosks par gym)
- ✅ Dashboard complet (admin, gérants, franchise)
- ✅ Zéro dette technique majeure
- ✅ MVP testé et validé par 1 client pilote

**Timeline cible :** 3-4 semaines  
**Date cible MVP :** 15 novembre 2025

---

## 📊 PHASES & PRIORITÉS

```
Phase 0: Fondations Documentation       [2 jours]  ← EN COURS
Phase 1: Architecture Kiosks            [3 jours]
Phase 2: Pipeline Données               [5 jours]  ← CRITIQUE
Phase 3: Jobs Automatiques              [3 jours]
Phase 4: Dashboard Admin                [4 jours]
Phase 5: Nettoyage & Optimisation       [3 jours]
Phase 6: Tests & Validation Pilote      [7 jours]
────────────────────────────────────────────────────
TOTAL:                                  27 jours
```

---

## 📋 PHASE 0 : FONDATIONS DOCUMENTATION [2 jours]

**Objectif :** Établir bases solides pour refonte

### ✅ Jour 1 - Documentation Architecture (25 oct 2025)
- [x] Audit complet projet (fichier par fichier)
- [x] Créer `agent.md` (instructions Claude Sonnet 4.5)
- [x] Créer `PLAN_ARCHITECTURE_ENTREPRISE.md` (architecture cible)
- [x] Créer `ROADMAP_REFONTE.md` (ce fichier)
- [ ] Valider plan avec Brice

### Jour 2 - Nettoyage Documentation
- [ ] Archiver docs obsolètes (25 docs → `docs/_archive/`)
- [ ] Mettre à jour `README.md` (vue d'ensemble projet)
- [ ] Créer `CONTRIBUTING.md` (guidelines dev)
- [ ] Nettoyer `package.json` (dépendances inutilisées)

**Livrables :**
- ✅ 3 docs de référence créés (agent.md, PLAN_ARCHITECTURE, ROADMAP)
- Documentation alignée et à jour
- Vision claire pour équipe/futurs devs

---

## 🏗️ PHASE 1 : ARCHITECTURE KIOSKS [3 jours]

**Objectif :** Table `kiosks` dédiée + support multi-kiosks

### Jour 3 - Migration Database Kiosks
**Fichiers impactés :**
- `supabase/migrations/20251026_create_kiosks_table.sql` (NOUVEAU)
- `supabase/migrations/20251026_migrate_existing_kiosks.sql` (NOUVEAU)

**Actions :**
```sql
1. Créer table kiosks (selon PLAN_ARCHITECTURE_ENTREPRISE.md)
2. Migrer données existantes depuis gyms.kiosk_config
3. Créer indexes + RLS policies
4. Refaire kiosk_heartbeats (ajouter kiosk_id FK)
5. Tester migration sur Dev Supabase
```

### Jour 4 - Adapter API Routes Kiosks
**Fichiers impactés :**
- `src/app/api/kiosk/[slug]/route.ts`
- `src/app/api/kiosk/heartbeat/route.ts`
- `src/app/api/kiosk/[slug]/provision/route.ts`
- `src/types/kiosk.ts`

**Actions :**
```typescript
1. Remplacer queries gym.kiosk_config → table kiosks
2. Ajouter validation kiosk_id
3. Supporter multi-kiosks (return array)
4. Mettre à jour types TypeScript
5. Tests API (Postman/Insomnia)
```

### Jour 5 - UI Multi-Kiosks Dashboard
**Fichiers impactés :**
- `src/app/dashboard/kiosks/page.tsx` (NOUVEAU)
- `src/app/dashboard/kiosks/[id]/page.tsx` (NOUVEAU)
- `src/components/admin/KiosksTable.tsx` (NOUVEAU)

**Actions :**
```typescript
1. Créer page /dashboard/kiosks (liste kiosks du gym)
2. Créer page /dashboard/kiosks/[id] (détails + config)
3. UI provisioning nouveau kiosk
4. UI monitoring status (online/offline)
5. UI delete/edit kiosk
```

**Livrables Phase 1 :**
- ✅ Table `kiosks` en production
- ✅ Support multi-kiosks par gym
- ✅ Dashboard gestion kiosks fonctionnel
- ✅ Migration données sans perte

---

## 🔄 PHASE 2 : PIPELINE DONNÉES [5 jours] ⚠️ CRITIQUE

**Objectif :** Conversations → Insights automatiques (promesse de valeur principale)

### Jour 6 - Trigger Session End
**Fichiers impactés :**
- `supabase/migrations/20251027_create_session_triggers.sql` (NOUVEAU)

**Actions :**
```sql
1. Créer trigger on_session_end()
   → Déclenché quand openai_realtime_sessions.state = 'closed'
2. Trigger crée entry dans conversation_summaries (status = 'pending')
3. Trigger enqueue job async via pg_notify ou appel Edge Function
4. Tester avec session test
```

### Jour 7-8 - Edge Function: Process Conversation
**Fichiers impactés :**
- `supabase/functions/process-conversation/index.ts` (NOUVEAU)
- `supabase/functions/_shared/openai.ts` (NOUVEAU)

**Actions :**
```typescript
// Edge Function Supabase (Deno runtime)
1. Récupérer session complète (conversation_events)
2. Générer summary via GPT-4o-mini
3. Extraire topics (prompt engineering)
4. Analyser sentiment (-1.0 à 1.0)
5. Détecter émotions + intents
6. Créer embedding OpenAI (text-embedding-3-small)
7. Update conversation_summaries avec résultats
8. Return success/error
```

**Prompt Example :**
```typescript
const SUMMARY_PROMPT = `
Résume cette conversation entre un adhérent et JARVIS (agent IA salle de sport).
Retourne un JSON avec:
{
  "summary": "Résumé 2-3 phrases",
  "topics": ["topic1", "topic2"],
  "sentiment": -1.0 à 1.0,
  "emotion": "joy|frustration|neutral|anger",
  "intents": ["book_class", "report_issue", "ask_question"],
  "action_items": [{"action": "...", "priority": "high|medium|low"}]
}

Conversation:
${transcript}
`
```

### Jour 9 - Edge Function: Update Member Analytics
**Fichiers impactés :**
- `supabase/functions/update-member-analytics/index.ts` (NOUVEAU)

**Actions :**
```typescript
1. Triggered après process_conversation
2. Recalculer métriques agrégées member:
   - total_conversations++
   - avg_sentiment (rolling average)
   - engagement_score (formule custom)
   - churn_risk_score (règles business)
3. Update member_analytics table
4. Return updated analytics
```

**Formule Churn Risk (MVP Simple) :**
```typescript
function calculateChurnRisk(member: Member, analytics: Analytics): number {
  let risk = 0.0
  
  // Facteur 1: Dernière visite
  if (analytics.days_since_last_visit > 21) risk += 0.4
  else if (analytics.days_since_last_visit > 14) risk += 0.2
  
  // Facteur 2: Sentiment négatif
  if (analytics.negative_sentiment_count > 5) risk += 0.3
  else if (analytics.negative_sentiment_count > 2) risk += 0.15
  
  // Facteur 3: Engagement faible
  if (analytics.engagement_score < 0.3) risk += 0.2
  
  // Facteur 4: Expiration abonnement proche
  if (member.membership_expires && daysBefore(member.membership_expires) < 30) {
    risk += 0.1
  }
  
  return Math.min(risk, 1.0) // Cap à 1.0
}
```

### Jour 10 - Edge Function: Generate Alerts
**Fichiers impactés :**
- `supabase/functions/generate-alerts/index.ts` (NOUVEAU)

**Actions :**
```typescript
1. Triggered après update_member_analytics
2. Règles alertes:
   IF churn_risk > 0.7 → Alerte "Risque churn critique"
   IF sentiment < -0.5 → Alerte "Feedback négatif"
   IF engagement_score > 0.8 → Alerte "Membre très engagé"
   IF days_since_last_visit == 30 → Alerte "Membre inactif 1 mois"
3. Créer entries manager_alerts
4. (Future: Push notification gérant)
```

**Livrables Phase 2 :**
- ✅ Conversations automatiquement résumées + analysées
- ✅ Member analytics calculés en temps réel
- ✅ Alertes intelligentes générées automatiquement
- ✅ **PROMESSE DE VALEUR LIVRÉE**

---

## ⏰ PHASE 3 : JOBS AUTOMATIQUES [3 jours]

**Objectif :** Automatiser calculs quotidiens/hebdomadaires

### Jour 11 - Setup Upstash QStash
**Fichiers impactés :**
- `src/app/api/cron/calculate-churn/route.ts` (NOUVEAU)
- `.env.local` (UPSTASH_QSTASH_TOKEN)

**Actions :**
```typescript
1. Créer compte Upstash (gratuit jusqu'à 500 msgs/jour)
2. Setup QStash pour cron jobs
3. Créer API route /api/cron/calculate-churn
4. Protéger avec Upstash signature verification
5. Configurer schedule quotidien (02:00 UTC)
```

### Jour 12 - Jobs Quotidiens
**Fichiers impactés :**
- `src/app/api/cron/calculate-churn/route.ts`
- `src/app/api/cron/check-kiosks-health/route.ts` (NOUVEAU)
- `src/app/api/cron/cleanup-old-data/route.ts` (NOUVEAU)

**Actions :**
```typescript
// Job 1: Calcul churn (02:00 UTC)
1. Récupérer tous members actifs
2. Recalculer churn_risk via calculateChurnRisk()
3. Update member_analytics
4. Générer alertes si churn_risk > threshold

// Job 2: Health check kiosks (toutes les 5 min)
1. Récupérer tous kiosks
2. Vérifier last_heartbeat < 10 min
3. Si offline > 30 min → Générer alerte manager

// Job 3: Cleanup (Dimanche 03:00 UTC)
1. Archiver sessions > 6 mois
2. Supprimer heartbeats > 30 jours
3. Nettoyer logs anciens
```

### Jour 13 - Jobs Hebdomadaires (Rapports)
**Fichiers impactés :**
- `src/app/api/cron/generate-weekly-reports/route.ts` (NOUVEAU)
- `src/lib/reports-generator.ts` (NOUVEAU)

**Actions :**
```typescript
// Job 4: Rapports hebdomadaires (Lundi 06:00 UTC)
1. Pour chaque gym actif:
   a. Agréger métriques 7 derniers jours
   b. Calculer trends vs semaine précédente
   c. Générer recommandations IA (GPT-4o-mini)
   d. Créer entry insights_reports
2. (Future: Envoyer email résumé gérant)
```

**Livrables Phase 3 :**
- ✅ Churn calculé automatiquement chaque jour
- ✅ Kiosks monitorés en temps réel
- ✅ Rapports hebdomadaires générés automatiquement
- ✅ Nettoyage automatique données anciennes

---

## 📊 PHASE 4 : DASHBOARD ADMIN [4 jours]

**Objectif :** Dashboard complet pour super_admin + gérants

### Jour 14 - Pages Admin Clients
**Fichiers impactés :**
- `src/app/dashboard/admin/clients/page.tsx` (NOUVEAU)
- `src/app/dashboard/admin/franchises/[id]/page.tsx` (REFAIRE)
- `src/app/dashboard/admin/gyms/[id]/page.tsx` (NOUVEAU)
- `src/components/admin/ClientsTable.tsx` (NOUVEAU)

**Actions :**
```typescript
1. Page /dashboard/admin/clients (liste franchises + salles)
2. Page /dashboard/admin/franchises/[id] (drill-down franchise)
3. Page /dashboard/admin/gyms/[id] (drill-down gym)
4. Tables avec filtres + search + export CSV
```

### Jour 15 - Pages Admin Monitoring
**Fichiers impactés :**
- `src/app/dashboard/admin/monitoring/page.tsx` (NOUVEAU)
- `src/app/dashboard/admin/costs/page.tsx` (NOUVEAU)
- `src/components/admin/KiosksMap.tsx` (NOUVEAU)
- `src/components/admin/CostsChart.tsx` (NOUVEAU)

**Actions :**
```typescript
1. Page /dashboard/admin/monitoring
   - System health (API, DB, OpenAI)
   - Kiosks online/offline map
   - Error rate graph (Sentry)
   
2. Page /dashboard/admin/costs
   - OpenAI usage chart (tokens, $)
   - Cost per customer table
   - Vercel bandwidth usage
```

### Jour 16 - Pages Admin Users & Logs
**Fichiers impactés :**
- `src/app/dashboard/admin/users/page.tsx` (NOUVEAU)
- `src/app/dashboard/admin/logs/page.tsx` (NOUVEAU)
- `src/components/admin/UsersTable.tsx` (NOUVEAU)

**Actions :**
```typescript
1. Page /dashboard/admin/users
   - Liste tous comptes (super_admin, franchise, gym)
   - Créer nouveau compte
   - Éditer rôle/permissions
   - Désactiver compte

2. Page /dashboard/admin/logs (audit trail)
   - Actions critiques loguées
   - Filtres par user/date/action
```

### Jour 17 - Dashboard Insights Gérants
**Fichiers impactés :**
- `src/app/dashboard/insights/page.tsx` (NOUVEAU)
- `src/app/dashboard/alerts/page.tsx` (NOUVEAU)
- `src/components/dashboard/InsightCard.tsx` (NOUVEAU)
- `src/components/dashboard/AlertsTimeline.tsx` (NOUVEAU)

**Actions :**
```typescript
1. Page /dashboard/insights
   - Recommandations IA personnalisées
   - Trends détectés
   - Actions suggérées

2. Page /dashboard/alerts
   - Alertes actives (pending)
   - Timeline alertes résolues
   - Actions rapides (résoudre/dismiss)
```

**Livrables Phase 4 :**
- ✅ Dashboard admin complet (gestion clients)
- ✅ Monitoring infra opérationnel
- ✅ Dashboard insights gérants fonctionnel
- ✅ Gestion users simplifiée

---

## 🧹 PHASE 5 : NETTOYAGE & OPTIMISATION [3 jours]

**Objectif :** Supprimer dette technique + design premium

### Jour 18 - Nettoyage Code
**Actions :**
```bash
1. Supprimer fichiers obsolètes (liste audit):
   - 4 backups landing page
   - Composants jamais utilisés (universal/, mobile/, museums/)
   - Routes API redondantes (/api/manager/*)
   
2. Nettoyer redondances BDD:
   - Supprimer users.franchise_access (garder franchise_id)
   - Supprimer users.gym_access (garder gym_id)
   - Migration SQL propre

3. Nettoyer package.json:
   - npm prune (supprimer dépendances inutilisées)
   - npm audit fix (vulnérabilités)
```

### Jour 19 - Logo Premium + Design Polish
**Fichiers impactés :**
- `src/components/common/JarvisLogo.tsx` (REFAIRE)
- `src/app/globals.css` (couleurs harmonisées)

**Actions :**
```typescript
1. Créer mini-sphère 3D animée (Framer Motion + GSAP)
   - Core sphère avec gradient purple
   - Anneaux orbitaux
   - Particules flottantes
   - Glow effect

2. Harmoniser couleurs dashboard:
   - Palette purple cohérente
   - Dark mode optimisé
   - Ombres/bordures subtiles

3. Polish UI components:
   - Hover states
   - Loading states
   - Empty states
   - Error states
```

### Jour 20 - Tests E2E Critiques
**Fichiers impactés :**
- `tests/e2e/auth.spec.ts` (MAJ)
- `tests/e2e/kiosk.spec.ts` (NOUVEAU)
- `tests/e2e/dashboard.spec.ts` (NOUVEAU)

**Actions :**
```typescript
// Playwright tests
1. Test auth flow (login + MFA)
2. Test kiosk provisioning
3. Test session JARVIS (voice mock)
4. Test dashboard navigation (tous rôles)
5. Test alertes création/résolution
```

**Livrables Phase 5 :**
- ✅ Code clean (zéro fichiers obsolètes)
- ✅ Design premium (logo + UI polish)
- ✅ Tests E2E critiques couverts (>60%)
- ✅ Zéro erreurs linter/TypeScript

---

## 🧪 PHASE 6 : TESTS & VALIDATION PILOTE [7 jours]

**Objectif :** Valider MVP avec client pilote réel

### Jour 21-22 - Tests Internes Complets
**Actions :**
```bash
1. Tests scénarios réels:
   - Onboarding nouveau gym
   - Configuration kiosk
   - Scan RFID → Conversation JARVIS
   - Génération insights automatiques
   - Alertes churn → Actions gérant

2. Load testing:
   - 10 sessions simultanées
   - 50 members actifs
   - 5 kiosks online

3. Bug fixing critiques identifiés
```

### Jour 23-24 - Setup Client Pilote
**Actions :**
```bash
1. Identifier client pilote (Brice a un contact)
2. Setup compte:
   - Créer franchise/gym
   - Créer compte gym_manager
   - Provisionner kiosk(s)
   - Importer adhérents (CSV)

3. Formation gérant (2h):
   - Utilisation dashboard
   - Interprétation insights
   - Gestion alertes

4. Installation kiosk sur site (si possible)
```

### Jour 25-27 - Période Test (3 jours minimum)
**Actions :**
```bash
1. Laisser tourner 3 jours minimum
2. Collecter feedback gérant:
   - Dashboard clair ?
   - Insights utiles ?
   - Bugs rencontrés ?
   - Features manquantes ?

3. Monitoring proactif:
   - Vérifier uptime kiosk
   - Vérifier génération rapports
   - Vérifier alertes pertinentes

4. Ajustements rapides si nécessaire
```

**Livrables Phase 6 :**
- ✅ MVP testé en conditions réelles
- ✅ Feedback client pilote collecté
- ✅ Bugs critiques fixés
- ✅ Validation "prêt à vendre"

---

## 📈 MÉTRIQUES SUCCÈS ROADMAP

### Techniques
- [ ] Zero erreurs build/linter
- [ ] Tests E2E > 60% coverage (routes critiques)
- [ ] Lighthouse score > 90 (Performance)
- [ ] API P95 latency < 200ms
- [ ] Dashboard load time < 2s

### Fonctionnelles
- [ ] Pipeline données opérationnel (100% sessions analysées)
- [ ] Churn detection fonctionnelle (alertes générées)
- [ ] Rapports hebdomadaires générés automatiquement
- [ ] Multi-kiosks support (testé avec 3+ kiosks)
- [ ] Dashboard admin complet (toutes pages fonctionnelles)

### Business
- [ ] 1 client pilote satisfait (NPS > 8/10)
- [ ] Uptime kiosk > 99% (7 jours test)
- [ ] Coût par session < $2 USD
- [ ] Insights jugés "actionnables" par gérant
- [ ] Prêt à vendre (démo commerciale rodée)

---

## 🚨 RISQUES & MITIGATION

### Risque 1: OpenAI API Latency/Downtime
**Impact :** Kiosk inutilisable  
**Mitigation :**
- Fallback mode (TTS/STT local avec Whisper + Chatterbox)
- Retry logic avec exponential backoff
- Status page OpenAI monitored

### Risque 2: Coûts OpenAI explosent
**Impact :** Marge négative  
**Mitigation :**
- Rate limiting strict par kiosk
- Alertes cost threshold (>$1000/jour)
- Migration progressive vers modèles moins chers (Groq)

### Risque 3: Client pilote insatisfait
**Impact :** Pas de validation marché  
**Mitigation :**
- Call hebdomadaire feedback
- Ajustements rapides (max 48h)
- Sur-communication proactive

### Risque 4: Bugs critiques en production
**Impact :** Perte crédibilité  
**Mitigation :**
- Tests E2E exhaustifs avant deploy
- Monitoring Sentry actif
- Rollback instant Vercel si nécessaire

---

## 📅 PLANNING DÉTAILLÉ

```
Semaine 1 (25-31 oct)
├─ Lun 25: Phase 0 (docs) ✅
├─ Mar 26: Phase 0 fin + Phase 1 début
├─ Mer 27: Phase 1 (kiosks)
├─ Jeu 28: Phase 1 fin
├─ Ven 29: Phase 2 début (triggers)
├─ Sam 30: Phase 2 (edge functions)
└─ Dim 31: Phase 2 (analytics)

Semaine 2 (1-7 nov)
├─ Lun 1: Phase 2 fin (alertes)
├─ Mar 2: Phase 3 (jobs cron)
├─ Mer 3: Phase 3 fin
├─ Jeu 4: Phase 4 (dashboard admin)
├─ Ven 5: Phase 4 suite
├─ Sam 6: Phase 4 fin
└─ Dim 7: Phase 5 (nettoyage)

Semaine 3 (8-14 nov)
├─ Lun 8: Phase 5 (design premium)
├─ Mar 9: Phase 5 fin (tests E2E)
├─ Mer 10: Phase 6 (tests internes)
├─ Jeu 11: Phase 6 suite
├─ Ven 12: Setup client pilote
├─ Sam 13: Formation + démarrage test
└─ Dim 14: Test pilote J1

Semaine 4 (15-18 nov)
├─ Lun 15: Test pilote J2
├─ Mar 16: Test pilote J3
├─ Mer 17: Feedback + ajustements
└─ Jeu 18: 🎉 MVP VALIDÉ
```

---

## ✅ CHECKLIST FINALE MVP

### Avant démarrage client pilote
- [ ] Toutes migrations DB appliquées prod
- [ ] Tous Edge Functions déployés
- [ ] Tous cron jobs configurés (Upstash)
- [ ] Dashboard admin complet fonctionnel
- [ ] Tests E2E passent (>60% coverage)
- [ ] Monitoring Sentry actif
- [ ] Documentation utilisateur écrite
- [ ] Vidéo démo enregistrée (5 min)

### Pendant test client pilote
- [ ] Call J+1 feedback
- [ ] Call J+3 feedback
- [ ] Call J+7 feedback final
- [ ] Bugs critiques fixés <24h
- [ ] Uptime monitored quotidien

### Après validation
- [ ] Témoignage client collecté
- [ ] Case study rédigé
- [ ] Pricing finalisé
- [ ] Contrat type rédigé
- [ ] Site vitrine mis à jour
- [ ] Campagne acquisition démarrée

---

## 🎯 APRÈS LE MVP (Post-15 Nov)

### Features Court Terme (Q4 2025)
1. Mobile app adhérents (consultation profil, réservations)
2. Intégration équipements fitness (API Technogym, etc.)
3. ML churn prédiction (XGBoost model)
4. Système notifications push gérants
5. Exports PDF rapports

### Features Moyen Terme (Q1 2026)
1. Marketplace partenaires (marques compléments, équipementiers)
2. Jarvis multilingue (EN, ES, DE)
3. Intégration CRM salles (Mailchimp, HubSpot)
4. Dashboard franchise agrégé
5. API publique (webhooks)

### Scale Infrastructure (Q2 2026)
1. Migration microservices ML (séparé de Next.js)
2. Multi-région database (Supabase replicas)
3. CDN assets custom (CloudFlare)
4. Queue system robuste (Upstash + Redis)
5. Data warehouse analytics (Snowflake)

---

**ROADMAP VIVANTE : Mise à jour hebdomadaire selon avancement réel.**

**Prochaine étape :** Phase 0 Jour 2 - Valider plan avec Brice ✅


