# 🔐 GUIDE DES CLIENTS SUPABASE

**Date :** 13 novembre 2025  
**Version :** 1.0  
**Projet :** JARVIS SaaS

---

## 📋 **LES 3 CLIENTS SUPABASE DANS LE PROJET**

Le projet utilise **3 façons différentes** d'accéder à Supabase selon le contexte. **NE PAS SE TROMPER** → sécurité critique.

---

## 1️⃣ **SUPABASE SINGLETON (Browser Client)**

### **Fichier :** `src/lib/supabase-singleton.ts`

### **Quand l'utiliser ?**
✅ **Côté CLIENT (navigateur)**  
✅ Dans les composants React  
✅ Dans les hooks (`useState`, `useEffect`, etc.)  
✅ Pour les requêtes utilisateur authentifié

### **Caractéristiques**
- ✅ Utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publique)
- ✅ Respecte les **Row Level Security (RLS)**
- ✅ Utilise les cookies pour la session
- ❌ Pas d'accès aux données des autres utilisateurs
- ❌ Ne peut pas bypasser RLS

### **Exemples d'usage**
```typescript
// ✅ CORRECT : Dans un composant React
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export default function MyComponent() {
  const handleLogout = async () => {
    const supabase = getSupabaseSingleton()
    await supabase.auth.signOut()
  }
  
  return <button onClick={handleLogout}>Logout</button>
}
```

```typescript
// ✅ CORRECT : Dans un hook
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export function useGyms() {
  const [gyms, setGyms] = useState([])
  
  useEffect(() => {
    const supabase = getSupabaseSingleton()
    
    // Requête filtréepar RLS (user voit seulement SES salles)
    const { data } = await supabase
      .from('gyms')
      .select('*')
    
    setGyms(data)
  }, [])
  
  return gyms
}
```

---

## 2️⃣ **SUPABASE SERVICE (Service Role)**

### **Fichier :** `src/lib/supabase-service.ts`

### **Quand l'utiliser ?**
✅ **Côté SERVEUR uniquement** (API Routes, Edge Functions)  
✅ Pour les opérations ADMIN qui **doivent bypasser RLS**  
✅ Pour créer des utilisateurs (`supabase.auth.admin.createUser`)  
✅ Pour modifier des données cross-tenant (super admin)

### **Caractéristiques**
- ✅ Utilise `SUPABASE_SERVICE_ROLE_KEY` (**secret**, jamais côté client)
- ❌ **BYPASS COMPLET du RLS** → très puissant, très dangereux
- ✅ Accès total à TOUTES les données de TOUS les utilisateurs
- ⚠️ **À utiliser avec EXTRÊME PRUDENCE**

### **Exemples d'usage**
```typescript
// ✅ CORRECT : Créer un utilisateur (API Route)
import { getSupabaseService } from '@/lib/supabase-service'

export async function POST(request: Request) {
  const supabase = getSupabaseService()
  
  // Créer un utilisateur avec le service role
  const { data: authUser, error } = await supabase.auth.admin.createUser({
    email: 'manager@gym.com',
    password: 'temp123',
    email_confirm: true
  })
  
  // Mettre à jour le profil (bypass RLS)
  await supabase
    .from('users')
    .update({ role: 'gym_manager', gym_id: gymId })
    .eq('id', authUser.user.id)
  
  return NextResponse.json({ success: true })
}
```

```typescript
// ✅ CORRECT : Super admin accède à toutes les salles
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET(request: Request) {
  const supabase = getSupabaseService()
  
  // Bypass RLS pour lister TOUTES les salles
  const { data: gyms } = await supabase
    .from('gyms')
    .select('*')
  
  return NextResponse.json({ gyms })
}
```

### **⚠️ QUAND NE PAS L'UTILISER**
```typescript
// ❌ INCORRECT : Ne PAS utiliser dans un composant React
import { getSupabaseService } from '@/lib/supabase-service'

export default function MyComponent() {
  // ❌ DANGER : Service role exposé côté client !
  const supabase = getSupabaseService()
  // ...
}
```

---

## 3️⃣ **SUPABASE SERVER (API Routes avec RLS)**

### **Quand l'utiliser ?**
✅ **Côté SERVEUR** (API Routes)  
✅ Quand tu veux **respecter les RLS** même côté serveur  
✅ Pour les requêtes utilisateur spécifiques (filtrage par `gym_id`, `user_id`)  
✅ Quand tu n'as pas besoin de bypasser RLS

### **Caractéristiques**
- ✅ Utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mais côté serveur)
- ✅ Respecte les **Row Level Security (RLS)**
- ✅ Utilise les cookies pour identifier l'utilisateur
- ❌ Ne peut pas bypasser RLS

### **Exemple d'usage**
```typescript
// ✅ CORRECT : API Route avec RLS
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  // Respecte RLS : user voit seulement SES données
  const { data: gyms } = await supabase
    .from('gyms')
    .select('*')
  
  return NextResponse.json({ gyms })
}
```

---

## 📊 **TABLEAU COMPARATIF**

| Critère | Singleton (Browser) | Service (Admin) | Server (avec RLS) |
|---------|-------------------|-----------------|-------------------|
| **Côté** | Client (navigateur) | Serveur uniquement | Serveur uniquement |
| **Clé API** | `ANON_KEY` | `SERVICE_ROLE_KEY` | `ANON_KEY` |
| **RLS** | ✅ Respecté | ❌ Bypassé | ✅ Respecté |
| **Usage** | Composants React | Ops admin critiques | API routes standards |
| **Sécurité** | ✅ Sûr | ⚠️ Très dangereux | ✅ Sûr |
| **Accès données** | User uniquement | TOUT | User uniquement |

---

## 🚨 **RÈGLES DE SÉCURITÉ ABSOLUES**

### ✅ **À FAIRE**
1. ✅ Utiliser **Singleton** côté client (composants React)
2. ✅ Utiliser **Service** uniquement pour ops admin (créer users, bypass RLS)
3. ✅ Utiliser **Server** pour API routes standards (avec RLS)
4. ✅ Toujours valider les permissions utilisateur en plus du RLS

### ❌ **NE JAMAIS FAIRE**
1. ❌ **JAMAIS** utiliser `Service` côté client
2. ❌ **JAMAIS** exposer `SERVICE_ROLE_KEY` dans `NEXT_PUBLIC_*`
3. ❌ **JAMAIS** bypasser RLS sans raison valide
4. ❌ **JAMAIS** faire confiance aux données client sans validation

---

## 🎯 **ARBRE DE DÉCISION**

```
Est-ce que je code côté CLIENT (composant React) ?
│
├─ OUI → Singleton (getSupabaseSingleton)
│
└─ NON → Je code côté SERVEUR (API Route)
    │
    ├─ Est-ce que j'ai besoin de BYPASSER RLS ?
    │   │
    │   ├─ OUI → Est-ce vraiment nécessaire ?
    │   │   │
    │   │   ├─ OUI (créer user, admin ops) → Service (getSupabaseService)
    │   │   │
    │   │   └─ NON → Repense ton approche, RLS existe pour une raison
    │   │
    │   └─ NON → Server (createServerClient avec ANON_KEY)
```

---

## 📚 **RESSOURCES**

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth - Admin Functions](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [Next.js App Router + Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**🔐 LA SÉCURITÉ EST CRITIQUE. EN CAS DE DOUTE, DEMANDE.**


**Date :** 13 novembre 2025  
**Version :** 1.0  
**Projet :** JARVIS SaaS

---

## 📋 **LES 3 CLIENTS SUPABASE DANS LE PROJET**

Le projet utilise **3 façons différentes** d'accéder à Supabase selon le contexte. **NE PAS SE TROMPER** → sécurité critique.

---

## 1️⃣ **SUPABASE SINGLETON (Browser Client)**

### **Fichier :** `src/lib/supabase-singleton.ts`

### **Quand l'utiliser ?**
✅ **Côté CLIENT (navigateur)**  
✅ Dans les composants React  
✅ Dans les hooks (`useState`, `useEffect`, etc.)  
✅ Pour les requêtes utilisateur authentifié

### **Caractéristiques**
- ✅ Utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publique)
- ✅ Respecte les **Row Level Security (RLS)**
- ✅ Utilise les cookies pour la session
- ❌ Pas d'accès aux données des autres utilisateurs
- ❌ Ne peut pas bypasser RLS

### **Exemples d'usage**
```typescript
// ✅ CORRECT : Dans un composant React
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export default function MyComponent() {
  const handleLogout = async () => {
    const supabase = getSupabaseSingleton()
    await supabase.auth.signOut()
  }
  
  return <button onClick={handleLogout}>Logout</button>
}
```

```typescript
// ✅ CORRECT : Dans un hook
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export function useGyms() {
  const [gyms, setGyms] = useState([])
  
  useEffect(() => {
    const supabase = getSupabaseSingleton()
    
    // Requête filtréepar RLS (user voit seulement SES salles)
    const { data } = await supabase
      .from('gyms')
      .select('*')
    
    setGyms(data)
  }, [])
  
  return gyms
}
```

---

## 2️⃣ **SUPABASE SERVICE (Service Role)**

### **Fichier :** `src/lib/supabase-service.ts`

### **Quand l'utiliser ?**
✅ **Côté SERVEUR uniquement** (API Routes, Edge Functions)  
✅ Pour les opérations ADMIN qui **doivent bypasser RLS**  
✅ Pour créer des utilisateurs (`supabase.auth.admin.createUser`)  
✅ Pour modifier des données cross-tenant (super admin)

### **Caractéristiques**
- ✅ Utilise `SUPABASE_SERVICE_ROLE_KEY` (**secret**, jamais côté client)
- ❌ **BYPASS COMPLET du RLS** → très puissant, très dangereux
- ✅ Accès total à TOUTES les données de TOUS les utilisateurs
- ⚠️ **À utiliser avec EXTRÊME PRUDENCE**

### **Exemples d'usage**
```typescript
// ✅ CORRECT : Créer un utilisateur (API Route)
import { getSupabaseService } from '@/lib/supabase-service'

export async function POST(request: Request) {
  const supabase = getSupabaseService()
  
  // Créer un utilisateur avec le service role
  const { data: authUser, error } = await supabase.auth.admin.createUser({
    email: 'manager@gym.com',
    password: 'temp123',
    email_confirm: true
  })
  
  // Mettre à jour le profil (bypass RLS)
  await supabase
    .from('users')
    .update({ role: 'gym_manager', gym_id: gymId })
    .eq('id', authUser.user.id)
  
  return NextResponse.json({ success: true })
}
```

```typescript
// ✅ CORRECT : Super admin accède à toutes les salles
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET(request: Request) {
  const supabase = getSupabaseService()
  
  // Bypass RLS pour lister TOUTES les salles
  const { data: gyms } = await supabase
    .from('gyms')
    .select('*')
  
  return NextResponse.json({ gyms })
}
```

### **⚠️ QUAND NE PAS L'UTILISER**
```typescript
// ❌ INCORRECT : Ne PAS utiliser dans un composant React
import { getSupabaseService } from '@/lib/supabase-service'

export default function MyComponent() {
  // ❌ DANGER : Service role exposé côté client !
  const supabase = getSupabaseService()
  // ...
}
```

---

## 3️⃣ **SUPABASE SERVER (API Routes avec RLS)**

### **Quand l'utiliser ?**
✅ **Côté SERVEUR** (API Routes)  
✅ Quand tu veux **respecter les RLS** même côté serveur  
✅ Pour les requêtes utilisateur spécifiques (filtrage par `gym_id`, `user_id`)  
✅ Quand tu n'as pas besoin de bypasser RLS

### **Caractéristiques**
- ✅ Utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mais côté serveur)
- ✅ Respecte les **Row Level Security (RLS)**
- ✅ Utilise les cookies pour identifier l'utilisateur
- ❌ Ne peut pas bypasser RLS

### **Exemple d'usage**
```typescript
// ✅ CORRECT : API Route avec RLS
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  // Respecte RLS : user voit seulement SES données
  const { data: gyms } = await supabase
    .from('gyms')
    .select('*')
  
  return NextResponse.json({ gyms })
}
```

---

## 📊 **TABLEAU COMPARATIF**

| Critère | Singleton (Browser) | Service (Admin) | Server (avec RLS) |
|---------|-------------------|-----------------|-------------------|
| **Côté** | Client (navigateur) | Serveur uniquement | Serveur uniquement |
| **Clé API** | `ANON_KEY` | `SERVICE_ROLE_KEY` | `ANON_KEY` |
| **RLS** | ✅ Respecté | ❌ Bypassé | ✅ Respecté |
| **Usage** | Composants React | Ops admin critiques | API routes standards |
| **Sécurité** | ✅ Sûr | ⚠️ Très dangereux | ✅ Sûr |
| **Accès données** | User uniquement | TOUT | User uniquement |

---

## 🚨 **RÈGLES DE SÉCURITÉ ABSOLUES**

### ✅ **À FAIRE**
1. ✅ Utiliser **Singleton** côté client (composants React)
2. ✅ Utiliser **Service** uniquement pour ops admin (créer users, bypass RLS)
3. ✅ Utiliser **Server** pour API routes standards (avec RLS)
4. ✅ Toujours valider les permissions utilisateur en plus du RLS

### ❌ **NE JAMAIS FAIRE**
1. ❌ **JAMAIS** utiliser `Service` côté client
2. ❌ **JAMAIS** exposer `SERVICE_ROLE_KEY` dans `NEXT_PUBLIC_*`
3. ❌ **JAMAIS** bypasser RLS sans raison valide
4. ❌ **JAMAIS** faire confiance aux données client sans validation

---

## 🎯 **ARBRE DE DÉCISION**

```
Est-ce que je code côté CLIENT (composant React) ?
│
├─ OUI → Singleton (getSupabaseSingleton)
│
└─ NON → Je code côté SERVEUR (API Route)
    │
    ├─ Est-ce que j'ai besoin de BYPASSER RLS ?
    │   │
    │   ├─ OUI → Est-ce vraiment nécessaire ?
    │   │   │
    │   │   ├─ OUI (créer user, admin ops) → Service (getSupabaseService)
    │   │   │
    │   │   └─ NON → Repense ton approche, RLS existe pour une raison
    │   │
    │   └─ NON → Server (createServerClient avec ANON_KEY)
```

---

## 📚 **RESSOURCES**

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth - Admin Functions](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [Next.js App Router + Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**🔐 LA SÉCURITÉ EST CRITIQUE. EN CAS DE DOUTE, DEMANDE.**

