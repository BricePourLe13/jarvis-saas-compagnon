# JARVIS SaaS - Compagnon IA pour Salles de Sport

Solution SaaS multi-tenant permettant aux salles de sport d'installer des kiosks IA conversationnels pour améliorer l'expérience adhérents et générer des insights business.

## 🚀 Quick Start

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Démarrer production
npm start
```

Accès : `http://localhost:3001`

## 📚 Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Architecture technique détaillée
- **[Infrastructure](docs/INFRASTRUCTURE.md)** - Setup Vercel + Supabase + GitHub
- **[État Actuel](docs/ETAT_ACTUEL.md)** - Features implémentées et roadmap
- **[Projet Business](docs/PROJET.md)** - Vision et business model

## 🏗️ Stack

- **Frontend:** Next.js 15, TypeScript, Chakra UI
- **Backend:** Next.js API Routes, Supabase
- **IA:** OpenAI Realtime API (gpt-4o-mini)
- **Hosting:** Vercel
- **Database:** PostgreSQL (Supabase)

## 🔑 Variables d'Environnement

Créer `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

## 📦 Structure

```
src/
├── app/              # Pages Next.js (App Router)
│   ├── dashboard/    # Dashboards admin/franchise/gym
│   ├── kiosk/        # Interface kiosk public
│   └── api/          # API routes
├── components/       # Composants React
├── lib/              # Utilities
└── types/            # Types TypeScript
```

## 🧪 Tests

```bash
# Tests E2E (à venir)
npm run test:e2e

# Linter
npm run lint
```

## 📄 Licence

Propriétaire - JARVIS Group © 2024-2025



