-- Autoriser les gérants à ajouter des membres dans leur propre salle
CREATE POLICY "Enable insert for gym managers" ON "public"."gym_members_v2"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  exists (
    select 1
    from users
    where users.id = auth.uid()
    and users.role = 'gym_manager'
    and users.gym_id = gym_members_v2.gym_id
  )
);

-- Autoriser aussi l'update pour les corrections (ou upsert CSV)
CREATE POLICY "Enable update for gym managers" ON "public"."gym_members_v2"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  exists (
    select 1
    from users
    where users.id = auth.uid()
    and users.role = 'gym_manager'
    and users.gym_id = gym_members_v2.gym_id
  )
)
WITH CHECK (
  exists (
    select 1
    from users
    where users.id = auth.uid()
    and users.role = 'gym_manager'
    and users.gym_id = gym_members_v2.gym_id
  )
);
