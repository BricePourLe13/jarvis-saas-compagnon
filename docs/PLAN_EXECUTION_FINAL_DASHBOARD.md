# 🎯 PLAN EXÉCUTION FINAL - DASHBOARD + VOIX

**Date :** 7 novembre 2025  
**Contexte :** Refactoring vocal en cours (autre agent) - Adapter plan en conséquence

---

## 📊 SITUATION ACTUELLE

### Systèmes Vocaux
- ✅ **Vitrine** : Corrections critiques appliquées (timeout 5min, sample rate 16kHz, FR)
- ✅ **Kiosk** : Fonctionne avec `useVoiceChat.ts` (version originale)
- 🟡 **Refactoring** : Versions `.refactored.ts` créées mais NON ACTIVÉES

### Dashboard
- ✅ **Navigation** : Routes OK (`/members`, `/sessions`, `/analytics`)
- ❌ **Design** : Couleurs vives au lieu de monochrome
- ✅ **Context** : Multi-tenant déjà implémenté

---

## 🎯 PLAN ADAPTÉ (3 PHASES)

### **PHASE 1 : Design Monochrome (2h)**

**Approche :** Pas de Tremor, utilities custom légères

**Actions :**
1. Créer `src/lib/dashboard-design.ts`
2. Refactor `dashboard/page.tsx` (principal)
3. Refactor `dashboard/members/page.tsx`
4. Refactor `dashboard/sessions/page.tsx`
5. Refactor `dashboard/analytics/page.tsx`

**Risque :** ⬇️ Faible (changements CSS isolés)

---

### **PHASE 2 : Fix Voix JARVIS - Approche Conservatrice (1h)**

**IMPORTANT :** Ne PAS toucher au refactoring en cours !

**Approche :**
1. Modifier UNIQUEMENT `useVoiceChat.ts` (version actuelle)
2. Simplifier le prompt temporairement
3. Ajouter logs debug WebRTC
4. Tester

**Fichiers à modifier :**
- ✅ `src/app/api/voice/session/route.ts` (simplifier prompt)
- ✅ `src/hooks/useVoiceChat.ts` (ajouter logs debug)
- ❌ NE PAS toucher `.refactored.ts` (refactoring en cours)

**Risque :** 🟡 Moyen (modification hook production, mais changements minimes)

---

### **PHASE 3 : Tests & Validation (30min)**

**Tests :**
1. Navigation dashboard
2. Design monochrome
3. Voix JARVIS (scan badge → réponse)
4. Context switcher (si franchise)

---

## 🔧 DÉTAILS TECHNIQUES

### Phase 1 : Design Utilities

```typescript
// src/lib/dashboard-design.ts

export const mono = {
  // Cards
  card: "bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg",
  cardHover: "hover:bg-white/5 hover:border-white/10 transition-all duration-200",
  
  // Typography
  h1: "text-white/90 font-semibold",
  label: "text-gray-400 text-sm",
  value: "text-white font-bold text-2xl",
  description: "text-gray-500 text-sm",
  
  // Icons (MONOCHROME strict)
  icon: "text-white/70",
  iconActive: "text-white/90",
  iconMuted: "text-gray-500",
  
  // Borders
  border: "border-white/5",
  borderHover: "border-white/10"
}

// Helper pour remplacer couleurs vives
export function monochromeIcon(color?: string) {
  // Ignore color parameter, toujours monochrome
  return mono.icon
}
```

### Phase 2 : Simplification Prompt

```typescript
// src/app/api/voice/session/route.ts

// ❌ AVANT (trop long)
instructions: generateEnrichedInstructions(
  memberProfile,        // ~500 tokens
  gymSlug,              // ~50 tokens
  factsPrompt,          // ~500 tokens
  conversationContext   // ~500 tokens
)
// TOTAL : ~1550+ tokens → Timeout OpenAI

// ✅ APRÈS (minimal pour test)
instructions: `Tu es JARVIS, l'assistant vocal de ${memberProfile.first_name}.
Réponds en français, de manière brève et naturelle.

Voici ce que tu sais sur ${memberProfile.first_name}:
- Membre depuis ${memberProfile.created_at}
- Type d'abonnement : ${memberProfile.membership_type}

Sois bienveillant et motivant.`

// Désactiver tools temporairement pour isoler le problème
tools: []  // Au lieu de jarvisTools
```

### Phase 2 : Debug Logs WebRTC

```typescript
// src/hooks/useVoiceChat.ts (ligne ~558)

dc.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data)
    
    // ✅ NOUVEAU : Logs exhaustifs
    console.log('📨 [OPENAI RAW]:', message.type)
    
    // ✅ NOUVEAU : Détection erreurs
    if (message.type === 'error') {
      console.error('❌ [OPENAI ERROR]:', message.error)
      console.error('📊 [ERROR DETAILS]:', JSON.stringify(message.error, null, 2))
      alert(`Erreur OpenAI: ${message.error?.message || 'Inconnue'}`)
    }
    
    // ✅ NOUVEAU : Logger TOUS les events response
    if (message.type.startsWith('response.')) {
      console.log('🎤 [RESPONSE EVENT]:', message.type)
      console.log('🎤 [RESPONSE DATA]:', JSON.stringify(message, null, 2))
    }
    
    // ... reste du code
  }
}
```

---

## ⚠️ PRÉCAUTIONS CRITIQUES

### À NE PAS FAIRE

1. ❌ **NE PAS** toucher `useVoiceChat.refactored.ts`
2. ❌ **NE PAS** toucher `useVoiceVitrineChat.refactored.ts`
3. ❌ **NE PAS** toucher `src/lib/voice/*`
4. ❌ **NE PAS** activer le refactoring (c'est l'autre agent)

### À FAIRE SI PROBLÈME VOIX PERSISTE

**Si après simplification prompt, toujours pas de voix :**

1. **Vérifier Vercel logs** :
   ```bash
   vercel logs --follow
   # Chercher "OpenAI" ou "response.audio"
   ```

2. **Tester API OpenAI directement** :
   ```bash
   curl https://api.openai.com/v1/realtime/sessions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gpt-4o-realtime-preview-2024-10-01",
       "voice": "alloy",
       "instructions": "Test simple"
     }'
   ```

3. **Vérifier clé API** :
   - Dashboard Vercel > Settings > Environment Variables
   - `OPENAI_API_KEY` doit commencer par `sk-proj-...`

4. **Si toujours KO** :
   - Problème côté OpenAI (quota, API down)
   - Contacter support OpenAI

---

## 📋 CHECKLIST EXÉCUTION

### Phase 1 : Design (2h)

- [ ] Créer `src/lib/dashboard-design.ts`
- [ ] Build local OK
- [ ] Refactor `dashboard/page.tsx`
  - [ ] Remplacer `text-blue-500` → `text-white/70`
  - [ ] Remplacer `text-purple-500` → `text-white/70`
  - [ ] Remplacer `text-green-500` → `text-white/70`
  - [ ] Remplacer `text-red-500` → `text-white/70`
  - [ ] Test visuel monochrome
- [ ] Refactor `dashboard/members/page.tsx`
  - [ ] Appliquer palette monochrome
  - [ ] Test visuel
- [ ] Refactor `dashboard/sessions/page.tsx`
  - [ ] Appliquer palette monochrome
  - [ ] Test visuel
- [ ] Refactor `dashboard/analytics/page.tsx`
  - [ ] Appliquer palette monochrome
  - [ ] Recharts en monochrome (gris)
  - [ ] Test visuel
- [ ] Build final OK
- [ ] Commit + Deploy Vercel

### Phase 2 : Voix (1h)

- [ ] Modifier `api/voice/session/route.ts`
  - [ ] Simplifier prompt (< 500 tokens)
  - [ ] Désactiver tools temporairement
- [ ] Modifier `hooks/useVoiceChat.ts`
  - [ ] Ajouter logs debug WebRTC
  - [ ] Ajouter détection erreurs OpenAI
- [ ] Build local OK
- [ ] Commit + Deploy Vercel
- [ ] Tester kiosk
  - [ ] Scanner badge Marie Dubois
  - [ ] Parler : "Bonjour JARVIS"
  - [ ] Vérifier logs console
  - [ ] **JARVIS répond ?**
- [ ] Si OK : Réactiver contexte enrichi progressivement
- [ ] Si KO : Analyser logs Vercel

### Phase 3 : Tests (30min)

- [ ] Test navigation
  - [ ] Clic "Membres" → Page membres
  - [ ] Clic "Sessions" → Page sessions
  - [ ] Clic "Analytics" → Page analytics
- [ ] Test design
  - [ ] Toutes pages en monochrome
  - [ ] Pas de couleurs vives
  - [ ] Glassmorphism subtil
- [ ] Test context
  - [ ] Nom salle visible
  - [ ] Switcher fonctionne (si franchise)
- [ ] Test voix complet
  - [ ] Session > 1 minute
  - [ ] JARVIS répond pertinemment
  - [ ] Transcription correcte

---

## 🎯 CRITÈRES DE SUCCÈS

### Design ✅
- [ ] Palette monochrome stricte (blanc/gris/noir)
- [ ] Violet < 5% surface (très subtil)
- [ ] Glassmorphism Cards (`bg-black/40 backdrop-blur-xl`)
- [ ] Borders invisibles (`border-white/5`)

### Voix ✅
- [ ] JARVIS répond vocalement
- [ ] `response.audio.delta` dans les logs
- [ ] Pas d'erreurs OpenAI
- [ ] Transcription FR correcte

### Navigation ✅
- [ ] Tous les liens fonctionnent
- [ ] Pas de 404
- [ ] Context switcher visible

---

## 🚀 ORDRE D'EXÉCUTION

**Option A (Recommandée) :** Design → Voix → Tests
- Avantage : Design stable d'abord, debug voix ensuite
- Durée : 3h30

**Option B (Alternative) :** Voix → Design → Tests
- Avantage : Fix critique d'abord
- Risque : Si voix KO, debug long peut retarder design

**Mon choix :** **Option A** (plus méthodique)

---

## 📊 ESTIMATION TEMPS

| Phase | Durée | Commits | Deploys |
|-------|-------|---------|---------|
| Phase 1 : Design | 2h | 1 | 1 |
| Phase 2 : Voix | 1h | 1 | 1 |
| Phase 3 : Tests | 30min | 0 | 0 |
| **TOTAL** | **3h30** | **2** | **2** |

---

**VALIDATION UTILISATEUR REQUISE AVANT EXÉCUTION** ✋

**Questions :**
1. ✅ Option A (Design → Voix) ou Option B (Voix → Design) ?
2. ✅ Je commence maintenant ?

