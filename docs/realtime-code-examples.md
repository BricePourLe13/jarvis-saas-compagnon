# Code Examples - Agent Vocal Realtime (Prêt à utiliser)

## 📚 Contenu

1. [Serveur Backend - Token Ephemeral](#serveur-backend---token-éphémère)
2. [Frontend Web - Miroir](#frontend-web---miroir-numérique)
3. [Python avec Agents SDK](#python-avec-agents-sdk)
4. [Tests & Debugging](#tests--debugging)

---

## Serveur Backend - Token Éphémère

### Express.js + Node.js

```javascript
// backend/server.js
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📌 Route pour générer token éphémère (1 min expiration)
app.post("/api/session", async (req, res) => {
  try {
    const session = await openai.realtime.sessions.create({
      model: "gpt-realtime",
      voice: "cedar",
    });

    // ✅ Répondre avec token court-durée
    res.json({
      client_secret: session.client_secret.value,
      expires_at: session.client_secret.expires_at,
      session_id: session.id,
    });
  } catch (error) {
    console.error("❌ Erreur création session:", error);
    res.status(500).json({ error: "Session creation failed" });
  }
});

// 📌 Route pour logging (sécurité)
app.post("/api/log", (req, res) => {
  const { event, session_id, error } = req.body;
  console.log({
    timestamp: new Date().toISOString(),
    event,
    session_id,
    error,
  });
  res.json({ logged: true });
});

// 📌 Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend Realtime API server running on port ${PORT}`);
});
```

**Lancer**:
```bash
export OPENAI_API_KEY=sk-...
npm install express cors openai
node backend/server.js
```

---

## Frontend Web - Miroir Numérique

### HTML + TypeScript (Electron ou Browser)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Vocal - Salle de Sport</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .mirror-container {
      width: 100%;
      max-width: 800px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      text-align: center;
    }
    
    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
    }
    
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ccc;
      transition: all 0.3s;
    }
    
    .status-dot.connected {
      background: #4ade80;
      box-shadow: 0 0 10px #4ade80;
    }
    
    .status-dot.listening {
      background: #ef4444;
      animation: pulse 1s infinite;
    }
    
    .status-dot.responding {
      background: #3b82f6;
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .voice-indicator {
      width: 200px;
      height: 200px;
      margin: 30px auto;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;
    }
    
    .voice-indicator.active {
      animation: wave 0.8s infinite;
    }
    
    @keyframes wave {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .transcript {
      min-height: 60px;
      font-size: 18px;
      color: #333;
      line-height: 1.6;
      margin: 20px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 10px;
    }
    
    .transcript.empty {
      color: #aaa;
      font-style: italic;
    }
    
    .button-group {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 30px;
    }
    
    button {
      padding: 12px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5568d3;
      transform: scale(1.05);
    }
    
    .btn-secondary {
      background: #e5e7eb;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #d1d5db;
    }
  </style>
</head>
<body>
  <div class="mirror-container">
    <h1>🏋️ Agent Fitness Vocal</h1>
    
    <div class="status">
      <div class="status-dot" id="statusDot"></div>
      <span id="statusText">Connexion...</span>
    </div>
    
    <div class="voice-indicator" id="voiceIndicator">
      🎤
    </div>
    
    <div class="transcript empty" id="transcript">
      Posez votre question...
    </div>
    
    <div class="button-group">
      <button class="btn-primary" id="resetBtn">Nouvelle question</button>
      <button class="btn-secondary" id="debugBtn">Debug (console)</button>
    </div>
  </div>

  <script type="module">
    // ============================================
    // REALTIME VOICE AGENT - FRONTEND
    // ============================================
    
    // Configuration
    const CONFIG = {
      API_BASE: "http://localhost:3000",
      MODEL: "gpt-realtime",
      VOICE: "cedar",
      SAMPLE_RATE: 24000,
      VAD_THRESHOLD: 0.4, // Bas pour bruit ambiant
      CHUNK_SIZE: 4096,
    };
    
    // État global
    const state = {
      ws: null,
      audioContext: null,
      audioProcessor: null,
      audioOutput: null,
      sessionId: null,
      isConnected: false,
      isListening: false,
      isResponding: false,
      sessionToken: null,
    };
    
    // ========== UTILS ==========
    const UI = {
      statusDot: document.getElementById("statusDot"),
      statusText: document.getElementById("statusText"),
      voiceIndicator: document.getElementById("voiceIndicator"),
      transcript: document.getElementById("transcript"),
      resetBtn: document.getElementById("resetBtn"),
      debugBtn: document.getElementById("debugBtn"),
      
      updateStatus(status, text) {
        this.statusDot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
      },
      
      setTranscript(text, isUser = false) {
        this.transcript.textContent = text;
        this.transcript.classList.toggle("empty", !text);
      },
      
      setVoiceActive(active) {
        this.voiceIndicator.classList.toggle("active", active);
      },
    };
    
    const Logger = {
      log(...args) {
        console.log("[Realtime Agent]", ...args);
      },
      error(...args) {
        console.error("[Realtime Agent]", ...args);
      },
      warn(...args) {
        console.warn("[Realtime Agent]", ...args);
      },
      
      async logServer(event, error = null) {
        try {
          await fetch(`${CONFIG.API_BASE}/api/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event,
              session_id: state.sessionId,
              error,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.error("Logging failed:", e);
        }
      },
    };
    
    // ========== AUDIO ==========
    const Audio = {
      float32ToPCM16(float32Array) {
        const pcm16 = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Array[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return pcm16;
      },
      
      arrayBufferToBase64(buffer) {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      },
      
      base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      },
      
      async initContext() {
        if (state.audioContext) return;
        
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: CONFIG.SAMPLE_RATE,
        });
        await state.audioContext.resume();
        Logger.log("✅ Audio context initialized");
      },
      
      async initMicrophone() {
        await this.initContext();
        
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false, // ⚠️ Important pour VAD
          },
        });
        
        const source = state.audioContext.createMediaStreamSource(stream);
        const processor = state.audioContext.createScriptProcessor(CONFIG.CHUNK_SIZE, 1, 1);
        
        processor.onaudioprocess = (event) => {
          if (!state.isConnected || state.ws.readyState !== WebSocket.OPEN) return;
          
          const float32 = event.inputBuffer.getChannelData(0);
          const pcm16 = this.float32ToPCM16(float32);
          const base64 = this.arrayBufferToBase64(pcm16.buffer);
          
          state.ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64,
          }));
        };
        
        source.connect(processor);
        processor.connect(state.audioContext.destination);
        
        Logger.log("✅ Microphone initialized");
      },
      
      initAudioOutput() {
        state.audioOutput = {
          buffers: [],
          isPlaying: false,
          source: null,
        };
        Logger.log("✅ Audio output initialized");
      },
      
      playAudio(base64Audio) {
        const buffer = this.base64ToArrayBuffer(base64Audio);
        const audioBuffer = state.audioContext.createBuffer(
          1,
          buffer.byteLength / 2,
          CONFIG.SAMPLE_RATE
        );
        
        const data = audioBuffer.getChannelData(0);
        const view = new Int16Array(buffer);
        for (let i = 0; i < view.length; i++) {
          data[i] = view[i] / 32768.0;
        }
        
        const source = state.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(state.audioContext.destination);
        source.start(0);
      },
    };
    
    // ========== WEBSOCKET ==========
    const Realtime = {
      async connect() {
        try {
          // 1. Récupérer token éphémère
          const response = await fetch(`${CONFIG.API_BASE}/api/session`, {
            method: "POST",
          });
          const data = await response.json();
          state.sessionToken = data.client_secret;
          state.sessionId = data.session_id;
          
          Logger.log("✅ Session token obtenu:", state.sessionId);
          
          // 2. Établir WebSocket
          const url = `wss://api.openai.com/v1/realtime?model=${CONFIG.MODEL}`;
          state.ws = new WebSocket(url, [
            "realtime",
            `openai-insecure-api-key.${state.sessionToken}`,
          ]);
          
          state.ws.onopen = () => this.onOpen();
          state.ws.onmessage = (event) => this.onMessage(JSON.parse(event.data));
          state.ws.onerror = (error) => this.onError(error);
          state.ws.onclose = () => this.onClose();
          
        } catch (error) {
          Logger.error("❌ Connection failed:", error);
          Logger.logServer("connection_failed", error.message);
          UI.updateStatus("disconnected", "Erreur connexion");
        }
      },
      
      onOpen() {
        Logger.log("✅ WebSocket connecté");
        state.isConnected = true;
      },
      
      onMessage(event) {
        const { type } = event;
        
        // Logger tous les événements (debug)
        Logger.log(`📨 Event: ${type}`);
        
        switch (type) {
          case "session.created":
            this.handleSessionCreated(event);
            break;
          
          case "session.updated":
            this.handleSessionUpdated(event);
            break;
          
          case "input_audio_buffer.speech_started":
            this.handleSpeechStarted();
            break;
          
          case "input_audio_buffer.speech_stopped":
            this.handleSpeechStopped();
            break;
          
          case "response.output_audio.delta":
            this.handleAudioDelta(event);
            break;
          
          case "response.output_audio_transcript.delta":
            this.handleTranscriptDelta(event);
            break;
          
          case "response.done":
            this.handleResponseDone(event);
            break;
          
          case "error":
            this.handleError(event);
            break;
        }
      },
      
      handleSessionCreated(event) {
        Logger.log("✅ Session created", event.session.id);
        UI.updateStatus("connected", "Prêt");
        
        // Configuration session
        this.updateSession();
      },
      
      updateSession() {
        state.ws.send(JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            instructions: `Tu es un assistant vocal pour une salle de sport.
Tu aides les adhérents avec:
- Horaires des cours
- Informations équipements
- Conseils fitness
- Réservations

Réponds en français, sois amical et concis (< 30s).`,
            voice: CONFIG.VOICE,
            output_modalities: ["audio"],
            audio: {
              input: {
                format: { type: "audio/pcm", rate: CONFIG.SAMPLE_RATE },
                transcription: { model: "whisper-1" },
                turn_detection: {
                  type: "server_vad",
                  threshold: CONFIG.VAD_THRESHOLD,
                  silence_duration_ms: 500,
                  prefix_padding_ms: 300,
                  create_response: true,
                },
              },
              output: {
                voice: CONFIG.VOICE,
                format: { type: "audio/pcm", rate: CONFIG.SAMPLE_RATE },
              },
            },
          },
        }));
      },
      
      handleSessionUpdated(event) {
        Logger.log("✅ Session configurée");
        UI.updateStatus("connected", "Prêt - Parlez!");
        Logger.logServer("session_configured");
      },
      
      handleSpeechStarted() {
        state.isListening = true;
        UI.updateStatus("listening", "Écoute...");
        UI.setVoiceActive(true);
        UI.setTranscript("En attente...");
      },
      
      handleSpeechStopped() {
        state.isListening = false;
        UI.updateStatus("responding", "Traitement...");
        UI.setTranscript("Traitement de votre demande...");
      },
      
      handleAudioDelta(event) {
        state.isResponding = true;
        UI.setVoiceActive(true);
        Audio.playAudio(event.delta);
      },
      
      handleTranscriptDelta(event) {
        UI.setTranscript(event.transcript || "");
      },
      
      handleResponseDone(event) {
        state.isResponding = false;
        state.isListening = false;
        UI.updateStatus("connected", "Prêt - Parlez!");
        UI.setVoiceActive(false);
        Logger.logServer("response_completed");
      },
      
      handleError(event) {
        Logger.error("❌ API Error:", event.error);
        UI.updateStatus("error", `Erreur: ${event.error.message}`);
        Logger.logServer("api_error", event.error.message);
      },
      
      onError(error) {
        Logger.error("❌ WebSocket error:", error);
        Logger.logServer("websocket_error", error.message);
      },
      
      onClose() {
        state.isConnected = false;
        UI.updateStatus("disconnected", "Déconnecté");
        Logger.warn("⚠️ WebSocket fermé - Reconnexion en 5s...");
        Logger.logServer("connection_closed");
        
        setTimeout(() => this.connect(), 5000);
      },
      
      reset() {
        if (state.ws && state.ws.readyState === WebSocket.OPEN) {
          state.ws.close();
        }
        state.ws = null;
        UI.setTranscript("Nouvelle question...");
        this.connect();
      },
    };
    
    // ========== INIT ==========
    (async function init() {
      try {
        // Initialiser audio
        await Audio.initContext();
        await Audio.initMicrophone();
        Audio.initAudioOutput();
        
        // Connecter Realtime API
        await Realtime.connect();
        
        // Event listeners UI
        UI.resetBtn.addEventListener("click", () => Realtime.reset());
        UI.debugBtn.addEventListener("click", () => {
          Logger.log("=== DEBUG INFO ===");
          Logger.log("State:", state);
          Logger.log("Config:", CONFIG);
        });
        
      } catch (error) {
        Logger.error("❌ Initialization failed:", error);
        UI.updateStatus("error", "Erreur d'initialisation");
      }
    })();
  </script>
</body>
</html>
```

**Utilisation**:
1. Sauvegarder comme `frontend/index.html`
2. Lancer backend: `node backend/server.js`
3. Ouvrir dans navigateur: `http://localhost:8080/frontend/index.html`

---

## Python avec Agents SDK

### Installation
```bash
pip install openai-agents openai sounddevice numpy
```

### Code complet
```python
# voice_agent.py
import asyncio
import numpy as np
import sounddevice as sd
import io
from agents.realtime import RealtimeAgent, RealtimeRunner
from agents import Agent
from agents import tool

# ============================================
# AGENT DÉFINITION
# ============================================

agent = RealtimeAgent(
    name="Assistant Fitness",
    instructions="""Tu es un assistant vocal pour une salle de sport.
Tu aides les adhérents avec leurs questions sur:
- Les horaires des cours
- Les équipements disponibles
- Les conseils fitness
- Les réservations de cours

Réponds toujours en français.
Sois amical et enthousiaste.
Garde les réponses courtes et concises (moins de 30 secondes de parole).

Si l'utilisateur demande des informations spécifiques (horaires, prix),
tu peux faire appel à des outils pour consulter la base de données."""
)

# ============================================
# TOOLS (Intégrations possibles)
# ============================================

@tool
def get_class_schedule(class_name: str) -> str:
    """Obtient l'horaire d'un cours spécifique"""
    schedules = {
        "yoga": "Lundi et jeudi à 18h",
        "spinning": "Lundi/Mercredi/Vendredi à 17h et 19h",
        "musculation": "Ouvert 24h/24",
        "aquagym": "Mardi et jeudi à 19h",
    }
    return schedules.get(class_name.lower(), "Cours non trouvé")

@tool
def get_gym_hours() -> str:
    """Obtient les horaires d'ouverture"""
    return "Lundi-Vendredi: 6h-22h, Samedi: 8h-20h, Dimanche: 9h-18h"

@tool
def reserve_class(class_name: str, user_email: str) -> str:
    """Réserve une place dans un cours"""
    # Simulation - remplacer par vrai système
    return f"✅ Réservation confirmée pour {class_name}"

# Ajouter les outils à l'agent
agent.add_tool(get_class_schedule)
agent.add_tool(get_gym_hours)
agent.add_tool(reserve_class)

# ============================================
# SESSION CONFIGURATION
# ============================================

config = {
    "model_settings": {
        "model_name": "gpt-realtime",
        "voice": "cedar",
        "modalities": ["audio"],
        "input_audio_format": "pcm16",
        "output_audio_format": "pcm16",
        "input_audio_transcription": {"model": "whisper-1"},
        "turn_detection": {
            "type": "server_vad",
            "threshold": 0.4,  # Bas pour bruit ambiant (salle de sport)
            "silence_duration_ms": 500,
            "prefix_padding_ms": 300,
            "interrupt_response": True,
        },
    }
}

# ============================================
# RUNNER & SESSION
# ============================================

async def main():
    runner = RealtimeRunner(
        starting_agent=agent,
        config=config,
    )
    
    session = await runner.run()
    
    async with session:
        print("🎤 Assistant Fitness vocal actif")
        print("💬 Parlez librement - Appuyez sur Ctrl+C pour arrêter\n")
        
        try:
            async for event in session:
                # Traiter les événements
                if event.type == "agent_start":
                    print(f"✅ {event.agent.name} démarré")
                
                elif event.type == "audio_end":
                    print("✅ Réponse vocale terminée\n")
                
                elif event.type == "tool_start":
                    print(f"🔧 Outil: {event.tool.name}")
                
                elif event.type == "tool_end":
                    print(f"✅ {event.tool.name}: {event.output}\n")
                
                elif event.type == "error":
                    print(f"❌ Erreur: {event.error}")
                
                # Ignorer les événements fréquents
                elif event.type in ["history_updated", "history_added", "raw_model_event"]:
                    pass
                
                else:
                    # Log des autres événements (debug)
                    if event.type.startswith("audio"):
                        pass  # Trop verbose
                    else:
                        print(f"📨 {event.type}")
        
        except KeyboardInterrupt:
            print("\n👋 Session terminée")

# ============================================
# LANCER
# ============================================

if __name__ == "__main__":
    print("🚀 Démarrage du serveur vocal Realtime...\n")
    asyncio.run(main())
```

**Lancer**:
```bash
export OPENAI_API_KEY=sk-...
python voice_agent.py
```

---

## Tests & Debugging

### Test WebSocket brut (Node.js)
```javascript
// test-ws.js
const WebSocket = require("ws");

async function test() {
  const sessionToken = "sk_live_..."; // À obtenir de /api/session
  
  const ws = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-realtime",
    ["realtime", `openai-insecure-api-key.${sessionToken}`]
  );
  
  ws.on("open", () => {
    console.log("✅ Connecté");
    
    // Attendre session.created
  });
  
  ws.on("message", (data) => {
    const event = JSON.parse(data);
    console.log("📨", event.type);
  });
  
  ws.on("error", (error) => {
    console.error("❌", error);
  });
}

test();
```

### Vérifier configuration
```bash
# Test latence
curl -w "Response time: %{time_total}s\n" \
  https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test clé API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data[] | select(.id | contains("realtime"))'
```

---

## Checklist avant production

- [ ] Variables d'env sécurisées (pas en hardcoded)
- [ ] Logging structuré (timestamps, session IDs)
- [ ] Gestion d'erreurs WebSocket + reconnect
- [ ] Tests avec bruit ambiant (musique, gens)
- [ ] Tests latence réseau faible
- [ ] Monitoring uptime/erreurs
- [ ] Rate limiting si plusieurs miroirs
- [ ] Authentification adhérents (ID badge)
- [ ] Cache réponses fréquentes
- [ ] Tests de charge (10+ sessions simultanées)

---

Vous avez maintenant un système **complètement fonctionnel** à déployer ! 🚀
