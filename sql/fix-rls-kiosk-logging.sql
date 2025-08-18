-- 🔧 FIX: RLS pour permettre aux kiosks de logger les conversations
-- 
-- PROBLÈME: Politique RLS trop restrictive, bloque les kiosks anonymes
-- SOLUTION: Permettre l'insertion depuis les kiosks authentifiés

-- 1. Ajouter une politique pour les insertions depuis les kiosks
DROP POLICY IF EXISTS jarvis_logs_kiosk_insert ON jarvis_conversation_logs;

CREATE POLICY jarvis_logs_kiosk_insert ON jarvis_conversation_logs
  FOR INSERT TO anon
  WITH CHECK (
    -- Permettre si la gym existe et est active
    gym_id IN (
      SELECT id FROM gyms WHERE status = 'active'
    )
  );

-- 2. Modifier la politique existante pour être plus permissive pour les lectures
DROP POLICY IF EXISTS jarvis_logs_gym_access ON jarvis_conversation_logs;

CREATE POLICY jarvis_logs_gym_access ON jarvis_conversation_logs
  FOR SELECT TO authenticated
  USING (
    gym_id IN (
      SELECT id FROM gyms WHERE manager_id = auth.uid()
      UNION
      SELECT id FROM gyms WHERE franchise_id IN (
        SELECT id FROM franchises WHERE owner_id = auth.uid()
      )
    ) OR auth.role() = 'service_role'
  );

-- 3. Politique UPDATE/DELETE pour les managers seulement
CREATE POLICY jarvis_logs_gym_manage ON jarvis_conversation_logs
  FOR UPDATE TO authenticated
  USING (
    gym_id IN (
      SELECT id FROM gyms WHERE manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- 4. Vérifier les politiques
\d+ jarvis_conversation_logs;
