# 🔍 DEBUG CHECKLIST - SYSTÈME D'INVITATIONS

## 🎯 PROBLÈMES POSSIBLES & SOLUTIONS

### ❌ **PROBLÈME 1 : URL FRAGMENTS**
**Symptôme :** "Invitation invalide" avec URL contenant `#access_token=...`
**Solution :** ✅ **CORRIGÉ** - Code mis à jour pour gérer les fragments

---

### ❌ **PROBLÈME 2 : CONFIGURATION SUPABASE**

#### 🔗 **Redirect URLs manquantes**
**Vérifier dans Supabase Dashboard → Auth → URL Configuration :**
```
Site URL: https://jarvis-group.net
Redirect URLs:
- https://jarvis-group.net/auth/setup
- https://jarvis-group.net/auth/callback  
- https://jarvis-saas-compagnon-dhb3s92md-jarvis-projects-64c74b6d.vercel.app/auth/setup
- http://localhost:3000/auth/setup
```

#### 📧 **Email Template défaillant**
**Vérifier dans Supabase Dashboard → Auth → Email Templates → Invite User :**
- Template HTML correct
- Variables `{{ .ConfirmationURL }}` présentes
- Subject configuré

---

### ❌ **PROBLÈME 3 : UTILISATEUR DÉJÀ EXISTANT**

#### 🔄 **Conflit UUID**
**Symptôme :** Erreur 409 "Utilisateur existant"
**Diagnostic :**
```sql
-- Dans Supabase SQL Editor
SELECT id, email, is_active, created_at 
FROM users 
WHERE email = 'brice.pradet@gmail.com';

SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'brice.pradet@gmail.com';
```

**Solution :** Utiliser l'API `/api/admin/invitations/resend`

---

### ❌ **PROBLÈME 4 : RLS POLICIES**

#### 🛡️ **Permissions bloquées**
**Symptôme :** Erreurs 403 ou données non accessibles
**Diagnostic :**
```sql
-- Vérifier les policies RLS
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'franchises');
```

**Solution temporaire :** Désactiver RLS pour debug
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- (Re-activer après fix)
```

---

### ❌ **PROBLÈME 5 : VARIABLES D'ENVIRONNEMENT**

#### 🔑 **Clés manquantes/incorrectes**
**Vérifier dans Vercel Dashboard → Settings → Environment Variables :**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

---

### ❌ **PROBLÈME 6 : CACHE/SESSION**

#### 🗄️ **Session corrompue**
**Solutions :**
1. **Vider cache navigateur** (Ctrl+Shift+R)
2. **Mode incognito**
3. **Supprimer localStorage** (F12 → Application → Local Storage)

---

## 🧪 TESTS SYSTÉMATIQUES

### 🔍 **TEST 1 : API Invitation**
```bash
# Test direct de l'API
curl -X POST https://jarvis-group.net/api/admin/invitations/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "role": "super_admin"
  }'
```

### 🔍 **TEST 2 : Email reçu**
- Email reçu ? ✅/❌
- Template correct ? ✅/❌
- Lien cliquable ? ✅/❌
- URL finale correcte ? ✅/❌

### 🔍 **TEST 3 : Page Setup**
- Page charge ? ✅/❌
- Formulaire affiché ? ✅/❌
- Logs console ? Noter ici
- Erreurs réseau ? F12 → Network

---

## 🚀 ACTIONS IMMÉDIATES

### ✅ **ÉTAPE 1 :** Tester avec fix fragments
### ⏳ **ÉTAPE 2 :** Vérifier config Supabase  
### ⏳ **ÉTAPE 3 :** Nettoyer utilisateurs conflictuels
### ⏳ **ÉTAPE 4 :** Test complet end-to-end

---

**📝 NOTES DE DEBUG :**
(À remplir pendant les tests)

- Logs console :
- Erreurs réseau :
- Comportement observé :
- Solution appliquée :