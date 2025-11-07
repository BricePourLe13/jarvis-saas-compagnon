# 📊 STATUT REFACTORING VOICE SYSTEM

**Date :** 2025-01-XX  
**Statut :** 🟡 En cours

---

## ✅ ÉTAPES COMPLÉTÉES

### Étape 1 : Infrastructure Core (COMPLÉTÉE)

**Fichiers créés :**
- ✅ `src/lib/voice/types.ts` - Types communs (144 lignes)
- ✅ `src/lib/voice/voice-session-factory.ts` - Factories kiosk/vitrine (89 lignes)
- ✅ `src/lib/voice/useVoiceRealtimeCore.ts` - Hook core WebRTC (450 lignes)

**Validation :**
- ✅ Pas d'erreurs de lint
- ✅ Types TypeScript corrects
- ✅ Factories testables isolément
- ✅ Core générique (pas de logique métier)

**Commit :** `f676c90` - Infrastructure core créée

---

### Étape 2 : Version Refactorée useVoiceChat (EN COURS)

**Fichier créé :**
- 🟡 `src/hooks/useVoiceChat.refactored.ts` - Version refactorée (450 lignes)

**Statut :**
- ✅ Utilise le core WebRTC
- ✅ Garde logique métier kiosk (function calling, tracking, etc.)
- ✅ Interface compatible avec l'original
- ⚠️ À améliorer : gestion inactivity timeout
- ⚠️ À améliorer : injection événements realtime

**Prochaines étapes :**
1. Améliorer gestion inactivity timeout
2. Améliorer injection événements realtime
3. Tester avec VoiceInterface.tsx
4. Valider non-régression
5. Remplacer useVoiceChat.ts

---

## 📋 PROCHAINES ÉTAPES

### Étape 3 : Finaliser useVoiceChat Refactoré

**Actions :**
- [ ] Corriger gestion inactivity timeout (doit être réinitialisé à chaque activité)
- [ ] Améliorer injection événements realtime (doit être synchronisée avec core)
- [ ] Tester avec VoiceInterface.tsx
- [ ] Valider tous les cas d'usage kiosk
- [ ] Remplacer useVoiceChat.ts par version refactorée

**Risque :** 🟡 MOYEN (modification hook utilisé en production)

---

### Étape 4 : Refactorer useVoiceVitrineChat

**Actions :**
- [ ] Créer version refactorée utilisant core
- [ ] Garder logique métier vitrine (timeout 5min, function calling commercial)
- [ ] Tester avec landing-client/page.tsx et VoiceVitrineInterface.tsx
- [ ] Valider non-régression
- [ ] Remplacer useVoiceVitrineChat.ts

**Risque :** 🟡 MOYEN (modification hook utilisé en production)

---

### Étape 5 : Tests de Non-Régression

**Tests à effectuer :**

**Kiosk :**
- [ ] Connexion session avec badge_id
- [ ] Transcription utilisateur
- [ ] Réponses JARVIS
- [ ] Function calling (tools JARVIS)
- [ ] Inactivity timeout (45s)
- [ ] Détection "au revoir"
- [ ] Tracking conversation_events
- [ ] forceReconnect
- [ ] getCurrentSessionId

**Vitrine :**
- [ ] Connexion session anonyme
- [ ] Limitation IP
- [ ] Transcription utilisateur
- [ ] Réponses JARVIS
- [ ] Function calling (expert commercial)
- [ ] Timeout 5min
- [ ] remainingCredits

---

## 📊 MÉTRIQUES

### Réduction de Code

**Avant :**
- `useVoiceChat.ts` : 720 lignes
- `useVoiceVitrineChat.ts` : 457 lignes
- **Total :** 1177 lignes

**Après (estimé) :**
- `useVoiceRealtimeCore.ts` : 450 lignes (commun)
- `useVoiceChat.ts` : ~300 lignes (wrapper kiosk)
- `useVoiceVitrineChat.ts` : ~200 lignes (wrapper vitrine)
- **Total :** 950 lignes

**Gain :** -227 lignes (-19%)

### Séparation des Responsabilités

**Avant :**
- Code WebRTC dupliqué (≈350 lignes × 2)
- Logique métier mélangée avec WebRTC

**Après :**
- Code WebRTC centralisé (1 seul endroit)
- Logique métier séparée (kiosk vs vitrine)
- Maintenance facilitée

---

## ⚠️ POINTS D'ATTENTION

### 1. Gestion Inactivity Timeout

**Problème :** Le timeout doit être réinitialisé à chaque activité (parole, réponse, etc.)

**Solution actuelle :** ⚠️ À améliorer dans version refactorée

**Solution cible :** Le core doit exposer un callback `onActivity` qui réinitialise le timeout

---

### 2. Injection Événements Realtime

**Problème :** Les événements doivent être injectés dans la DB à des moments précis

**Solution actuelle :** ⚠️ À améliorer dans version refactorée

**Solution cible :** Le core doit exposer des callbacks pour chaque événement (speech_started, speech_stopped, transcript)

---

### 3. Interface Compatibilité

**Problème :** VoiceInterface.tsx attend des propriétés qui ne sont pas dans useVoiceChat actuel

**Solution :** ✅ Ajoutées dans version refactorée (connectionQuality, reconnectAttempts, sendTextMessage, forceReconnect, getCurrentSessionId)

---

## 🎯 OBJECTIF FINAL

**Architecture cible :**
```
lib/voice/
  ├── types.ts                    ← Types communs
  ├── voice-session-factory.ts    ← Factories
  └── useVoiceRealtimeCore.ts     ← Core WebRTC (réutilisable)

hooks/
  ├── useVoiceChat.ts             ← Wrapper kiosk (logique métier)
  └── useVoiceVitrineChat.ts      ← Wrapper vitrine (logique métier)
```

**Avantages :**
- ✅ Code WebRTC centralisé (1 seul endroit)
- ✅ Logique métier séparée (kiosk vs vitrine)
- ✅ Maintenance facilitée
- ✅ Tests simplifiés
- ✅ Réduction duplication

---

**Dernière mise à jour :** 2025-01-XX  
**Prochaine étape :** Finaliser useVoiceChat refactoré


