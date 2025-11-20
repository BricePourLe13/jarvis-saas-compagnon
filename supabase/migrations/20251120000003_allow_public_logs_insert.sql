-- Migration pour permettre aux kiosks (anonymes) d'insérer des logs
-- Date: 20 novembre 2024
-- Contexte: Les kiosks doivent pouvoir logger les erreurs et événements système

-- ============================================================================
-- POLICY 1: Permettre INSERT anonyme dans jarvis_errors_log
-- ============================================================================
CREATE POLICY "kiosk_can_insert_errors"
ON public.jarvis_errors_log
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================================
-- POLICY 2: Permettre INSERT anonyme dans system_logs
-- ============================================================================
CREATE POLICY "kiosk_can_insert_system_logs"
ON public.system_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON POLICY "kiosk_can_insert_errors" ON public.jarvis_errors_log IS 
'Permet aux kiosks (anon) de logger les erreurs sans authentification';

COMMENT ON POLICY "kiosk_can_insert_system_logs" ON public.system_logs IS 
'Permet aux kiosks (anon) de logger les événements système sans authentification';

