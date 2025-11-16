# 🚀 REFONTE DASHBOARD V2 - PLAN D'EXÉCUTION

**Date :** 16 novembre 2025  
**Objectif :** Dashboard professionnel monochrome (blanc/gris/noir) avec shadcn/ui  
**Timeline :** 3-4 jours  
**Principe :** Suppression complète ancien code, refonte from scratch

---

## 📋 CONTEXTE & DÉCISIONS

### **Problème Initial**
- Build en prod échoue suite séparation site vitrine
- Dashboard actuel = 15 pages bordéliques (3 libs UI concurrentes)
- Design incohérent (monochrome sur 3 pages seulement)
- Dette technique massive (duplication, no abstraction)

### **Décisions Architecturales**
1. ✅ **1 app unifiée** (`app.jarvis-group.net`)
2. ✅ **Suppression totale dashboard existant** (clean slate)
3. ✅ **Refactor Kiosk vers shadcn/ui** (supprimer Chakra UI)
4. ✅ **Design monochrome** (blanc/gris/noir, traits fins, épuré)
5. ✅ **5 pages dashboard essentielles** (pas 15)

### **Stack Technique Finale**
```yaml
UI: shadcn/ui + Tailwind CSS (suppression Chakra UI)
Components: 10 composants réutilisables max
Charts: Recharts
Forms: React Hook Form + Zod
Icons: Lucide React
Animations: Framer Motion (déjà présent)
```

---

## 🎯 PHASE 1 : NETTOYAGE & FIX BUILD (Jour 1 - 4h)

### **1.1 Fix Erreurs Build (30 min)**

**Problème :** 11 fichiers API avec ancien format `params` Next.js 15

**Solution :** Script de remplacement automatique

**Fichiers à corriger :**
```
src/app/api/dashboard/tools/[toolId]/test/route.ts
src/app/api/admin/gyms/[id]/route.ts
src/app/api/admin/users/[id]/route.ts
src/app/api/kiosk/[slug]/route.ts
src/app/api/kiosk/[slug]/provision/route.ts
src/app/api/kiosk/[slug]/members/route.ts
src/app/api/kiosk/[slug]/members/[badgeId]/route.ts
src/app/api/kiosk/[slug]/log-interaction/route.ts
src/app/api/sessions/[sessionId]/summary/route.ts
src/app/api/members/[memberId]/conversations/route.ts
src/app/api/conversations/[sessionId]/route.ts
```

**Pattern remplacement :**
```typescript
// AVANT (❌ Next.js 14)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
}

// APRÈS (✅ Next.js 15)
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params
}
```

**Script PowerShell :**
```powershell
# À créer : scripts/fix-next15-params.ps1
```

---

### **1.2 Suppression Dashboard Existant (15 min)**

**Supprimer :**
```bash
# Dashboard pages (TOUT)
src/app/dashboard/admin/
src/app/dashboard/analytics/
src/app/dashboard/insights/
src/app/dashboard/kiosk/
src/app/dashboard/members/
src/app/dashboard/sessions/
src/app/dashboard/settings/
src/app/dashboard/team/
src/app/dashboard/tools/
src/app/dashboard/page.tsx

# Dashboard components (TOUT)
src/components/dashboard/
src/components/admin/

# Garder temporairement
src/app/dashboard/layout.tsx  # Sera refactoré plus tard
```

**Commit :** `chore: Suppression dashboard v1 (refonte v2)`

---

### **1.3 Suppression Références Vitrine Code (10 min)**

**Supprimer uniquement les imports/références dans le code SaaS :**

Chercher et supprimer :
- Imports `vitrine-*` dans fichiers `lib/voice/`
- Références `'vitrine'` dans types (déjà fait dans `openai-config.ts`)

**NE PAS TOUCHER tables BDD** (partagées avec landing)

---

### **1.4 Test Build (5 min)**

```bash
npm run build
# Doit passer sans erreur
```

**Si échec :** Identifier fichiers manquants, créer stubs temporaires

**Commit :** `fix: Build Next.js 15 params + nettoyage vitrine refs`

---

## 🎯 PHASE 2 : REFACTOR KIOSK → shadcn/ui (Jour 1 - 3h)

### **2.1 Setup shadcn/ui (15 min)**

```bash
# Installer shadcn/ui CLI
npx shadcn@latest init

# Config recommandée :
# Style: New York
# Base color: Neutral
# CSS variables: Yes
```

**Installer composants nécessaires :**
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add spinner
npx shadcn@latest add progress
npx shadcn@latest add dialog
```

---

### **2.2 Refactor Kiosk Components (2h)**

**Ordre de refactor :**

1. **src/components/kiosk/RFIDSimulator.tsx** (30 min)
   - Remplacer `Box`, `VStack`, `Button`, `Badge` Chakra
   - Utiliser shadcn `Card`, `Button`, `Badge`

2. **src/components/kiosk/MicrophoneDiagnostic.tsx** (30 min)
   - Remplacer `Modal`, `Progress` Chakra
   - Utiliser shadcn `Dialog`, `Progress`

3. **src/components/kiosk/VoiceInterface.tsx** (45 min)
   - Remplacer layout Chakra
   - Utiliser Tailwind CSS pour layout

4. **src/app/kiosk/[slug]/page.tsx** (15 min)
   - Supprimer imports Chakra
   - Vérifier que tout fonctionne

**Principe :**
```typescript
// AVANT (Chakra)
<Box bg="white" p={4} borderRadius="md">
  <VStack spacing={4}>
    <Text fontSize="lg" fontWeight="bold">Title</Text>
    <Button colorScheme="blue">Action</Button>
  </VStack>
</Box>

// APRÈS (shadcn + Tailwind)
<Card className="p-4">
  <div className="flex flex-col gap-4">
    <h3 className="text-lg font-semibold">Title</h3>
    <Button>Action</Button>
  </div>
</Card>
```

---

### **2.3 Supprimer Chakra UI (10 min)**

```bash
# Désinstaller
npm uninstall @chakra-ui/react @chakra-ui/icons @emotion/react @emotion/styled

# Supprimer fichiers
rm src/components/ChakraProviders.tsx
rm src/theme/jarvisTheme.ts

# Supprimer imports dans src/app/layout.tsx
```

**Commit :** `refactor(kiosk): Migration Chakra → shadcn/ui (-14.5MB bundle)`

---

### **2.4 Test Kiosk (30 min)**

**Test manuel complet :**
1. Ouvrir `/kiosk/gym-test`
2. Scanner badge (simulateur)
3. Tester session voice
4. Vérifier audio, animations, UI
5. Tester sur mobile (responsive)

**Critères validation :**
- ✅ UI identique visuellement
- ✅ Aucune régression fonctionnelle
- ✅ Performance égale ou meilleure

---

## 🎯 PHASE 3 : DESIGN SYSTEM (Jour 2 - 2h)

### **3.1 Palette Couleurs (30 min)**

**Fichier :** `src/config/design-system.ts`

```typescript
export const colors = {
  // Monochrome scale
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  black: '#000000',
  
  // Accent (minimal)
  accent: {
    primary: '#0A0A0A',    // Noir profond
    secondary: '#737373',   // Gris moyen
  }
}

export const typography = {
  fontFamily: 'var(--font-geist-sans)', // Vercel Geist
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
}

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
}

export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  full: '9999px',
}

export const borderWidth = {
  DEFAULT: '1px',
  0: '0',
  thin: '0.5px',  // Traits fins
  2: '2px',
}
```

**Mettre à jour `tailwind.config.js` :**
```javascript
theme: {
  extend: {
    colors: { /* copier colors */ },
    fontFamily: { /* copier fontFamily */ },
    // etc.
  }
}
```

---

### **3.2 Composants Réutilisables (1h)**

**Fichier :** `src/components/ui/` (shadcn/ui déjà installés)

**Composants custom à créer :**

1. **src/components/shared/PageHeader.tsx**
```typescript
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-light text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
```

2. **src/components/shared/StatCard.tsx**
```typescript
interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; direction: 'up' | 'down' }
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-light text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-2",
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </Card>
  )
}
```

3. **src/components/shared/DataTable.tsx** (wrapper @tanstack/react-table)

4. **src/components/shared/EmptyState.tsx**

5. **src/components/shared/LoadingState.tsx**

**Commit :** `feat(ui): Design system monochrome + composants réutilisables`

---

## 🎯 PHASE 4 : DASHBOARD PAGES (Jour 2-3 - 8h)

### **4.1 Layout Dashboard (1h)**

**Fichier :** `src/app/(dashboard)/layout.tsx`

**Structure :**
```
┌─────────────────────────────────────────┐
│  Sidebar (240px)  │  Content            │
│  ┌──────────┐     │  ┌────────────────┐ │
│  │ Logo     │     │  │  Header        │ │
│  ├──────────┤     │  ├────────────────┤ │
│  │ Nav      │     │  │                │ │
│  │  Overview│     │  │  Page Content  │ │
│  │  Gyms    │     │  │                │ │
│  │  Users   │     │  │                │ │
│  │  Members │     │  │                │ │
│  │  Settings│     │  │                │ │
│  ├──────────┤     │  │                │ │
│  │ User     │     │  │                │ │
│  └──────────┘     │  └────────────────┘ │
└─────────────────────────────────────────┘
```

**Navigation :**
- Super Admin : `/admin/gyms`, `/admin/users`, `/admin/monitoring`
- Gym Manager : `/overview`, `/members`, `/settings`

**Fichiers à créer :**
- `src/app/(dashboard)/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/DashboardHeader.tsx`
- `src/config/navigation.ts` (liens nav par role)

---

### **4.2 Page Overview (2h)**

**Route :** `src/app/(dashboard)/page.tsx`

**Sections :**
1. **Header** : "Bienvenue, [Nom]" + date
2. **KPIs** (4 cards) :
   - Visites aujourd'hui
   - Sessions JARVIS actives
   - Satisfaction moyenne
   - Alertes urgentes
3. **Graphe tendances** (7 jours) : Visites + Sessions
4. **Alertes urgentes** (liste top 3)
5. **Quick actions** : Buttons CTA

**API endpoints nécessaires :**
- `GET /api/dashboard/overview/stats` (KPIs)
- `GET /api/dashboard/overview/trends` (graphe)
- `GET /api/dashboard/overview/alerts` (alertes)

---

### **4.3 Page Admin Gyms (2h)**

**Route :** `src/app/(dashboard)/admin/gyms/page.tsx`

**Sections :**
1. **Header** : "Salles de sport" + Button "Créer une salle"
2. **Filtres** : Actives / Suspendues / Toutes + Search
3. **Table** (colonnes) :
   - Nom salle
   - Ville
   - Kiosks (count + status)
   - Manager
   - Statut (badge)
   - Actions (⋮ menu)
4. **Modal création** : Form + Invitation manager

**Détail salle :**
**Route :** `src/app/(dashboard)/admin/gyms/[id]/page.tsx`

**Sections :**
1. Header : Nom salle + breadcrumb + actions (edit, suspend)
2. Overview KPIs (4 cards) : Membres, Sessions today, Satisfaction, Kiosks
3. Tabs :
   - Général : Infos salle, horaires
   - Kiosks : Liste kiosks (status, provision)
   - Members : Liste adhérents (mini-table)
   - Activity : Timeline events récents

---

### **4.4 Page Admin Users (1h)**

**Route :** `src/app/(dashboard)/admin/users/page.tsx`

**Sections :**
1. Header + Button "Inviter un utilisateur"
2. Filtres : Role (all/super_admin/gym_manager) + Search
3. Table : Email, Nom, Role, Gym, MFA, Last login, Actions
4. Modal invitation : Email, Nom, Role, Gym (si gym_manager)

---

### **4.5 Page Members (Gym Manager) (1h)**

**Route :** `src/app/(dashboard)/members/page.tsx`

**Sections :**
1. Header : "Mes Adhérents" + Button "Exporter CSV"
2. Filtres : Actifs / Inactifs / Churn Risk + Search
3. Table : Badge ID, Nom, Statut, Dernière visite, Conversations, Actions
4. Modal détail membre :
   - Infos profil
   - Historique visites (mini graphe)
   - Timeline conversations JARVIS
   - Alertes éventuelles

---

### **4.6 Page Settings (30 min)**

**Route :** `src/app/(dashboard)/settings/page.tsx`

**Sections :**
1. Header : "Paramètres"
2. Tabs :
   - Profil : Nom, Email, Avatar, Password
   - Salle (si gym_manager) : Horaires, Équipements, Kiosks
   - Notifications : Email, Alertes
   - Sécurité : MFA

---

## 🎯 PHASE 5 : API REFACTOR (Jour 4 - 4h)

### **5.1 Middleware API (1h)**

**Fichier :** `src/lib/api/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function withAuth<T = any>(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (req: NextRequest, props?: any) => {
    try {
      // 1. Auth check
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // 2. Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('role, gym_id, gym_access')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // 3. Role check
      if (options.roles && !options.roles.includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // 4. Input validation (if schema provided)
      let body = null
      if (options.schema && req.method !== 'GET') {
        try {
          const rawBody = await req.json()
          body = options.schema.parse(rawBody)
        } catch (err) {
          if (err instanceof z.ZodError) {
            return NextResponse.json(
              { error: 'Validation failed', details: err.errors },
              { status: 400 }
            )
          }
          throw err
        }
      }

      // 5. Call handler
      const context: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
          role: profile.role,
          gym_id: profile.gym_id,
          gym_access: profile.gym_access,
        },
        body,
        supabase,
      }

      return handler(req, context)

    } catch (error) {
      console.error('[API Error]', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

interface MiddlewareOptions {
  roles?: ('super_admin' | 'gym_manager' | 'member')[]
  schema?: z.ZodSchema
}

interface AuthContext {
  user: {
    id: string
    email: string
    role: string
    gym_id?: string
    gym_access?: string[]
  }
  body: any
  supabase: any
}
```

---

### **5.2 Refactor API Routes (3h)**

**Exemple :** `src/app/api/dashboard/overview/stats/route.ts`

```typescript
import { withAuth } from '@/lib/api/middleware'
import { NextResponse } from 'next/server'

export const GET = withAuth(
  async (req, { user, supabase }) => {
    // Récupérer gym_id selon role
    const gymId = user.role === 'super_admin' 
      ? req.nextUrl.searchParams.get('gym_id')
      : user.gym_id

    if (!gymId) {
      return NextResponse.json({ error: 'gym_id required' }, { status: 400 })
    }

    // Fetch stats
    const [members, sessions, alerts] = await Promise.all([
      supabase
        .from('gym_members_v2')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId)
        .eq('is_active', true),
      
      supabase
        .from('openai_realtime_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId)
        .gte('session_started_at', new Date().toISOString().split('T')[0]),
      
      supabase
        .from('manager_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId)
        .eq('status', 'pending')
        .eq('priority', 'high'),
    ])

    return NextResponse.json({
      members_count: members.count || 0,
      sessions_today: sessions.count || 0,
      alerts_urgent: alerts.count || 0,
      satisfaction_avg: 4.2, // TODO: calculer vraiment
    })
  },
  { roles: ['super_admin', 'gym_manager'] }
)
```

**Routes à créer/refactor :**
- `/api/dashboard/overview/stats` → KPIs
- `/api/dashboard/overview/trends` → Graphe
- `/api/dashboard/overview/alerts` → Alertes
- `/api/dashboard/members` → Liste membres
- `/api/dashboard/members/[id]` → Détail membre
- Garder routes existantes : `/api/admin/gyms`, `/api/admin/users`

---

## 🎯 PHASE 6 : TESTS & VALIDATION (Jour 4 - 2h)

### **6.1 Tests Manuels (1h)**

**Checklist :**
- [ ] Login super_admin → accès dashboard admin
- [ ] Login gym_manager → accès dashboard gérant (pas admin)
- [ ] Créer une salle (admin)
- [ ] Inviter un manager
- [ ] Manager accepte invitation
- [ ] Manager voit sa salle uniquement
- [ ] Exporter CSV membres
- [ ] Modifier settings
- [ ] Tester responsive (mobile, tablet)
- [ ] Vérifier design monochrome cohérent

---

### **6.2 Tests E2E Critiques (1h)**

**Fichier :** `tests/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard Admin', () => {
  test('super_admin can access admin pages', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@jarvis-group.net')
    await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')

    // Check redirect
    await expect(page).toHaveURL('/dashboard')

    // Navigate to gyms
    await page.click('a[href="/admin/gyms"]')
    await expect(page).toHaveURL('/admin/gyms')
    await expect(page.locator('h1')).toContainText('Salles de sport')
  })

  test('gym_manager cannot access admin pages', async ({ page }) => {
    // Login as manager
    await page.goto('/login')
    await page.fill('[name="email"]', 'manager@gym-test.com')
    await page.fill('[name="password"]', process.env.TEST_MANAGER_PASSWORD!)
    await page.click('button[type="submit"]')

    // Try to access admin page
    await page.goto('/admin/gyms')
    await expect(page.locator('text=Accès refusé')).toBeVisible()
  })
})
```

---

## 🎯 PHASE 7 : DÉPLOIEMENT (Jour 4 - 30 min)

### **7.1 Pre-Deploy Checklist**
- [ ] `npm run build` passe sans erreur
- [ ] Linter `npm run lint` clean
- [ ] Tests E2E passent
- [ ] Design monochrome sur toutes pages
- [ ] Responsive OK (mobile, tablet, desktop)
- [ ] Performance Lighthouse > 90

### **7.2 Deploy Vercel**
```bash
git add -A
git commit -m "feat: Dashboard V2 monochrome professionnel"
git push origin main
```

Vercel déploie automatiquement sur `app.jarvis-group.net`

### **7.3 Post-Deploy Validation**
- [ ] Tester en production
- [ ] Vérifier monitoring Sentry (pas d'erreurs)
- [ ] Vérifier analytics (page views)

---

## 📊 MÉTRIQUES SUCCÈS

### **Technique**
- ✅ Build time < 5 min
- ✅ Bundle size < 500KB (FCP)
- ✅ Lighthouse Performance > 90
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings

### **UX**
- ✅ Design 100% monochrome cohérent
- ✅ Responsive mobile/tablet/desktop
- ✅ Temps chargement page < 1s
- ✅ Navigation intuitive (breadcrumbs)

### **Business**
- ✅ Dashboard présentable à client pilote
- ✅ Toutes features promises fonctionnelles
- ✅ Zéro dette technique (code clean)

---

## 🚨 RISQUES & MITIGATION

| **Risque** | **Probabilité** | **Impact** | **Mitigation** |
|-----------|----------------|-----------|---------------|
| Casser Kiosk | Faible | CRITIQUE | Tests manuels exhaustifs après refactor |
| Build errors | Moyen | Majeur | Fix params Next.js 15 en premier |
| Design incohérent | Faible | Mineur | Design system strict + review |
| Timeline dépassé | Moyen | Mineur | Prioriser pages core (overview, gyms, users) |

---

## 📝 NOTES & DÉCISIONS

### **Pourquoi 1 app unifiée (pas 2 apps) ?**
- Pas encore de clients (MVP)
- Setup plus simple (1 déploiement)
- Évolution vers 2 apps possible plus tard

### **Pourquoi supprimer Chakra UI ?**
- 14.5MB bundle size économisés
- 1 seule lib UI = cohérence
- shadcn/ui plus moderne (2024 vs 2021)

### **Pourquoi supprimer ancien dashboard ?**
- Pas de demi-mesure (refonte = clean slate)
- Git existe pour récupérer si besoin
- Dette technique = 0

---

## ✅ VALIDATION FINALE

**Avant de commencer :**
- [ ] Lire ce document en entier
- [ ] Valider décisions avec équipe
- [ ] Backup BDD prod (au cas où)

**Pendant développement :**
- [ ] Suivre phases dans l'ordre
- [ ] Commit après chaque phase
- [ ] Tester après chaque commit

**Après déploiement :**
- [ ] Démo client pilote
- [ ] Feedback utilisateurs
- [ ] Itération rapide

---

**FIN DU PLAN - PRÊT À EXÉCUTER 🚀**

