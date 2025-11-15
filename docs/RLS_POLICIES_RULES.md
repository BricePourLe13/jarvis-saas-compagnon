# 🔒 RLS POLICIES - RÈGLES STRICTES

**Date:** 12 Novembre 2025  
**Contexte:** Après avoir cassé l'auth 2 fois avec des policies récursives

---

## ❌ CE QU'IL NE FAUT **JAMAIS** FAIRE

### **1. POLICIES RÉCURSIVES**

```sql
-- ❌ INTERDIT - RÉCURSION INFINIE
CREATE POLICY "check_role" ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users  ← RÉCURSION ICI !
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

**Résultat:** 500 Error, infinite recursion, auth cassée

---

## ✅ RÈGLES À SUIVRE

### **PRINCIPE 1: Keep It Simple, Stupid**

Les policies doivent être **SIMPLES** et **NON-RÉCURSIVES**.

```sql
-- ✅ BON - Simple, pas de récursion
CREATE POLICY "users_read_own_profile" ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### **PRINCIPE 2: Service Role pour les opérations complexes**

Si tu as besoin de logique complexe (checker le rôle, etc.), fais-le dans le CODE avec le service role client, PAS dans les policies.

```typescript
// ✅ BON - Logique dans le code
const supabase = getSupabaseService() // Bypass RLS
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', userId)
  .single()

if (user.role !== 'super_admin') {
  return forbiddenResponse()
}
```

### **PRINCIPE 3: Policies minimales pour les tables sensibles**

Pour `public.users`, on garde SEULEMENT :

```sql
-- 1. Lire son propre profil
CREATE POLICY "users_read_own_profile" ON public.users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 2. Service role peut INSERT
CREATE POLICY "users_service_insert" ON public.users
FOR INSERT TO service_role
WITH CHECK (true);

-- 3. Service role peut UPDATE
CREATE POLICY "users_service_update" ON public.users
FOR UPDATE TO service_role
USING (true) WITH CHECK (true);
```

**C'EST TOUT. PAS PLUS.**

---

## 🛠️ CHECKLIST AVANT DE CRÉER UNE POLICY

- [ ] La policy ne fait PAS de SELECT dans la même table ?
- [ ] La policy ne fait PAS de SELECT dans une table qui référence celle-ci ?
- [ ] La policy est SIMPLE (1-2 lignes max) ?
- [ ] On ne peut PAS faire cette vérification dans le code backend ?
- [ ] J'ai testé la connexion APRÈS avoir créé la policy ?

Si tu réponds "non" ou "pas sûr" à une de ces questions → **N'ÉCRIS PAS LA POLICY**

---

## 🚨 SI TU CASSES L'AUTH

1. **NE PANIQUE PAS**
2. **Liste les policies :**
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename = 'users';
   ```
3. **Drop la policy récursive :**
   ```sql
   DROP POLICY IF EXISTS "nom_policy_recursive" ON public.users;
   ```
4. **Teste la connexion**
5. **Documente ce qui s'est passé**

---

## 📚 DOCUMENTATION OFFICIELLE

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security#best-practices)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

## 🎯 TL;DR

**KISS (Keep It Simple, Stupid)**

- Policies simples = Système stable
- Logique complexe = Dans le code backend
- Service role = Bypass RLS quand nécessaire
- Tester = TOUJOURS après modification RLS

---

**Si tu ne te souviens que d'une chose :**

> **"Ne JAMAIS faire de SELECT dans la même table depuis une policy RLS"**

**FIN.**




**Date:** 12 Novembre 2025  
**Contexte:** Après avoir cassé l'auth 2 fois avec des policies récursives

---

## ❌ CE QU'IL NE FAUT **JAMAIS** FAIRE

### **1. POLICIES RÉCURSIVES**

```sql
-- ❌ INTERDIT - RÉCURSION INFINIE
CREATE POLICY "check_role" ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users  ← RÉCURSION ICI !
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

**Résultat:** 500 Error, infinite recursion, auth cassée

---

## ✅ RÈGLES À SUIVRE

### **PRINCIPE 1: Keep It Simple, Stupid**

Les policies doivent être **SIMPLES** et **NON-RÉCURSIVES**.

```sql
-- ✅ BON - Simple, pas de récursion
CREATE POLICY "users_read_own_profile" ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### **PRINCIPE 2: Service Role pour les opérations complexes**

Si tu as besoin de logique complexe (checker le rôle, etc.), fais-le dans le CODE avec le service role client, PAS dans les policies.

```typescript
// ✅ BON - Logique dans le code
const supabase = getSupabaseService() // Bypass RLS
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', userId)
  .single()

if (user.role !== 'super_admin') {
  return forbiddenResponse()
}
```

### **PRINCIPE 3: Policies minimales pour les tables sensibles**

Pour `public.users`, on garde SEULEMENT :

```sql
-- 1. Lire son propre profil
CREATE POLICY "users_read_own_profile" ON public.users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 2. Service role peut INSERT
CREATE POLICY "users_service_insert" ON public.users
FOR INSERT TO service_role
WITH CHECK (true);

-- 3. Service role peut UPDATE
CREATE POLICY "users_service_update" ON public.users
FOR UPDATE TO service_role
USING (true) WITH CHECK (true);
```

**C'EST TOUT. PAS PLUS.**

---

## 🛠️ CHECKLIST AVANT DE CRÉER UNE POLICY

- [ ] La policy ne fait PAS de SELECT dans la même table ?
- [ ] La policy ne fait PAS de SELECT dans une table qui référence celle-ci ?
- [ ] La policy est SIMPLE (1-2 lignes max) ?
- [ ] On ne peut PAS faire cette vérification dans le code backend ?
- [ ] J'ai testé la connexion APRÈS avoir créé la policy ?

Si tu réponds "non" ou "pas sûr" à une de ces questions → **N'ÉCRIS PAS LA POLICY**

---

## 🚨 SI TU CASSES L'AUTH

1. **NE PANIQUE PAS**
2. **Liste les policies :**
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename = 'users';
   ```
3. **Drop la policy récursive :**
   ```sql
   DROP POLICY IF EXISTS "nom_policy_recursive" ON public.users;
   ```
4. **Teste la connexion**
5. **Documente ce qui s'est passé**

---

## 📚 DOCUMENTATION OFFICIELLE

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security#best-practices)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

## 🎯 TL;DR

**KISS (Keep It Simple, Stupid)**

- Policies simples = Système stable
- Logique complexe = Dans le code backend
- Service role = Bypass RLS quand nécessaire
- Tester = TOUJOURS après modification RLS

---

**Si tu ne te souviens que d'une chose :**

> **"Ne JAMAIS faire de SELECT dans la même table depuis une policy RLS"**

**FIN.**



