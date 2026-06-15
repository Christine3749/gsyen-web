-- RPC: join_team_by_invite_code
-- SECURITY DEFINER bypasses RLS so any authenticated user can look up a team
-- by invite code and self-insert into gsyen_team_members as 'member'.
CREATE OR REPLACE FUNCTION join_team_by_invite_code(p_invite_code TEXT, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_count   INT;
BEGIN
  SELECT id INTO v_team_id
  FROM gsyen_teams
  WHERE invite_code = UPPER(TRIM(p_invite_code));

  IF v_team_id IS NULL THEN
    RETURN 'invalid_code';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM gsyen_team_members
  WHERE team_id = v_team_id AND user_id = p_user_id;

  IF v_count > 0 THEN
    RETURN 'already_member';
  END IF;

  INSERT INTO gsyen_team_members (team_id, user_id, role)
  VALUES (v_team_id, p_user_id, 'member');

  RETURN 'ok';
END;
$$;
