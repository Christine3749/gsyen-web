-- gsyen 用户系统：tiers + teams
-- 前期：快速开发，无邮箱验证
-- 后期：可扩展为企业 SSO、邮件验证等

-- ─── User Tiers（会员体系） ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gsyen_user_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free_unverified'
    CHECK (tier IN ('free_unverified', 'free', 'pro_month', 'pro_year', 'enterprise')),
  login_provider TEXT DEFAULT 'email'
    CHECK (login_provider IN ('email', 'google', 'github', 'discord', 'facebook')),
  company_domain TEXT,          -- 企业邮箱域名（可选）
  email_verified_at TIMESTAMPTZ, -- 邮箱验证时间（可选，后期支持）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gsyen_user_tiers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_gsyen_user_tiers_user_id ON gsyen_user_tiers(user_id);
CREATE INDEX idx_gsyen_user_tiers_company_domain ON gsyen_user_tiers(company_domain) WHERE company_domain IS NOT NULL;

-- ─── Teams（团队协作） ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gsyen_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  seat_limit INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gsyen_teams ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_gsyen_teams_owner ON gsyen_teams(owner_id);
CREATE INDEX idx_gsyen_teams_invite_code ON gsyen_teams(invite_code);

-- ─── Team Members（团队成员） ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gsyen_team_members (
  team_id UUID NOT NULL REFERENCES gsyen_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'member', 'admin')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

ALTER TABLE gsyen_team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_gsyen_team_members_team ON gsyen_team_members(team_id);
CREATE INDEX idx_gsyen_team_members_user ON gsyen_team_members(user_id);

-- ─── Triggers（自动更新 updated_at） ──────────────────────────────────

CREATE OR REPLACE FUNCTION gsyen_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gsyen_user_tiers_updated_at
  BEFORE UPDATE ON gsyen_user_tiers
  FOR EACH ROW EXECUTE FUNCTION gsyen_set_updated_at();

CREATE TRIGGER gsyen_teams_updated_at
  BEFORE UPDATE ON gsyen_teams
  FOR EACH ROW EXECUTE FUNCTION gsyen_set_updated_at();

-- ─── RLS Policies ──────────────────────────────────────────────────────

-- gsyen_user_tiers：用户只能读写自己的记录
CREATE POLICY "gsyen_user_tiers_select"
  ON gsyen_user_tiers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "gsyen_user_tiers_insert"
  ON gsyen_user_tiers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gsyen_user_tiers_update"
  ON gsyen_user_tiers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- gsyen_teams：所有者有完全权限，成员只能读
CREATE POLICY "gsyen_teams_select_owner"
  ON gsyen_teams FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "gsyen_teams_select_member"
  ON gsyen_teams FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM gsyen_team_members WHERE team_id = gsyen_teams.id
    )
  );

CREATE POLICY "gsyen_teams_insert"
  ON gsyen_teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "gsyen_teams_update"
  ON gsyen_teams FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "gsyen_teams_delete"
  ON gsyen_teams FOR DELETE
  USING (auth.uid() = owner_id);

-- gsyen_team_members：成员管理
CREATE POLICY "gsyen_team_members_select"
  ON gsyen_team_members FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM gsyen_teams WHERE id = team_id
    )
  );

CREATE POLICY "gsyen_team_members_insert_owner"
  ON gsyen_team_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM gsyen_teams WHERE id = team_id
    )
  );

CREATE POLICY "gsyen_team_members_delete_owner"
  ON gsyen_team_members FOR DELETE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM gsyen_teams WHERE id = team_id
    )
  );
