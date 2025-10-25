# 🤖 JARVIS SaaS - Agent Vocal IA pour Salles de Sport

**Version :** 2.0 (Refonte Entreprise en cours)  
**Statut :** 🟡 En développement - Phase 0/6  
**Site :** [jarvis-group.net](https://jarvis-group.net)

---

## 🎯 VISION

JARVIS transforme l'expérience adhérent des salles de sport avec un agent vocal IA conversationnel (speech-to-speech) installé sur des miroirs digitaux (kiosks).

### Proposition de Valeur
1. **Réduction churn 30%** : Détection précoce risque désengagement + interventions proactives
2. **Expérience adhérent premium** : Interface vocale naturelle 24/7 (questions, réservations, feedback)
3. **Insights actionnables** : Dashboard gérant avec analytics IA, alertes intelligentes, recommandations

### Modèle Économique
- **Clients :** Franchises multi-salles et salles indépendantes
- **Offre :** Installation équipements + Formation + Abonnement mensuel (~1200€/mois/salle)
- **Marge :** ~60% (coûts IA ~480€/mois/salle)

---

## 📊 STATUT PROJET

### Phase Actuelle : **Phase 0 - Fondations Documentation** (Jour 1/2)
- ✅ Audit complet réalisé
- ✅ Documentation architecture créée (agent.md, PLAN_ARCHITECTURE_ENTREPRISE.md, ROADMAP_REFONTE.md)
- 🟡 Validation plan avec équipe en cours

### Timeline Refonte
- **Phase 0 :** Fondations (2 jours) - EN COURS
- **Phase 1 :** Architecture Kiosks (3 jours)
- **Phase 2 :** Pipeline Données (5 jours) - CRITIQUE
- **Phase 3 :** Jobs Automatiques (3 jours)
- **Phase 4 :** Dashboard Admin (4 jours)
- **Phase 5 :** Nettoyage & Optimisation (3 jours)
- **Phase 6 :** Tests & Validation Pilote (7 jours)

**🎯 Date cible MVP :** 15 novembre 2025 (27 jours)

---

## 🏗️ ARCHITECTURE

### Stack Technique
```yaml
Frontend:
  - Next.js 15 (App Router)
  - TypeScript
  - Chakra UI + Shadcn/ui + Tailwind
  - Framer Motion + GSAP

Backend:
  - Next.js API Routes (Edge + Node.js)
  - Supabase (PostgreSQL + Auth + RLS)
  - OpenAI Realtime API (gpt-4o-mini)
  
Infrastructure:
  - Vercel (Hosting + Edge Functions)
  - Supabase (Database + Edge Functions)
  - Sentry (Monitoring)
  - Upstash QStash (Cron Jobs)
  - Resend (Email)
```

### Hiérarchie Multi-Tenant
```
JARVIS SaaS (Super Admin)
├── Franchises (franchise_owner)
│   ├── Salle A1 (gym_manager)
│   ├── Salle A2 (gym_manager)
│   └── Salle A3 (gym_manager)
└── Salles indépendantes (gym_manager)
```

---

## 🚀 QUICK START

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase (gratuit)
- Compte OpenAI (API Key)
- Compte Vercel (gratuit)

### Installation

```bash
# 1. Clone le repo
git clone https://github.com/your-org/jarvis-saas-compagnon.git
cd jarvis-saas-compagnon

# 2. Install dépendances
npm install

# 3. Setup variables d'environnement
cp .env.example .env.local

# Éditer .env.local avec tes credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OPENAI_API_KEY=your_openai_key

# 4. Run migrations Supabase
# Via Supabase Dashboard > SQL Editor > Run migrations in supabase/migrations/

# 5. Démarrer dev server
npm run dev

# 6. Ouvrir http://localhost:3001
```

### Comptes Test
```
Super Admin:
- Email: admin@jarvis-group.net
- Password: [demander à Brice]

Gym Manager (Test):
- Email: manager@gym-test.com
- Password: [demander à Brice]
```

---

## 📁 STRUCTURE PROJET

```
jarvis-saas-compagnon/
├── agent.md                          ← Instructions Claude Sonnet 4.5
├── PLAN_ARCHITECTURE_ENTREPRISE.md   ← Architecture cible détaillée
├── ROADMAP_REFONTE.md                ← Plan d'action 6 phases
├── README.md                         ← Ce fichier
│
├── src/
│   ├── app/                          ← Pages Next.js (App Router)
│   │   ├── dashboard/                ← Dashboard multi-role
│   │   ├── kiosk/[slug]/             ← Interface kiosk (voice)
│   │   ├── auth/                     ← Login + MFA
│   │   ├── landing-client/           ← Page vitrine
│   │   └── api/                      ← API Routes
│   │       ├── voice/                ← OpenAI Realtime
│   │       ├── dashboard/            ← KPIs, members, sessions
│   │       ├── admin/                ← Gestion clients
│   │       ├── kiosk/                ← Provisioning, heartbeat
│   │       └── jarvis/tools/         ← Function calling
│   │
│   ├── components/                   ← Composants React
│   │   ├── dashboard/                ← Dashboard UI
│   │   ├── kiosk/                    ← Kiosk UI
│   │   ├── admin/                    ← Admin UI
│   │   ├── common/                   ← Shared components
│   │   └── ui/                       ← Shadcn/ui components
│   │
│   ├── lib/                          ← Utilities
│   ├── hooks/                        ← Custom React hooks
│   ├── contexts/                     ← React Context (GymContext)
│   ├── types/                        ← TypeScript types
│   └── utils/                        ← Helper functions
│
├── supabase/
│   ├── migrations/                   ← Database migrations (versionnées)
│   └── functions/                    ← Edge Functions (traitement async)
│
├── tests/
│   └── e2e/                          ← Tests Playwright
│
├── docs/                             ← Documentation
│   ├── AUDIT_COMPLET_2025.md
│   ├── ARCHITECTURE_PROFESSIONNELLE_2025.md
│   └── _archive/                     ← Docs obsolètes archivées
│
├── public/                           ← Assets statiques
├── next.config.js                    ← Config Next.js
├── tailwind.config.js                ← Config Tailwind
├── tsconfig.json                     ← Config TypeScript
└── package.json                      ← Dépendances
```

---

## 🔑 FEATURES PRINCIPALES

### ✅ Fonctionnel (Production)
- ✅ Interface kiosk vocale (OpenAI Realtime API)
- ✅ Scan badge RFID (identification adhérent)
- ✅ Dashboard gérant basique (membres, sessions, analytics)
- ✅ Auth sécurisé (Supabase Auth + MFA)
- ✅ Multi-tenant avec RLS (Row Level Security)
- ✅ Provisioning kiosks
- ✅ Monitoring heartbeat kiosks

### 🟡 En Cours (Phase 2-4)
- 🟡 Pipeline traitement conversations (summary, sentiment, topics)
- 🟡 Calcul churn risk automatique
- 🟡 Alertes intelligentes gérants
- 🟡 Rapports hebdomadaires automatiques
- 🟡 Dashboard admin complet (gestion clients, monitoring)
- 🟡 Support multi-kiosks par gym

### 📅 Roadmap Post-MVP
- Mobile app adhérents (Q4 2025)
- ML churn prédiction avancée (Q1 2026)
- Marketplace partenaires (Q1 2026)
- Multilingue (EN, ES, DE) (Q1 2026)
- API publique webhooks (Q2 2026)

---

## 📚 DOCUMENTATION ESSENTIELLE

### Pour Développeurs
1. **[agent.md](./agent.md)** : Instructions complètes pour Claude Sonnet 4.5 (principes, conventions, règles)
2. **[PLAN_ARCHITECTURE_ENTREPRISE.md](./PLAN_ARCHITECTURE_ENTREPRISE.md)** : Architecture technique détaillée (BDD, API, Frontend, Jobs)
3. **[ROADMAP_REFONTE.md](./ROADMAP_REFONTE.md)** : Plan d'action 6 phases avec timeline

### Pour Business
1. **[docs/PROJET.md](./docs/PROJET.md)** : Vision business, modèle économique, proposition de valeur
2. **[docs/AUDIT_COMPLET_2025.md](./docs/AUDIT_COMPLET_2025.md)** : Audit initial (état des lieux, problèmes, recommandations)

---

## 🛠️ COMMANDES UTILES

```bash
# Développement
npm run dev              # Dev server (port 3001)
npm run build            # Build production
npm run start            # Start production server
npm run lint             # Linter ESLint + TypeScript check

# Tests
npm run test:e2e         # Tests E2E Playwright
npm run test:e2e:ui      # Tests E2E avec UI

# Database (via Supabase CLI - si installé)
supabase db push         # Appliquer migrations
supabase db reset        # Reset DB dev
supabase functions serve # Run Edge Functions localement
```

---

## 🔐 SÉCURITÉ

### Authentification
- Supabase Auth (email/password)
- MFA avec TOTP (recommandé pour admins)
- Row Level Security (RLS) sur toutes tables sensibles

### Permissions
- `super_admin` : Accès total, gestion clients
- `franchise_owner` : Accès ses salles uniquement
- `gym_manager` : Accès sa salle uniquement
- `gym_staff` : Consultation limitée (futur)

### Rate Limiting
- API générale : 100 req/min
- API voice : 30 req/min
- Webhooks : Pas de limite (vérification signature)

---

## 🐛 RAPPORTER UN BUG

### Production (Urgent)
- Sentry : [https://sentry.io/jarvis-group](https://sentry.io)
- Email : support@jarvis-group.net
- Slack : #bugs-prod (équipe interne)

### Développement
- GitHub Issues : [Créer une issue](https://github.com/your-org/jarvis-saas-compagnon/issues)
- Format : Utiliser template BUG_REPORT.md

---

## 🤝 CONTRIBUER

### Pour l'équipe interne
1. Lire **[agent.md](./agent.md)** (règles & conventions)
2. Checkout nouvelle branch : `git checkout -b feature/nom-feature`
3. Coder selon standards (TypeScript strict, naming conventions)
4. Tester localement (linter + tests E2E si applicable)
5. Commit : `git commit -m "feat: description feature"`
6. Push + Pull Request vers `main`
7. Review obligatoire avant merge

### Conventions Commits
```
feat: nouvelle feature
fix: correction bug
docs: documentation
refactor: refactoring (pas de changement fonctionnel)
test: ajout/modification tests
chore: tâches maintenance (deps, config)
```

---

## 📞 CONTACT

### Équipe
- **Fondateur :** Brice Pradet
- **Email :** brice@jarvis-group.net
- **Site :** [jarvis-group.net](https://jarvis-group.net)

### Support Clients
- **Email :** support@jarvis-group.net
- **Horaires :** Lun-Ven 9h-18h (CET)
- **SLA :** Réponse <24h (jours ouvrés)

---

## 📄 LICENCE

**Propriétaire © 2024-2025 JARVIS Group**  
Tous droits réservés. Code source confidentiel.

---

## 🎉 CHANGELOG

### Version 2.0 (En cours - Nov 2025)
- 🔄 Refonte complète architecture (niveau entreprise)
- ✨ Pipeline données automatique (conversations → insights)
- ✨ Dashboard admin complet (gestion clients, monitoring)
- ✨ Support multi-kiosks par gym
- ✨ Jobs automatiques (churn, alertes, rapports)
- 🎨 Design premium (logo mini-sphère 3D)

### Version 1.0 (Oct 2025)
- ✅ MVP fonctionnel (kiosk voice + dashboard basique)
- ✅ Auth sécurisé + MFA
- ✅ Multi-tenant avec RLS
- ✅ Provisioning kiosks

---

**🚀 Let's build the future of fitness experience!**
