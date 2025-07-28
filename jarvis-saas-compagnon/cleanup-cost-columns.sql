-- 🧹 NETTOYAGE DES COLONNES D'ESTIMATION
-- Script pour simplifier la table jarvis_session_costs
-- On garde seulement les métriques de base, les vrais coûts viennent de l'API OpenAI

-- ✅ 1. Supprimer les colonnes d'estimation ajoutées
ALTER TABLE jarvis_session_costs 
DROP COLUMN IF EXISTS is_cost_real;

ALTER TABLE jarvis_session_costs 
DROP COLUMN IF EXISTS estimated_cost_updated_at;

ALTER TABLE jarvis_session_costs 
DROP COLUMN IF EXISTS real_cost_updated_at;

-- ✅ 2. Ajouter un commentaire pour clarifier l'usage
COMMENT ON COLUMN jarvis_session_costs.total_cost IS 'Coût estimé de la session (les vrais coûts viennent de l''API OpenAI Usage)';

-- ✅ 3. Vérifier la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jarvis_session_costs' 
ORDER BY ordinal_position; 