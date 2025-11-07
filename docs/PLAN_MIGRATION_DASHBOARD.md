# 🎯 PLAN DE MIGRATION DASHBOARD - MÉTHODOLOGIQUE

**Date :** 7 novembre 2025  
**Audit par :** Claude Sonnet 4.5  
**Objectif :** Corriger design + voix JARVIS sans casser l'existant

---

## ✅ ÉTAT ACTUEL (AUDIT COMPLET)

### Ce qui FONCTIONNE DÉJÀ ✅
1. **Navigation** : Toutes les routes existent (`/dashboard/members`, `/sessions`, `/analytics`, `/settings`, `/team`)
2. **API Routes** : Tous les endpoints correspondent (`/api/dashboard/members`, etc.)
3. **ContextSwitcher** : Déjà implémenté et visible dans le header
4. **Multi-tenant** : Système de contexte gym/franchise opérationnel
5. **Recharts installé** : `"recharts": "^3.3.0"` → Pas besoin de Tremor !

### Ce qui NÉCESSITE CORRECTION ❌
1. **Design** : Couleurs vives au lieu de monochrome
2. **Voix JARVIS** : Pas de réponse audio (problème prompt/config)

---

## 🎨 PROBLÈME 1 : DESIGN NON-MONOCHROME

### Fichiers Concernés
- `src/app/dashboard/page.tsx` (lignes 61-84)
- `src/app/dashboard/members/page.tsx`
- `src/app/dashboard/sessions/page.tsx`
- `src/app/dashboard/analytics/page.tsx`

### Couleurs Actuelles (À Remplacer)
```typescript
// ❌ COULEURS VIVES
'text-blue-500'    → Membres
'text-purple-500'  → Sessions
'text-green-500'   → Sentiment
'text-red-500'     → Churn
'text-yellow-500'  → Sentiment neutral
```

### Palette Monochrome (Cible)
```typescript
// ✅ MONOCHROME STRICT
'text-white/90'     → Valeurs principales
'text-white/70'     → Icons
'text-gray-400'     → Labels
'text-gray-500'     → Text secondaire
'text-white/10'     → Borders

// ✅ VIOLET SUBTIL (< 5%)
'text-violet-400/50' → Accents rares
'bg-violet-500/5'    → Hover states
```

### Approach Sans Risque
**Pas besoin d'installer Tremor !** On a déjà Recharts + Chakra + ShadCN.

**Solution :** Créer un système de design utilities.

```typescript
// src/lib/dashboard-design.ts
export const dashboardDesign = {
  // Cards
  card: "bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg",
  cardHover: "hover:bg-white/5 hover:border-white/10 transition-all duration-200",
  
  // Typography
  heading: "text-white/90 font-semibold",
  label: "text-gray-400 text-sm",
  value: "text-white font-bold",
  description: "text-gray-500 text-sm",
  
  // Icons
  icon: "text-white/70",
  iconPrimary: "text-white/90",
  
  // Status colors (MONOCHROME avec nuances de gris)
  statusPositive: "text-white/90",  // Blanc brillant
  statusNeutral: "text-gray-400",   // Gris moyen
  statusNegative: "text-gray-600",  // Gris foncé
  statusWarning: "text-gray-300",   // Gris clair
  
  // Backgrounds
  bgPrimary: "bg-black",
  bgCard: "bg-black/40 backdrop-blur-xl",
  bgHover: "bg-white/5",
  
  // Borders
  border: "border-white/5",
  borderHover: "border-white/10"
}
```

---

## 🔇 PROBLÈME 2 : VOIX JARVIS SILENCIEUSE

### Diagnostic
✅ Session OpenAI créée  
✅ WebRTC connecté  
✅ Transcription utilisateur OK  
❌ **Aucun `response.audio.delta` reçu**

### Hypothèses (Par ordre de probabilité)

#### A. Prompt trop long (80% probabilité)
```typescript
// Fichier : src/app/api/voice/session/route.ts ligne 232
instructions: generateEnrichedInstructions(
  memberProfile,      // ~500 tokens
  gymSlug,            // ~50 tokens
  factsPrompt,        // ~500 tokens (10 facts)
  conversationContext // ~500 tokens (RAG)
)
// TOTAL : ~1550 tokens + instructions base

// Limite OpenAI Realtime : ~1000 tokens conseillés
// Au-delà : timeouts, réponses coupées
```

#### B. Tools bloquent la réponse (15% probabilité)
```typescript
tools: jarvisTools,  // 4 tools définis
tool_choice: 'auto'  // OpenAI attend peut-être un tool call ?
```

#### C. VAD trop agressif (5% probabilité)
```typescript
turn_detection: {
  silence_duration_ms: 500  // Trop court ?
}
```

### Solution Méthodologique

**Étape 1 : Test Prompt Minimal**
```typescript
// Désactiver TOUT le contexte enrichi
instructions: `Tu es JARVIS, l'assistant vocal de la salle.
Réponds en français, de manière brève et naturelle.`

// Désactiver tools
tools: []
```

**Étape 2 : Debug Logs Complets**
```typescript
// src/hooks/useVoiceChat.ts ligne ~558
dc.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  // ✅ AJOUTER CES LOGS
  console.log('📨 [OPENAI RAW]:', message.type)
  console.log('📨 [OPENAI FULL]:', JSON.stringify(message, null, 2))
  
  // ✅ DÉTECTER ERREURS
  if (message.type === 'error') {
    console.error('❌ [OPENAI ERROR]:', message.error)
    alert(`Erreur OpenAI: ${message.error?.message || 'Inconnue'}`)
  }
  
  // ✅ LOGGER TOUS LES TYPES DE RÉPONSE
  if (message.type.startsWith('response.')) {
    console.log('🎤 [RESPONSE EVENT]:', message.type, message)
  }
}
```

**Étape 3 : Vérifier Vercel Logs**
```bash
# Chercher erreurs OpenAI côté serveur
vercel logs --follow
# Filtrer sur "SESSION" ou "OpenAI"
```

---

## 🔄 ORDRE D'EXÉCUTION (SANS RISQUE)

### Phase 1 : Créer Système de Design (30 min)
1. Créer `src/lib/dashboard-design.ts`
2. Créer helper functions pour classes conditionnelles
3. **Tester** : Importer dans une seule page
4. **Validation** : Build réussit, pas d'erreurs

### Phase 2 : Refactor Dashboard Principal (45 min)
1. Mettre à jour `src/app/dashboard/page.tsx`
2. Remplacer toutes les couleurs vives par monochrome
3. **Tester** : Visuel conforme à la DA
4. **Validation** : Navigation fonctionne, données affichées

### Phase 3 : Refactor Pages Secondaires (1h)
1. Mettre à jour `/members/page.tsx`
2. Mettre à jour `/sessions/page.tsx`
3. Mettre à jour `/analytics/page.tsx`
4. **Tester après chaque page** : Build + visuel
5. **Validation** : Toutes les pages monochrome

### Phase 4 : Fix Voix JARVIS - Test Minimal (20 min)
1. Modifier `src/app/api/voice/session/route.ts`
2. Simplifier prompt (désactiver contexte enrichi)
3. Désactiver tools temporairement
4. **Déployer sur Vercel**
5. **Tester** : Scanner badge → Parler → JARVIS répond ?

### Phase 5 : Debug Logs (si Phase 4 échoue) (30 min)
1. Modifier `src/hooks/useVoiceChat.ts`
2. Ajouter logs exhaustifs WebRTC
3. **Déployer sur Vercel**
4. **Analyser logs** : Trouver l'erreur OpenAI
5. **Corriger** selon l'erreur trouvée

### Phase 6 : Tests Finaux (30 min)
1. Test navigation : Cliquer sur tous les liens
2. Test design : Vérifier monochrome sur toutes les pages
3. Test context : Changer de salle (si franchise)
4. Test voix : Session complète avec JARVIS
5. **Validation finale** : Screenshots avant/après

---

## ⚠️ POINTS DE RISQUE & MITIGATIONS

### Risque 1 : Build Cassé (Probabilité : 5%)
**Cause :** Erreur TypeScript dans les nouvelles utilities  
**Mitigation :** Tester après chaque changement avec `npm run build`  
**Rollback :** Supprimer `dashboard-design.ts`, revenir aux classes inline

### Risque 2 : Recharts Incompatible (Probabilité : 2%)
**Cause :** Version Recharts trop vieille  
**Mitigation :** Déjà installé v3.3.0 (récent)  
**Rollback :** Pas de risque (on ne touche pas Recharts)

### Risque 3 : Prompt Minimal Casse Tools (Probabilité : 10%)
**Cause :** D'autres features dépendent des tools  
**Mitigation :** Désactiver temporairement juste pour test  
**Rollback :** Remettre prompt original si tests échouent

### Risque 4 : Vercel Deploy Fail (Probabilité : 3%)
**Cause :** Erreur build inattendue  
**Mitigation :** Build local OK avant push  
**Rollback :** Vercel auto-rollback si deploy fail

---

## 📊 ESTIMATION TEMPS

| Phase | Durée | Risque | Priorité |
|-------|-------|--------|----------|
| Phase 1 : Design utilities | 30 min | Faible | Moyenne |
| Phase 2 : Dashboard principal | 45 min | Faible | Haute |
| Phase 3 : Pages secondaires | 1h | Faible | Moyenne |
| Phase 4 : Fix voix (test) | 20 min | Moyen | **CRITIQUE** |
| Phase 5 : Debug voix | 30 min | Moyen | **CRITIQUE** |
| Phase 6 : Tests finaux | 30 min | Faible | Haute |

**TOTAL : 3h15 (pire cas : +30min debug)**

---

## ✅ CHECKLIST PRÉ-EXÉCUTION

Avant de commencer, vérifier :
- [ ] Git status clean (pas de changements non commités)
- [ ] `npm run build` passe (pas d'erreurs actuelles)
- [ ] Vercel deploy récent OK
- [ ] Clé API OpenAI valide (vérifiée)
- [ ] Crédits OpenAI disponibles

---

## 🚀 VALIDATION UTILISATEUR REQUISE

**Question à l'utilisateur :**

1. **Tremor ou pas Tremor ?**
   - ❌ Pas besoin (Recharts déjà installé)
   - ✅ Utiliser utilities custom (moins de dépendances)

2. **Ordre préféré ?**
   - **Option A** : Design d'abord (Phases 1-3) puis Voix (Phases 4-5)
   - **Option B** : Voix d'abord (Phases 4-5) puis Design (Phases 1-3)
   - **Option C** : Parallèle (moi design, toi test voix)

3. **Si voix ne marche pas après Phase 4 ?**
   - ✅ Continuer Phase 5 (debug logs)
   - ❌ Arrêter et investiguer manuellement

**Recommandation :** **Option A** (Design → Voix)  
**Raison :** Design = changements isolés, faible risque. Voix = nécessite tests itératifs.

---

**ATTENTE VALIDATION AVANT EXÉCUTION** ✋

