# 📋 AUDIT COMPLET - REFONTE DASHBOARD ENTREPRISE

**Date:** 2025-10-24  
**Contexte:** Refonte complète dashboard style Kestra (dark, moderne, entreprise)

---

## 🔍 1. AUDIT STRUCTURE PROJET

### 📁 Structure Actuelle

```
jarvis-saas-compagnon/
├── src/
│   ├── app/
│   │   ├── dashboard/          # ❌ ANCIEN dashboard (à nettoyer)
│   │   │   ├── overview/       # ✅ Nouveau (Tremor)
│   │   │   ├── members-v2/     # ✅ Nouveau (Tremor)
│   │   │   ├── sessions-v2/    # ✅ Nouveau (Tremor)
│   │   │   ├── analytics-v2/   # ✅ Nouveau (Tremor)
│   │   │   ├── franchises/     # ❌ Ancien (à refactor)
│   │   │   ├── members/        # ❌ DOUBLON (ancien)
│   │   │   ├── sessions/       # ❌ DOUBLON (ancien)
│   │   │   └── ...             # ❌ Autres anciens
│   │   ├── api/                # ✅ OK
│   │   ├── kiosk/              # ✅ OK (séparé)
│   │   └── vitrine-pro/        # ✅ OK (séparé)
│   ├── components/
│   │   ├── dashboard/          # ❌ ANCIEN (à supprimer)
│   │   ├── dashboard-v2/       # ⚠️ TREMOR (à remplacer)
│   │   ├── admin/              # ✅ OK (à migrer)
│   │   ├── ui/                 # ✅ OK (Aceternity)
│   │   └── ...
│   └── lib/
│       ├── supabase.ts         # ✅ OK
│       ├── auth-helpers.ts     # ✅ OK
│       └── ...
└── supabase/
    └── migrations/             # ✅ OK (6 migrations)
```

---

## 📦 2. AUDIT DÉPENDANCES

### ✅ Dépendances Actuelles

```json
{
  "✅ À GARDER": {
    "next": "^15.4.1",
    "react": "^18.2.0",
    "typescript": "5.8.3",
    "tailwindcss": "^3.4.17",
    "lucide-react": "^0.525.0",           // Icons
    "recharts": "^3.3.0",                 // Charts
    "framer-motion": "^12.23.16",         // Animations
    "zod": "^4.0.5",                      // Validation
    "@supabase/supabase-js": "^2.55.0",   // Database
    "shadcn": "^3.3.1"                    // ✅ Déjà installé !
  },
  
  "❌ À SUPPRIMER": {
    "@tremor/react": "^3.18.7",           // Sera remplacé par Shadcn/ui
    "@heroicons/react": "^2.2.0",         // Doublon avec lucide-react
    "@chakra-ui/react": "^2.6.0",         // Non utilisé pour dashboard
    "@chakra-ui/icons": "^2.2.4",         // Non utilisé
    "@emotion/react": "^11.14.0",         // Dépendance Chakra UI
    "@emotion/styled": "^11.14.1"         // Dépendance Chakra UI
  },
  
  "➕ À AJOUTER": {
    "next-themes": "^0.4.6",              // Dark mode
    "@radix-ui/react-*": "latest",        // Primitives Shadcn
    "@tanstack/react-table": "^8.20.5"    // Tables avancées
  }
}
```

### 💰 Impact Build Time

```
Actuel:    11.5 min (cache 627MB)
Objectif:  7-8 min (cache ~400MB)
Gain:      -30% build time
```

---

## 🗄️ 3. AUDIT BASE DE DONNÉES

### Tables Principales (Migrations appliquées)

```sql
-- CORE TABLES
✅ users (auth + role)
✅ franchises (franchises de salles)
✅ gyms (salles de sport individuelles)
✅ gym_members_v2 (membres des salles)

-- VOICE & SESSIONS
✅ openai_realtime_sessions
✅ conversation_events
✅ conversation_summaries

-- ANALYTICS & INSIGHTS
✅ member_facts (faits sur membres)
✅ churn_predictions
✅ interaction_metrics
✅ alerts
```

### Hiérarchie Actuelle

```
super_admin (JARVIS Team)
    └── Voir TOUT
    
franchise_owner (Gérant de franchise)
    └── Voir SA franchise
        └── Voir TOUTES ses salles
        
manager (Gérant de salle)
    └── Voir SA salle uniquement
```

### RLS (Row-Level Security)

✅ Toutes les tables ont des policies RLS  
✅ Isolation par `gym_id` et `franchise_id`  
✅ Middleware Next.js vérifie les accès

---

## 🎯 4. BESOINS DASHBOARD (Contexte Gym)

### Gérant de Salle (`manager`)

**Vue d'ensemble:**
- KPI: Membres actifs, sessions ce mois, revenus, rétention
- Chart: Évolution des sessions (7 jours)
- Alertes: Churn risk, équipements cassés, membres inactifs

**Membres:**
- Table complète avec filtres (actifs, churn risk, jamais JARVIS)
- Profil individuel détaillé
- Actions: Inviter à utiliser JARVIS, contacter

**Sessions JARVIS:**
- Timeline des conversations
- Sentiment analysis (positif/négatif/neutre)
- Topics de conversation
- Durée moyenne

**Analytics:**
- Charts détaillés (engagement, fréquentation, ROI JARVIS)
- Insights automatiques
- Recommandations

---

### Gérant de Franchise (`franchise_owner`)

**En plus du dashboard de salle:**
- Vue multi-salles
- Comparaison performance entre salles
- Agrégation des métriques
- Navigation rapide vers dashboards individuels

---

### Super Admin (`super_admin`)

**Accès global:**
- Toutes les franchises + toutes les salles
- Monitoring système
- Gestion utilisateurs
- Outils d'administration

---

## 🧹 5. NETTOYAGE À EFFECTUER

### Fichiers à Supprimer

```bash
# ❌ Backups et anciens fichiers (hors projet)
_deleted_backups/

# ❌ Anciens composants dashboard
src/components/dashboard/          # Remplacé par dashboard-v2 puis Shadcn

# ❌ Anciennes pages dashboard (doublons)
src/app/dashboard/members/         # Remplacé par members-v2
src/app/dashboard/sessions/        # Remplacé par sessions-v2

# ⚠️ Docs obsolètes (à archiver, pas supprimer)
docs/TREMOR_DASHBOARD_COMPLETE.md
docs/COMPARATIF_SOLUTIONS_DASHBOARD_ENTREPRISE.md
```

### Dépendances à Supprimer

```bash
npm uninstall @tremor/react
npm uninstall @heroicons/react
npm uninstall @chakra-ui/react @chakra-ui/icons
npm uninstall @emotion/react @emotion/styled
```

### Dépendances à Ajouter

```bash
npm install next-themes
npm install @tanstack/react-table
npx shadcn@latest add card table badge button dropdown-menu dialog tabs select input
```

---

## 🚀 6. PLAN D'IMPLÉMENTATION

### Phase 1: Nettoyage (30 min) ✅
1. Supprimer dépendances Tremor, Heroicons, Chakra
2. Archiver anciens composants dashboard
3. Supprimer doublons (members old vs v2)

### Phase 2: Setup Shadcn/ui (30 min)
1. Installer next-themes + configure dark mode
2. Installer composants Shadcn nécessaires
3. Créer layout dashboard (sidebar + header)

### Phase 3: Pages Dashboard (2h)
1. **Overview** (30min): KPIs + charts + alertes
2. **Members** (30min): Table avancée + gestion
3. **Sessions** (30min): Timeline + sentiment
4. **Analytics** (30min): Charts détaillés

### Phase 4: Optimisation (30 min)
1. Tree-shaking + lazy loading
2. Build + vérification bundle size
3. Deploy + validation

---

## 📐 7. DESIGN SYSTÈME KESTRA-INSPIRED

### Color Palette (Dark Mode)

```css
:root[class~="dark"] {
  /* Backgrounds */
  --background: 220 13% 13%;       /* #1a1d29 */
  --card: 220 13% 18%;             /* #242837 */
  --card-hover: 220 13% 20%;       /* #282d3f */
  
  /* Primary (Purple) */
  --primary: 262 83% 58%;          /* #8b5cf6 */
  --primary-hover: 262 83% 65%;    /* #a78bfa */
  
  /* Borders & Muted */
  --border: 220 13% 25%;           /* #32364a */
  --muted: 220 13% 30%;            /* #3a3f50 */
  
  /* Text */
  --foreground: 210 40% 98%;       /* #f8fafc */
  --muted-foreground: 215 20% 65%; /* #94a3b8 */
  
  /* Status */
  --success: 142 76% 36%;          /* #10b981 */
  --warning: 38 92% 50%;           /* #f59e0b */
  --error: 0 84% 60%;              /* #ef4444 */
}
```

### Components Design

**KPI Cards:**
- Large number (text-4xl font-bold)
- Icon with colored background (subtle glow)
- Trend indicator (↑ ↓) with badge
- Subtle shadow + hover effect

**Charts:**
- Recharts avec thème dark
- Gradient purple (#8b5cf6 → #6366f1)
- Tooltip custom (card style)
- Legend interactive

**Tables:**
- TanStack Table (tri, filtres, pagination)
- Row hover effect
- Zebra stripes subtle
- Action buttons grouped

---

## ✅ 8. VALIDATION

### Critères de Succès

- [ ] Dashboard dark mode par défaut
- [ ] 4 pages complètes (overview, members, sessions, analytics)
- [ ] Hiérarchie claire (gym_manager → franchise_owner → super_admin)
- [ ] Build time < 8 min
- [ ] Bundle size réduit de 40%
- [ ] Design niveau entreprise (Kestra-like)
- [ ] 100% responsive
- [ ] Zéro erreur console

---

## 📞 PROCHAINES ÉTAPES

1. ✅ **MAINTENANT:** Commencer le nettoyage
2. Setup Shadcn/ui + dark mode
3. Créer les 4 pages dashboard
4. Build + deploy + validation

**Temps estimé total:** 3 heures maximum

---

**Contact:** tech@jarvis-group.net

