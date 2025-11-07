# 🔍 AUDIT COMPLET - SPHÈRE JARVIS LANDING PAGE

**Date :** 2025-01-XX  
**Contexte :** Audit du fonctionnement de la sphère JARVIS sur la landing page (`/landing-client`)  
**Problèmes identifiés :** Timeout 2min au lieu de 5min, sensibilité micro faible, réponses en anglais ou à côté

---

## 📋 RÉSUMÉ EXÉCUTIF

### Problèmes Critiques Identifiés

1. **⏱️ TIMEOUT DE SESSION : 2 minutes au lieu de 5 minutes**
   - **Impact :** Expérience utilisateur dégradée, sessions coupées prématurément
   - **Cause :** Configuration hardcodée à 120 secondes dans 3 endroits
   - **Priorité :** P0 (CRITIQUE)

2. **🎤 SENSIBILITÉ MICROPHONE TRÈS FAIBLE**
   - **Impact :** JARVIS n'entend que la moitié des phrases
   - **Causes multiples :**
     - Sample rate incorrect (24000 Hz au lieu de 16000 Hz)
     - VAD threshold trop élevé (0.5)
     - Pas de configuration explicite de la langue dans `input_audio_transcription`
   - **Priorité :** P0 (CRITIQUE)

3. **🌍 RÉPONSES EN ANGLAIS OU À CÔTÉ DE LA PLAQUE**
   - **Impact :** Mauvaise expérience utilisateur, perte de crédibilité
   - **Causes :**
     - Pas de paramètre `language` dans `input_audio_transcription`
     - Pas de paramètre `modalities` pour forcer audio uniquement
     - Instructions en français mais pas de configuration explicite de langue
   - **Priorité :** P1 (MAJEUR)

---

## 🔬 ANALYSE TECHNIQUE DÉTAILLÉE

### 1️⃣ TIMEOUT DE SESSION (2 minutes)

#### Localisation du Problème

**Fichier 1 : `src/app/landing-client/page.tsx`**
```typescript
// Ligne 76
const [voiceTimeRemaining, setVoiceTimeRemaining] = useState(120);

// Ligne 103
maxDuration: 120

// Ligne 158
setVoiceTimeRemaining(120);
```

**Fichier 2 : `src/hooks/useVoiceVitrineChat.ts`**
```typescript
// Ligne 16
maxDuration = 120  // Valeur par défaut

// Ligne 29
const maxDurationRef = useRef(maxDuration)

// Lignes 432-443 : Vérification timeout
useEffect(() => {
  if (!isConnected || !sessionStartTimeRef.current) return

  const checkTimeout = () => {
    if (sessionStartTimeRef.current) {
      const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000
      if (elapsed >= maxDurationRef.current) {
        disconnect()
      }
    }
  }

  const interval = setInterval(checkTimeout, 1000)
  return () => clearInterval(interval)
}, [isConnected, disconnect])
```

#### Solution Recommandée

**Changer 120 → 300 secondes (5 minutes) dans :**
1. `src/app/landing-client/page.tsx` (3 occurrences)
2. `src/hooks/useVoiceVitrineChat.ts` (valeur par défaut)

**Code à modifier :**
```typescript
// landing-client/page.tsx
const [voiceTimeRemaining, setVoiceTimeRemaining] = useState(300); // 5 minutes
maxDuration: 300
setVoiceTimeRemaining(300);

// useVoiceVitrineChat.ts
maxDuration = 300  // 5 minutes par défaut
```

---

### 2️⃣ SENSIBILITÉ MICROPHONE FAIBLE

#### Problème 1 : Sample Rate Incorrect

**Fichier : `src/hooks/useVoiceVitrineChat.ts`**
```typescript
// Ligne 178 - PROBLÈME
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 24000, // ❌ INCORRECT - Trop élevé !
    channelCount: 1,
    latency: 0.01,
    volume: 1.0
  }
})
```

**Comparaison avec le kiosk (qui fonctionne) :**
```typescript
// src/hooks/useVoiceChat.ts (ligne 176)
sampleRate: 16000  // ✅ CORRECT - Standard OpenAI Realtime
```

**Impact :**
- Sample rate 24000 Hz peut causer des problèmes de compatibilité avec OpenAI Realtime API
- L'API attend du 16 kHz PCM16 mono
- Peut causer des problèmes de transcodage et perte de qualité

#### Problème 2 : VAD Threshold Trop Élevé

**Fichier : `src/lib/openai-config.ts`**
```typescript
// Ligne 132
threshold: 0.5,  // ⚠️ Peut être trop élevé pour certains micros
```

**Explication :**
- Threshold 0.5 = équilibré mais peut être trop strict pour micros moins sensibles
- Range : 0.0 (très sensible) à 1.0 (très sourd)
- Pour la vitrine, on peut réduire à 0.3-0.4 pour meilleure détection

#### Problème 3 : Pas de Configuration Langue dans Transcription

**Fichier : `src/lib/openai-config.ts`**
```typescript
// Lignes 294-296
input_audio_transcription: {
  model: OPENAI_CONFIG.session.transcriptionModel,
  // ❌ MANQUE : language: 'fr'
},
```

**Impact :**
- Sans paramètre `language`, Whisper peut détecter automatiquement la langue
- Peut causer des erreurs de détection (français → anglais)
- Peut réduire la précision de la transcription

#### Solution Recommandée

**1. Corriger le sample rate :**
```typescript
// useVoiceVitrineChat.ts ligne 178
sampleRate: 16000, // ✅ Standard OpenAI Realtime
```

**2. Réduire le VAD threshold pour vitrine :**
```typescript
// openai-config.ts - Ajouter dans getConfigForContext
turn_detection: {
  type: OPENAI_CONFIG.vad.type,
  threshold: isDemo ? 0.3 : OPENAI_CONFIG.vad.threshold, // Plus sensible pour vitrine
  // ...
}
```

**3. Ajouter la langue dans input_audio_transcription :**
```typescript
// openai-config.ts ligne 294
input_audio_transcription: {
  model: OPENAI_CONFIG.session.transcriptionModel,
  language: 'fr', // ✅ Forcer français
},
```

---

### 3️⃣ RÉPONSES EN ANGLAIS OU À CÔTÉ

#### Problème 1 : Pas de Paramètre `modalities`

**Fichier : `src/lib/openai-config.ts`**
```typescript
// getConfigForContext() - MANQUE
// Pas de paramètre modalities pour forcer audio uniquement
```

**Impact :**
- Sans `modalities`, OpenAI peut essayer d'utiliser d'autres modalités
- Peut causer des comportements inattendus

**Solution :**
```typescript
// Ajouter dans getConfigForContext()
modalities: ['audio'], // ✅ Forcer audio uniquement
```

#### Problème 2 : Instructions en Français mais Pas de Configuration Explicite

**Fichier : `src/app/api/voice/vitrine/session/route.ts`**
```typescript
// Lignes 45-86 : Instructions en français mais...
instructions: `Tu es JARVIS, l'assistant commercial EXPERT de JARVIS-GROUP.
// ... instructions en français ...
`,
```

**Problème :**
- Les instructions sont en français mais OpenAI peut ne pas détecter automatiquement
- Pas de configuration explicite de langue dans la session

**Solution :**
- Ajouter `language: 'fr'` dans la configuration de session (si supporté par l'API)
- S'assurer que les instructions mentionnent explicitement "Tu parles UNIQUEMENT en français"

#### Problème 3 : Pas de Validation de Langue dans les Réponses

**Impact :**
- Si OpenAI répond en anglais, aucune détection/redirection
- Pas de fallback pour forcer le français

**Solution Recommandée :**
```typescript
// Dans les instructions (route.ts)
instructions: `Tu es JARVIS, l'assistant commercial EXPERT de JARVIS-GROUP.

🚨 RÈGLE ABSOLUE : Tu parles UNIQUEMENT en français. JAMAIS en anglais.
Si tu détectes que tu commences à répondre en anglais, arrête-toi immédiatement et reformule en français.

// ... reste des instructions ...
`
```

---

## 📊 CONFIGURATION ACTUELLE vs RECOMMANDÉE

### Configuration Audio Actuelle

```typescript
// useVoiceVitrineChat.ts
{
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 24000,        // ❌ INCORRECT
  channelCount: 1,
  latency: 0.01,
  volume: 1.0
}
```

### Configuration Recommandée

```typescript
// useVoiceVitrineChat.ts
{
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 16000,        // ✅ Standard OpenAI
  channelCount: 1,
  latency: 0.01,
  volume: 1.0
}
```

### Configuration Session OpenAI Actuelle

```typescript
// openai-config.ts - getConfigForContext('vitrine')
{
  model: 'gpt-realtime-2025-08-28',
  voice: 'alloy',
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,              // ⚠️ Peut être trop élevé
    prefix_padding_ms: 300,
    silence_duration_ms: 1200,
    interrupt_response: true,
    create_response: true,
  },
  input_audio_transcription: {
    model: 'whisper-1',
    // ❌ MANQUE : language: 'fr'
  },
  temperature: 0.8,
  max_response_output_tokens: 4096,
  // ❌ MANQUE : modalities: ['audio']
}
```

### Configuration Recommandée

```typescript
// openai-config.ts - getConfigForContext('vitrine')
{
  model: 'gpt-realtime-2025-08-28',
  voice: 'alloy',
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  modalities: ['audio'],         // ✅ NOUVEAU : Forcer audio uniquement
  turn_detection: {
    type: 'server_vad',
    threshold: 0.3,              // ✅ RÉDUIT : Plus sensible pour vitrine
    prefix_padding_ms: 300,
    silence_duration_ms: 1200,
    interrupt_response: true,
    create_response: true,
  },
  input_audio_transcription: {
    model: 'whisper-1',
    language: 'fr',               // ✅ NOUVEAU : Forcer français
  },
  temperature: 0.8,
  max_response_output_tokens: 4096,
}
```

---

## 🎯 PLAN D'ACTION PRIORISÉ

### Phase 1 : Corrections Critiques (P0)

**1.1. Augmenter timeout à 5 minutes**
- [ ] Modifier `landing-client/page.tsx` (3 occurrences)
- [ ] Modifier `useVoiceVitrineChat.ts` (valeur par défaut)
- [ ] Tester que le timer affiche correctement 5:00

**1.2. Corriger sample rate microphone**
- [ ] Changer `sampleRate: 24000` → `16000` dans `useVoiceVitrineChat.ts`
- [ ] Tester la capture audio
- [ ] Vérifier que les transcripts sont plus complets

**1.3. Ajouter langue française dans transcription**
- [ ] Ajouter `language: 'fr'` dans `input_audio_transcription`
- [ ] Tester que les transcripts sont en français

### Phase 2 : Améliorations Majeures (P1)

**2.1. Réduire VAD threshold pour vitrine**
- [ ] Modifier `getConfigForContext()` pour utiliser threshold 0.3 pour vitrine
- [ ] Tester la sensibilité micro

**2.2. Ajouter paramètre `modalities`**
- [ ] Ajouter `modalities: ['audio']` dans la config
- [ ] Vérifier que cela n'affecte pas le fonctionnement

**2.3. Renforcer instructions français**
- [ ] Ajouter règle absolue "UNIQUEMENT en français" dans les instructions
- [ ] Tester que les réponses sont toujours en français

### Phase 3 : Optimisations (P2)

**3.1. Monitoring et logging**
- [ ] Ajouter logs pour détecter réponses en anglais
- [ ] Ajouter métriques de qualité audio
- [ ] Dashboard de monitoring vitrine

**3.2. Tests automatisés**
- [ ] Tests E2E pour vérifier timeout 5min
- [ ] Tests pour vérifier sensibilité micro
- [ ] Tests pour vérifier langue française

---

## 🔍 RECHERCHES OPENAI REALTIME API

### Documentation Officielle Consultée

**Paramètres Supportés (selon documentation OpenAI) :**

1. **`modalities`** : Array de strings
   - Valeurs possibles : `['audio']`, `['audio', 'text']`
   - **Recommandation :** Utiliser `['audio']` pour forcer audio uniquement

2. **`input_audio_transcription.language`** : String
   - Valeurs possibles : Code ISO 639-1 (ex: `'fr'`, `'en'`)
   - **Recommandation :** Toujours spécifier `'fr'` pour le français

3. **`turn_detection.threshold`** : Number (0.0 - 1.0)
   - **Recommandation :** 0.3-0.4 pour meilleure sensibilité
   - 0.5 peut être trop strict pour certains micros

4. **Sample Rate Microphone** : 
   - **Standard OpenAI Realtime :** 16 kHz PCM16 mono
   - **Recommandation :** Toujours utiliser 16000 Hz

### Best Practices Identifiées

1. **Toujours spécifier la langue** dans `input_audio_transcription`
2. **Utiliser sample rate 16 kHz** pour compatibilité maximale
3. **VAD threshold adaptatif** selon contexte (vitrine vs production)
4. **Forcer `modalities: ['audio']`** pour éviter comportements inattendus

---

## 📝 FICHIERS À MODIFIER

### Fichiers Critiques (P0)

1. **`src/app/landing-client/page.tsx`**
   - Ligne 76 : `useState(120)` → `useState(300)`
   - Ligne 103 : `maxDuration: 120` → `maxDuration: 300`
   - Ligne 158 : `setVoiceTimeRemaining(120)` → `setVoiceTimeRemaining(300)`

2. **`src/hooks/useVoiceVitrineChat.ts`**
   - Ligne 16 : `maxDuration = 120` → `maxDuration = 300`
   - Ligne 178 : `sampleRate: 24000` → `sampleRate: 16000`

3. **`src/lib/openai-config.ts`**
   - Ligne 294-296 : Ajouter `language: 'fr'` dans `input_audio_transcription`
   - Ligne 286-293 : Modifier `threshold` pour vitrine (0.3 au lieu de 0.5)
   - Ajouter `modalities: ['audio']` dans `getConfigForContext()`

### Fichiers Majeurs (P1)

4. **`src/app/api/voice/vitrine/session/route.ts`**
   - Ligne 45-86 : Renforcer instructions avec règle "UNIQUEMENT français"

---

## ✅ CHECKLIST DE VALIDATION

### Tests à Effectuer Après Corrections

- [ ] **Timeout 5 minutes**
  - [ ] Démarrer session
  - [ ] Vérifier que le timer commence à 5:00
  - [ ] Attendre 5 minutes
  - [ ] Vérifier que la session se termine automatiquement

- [ ] **Sensibilité micro**
  - [ ] Parler normalement (volume moyen)
  - [ ] Vérifier que JARVIS entend toutes les phrases
  - [ ] Parler plus doucement
  - [ ] Vérifier que JARVIS entend toujours

- [ ] **Langue française**
  - [ ] Poser une question en français
  - [ ] Vérifier que la réponse est en français
  - [ ] Vérifier que les transcripts sont en français
  - [ ] Tester plusieurs questions

- [ ] **Qualité générale**
  - [ ] Vérifier que JARVIS répond pertinemment
  - [ ] Vérifier que les réponses sont cohérentes
  - [ ] Vérifier qu'il n'y a pas de bugs visuels

---

## 🎓 RECOMMANDATIONS EXPERTES

### Configuration Optimale pour Vitrine

**Microphone :**
- Sample rate : **16 kHz** (standard OpenAI)
- Auto gain control : **Activé**
- Noise suppression : **Activé**
- Echo cancellation : **Activé**

**OpenAI Realtime Session :**
- Modalities : **`['audio']`** (forcer audio uniquement)
- Language : **`'fr'`** (français explicite)
- VAD threshold : **0.3** (plus sensible pour vitrine)
- Silence duration : **1200ms** (tolérant pour hésitations)

**Instructions :**
- Toujours inclure règle "UNIQUEMENT en français"
- Ton énergique et commercial
- Phrases courtes et percutantes

### Monitoring Recommandé

1. **Métriques à tracker :**
   - Durée moyenne des sessions
   - Taux de transcription complète
   - Taux de réponses en français vs anglais
   - Qualité audio (via logs OpenAI)

2. **Alertes à configurer :**
   - Sessions < 1 minute (problème probable)
   - Réponses en anglais détectées
   - Erreurs de transcription fréquentes

---

## 📚 RÉFÉRENCES

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Realtime API Reference](https://platform.openai.com/docs/api-reference/realtime)
- Configuration actuelle : `src/lib/openai-config.ts`
- Hook vitrine : `src/hooks/useVoiceVitrineChat.ts`
- API session vitrine : `src/app/api/voice/vitrine/session/route.ts`

---

**Rapport généré le :** 2025-01-XX  
**Auditeur :** Claude Sonnet 4.5  
**Statut :** ✅ Audit complet terminé


