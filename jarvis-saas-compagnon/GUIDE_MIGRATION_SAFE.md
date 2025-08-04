# 🛡️ GUIDE MIGRATION SAFE - Monitoring JARVIS Enterprise

## 🎯 OBJECTIF
Corriger les erreurs de monitoring en s'adaptant automatiquement aux contraintes de votre base de données existante.

---

## ❌ PROBLÈMES IDENTIFIÉS

### 1. **Erreur Enum user_role**
```
ERROR: 22P02: invalid input value for enum user_role: "gym_manager"
```
**Cause**: Valeur `gym_manager` non autorisée dans l'enum existant

### 2. **Erreur Colonnes manquantes**
```
ERROR: Could not find the 'input_audio_tokens_cost_usd' column
```
**Cause**: Migration précédente incomplète

### 3. **Erreur 406 Sessions**
```
Session non trouvée pour audio event: sess_xxx
```
**Cause**: Race conditions + RLS restrictif

---

## 🚀 SOLUTION: MIGRATION ADAPTIVE

### **📋 ÉTAPE 1: Audit Enum (OBLIGATOIRE)**

Dans Supabase SQL Editor, exécutez:

```sql
-- Copier/coller tout le contenu de: audit-enum-values.sql
```

**Résultat attendu**: Liste des valeurs enum user_role autorisées
```
enum_values: super_admin, franchise_owner
```

### **📋 ÉTAPE 2: Migration Safe**

Dans Supabase SQL Editor, exécutez:

```sql
-- Copier/coller tout le contenu de: migration-safe-adaptive.sql
```

**Résultat attendu**:
```
✅ COLONNES COÛTS: Ajoutées ou vérifiées
✅ ENUM DETECTION: Adaptation automatique  
✅ RLS POLICIES: Compatible rôles existants
✅ TESTS: Validation fonctionnelle
🚀 MONITORING PRÊT AVEC CONTRAINTES EXISTANTES !
```

---

## 🔍 VÉRIFICATIONS POST-MIGRATION

### **1. Colonnes coûts ajoutées**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'openai_realtime_sessions' 
AND column_name LIKE '%cost%';
```

**Attendu**: 4 colonnes
- `input_audio_tokens_cost_usd`
- `output_audio_tokens_cost_usd` 
- `input_text_tokens_cost_usd`
- `output_text_tokens_cost_usd`

### **2. RLS Policies créées**
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'openai_realtime_sessions';
```

**Attendu**: 3-4 policies
- `kiosk_session_insert` (permissive)
- `admin_session_select` (adapté aux rôles)
- `system_session_update` (permissive)
- `super_admin_session_delete` (si super_admin existe)

### **3. Test insertion**
```sql
INSERT INTO openai_realtime_sessions (
  session_id, session_started_at,
  input_audio_tokens_cost_usd, output_audio_tokens_cost_usd
) VALUES (
  'test_post_migration', NOW(), 0.001, 0.002
);

-- Nettoyer
DELETE FROM openai_realtime_sessions WHERE session_id = 'test_post_migration';
```

**Attendu**: Succès sans erreur

---

## 🧪 TEST INTERFACE KIOSK

### **1. Lancer session kiosk**
- Scanner badge membre
- Vérifier connexion WebRTC
- Parler à JARVIS

### **2. Vérifier logs**
**Plus d'erreurs**:
- ❌ `Could not find 'input_audio_tokens_cost_usd'`
- ❌ `invalid input value for enum user_role`
- ❌ `Session non trouvée pour audio event`

**Logs attendus**:
- ✅ `📊 [TRACKING] Session initialisée`
- ✅ `✅ Connexion WebRTC établie`
- ✅ `💰 [COST TRACKER] Session: $0.0xxx`

### **3. Dire "au revoir"**
- Session doit se fermer proprement
- Coûts enregistrés en DB
- Dashboard admin mis à jour

---

## 📊 VÉRIFICATION DASHBOARD ADMIN

### **Navigation**:
1. Login admin → `/admin/franchises`
2. Clic franchise → `/admin/franchises/[id]`
3. Clic gym → `/admin/franchises/[id]/gyms/[gymId]`
4. Section "Vue d'ensemble" → Monitoring OpenAI

### **Métriques attendues**:
- **Sessions actives**: Nombre > 0
- **Coût total**: $0.0xxx
- **Durée moyenne**: XXXs
- **Événements audio**: Liste des interactions

---

## 🚨 DÉPANNAGE

### **Si erreur enum persiste**:
```sql
-- Ajouter valeur manquante à l'enum
ALTER TYPE user_role ADD VALUE 'gym_manager';
```

### **Si colonnes toujours manquantes**:
```sql
-- Ajouter manuellement
ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS input_audio_tokens_cost_usd DECIMAL(10,6) DEFAULT 0;
```

### **Si RLS trop restrictif**:
```sql
-- Policy ultra-permissive temporaire
DROP POLICY IF EXISTS "admin_session_select" ON openai_realtime_sessions;
CREATE POLICY "admin_session_select" ON openai_realtime_sessions FOR SELECT USING (true);
```

---

## 🎯 VALIDATION FINALE

### **✅ Checklist succès**:
- [ ] `audit-enum-values.sql` exécuté avec succès
- [ ] `migration-safe-adaptive.sql` exécuté avec succès  
- [ ] Colonnes coûts présentes (4/4)
- [ ] RLS policies créées (3-4/4)
- [ ] Test insertion réussi
- [ ] Interface kiosk sans erreurs
- [ ] Dashboard admin affiche métriques
- [ ] Sessions "au revoir" finalisées

### **🚀 Résultat attendu**:
```
🎉 MONITORING JARVIS ENTERPRISE OPÉRATIONNEL !
📊 Métriques temps réel fonctionnelles
💰 Tracking coûts détaillé actif
🛡️ Résilience et retry en place
🌟 World-class system ready !
```

---

## 💡 SUPPORT

Si problèmes persistent:

1. **Logs détaillés**: Console navigateur + Supabase logs
2. **Schema exact**: Résultats `audit-enum-values.sql`
3. **Erreurs spécifiques**: Messages exacts avec stack trace
4. **État RLS**: `SELECT * FROM pg_policies WHERE tablename = 'openai_realtime_sessions'`

**L'approche adaptive garantit la compatibilité avec votre base existante ! 🎯**