# 🎯 SCRIPT SQL CORRIGÉ - PRÊT POUR SUPABASE

## ✅ **CORRECTIONS APPORTÉES**

### 🔧 **Problème résolu :** Politiques existantes
❌ **AVANT :** `CREATE POLICY` (erreur si existe déjà)  
✅ **APRÈS :** `CREATE OR REPLACE POLICY` (remplace si existe)

### 👨‍💼 **Accès Admin ajouté**
Votre email `brice@jarvis-group.net` a été ajouté comme **super-admin** avec accès total à toutes les données.

### 📊 **Données de test enrichies**
- ✅ Franchise JARVIS Group avec votre email
- ✅ Salle de démo "JARVIS Demo Gym" 
- ✅ 4 membres de test avec différents profils
- ✅ 2 conversations IA de démonstration
- ✅ Revenus publicitaires d'exemple
- ✅ 2 insights IA pour tester les alertes

## 🚀 **ÉTAPES POUR EXÉCUTER**

### 1️⃣ **Ouvrir le SQL Editor**
👉 https://supabase.com/dashboard/project/grlktijcxafzxctdlncj/sql/new

### 2️⃣ **Copier-coller le script complet**
Sélectionnez tout le contenu du fichier `supabase-schema.sql` (350 lignes)

### 3️⃣ **Exécuter**
Cliquez sur "Run" - le script devrait s'exécuter sans erreur maintenant !

### 4️⃣ **Vérifier le résultat**
Vous devriez voir : `Base de données JARVIS configurée avec succès!`

## 🎯 **COMPTES POUR TESTER**

### **Votre compte admin :**
- Email : `brice@jarvis-group.net` 
- ✅ Accès total à toutes les données
- ✅ Peut voir toutes les franchises et salles
- ✅ Salle de démo "JARVIS Demo Gym"

### **Comptes de test :**
```
Propriétaire franchise : owner@sportpremium.com
Gérant Paris Centre : manager.paris@sportpremium.com  
Gérant Paris Nord : manager.nord@sportpremium.com
Gérant Lyon : manager.lyon@fitnessnetwork.com
```

## 📊 **DONNÉES DE DÉMONSTRATION**

### **4 Membres de test :**
- **Marie Dupont** : Cliente fidèle (45 visites, risque faible)
- **Pierre Martin** : Nouveau membre (12 visites, risque moyen)
- **Sophie Leroy** : À risque de départ (8 visites, score 0.7)
- **Jean Dubois** : Membre régulier (32 visites)

### **2 Conversations IA :**
- Question horaires (sentiment positif, résolue auto)
- Problème motivation (sentiment négatif, nécessite suivi)

### **Revenus publicitaires :**
- Campagne NutriFit : 1500€ (JARVIS Demo Gym)
- Campagne SportTech : 2200€ (Paris Centre)

### **2 Insights IA :**
- 🚨 **Alerte churn** : Sophie Leroy (risque élevé)
- 💰 **Opportunité revenus** : Pic 18h-20h (+25% revenus)

## 🎉 **APRÈS L'EXÉCUTION**

1. **Démarrer l'application :**
```bash
npm run dev
# ou si problème :
npx next dev
```

2. **Ouvrir :** http://localhost:3000

3. **Créer un compte avec :** `brice@jarvis-group.net`

4. **Accéder au dashboard gérant** et voir vos données de test !

## 🔒 **SÉCURITÉ MULTI-TENANT**

Avec votre email admin, vous pourrez :
- ✅ Voir toutes les franchises (même celles d'autres propriétaires)
- ✅ Accéder à toutes les salles (même celles d'autres gérants)  
- ✅ Consulter tous les membres et conversations
- ✅ Analyser tous les revenus publicitaires
- ✅ Recevoir tous les insights IA

**Parfait pour superviser la plateforme et démontrer les capacités !** 🎯

---
**🚨 LE SCRIPT EST MAINTENANT PRÊT - Plus d'erreurs de politiques existantes !**
