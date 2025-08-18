-- ===============================================
-- 🔧 RÉPARATION COMPLÈTE BASE DE DONNÉES
-- Safe pour production - Pas de perte de données
-- ===============================================

BEGIN;

-- 1. 🔗 AJOUTER FOREIGN KEY gym_members -> gyms (si manquante)
DO $$
BEGIN
    -- Vérifier que toutes les gym_id existent dans gyms
    IF EXISTS (
        SELECT 1 FROM gym_members gm 
        LEFT JOIN gyms g ON gm.gym_id = g.id 
        WHERE g.id IS NULL
    ) THEN
        RAISE NOTICE 'ATTENTION: Des gym_members ont des gym_id invalides!';
        -- Les afficher pour diagnostic
        RAISE NOTICE 'Membres avec gym_id invalide: %', (
            SELECT string_agg(gm.id::text, ', ') 
            FROM gym_members gm 
            LEFT JOIN gyms g ON gm.gym_id = g.id 
            WHERE g.id IS NULL
        );
    END IF;

    -- Ajouter la contrainte si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'gym_members' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'fk_gym_members_gym_id'
    ) THEN
        ALTER TABLE gym_members 
        ADD CONSTRAINT fk_gym_members_gym_id 
        FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key gym_members -> gyms ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key gym_members -> gyms existe déjà';
    END IF;
END $$;

-- 2. 👨‍💼 ASSIGNER UN MANAGER À LA GYM PRINCIPALE
DO $$
DECLARE
    brice_id UUID;
    area_gym_id UUID;
BEGIN
    -- Récupérer l'ID de Brice
    SELECT id INTO brice_id 
    FROM users 
    WHERE email = 'brice@jarvis-group.net' 
    LIMIT 1;

    -- Récupérer l'ID de la gym AREA
    SELECT id INTO area_gym_id 
    FROM gyms 
    WHERE name = 'AREA' 
    LIMIT 1;

    IF brice_id IS NOT NULL AND area_gym_id IS NOT NULL THEN
        UPDATE gyms 
        SET manager_id = brice_id,
            updated_at = NOW()
        WHERE id = area_gym_id;
        
        RAISE NOTICE '✅ Brice assigné comme manager de AREA';
    ELSE
        RAISE NOTICE '⚠️ Impossible d''assigner manager: Brice ID=%, AREA ID=%', brice_id, area_gym_id;
    END IF;
END $$;

-- 3. 🔧 CORRIGER LES RÔLES UTILISATEURS (ajouter role 'manager' si besoin)
DO $$
BEGIN
    -- Vérifier si le type enum inclut 'manager'
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_role' AND e.enumlabel = 'manager'
    ) THEN
        -- Ajouter 'manager' au type enum s'il n'existe pas
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
        RAISE NOTICE '✅ Rôle "manager" ajouté au type user_role';
    ELSE
        RAISE NOTICE 'ℹ️ Rôle "manager" existe déjà';
    END IF;
END $$;

-- 4. 📊 AJOUTER COLONNE slug AUX GYMS (si manquante)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gyms' AND column_name = 'slug'
    ) THEN
        ALTER TABLE gyms ADD COLUMN slug VARCHAR(100) UNIQUE;
        
        -- Générer des slugs pour les gyms existantes
        UPDATE gyms SET slug = 
            CASE 
                WHEN name = 'AREA' THEN 'gym-yatblc8h'
                WHEN name = 'TEST KIOSK' THEN 'gym-test'
                WHEN name = 'OB-DAX' THEN 'gym-obdax'
                ELSE lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g'))
            END
        WHERE slug IS NULL;
        
        RAISE NOTICE '✅ Colonne slug ajoutée et remplie';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne slug existe déjà';
    END IF;
END $$;

-- 5. 🛡️ MISE À JOUR POLITIQUES RLS POUR LOGGING
DO $$
BEGIN
    -- Supprimer anciennes politiques problématiques
    DROP POLICY IF EXISTS jarvis_logs_gym_access ON jarvis_conversation_logs;
    DROP POLICY IF EXISTS jarvis_logs_kiosk_insert ON jarvis_conversation_logs;

    -- Politique lecture pour managers et admins
    CREATE POLICY jarvis_logs_read_access ON jarvis_conversation_logs
    FOR SELECT TO authenticated
    USING (
        gym_id IN (
            SELECT g.id FROM gyms g 
            WHERE g.manager_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role IN ('super_admin', 'franchise_admin', 'franchise_owner')
            )
        )
    );

    -- Politique insertion pour kiosks (rôle anonyme)
    CREATE POLICY jarvis_logs_kiosk_insert ON jarvis_conversation_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        gym_id IN (SELECT id FROM gyms WHERE status = 'active')
    );

    -- Politique mise à jour pour managers
    CREATE POLICY jarvis_logs_update_access ON jarvis_conversation_logs
    FOR UPDATE TO authenticated
    USING (
        gym_id IN (
            SELECT g.id FROM gyms g 
            WHERE g.manager_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role IN ('super_admin', 'franchise_admin')
            )
        )
    );

    RAISE NOTICE '✅ Politiques RLS jarvis_conversation_logs mises à jour';
END $$;

-- 6. 📈 STATISTIQUES POST-RÉPARATION
SELECT 
    'RÉSUMÉ RÉPARATION' as type,
    (SELECT COUNT(*) FROM gyms WHERE manager_id IS NOT NULL) as gyms_avec_manager,
    (SELECT COUNT(*) FROM gym_members) as total_membres,
    (SELECT COUNT(*) FROM jarvis_conversation_logs WHERE timestamp > NOW() - INTERVAL '24 hours') as conversations_24h,
    (SELECT COUNT(*) FROM users WHERE role = 'manager') as managers_disponibles;

COMMIT;

-- 7. ✅ VÉRIFICATIONS FINALES
SELECT 'VÉRIFICATION' as check_type, 'Relations FK' as element, 
       CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MANQUANT' END as status
FROM information_schema.table_constraints 
WHERE table_name = 'gym_members' AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 'VÉRIFICATION' as check_type, 'Managers assignés' as element,
       CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ AUCUN' END as status
FROM gyms WHERE manager_id IS NOT NULL

UNION ALL

SELECT 'VÉRIFICATION' as check_type, 'Politiques RLS' as element,
       CASE WHEN COUNT(*) >= 3 THEN '✅ OK' ELSE '❌ INCOMPLÈTES' END as status
FROM pg_policies WHERE tablename = 'jarvis_conversation_logs';

RAISE NOTICE '🎉 RÉPARATION BASE DE DONNÉES TERMINÉE!';
