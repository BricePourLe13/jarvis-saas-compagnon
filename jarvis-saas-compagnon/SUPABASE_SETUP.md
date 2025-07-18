# 🚀 Configuration Supabase - JARVIS SaaS Compagnon

## 📋 Étapes de déploiement

### 1. 🏗️ Déployer le schéma SQL

1. **Connectez-vous à votre projet Supabase** :
   - URL : https://vurnokaxnvittopqteno.supabase.co
   - Allez dans le Dashboard Supabase

2. **Ouvrez l'éditeur SQL** :
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Ou allez directement sur : https://supabase.com/dashboard/project/vurnokaxnvittopqteno/sql

3. **Exécutez le schéma** :
   - Copiez tout le contenu du fichier `sql/schema.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter

### 2. 🔐 Configuration de l'authentification

1. **Activez les providers OAuth** :
   - Allez dans "Authentication" > "Settings" > "Auth Providers"
   - Activez Google et GitHub
   - Configurez les clés API (optionnel pour les tests)

2. **Configurez les URLs de redirection** :
   - Site URL : `https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app`
   - Redirect URLs : 
     - `https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (pour le développement)

### 3. 📊 Tables créées

Le schéma SQL crée les tables suivantes :

- **`franchises`** : Informations des franchises
- **`profiles`** : Profils utilisateurs liés à l'auth
- **`kiosk_sessions`** : Sessions des kiosques IA
- **`kiosk_interactions`** : Interactions détaillées
- **`subscription_plans`** : Plans d'abonnement
- **`subscriptions`** : Abonnements actifs
- **`usage_tracking`** : Suivi d'utilisation
- **`admin_logs`** : Logs d'administration

### 4. 🛡️ Sécurité (RLS)

Toutes les tables ont des politiques Row Level Security (RLS) activées pour :
- ✅ Isolation des données par franchise
- ✅ Contrôle d'accès basé sur les rôles
- ✅ Protection des données sensibles

### 5. 🔧 Variables d'environnement

Les variables suivantes sont déjà configurées sur Vercel :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vurnokaxnvittopqteno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app
```

### 6. 🧪 Test de la connexion

Une fois le schéma déployé, vous pouvez tester :

1. **Frontend** : Visitez votre app et testez l'authentification
2. **Base de données** : Vérifiez que les tables sont créées dans l'onglet "Table Editor"
3. **API** : Testez les endpoints dans l'onglet "API"

### 7. 📝 Prochaines étapes

- [ ] Déployer le schéma SQL
- [ ] Configurer l'authentification OAuth
- [ ] Tester l'authentification sur le site
- [ ] Ajouter les premières données de test
- [ ] Configurer les webhooks (optionnel)

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase Dashboard
2. Consultez la documentation officielle : https://supabase.com/docs
3. Vérifiez que toutes les variables d'environnement sont correctes

**Status** : ✅ Variables configurées | ⏳ Schéma à déployer | ⏳ Auth à configurer
