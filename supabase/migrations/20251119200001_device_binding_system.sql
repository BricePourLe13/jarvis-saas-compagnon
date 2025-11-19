-- ============================================================================
-- MIGRATION: Device Binding System (Netflix-style)
-- Date: 2025-11-19
-- ============================================================================
-- Cette migration remplace le système de "slug public" par un système
-- d'appairage sécurisé par code temporaire (Device Flow).
--
-- Principe:
-- 1. Un écran (miroir) génère un code unique temporaire (ex: 123-456)
-- 2. Le Manager/Admin entre ce code dans le Dashboard
-- 3. Le serveur associe l'écran à la salle
-- 4. Un token sécurisé est stocké sur l'écran
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: device_pairing_codes
-- Codes temporaires pour l'appairage d'un nouvel écran
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_pairing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(7) NOT NULL UNIQUE, -- Format: XXX-XXX (6 chiffres)
  socket_id VARCHAR(255), -- Pour refresh automatique via WebSocket
  device_fingerprint TEXT, -- Infos navigateur/hardware (optionnel)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | paired | expired
  paired_kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  paired_at TIMESTAMPTZ,
  paired_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index pour les lookups rapides
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paired', 'expired'))
);

CREATE INDEX idx_device_codes_code ON public.device_pairing_codes(code);
CREATE INDEX idx_device_codes_status ON public.device_pairing_codes(status);
CREATE INDEX idx_device_codes_expires_at ON public.device_pairing_codes(expires_at);

-- ----------------------------------------------------------------------------
-- TABLE: kiosks (Mise à jour)
-- Ajout du système de tokens sécurisés pour les devices
-- ----------------------------------------------------------------------------

-- Ajouter colonnes pour le Device Binding (si elles n'existent pas déjà)
ALTER TABLE public.kiosks 
ADD COLUMN IF NOT EXISTS device_token_hash VARCHAR(255) UNIQUE, -- Hash SHA-256 du token device
ADD COLUMN IF NOT EXISTS device_paired_at TIMESTAMPTZ, -- Date du premier appairage
ADD COLUMN IF NOT EXISTS device_last_seen TIMESTAMPTZ, -- Dernière activité (heartbeat)
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT, -- Infos navigateur/hardware
ADD COLUMN IF NOT EXISTS device_revoked_at TIMESTAMPTZ; -- Si révoqué à distance

-- Index pour les lookups par token
CREATE INDEX IF NOT EXISTS idx_kiosks_device_token ON public.kiosks(device_token_hash);
CREATE INDEX IF NOT EXISTS idx_kiosks_device_last_seen ON public.kiosks(device_last_seen);

-- ----------------------------------------------------------------------------
-- FUNCTION: Nettoyer les codes expirés (cron job)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_device_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.device_pairing_codes
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
    
  -- Optionnel: Supprimer complètement les codes expirés depuis +24h
  DELETE FROM public.device_pairing_codes
  WHERE status = 'expired'
    AND expires_at < (now() - interval '24 hours');
END;
$$;

-- ----------------------------------------------------------------------------
-- RLS POLICIES: device_pairing_codes
-- ----------------------------------------------------------------------------

-- Activer RLS
ALTER TABLE public.device_pairing_codes ENABLE ROW LEVEL SECURITY;

-- Politique 1: Accès public anonyme pour CRÉER un code (écran génère le code)
CREATE POLICY "device_codes_anon_insert"
ON public.device_pairing_codes
FOR INSERT
TO anon
WITH CHECK (true); -- Tout le monde peut créer un code

-- Politique 2: Accès public anonyme pour LIRE son propre code (polling status)
CREATE POLICY "device_codes_anon_view_own"
ON public.device_pairing_codes
FOR SELECT
TO anon
USING (true); -- Lecture publique pour permettre le polling (pas de user auth)

-- Politique 3: Super Admin peut tout voir/modifier
CREATE POLICY "device_codes_super_admin_all"
ON public.device_pairing_codes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
  )
);

-- Politique 4: Gym Manager peut voir/modifier les codes de SES salles
CREATE POLICY "device_codes_manager_view"
ON public.device_pairing_codes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role = 'gym_manager'
      AND paired_kiosk_id IN (
        SELECT id FROM public.kiosks WHERE gym_id = users.gym_id
      )
  )
);

-- ----------------------------------------------------------------------------
-- MIGRATION DONNÉES: Marquer les kiosks existants comme "legacy"
-- ----------------------------------------------------------------------------

-- Les kiosks existants (avec slug) restent fonctionnels
-- On ajoute juste un flag pour indiquer qu'ils utilisent l'ancien système
UPDATE public.kiosks
SET device_fingerprint = '{"legacy": true, "migration_date": "2025-11-19"}'::text
WHERE device_token_hash IS NULL;

-- ----------------------------------------------------------------------------
-- COMMENTAIRES (Documentation)
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.device_pairing_codes IS 
  'Codes temporaires pour l''appairage Device Binding (Netflix-style). Un écran génère un code, le Manager l''entre dans le Dashboard pour autoriser l''accès.';

COMMENT ON COLUMN public.kiosks.device_token_hash IS 
  'Hash SHA-256 du token device. Ce token est stocké en cookie sur l''écran et sert d''authentification.';

COMMENT ON COLUMN public.kiosks.device_revoked_at IS 
  'Date de révocation du device. Si non-null, le kiosk ne peut plus se connecter (utile pour bloquer un écran volé/perdu).';

-- ----------------------------------------------------------------------------
-- FIN MIGRATION
-- ----------------------------------------------------------------------------

