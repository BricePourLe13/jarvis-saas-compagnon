# 🔐 SYSTÈME D'AUTHENTIFICATION - Documentation

**Date** : 23 octobre 2025  
**Phase** : 1.1 - Middleware Auth  
**Statut** : ✅ Implémenté

---

## 🎯 OBJECTIF

Protéger **toutes** les routes `/dashboard` et `/admin` avec authentification Supabase + vérification des rôles.

---

## 🏗️ ARCHITECTURE

### Fichiers créés/modifiés

```
src/
├── middleware.ts                    ✅ Refactoré avec auth complète
└── lib/
    └── auth-helpers.ts              ✅ NOUVEAU - Helpers auth réutilisables
```

---

## 🔐 FONCTIONNEMENT

### 1. Middleware (`src/middleware.ts`)

**Ordre d'exécution** :

```
1. Request arrive sur /dashboard/*
   ↓
2. Middleware détecte route protégée
   ↓
3. Vérification auth Supabase (cookies)
   ↓
4. Si non authentifié → redirect /login?redirect=/dashboard/...
   ↓
5. Si authentifié → récupération profil (users table)
   ↓
6. Vérification is_active = true
   ↓
7. Vérification permissions selon rôle + route
   ↓
8. Si accès refusé → redirect vers page autorisée selon rôle
   ↓
9. Si accès OK → injection headers X-User-* pour API routes
   ↓
10. Request continue vers la page
```

### 2. Helpers Auth (`src/lib/auth-helpers.ts`)

**Fonctions principales** :

#### `verifyAuthMiddleware(request: NextRequest)`
- Vérifie l'auth Supabase dans le middleware
- Retourne `{ supabase, response, authUser, error }`

#### `getUserProfile(supabase, userId)`
- Récupère le profil complet depuis `users` table
- Retourne `AuthUser` avec rôle, gym_id, franchise_id, etc.

#### `canAccessRoute(user, pathname)`
- Vérifie si l'utilisateur peut accéder à cette route
- Retourne `{ allowed: boolean, redirectTo?: string }`

#### `getDefaultRedirectForRole(user)`
- Retourne la page par défaut selon le rôle :
  - `super_admin` → `/dashboard` (vue globale)
  - `franchise_manager` → `/dashboard/franchises/{id}`
  - `gym_manager` → `/dashboard/gyms/{id}`
  - `receptionist` → `/dashboard/gyms/{id}`

#### `canAccessResource(user, resourceType, resourceId)`
- Vérifie si l'utilisateur peut accéder à une ressource spécifique
- Exemples :
  - Super admin : accès complet ✅
  - Franchise manager : accès à SA franchise uniquement
  - Gym manager : accès à SA salle uniquement

---

## 🎭 GESTION DES RÔLES

### Hiérarchie

```
super_admin (accès complet)
    ↓
franchise_manager (sa franchise + ses salles)
    ↓
gym_manager (sa salle uniquement)
    ↓
receptionist (sa salle uniquement, lecture seule)
```

### Permissions par route

| Route | super_admin | franchise_manager | gym_manager | receptionist |
|-------|-------------|-------------------|-------------|--------------|
| `/dashboard/monitoring` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/franchises/:id` | ✅ | ✅ (si SA franchise) | ❌ | ❌ |
| `/dashboard/gyms/:id` | ✅ | ✅ (si salle de SA franchise) | ✅ (si SA salle) | ✅ (si SA salle) |
| `/dashboard/sessions` | ✅ | ✅ (sessions de sa franchise) | ✅ (sessions de sa salle) | ✅ (sessions de sa salle) |

---

## 🔒 SÉCURITÉ

### Headers injectés

Pour chaque requête authentifiée, le middleware ajoute :

```
X-User-Id: UUID
X-User-Role: super_admin | franchise_manager | gym_manager | receptionist
X-User-Gym-Id: UUID (si applicable)
X-User-Franchise-Id: UUID (si applicable)
```

Ces headers peuvent être utilisés dans les API routes pour validation côté serveur.

### Redirections

| Cas | Redirect |
|-----|----------|
| Non authentifié | `/login?redirect={pathname}` |
| Compte inactif | `/login?error=account_inactive` |
| Accès refusé | Route par défaut selon rôle |
| Erreur auth | `/login?error=auth_error` |

---

## 🧪 TESTS

### Tests manuels

#### 1. Test non authentifié

```bash
# Ouvrir en navigation privée
http://localhost:3000/dashboard
# Attendu : Redirect vers /login?redirect=/dashboard
```

#### 2. Test authentifié super_admin

```bash
# Se connecter avec super_admin
http://localhost:3000/dashboard
# Attendu : Accès OK, affiche dashboard global
```

#### 3. Test gym_manager tente d'accéder à autre salle

```bash
# Se connecter avec gym_manager (gym_id = A)
http://localhost:3000/dashboard/gyms/B
# Attendu : Redirect vers /dashboard/gyms/A
```

#### 4. Test franchise_manager tente d'accéder à monitoring

```bash
# Se connecter avec franchise_manager
http://localhost:3000/dashboard/monitoring
# Attendu : Redirect vers /dashboard/franchises/{id}
```

### Tests E2E (TODO Phase 1.5)

```typescript
// tests/auth.spec.ts
describe('Auth Middleware', () => {
  test('Unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login\?redirect/)
  })
  
  test('Gym manager cannot access other gyms', async ({ page }) => {
    await loginAsGymManager(page, 'gym-a')
    await page.goto('/dashboard/gyms/gym-b')
    await expect(page).toHaveURL(/\/dashboard\/gyms\/gym-a/)
  })
  
  test('Franchise manager can access their franchise', async ({ page }) => {
    await loginAsFranchiseManager(page, 'franchise-x')
    await page.goto('/dashboard/franchises/franchise-x')
    await expect(page).toHaveURL(/\/dashboard\/franchises\/franchise-x/)
  })
})
```

---

## 🔧 USAGE DANS LES API ROUTES

### Exemple : Protéger une API route

```typescript
// src/app/api/dashboard/gyms/[gymId]/route.ts
import { verifyAuthAPI, forbiddenResponse } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  // 1. Vérifier l'auth
  const { authenticated, user } = await verifyAuthAPI(request)
  
  if (!authenticated || !user) {
    return unauthorizedResponse()
  }
  
  // 2. Vérifier les permissions
  if (user.role === 'gym_manager' && user.gym_id !== params.gymId) {
    return forbiddenResponse('Vous ne pouvez accéder qu\'à votre salle')
  }
  
  // 3. Suite du traitement...
  const gymData = await fetchGymData(params.gymId)
  return NextResponse.json(gymData)
}
```

---

## 📊 LOGS

Le middleware log toutes les actions d'auth :

```
✅ [AUTH] Accès autorisé - userId: xxx, role: gym_manager, pathname: /dashboard/gyms/yyy
🔒 [AUTH] Utilisateur non authentifié - pathname: /dashboard
🔒 [AUTH] Accès refusé - userId: xxx, role: gym_manager, pathname: /dashboard/gyms/zzz
❌ [AUTH] Erreur middleware auth - error: xxx
```

Ces logs sont envoyés à :
- Console (dev)
- Sentry (prod, erreurs uniquement)

---

## 🚀 PROCHAINES ÉTAPES

### Phase 1.2 : Fusion /admin → /dashboard
- Supprimer duplication `/admin`
- Migrer toutes pages vers `/dashboard`
- Redirects 301

### Phase 1.3 : RLS strict
- Helpers sécurisés pour queries Supabase
- Isolation par gym_id au niveau BDD
- Audit logs

### Phase 1.4 : Tests E2E
- Playwright setup
- Tests auth complets
- Tests permissions

---

## 🐛 TROUBLESHOOTING

### "Redirect loop /login → /dashboard → /login"

**Cause** : Le middleware vérifie `/dashboard` AVANT que Supabase ait refresh le token.

**Solution** : Ajouter `/login` et `/auth/*` aux routes exclues du middleware.

```typescript
// middleware.ts
const protectedPaths = ['/dashboard', '/admin']
const publicPaths = ['/login', '/auth', '/kiosk', '/landing-client']

if (isProtectedRoute && !publicPaths.some(p => pathname.startsWith(p))) {
  // Auth logic...
}
```

### "Headers X-User-* non reçus dans API route"

**Cause** : Le middleware n'injecte les headers que pour `/dashboard` et `/admin`, pas pour `/api`.

**Solution** : Utiliser `verifyAuthAPI()` directement dans l'API route.

---

**FIN DE LA DOCUMENTATION AUTH**

✅ Middleware auth complet  
✅ Helpers réutilisables  
✅ Gestion rôles + permissions  
✅ Redirections sécurisées  
🔄 Tests E2E à implémenter

