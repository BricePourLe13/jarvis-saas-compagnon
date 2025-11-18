# 🔧 MIGRATION URGENTE : FIX GYM STATUS

## ❌ PROBLÈME

Les gyms existantes dans la BDD avaient un `status = 'online'` ou autre valeur non standard.

Depuis la refonte API (migration `20251117000001_refonte_api_flow.sql`), les seules valeurs valides sont :
- `pending_approval`
- `active`
- `suspended`
- `cancelled`

**Résultat** : Les gyms avec `status = 'online'` ne s'affichent plus dans le dashboard car la requête filtre `.neq('status', 'pending_approval')` mais le check constraint SQL rejette les anciennes valeurs.

---

## ✅ SOLUTION

Exécuter la migration `supabase/migrations/20251118000001_fix_gym_status.sql` pour convertir tous les status invalides en `active`.

---

## 📋 ÉTAPES (URGENT)

### Option 1 : Via Supabase Dashboard (RECOMMANDÉ)

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner ton projet JARVIS
3. Onglet **SQL Editor** (à gauche)
4. Cliquer **"New query"**
5. Copier-coller le contenu de `supabase/migrations/20251118000001_fix_gym_status.sql`
6. Cliquer **"Run"**
7. Vérifier message : `✅ Migré X gyms vers status "active"`

### Option 2 : Via Supabase CLI (si installé)

```bash
cd jarvis-saas-compagnon
supabase db push
```

---

## ✅ VÉRIFICATION

1. Rafraîchir `/dashboard/gyms`
2. Les gyms doivent maintenant s'afficher dans l'onglet "Toutes"
3. Vérifier dans Supabase > Table Editor > `gyms` que tous les `status` sont valides

---

## 🐛 SI ÇA NE MARCHE PAS

Exécuter cette requête SQL pour voir les status actuels :

```sql
SELECT id, name, status, created_at
FROM gyms
ORDER BY created_at DESC;
```

Si des gyms ont encore un status invalide, exécuter manuellement :

```sql
UPDATE gyms
SET status = 'active'
WHERE status NOT IN ('pending_approval', 'active', 'suspended', 'cancelled');
```

---

**PRIORITÉ P0 - À FAIRE MAINTENANT**

