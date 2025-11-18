-- ============================================================================
-- MIGRATION: Ajout foreign keys manquantes gyms.manager_id et kiosks relations
-- Date: 2025-11-18
-- Description: Ajoute les contraintes foreign keys manquantes
-- ============================================================================

-- 1. Ajouter foreign key gyms.manager_id -> users.id
DO $$
BEGIN
  -- Vérifier si la contrainte n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'gyms_manager_id_fkey' 
    AND table_name = 'gyms'
  ) THEN
    ALTER TABLE gyms
      ADD CONSTRAINT gyms_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES users(id)
      ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Foreign key gyms_manager_id_fkey créée';
  ELSE
    RAISE NOTICE 'ℹ️  Foreign key gyms_manager_id_fkey existe déjà';
  END IF;
END $$;

-- 2. Créer index sur gyms.manager_id pour performance
CREATE INDEX IF NOT EXISTS idx_gyms_manager_id ON gyms(manager_id);

-- 3. Logs
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20251118000002 complétée';
END $$;

