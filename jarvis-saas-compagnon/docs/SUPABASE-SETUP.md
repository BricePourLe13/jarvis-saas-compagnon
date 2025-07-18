# 🗄️ Guide de Déploiement SQL - JARVIS SaaS Compagnon

## 📋 Instructions de Déploiement Supabase

### **Étape 1 : Accéder à l'éditeur SQL**
1. Va sur : https://supabase.com/dashboard/project/vurnokaxnvittopqteno
2. Clique sur **"SQL Editor"** dans le menu latéral
3. Clique sur **"New Query"**

### **Étape 2 : Exécuter le schéma**
1. Copie le contenu complet du fichier `sql/schema.sql`
2. Colle-le dans l'éditeur SQL Supabase
3. Clique sur **"Run"** (ou Ctrl+Enter)

### **Étape 3 : Vérification**
Exécute ces requêtes pour vérifier que tout est créé :

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Vérifier les types énumérés
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **Étape 4 : Configuration Auth**
1. Va dans **Authentication** → **Settings**
2. **Email Templates** : Personnalise si nécessaire
3. **Auth Providers** : Configure les fournisseurs souhaités

### **Étape 5 : Test de connexion**
Exécute cette requête pour tester :

```sql
-- Test insertion franchise (remplace l'UUID par un vrai)
INSERT INTO franchises (name, address, phone, email, city, postal_code, owner_id) 
VALUES (
  'Test Gym', 
  '123 Test Street', 
  '01.23.45.67.89', 
  'test@gym.fr', 
  'Paris', 
  '75001', 
  '00000000-0000-0000-0000-000000000000'
);
```

## 🔒 **Sécurité - Row Level Security**

Le schéma inclut des politiques RLS pour :
- ✅ **Franchises** : Visibles par propriétaires/admins seulement
- ✅ **Utilisateurs** : Accès selon franchise et rôle
- ✅ **Sessions** : Accès limité à la franchise concernée

## 📊 **Fonctionnalités Incluses**

### **Tables Principales**
- `franchises` : Gestion des salles de sport
- `users` : Profils utilisateurs étendus
- `kiosk_sessions` : Sessions d'interaction IA

### **Types Métier**
- `user_role` : super_admin, franchise_owner, franchise_admin, member
- `subscription_plan` : starter, professional, enterprise
- `session_type` : information, reservation, support, training

### **Automatisations**
- Triggers `updated_at` automatiques
- Création utilisateur après inscription
- Index optimisés pour performances

### **Vue Analytique**
- `franchise_stats` : Statistiques par franchise

## 🚨 **Troubleshooting**

### Erreur "relation does not exist"
```sql
-- Vérifier que les extensions sont activées
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Erreur RLS
```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Problème d'authentification
```sql
-- Vérifier la fonction handle_new_user
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

## 🎯 **Prochaines Étapes**

1. ✅ Exécuter le schéma SQL
2. ⏳ Configurer l'authentification
3. ⏳ Tester les connexions depuis Next.js
4. ⏳ Implémenter les composants CRUD

---

**⚠️ Important : Sauvegarde le Service Role Key depuis les paramètres Supabase pour les opérations admin !**
