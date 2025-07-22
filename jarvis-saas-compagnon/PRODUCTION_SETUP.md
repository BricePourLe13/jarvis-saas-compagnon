# 🚀 Configuration Production JARVIS

## ✅ Prérequis
- ✅ Utilisateur Supabase existant : `brice@jarvis-group.net` (UID: `d1af649d-3498-49f4-9e43-688355e2af46`)
- ✅ Variables d'environnement configurées
- ✅ Code déployé et testé

## 📋 Étapes de Configuration

### 1. 🗄️ Configurer la Base de Données

**Dans ton Supabase Dashboard :**

1. Va sur **SQL Editor** : https://supabase.com/dashboard/project/vurnokaxnvittopqteno/sql
2. Copie et exécute le contenu entier de `sql/production-setup.sql`

**Ce script va :**
- ✅ Configurer ton utilisateur comme `super_admin`
- ✅ Activer Row Level Security (RLS) avec des politiques robustes
- ✅ Créer 5 franchises JARVIS de test avec ton UID comme propriétaire
- ✅ Vérifier les permissions

### 2. 🔐 Vérifier les Permissions

**Après exécution du script, tu devrais voir :**
```sql
Configuration production terminée !
franchises_created: 5

Test permissions:
email: brice@jarvis-group.net
role: super_admin  
franchises_accessible: 5
```

### 3. 🧪 Tester l'Application

1. **Login** avec `brice@jarvis-group.net` / `JeSuisSecret64`
2. **Dashboard** → Tu devrais voir 5 franchises JARVIS
3. **Navigation** → Clic sur une franchise pour voir les détails
4. **Console** → Aucune erreur 500, logs propres

### 4. 📊 Franchises Créées

Les franchises suivantes seront créées avec ton UID :

- **JARVIS Flagship Paris** (75008) - Actif
- **JARVIS Lyon Part-Dieu** (69002) - Actif  
- **JARVIS Marseille Vieux-Port** (13001) - Actif
- **JARVIS Toulouse Capitole** (31000) - Inactif (pour tester)
- **JARVIS Nice Promenade** (06000) - Actif

## 🛡️ Sécurité Production

### Politiques RLS Configurées :

**Franchises :**
- **SELECT** : Super admins voient tout, propriétaires voient leurs franchises
- **INSERT** : Super admins + franchise owners peuvent créer
- **UPDATE** : Super admins + propriétaires peuvent modifier
- **DELETE** : Seuls super admins peuvent supprimer

**Users :**
- **SELECT** : Utilisateurs voient leur profil + admins voient selon niveau
- **UPDATE** : Auto-modification + admins

## 🚨 Résolution des Problèmes

### Si erreur 500 persiste :
1. Vérifier que le script SQL s'est bien exécuté
2. Vérifier que ton utilisateur est bien `super_admin` :
   ```sql
   SELECT email, role FROM users WHERE id = 'd1af649d-3498-49f4-9e43-688355e2af46';
   ```

### Si aucune franchise visible :
1. Vérifier les données :
   ```sql
   SELECT name, owner_id FROM franchises WHERE owner_id = 'd1af649d-3498-49f4-9e43-688355e2af46';
   ```

### Si problème de permissions :
1. Vérifier RLS :
   ```sql
   SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'franchises';
   ```

## ✅ Validation Finale

**Dashboard fonctionnel = ✅ Production Ready !**

Tu auras :
- 🔐 Authentification sécurisée
- 📊 Dashboard avec vraies données
- 🏗️ Navigation franchises → détails  
- 🛡️ Sécurité RLS production
- 🎯 Base solide pour ajouter les salles

---

**Prêt à passer en production ! 🚀** 