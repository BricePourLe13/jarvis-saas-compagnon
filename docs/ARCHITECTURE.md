# Architecture Technique - JARVIS SaaS

## Vue d'ensemble

JARVIS SaaS est une plateforme multi-tenant permettant aux salles de sport d'installer des kiosks IA conversationnels pour leurs adhérents.

```
┌─────────────────────────────────────────────────────────┐
│                    JARVIS SaaS Platform                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Super Admin  │  │  Franchise   │  │     Gym      │ │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │              Kiosk Interface (Public)               ││
│  │         Avatar IA + Voice (OpenAI Realtime)         ││
│  └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Stack Technique

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI:** Chakra UI + TailwindCSS
- **Langage:** TypeScript
- **Animation:** Framer Motion, GSAP
- **State:** React hooks natifs

### Backend
- **API:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (futur)

### IA & Voice
- **Voice:** OpenAI Realtime API (gpt-4o-mini-realtime-preview)
- **Conversation:** OpenAI GPT-4o-mini
- **Analytics:** Post-traitement des transcripts

### Infrastructure
- **Hosting:** Vercel (Edge Functions)
- **Database:** Supabase Cloud
- **CI/CD:** GitHub → Vercel (auto-deploy)

## Architecture Multi-Tenant

### Hiérarchie
```
Franchise (Orange Bleue)
  └── Gym (Salle Paris 15e)
       └── Kiosk (Écran physique)
            └── Members (Adhérents)
```

### Isolation des données
- **Row Level Security (RLS)** sur toutes les tables
- Chaque utilisateur voit uniquement ses données selon son rôle
- Isolation franchise/gym via `franchise_id` et `gym_id`

### Rôles utilisateurs
- `super_admin` : Accès complet plateforme
- `franchise_owner` : Gestion de sa franchise
- `gym_manager` : Gestion de sa salle
- `gym_staff` : Accès limité salle
- `member` : Adhérent (futur)

## Schéma Base de Données

### Tables principales

**franchises**
- Entité franchise (ex: Orange Bleue)
- Config JARVIS globale (couleurs, avatar)
- Status : active, trial, suspended

**gyms**
- Salle de sport appartenant à une franchise
- Config kiosk (slug, provisioning)
- Status : active, maintenance, suspended

**gym_members**
- Adhérents d'une salle
- Profil enrichi pour IA (objectifs, préférences, historique)
- Badge RFID pour identification

**users**
- Utilisateurs plateforme (admins, gérants)
- Permissions granulaires
- Multi-franchise/multi-gym access

**openai_realtime_sessions**
- Sessions vocales temps réel
- Tracking coûts IA
- Métadonnées conversation

**jarvis_conversation_logs**
- Logs détaillés des conversations
- Analyse sentiment, intent, topics
- Base pour analytics IA

## Flux de Données Critiques

### 1. Accès Kiosk
```
Adhérent → Scan Badge RFID → API /kiosk/[slug]/members/[badgeId]
                          ↓
                    Récupération profil
                          ↓
                  OpenAI Realtime Session
                          ↓
                   Conversation vocale
                          ↓
              Log + Analytics + Dashboard
```

### 2. Provisioning Kiosk
```
Admin → Création Gym → Génération slug unique (gym-xxxxx)
                    ↓
              Code provisioning
                    ↓
         Technicien → URL /kiosk/[slug]
                    ↓
              Activation kiosk
```

### 3. Analytics Pipeline
```
Conversation → Transcript → IA Analysis
                                ↓
                    Extraction : Intent, Sentiment, Topics
                                ↓
                    Agrégation par jour/salle
                                ↓
                        Dashboard Metrics
```

## Endpoints API Principaux

### Kiosk
- `GET /api/kiosk/[slug]` - Validation kiosk
- `GET /api/kiosk/[slug]/members/[badgeId]` - Lookup adhérent
- `POST /api/kiosk/[slug]/provision` - Provisioning

### Admin
- `GET /api/admin/franchises` - Liste franchises
- `GET /api/admin/users` - Gestion utilisateurs
- `POST /api/admin/invitations/send` - Inviter user

### Manager
- `GET /api/manager/members` - Liste adhérents salle
- `GET /api/manager/analytics` - Analytics salle

### Voice
- `POST /api/voice/session/create` - Nouvelle session vocale
- `POST /api/voice/session/end` - Fin session

## Sécurité

### Authentication
- Supabase Auth (JWT)
- MFA disponible pour admins
- Session persistante

### Authorization
- RLS policies sur toutes les tables
- Vérification côté serveur (API routes)
- Isolation tenant par tenant

### API Keys
- OpenAI API key (serveur uniquement)
- Supabase service role (endpoints admin)
- Supabase anon key (client)

## Performance

### Optimisations
- Server Components par défaut
- Lazy loading composants lourds
- Image optimization (next/image)
- Edge Functions (Vercel)

### Caching
- Supabase cache queries fréquentes
- Static generation pages publiques
- Revalidation ISR si nécessaire

## Monitoring

### Logs
- Sentry (errors tracking)
- Vercel Analytics
- Supabase logs

### Métriques
- Sessions actives temps réel
- Coûts IA par jour/salle
- Taux erreur API
- Latence moyenne

## Limites & Contraintes

### Quotas
- OpenAI Realtime : 100 sessions simultanées max
- Supabase : 500MB database (plan actuel)
- Vercel : Fonctions serverless 10s timeout

### Dépendances Critiques
- OpenAI API (voice)
- Supabase (database + auth)
- Vercel (hosting)

### Points d'Attention
- Coût IA proportionnel à l'usage
- RLS doit être maintenu rigoureusement
- Slugs kiosk doivent être uniques



