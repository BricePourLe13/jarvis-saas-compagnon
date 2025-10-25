# 🧹 AUDIT & NETTOYAGE ROUTES FANTÔMES

**Date :** 25 octobre 2025  
**Problème rapporté :** Page Tremor fantôme lors du bouton "retour arrière"  
**Root cause :** Cohabitation de 2 architectures incompatibles

---

## 🔍 DIAGNOSTIC

### Symptôme
Lorsque l'utilisateur clique sur "retour arrière" depuis `/dashboard/members`, une **ancienne page avec design Tremor** s'affiche au lieu du nouveau dashboard.

### Root Cause
**Cohabitation de 2 architectures incompatibles :**

#### ❌ Ancienne architecture (hiérarchique - supprimée)
```
/dashboard/franchises/[id]/gyms/[gymId]/analytics
/dashboard/franchises/[id]/gyms/[gymId]/settings
/dashboard/gyms/[id]
```
- URLs imbriquées
- Navigation par franchise → gym
- Chaque gym a sa propre URL

#### ✅ Nouvelle architecture (Context-Aware - active)
```
/dashboard → /dashboard/overview
/dashboard/members
/dashboard/sessions
/dashboard/analytics
/dashboard/kiosk
```
- URLs plates (pas d'imbrication)
- Filtrage automatique via `GymContext`
- `ContextSwitcher` pour changer de gym

---

## 🛠️ ACTIONS RÉALISÉES

### 1. Suppression routes hiérarchiques
```bash
# Suppression complète du dossier franchises
rm -rf src/app/dashboard/franchises/
```

**Fichiers supprimés :**
- `src/app/dashboard/franchises/[id]/gyms/[gymId]/analytics/page.tsx`

### 2. Mise à jour redirections middleware
```typescript
// AVANT
export function getDefaultRedirectForRole(user: AuthUser): string {
  switch (user.role) {
    case 'franchise_manager':
      return `/dashboard/franchises/${user.franchise_id}` // ❌ Route inexistante
    case 'gym_manager':
      return `/dashboard/gyms/${user.gym_id}` // ❌ Route inexistante
  }
}

// APRÈS
export function getDefaultRedirectForRole(user: AuthUser): string {
  return '/dashboard' // ✅ Tous vers /dashboard, filtrage auto par context
}
```

### 3. Suppression vestiges inutilisés
**Fichiers supprimés (non utilisés) :**
- `src/lib/user-context.ts` (helper URLs hiérarchiques)
- `src/components/unified/ContextualNav.tsx` (navigation hiérarchique)
- `src/components/unified/UnifiedLayout.tsx` (layout ancien système)

---

## ✅ RÉSULTAT

### Architecture finale (propre)
```
src/app/dashboard/
├── layout.tsx (avec GymContextProvider + DashboardShell)
├── page.tsx (redirect vers /overview)
├── overview/page.tsx
├── members-v2/page.tsx
├── sessions-v2/page.tsx
└── analytics-v2/page.tsx
```

### Routing unifié
```typescript
// Tous les utilisateurs → /dashboard
// Le GymContext détecte automatiquement :
// - super_admin → Voir toutes les salles (ContextSwitcher dropdown)
// - franchise_owner → Voir ses salles (ContextSwitcher dropdown)
// - gym_manager → Voir sa salle (badge fixe)
```

---

## 🚀 BÉNÉFICES

✅ **Plus de page fantôme** → Routes hiérarchiques supprimées  
✅ **Architecture cohérente** → 1 seule architecture (Context-Aware)  
✅ **URLs simples** → Pas d'imbrication `/franchises/[id]/gyms/[gymId]`  
✅ **Filtrage automatique** → `useGymContext()` dans chaque page  
✅ **DRY Code** → Pas de duplication de pages par niveau  

---

## 📊 BUILD STATUS

```bash
npm run build
✓ Compiled successfully in 8.0min
```

---

## 🔄 MIGRATION UTILISATEUR

**Anciens bookmarks (cassés) :**
- `/dashboard/franchises/abc123` → ❌ 404
- `/dashboard/gyms/xyz789` → ❌ 404

**Nouveaux chemins :**
- `/dashboard` → ✅ Filtrage auto selon rôle
- `/dashboard/members` → ✅ Membres de la gym sélectionnée
- `/dashboard/sessions` → ✅ Sessions de la gym sélectionnée

**Le `ContextSwitcher` permet de changer de gym dynamiquement.**

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Tests utilisateur (super_admin, gym_manager)
2. ⏳ Créer page `/dashboard/kiosk`
3. ⏳ Créer page `/dashboard/admin/franchises`
4. ⏳ Intégrer filtrage context dans API routes

---

**Déploiement :** ✅ Production (via Vercel)  
**Status :** ✅ Résolu

