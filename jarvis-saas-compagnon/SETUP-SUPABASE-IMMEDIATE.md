# 🏗️ CONFIGURATION SUPABASE JARVIS - EXÉCUTION IMMÉDIATE

## 📋 ÉTAPES À FAIRE MAINTENANT

### 1. 🔗 Connexion à votre Supabase
Aller sur : https://grlktijcxafzxctdlncj.supabase.co
Puis : Settings > API > Copy URL + anon key

### 2. 📊 Exécuter le Schema SQL dans Supabase
Aller dans : SQL Editor > New Query > Coller ce code :

```sql
-- SCHEMA JARVIS COMPLET - À exécuter dans Supabase SQL Editor

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tables principales

-- Franchises (Orange Bleue, etc.)
CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  revenue_share_percent DECIMAL(5,2) DEFAULT 30.00,
  monthly_subscription DECIMAL(10,2) DEFAULT 1600.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gyms/Salles de sport  
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  monthly_fee DECIMAL(10,2) DEFAULT 1600.00,
  is_active BOOLEAN DEFAULT true,
  slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kiosks (interfaces physiques dans les salles)
CREATE TABLE IF NOT EXISTS kiosks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  last_ping TIMESTAMPTZ,
  token TEXT UNIQUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membres/Adhérents
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  badge_id TEXT UNIQUE,
  satisfaction_score INTEGER DEFAULT 0,
  churn_risk_score INTEGER DEFAULT 0,
  last_visit TIMESTAMPTZ,
  total_conversations INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations avec Jarvis
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_id UUID REFERENCES kiosks(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  jarvis_response TEXT,
  sentiment_score DECIMAL(3,2),
  intent_category TEXT,
  duration_seconds INTEGER,
  ai_analysis JSONB DEFAULT '{}',
  has_ad_placement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenus Publicitaires (coeur du business model)
CREATE TABLE IF NOT EXISTS ad_revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  campaign_type TEXT,
  product_mentioned TEXT,
  amount DECIMAL(10,2) NOT NULL,
  franchise_share DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 30.00,
  status TEXT DEFAULT 'pending', -- pending, confirmed, paid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights IA pour dashboards
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'churn_risk', 'satisfaction', 'revenue_opportunity', 'trend'
  title TEXT NOT NULL,
  description TEXT,
  insight_data JSONB NOT NULL,
  priority INTEGER DEFAULT 0, -- 1=low, 5=critical
  is_read BOOLEAN DEFAULT FALSE,
  is_action_taken BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics aggregées (pour performance)
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_ad_revenue DECIMAL(10,2) DEFAULT 0,
  avg_satisfaction DECIMAL(3,2) DEFAULT 0,
  unique_members INTEGER DEFAULT 0,
  churn_alerts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, date)
);

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_conversations_gym_date ON conversations(gym_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ad_revenues_franchise_date ON ad_revenues(franchise_id, created_at);
CREATE INDEX IF NOT EXISTS idx_insights_gym_unread ON ai_insights(gym_id, is_read);
CREATE INDEX IF NOT EXISTS idx_members_gym_active ON members(gym_id, is_active);

-- 4. RLS (Row Level Security) pour multitenant
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- 5. Policies pour Admin (voit tout)
CREATE POLICY "admin_all_franchises" ON franchises
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

CREATE POLICY "admin_all_gyms" ON gyms
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- 6. Policies pour Franchise Owners
CREATE POLICY "franchise_owner_own_franchise" ON franchises
FOR ALL TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "franchise_owner_gyms" ON gyms
FOR ALL TO authenticated
USING (
  franchise_id IN (
    SELECT id FROM franchises WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "franchise_owner_revenues" ON ad_revenues
FOR ALL TO authenticated
USING (
  franchise_id IN (
    SELECT id FROM franchises WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "franchise_owner_insights" ON ai_insights
FOR ALL TO authenticated
USING (
  franchise_id IN (
    SELECT id FROM franchises WHERE owner_id = auth.uid()
  )
);

-- 7. Policies pour Gym Managers
CREATE POLICY "gym_manager_own_gym" ON gyms
FOR ALL TO authenticated
USING (manager_id = auth.uid());

CREATE POLICY "gym_manager_members" ON members
FOR ALL TO authenticated
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE manager_id = auth.uid()
  )
);

CREATE POLICY "gym_manager_conversations" ON conversations
FOR ALL TO authenticated
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE manager_id = auth.uid()
  )
);

CREATE POLICY "gym_manager_insights" ON ai_insights
FOR ALL TO authenticated
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE manager_id = auth.uid()
  )
);

-- 8. Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kiosks_updated_at BEFORE UPDATE ON kiosks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Vues pour analytics (optionnel, pour plus tard)
CREATE OR REPLACE VIEW franchise_dashboard_stats AS
SELECT 
  f.id as franchise_id,
  f.name as franchise_name,
  COUNT(DISTINCT g.id) as total_gyms,
  COUNT(DISTINCT m.id) as total_members,
  COALESCE(SUM(ar.amount), 0) as total_ad_revenue,
  COALESCE(AVG(m.satisfaction_score), 0) as avg_satisfaction
FROM franchises f
LEFT JOIN gyms g ON f.id = g.franchise_id
LEFT JOIN members m ON g.id = m.gym_id
LEFT JOIN ad_revenues ar ON f.id = ar.franchise_id
WHERE f.is_active = true
GROUP BY f.id, f.name;

-- 10. Données de test (optionnel)
-- Créer un admin test
INSERT INTO auth.users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@jarvis.local')
ON CONFLICT DO NOTHING;

-- Franchise test
INSERT INTO franchises (id, name, email, owner_id) 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Orange Bleue Test',
  'franchise@orangebleue.fr',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;
```

### 3. ⚙️ Configuration Environment Variables
Dans Supabase Dashboard > Settings > API, noter :
- `NEXT_PUBLIC_SUPABASE_URL` : https://grlktijcxafzxctdlncj.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : votre clé anon

### 4. 🚀 Setup Next.js avec Supabase
```bash
cd jarvis-saas-compagnon
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install lucide-react recharts react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query zustand
```

## ✅ RÉSULTAT ATTENDU

Après cette étape, vous aurez :
- ✅ Database JARVIS complète dans Supabase
- ✅ Sécurité multitenant (RLS) configurée
- ✅ Schema optimisé pour votre business model
- ✅ Prêt pour développement Next.js

**Durée estimée : 30-45 minutes**

**Prochaine étape :** Setup du projet Next.js et migration des composants
