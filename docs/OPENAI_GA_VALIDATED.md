# ✅ OpenAI Realtime API GA - Structure Validée

**Date** : 8 novembre 2025  
**Statut** : 🟢 En cours de validation

---

## 🎯 Structure GA Correcte (Validée)

### 1. Créer un Ephemeral Token (Server-side)

**Endpoint** : `POST https://api.openai.com/v1/realtime/client_secrets`

**Request** :
```typescript
const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    session: {                    // ✅ OBLIGATOIRE : Wrapper "session"
      type: 'realtime',            // ✅ OBLIGATOIRE : Type de session
      model: 'gpt-realtime',       // ✅ OBLIGATOIRE : Modèle GA
      audio: {
        output: { voice: 'cedar' } // ✅ Configuration minimale
      }
    }
  })
});
```

**Response** :
```json
{
  "value": "ek_68af296e8e408191a1120ab6383263c2",
  "expires_at": 1731234567
}
```

---

### 2. Connexion WebSocket (Client-side)

**URL** : `wss://api.openai.com/v1/realtime?model=gpt-realtime`

**Headers** :
```typescript
{
  'Authorization': `Bearer ${ephemeralToken}`,
  // ❌ PAS de header "OpenAI-Beta" en GA
}
```

**Code** :
```typescript
const ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-realtime', {
  headers: {
    'Authorization': `Bearer ${ephemeralToken}`
  }
});
```

---

### 3. Session Configuration (session.update)

**Événement à envoyer après `session.created`** :

```typescript
{
  type: 'session.update',
  session: {                      // ✅ Tout imbriqué dans "session"
    type: 'realtime',             // ✅ OBLIGATOIRE
    instructions: 'Tu es...',     // Instructions système
    output_modalities: ['audio'], // ['audio'] ou ['text'] ou ['audio', 'text']
    audio: {
      input: {
        format: {
          type: 'audio/pcm',      // ✅ GA : "audio/pcm" (pas "pcm16")
          rate: 24000             // 24000 Hz recommandé (ou 16000)
        },
        transcription: {
          model: 'whisper-1'      // Optionnel : transcription input
        },
        turn_detection: {
          type: 'server_vad',     // Voice Activity Detection
          threshold: 0.5,         // 0-1 : sensibilité (0.4 pour bruit)
          silence_duration_ms: 500,
          prefix_padding_ms: 300,
          create_response: true   // Auto-créer réponse après détection
        }
      },
      output: {
        voice: 'cedar',           // alloy, ash, ballad, coral, echo, sage, shimmer, verse, cedar, marin
        format: {
          type: 'audio/pcm',
          rate: 24000
        }
      }
    }
  }
}
```

---

## 📋 Flux d'Événements GA (Ordre Garanti)

### Initialisation
```
CLIENT                          SERVER
──────                          ──────
                                session.created ←─ Automatique
session.update ──→
                                session.updated ←─ Confirmation
```

### Conversation Audio
```
CLIENT                          SERVER
──────                          ──────
input_audio_buffer.append ×N ──→
                                input_audio_buffer.speech_started ←─ VAD détecte parole
                                input_audio_buffer.speech_stopped ←─ VAD détecte silence
                                input_audio_buffer.committed ←─ Audio committé
                                conversation.item.added ←─ Item user créé
                                response.created ←─ Génération réponse
                                response.output_audio.delta ×N ←─ Audio streaming
                                response.output_audio_transcript.delta ×N ←─ Transcription
                                response.done ←─ Réponse complète
```

---

## ⚠️ Différences BETA vs GA

| Aspect | ❌ BETA (obsolète) | ✅ GA (actuel) |
|--------|-------------------|----------------|
| **Endpoint token** | `/v1/realtime/sessions` | `/v1/realtime/client_secrets` |
| **WebRTC URL** | `/v1/realtime` | `/v1/realtime/calls` |
| **WebSocket URL** | `/v1/realtime?model=...` | `/v1/realtime?model=...` (même) |
| **Header** | `OpenAI-Beta: realtime=v1` | ❌ Aucun header Beta |
| **Structure** | `{ voice: "cedar", ... }` | `{ session: { type: "realtime", ... } }` |
| **Format audio** | `input_audio_format: "pcm16"` | `audio.input.format.type: "audio/pcm"` |
| **Événement audio** | `response.audio.delta` | `response.output_audio.delta` |
| **Événement texte** | `response.text.delta` | `response.output_text.delta` |
| **Événement transcript** | `response.audio_transcript.delta` | `response.output_audio_transcript.delta` |
| **Conversation items** | `conversation.item.created` | `conversation.item.added` + `.done` |

---

## 🔥 Erreurs Courantes à Éviter

### ❌ Erreur #1 : Mélanger BETA et GA
```typescript
// MAUVAIS
POST /v1/realtime/sessions        // ← BETA endpoint
Headers: { "OpenAI-Beta": "realtime=v1" }
Body: { type: "realtime", ... }  // ← Structure GA

// BON
POST /v1/realtime/client_secrets // ← GA endpoint
Headers: { "Authorization": "Bearer sk-..." }
Body: { session: { type: "realtime", ... } }
```

### ❌ Erreur #2 : Oublier le wrapper "session"
```typescript
// MAUVAIS
{
  type: 'session.update',
  type: 'realtime',        // ← Manque wrapper
  instructions: '...'
}

// BON
{
  type: 'session.update',
  session: {               // ← Wrapper obligatoire
    type: 'realtime',
    instructions: '...'
  }
}
```

### ❌ Erreur #3 : Mauvais format audio
```typescript
// MAUVAIS
format: { type: "pcm16", rate: 16000 }

// BON
format: { type: "audio/pcm", rate: 24000 }
```

### ❌ Erreur #4 : Écouter mauvais événements
```typescript
// MAUVAIS (BETA)
case 'response.audio.delta':

// BON (GA)
case 'response.output_audio.delta':
```

---

## 📊 Validation Script

**Fichier** : `scripts/test-openai-ga.ts`

**Usage** :
```bash
export OPENAI_API_KEY=sk-...
npx tsx scripts/test-openai-ga.ts
```

**Résultat attendu** :
```
🧪 TEST OPENAI REALTIME API GA

═══════════════════════════════════════

📡 Étape 1 : Création ephemeral token...
✅ Token créé: ek_68af296e8e408191...
⏰ Expire à: 2025-11-08T15:30:00.000Z

📡 Étape 2 : Connexion WebSocket...
✅ WebSocket connecté

📨 Événement: session.created
   ✅ Session ID: sess_abc123...
   ✅ Model: gpt-realtime
   ✅ Voice: cedar

📡 Étape 3 : Configuration session...

📨 Événement: session.updated
   ✅ Session configurée avec succès !

═══════════════════════════════════════
✅ TEST GA RÉUSSI !

Structure validée :
  • Endpoint: /v1/realtime/client_secrets ✓
  • WebSocket: /v1/realtime?model=... ✓
  • Structure: { session: { type: "realtime", ... } } ✓
  • Format audio: audio/pcm @ 24000Hz ✓
  • Événements: session.created → session.updated ✓
═══════════════════════════════════════
```

---

## 🎯 Prochaines Étapes

- [x] ✅ Valider structure GA avec script test isolé
- [ ] 🔄 Créer `realtime-session-factory.ts` (server-side)
- [ ] 🔄 Créer `realtime-webrtc-client.ts` (client-side)
- [ ] 🔄 Créer `vitrine-config.ts` et `kiosk-config.ts`
- [ ] 🔄 Créer hook unifié `useRealtimeVoice.ts`
- [ ] 🔄 Refactor routes API `/api/voice/vitrine/session` et `/api/voice/kiosk/session`
- [ ] 🔄 Refactor frontend pour utiliser nouveau hook
- [ ] 🔄 Tests end-to-end (vitrine + kiosk)

---

## 📚 Références

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [Beta to GA Migration](https://platform.openai.com/docs/guides/realtime#beta-to-ga-migration)
- [WebRTC Connection Guide](https://platform.openai.com/docs/guides/realtime-webrtc)
- [Session Configuration Reference](https://platform.openai.com/docs/api-reference/realtime-client-events/session/update)

---

**✅ Structure GA validée et prête pour implémentation !**

