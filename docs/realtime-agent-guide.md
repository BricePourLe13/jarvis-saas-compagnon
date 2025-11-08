# Guide Complet : Agent Vocal GPT Realtime pour Miroir Numérique en Salle de Sport

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Configuration de l'API](#configuration-de-lapi)
4. [Implémentation pratique](#implémentation-pratique)
5. [Gestion de l'audio](#gestion-de-laudio)
6. [Déploiement](#déploiement)
7. [Bonnes pratiques](#bonnes-pratiques)

---

## Vue d'ensemble

### Modèle à utiliser
- **Modèle**: `gpt-realtime` (dernière version GA - Août 2025)
- **Type de connexion**: WebSocket ou WebRTC
- **Latence**: Sub-seconde (< 1s)
- **Format audio**: PCM16 à 24 kHz ou 16 kHz

### Avantages du gpt-realtime
- **Précision accrue**: 66.5% accuracy en function calling (vs 49.7% avant)
- **Naturalité vocale**: Meilleure expressivité et intonation
- **Nouvelles voix**: Cedar et Marin (exclusives)
- **Prix optimisé**: 20% moins cher que la version précédente
- **Appels asynchrones**: Les fonctions longues n'interrompent pas la conversation

---

## Architecture du système

```
┌─────────────────────────────────────────────────┐
│         MIROIR NUMÉRIQUE (Frontend)             │
│  ┌───────────────┐          ┌────────────────┐  │
│  │ Microphone    │          │  Haut-parleurs │  │
│  │ (Capture)    │◄────────►│  (Playback)    │  │
│  └───────────────┘          └────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
                   │ WebSocket (WSS)
                   │ Audio PCM 16-bit
                   ▼
┌─────────────────────────────────────────────────┐
│        OPENAI REALTIME API (Backend)            │
│  ┌──────────────────────────────────────────┐   │
│  │  gpt-realtime Model                      │   │
│  │  - Speech-to-Speech                      │   │
│  │  - Function Calling                      │   │
│  │  - Multi-language Support                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│        SERVICES BACKEND (Optionnel)             │
│  - Authentification adhérents                   │
│  - Données de fitness                           │
│  - Historique d'entraînement                    │
│  - Intégrations MCP                             │
└─────────────────────────────────────────────────┘
```

---

## Configuration de l'API

### 1. Authentication & Connexion

#### Option A: WebSocket Direct (Serveur)
```javascript
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-realtime";

const url = `wss://api.openai.com/v1/realtime?model=${MODEL}`;

const ws = new WebSocket(url, {
  headers: {
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
    "OpenAI-Beta": "realtime=v1",
  },
});

ws.on("open", () => {
  console.log("✅ Connecté à OpenAI Realtime API");
});
```

#### Option B: Ephemeral Token (Client)
Pour une utilisation directe dans le miroir sans exposer la clé API:

```javascript
// Sur le serveur backend
app.post("/session", async (req, res) => {
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "gpt-realtime" }),
  });
  
  const data = await response.json();
  res.json({
    client_secret: data.client_secret.value, // 1 min expiration
  });
});

// Dans le miroir (frontend)
const sessionData = await fetch("/session").then(r => r.json());
const ws = new WebSocket(
  `wss://api.openai.com/v1/realtime?model=gpt-realtime`,
  [
    "realtime",
    `openai-insecure-api-key.${sessionData.client_secret}`
  ]
);
```

### 2. Configuration de Session

La **configuration critique** pour votre cas d'usage (salle de sport):

```json
{
  "type": "session.update",
  "session": {
    "type": "realtime",
    "instructions": "Tu es un assistant vocal pour une salle de sport. Tu aides les adhérents avec leurs questions sur les équipements, les cours, les horaires. Réponds en français, sois amical et enthousiaste. Garde tes réponses concises (< 30 secondes de parole).",
    "voice": "cedar",
    "output_modalities": ["audio"],
    "audio": {
      "input": {
        "format": {
          "type": "audio/pcm",
          "rate": 24000
        },
        "transcription": {
          "model": "whisper-1"
        },
        "turn_detection": {
          "type": "server_vad",
          "threshold": 0.5,
          "prefix_padding_ms": 300,
          "silence_duration_ms": 500,
          "create_response": true
        }
      },
      "output": {
        "voice": "cedar",
        "format": {
          "type": "audio/pcm",
          "rate": 24000
        }
      }
    }
  }
}
```

#### Paramètres clés expliqués
| Paramètre | Valeur | Explication |
|-----------|--------|-------------|
| `voice` | cedar/marin | Voix pour les réponses (cedar meilleur pour FR) |
| `threshold` | 0.5 | Sensibilité VAD (0-1: 0.5 = équilibre bruit/sensibilité) |
| `silence_duration_ms` | 500 | Temps de silence avant fin de tour |
| `prefix_padding_ms` | 300 | Padding audio avant détection (< latence) |
| `rate` | 24000 Hz | Qualité audio (24kHz meilleur que 16kHz) |

---

## Implémentation pratique

### Architecture TypeScript/JavaScript

```typescript
import WebSocket from "ws";

interface RealtimeSession {
  instructions: string;
  voice: "cedar" | "marin";
  modalities: string[];
  audio: {
    input: { format: { type: string; rate: number } };
    output: { voice: string; format: { type: string; rate: number } };
  };
}

class VoiceAgentMirror {
  private ws: WebSocket;
  private audioQueue: Uint8Array[] = [];
  private audioContext: AudioContext;
  private mediaRecorder: MediaRecorder;

  async initialize() {
    // 1. Connexion WebSocket
    const sessionToken = await this.getEphemeralToken();
    this.ws = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=gpt-realtime`,
      ["realtime", `openai-insecure-api-key.${sessionToken}`]
    );

    this.ws.onopen = () => this.setupSession();
    this.ws.onmessage = (event) => this.handleServerEvent(JSON.parse(event.data));
    this.ws.onerror = (error) => console.error("WebSocket error:", error);

    // 2. Configuration audio
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    await this.audioContext.resume();

    // 3. Capture microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.startAudioCapture(stream);
  }

  private setupSession() {
    const sessionConfig = {
      type: "session.update",
      session: {
        type: "realtime",
        instructions: "Tu es un assistant vocal pour une salle de sport...",
        voice: "cedar",
        output_modalities: ["audio"],
        audio: {
          input: {
            format: { type: "audio/pcm", rate: 24000 },
            transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
              create_response: true,
            },
          },
          output: {
            voice: "cedar",
            format: { type: "audio/pcm", rate: 24000 },
          },
        },
      },
    };

    this.ws.send(JSON.stringify(sessionConfig));
  }

  private startAudioCapture(stream: MediaStream) {
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(processor);
    processor.connect(this.audioContext.destination);

    processor.onaudioprocess = (event) => {
      const audioData = event.inputBuffer.getChannelData(0);
      const pcm16 = this.float32ToPCM16(audioData);
      const base64Audio = this.arrayBufferToBase64(pcm16);

      // Envoyer à OpenAI
      this.ws.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio,
        })
      );
    };
  }

  private handleServerEvent(event: any) {
    switch (event.type) {
      case "session.created":
        console.log("✅ Session créée:", event.session.id);
        break;

      case "response.output_audio.delta":
        // Audio de réponse à jouer
        const audioData = Buffer.from(event.delta, "base64");
        this.playAudio(audioData);
        break;

      case "response.output_audio_transcript.delta":
        console.log("📝 Réponse:", event.delta);
        break;

      case "response.done":
        console.log("✅ Réponse complète");
        break;

      case "input_audio_buffer.speech_started":
        console.log("🎤 Utilisateur commence à parler");
        break;

      case "error":
        console.error("❌ Erreur API:", event.error);
        break;
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer) {
    const audioBuffer_web = this.audioContext.createBuffer(
      1,
      audioBuffer.byteLength / 2,
      24000
    );
    const channelData = audioBuffer_web.getChannelData(0);
    const view = new Int16Array(audioBuffer);

    for (let i = 0; i < view.length; i++) {
      channelData[i] = view[i] / 32768.0;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer_web;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  private float32ToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      pcm16[i] = Math.max(-1, Math.min(1, float32Array[i])) * 0x7fff;
    }
    return pcm16;
  }

  private arrayBufferToBase64(buffer: Int16Array): string {
    const bytes = new Uint8Array(buffer.buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async getEphemeralToken(): Promise<string> {
    const response = await fetch("/api/session", { method: "POST" });
    const data = await response.json();
    return data.client_secret;
  }
}

// Utilisation
const mirror = new VoiceAgentMirror();
await mirror.initialize();
```

### Implementation Python (Agents SDK)

```python
import asyncio
from agents.realtime import RealtimeAgent, RealtimeRunner

async def main():
    # Créer l'agent
    agent = RealtimeAgent(
        name="Assistant Fitness",
        instructions="""Tu es un assistant vocal pour une salle de sport.
Tu aides les adhérents avec:
- Informations sur les équipements
- Horaires des cours
- Conseils fitness
- Réservations de cours

Réponds toujours en français, sois amical et enthousiaste.
Garde tes réponses courtes (< 30 secondes de parole).""",
    )

    # Configuration runner
    runner = RealtimeRunner(
        starting_agent=agent,
        config={
            "model_settings": {
                "model_name": "gpt-realtime",
                "voice": "cedar",
                "modalities": ["audio"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {"model": "whisper-1"},
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "silence_duration_ms": 500,
                    "prefix_padding_ms": 300,
                },
            }
        },
    )

    # Démarrer session
    session = await runner.run()
    async with session:
        print("🎤 Agent vocal prêt - Miroir de fitness actif")
        async for event in session:
            if event.type == "agent_start":
                print(f"✅ {event.agent.name} a démarré")
            elif event.type == "audio_end":
                print("✅ Réponse vocale terminée")
            elif event.type == "error":
                print(f"❌ Erreur: {event.error}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Gestion de l'audio

### Format audio recommandé
- **PCM16** (16-bit signed little-endian)
- **24 kHz** (qualité supérieure, recommandé)
- **Mono** (1 channel)
- **Buffer size**: 4096 samples ≈ 170ms

### Pipeline audio complète

```
Microphone
    ↓
[Audio Worklet / ScriptProcessor]
    ↓
Float32 → PCM16 Conversion
    ↓
Base64 Encoding
    ↓
WebSocket Send
    ↓
─────────────────────
    ↓
WebSocket Receive (base64 audio)
    ↓
Base64 Decoding
    ↓
PCM16 → Float32 Conversion
    ↓
Audio Buffer Creation
    ↓
Audio Context Play
    ↓
Haut-parleurs
```

### Optimisation latence pour miroir
```javascript
// ⚠️ CRITIQUE: Timing pour salle de sport
const AUDIO_CHUNK_SIZE = 2048; // ~85ms @ 24kHz (compromis)
const VAD_SILENCE_MS = 500; // Détecte fin de phrase
const VAD_THRESHOLD = 0.4; // Moins sensible au bruit ambiant

// Configuration agressive pour environnement bruyant
{
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.4,  // < bruit ambiant
    "silence_duration_ms": 500,  // > pause naturelle
    "prefix_padding_ms": 300,
    "create_response": true,
    "interrupt_response": true  // Interrupte si l'user parle
  }
}
```

---

## Déploiement

### Architecture recommandée

```
┌─────────────────────────────────────────────┐
│        Miroir Numérique (Kiosk)             │
│  - Écran tactile 24"                        │
│  - Raspberry Pi 5 / Mini PC                 │
│  - Microphone + Haut-parleurs               │
│  - Electron App (TypeScript/React)          │
└─────────────┬───────────────────────────────┘
              │ WiFi/Ethernet
              ▼
┌─────────────────────────────────────────────┐
│    Serveur Backend (VPS/Cloud)              │
│  - Node.js Express                          │
│  - Token ephemeral generation               │
│  - Authentification adhérents               │
│  - Logging & Monitoring                     │
└─────────────┬───────────────────────────────┘
              │ HTTPS
              ▼
        OpenAI API (wss://)
```

### Variables d'environnement
```bash
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-... (optionnel)
MIRROR_LOCATION=gym-paris-main-floor
API_BACKEND_URL=https://api.gym.local
LOG_LEVEL=info
SESSION_TIMEOUT=3600
```

### Docker Compose (Backend)
```yaml
version: '3.8'
services:
  backend:
    image: node:18-alpine
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
    command: npm start

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
```

---

## Bonnes pratiques

### 1. Gestion des erreurs
```javascript
ws.on("error", (error) => {
  console.error("❌ Erreur WebSocket:", error);
  // Reconnecter après 5 secondes
  setTimeout(() => mirror.reconnect(), 5000);
});

// Timeout de session (60 min max par API)
setTimeout(() => {
  ws.close();
  mirror.initialize(); // Nouvelle session
}, 60 * 60 * 1000);
```

### 2. Contrôle du volume/Feedback utilisateur
```javascript
// Afficher sur l'écran du miroir pendant la réponse
{
  "type": "response.output_audio_transcript.delta",
  "transcript": "Je vous recommande les haltères..."
}
// → Afficher le texte en temps réel sous-titrage

// Indicateurs visuels
- Pulsation rouge: microphone actif
- Onde verte: réponse en cours
- Coche bleue: réponse reçue
```

### 3. Multilangue (salle internationale)
```javascript
// Détecter la langue et adapter
const systemPrompt = language === "fr" 
  ? "Tu es un assistant français..."
  : language === "es"
  ? "Eres un asistente español..."
  : "You are an English assistant...";
```

### 4. Security
```javascript
// ✅ DO: Token éphémère (1 min expiration)
const ephemeralToken = await getEphemeralToken(); // Backend route

// ❌ DON'T: Clé API exposée en frontend
// const ws = new WebSocket(..., ["openai-insecure-api-key.sk-..."])

// Valider entrées utilisateur
if (userInput.length > 500) {
  console.warn("❌ Input trop long - possible injection");
}
```

### 5. Monitoring & Analytics
```javascript
const metrics = {
  sessionStart: Date.now(),
  messagesCount: 0,
  totalDuration: 0,
  errors: [],
};

// Logger pour chaque interaction
console.log({
  timestamp: new Date().toISOString(),
  location: "gym-paris-main",
  userQuery: event.transcript,
  responseTime: Date.now() - startTime,
  confidence: event.confidence,
});
```

### 6. Optimisation coût
```javascript
// Pricing (Nov 2025): $32/1M input + $64/1M output tokens (audio)
// = ~$0.003 par minute pour 50 utilisateurs/jour

// Réduire coûts:
// 1. Compression audio (G.711)
// 2. Cache de réponses fréquentes
// 3. Batch processing off-peak
// 4. Cleanup sessions toutes les heures
```

---

## Resources utiles

- **Doc officielle**: https://platform.openai.com/docs/guides/realtime
- **Agents SDK**: https://github.com/openai/openai-agents-sdk
- **Migration Beta→GA**: https://platform.openai.com/docs/guides/realtime#beta-to-ga-migration
- **Exemples GitHub**: https://github.com/openai/openai-realtime-agents
- **Community**: Discord OpenAI Developers

---

## Prochaines étapes

1. ✅ Tester connexion WebSocket avec curl
2. ✅ Capturer audio microphone et l'encoder PCM16
3. ✅ Implémenter boucle événementielle complète
4. ✅ Tester avec phrases courtes (< 5s)
5. ✅ Déployer sur miroir de test
6. ✅ Calibrer paramètres VAD pour bruit ambiant
7. ✅ Intégrer base de données adhérents
8. ✅ Ajouter tracking analytics
