# Configuration Supabase - Étapes finales

## 1. Déploiement du schéma SQL

### Via l'interface Supabase
1. Connectez-vous à votre projet Supabase : https://vurnokaxnvittopqteno.supabase.co
2. Allez dans l'onglet "SQL Editor"
3. Créez une nouvelle requête
4. Copiez tout le contenu du fichier `sql/schema.sql`
5. Exécutez la requête

### Via CLI Supabase (optionnel)
```bash
# Installation du CLI Supabase
npm install -g supabase

# Login
supabase login

# Link le projet
supabase link --project-ref vurnokaxnvittopqteno

# Migration
supabase db push
```

## 2. Configuration des variables d'environnement sur Vercel

Les variables suivantes doivent être ajoutées dans Vercel :

```
NEXT_PUBLIC_SUPABASE_URL=https://vurnokaxnvittopqteno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNzE4NzksImV4cCI6MjA1ODg0Nzg3OX0.F-oJBRdNJHbnojF3JF1N5Oy2aEY5CHOAq2dY0IJ8_5s
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI3MTg3OSwiZXhwIjoyMDU4ODQ3ODc5fQ.XfTGCw7DFLRJiUHcX3NKWrfLO8Jd5gNuOw8qcVghfN0
NEXT_PUBLIC_APP_URL=https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app
```

## 3. Configuration de l'authentification Supabase

### URL de redirection
Dans la section "Authentication" > "URL Configuration" de Supabase, ajoutez :

**Site URL :**
```
https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app
```

**Redirect URLs :**
```
https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

### Providers OAuth (optionnel)
Si vous souhaitez activer Google/GitHub :
1. Allez dans "Authentication" > "Providers"
2. Activez Google et/ou GitHub
3. Configurez les Client ID et Client Secret

## 4. Test de l'intégration

Une fois le schéma déployé et les variables configurées :

1. Le site se redéploiera automatiquement via Vercel
2. Testez la connexion à la base de données
3. Vérifiez que l'authentification fonctionne
4. Testez les fonctionnalités admin et kiosk

## 5. Fonctionnalités disponibles

### Tables créées :
- `franchises` - Gestion des franchises
- `users` - Utilisateurs avec profils étendus
- `kiosk_sessions` - Sessions de chat IA
- `analytics` - Données analytiques
- `ai_models` - Configuration des modèles IA
- `api_keys` - Gestion des clés API

### Sécurité :
- Row Level Security (RLS) activé
- Policies de sécurité par rôle
- Authentification JWT
- Middleware de protection des routes

### Fonctionnalités :
- Authentification complète
- Dashboard admin
- Interface kiosk
- Analytics en temps réel
- Gestion multi-franchise
