-- Migration pour corriger l'unicité des badges par salle
-- Avant: UNIQUE(badge_id) -> Global (Problématique pour multi-tenant)
-- Après: UNIQUE(gym_id, badge_id) -> Unicité par salle

BEGIN;

-- 1. Supprimer l'ancienne contrainte trop restrictive
ALTER TABLE public.gym_members_v2
DROP CONSTRAINT IF EXISTS gym_members_v2_badge_id_key;

-- 2. Ajouter la nouvelle contrainte composite
ALTER TABLE public.gym_members_v2
ADD CONSTRAINT gym_members_v2_gym_id_badge_id_key UNIQUE (gym_id, badge_id);

-- 3. Ajouter un index pour les performances de recherche par badge (utilisé par le Kiosk)
CREATE INDEX IF NOT EXISTS idx_gym_members_v2_gym_badge 
ON public.gym_members_v2 (gym_id, badge_id);

COMMIT;
