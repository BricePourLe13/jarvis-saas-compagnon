# 📦 Appliquer les Migrations Supabase

## 🎯 Migrations Disponibles

### Migration Test Data (`20251031000001_insert_test_data.sql`)

**Contenu :**
- Franchise de test "Test Franchise"
- Salle de test "Test Gym"
- Kiosk avec slug `gym-test` (code: `TEST01`)
- 5 membres de test (BADGE0001 à BADGE0005)

---

## 🔧 Méthode 1 : Via Supabase Dashboard (Recommandé)

### Étapes :

1. **Ouvrir Supabase Dashboard**
   - Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionne ton projet JARVIS

2. **Ouvrir le SQL Editor**
   - Dans la sidebar gauche, clique sur **SQL Editor**
   - Clique sur **New query**

3. **Copier-Coller le SQL**
   - Ouvre le fichier `supabase/migrations/20251031000001_insert_test_data.sql`
   - Copie tout le contenu
   - Colle-le dans l'éditeur SQL

4. **Exécuter**
   - Clique sur **Run** (ou `Cmd+Enter` / `Ctrl+Enter`)
   - Vérifie les messages de confirmation dans la console

5. **Vérifier les données**
   - Va sur **Table Editor** → `kiosks`
   - Cherche le slug `gym-test`
   - Note le provisioning code : `TEST01`

---

## 🔧 Méthode 2 : Via Supabase CLI (Avancé)

### Prérequis :
```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# Login
supabase login

# Lier ton projet
supabase link --project-ref vurnokaxnvittopqteno
```

### Appliquer la migration :
```bash
cd jarvis-saas-compagnon
supabase db push
```

---

## ✅ Après la Migration

### 1. Tester le Kiosk
Va sur : `https://jarvis-group.net/kiosk/gym-test`

**Si provisioning requis :**
- Code : `TEST01`

### 2. Tester les Membres
Dans l'interface kiosk, scanne un badge de test :
- `BADGE0001` → Jean Dupont
- `BADGE0002` → Marie Martin
- `BADGE0003` → Pierre Bernard
- `BADGE0004` → Sophie Dubois
- `BADGE0005` → Luc Thomas

### 3. Vérifier Dashboard Admin
Va sur : `https://jarvis-group.net/dashboard/admin/gyms`

Tu devrais voir :
- **Test Gym** dans la liste des salles
- **1 kiosk** associé
- **5 membres** enregistrés

---

## 🚨 Troubleshooting

### Erreur : "relation does not exist"
**Cause :** Table manquante (migrations précédentes non appliquées)

**Fix :**
1. Applique d'abord les migrations de base :
   - `20251023000001_create_core_tables.sql`
   - `20251026000001_create_kiosks_table.sql`
2. Puis applique la migration test data

### Erreur : "duplicate key value violates unique constraint"
**Cause :** Les données de test existent déjà

**Fix :**
- Les `ON CONFLICT` gèrent déjà les duplicatas
- Si l'erreur persiste, vérifie manuellement les données existantes
- Tu peux supprimer les données de test et réappliquer :
```sql
DELETE FROM gym_members WHERE email LIKE '%@test.com';
DELETE FROM kiosks WHERE slug = 'gym-test';
DELETE FROM gyms WHERE name = 'Test Gym';
DELETE FROM franchises WHERE name = 'Test Franchise';
```

### Erreur : "permission denied"
**Cause :** RLS (Row Level Security) bloque l'insertion

**Fix :**
- Assure-toi d'être connecté avec un compte `super_admin`
- Ou désactive temporairement RLS :
```sql
ALTER TABLE kiosks DISABLE ROW LEVEL SECURITY;
-- Applique ta migration
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;
```

---

## 📚 Ressources

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/managing-database-migrations)
- [SQL Editor Guide](https://supabase.com/docs/guides/database/overview)

