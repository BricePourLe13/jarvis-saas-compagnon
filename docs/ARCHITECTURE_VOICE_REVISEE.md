# 🏗️ ARCHITECTURE VOICE SYSTEM - VERSION RÉVISÉE

**Date :** 2025-01-XX  
**Contexte :** Révision après analyse approfondie des différences kiosk vs vitrine

---

## ✅ RECONNAISSANCE : LA SÉPARATION EST JUSTIFIÉE

### Différences Critiques Identifiées

#### 🏋️ **KIOSK (Production - Cœur Métier)**

**Objectif :** Service opérationnel pour adhérents réels

**Caractéristiques :**
- ✅ **Authentification membre** : badge_id + gymSlug → profil complet DB
- ✅ **Tracking complet** : conversation_events, analytics membre, coûts
- ✅ **RAG context** : member_facts, historique conversations, préférences
- ✅ **Instructions personnalisées** : adaptées au profil membre (goals, injuries, etc.)
- ✅ **Function calling complexe** : réservations, alertes équipe, gestion réclamations
- ✅ **Inactivity timeout** : 45s (détection churn, engagement)
- ✅ **Logging complet** : kioskLogger, realtimeClientInjector, métriques
- ✅ **Gestion erreurs avancée** : retry, reconnexion, fallback
- ✅ **Session DB** : enregistrement avec relation membre/gym

**Exemple de code spécifique :**
```typescript
// useVoiceChat.ts
- Récupération profil membre depuis DB
- Enregistrement session avec member_id + gym_id
- Injection RAG context (member_facts, conversation_history)
- Instructions personnalisées selon profil
- Tools JARVIS complets (reserve_coach, alert_staff, etc.)
- Tracking conversation_events en temps réel
- Inactivity timeout avec gestion engagement
```

#### 🎯 **VITRINE (Démo Commerciale - Conversion)**

**Objectif :** Convaincre prospects, vendre la solution

**Caractéristiques :**
- ✅ **Session anonyme** : pas de badge_id, pas de DB tracking membre
- ✅ **Limitation IP** : crédits (5min/jour, 15min total)
- ✅ **Instructions commerciales** : ton énergique, vente, ROI
- ✅ **Function calling simplifié** : expert commercial (ROI, success stories)
- ✅ **Timeout fixe** : 5 minutes (démo contrôlée)
- ✅ **Pas de RAG** : contexte générique knowledge base
- ✅ **Pas de logging membre** : tracking IP uniquement
- ✅ **Gestion erreurs basique** : affichage message, pas de retry complexe

**Exemple de code spécifique :**
```typescript
// useVoiceVitrineChat.ts
- Création session démo anonyme
- Vérification limite IP (vitrineIPLimiter)
- Instructions commerciales génériques
- Tools expert commercial (calculate_roi, get_success_stories)
- Timeout fixe 5min
- Pas de DB tracking membre
- Pas de RAG context
```

---

## 🔍 ANALYSE : CE QUI EST VRAIMENT COMMUN

### Code Commun (≈350 lignes)

**WebRTC & Audio :**
- Création RTCPeerConnection
- Configuration getUserMedia (microphone)
- Gestion audio playback (audioElement)
- Gestion data channel (oai-events)
- Parsing messages OpenAI (response.created, response.done, etc.)
- Nettoyage ressources (close, cleanup)

**Messages OpenAI Standard :**
- `input_audio_buffer.speech_started`
- `input_audio_buffer.speech_stopped`
- `response.created`
- `response.done`
- `response.audio.delta`
- `conversation.item.input_audio_transcription.completed`
- `error`

### Code Spécifique (≈370 lignes kiosk + ≈106 lignes vitrine)

**Kiosk uniquement :**
- Création session avec badge_id + gymSlug
- Récupération profil membre (DB)
- Enregistrement session DB
- RAG context injection
- Instructions personnalisées
- Function calling complexe (tools JARVIS)
- Tracking conversation_events
- Inactivity timeout (45s)
- Logging avancé (kioskLogger, realtimeClientInjector)

**Vitrine uniquement :**
- Création session anonyme
- Vérification limite IP
- Instructions commerciales génériques
- Function calling simplifié (expert commercial)
- Timeout fixe (5min)
- Pas de DB tracking

---

## 🎯 ARCHITECTURE RECOMMANDÉE : ABSTRACTION + SÉPARATION

### Principe : **Abstraction Commune + Implémentations Spécifiques**

**Ne PAS fusionner** les deux hooks (besoins trop différents)  
**MAIS** extraire le code commun dans une abstraction réutilisable

### Structure Proposée

```
lib/
  ├── voice/
  │   ├── useVoiceRealtimeCore.ts      ← Code commun WebRTC/audio (350 lignes)
  │   ├── voice-session-factory.ts     ← Factory pour créer sessions (kiosk vs vitrine)
  │   └── voice-message-handler.ts     ← Parsing messages OpenAI commun
  │
hooks/
  ├── useVoiceChat.ts                  ← Wrapper kiosk (≈100 lignes)
  │   └── Utilise useVoiceRealtimeCore + logique kiosk spécifique
  │
  └── useVoiceVitrineChat.ts           ← Wrapper vitrine (≈50 lignes)
      └── Utilise useVoiceRealtimeCore + logique vitrine spécifique
```

### Hook Core Commun (`useVoiceRealtimeCore.ts`)

```typescript
// lib/voice/useVoiceRealtimeCore.ts
interface VoiceRealtimeCoreConfig {
  // Configuration session (créée par factory)
  sessionFactory: () => Promise<VoiceSession>
  
  // Callbacks génériques
  onStatusChange?: (status: VoiceStatus) => void
  onTranscriptUpdate?: (transcript: string) => void
  onError?: (error: Error) => void
  
  // Configuration audio
  audioConfig?: AudioConfig
}

export function useVoiceRealtimeCore(config: VoiceRealtimeCoreConfig) {
  // ✅ CODE COMMUN (350 lignes)
  // - WebRTC setup
  // - Audio playback
  // - Data channel
  // - Message parsing
  // - Cleanup
  
  // ❌ PAS de logique métier spécifique
  // ❌ PAS de DB tracking
  // ❌ PAS de RAG context
  // ❌ PAS de function calling spécifique
}
```

### Factory Sessions (`voice-session-factory.ts`)

```typescript
// lib/voice/voice-session-factory.ts
export interface VoiceSessionFactory {
  createSession(): Promise<VoiceSession>
}

export class KioskSessionFactory implements VoiceSessionFactory {
  constructor(
    private gymSlug: string,
    private badgeId: string
  ) {}
  
  async createSession(): Promise<VoiceSession> {
    // ✅ Logique spécifique kiosk
    // - Récupération profil membre
    // - RAG context
    // - Instructions personnalisées
    // - Tools JARVIS
    // - Enregistrement DB
  }
}

export class VitrineSessionFactory implements VoiceSessionFactory {
  constructor(
    private clientIP: string
  ) {}
  
  async createSession(): Promise<VoiceSession> {
    // ✅ Logique spécifique vitrine
    // - Vérification limite IP
    // - Instructions commerciales
    // - Tools expert commercial
    // - Pas de DB tracking
  }
}
```

### Hook Kiosk (Wrapper)

```typescript
// hooks/useVoiceChat.ts
export function useVoiceChat(config: VoiceChatConfig) {
  // ✅ Factory spécifique kiosk
  const sessionFactory = useMemo(() => 
    new KioskSessionFactory(config.gymSlug, config.badgeId),
    [config.gymSlug, config.badgeId]
  )
  
  // ✅ Utilise le core commun
  const core = useVoiceRealtimeCore({
    sessionFactory,
    onStatusChange: config.onStatusChange,
    onTranscriptUpdate: (transcript, isFinal) => {
      // ✅ Logique spécifique kiosk
      // - Tracking conversation_events
      // - Injection RAG
      config.onTranscriptUpdate?.(transcript, isFinal)
    },
    onError: config.onError,
  })
  
  // ✅ Logique spécifique kiosk
  // - Inactivity timeout
  // - Function calling complexe
  // - Logging avancé
  
  return {
    ...core,
    // Expose méthodes spécifiques kiosk si besoin
  }
}
```

### Hook Vitrine (Wrapper)

```typescript
// hooks/useVoiceVitrineChat.ts
export function useVoiceVitrineChat(config: VoiceVitrineConfig) {
  // ✅ Factory spécifique vitrine
  const sessionFactory = useMemo(() => 
    new VitrineSessionFactory(getClientIP()),
    []
  )
  
  // ✅ Utilise le core commun
  const core = useVoiceRealtimeCore({
    sessionFactory,
    onStatusChange: config.onStatusChange,
    onTranscriptUpdate: config.onTranscriptUpdate,
    onError: config.onError,
  })
  
  // ✅ Logique spécifique vitrine
  // - Timeout fixe 5min
  // - Function calling simplifié
  // - Pas de tracking DB
  
  return {
    ...core,
    // Expose méthodes spécifiques vitrine si besoin
  }
}
```

---

## 📊 COMPARAISON : ACTUEL vs RECOMMANDÉ

### Architecture Actuelle

```
useVoiceChat.ts (720 lignes)
  ├─ Code WebRTC commun (350 lignes) ❌ DUPLIQUÉ
  └─ Code spécifique kiosk (370 lignes)

useVoiceVitrineChat.ts (456 lignes)
  ├─ Code WebRTC commun (350 lignes) ❌ DUPLIQUÉ
  └─ Code spécifique vitrine (106 lignes)

Total : 1176 lignes
Duplication : 350 lignes (≈30%)
```

### Architecture Recommandée

```
useVoiceRealtimeCore.ts (350 lignes)
  └─ Code WebRTC commun ✅ UNIQUE

KioskSessionFactory.ts (150 lignes)
  └─ Logique création session kiosk ✅ SÉPARÉ

VitrineSessionFactory.ts (80 lignes)
  └─ Logique création session vitrine ✅ SÉPARÉ

useVoiceChat.ts (100 lignes)
  └─ Wrapper kiosk + logique spécifique ✅ SÉPARÉ

useVoiceVitrineChat.ts (50 lignes)
  └─ Wrapper vitrine + logique spécifique ✅ SÉPARÉ

Total : 730 lignes
Duplication : 0 lignes ✅
```

**Gain :** -38% de code, séparation claire maintenue, maintenance facilitée.

---

## ✅ AVANTAGES DE CETTE ARCHITECTURE

### 1. Séparation Métier Respectée

✅ **Kiosk** : Logique production isolée, pas de pollution  
✅ **Vitrine** : Logique commerciale isolée, pas de pollution  
✅ **Core** : Code technique commun, pas de logique métier

### 2. Maintenance Facilitée

✅ **Bug WebRTC** : Corriger une fois dans `useVoiceRealtimeCore`  
✅ **Bug kiosk** : Corriger dans `useVoiceChat` uniquement  
✅ **Bug vitrine** : Corriger dans `useVoiceVitrineChat` uniquement

### 3. Tests Simplifiés

✅ **Tests core** : Mock factory, tester WebRTC isolément  
✅ **Tests kiosk** : Mock core, tester logique métier kiosk  
✅ **Tests vitrine** : Mock core, tester logique métier vitrine

### 4. Évolutivité

✅ **Nouveau contexte** : Créer nouvelle factory + wrapper  
✅ **Nouvelle feature core** : Ajouter dans `useVoiceRealtimeCore`  
✅ **Nouvelle feature kiosk** : Ajouter dans `useVoiceChat`

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Extraction Core (2-3h)

1. **Créer `useVoiceRealtimeCore.ts`**
   - Extraire code WebRTC commun
   - Extraire parsing messages OpenAI
   - Interface générique avec factory

2. **Créer `voice-session-factory.ts`**
   - Interface `VoiceSessionFactory`
   - `KioskSessionFactory` (déplacer logique kiosk)
   - `VitrineSessionFactory` (déplacer logique vitrine)

### Phase 2 : Refactoring Hooks (2h)

3. **Refactorer `useVoiceChat.ts`**
   - Utiliser `useVoiceRealtimeCore`
   - Utiliser `KioskSessionFactory`
   - Garder logique spécifique kiosk

4. **Refactorer `useVoiceVitrineChat.ts`**
   - Utiliser `useVoiceRealtimeCore`
   - Utiliser `VitrineSessionFactory`
   - Garder logique spécifique vitrine

### Phase 3 : Tests & Validation (1h)

5. **Tests**
   - Tester kiosk (scénario complet)
   - Tester vitrine (scénario complet)
   - Vérifier pas de régression

**Total : 5-6h de travail**  
**Gain :** -38% de code, séparation maintenue, maintenance facilitée

---

## 🔴 PROBLÈMES RESTANTS (À CORRIGER)

### 1. Timeout Multi-Sources (BUG POTENTIEL)

**Problème :** Timer dans `landing-client/page.tsx` + vérification dans hook  
**Solution :** Hook expose `timeRemaining`, page utilise celui-ci

### 2. Pas de Retry Automatique

**Problème :** Erreur réseau = session morte  
**Solution :** Ajouter retry dans `useVoiceRealtimeCore` (optionnel par factory)

### 3. Configuration Microphone Hardcodée

**Problème :** Paramètres audio hardcodés dans hooks  
**Solution :** Centraliser dans `openai-config.ts` (microphone config)

---

## 💡 VERDICT FINAL RÉVISÉ

### Ce qui est OK

✅ **Séparation kiosk/vitrine** : Justifiée et nécessaire  
✅ **Stack technique** : WebRTC + OpenAI Realtime = bon choix  
✅ **Configuration centralisée** : Bonne base

### Ce qui doit changer

🔴 **Duplication code commun** : Extraire dans `useVoiceRealtimeCore`  
🟡 **Timeout multi-sources** : Source de vérité unique  
🟡 **Pas de retry** : Ajouter dans core (optionnel)

### Recommandation

**Refactorer progressivement :**
1. ✅ Corrections critiques (FAIT)
2. 🔴 Extraire core commun (5-6h) → **GAIN MAJEUR**
3. 🟡 Fix timeout multi-sources (1h)
4. 🟡 Ajouter retry (1h)

**Estimation totale :** 7-8h  
**Gain :** -38% de code, séparation maintenue, maintenance facilitée

---

## 🎓 CONCLUSION

**La séparation kiosk/vitrine est JUSTIFIÉE et doit être MAINTENUE.**

**MAIS** le code commun (WebRTC, audio) doit être extrait dans une abstraction pour éviter duplication.

**Architecture recommandée :**
- ✅ Core commun (`useVoiceRealtimeCore`)
- ✅ Factories spécifiques (`KioskSessionFactory`, `VitrineSessionFactory`)
- ✅ Wrappers légers (`useVoiceChat`, `useVoiceVitrineChat`)

**Résultat :** Séparation métier respectée + code commun réutilisé + maintenance facilitée.

---

**Rapport généré le :** 2025-01-XX  
**Statut :** Architecture révisée, recommandation clarifiée ✅

