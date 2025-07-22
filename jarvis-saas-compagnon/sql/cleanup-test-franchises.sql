-- ===========================================
-- 🧹 NETTOYAGE: Supprimer toutes les franchises de test
-- ===========================================
-- But: Remettre à zéro la base pour ne garder que
--      les franchises créées manuellement via l'admin

-- 1. AFFICHER LES FRANCHISES EXISTANTES (pour vérification)
DO $$ 
DECLARE 
    franchise_record RECORD;
    total_count INTEGER;
BEGIN
    -- Compter le total
    SELECT COUNT(*) INTO total_count FROM franchises;
    
    RAISE NOTICE '📊 ÉTAT ACTUEL DE LA BASE:';
    RAISE NOTICE '   Total franchises: %', total_count;
    RAISE NOTICE '';
    
    -- Lister toutes les franchises
    IF total_count > 0 THEN
        RAISE NOTICE '📋 FRANCHISES EXISTANTES:';
        FOR franchise_record IN 
            SELECT id, name, contact_email, created_at 
            FROM franchises 
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE '   • % - % (créé le %)', 
                franchise_record.name, 
                franchise_record.contact_email,
                franchise_record.created_at::date;
        END LOOP;
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '✅ Aucune franchise trouvée - base déjà propre';
    END IF;
END $$;

-- 2. SUPPRIMER TOUTES LES DONNÉES LIÉES EN CASCADE
DO $$ 
DECLARE 
    deleted_gyms INTEGER;
    deleted_users INTEGER;
    deleted_franchises INTEGER;
BEGIN
    -- Supprimer les salles liées (si la table existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gyms') THEN
        DELETE FROM gyms;
        GET DIAGNOSTICS deleted_gyms = ROW_COUNT;
        RAISE NOTICE '🏋️ Supprimé % salle(s)', deleted_gyms;
    ELSE
        deleted_gyms := 0;
        RAISE NOTICE '🏋️ Table gyms inexistante - ignorée';
    END IF;
    
    -- Supprimer les utilisateurs propriétaires de franchise (optionnel - à décommenter si souhaité)
    -- DELETE FROM users WHERE role = 'franchise_owner';
    -- GET DIAGNOSTICS deleted_users = ROW_COUNT;
    -- RAISE NOTICE '👤 Supprimé % utilisateur(s) propriétaire(s)', deleted_users;
    
    -- Supprimer TOUTES les franchises
    DELETE FROM franchises;
    GET DIAGNOSTICS deleted_franchises = ROW_COUNT;
    
    RAISE NOTICE '';
    RAISE NOTICE '🗑️ SUPPRESSION TERMINÉE:';
    RAISE NOTICE '   • % franchise(s) supprimée(s)', deleted_franchises;
    RAISE NOTICE '   • % salle(s) supprimée(s)', deleted_gyms;
    RAISE NOTICE '';
    
    IF deleted_franchises > 0 THEN
        RAISE NOTICE '✅ Base nettoyée avec succès !';
        RAISE NOTICE '   Tu peux maintenant créer tes franchises via l''admin';
    ELSE
        RAISE NOTICE '💡 Aucune franchise à supprimer - base déjà vide';
    END IF;
END $$;

-- 3. RÉINITIALISER LES SÉQUENCES (optionnel)
-- Pour que les prochains IDs commencent à 1
-- Décommente si tu veux repartir de zéro pour les IDs numériques

-- ALTER SEQUENCE IF EXISTS franchises_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS gyms_id_seq RESTART WITH 1;

-- 4. VÉRIFICATION FINALE
DO $$ 
DECLARE 
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM franchises;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VÉRIFICATION FINALE:';
    RAISE NOTICE '   Franchises restantes: %', final_count;
    
    IF final_count = 0 THEN
        RAISE NOTICE '✅ Parfait ! Base complètement nettoyée';
        RAISE NOTICE '🚀 Prêt pour créer tes vraies franchises !';
    ELSE
        RAISE NOTICE '⚠️ Il reste encore % franchise(s)', final_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
    RAISE NOTICE '   1. Va sur http://localhost:3001/admin/franchises';
    RAISE NOTICE '   2. Clique "Nouvelle Franchise"';
    RAISE NOTICE '   3. Crée tes vraies franchises manuellement';
END $$; 