# 📋 PLAN MÉTHODIQUE - REFACTORING VOICE SYSTEM

**Date :** 2025-01-XX  
**Objectif :** Extraire code commun sans casser l'existant  
**Approche :** Méthodique, étape par étape, avec vérifications à chaque étape

---

## 🔍 PHASE 0 : ANALYSE EXHAUSTIVE DES DÉPENDANCES

### ✅ Analyse Complétée

#### **useVoiceChat (Kiosk) - Utilisé dans :**
1. `src/components/kiosk/VoiceInterface.tsx`
2. `src/app/kiosk/[slug]/page.tsx` (probablement indirectement)

**Interface exposée (utilisée par VoiceInterface.tsx) :**
```typescript
{
  audioState: AudioState,              // ✅ UTILISÉ
  isConnected: boolean,                // ✅ UTILISÉ
  status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'reconnecting', // ✅ UTILISÉ
  currentTranscript: string,           // ✅ UTILISÉ
  connectionQuality: any,              // ⚠️ EXPOSÉ mais non utilisé dans VoiceInterface
  reconnectAttempts: number,          // ⚠️ EXPOSÉ mais non utilisé dans VoiceInterface
  connect: () => Promise<void>,       // ✅ UTILISÉ
  disconnect: () => Promise<void>,     // ✅ UTILISÉ
  sendTextMessage: (text: string) => void, // ⚠️ EXPOSÉ mais non utilisé dans VoiceInterface
  forceReconnect: () => void,          // ✅ UTILISÉ (bouton réessayer)
  getCurrentSessionId: () => string | undefined, // ✅ UTILISÉ (fermeture session)
  resetInactivityTimeout: () => void   // ⚠️ EXPOSÉ mais non utilisé dans VoiceInterface
}
```

**Callbacks utilisés :**
- `onStatusChange` : Callback pour changement de statut
- `onTranscriptUpdate` : Callback pour transcripts (text, isFinal)
- `onError` : Callback pour erreurs (GOODBYE_DETECTED, INACTIVITY_TIMEOUT)
- `onSessionCreated` : Callback pour création session

#### **useVoiceVitrineChat (Vitrine) - Utilisé dans :**
1. `src/app/landing-client/page.tsx`
2. `src/components/vitrine/VoiceVitrineInterface.tsx`

**Interface exposée :**
```typescript
{
  isConnected: boolean,                 // ✅ UTILISÉ
  error: string | null,                // ✅ UTILISÉ
  currentTranscript: string,           // ✅ UTILISÉ
  isAISpeaking: boolean,               // ✅ UTILISÉ
  connect: () => Promise<{remainingCredits?: number}>, // ✅ UTILISÉ (retourne remainingCredits)
  disconnect: () => Promise<void>      // ✅ UTILISÉ
}
```

**Callbacks utilisés :**
- `onStatusChange` : Callback pour changement de statut
- `onTranscriptUpdate` : Callback pour transcripts (string uniquement)

---

## 🎯 STRATÉGIE : PRÉSERVER LES INTERFACES EXISTANTES

### Principe Fondamental

**❌ NE JAMAIS CHANGER** les interfaces publiques des hooks existants  
**✅ EXTRACTION** du code commun dans un core réutilisable  
**✅ WRAPPERS** qui utilisent le core mais gardent les mêmes interfaces

### Code Commun Identifié (≈350 lignes)

**WebRTC Setup :**
- Création RTCPeerConnection
- Configuration getUserMedia
- Gestion audio playback (audioElement)
- Gestion data channel (oai-events)
- Parsing messages OpenAI standards
- Nettoyage ressources

**Messages OpenAI Communs :**
- `input_audio_buffer.speech_started`
- `input_audio_buffer.speech_stopped`
- `response.created`
- `response.done`
- `response.audio.delta`
- `response.audio.done`
- `conversation.item.input_audio_transcription.completed`
- `error`

### Code Spécifique (DOIT RESTER SÉPARÉ)

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
- `sendTextMessage`
- `forceReconnect`
- `getCurrentSessionId`
- `resetInactivityTimeout`
- `audioState` (objet complexe)

**Vitrine uniquement :**
- Création session anonyme
- Vérification limite IP
- Instructions commerciales génériques
- Function calling simplifié (expert commercial)
- Timeout fixe (5min)
- Pas de DB tracking
- `error` (string | null) au lieu de callback
- `isAISpeaking` (boolean) au lieu de `audioState`

---

## 📐 ARCHITECTURE CIBLE (DÉTAILLÉE)

### Structure des Fichiers

```
lib/voice/
  ├── useVoiceRealtimeCore.ts         ← Core commun (nouveau)
  ├── voice-session-factory.ts        ← Factories (nouveau)
  └── types.ts                        ← Types communs (nouveau)

hooks/
  ├── useVoiceChat.ts                 ← Wrapper kiosk (modifié)
  └── useVoiceVitrineChat.ts          ← Wrapper vitrine (modifié)
```

### Interface Core (`useVoiceRealtimeCore.ts`)

```typescript
interface VoiceRealtimeCoreConfig {
  // Factory pour créer la session (spécifique au contexte)
  sessionFactory: () => Promise<VoiceSession>
  
  // Configuration audio
  audioConfig?: {
    sampleRate?: number
    echoCancellation?: boolean
    noiseSuppression?: boolean
    autoGainControl?: boolean
  }
  
  // Callbacks génériques
  onStatusChange?: (status: VoiceStatus) => void
  onTranscriptUpdate?: (transcript: string, isFinal?: boolean) => void
  onError?: (error: Error) => void
  
  // Callbacks spécifiques (optionnels)
  onAudioStateChange?: (state: AudioState) => void  // Pour kiosk
  onFunctionCall?: (call: FunctionCall) => void   // Pour kiosk/vitrine
  onSessionCreated?: (sessionId: string) => void  // Pour kiosk
}

interface VoiceRealtimeCoreReturn {
  // États communs
  isConnected: boolean
  status: VoiceStatus
  
  // Actions communes
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Utilitaires communs
  getDataChannel: () => RTCDataChannel | null
  getPeerConnection: () => RTCPeerConnection | null
  getSessionId: () => string | null
}
```

### Interface Factory (`voice-session-factory.ts`)

```typescript
interface VoiceSession {
  client_secret: { value: string } | string
  session_id: string
  expires_at: string
}

interface VoiceSessionFactory {
  createSession(): Promise<VoiceSession>
}

class KioskSessionFactory implements VoiceSessionFactory {
  constructor(
    private gymSlug: string,
    private badgeId: string,
    private language: string
  ) {}
  
  async createSession(): Promise<VoiceSession> {
    // Logique actuelle de useVoiceChat.createSession()
  }
}

class VitrineSessionFactory implements VoiceSessionFactory {
  async createSession(): Promise<VoiceSession> {
    // Logique actuelle de useVoiceVitrineChat.createDemoSession()
  }
}
```

---

## 🛠️ PLAN D'IMPLÉMENTATION ÉTAPE PAR ÉTAPE

### ÉTAPE 1 : Créer les Types Communs (SANS MODIFIER L'EXISTANT)

**Fichier :** `lib/voice/types.ts` (NOUVEAU)

**Actions :**
- [ ] Définir `VoiceStatus` type
- [ ] Définir `VoiceSession` interface
- [ ] Définir `VoiceSessionFactory` interface
- [ ] Définir `AudioState` type (si pas déjà dans types/kiosk)

**Vérification :**
- ✅ Aucun fichier existant modifié
- ✅ Types compatibles avec l'existant
- ✅ Pas de breaking changes

**Risque :** ⚪ TRÈS FAIBLE (nouveau fichier)

---

### ÉTAPE 2 : Créer les Factories (SANS MODIFIER L'EXISTANT)

**Fichier :** `lib/voice/voice-session-factory.ts` (NOUVEAU)

**Actions :**
- [ ] Créer `KioskSessionFactory` (copier logique de `useVoiceChat.createSession`)
- [ ] Créer `VitrineSessionFactory` (copier logique de `useVoiceVitrineChat.createDemoSession`)
- [ ] Tester que les factories fonctionnent isolément

**Vérification :**
- ✅ Aucun fichier existant modifié
- ✅ Factories testables isolément
- ✅ Pas de breaking changes

**Risque :** ⚪ TRÈS FAIBLE (nouveau fichier, code copié)

---

### ÉTAPE 3 : Créer le Core Commun (SANS MODIFIER L'EXISTANT)

**Fichier :** `lib/voice/useVoiceRealtimeCore.ts` (NOUVEAU)

**Actions :**
- [ ] Extraire code WebRTC commun de `useVoiceChat`
- [ ] Extraire code WebRTC commun de `useVoiceVitrineChat`
- [ ] Créer hook `useVoiceRealtimeCore` avec interface générique
- [ ] Tester le core isolément avec mocks

**Code à extraire :**
- Création RTCPeerConnection (lignes similaires)
- Configuration getUserMedia (lignes similaires)
- Gestion audio playback (lignes similaires)
- Gestion data channel (lignes similaires)
- Parsing messages OpenAI standards (lignes similaires)
- Nettoyage ressources (lignes similaires)

**Vérification :**
- ✅ Aucun fichier existant modifié
- ✅ Core testable isolément
- ✅ Interface générique (pas de logique métier)

**Risque :** ⚪ FAIBLE (nouveau fichier, code extrait)

---

### ÉTAPE 4 : Refactorer useVoiceChat (GARDER INTERFACE IDENTIQUE)

**Fichier :** `hooks/useVoiceChat.ts` (MODIFIÉ)

**Actions :**
- [ ] Importer `useVoiceRealtimeCore`
- [ ] Importer `KioskSessionFactory`
- [ ] Remplacer code WebRTC par appel à `useVoiceRealtimeCore`
- [ ] **GARDER** toute la logique spécifique kiosk :
  - `audioState` (objet complexe)
  - `resetInactivityTimeout`
  - `handleFunctionCall` (tools JARVIS)
  - `sendTextMessage`
  - `forceReconnect`
  - `getCurrentSessionId`
  - Tracking conversation_events
  - RAG injection
- [ ] **GARDER** l'interface publique identique

**Vérification :**
- ✅ Interface publique identique (même retour)
- ✅ Tous les callbacks fonctionnent
- ✅ Logique spécifique kiosk préservée
- ✅ Tests kiosk passent

**Risque :** 🟡 MOYEN (modification hook existant)

**Tests requis :**
- [ ] Test VoiceInterface.tsx fonctionne
- [ ] Test kiosk page fonctionne
- [ ] Test function calling fonctionne
- [ ] Test inactivity timeout fonctionne

---

### ÉTAPE 5 : Refactorer useVoiceVitrineChat (GARDER INTERFACE IDENTIQUE)

**Fichier :** `hooks/useVoiceVitrineChat.ts` (MODIFIÉ)

**Actions :**
- [ ] Importer `useVoiceRealtimeCore`
- [ ] Importer `VitrineSessionFactory`
- [ ] Remplacer code WebRTC par appel à `useVoiceRealtimeCore`
- [ ] **GARDER** toute la logique spécifique vitrine :
  - `error` (string | null)
  - `isAISpeaking` (boolean)
  - Timeout fixe (5min)
  - Function calling simplifié (expert commercial)
- [ ] **GARDER** l'interface publique identique

**Vérification :**
- ✅ Interface publique identique (même retour)
- ✅ Tous les callbacks fonctionnent
- ✅ Logique spécifique vitrine préservée
- ✅ Tests vitrine passent

**Risque :** 🟡 MOYEN (modification hook existant)

**Tests requis :**
- [ ] Test landing-client/page.tsx fonctionne
- [ ] Test VoiceVitrineInterface.tsx fonctionne
- [ ] Test timeout 5min fonctionne
- [ ] Test function calling vitrine fonctionne

---

### ÉTAPE 6 : Tests de Non-Régression

**Tests à Effectuer :**

**Kiosk :**
- [ ] Connexion session avec badge_id
- [ ] Transcription utilisateur fonctionne
- [ ] Réponses JARVIS fonctionnent
- [ ] Function calling (tools JARVIS) fonctionne
- [ ] Inactivity timeout (45s) fonctionne
- [ ] Détection "au revoir" fonctionne
- [ ] Tracking conversation_events fonctionne
- [ ] `forceReconnect` fonctionne
- [ ] `getCurrentSessionId` fonctionne
- [ ] `audioState` exposé correctement

**Vitrine :**
- [ ] Connexion session anonyme fonctionne
- [ ] Limitation IP fonctionne
- [ ] Transcription utilisateur fonctionne
- [ ] Réponses JARVIS fonctionnent
- [ ] Function calling (expert commercial) fonctionne
- [ ] Timeout 5min fonctionne
- [ ] `error` exposé correctement
- [ ] `isAISpeaking` exposé correctement
- [ ] `remainingCredits` retourné par connect()

---

## ⚠️ POINTS D'ATTENTION CRITIQUES

### 1. Interface useVoiceChat DOIT RESTER IDENTIQUE

**Problème potentiel :** Si on change l'interface, `VoiceInterface.tsx` casse

**Solution :** 
- ✅ Garder exactement la même interface
- ✅ Utiliser le core en interne uniquement
- ✅ Exposer les mêmes propriétés/méthodes

### 2. Interface useVoiceVitrineChat DOIT RESTER IDENTIQUE

**Problème potentiel :** Si on change l'interface, `landing-client/page.tsx` et `VoiceVitrineInterface.tsx` cassent

**Solution :**
- ✅ Garder exactement la même interface
- ✅ Utiliser le core en interne uniquement
- ✅ Exposer les mêmes propriétés/méthodes

### 3. Callbacks DOIVENT FONCTIONNER IDENTIQUEMENT

**Problème potentiel :** Si les callbacks changent de signature ou timing, les composants cassent

**Solution :**
- ✅ Garder exactement les mêmes signatures
- ✅ Appeler aux mêmes moments
- ✅ Passer les mêmes paramètres

### 4. Function Calling DOIT RESTER SÉPARÉ

**Problème potentiel :** Si on fusionne les function calls, on perd la séparation métier

**Solution :**
- ✅ Garder `handleFunctionCall` dans chaque hook
- ✅ Core ne gère PAS les function calls
- ✅ Core expose juste `onFunctionCall` callback

### 5. Timeout DOIT RESTER SÉPARÉ

**Problème potentiel :** Kiosk a inactivity timeout (45s), vitrine a timeout fixe (5min)

**Solution :**
- ✅ Core ne gère PAS les timeouts
- ✅ Chaque hook gère son propre timeout
- ✅ Core expose juste les hooks nécessaires

---

## 🔄 STRATÉGIE DE ROLLBACK

### Si Problème Détecté

**Étape 1 :** Identifier le problème
- [ ] Quel hook est cassé ?
- [ ] Quelle fonctionnalité ne marche plus ?
- [ ] Quels tests échouent ?

**Étape 2 :** Rollback immédiat
- [ ] `git revert` du commit problématique
- [ ] Vérifier que l'existant fonctionne
- [ ] Analyser la cause du problème

**Étape 3 :** Correction
- [ ] Corriger le problème identifié
- [ ] Re-tester complètement
- [ ] Re-commiter

---

## ✅ CHECKLIST FINALE

### Avant de Commencer

- [x] Analyse exhaustive des dépendances complétée
- [x] Plan détaillé créé
- [x] Interfaces existantes documentées
- [x] Points d'attention identifiés

### Pendant l'Implémentation

- [ ] Créer types communs (étape 1)
- [ ] Créer factories (étape 2)
- [ ] Créer core (étape 3)
- [ ] Refactorer useVoiceChat (étape 4)
- [ ] Refactorer useVoiceVitrineChat (étape 5)
- [ ] Tests non-régression (étape 6)

### Après l'Implémentation

- [ ] Tous les tests kiosk passent
- [ ] Tous les tests vitrine passent
- [ ] Aucune régression détectée
- [ ] Code review effectuée
- [ ] Documentation mise à jour

---

## 📊 ESTIMATION

**Temps estimé :** 6-8h
- Étape 1 (types) : 30min
- Étape 2 (factories) : 1h
- Étape 3 (core) : 2-3h
- Étape 4 (useVoiceChat) : 1-2h
- Étape 5 (useVoiceVitrineChat) : 1h
- Étape 6 (tests) : 1h

**Risque global :** 🟡 MOYEN (modifications sur hooks existants)

**Mitigation :**
- ✅ Plan détaillé étape par étape
- ✅ Vérifications à chaque étape
- ✅ Tests de non-régression
- ✅ Rollback possible à tout moment

---

**Plan créé le :** 2025-01-XX  
**Statut :** ✅ Prêt pour implémentation méthodique

