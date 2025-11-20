-- Migration : Autoriser l'insertion de membres pour les gérants
-- Fix : "new row violates row-level security policy for table gym_members_v2"

BEGIN;

-- 1. Activer RLS (au cas où)
ALTER TABLE public.gym_members_v2 ENABLE ROW LEVEL SECURITY;

-- 2. Créer la policy d'INSERT
-- Un utilisateur authentifié peut insérer une ligne SI :
-- Son rôle est 'gym_manager' ET le gym_id de la ligne correspond à son gym_id de profil
CREATE POLICY "Managers can insert members for their gym"
ON public.gym_members_v2
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'gym_manager'
    AND users.gym_id = gym_members_v2.gym_id
  )
);

-- 3. Créer la policy de SELECT (pour qu'ils voient ce qu'ils insèrent)
-- (Si elle n'existe pas déjà, sinon on drop/create pour être sûr)
DROP POLICY IF EXISTS "Managers can view their gym members" ON public.gym_members_v2;

CREATE POLICY "Managers can view their gym members"
ON public.gym_members_v2
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'gym_manager'
    AND users.gym_id = gym_members_v2.gym_id
  )
);

-- 4. Créer la policy d'UPDATE (pour les modifs manuelles/CSV)
CREATE POLICY "Managers can update their gym members"
ON public.gym_members_v2
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'gym_manager'
    AND users.gym_id = gym_members_v2.gym_id
  )
);

-- 5. Créer la policy DELETE
CREATE POLICY "Managers can delete their gym members"
ON public.gym_members_v2
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'gym_manager'
    AND users.gym_id = gym_members_v2.gym_id
  )
);

COMMIT;
