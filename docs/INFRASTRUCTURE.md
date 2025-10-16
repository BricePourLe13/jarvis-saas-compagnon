# Infrastructure - JARVIS SaaS

## Vue d'ensemble

L'infrastructure JARVIS SaaS repose sur 3 piliers cloud :
- **Vercel** : Hosting frontend + API serverless
- **Supabase** : Database PostgreSQL + Auth
- **GitHub** : Source control + CI/CD

## Vercel

### Configuration
- **Projet:** jarvis-saas-compagnon
- **Framework:** Next.js 15
- **Region:** Auto (Edge Network global)
- **Build Command:** `npm run build`
- **Dev Port:** 3001

### Déploiement
- **Production:** Branch `main` → Auto-deploy
- **Preview:** Toute PR → Preview URL temporaire
- **Durée build:** ~2-3 minutes

### Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL=https://vurnokaxnvittopqteno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (secret)
OPENAI_API_KEY=sk-proj-... (secret)
```

### Limites
- Fonctions serverless : 10s timeout
- Bande passante : 100GB/mois (plan actuel)
- Builds : Illimités

## Supabase

### Projet
- **Nom:** JARVIS SaaS Production
- **Project ID:** vurnokaxnvittopqteno
- **Region:** Europe (eu-central-1)
- **Plan:** Free (upgrade prévu)

### Database
- **Type:** PostgreSQL 15
- **Taille:** 500MB (plan actuel)
- **Backups:** Quotidiens automatiques
- **Extensions activées:** uuid-ossp, pgcrypto, vector

### Tables
- 16 tables principales
- ~40 lignes de données actuellement
- RLS activé sur toutes les tables sensibles

### Auth
- **Provider:** Email + Password
- **MFA:** Activé pour admins
- **Session:** 7 jours par défaut
- **JWT:** RS256

### Storage
- **Buckets:** Aucun configuré (futur : avatars, exports)
- **CDN:** Global via Supabase CDN

### Limites actuelles
- Database : 500MB
- API requests : 50k/mois
- Storage : 1GB
- Bandwidth : 2GB/mois

## GitHub

### Repository
- **Nom:** jarvis-saas-compagnon
- **Visibilité:** Private
- **Branch principale:** main
- **Collaborateurs:** 1 (Brice)

### Workflow CI/CD
```
Commit → Push main → Vercel détecte → Build → Deploy production
  ↓
Tests (futur)
  ↓
Déploiement
```

### Branches
- `main` : Production
- `develop` : Développement (à créer si besoin)
- Feature branches : Nommage `feature/nom-fonctionnalite`

## OpenAI

### API Key
- **Type:** Project key
- **Model:** gpt-4o-mini-realtime-preview-2024-12-17
- **Usage:** ~$5-10/mois actuellement
- **Limites:** 100 sessions simultanées (hard limit OpenAI)

### Monitoring
- Dashboard OpenAI : Coûts temps réel
- Logs Supabase : Tracking sessions
- Alertes : Si dépassement budget

## Networking

### Domaine
- **Production:** jarvis-group.net
- **Preview:** [branch]-jarvis-saas.vercel.app
- **SSL:** Automatique (Vercel)

### DNS
- **Provider:** (à documenter selon config)
- **Records:**
  - A/AAAA : Vercel IPs
  - CNAME : www → jarvis-group.net

## Monitoring & Logs

### Sentry
- **Organisation:** JARVIS Group
- **Projet:** jarvis-saas-compagnon
- **DSN:** (configuré dans env vars)
- **Alertes:** Email sur erreurs critiques

### Vercel Analytics
- **Speed Insights:** Activé
- **Web Vitals:** Tracking automatique
- **Logs:** Retention 7 jours

### Supabase Logs
- **API Logs:** Queries SQL, latence
- **Auth Logs:** Connexions, échecs
- **Retention:** 7 jours (plan free)

## Sauvegardes

### Database
- **Automatique:** Quotidienne (Supabase)
- **Manuelle:** Via Supabase Dashboard
- **Restoration:** Point-in-time recovery (plan paid)

### Code
- **Git:** Historique complet
- **Vercel:** Builds archivés 30 jours
- **Local:** Recommandé backup régulier

## Coûts Mensuels

### Estimations actuelles
- Vercel : $0 (plan hobby)
- Supabase : $0 (plan free)
- OpenAI : ~$10-20/mois
- Domaine : ~$15/an
- **Total : ~$10-20/mois**

### Limites à surveiller
- Supabase : 500MB database
- OpenAI : Budget à définir
- Vercel : Bandwidth 100GB

## Sécurité Infrastructure

### Secrets
- Stockés dans Vercel Environment Variables
- Jamais commités dans Git
- Rotation recommandée tous les 6 mois

### Accès
- GitHub : 2FA obligatoire
- Supabase : 2FA activé
- Vercel : 2FA activé

### Backups
- Database : Automatique quotidien
- Code : Git + GitHub
- Environnement : Vercel project settings exportés

## Mise à l'échelle

### Prochaines étapes (quand nécessaire)
1. **Supabase Pro** : $25/mois
   - 8GB database
   - 500k API requests
   - Daily backups + PITR
   
2. **Vercel Pro** : $20/mois
   - Analytics avancées
   - Temps fonction 60s
   - 1TB bandwidth

3. **CDN** : Cloudflare (si gros trafic)

## Points de contact

### Support
- Vercel : support@vercel.com
- Supabase : support@supabase.io
- OpenAI : help.openai.com

### Urgences
- Vercel Status : vercel-status.com
- Supabase Status : status.supabase.com
- OpenAI Status : status.openai.com



