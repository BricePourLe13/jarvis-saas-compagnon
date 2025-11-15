# 📋 TODOS CRITIQUES - ÉTAT DES LIEUX

**Date :** 13 novembre 2025  
**Nombre total :** 92 TODOs détectés  
**Statut :** 📊 Documenté et priorisé

---

## 🔴 **PRIORITÉ P0 - À FAIRE IMMÉDIATEMENT** (8)

### 1. **Dashboard Tools - Statistiques manquantes**
```typescript
// src/app/dashboard/tools/page.tsx:83-84
total_executions_today: 0, // TODO: depuis API
total_executions_week: 0, // TODO: depuis API
```
**IMPACT :** Dashboard incomplet, métriques manquantes  
**FIX :** Créer API `/api/dashboard/tools/stats`

---

### 2. **Cron Weekly Reports - Email non envoyé**
```typescript
// src/app/api/cron/weekly-reports/route.ts:222
// TODO Phase 4 : Envoyer email au gérant via Resend
```
**IMPACT :** Feature promise non livrée  
**FIX :** Intégrer Resend dans le cron job

---

### 3. **Kiosk Members - Visit count incorrect**
```typescript
// src/app/api/kiosk/[slug]/members/[badgeId]/route.ts:126
visit_count_today: 1, // TODO: Calculer le vrai nombre
```
**IMPACT :** Données adhérent incorrectes  
**FIX :** Query COUNT sur `openai_realtime_sessions` du jour

---

### 4. **Gym Create Wizard - Liste gérants hardcodée**
```typescript
// src/components/admin/GymCreateWizard.tsx:367
{/* TODO: Charger liste gérants dynamiquement */}
```
**IMPACT :** UX dégradée, pas de recherche gérants  
**FIX :** API route `/api/dashboard/admin/users?role=gym_manager`

---

### 5. **Test Tool - Logique de test absente**
```typescript
// src/components/dashboard/tools/Step3TestActivate.tsx:28
// TODO: Implémenter vraie logique de test
```
**IMPACT :** Custom tools non testables avant activation  
**FIX :** Exécuter le tool avec des données de test

---

### 6. **Sync Real Costs - Statistiques manquantes**
```typescript
// src/app/api/sync/real-costs/route.ts:62
// TODO: Implémenter les statistiques de coûts
```
**IMPACT :** Coûts OpenAI non trackés correctement  
**FIX :** Agréger les données depuis `jarvis_session_costs`

---

### 7. **OpenAI Usage - Synchronisation absente**
```typescript
// src/app/api/openai/usage/route.ts:105
// TODO: Implémenter la logique de synchronisation
```
**IMPACT :** Coûts OpenAI potentiellement désynchronisés  
**FIX :** Implémenter sync avec API OpenAI usage

---

### 8. **Dashboard Team - API call manquante**
```typescript
// src/app/dashboard/team/page.tsx:20
// TODO: Remplacer par vraie API call
```
**IMPACT :** Page team non fonctionnelle  
**FIX :** Créer API `/api/dashboard/team` avec RLS

---

## 🟡 **PRIORITÉ P1 - DANS LES 2 SEMAINES** (12)

### 9-20. **Logs Debug en production** (12 occurrences)
```typescript
// Multiples fichiers
console.log('[DEBUG]', ...)
console.error('[DEBUG]', ...)
```
**IMPACT :** Coûts logs élevés, bruit  
**FIX :** Remplacer par `logger.debug()` du structured-logger

---

## 🟢 **PRIORITÉ P2 - BACKLOG** (72)

### Catégories:
- **Webhooks/Logs debug** (65) : Nettoyer les logs de debug
- **Placeholders UI** (5) : Remplacer données mockées
- **Optimisations** (2) : Améliorer performances

---

## 📊 **RÉPARTITION PAR FICHIER**

| Fichier | TODOs | Priorité |
|---------|-------|----------|
| `src/app/api/voice/session/route.ts` | 18 | P1 (debug logs) |
| `src/hooks/useVoiceChat.ts` | 8 | P1 (debug logs) |
| `src/lib/production-log-cleaner.ts` | 7 | P2 (config) |
| `src/app/dashboard/tools/page.tsx` | 2 | P0 |
| `src/app/api/cron/weekly-reports/route.ts` | 1 | P0 |
| Autres (44 fichiers) | 56 | P1-P2 |

---

## 🎯 **PLAN D'ACTION**

### **Semaine 1 : P0**
```bash
Jour 1-2 : Implémenter statistiques tools (TODO #1)
Jour 3 : Email weekly reports (TODO #2)
Jour 4 : Visit count + liste gérants (TODO #3-4)
Jour 5 : Test tools + sync costs (TODO #5-7)
```

### **Semaine 2-3 : P1**
```bash
- Migration progressive des console.log vers structured-logger
- Cibler 10 fichiers/jour
- Automatiser avec script si besoin
```

### **Backlog : P2**
```bash
- Nettoyer après P0/P1 terminés
- Pas bloquant pour production
```

---

## 🔧 **COMMANDE RAPIDE - TROUVER TOUS LES TODOS**

```bash
# Windows PowerShell
Select-String -Path "src\**\*.ts","src\**\*.tsx" -Pattern "TODO|FIXME|HACK|XXX|BUG" -CaseSensitive

# Bash/Linux
grep -r "TODO\|FIXME\|HACK\|XXX\|BUG" src/ --include="*.ts" --include="*.tsx"
```

---

## ✅ **CRITÈRES DE COMPLÉTION**

**P0 terminé quand :**
- ✅ Toutes les features promises fonctionnent
- ✅ Dashboard complet (pas de données mockées)
- ✅ Métriques correctes (coûts, stats, visits)

**P1 terminé quand :**
- ✅ Zéro `console.log` en production
- ✅ Structured-logger utilisé partout
- ✅ Logs coûtent <10€/mois (vs ~200€ actuellement)

**P2 terminé quand :**
- ✅ Zéro TODO dans le code
- ✅ Zéro FIXME/HACK/XXX
- ✅ Code audit-ready

---

**📌 NOTE :** Ce fichier doit être mis à jour au fur et à mesure que les TODOs sont résolus.


**Date :** 13 novembre 2025  
**Nombre total :** 92 TODOs détectés  
**Statut :** 📊 Documenté et priorisé

---

## 🔴 **PRIORITÉ P0 - À FAIRE IMMÉDIATEMENT** (8)

### 1. **Dashboard Tools - Statistiques manquantes**
```typescript
// src/app/dashboard/tools/page.tsx:83-84
total_executions_today: 0, // TODO: depuis API
total_executions_week: 0, // TODO: depuis API
```
**IMPACT :** Dashboard incomplet, métriques manquantes  
**FIX :** Créer API `/api/dashboard/tools/stats`

---

### 2. **Cron Weekly Reports - Email non envoyé**
```typescript
// src/app/api/cron/weekly-reports/route.ts:222
// TODO Phase 4 : Envoyer email au gérant via Resend
```
**IMPACT :** Feature promise non livrée  
**FIX :** Intégrer Resend dans le cron job

---

### 3. **Kiosk Members - Visit count incorrect**
```typescript
// src/app/api/kiosk/[slug]/members/[badgeId]/route.ts:126
visit_count_today: 1, // TODO: Calculer le vrai nombre
```
**IMPACT :** Données adhérent incorrectes  
**FIX :** Query COUNT sur `openai_realtime_sessions` du jour

---

### 4. **Gym Create Wizard - Liste gérants hardcodée**
```typescript
// src/components/admin/GymCreateWizard.tsx:367
{/* TODO: Charger liste gérants dynamiquement */}
```
**IMPACT :** UX dégradée, pas de recherche gérants  
**FIX :** API route `/api/dashboard/admin/users?role=gym_manager`

---

### 5. **Test Tool - Logique de test absente**
```typescript
// src/components/dashboard/tools/Step3TestActivate.tsx:28
// TODO: Implémenter vraie logique de test
```
**IMPACT :** Custom tools non testables avant activation  
**FIX :** Exécuter le tool avec des données de test

---

### 6. **Sync Real Costs - Statistiques manquantes**
```typescript
// src/app/api/sync/real-costs/route.ts:62
// TODO: Implémenter les statistiques de coûts
```
**IMPACT :** Coûts OpenAI non trackés correctement  
**FIX :** Agréger les données depuis `jarvis_session_costs`

---

### 7. **OpenAI Usage - Synchronisation absente**
```typescript
// src/app/api/openai/usage/route.ts:105
// TODO: Implémenter la logique de synchronisation
```
**IMPACT :** Coûts OpenAI potentiellement désynchronisés  
**FIX :** Implémenter sync avec API OpenAI usage

---

### 8. **Dashboard Team - API call manquante**
```typescript
// src/app/dashboard/team/page.tsx:20
// TODO: Remplacer par vraie API call
```
**IMPACT :** Page team non fonctionnelle  
**FIX :** Créer API `/api/dashboard/team` avec RLS

---

## 🟡 **PRIORITÉ P1 - DANS LES 2 SEMAINES** (12)

### 9-20. **Logs Debug en production** (12 occurrences)
```typescript
// Multiples fichiers
console.log('[DEBUG]', ...)
console.error('[DEBUG]', ...)
```
**IMPACT :** Coûts logs élevés, bruit  
**FIX :** Remplacer par `logger.debug()` du structured-logger

---

## 🟢 **PRIORITÉ P2 - BACKLOG** (72)

### Catégories:
- **Webhooks/Logs debug** (65) : Nettoyer les logs de debug
- **Placeholders UI** (5) : Remplacer données mockées
- **Optimisations** (2) : Améliorer performances

---

## 📊 **RÉPARTITION PAR FICHIER**

| Fichier | TODOs | Priorité |
|---------|-------|----------|
| `src/app/api/voice/session/route.ts` | 18 | P1 (debug logs) |
| `src/hooks/useVoiceChat.ts` | 8 | P1 (debug logs) |
| `src/lib/production-log-cleaner.ts` | 7 | P2 (config) |
| `src/app/dashboard/tools/page.tsx` | 2 | P0 |
| `src/app/api/cron/weekly-reports/route.ts` | 1 | P0 |
| Autres (44 fichiers) | 56 | P1-P2 |

---

## 🎯 **PLAN D'ACTION**

### **Semaine 1 : P0**
```bash
Jour 1-2 : Implémenter statistiques tools (TODO #1)
Jour 3 : Email weekly reports (TODO #2)
Jour 4 : Visit count + liste gérants (TODO #3-4)
Jour 5 : Test tools + sync costs (TODO #5-7)
```

### **Semaine 2-3 : P1**
```bash
- Migration progressive des console.log vers structured-logger
- Cibler 10 fichiers/jour
- Automatiser avec script si besoin
```

### **Backlog : P2**
```bash
- Nettoyer après P0/P1 terminés
- Pas bloquant pour production
```

---

## 🔧 **COMMANDE RAPIDE - TROUVER TOUS LES TODOS**

```bash
# Windows PowerShell
Select-String -Path "src\**\*.ts","src\**\*.tsx" -Pattern "TODO|FIXME|HACK|XXX|BUG" -CaseSensitive

# Bash/Linux
grep -r "TODO\|FIXME\|HACK\|XXX\|BUG" src/ --include="*.ts" --include="*.tsx"
```

---

## ✅ **CRITÈRES DE COMPLÉTION**

**P0 terminé quand :**
- ✅ Toutes les features promises fonctionnent
- ✅ Dashboard complet (pas de données mockées)
- ✅ Métriques correctes (coûts, stats, visits)

**P1 terminé quand :**
- ✅ Zéro `console.log` en production
- ✅ Structured-logger utilisé partout
- ✅ Logs coûtent <10€/mois (vs ~200€ actuellement)

**P2 terminé quand :**
- ✅ Zéro TODO dans le code
- ✅ Zéro FIXME/HACK/XXX
- ✅ Code audit-ready

---

**📌 NOTE :** Ce fichier doit être mis à jour au fur et à mesure que les TODOs sont résolus.

