-- RPC: join_team_by_invite_code
-- SECURITY DEFINER bypasses RLS so any authenticated user can look up a team
-- by invite code and self-insert into gsyen_team_members as 'member'.
-- Uses auth.uid() directly to prevent privilege escalation (no p_user_id param).
-- Atomic INSERT ... ON CONFLICT eliminates the COUNT/INSERT race condition.
CREATE OR REPLACE FUNCTION join_team_by_invite_code(p_invite_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id
  FROM gsyen_teams
  WHERE invite_code = UPPER(TRIM(p_invite_code));

  IF v_team_id IS NULL THEN
    RETURN 'invalid_code';
  END IF;

  INSERT INTO gsyen_team_members (team_id, user_id, role)
  VALUES (v_team_id, auth.uid(), 'member')
  ON CONFLICT (team_id, user_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN 'already_member';
  END IF;

  RETURN 'ok';
END;
$$;
