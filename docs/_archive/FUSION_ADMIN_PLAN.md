# 🔀 PLAN FUSION /admin → /dashboard

**Date** : 23 octobre 2025  
**Phase** : 1.2  
**Objectif** : Supprimer duplication `/admin` et `/dashboard`

---

## 📊 ANALYSE ACTUELLE

### Pages `/admin` (à migrer)

```
/admin/
├── page.tsx ← redirect vers /dashboard ✅
├── monitoring/page.tsx ← Monitoring global (super_admin only)
├── repair/page.tsx ← Réparation BDD (super_admin only)
├── franchises/
│   ├── page.tsx ← Liste franchises (CRUD)
│   ├── create/page.tsx ← Créer franchise
│   ├── [id]/page.tsx ← Détails franchise
│   ├── [id]/monitoring/page.tsx ← Monitoring franchise
│   └── [id]/gyms/ ← Gestion salles
│       ├── page.tsx
│       ├── create/page.tsx
│       ├── [gymId]/page.tsx
│       └── [gymId]/edit/page.tsx
├── sessions/live/page.tsx ← DUPLICATION avec /dashboard
└── team/page.tsx ← DUPLICATION avec /dashboard
```

### Pages `/dashboard` (existantes)

```
/dashboard/
├── page.tsx ← redirect vers /sentry ✅
├── sentry/page.tsx ← Dashboard principal
├── franchises/
│   ├── page.tsx ← Liste franchises (vue manager)
│   └── [id]/ ← Détails franchise (vue manager)
├── gyms/page.tsx ← Liste salles
├── sessions/live/page.tsx ← DUPLICATION
├── team/page.tsx ← DUPLICATION
├── members/
├── settings/
└── issues/
```

---

## 🎯 STRATÉGIE DE FUSION

### Principe : Dashboard unifié avec sections selon rôle

```
/dashboard/
├── page.tsx → Redirection selon rôle
├── overview/ → Dashboard principal (remplace /sentry)
├── monitoring/ ← MIGRATION de /admin/monitoring (super_admin only)
├── repair/ ← MIGRATION de /admin/repair (super_admin only)
├── franchises/
│   ├── page.tsx ← FUSION /admin + /dashboard (CRUD complet)
│   ├── create/page.tsx ← MIGRATION de /admin
│   └── [id]/
│       ├── page.tsx ← FUSION détails
│       ├── monitoring/page.tsx ← MIGRATION
│       └── gyms/ ← MIGRATION structure complète
├── gyms/
│   ├── page.tsx ← FUSION liste
│   ├── create/page.tsx ← NOUVEAU (si super_admin)
│   └── [gymId]/
│       ├── page.tsx ← Existant
│       └── edit/page.tsx ← MIGRATION
├── sessions/
│   └── live/page.tsx ← GARDER /dashboard, supprimer /admin
├── team/page.tsx ← GARDER /dashboard, supprimer /admin
├── members/
├── settings/
└── issues/
```

---

## 📝 PLAN D'EXÉCUTION

### Étape 1 : Migrer pages super_admin uniques

#### 1.1 Monitoring
```bash
# Migrer
mv src/app/admin/monitoring/page.tsx src/app/dashboard/monitoring/page.tsx

# Adapter le code (si besoin)
```

#### 1.2 Repair
```bash
# Migrer
mv src/app/admin/repair/page.tsx src/app/dashboard/repair/page.tsx
```

### Étape 2 : Fusionner pages franchises

#### 2.1 Liste franchises
```typescript
// src/app/dashboard/franchises/page.tsx
// FUSIONNER logique CRUD de /admin + vue liste de /dashboard
// Boutons conditionnels selon rôle
```

#### 2.2 Créer franchise
```bash
# Migrer
mv src/app/admin/franchises/create/page.tsx src/app/dashboard/franchises/create/page.tsx
```

#### 2.3 Détails franchise
```typescript
// src/app/dashboard/franchises/[id]/page.tsx
// FUSIONNER détails /admin + détails /dashboard
```

#### 2.4 Monitoring franchise
```bash
# Migrer
mv src/app/admin/franchises/[id]/monitoring/page.tsx \
   src/app/dashboard/franchises/[id]/monitoring/page.tsx
```

#### 2.5 Gestion salles dans franchise
```bash
# Migrer toute la structure
mv src/app/admin/franchises/[id]/gyms/* \
   src/app/dashboard/franchises/[id]/gyms/
```

### Étape 3 : Fusionner pages gyms

#### 3.1 Créer salle
```bash
# Migrer
mv src/app/admin/franchises/[id]/gyms/create/page.tsx \
   src/app/dashboard/gyms/create/page.tsx
```

#### 3.2 Éditer salle
```bash
# Migrer
mv src/app/admin/franchises/[id]/gyms/[gymId]/edit/page.tsx \
   src/app/dashboard/gyms/[gymId]/edit/page.tsx
```

### Étape 4 : Supprimer duplications

#### 4.1 Sessions live
```bash
# Garder /dashboard, supprimer /admin
rm src/app/admin/sessions/live/page.tsx
```

#### 4.2 Team
```bash
# Garder /dashboard, supprimer /admin
rm src/app/admin/team/page.tsx
```

### Étape 5 : Supprimer dossier /admin complet

```bash
# Supprimer TOUT /admin
rm -rf src/app/admin/
```

### Étape 6 : Créer redirects 301

```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      },
    ]
  },
}
```

### Étape 7 : Mettre à jour tous les liens

```bash
# Remplacer tous les liens /admin par /dashboard
grep -rl "/admin" src/ | xargs sed -i 's/\/admin/\/dashboard/g'
```

### Étape 8 : Adapter le layout

```typescript
// src/app/dashboard/layout.tsx
// Adapter la navigation selon rôle
// Sections visibles conditionnellement
```

---

## 🎭 GESTION DES RÔLES DANS LA NOUVELLE STRUCTURE

### Navigation adaptative

```typescript
// Navigation selon rôle
const navItems = {
  super_admin: [
    { label: 'Vue globale', href: '/dashboard' },
    { label: 'Monitoring', href: '/dashboard/monitoring' },
    { label: 'Réparation BDD', href: '/dashboard/repair' },
    { label: 'Franchises', href: '/dashboard/franchises' },
    { label: 'Salles', href: '/dashboard/gyms' },
    { label: 'Sessions', href: '/dashboard/sessions' },
    { label: 'Équipe', href: '/dashboard/team' },
  ],
  franchise_manager: [
    { label: 'Ma franchise', href: `/dashboard/franchises/${franchiseId}` },
    { label: 'Mes salles', href: '/dashboard/gyms' },
    { label: 'Sessions', href: '/dashboard/sessions' },
    { label: 'Équipe', href: '/dashboard/team' },
  ],
  gym_manager: [
    { label: 'Ma salle', href: `/dashboard/gyms/${gymId}` },
    { label: 'Membres', href: '/dashboard/members' },
    { label: 'Sessions', href: '/dashboard/sessions' },
  ],
  receptionist: [
    { label: 'Ma salle', href: `/dashboard/gyms/${gymId}` },
    { label: 'Membres', href: '/dashboard/members' },
  ],
}
```

### Boutons conditionnels

```typescript
// Boutons selon permissions
{user.role === 'super_admin' && (
  <Button href="/dashboard/franchises/create">
    Créer franchise
  </Button>
)}

{(user.role === 'super_admin' || user.role === 'franchise_manager') && (
  <Button href="/dashboard/gyms/create">
    Créer salle
  </Button>
)}
```

---

## 🧪 TESTS APRÈS FUSION

### 1. Tester chaque rôle

```bash
# Super admin
✅ Accès /dashboard/monitoring
✅ Accès /dashboard/repair
✅ Accès /dashboard/franchises (CRUD complet)
✅ Accès /dashboard/gyms (CRUD complet)

# Franchise manager
✅ Accès /dashboard/franchises/{id} (SA franchise)
❌ Pas accès /dashboard/monitoring
❌ Pas accès /dashboard/repair
✅ Peut créer salles dans SA franchise

# Gym manager
✅ Accès /dashboard/gyms/{id} (SA salle uniquement)
❌ Pas accès /dashboard/franchises
❌ Pas accès autres salles
```

### 2. Tester redirects

```bash
# Ancien lien /admin → /dashboard
curl -I https://jarvis.app/admin
# Attendu : 301 → /dashboard

# Ancien lien /admin/monitoring → /dashboard/monitoring
curl -I https://jarvis.app/admin/monitoring
# Attendu : 301 → /dashboard/monitoring
```

### 3. Tester liens internes

```bash
# Aucun lien mort vers /admin
grep -r "href=\"/admin" src/
# Attendu : Aucun résultat
```

---

## 📋 CHECKLIST

- [ ] 1. Migrer /admin/monitoring → /dashboard/monitoring
- [ ] 2. Migrer /admin/repair → /dashboard/repair
- [ ] 3. Fusionner /admin/franchises + /dashboard/franchises
- [ ] 4. Migrer CRUD franchises (create, edit, delete)
- [ ] 5. Migrer monitoring franchise
- [ ] 6. Migrer gestion salles dans franchise
- [ ] 7. Fusionner /admin/gyms + /dashboard/gyms
- [ ] 8. Migrer CRUD salles (create, edit)
- [ ] 9. Supprimer duplications (sessions/live, team)
- [ ] 10. Supprimer dossier /admin complet
- [ ] 11. Créer redirects 301 dans next.config.js
- [ ] 12. Remplacer tous liens /admin par /dashboard
- [ ] 13. Adapter layout navigation selon rôle
- [ ] 14. Tester accès pour chaque rôle
- [ ] 15. Tester redirects
- [ ] 16. Commit

---

**OBJECTIF** : UN SEUL dashboard `/dashboard` avec sections conditionnelles selon rôle ✅

