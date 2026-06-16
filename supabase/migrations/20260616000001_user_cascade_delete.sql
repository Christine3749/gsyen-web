-- Add ON DELETE CASCADE to all foreign keys referencing auth.users
-- so that deleting a user from Supabase Auth automatically cleans up
-- all associated data across every public table.

-- gsyen_vault
ALTER TABLE public.gsyen_vault
  DROP CONSTRAINT IF EXISTS gsyen_vault_user_id_fkey,
  ADD CONSTRAINT gsyen_vault_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- gsyen_team_members
ALTER TABLE public.gsyen_team_members
  DROP CONSTRAINT IF EXISTS gsyen_team_members_user_id_fkey,
  ADD CONSTRAINT gsyen_team_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- gsyen_teams (owner)
ALTER TABLE public.gsyen_teams
  DROP CONSTRAINT IF EXISTS gsyen_teams_owner_id_fkey,
  ADD CONSTRAINT gsyen_teams_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
