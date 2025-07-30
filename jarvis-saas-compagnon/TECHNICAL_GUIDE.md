# 🛠️ Guide Technique JARVIS SaaS v2

## 📋 Architecture Unifiée

### 🎯 **Cohérence Système**
Ce guide documente l'architecture unifiée post-refactoring qui résout les incohérences identifiées dans le système.

---

## 🗄️ **Base de Données V2**

### **Schéma Principal**
- **Fichier**: `sql/schema-v2-franchises.sql` ✅
- **Migration**: `sql/migration-to-v2-schema.sql` ✅
- **Architecture**: Multi-tenant (Franchise → Gym → Kiosk)

### **Tables Principales**
```sql
franchises (
  id, name, contact_email, headquarters_address, 
  jarvis_config, owner_id, status
)

gyms (
  id, franchise_id, name, address, 
  kiosk_config, manager_id, status
)

users (
  id, email, full_name, role,
  franchise_access[], gym_access[],
  dashboard_preferences, notification_settings,
  is_active, last_login
)

jarvis_sessions (
  id, gym_id, member_badge_id,
  conversation_transcript, session_duration
)

analytics_daily (
  id, franchise_id, gym_id, date,
  total_sessions, total_cost_eur
)
```

### **Rôles Utilisateur Standardisés**
```typescript
type UserRole = 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
```

---

## 🔧 **Configuration Centralisée**

### **Variables d'Environnement**
```bash
# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://vurnokaxnvittopqteno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Settings (OBLIGATOIRE)
NEXT_PUBLIC_APP_URL=https://jarvis-group.net

# OpenAI (OBLIGATOIRE)
OPENAI_API_KEY=sk-proj-...
```

### **Clients Supabase Unifiés**
```typescript
// Centralisation dans /lib/supabase-admin.ts
import { 
  createSimpleClient,           // Client basique
  createAdminClient,            // Client admin (service role)
  createServerClientWithConfig, // Client Server (APIs)
  createBrowserClientWithConfig, // Client Browser (composants)
  getEnvironmentConfig          // Configuration centralisée
} from '@/lib/supabase-admin'

// ❌ ANCIEN (inconsistant)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ NOUVEAU (unifié)
const supabase = createServerClientWithConfig(cookieStore)
```

---

## 🏗️ **Patterns de Développement**

### **APIs Next.js**
```typescript
// Structure standard pour APIs admin
export async function POST(request: NextRequest) {
  try {
    // 1. Client Supabase unifié
    const cookieStore = await cookies()
    const supabase = createServerClientWithConfig(cookieStore)
    
    // 2. Validation authentification
    const authResult = await validateSuperAdmin(supabase)
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }
    
    // 3. Logique métier
    // ...
    
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```

### **Requêtes Database**
```typescript
// ✅ Utiliser les nouvelles colonnes v2
const { data: users } = await supabase
  .from('users')
  .select('id, email, role, franchise_access, gym_access, last_login')
  .eq('is_active', true)

// ✅ JOINs avec la nouvelle architecture
const { data: gyms } = await supabase
  .from('gyms')
  .select(`
    *,
    franchise:franchises(id, name, contact_email),
    manager:users(id, full_name, email)
  `)
```

---

## 🔐 **Sécurité & RLS**

### **Politiques RLS V2**
```sql
-- Super admins : accès total
CREATE POLICY "franchises_super_admin_all"
  ON franchises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Franchise owners : leurs franchises
CREATE POLICY "franchises_owners_own"
  ON franchises FOR ALL
  USING (
    owner_id = auth.uid()
    OR
    auth.uid() = ANY(
      SELECT unnest(franchise_access) 
      FROM users 
      WHERE id = auth.uid()
    )
  );
```

### **Validation des Rôles**
```typescript
// Helper function standardisé
async function validateSuperAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { valid: false, error: 'Non authentifié' }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'super_admin') {
    return { valid: false, error: 'Accès refusé - Super Admin requis' }
  }

  return { valid: true, user: userData }
}
```

---

## 📁 **Structure des Fichiers**

### **Fichiers Supprimés** ❌
- `sql/schema.sql` (obsolète, conflictuel)
- `sql/production-setup.sql` (obsolète)
- `src/lib/supabase-simple.ts` (doublon)

### **Fichiers Unifiés** ✅
- `sql/schema-v2-franchises.sql` (schéma principal)
- `sql/migration-to-v2-schema.sql` (migration complète)
- `src/lib/supabase-admin.ts` (clients unifiés)
- `src/types/database.ts` (types cohérents)
- `src/types/franchise.ts` (types business)

---

## 🚀 **Déploiement & Migration**

### **Migration en Production**
```sql
-- 1. Exécuter la migration unifiée
\i sql/migration-to-v2-schema.sql

-- 2. Vérifier la cohérence
SELECT tablename, schemaname FROM pg_tables 
WHERE schemaname = 'public';

-- 3. Tester les RLS policies
SELECT * FROM users WHERE id = auth.uid();
```

### **Checklist Post-Migration**
- [ ] ✅ Tables créées avec schéma v2
- [ ] ✅ RLS policies actives et cohérentes  
- [ ] ✅ Index créés pour performance
- [ ] ✅ Triggers updated_at fonctionnels
- [ ] ✅ Données migrées (franchise_id → franchise_access[])
- [ ] ✅ Rôles mis à jour (franchise_admin → gym_manager)

---

## 📊 **Monitoring & Debug**

### **Logs Standardisés**
```typescript
// Pattern de logging unifié
console.log('🔍 [API_NAME] Action:', data)
console.error('❌ [API_NAME] Erreur:', error)
console.warn('⚠️ [API_NAME] Attention:', warning)
```

### **Health Check**
```bash
# Vérifier l'état du système
curl https://jarvis-group.net/api/health

# Response attendue
{
  "status": "healthy",
  "services": {
    "database": { "status": "up", "latency": 150 },
    "auth": { "status": "up" }
  }
}
```

---

## 🎯 **Bonnes Pratiques**

### **DOs** ✅
- Utiliser `createServerClientWithConfig()` dans les APIs
- Respecter les nouveaux rôles: `gym_manager`, `gym_staff`
- Utiliser `franchise_access[]` au lieu de `franchise_id`
- Centraliser la config dans `getEnvironmentConfig()`
- Suivre les patterns RLS v2

### **DON'Ts** ❌
- Ne pas hardcoder `process.env.NEXT_PUBLIC_*` dans les APIs
- Ne pas utiliser les anciens rôles (`franchise_admin`, `member`)
- Ne pas référencer `last_login_at` (utiliser `last_login`)
- Ne pas créer de nouveaux clients Supabase inline
- Ne pas bypasser les validations de rôles

---

## 🔄 **Prochaines Étapes**

### **Optimisations Possibles**
1. **Cache Redis** pour les requêtes fréquentes
2. **Rate limiting** avancé par utilisateur
3. **Monitoring Sentry** pour les erreurs
4. **Tests automatisés** pour les RLS policies
5. **Documentation OpenAPI** pour les APIs

### **Maintenance**
- **Weekly**: Vérifier les logs d'erreurs
- **Monthly**: Analyser les performances DB
- **Quarterly**: Audit sécurité complet

---

*Guide technique v2.0 - Architecture unifiée post-refactoring*
*Dernière mise à jour: $(date)*