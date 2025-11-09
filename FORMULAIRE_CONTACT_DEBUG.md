# 🐛 Guide de Dépannage - Formulaire de Contact

## 📋 **RÉSUMÉ DU DIAGNOSTIC**

✅ **Configuration Supabase** : OK  
✅ **Table `contact_leads`** : Existe  
✅ **Politiques RLS** : Configurées (insertion publique autorisée)  
✅ **Variables d'environnement** : Présentes dans `.env.local`  

⚠️ **Problème potentiel** : Variables d'environnement non chargées côté client

---

## 🔧 **SOLUTIONS (Dans l'ordre)**

### Solution 1️⃣ : Redémarrer le serveur (CRITIQUE)

```bash
# Arrêter tous les serveurs Node.js
Get-Process -Name *node* | Stop-Process -Force

# Attendre 2 secondes
Start-Sleep -Seconds 2

# Redémarrer le serveur
cd C:\Users\brice\Desktop\jarvis\jarvis-saas-compagnon
npm run dev
```

**Pourquoi ?** Next.js charge les variables d'environnement **AU DÉMARRAGE**. Si vous modifiez `.env.local`, vous DEVEZ redémarrer le serveur.

---

### Solution 2️⃣ : Tester avec la page de diagnostic

1. **Ouvrir votre navigateur** à : `http://localhost:3001/test-contact`
2. **Cliquer sur** : "🔍 Tester Configuration Supabase"
3. **Ouvrir la console** (F12 → Console)
4. **Vérifier les logs** :
   - ✅ `URL: ✅ Définie`
   - ✅ `Anon Key: ✅ Définie`
   - ✅ `Instance Supabase créée`

5. **Si OK** → Cliquer sur "📤 Tester Insertion"
6. **Si erreur** → Lire le message d'erreur complet

---

### Solution 3️⃣ : Vérifier les variables d'environnement

```bash
# Dans PowerShell, vérifier .env.local
cd C:\Users\brice\Desktop\jarvis\jarvis-saas-compagnon
Get-Content .env.local | Select-String "NEXT_PUBLIC"
```

**Résultat attendu :**
```
NEXT_PUBLIC_SUPABASE_URL=https://vurnokaxnvittopqteno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

Si manquant ou incorrect, voici les **bonnes valeurs** :

```env
NEXT_PUBLIC_SUPABASE_URL=https://vurnokaxnvittopqteno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzY5NDYsImV4cCI6MjA2ODQxMjk0Nn0.X7urH7Xv6FOPB7XpkHq137iknUAkqcGIK3EEpJ3sZaY
```

---

### Solution 4️⃣ : Tester le formulaire sur la landing page

1. **Ouvrir** : `http://localhost:3001/landing-client`
2. **Scroller** jusqu'au formulaire de contact (tout en bas)
3. **Remplir** le formulaire avec des données test
4. **Ouvrir la console** (F12)
5. **Cliquer** sur "🚀 Candidater au programme pilote"
6. **Observer** :
   - ⏳ Bouton devient "⏳ Envoi en cours..."
   - ✅ Puis "✅ Demande envoyée !"
   - ❌ Ou erreur affichée

---

### Solution 5️⃣ : Vérifier les données insérées dans Supabase

```bash
# Via CLI ou Dashboard Supabase
SELECT * FROM contact_leads ORDER BY created_at DESC LIMIT 5;
```

**Ou via Dashboard** :
1. Aller sur https://supabase.com/dashboard
2. Sélectionner projet "jarvis-saas-compagnon"
3. Table Editor → `contact_leads`
4. Vérifier les dernières entrées

---

## 🔍 **DIAGNOSTICS AVANCÉS**

### Vérifier les logs du serveur

Regarder la sortie de `npm run dev` pour des erreurs :

```bash
# Exemple d'erreur à chercher :
❌ [SUPABASE] Variables d'environnement manquantes
❌ Error: Failed to fetch
❌ RLS policy violation
```

### Vérifier la console navigateur

Ouvrir la console (F12) et chercher :

```javascript
// Erreurs possibles :
❌ "NEXT_PUBLIC_SUPABASE_URL is undefined"
❌ "Failed to insert into contact_leads"
❌ "new row violates row-level security policy"
❌ "Network request failed"
```

### Tester l'insertion directe (bypass formulaire)

Ouvrir la console navigateur sur `http://localhost:3001` et coller :

```javascript
// Test direct d'insertion
(async () => {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://vurnokaxnvittopqteno.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzY5NDYsImV4cCI6MjA2ODQxMjk0Nn0.X7urH7Xv6FOPB7XpkHq137iknUAkqcGIK3EEpJ3sZaY'
  );
  
  const { data, error } = await supabase
    .from('contact_leads')
    .insert([{
      email: 'test-direct@example.com',
      full_name: 'Test Direct',
      company_name: 'Test Company',
      lead_type: 'contact',
      user_agent: navigator.userAgent
    }])
    .select();
  
  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Succès:', data);
  }
})();
```

Si **ça fonctionne** → Problème dans le code du formulaire  
Si **ça échoue** → Problème Supabase (RLS, permissions, réseau)

---

## 🚨 **ERREURS COURANTES ET SOLUTIONS**

### Erreur : "Variables d'environnement manquantes"

**Cause** : `.env.local` absent ou incorrect  
**Solution** : Vérifier que `.env.local` contient les variables `NEXT_PUBLIC_SUPABASE_*`

### Erreur : "new row violates row-level security policy"

**Cause** : Politique RLS trop restrictive  
**Solution** : Exécuter via MCP Supabase :
```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'contact_leads';

-- Si manquante, créer :
CREATE POLICY "Allow public insert on contact_leads"
ON contact_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

### Erreur : "Failed to fetch" ou "Network request failed"

**Cause** : Problème réseau ou CORS  
**Solution** :
1. Vérifier que Supabase est accessible : https://vurnokaxnvittopqteno.supabase.co
2. Vérifier la configuration CORS dans Supabase Dashboard
3. Vérifier les extensions navigateur (bloqueurs de pub, etc.)

### Erreur : Le formulaire ne fait rien (pas d'erreur)

**Cause** : JavaScript non chargé ou erreur silencieuse  
**Solution** :
1. Ouvrir console (F12) → Vérifier erreurs JavaScript
2. Vérifier que le composant `ContactForm` est bien rendu
3. Utiliser la page de test `/test-contact`

---

## ✅ **CHECKLIST FINALE**

- [ ] Serveur redémarré après modification `.env.local`
- [ ] Variables d'environnement présentes dans `.env.local`
- [ ] Page de test `/test-contact` fonctionne
- [ ] Console navigateur sans erreurs
- [ ] Logs serveur sans erreurs
- [ ] Test d'insertion directe via console fonctionne
- [ ] Politiques RLS correctes dans Supabase

Si tout est ✅ mais le formulaire ne fonctionne toujours pas :

**➡️ Partager** :
1. Screenshot de la console (F12)
2. Logs du serveur (`npm run dev`)
3. Résultat de `/test-contact`

---

## 📞 **SUPPORT**

Si le problème persiste après avoir suivi ce guide :

1. **Vérifier Supabase Dashboard** : https://supabase.com/dashboard
2. **Vérifier MCP Supabase** : `mcp_supabase_list_tables`
3. **Demander aide** avec les logs complets

---

**🚀 Bonne chance !**

