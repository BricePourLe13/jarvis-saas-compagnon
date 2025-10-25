-- ============================================================================
-- MIGRATION: CREATE KIOSKS TABLE
-- Date: 2025-10-26
-- Description: Table dédiée pour gérer les kiosks (support multi-kiosks par gym)
-- Remplace: gyms.kiosk_config (JSONB non scalable)
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE KIOSKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS kiosks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Identifiants
  slug TEXT UNIQUE NOT NULL,  -- URL-friendly (ex: "gym-dax-principal")
  name TEXT NOT NULL,         -- Nom affichage (ex: "Kiosk Entrée")
  provisioning_code TEXT UNIQUE NOT NULL,  -- Code 6 chars pour setup initial
  
  -- Status & Monitoring
  status TEXT NOT NULL DEFAULT 'provisioning' 
    CHECK (status IN ('online', 'offline', 'error', 'provisioning', 'maintenance')),
  last_heartbeat TIMESTAMPTZ,
  last_seen_ip TEXT,
  
  -- Hardware
  device_id TEXT UNIQUE,      -- MAC address ou serial number
  hardware_info JSONB DEFAULT '{}'::jsonb,  -- CPU, RAM, storage, etc.
  software_version TEXT,      -- Version app kiosk
  
  -- Configuration JARVIS
  voice_model TEXT DEFAULT 'alloy',
  language TEXT DEFAULT 'fr',
  openai_model TEXT DEFAULT 'gpt-4o-mini-realtime-preview-2024-12-17',
  
  -- Métadonnées
  location_in_gym TEXT,       -- "Entrée principale", "Zone cardio", etc.
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: Un gym peut avoir plusieurs kiosks, mais chaque slug est unique
  CONSTRAINT kiosks_gym_id_slug_unique UNIQUE (gym_id, slug)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_kiosks_gym ON kiosks(gym_id);
CREATE INDEX idx_kiosks_status ON kiosks(status);
CREATE INDEX idx_kiosks_slug ON kiosks(slug);
CREATE INDEX idx_kiosks_provisioning_code ON kiosks(provisioning_code);
CREATE INDEX idx_kiosks_device_id ON kiosks(device_id) WHERE device_id IS NOT NULL;

-- ============================================================================
-- 3. TRIGGER UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_kiosks_updated_at 
  BEFORE UPDATE ON kiosks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super admin voit tout
CREATE POLICY "super_admin_kiosks_all" ON kiosks
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy 2: Gym manager voit ses kiosks uniquement
CREATE POLICY "gym_manager_kiosks" ON kiosks
  FOR SELECT 
  USING (
    gym_id IN (
      SELECT gym_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy 3: Franchise owner voit kiosks de ses salles
CREATE POLICY "franchise_owner_kiosks" ON kiosks
  FOR SELECT 
  USING (
    gym_id IN (
      SELECT id FROM gyms
      WHERE franchise_id IN (
        SELECT franchise_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy 4: Super admin peut INSERT/UPDATE/DELETE
CREATE POLICY "super_admin_kiosks_write" ON kiosks
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_kiosks_update" ON kiosks
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_kiosks_delete" ON kiosks
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy 5: Gym manager peut UPDATE ses kiosks (config, notes)
CREATE POLICY "gym_manager_kiosks_update" ON kiosks
  FOR UPDATE 
  USING (
    gym_id IN (
      SELECT gym_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 5. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE kiosks IS 'Table dédiée pour gérer les kiosks JARVIS (support multi-kiosks par gym)';
COMMENT ON COLUMN kiosks.slug IS 'URL-friendly identifier (ex: gym-dax-principal)';
COMMENT ON COLUMN kiosks.provisioning_code IS 'Code 6 caractères pour setup initial kiosk';
COMMENT ON COLUMN kiosks.status IS 'Status actuel: online, offline, error, provisioning, maintenance';
COMMENT ON COLUMN kiosks.device_id IS 'MAC address ou serial number (unique par device)';
COMMENT ON COLUMN kiosks.hardware_info IS 'Infos matériel: CPU, RAM, storage, OS, etc.';
COMMENT ON COLUMN kiosks.voice_model IS 'Modèle voix OpenAI (alloy, echo, fable, onyx, nova, shimmer)';
COMMENT ON COLUMN kiosks.openai_model IS 'Modèle OpenAI Realtime API';
COMMENT ON COLUMN kiosks.location_in_gym IS 'Emplacement physique dans la salle';

