# ⚡ QUICK FIX - Audio JARVIS manquant (Checklist rapide)

## 🎯 Le problème en 30 secondes

Vous utilisez **WebRTC** → Audio vient par **`remoteTrack`** (pas par `response.output_audio.delta`)

Les logs montrent `response.done` mais **pas de son** = problème setup audio element.

---

## ✅ CHECKLIST DE FIX (Ordre de probabilité)

### 🔴 FIX #1 : Vérifier que audio element reçoit le stream

Ouvrez **DevTools (F12)** → **Console**, puis exécutez :

```javascript
// Vérifier si audio element existe et a un stream
const audioEl = document.querySelector("audio") || 
                document.querySelector("#jarvis-audio") || 
                document.querySelector("[autoplay]");

console.log({
  "Element existe": !!audioEl,
  "Src Object": audioEl?.srcObject?.active,
  "Ready State": audioEl?.readyState, // 0=never loaded, 2=current data, 3=have future, 4=enough
  "Paused": audioEl?.paused,
  "Volume": audioEl?.volume,
  "Muted": audioEl?.muted
});

// Essayer un play manuel
if (audioEl) {
  audioEl.play()
    .then(() => console.log("✅ Audio playing"))
    .catch(err => console.error("❌ Play failed:", err.message));
}
```

**Résultat attendu** :
```
Element existe: true
Src Object: true
Ready State: 2 ou plus  ← IMPORTANT
Paused: false
✅ Audio playing
```

**Si pas bon** → Allez à FIX #2

---

### 🔴 FIX #2 : Ajouter audio element correctement

Si l'audio element n'existe pas ou n'a pas srcObject, ajoutez ceci **immédiatement après WebRTC setup** :

```javascript
// Créer audio element
const audioElement = document.createElement("audio");
audioElement.id = "jarvis-audio";
audioElement.autoplay = true;
audioElement.controls = true; // DEBUG: permet manuel play
document.body.appendChild(audioElement);

// ✅ DANS pc.ontrack, ajouter :
pc.ontrack = (event) => {
  console.log("🎵 Remote track reçu:", event.track.kind);
  
  if (event.track.kind === "audio") {
    // CRITIQUE: assigner le stream
    audioElement.srcObject = event.streams[0];
    console.log("✅ Audio srcObject assigné");
    
    // FORCE play après quelques millisecondes
    setTimeout(() => {
      audioElement.play()
        .then(() => console.log("✅ Audio playback started"))
        .catch(err => console.error("❌", err.message));
    }, 100);
  }
};
```

---

### 🟡 FIX #3 : Vérifier la session.update contient "audio" dans modalities

Cherchez dans votre code :

```javascript
// ❌ MAUVAIS
const sessionUpdate = {
  type: "session.update",
  session: {
    modalities: ["text"],  // ← MANQUE "audio" !
    voice: "cedar"
  }
};

// ✅ BON
const sessionUpdate = {
  type: "session.update",
  session: {
    modalities: ["audio", "text"],  // ← Inclut "audio"
    voice: "cedar",
    audio: {
      output: {
        voice: "cedar"
      }
    }
  }
};
```

**Si vous trouvez ❌**, changez en ✅ et testez.

---

### 🟡 FIX #4 : Vérifier permissions microphone ET audio

Ouvrir **DevTools** → **Console** :

```javascript
// Vérifier permissions
navigator.permissions.query({ name: "microphone" })
  .then(result => {
    console.log("Microphone permission:", result.state); // granted, denied, prompt
  });

// Vérifier AudioContext state
console.log("AudioContext state:", audioContext?.state); // running, suspended, closed
```

**Si "denied"** → Aller à `chrome://settings/content/microphone` et autoriser votre domaine.

**Si "suspended"** → Ajouter :
```javascript
document.addEventListener("click", async () => {
  await audioContext.resume();
  console.log("AudioContext resumed");
});
```

---

### 🟢 FIX #5 : Vérifier que pc.ontrack s'appelle

Ajouter dans votre code :

```javascript
pc.ontrack = (event) => {
  console.log("🎵 ontrack CALLED ← This must appear in console!");
  console.log("  Track kind:", event.track.kind);
  console.log("  Streams:", event.streams.length);
  
  // ... rest of code
};

// Aussi vérifier WebRTC state
pc.addEventListener("connectionstatechange", () => {
  console.log("WebRTC state:", pc.connectionState); // connected = bon
});

pc.addEventListener("iceconnectionstatechange", () => {
  console.log("ICE state:", pc.iceConnectionState);
});
```

**Attendu dans console** :
```
🎵 ontrack CALLED ← This must appear
  Track kind: audio
  Streams: 1
WebRTC state: connected
```

**Si `ontrack` ne s'appelle jamais** → WebRTC connexion pas établie correctement.

---

## 🧪 TEST RAPIDE (2 minutes)

Copier-coller dans console DevTools :

```javascript
// ============================================
// REALTIME API AUDIO TEST
// ============================================

// 1. Vérifier audio element
const audioEl = document.querySelector("audio");
console.log("1️⃣ Audio element exists:", !!audioEl);
console.log("   Ready state:", audioEl?.readyState); // 0-4

// 2. Vérifier microphone
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log("2️⃣ ✅ Microphone accessible"))
  .catch(err => console.log("2️⃣ ❌ Microphone denied:", err.name));

// 3. Vérifier AudioContext
const ctx = new (window.AudioContext || window.webkitAudioContext)();
console.log("3️⃣ AudioContext state:", ctx.state);

// 4. Vérifier WebRTC connection
const peerConn = new RTCPeerConnection();
console.log("4️⃣ RTCPeerConnection created");

peerConn.addEventListener("connectionstatechange", () => {
  console.log("4️⃣ WebRTC connection state:", peerConn.connectionState);
});

// 5. Vérifier si ontrack s'appelle (need real connection, but set handler)
peerConn.ontrack = (e) => {
  console.log("5️⃣ ✅ ontrack FIRED");
  console.log("   Audio element srcObject set");
};
console.log("5️⃣ ontrack handler registered");

console.log("\n" + "=".repeat(50));
console.log("✅ All checks completed - check above for issues");
```

**Résultat attendu** :
```
1️⃣ Audio element exists: true
   Ready state: 0
2️⃣ ✅ Microphone accessible
3️⃣ AudioContext state: running
4️⃣ RTCPeerConnection created
4️⃣ WebRTC connection state: new
5️⃣ ontrack handler registered
```

---

## 🎬 PROCÉDURE COMPLÈTE DE DEBUG (Si rien marche)

### Étape 1 : Logs détaillés

Ajouter partout :

```javascript
console.log = ((oldLog) => {
  return function(...args) {
    oldLog.apply(console, [new Date().toLocaleTimeString(), ...args]);
  };
})(console.log);

console.error = ((oldError) => {
  return function(...args) {
    oldError.apply(console, ["🔴", new Date().toLocaleTimeString(), ...args]);
  };
})(console.error);
```

### Étape 2 : Capturer TOUS les WebRTC events

```javascript
const pc = new RTCPeerConnection();

// Log tous les state changes
["connectionstatechange", "iceconnectionstatechange", 
 "icegatheringstatechange", "signalingstatechange"].forEach(event => {
  pc.addEventListener(event, () => {
    console.log("📡 WebRTC Event:", event, {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
    });
  });
});

// Log quand remote tracks arrivent
pc.addEventListener("track", (e) => {
  console.log("🎵 TRACK EVENT:", {
    kind: e.track.kind,
    state: e.track.readyState,
    direction: e.transceiver.currentDirection,
    mid: e.transceiver.mid
  });
});
```

### Étape 3 : Capturer audio element events

```javascript
const audioEl = document.querySelector("audio");

["play", "pause", "playing", "ended", "error", 
 "loadstart", "progress", "loadeddata"].forEach(evt => {
  audioEl.addEventListener(evt, () => {
    console.log(`🔊 Audio event: ${evt}`, {
      currentTime: audioEl.currentTime,
      buffered: audioEl.buffered.length,
      readyState: audioEl.readyState,
      paused: audioEl.paused
    });
  });
});
```

### Étape 4 : Screenshot des logs

F12 → Console → Copier les logs → Partager pour debug

---

## 🚨 DERNIER RECOURS : Test avec WebSocket (diagnostic)

Si WebRTC audio fonctionne pas du tout, testez avec WebSocket pour confirmer que l'API fonctionne :

```javascript
// Tester en WebSocket (plus facile à debug)
const ws = new WebSocket(
  "wss://api.openai.com/v1/realtime?model=gpt-realtime",
  ["realtime", `openai-insecure-api-key.${ephemeralToken}`]
);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === "response.output_audio.delta") {
    console.log("✅ Audio delta reçu (WebSocket mode)");
    // Avec WebSocket, vous recevez ces deltas
  }
};
```

**Si ça fonctionne en WebSocket** → Problème = WebRTC setup.
**Si ça ne fonctionne pas non plus** → Problème = configuration session/API.

---

## 📞 Résumé des fixes par ordre

1. ✅ Vérifier audio element + ontrack console logs
2. ✅ Ajouter audio element avec srcObject dans pc.ontrack
3. ✅ Vérifier `modalities: ["audio"]` dans session.update
4. ✅ Vérifier permissions microphone + AudioContext.resume()
5. ✅ Tester en WebSocket pour isoler problème

**Appliquez ces fixes dans cet ordre et testez après chaque.**

