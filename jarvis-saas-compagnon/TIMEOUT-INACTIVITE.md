# 🕐 TIMEOUT D'INACTIVITÉ AUTOMATIQUE

## 🎯 **FONCTIONNALITÉ AJOUTÉE**

Le système JARVIS Kiosk dispose maintenant d'un **timeout d'inactivité automatique** qui ferme les sessions abandonnées.

## ⚙️ **COMMENT ÇA MARCHE**

### **Déclenchement du Timeout**
- ⏰ **30 secondes** après que JARVIS ait fini de parler
- 🔄 **Reset automatique** quand l'utilisateur recommence à parler
- 🎯 **Fermeture propre** de la session si aucune activité

### **Événements qui Réinitialisent le Timeout**
1. 🎤 **Utilisateur commence à parler** (`input_audio_buffer.speech_started`)
2. ✅ **JARVIS finit de parler** (`response.done`) → Redémarre le compteur
3. 🔌 **Connexion établie** → Démarre le premier timeout

### **Événements qui Annulent le Timeout**
1. 👋 **"Au revoir" détecté** → Session fermée immédiatement
2. 🔌 **Déconnexion manuelle** → Timeout annulé
3. ❌ **Erreur de connexion** → Timeout annulé

## 🛠️ **IMPLÉMENTATION TECHNIQUE**

### **Dans `useVoiceChat.ts`**
```typescript
// 🕐 Timeout d'inactivité automatique
const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
const INACTIVITY_TIMEOUT_MS = 30000 // 30 secondes

const resetInactivityTimeout = useCallback(() => {
  // Annuler le timeout précédent
  if (inactivityTimeoutRef.current) {
    clearTimeout(inactivityTimeoutRef.current)
  }

  // Démarrer nouveau timeout si connecté
  if (isConnected) {
    inactivityTimeoutRef.current = setTimeout(async () => {
      // Fermer session proprement
      await sessionManager.endSession(sessionRef.current.session_id, 'inactivity_timeout')
      await disconnect()
      configRef.current.onError('INACTIVITY_TIMEOUT')
    }, INACTIVITY_TIMEOUT_MS)
  }
}, [isConnected, disconnect])
```

### **Dans `VoiceInterface.tsx`**
```typescript
onError: useCallback((errorMessage) => {
  if (errorMessage === 'INACTIVITY_TIMEOUT') {
    kioskLogger.session('Session fermée par timeout d\'inactivité (30s)', 'info')
    setHasDetectedGoodbye(true) // Empêcher reconnexion
    onDeactivate() // Désactiver le membre
  }
}, [onDeactivate])
```

## 🧪 **COMMENT TESTER**

### **Test 1 : Timeout Normal**
1. Scanner un badge → Session démarre
2. Parler à JARVIS → Il répond
3. **Attendre 30 secondes sans parler**
4. ✅ **Résultat attendu** : Session se ferme automatiquement

### **Test 2 : Reset du Timeout**
1. Scanner un badge → Session démarre
2. Parler à JARVIS → Il répond
3. Attendre 25 secondes
4. **Parler à nouveau** → Timeout se reset
5. Attendre 30 secondes
6. ✅ **Résultat attendu** : Session se ferme (nouveau cycle de 30s)

### **Test 3 : Au Revoir Prioritaire**
1. Scanner un badge → Session démarre
2. Dire **"au revoir"** immédiatement
3. ✅ **Résultat attendu** : Session se ferme immédiatement (pas de timeout)

## 📊 **LOGS À SURVEILLER**

```
🕐 [INACTIVITY] Timeout reset - 30s avant fermeture auto
⏰ [INACTIVITY] Timeout atteint - Fermeture automatique de la session
🕐 [INACTIVITY] Timeout annulé
```

## 🎯 **AVANTAGES**

✅ **Économies** : Plus de sessions OpenAI abandonnées  
✅ **Ressources** : Libération automatique des connexions  
✅ **UX** : Comportement prévisible et professionnel  
✅ **Sécurité** : Pas de sessions infinies  
✅ **Maintenance** : Moins de sessions orphelines en BDD  

## ⚙️ **CONFIGURATION**

Pour modifier le délai d'inactivité, changer la constante :
```typescript
const INACTIVITY_TIMEOUT_MS = 30000 // 30 secondes (modifiable)
```

**Valeurs recommandées :**
- 🏃‍♂️ **Rapide** : 15 secondes (15000ms)
- ⚖️ **Équilibré** : 30 secondes (30000ms) ← **Actuel**
- 🐌 **Patient** : 60 secondes (60000ms)
