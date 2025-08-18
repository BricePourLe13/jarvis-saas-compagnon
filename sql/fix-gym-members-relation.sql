-- 🔧 FIX: Ajouter la relation manquante entre gym_members et gyms

-- 1. Vérifier que la colonne gym_id existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gym_members' AND column_name = 'gym_id';

-- 2. Ajouter la contrainte foreign key si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'gym_members' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'fk_gym_members_gym_id'
    ) THEN
        ALTER TABLE gym_members 
        ADD CONSTRAINT fk_gym_members_gym_id 
        FOREIGN KEY (gym_id) REFERENCES gyms(id);
        
        RAISE NOTICE 'Foreign key constraint added';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- 3. Vérifier les relations après
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'gym_members';
