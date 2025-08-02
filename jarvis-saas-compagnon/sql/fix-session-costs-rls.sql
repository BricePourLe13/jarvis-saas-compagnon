-- 🔧 FIX: Permettre l'insertion de session costs depuis le kiosk (non-authentifié)

-- Supprimer la policy existante
DROP POLICY IF EXISTS "Authenticated users can access session costs" ON jarvis_session_costs;

-- Policy simple: permettre INSERT à tous (kiosk + authentifiés)
CREATE POLICY "Allow session costs insert from kiosk"
  ON jarvis_session_costs
  FOR INSERT
  WITH CHECK (true); -- Toute insertion autorisée

-- Policy pour lecture: utilisateurs authentifiés seulement  
CREATE POLICY "Authenticated users read session costs"
  ON jarvis_session_costs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy pour UPDATE/DELETE: utilisateurs authentifiés seulement
CREATE POLICY "Authenticated users modify session costs"
  ON jarvis_session_costs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users delete session costs"
  ON jarvis_session_costs
  FOR DELETE
  TO authenticated
  USING (true);

SELECT 'Policies RLS jarvis_session_costs mises à jour pour permettre insertion kiosk' as message;