# 🔒 SYSTÈME RLS & SÉCURITÉ - Documentation

**Date** : 23 octobre 2025  
**Phase** : 1.3 - RLS Strict  
**Statut** : ✅ Implémenté

---

## 🎯 OBJECTIF

Garantir l'**isolation complète des données** au niveau base de données + code, selon le rôle de l'utilisateur.

---

## 🏗️ ARCHITECTURE

### Niveaux de sécurité

```
1. Middleware Auth (authentification)
   ↓
2. Helpers Secure Queries (autorisation + isolation)
   ↓
3. RLS Supabase (dernier rempart BDD)
   ↓
4. Audit Logs (traçabilité)
```

---

## 🔐 HELPERS SÉCURISÉS

### Fichier : `src/lib/secure-queries.ts`

**Fonctions principales** :

#### 1. `applyUserFilter(query, user, resourceType)`
- Applique automatiquement les filtres selon le rôle
- Garantit que les queries ne retournent QUE les données autorisées

**Exemples** :
```typescript
// Super admin → Pas de filtre (accès complet)
applyUserFilter(query, superAdmin, 'gym') 
// → retourne toutes les salles

// Gym manager → Filtre par gym_id
applyUserFilter(query, gymManager, 'member') 
// → query.eq('gym_id', gymManager.gym_id)

// Franchise manager → Filtre par franchise_id
applyUserFilter(query, franchiseManager, 'gym') 
// → query.eq('franchise_id', franchiseManager.franchise_id)
```

#### 2. Helpers par ressource

##### Gyms
- `getAccessibleGyms(options)` - Liste salles accessibles
- `getGymById(gymId, options)` - Une salle (avec vérification)

##### Members
- `getAccessibleMembers(gymId, options)` - Liste membres accessibles
- `getMemberById(memberId, options)` - Un membre (avec vérification)

##### Sessions
- `getAccessibleSessions(gymId, options)` - Liste sessions accessibles

##### Franchises
- `getAccessibleFranchises(options)` - Liste franchises accessibles
- `getFranchiseById(franchiseId, options)` - Une franchise (avec vérification)

#### 3. Audit Logging
- `logAuditAction(action, type, id, details, options)` - Logger toutes actions sensibles

---

## 💻 USAGE DANS LES API ROUTES

### Exemple complet

```typescript
// src/app/api/dashboard/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthAPI, unauthorizedResponse } from '@/lib/auth-helpers'
import { getAccessibleMembers } from '@/lib/secure-queries'
import { createServerClientWithConfig } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // 1. Vérifier l'authentification
  const { authenticated, user } = await verifyAuthAPI(request)
  
  if (!authenticated || !user) {
    return unauthorizedResponse()
  }

  // 2. Créer client Supabase avec cookies
  const cookieStore = cookies()
  const supabase = createServerClientWithConfig(cookieStore)

  // 3. Récupérer membres avec isolation automatique
  const { data: members, error } = await getAccessibleMembers(null, {
    user,
    supabase,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  // 4. Retourner les données
  return NextResponse.json({ members })
}
```

### Exemple avec vérification ID

```typescript
// src/app/api/dashboard/gyms/[gymId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  const { authenticated, user } = await verifyAuthAPI(request)
  
  if (!authenticated || !user) {
    return unauthorizedResponse()
  }

  const cookieStore = cookies()
  const supabase = createServerClientWithConfig(cookieStore)

  // Vérification automatique des permissions
  const { data: gym, error } = await getGymById(params.gymId, {
    user,
    supabase,
  })

  if (error) {
    // Erreur ou accès refusé
    return NextResponse.json({ error }, { status: error === 'Accès refusé à cette salle' ? 403 : 500 })
  }

  return NextResponse.json({ gym })
}
```

### Exemple avec audit log

```typescript
// src/app/api/dashboard/members/[memberId]/route.ts
import { logAuditAction } from '@/lib/secure-queries'

export async function PUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const { authenticated, user } = await verifyAuthAPI(request)
  
  if (!authenticated || !user) {
    return unauthorizedResponse()
  }

  const cookieStore = cookies()
  const supabase = createServerClientWithConfig(cookieStore)

  // 1. Vérifier accès au membre
  const { data: member, error: accessError } = await getMemberById(
    params.memberId,
    { user, supabase }
  )

  if (accessError) {
    return NextResponse.json({ error: accessError }, { status: 403 })
  }

  // 2. Effectuer la mise à jour
  const updates = await request.json()
  const { error: updateError } = await supabase
    .from('gym_members_v2')
    .update(updates)
    .eq('id', params.memberId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 3. Logger l'action
  await logAuditAction(
    'member_updated',
    'member',
    params.memberId,
    { fields_changed: Object.keys(updates) },
    { user, supabase }
  )

  return NextResponse.json({ success: true })
}
```

---

## 🛡️ MATRICE DE PERMISSIONS

### Super Admin
| Ressource | Liste | Voir | Créer | Modifier | Supprimer |
|-----------|-------|------|-------|----------|-----------|
| Franchises | ✅ Toutes | ✅ Toutes | ✅ | ✅ | ✅ |
| Gyms | ✅ Toutes | ✅ Toutes | ✅ | ✅ | ✅ |
| Members | ✅ Tous | ✅ Tous | ✅ | ✅ | ✅ |
| Sessions | ✅ Toutes | ✅ Toutes | ❌ | ✅ | ✅ |

### Franchise Manager
| Ressource | Liste | Voir | Créer | Modifier | Supprimer |
|-----------|-------|------|-------|----------|-----------|
| Franchises | ✅ SA franchise | ✅ SA franchise | ❌ | ✅ SA franchise | ❌ |
| Gyms | ✅ Ses salles | ✅ Ses salles | ✅ Dans SA franchise | ✅ Ses salles | ✅ Ses salles |
| Members | ✅ Ses salles | ✅ Ses salles | ✅ Ses salles | ✅ Ses salles | ✅ Ses salles |
| Sessions | ✅ Ses salles | ✅ Ses salles | ❌ | ❌ | ❌ |

### Gym Manager
| Ressource | Liste | Voir | Créer | Modifier | Supprimer |
|-----------|-------|------|-------|----------|-----------|
| Franchises | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gyms | ✅ SA salle | ✅ SA salle | ❌ | ✅ SA salle | ❌ |
| Members | ✅ SA salle | ✅ SA salle | ✅ SA salle | ✅ SA salle | ✅ SA salle |
| Sessions | ✅ SA salle | ✅ SA salle | ❌ | ❌ | ❌ |

### Receptionist
| Ressource | Liste | Voir | Créer | Modifier | Supprimer |
|-----------|-------|------|-------|----------|-----------|
| Franchises | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gyms | ✅ SA salle | ✅ SA salle | ❌ | ❌ | ❌ |
| Members | ✅ SA salle | ✅ SA salle | ✅ SA salle | ✅ SA salle (limité) | ❌ |
| Sessions | ✅ SA salle | ✅ SA salle | ❌ | ❌ | ❌ |

---

## 🔒 RLS SUPABASE (Dernier rempart)

### Policies recommandées

#### Table `gym_members_v2`

```sql
-- Policy: Les utilisateurs peuvent voir les membres de leur(s) salle(s)
CREATE POLICY "users_can_view_their_gym_members"
ON gym_members_v2
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users
    WHERE 
      -- Super admin : tout
      role = 'super_admin'
      OR
      -- Gym manager : sa salle
      (role = 'gym_manager' AND gym_id = gym_members_v2.gym_id)
      OR
      -- Franchise manager : salles de sa franchise
      (role = 'franchise_manager' AND franchise_id IN (
        SELECT franchise_id FROM gyms WHERE id = gym_members_v2.gym_id
      ))
  )
);

-- Policy: Les utilisateurs peuvent modifier les membres de leur(s) salle(s)
CREATE POLICY "users_can_update_their_gym_members"
ON gym_members_v2
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users
    WHERE 
      role = 'super_admin'
      OR
      (role = 'gym_manager' AND gym_id = gym_members_v2.gym_id)
      OR
      (role = 'franchise_manager' AND franchise_id IN (
        SELECT franchise_id FROM gyms WHERE id = gym_members_v2.gym_id
      ))
  )
);
```

#### Table `gyms`

```sql
-- Policy: Voir les salles accessibles
CREATE POLICY "users_can_view_their_gyms"
ON gyms
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users
    WHERE 
      role = 'super_admin'
      OR
      (role = 'gym_manager' AND gym_id = gyms.id)
      OR
      (role = 'franchise_manager' AND franchise_id = gyms.franchise_id)
  )
);
```

---

## 🧪 TESTS DE SÉCURITÉ

### Test 1 : Isolation gym manager

```typescript
// Test : Gym manager ne peut pas voir autres salles
describe('Gym Manager Isolation', () => {
  test('Cannot access other gyms', async () => {
    const gymManagerA = { role: 'gym_manager', gym_id: 'gym-a' }
    
    const { data } = await getGymById('gym-b', {
      user: gymManagerA,
      supabase,
    })
    
    expect(data).toBeNull() // Accès refusé
  })
})
```

### Test 2 : Isolation franchise manager

```typescript
// Test : Franchise manager ne peut pas voir autres franchises
describe('Franchise Manager Isolation', () => {
  test('Cannot access other franchises', async () => {
    const franchiseManagerX = { 
      role: 'franchise_manager', 
      franchise_id: 'franchise-x' 
    }
    
    const { data } = await getFranchiseById('franchise-y', {
      user: franchiseManagerX,
      supabase,
    })
    
    expect(data).toBeNull() // Accès refusé
  })
})
```

### Test 3 : Super admin accès complet

```typescript
// Test : Super admin peut tout voir
describe('Super Admin Access', () => {
  test('Can access all resources', async () => {
    const superAdmin = { role: 'super_admin' }
    
    const { data: gyms } = await getAccessibleGyms({
      user: superAdmin,
      supabase,
    })
    
    expect(gyms.length).toBeGreaterThan(0) // Toutes les salles
  })
})
```

---

## 📊 AUDIT LOGS

### Table `user_activity_logs`

**Structure** :
```sql
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Actions trackées** :
- `member_created`
- `member_updated`
- `member_deleted`
- `gym_created`
- `gym_updated`
- `user_invited`
- `permissions_updated`

---

## 🚨 SÉCURITÉ CRITIQUE

### ⚠️ À NE JAMAIS FAIRE

```typescript
// ❌ BAD: Query directe sans isolation
const { data } = await supabase
  .from('gym_members_v2')
  .select('*')
// → Retourne TOUS les membres (fuite de données)

// ✅ GOOD: Utiliser les helpers sécurisés
const { data } = await getAccessibleMembers(gymId, { user, supabase })
// → Retourne UNIQUEMENT les membres autorisés
```

### ⚠️ Service Role à utiliser AVEC PRÉCAUTION

```typescript
// ❌ BAD: Service role sans vérification
const supabase = createAdminClient()
const { data } = await supabase.from('gym_members_v2').select('*')
// → Bypass RLS, fuite de données

// ✅ GOOD: Vérifier permissions AVANT d'utiliser service_role
if (user.role !== 'super_admin') {
  return forbiddenResponse()
}
const supabase = createAdminClient()
// → OK car vérifié manuellement
```

---

## 📋 CHECKLIST SÉCURITÉ

- [x] Middleware auth sur toutes routes dashboards
- [x] Helpers sécurisés créés
- [x] Filters automatiques selon rôle
- [x] Vérifications accès par ID
- [x] Audit logs implémentés
- [ ] RLS policies Supabase (à déployer en BDD)
- [ ] Tests E2E sécurité
- [ ] Audit externe (optionnel)

---

**FIN DE LA DOCUMENTATION RLS**

✅ Isolation garantie au niveau code  
✅ Helpers réutilisables  
✅ Audit trail complet  
🔄 RLS Supabase à déployer  
🔄 Tests E2E à implémenter

