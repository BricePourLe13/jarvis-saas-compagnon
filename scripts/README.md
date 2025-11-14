# 🧪 Scripts de Test OpenAI Realtime API

## Test GA Structure Validation

### Objectif
Valider que la structure GA de l'API OpenAI Realtime fonctionne correctement avant de refactorer le code principal.

### Prérequis

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configurer la clé API OpenAI** :
   ```bash
   export OPENAI_API_KEY=sk-...
   ```
   
   Ou sur Windows PowerShell :
   ```powershell
   $env:OPENAI_API_KEY="sk-..."
   ```

### Lancer le Test

```bash
npm run test:ga
```

### Résultat Attendu

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

### En Cas d'Erreur

**Erreur 401 (Unauthorized)** :
- Vérifiez que votre clé API OpenAI est correcte
- Vérifiez que la clé est bien exportée dans l'environnement

**Erreur 429 (Rate Limit)** :
- Attendez quelques secondes et réessayez
- Vérifiez votre tier OpenAI (Tier 1 minimum requis)

**Erreur "Invalid value"** :
- La structure de la requête est incorrecte
- Consultez `docs/OPENAI_GA_VALIDATED.md` pour la structure correcte

**Timeout** :
- Vérifiez votre connexion internet
- Le timeout est de 10 secondes, augmentez-le si nécessaire dans le script

### Prochaines Étapes

Une fois le test validé :
1. ✅ La structure GA est confirmée fonctionnelle
2. 🔄 Passer à la Phase 2 : Créer les modules core
3. 🔄 Passer à la Phase 3 : Refactor des routes API
4. 🔄 Passer à la Phase 4 : Refactor du frontend

### Documentation

- [OpenAI GA Validated](../docs/OPENAI_GA_VALIDATED.md)
- [OpenAI Realtime Docs](../docs/docopenai.md)
- [Realtime Agent Guide](../docs/realtime-agent-guide.md)



