-- 🔧 FIX: Permettre l'insertion de session costs depuis le kiosk (non-authentifié)

-- Supprimer la policy existante
DROP POLICY IF EXISTS "Authenticated users can access session costs" ON jarvis_session_costs;

-- Nouvelle policy qui permet INSERT même sans auth (pour le kiosk)
CREATE POLICY "Allow session costs from kiosk and authenticated users"
  ON jarvis_session_costs
  FOR ALL
  USING (
    -- Permettre la lecture pour utilisateurs authentifiés seulement
    CASE 
      WHEN TG_OP = 'SELECT' THEN auth.uid() IS NOT NULL
      ELSE true -- Permettre INSERT/UPDATE/DELETE même sans auth (kiosk)
    END
  )
  WITH CHECK (
    -- Permettre l'insertion même sans auth (pour le kiosk)
    true
  );

-- Alternative: Policy plus permissive temporaire
CREATE POLICY "Kiosk session costs insert" 
  ON jarvis_session_costs
  FOR INSERT
  WITH CHECK (true); -- Permettre toute insertion

CREATE POLICY "Authenticated session costs access"
  ON jarvis_session_costs  
  FOR SELECT
  TO authenticated
  USING (true);

SELECT 'Policies RLS jarvis_session_costs mises à jour pour permettre insertion kiosk' as message;