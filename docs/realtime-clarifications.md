# Clarification de la Documentation GPT Realtime API

## 🎯 Problème principal : Structure Beta vs GA

OpenAI a **modifié la structure de l'API** entre la version Beta et la version GA en Août 2025. Voici les différences **critiques** à comprendre.

---

## BETA vs GA : Les changements majeurs

### 1️⃣ Structure de session

#### ❌ BETA (ancien - ne plus utiliser)
```json
{
  "type": "session.update",
  "voice": "alloy",
  "instructions": "...",
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16"
}
```

#### ✅ GA (nouveau - UTILISEZ CECI)
```json
{
  "type": "session.update",
  "session": {
    "type": "realtime",
    "instructions": "...",
    "voice": "cedar",
    "audio": {
      "input": {
        "format": { "type": "audio/pcm", "rate": 24000 },
        "transcription": { "model": "whisper-1" },
        "turn_detection": {
          "type": "server_vad",
          "threshold": 0.5,
          "silence_duration_ms": 500,
          "prefix_padding_ms": 300
        }
      },
      "output": {
        "voice": "cedar",
        "format": { "type": "audio/pcm", "rate": 24000 }
      }
    }
  }
}
```

**Clé importante**: Tout est maintenant **imbriqué dans l'objet `session`**

---

### 2️⃣ Types d'événements

#### Flux complet GA simplifié

```
CLIENT → SERVER                    SERVER → CLIENT
─────────────────────────────────────────────────
                                  session.created
session.update
                                  session.updated
                                  
input_audio_buffer.append  ×N     input_audio_buffer.committed
                                  conversation.item.created
                                  
                                  input_audio_buffer.speech_stopped
response.create
                                  response.created
                                  response.output_item.added
                                  response.content_part.added
                                  response.output_audio.delta  ×N
                                  response.output_audio_transcript.delta  ×N
                                  response.done
```

---

## 💡 Explication détaillée des événements critiques

### Session Management

#### `session.created`
```json
{
  "type": "session.created",
  "session": {
    "id": "sess_abc123...",
    "object": "realtime.session",
    "created_at": 1725000000,
    "expires_at": 1725003600,
    "instructions": "Tu es...",
    "voice": "cedar",
    "modalities": ["audio"],
    "audio": {
      "input": { "format": { "type": "audio/pcm", "rate": 24000 } },
      "output": { "voice": "cedar", "format": { "type": "audio/pcm", "rate": 24000 } }
    }
  }
}
```
**À faire**: Enregistrez `session.id` pour logging/monitoring

#### `session.updated`
```json
{
  "type": "session.updated",
  "session": { /* configuration actuelle */ }
}
```
**À faire**: Vérifier que tous les paramètres sont corrects

---

### Audio Input Pipeline

#### `input_audio_buffer.append` (CLIENT → SERVER)
```json
{
  "type": "input_audio_buffer.append",
  "audio": "SGVsbG8gV29ybGQ="  // Base64 PCM16 audio
}
```
**Timing**: Envoyez toutes les ~40-100ms (4096 samples @ 24kHz)

#### `input_audio_buffer.committed` (SERVER → CLIENT)
```json
{
  "type": "input_audio_buffer.committed",
  "previous_item_id": null
}
```
**Meaning**: L'audio a été reçu et traité comme input utilisateur

#### `input_audio_buffer.speech_started` (SERVER → CLIENT)
```json
{
  "type": "input_audio_buffer.speech_started"
}
```
**Utilité**: Déclencher feedbacks visuels (pulsation rouge microphone)

#### `input_audio_buffer.speech_stopped` (SERVER → CLIENT)
```json
{
  "type": "input_audio_buffer.speech_stopped"
}
```
**Utilité**: Préparer affichage réponse

---

### Conversation & Response

#### `conversation.item.created` (SERVER → CLIENT)
```json
{
  "type": "conversation.item.created",
  "item": {
    "id": "item_abc123",
    "type": "message",
    "role": "user",
    "content": [
      {
        "type": "input_audio",
        "transcript": "Quelle heure est le cours de spinning"
      }
    ]
  }
}
```
**Signification**: Vous avez reçu et enregistré la question utilisateur

#### `response.create` (CLIENT → SERVER)
```json
{
  "type": "response.create",
  "response": {
    "modalities": ["audio"],
    "instructions": null
  }
}
```
**Quand**: Après `input_audio_buffer.committed` - demande réponse IA

#### `response.output_audio.delta` (SERVER → CLIENT)
```json
{
  "type": "response.output_audio.delta",
  "delta": "//NExAAAAAABIAQA..."  // Base64 PCM16
}
```
**Action**: Décoder et jouer immédiatement (streaming audio)

#### `response.output_audio_transcript.delta` (SERVER → CLIENT)
```json
{
  "type": "response.output_audio_transcript.delta",
  "transcript": "Le cours de spinning"
}
```
**Action**: Afficher en sous-titre/transcription sur miroir

#### `response.done` (SERVER → CLIENT)
```json
{
  "type": "response.done",
  "response": {
    "id": "resp_xyz789",
    "object": "realtime.response",
    "status": "completed",
    "output": [
      {
        "id": "item_xyz",
        "type": "message",
        "role": "assistant",
        "content": [
          {
            "type": "output_audio",
            "transcript": "Le cours de spinning commence à 18h",
            "audio": "//NExAAAAAABIAQA..."
          }
        ]
      }
    ]
  }
}
```
**Signification**: Réponse complète - prête pour nouvelle question

---

## ⚠️ Erreurs courantes à éviter

### ❌ Erreur #1 : Mélanger Beta et GA
```javascript
// MAUVAIS
{
  "type": "session.update",
  "voice": "cedar",           // ← GA
  "input_audio_format": "pcm16"  // ← Beta
}

// BON
{
  "type": "session.update",
  "session": {
    "voice": "cedar",
    "audio": {
      "input": { "format": { "type": "audio/pcm", "rate": 24000 } }
    }
  }
}
```

### ❌ Erreur #2 : URL avec beta header
```javascript
// MAUVAIS
const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
headers: { "OpenAI-Beta": "realtime=v1" }

// BON (GA)
const url = "wss://api.openai.com/v1/realtime?model=gpt-realtime";
// OpenAI-Beta header optionnel
```

### ❌ Erreur #3 : Attendre que session.created avant update
```javascript
// MAUVAIS
ws.onopen = () => {
  ws.send(sessionUpdate);
  // puis update ...
}

// BON
ws.onopen = () => {
  // OpenAI créé session automatiquement
  // Attendre session.created
}

ws.onmessage = (event) => {
  if (event.type === "session.created") {
    ws.send(sessionUpdate);  // maintenant update
  }
}
```

### ❌ Erreur #4 : Format audio incorrect
```javascript
// MAUVAIS
const pcm16 = new Int8Array(audio);    // ← 8-bit
const rate = 16000;                    // ← Standard, pas optimal

// BON
const pcm16 = new Int16Array(audio);   // ← 16-bit signed
const rate = 24000;                    // ← Meilleure qualité
```

---

## 🔧 Configuration recommandée pour miroir de salle de sport

### Paramètres VAD ajustés pour bruit ambiant

```json
{
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.4,                  // Bas = moins sensible au bruit
    "silence_duration_ms": 800,        // Haut = pause plus longue
    "prefix_padding_ms": 300,
    "create_response": true
  }
}
```

| Paramètre | Salle quiet | Salle bruyante | Explication |
|-----------|-------------|----------------|-------------|
| threshold | 0.5 | 0.3 | Évite faux positifs avec musique |
| silence_duration_ms | 400 | 800 | Phrase complète avant réponse |
| prefix_padding_ms | 300 | 300 | Constant (latence acceptable) |

---

## 📊 Structure complète réelle vs documentation

### Ce que la doc montre (confus)
```
"Les événements peuvent être session.created OU session.updated"
```

### Ce qui se passe réellement (ordre garanti)
```
1. Connection WebSocket établie
2. OpenAI envoie automatiquement: session.created
3. Vous envoyez: session.update
4. OpenAI répond: session.updated
5. Prêt pour: input_audio_buffer.append
```

---

## 🚀 Checklist de déploiement

- [ ] Utiliser URL: `wss://api.openai.com/v1/realtime?model=gpt-realtime`
- [ ] Configuration GA (pas Beta)
- [ ] Audio: PCM16, 24kHz, Mono
- [ ] Turn detection: server_vad avec threshold=0.4 (bruit)
- [ ] Ephemeral tokens (pas d'API key en frontend)
- [ ] Gestion d'erreurs WebSocket + reconnect
- [ ] Logging complet (session ID, timestamps)
- [ ] Testing: Tester avec phrases bruyantes
- [ ] Monitoring: Alertes latence > 2s

---

## 📚 Documentation officielles à consulter

1. **Migration Beta→GA**: 
   https://platform.openai.com/docs/guides/realtime#beta-to-ga-migration

2. **Session configuration**:
   https://platform.openai.com/docs/guides/realtime/recommended-session-configuration

3. **API Reference complet**:
   https://platform.openai.com/docs/api-reference/realtime

4. **Realtime Conversation Guide**:
   https://platform.openai.com/docs/guides/realtime/realtime-conversations

---

## 🐛 Debugging tips

### Test WebSocket brut avec curl
```bash
# Ne fonctionne pas en curl (WS), mais montre la structure
curl -X GET "https://api.openai.com/v1/realtime" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "OpenAI-Beta: realtime=v1"
```

### Logs structurés pour debugging
```javascript
const logEvent = (event) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: event.type,
    session_id: event.session?.id || "unknown",
    payload_size: JSON.stringify(event).length,
    // audio_delta: event.delta ? event.delta.substring(0, 20) + "..." : null
  }, null, 2));
};
```

### Reconnection strategy
```javascript
const MAX_RETRIES = 5;
let retryCount = 0;

ws.onclose = () => {
  if (retryCount < MAX_RETRIES) {
    setTimeout(() => {
      console.log(`Reconnecting... (${++retryCount}/${MAX_RETRIES})`);
      mirror.initialize();
    }, Math.pow(2, retryCount) * 1000); // Exponential backoff
  } else {
    console.error("Max retries reached - manual intervention needed");
  }
};
```

---

## 💰 Pricing clarity (Nov 2025)

```
gpt-realtime pricing:
- Input audio:  $32 / 1M tokens
- Output audio: $64 / 1M tokens

Estimation pour 1 interaction (moyenne 10s):
- Input: ~10s = ~300 tokens = $0.0096
- Output: ~10s = ~600 tokens = $0.0384
- TOTAL par interaction: ~$0.048 (~5 centimes)

50 utilisateurs/jour × 2 interactions = 100 interactions
= $4.80/jour = $144/mois
```

---

## Conclusion

La doc officielle d'OpenAI a des lacunes car l'API est très récente (GA seulement depuis Août 2025). Ce guide comble les gaps. **Utilisez ce document + la doc officielle**, pas l'un ou l'autre seul.

**Questions principales résolues**:
1. ✅ Structure GA (objet `session` imbriqué)
2. ✅ Flux événements (session.created → session.update → audio)
3. ✅ Configuration VAD (threshold 0.4 pour bruit)
4. ✅ Format audio (PCM16 24kHz obligatoire)
5. ✅ Erreurs courantes (Beta vs GA, format)
