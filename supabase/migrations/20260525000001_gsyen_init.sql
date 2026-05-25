-- gsyen 疆域 — app data tables
-- Coexists on the shared HalfSphere Supabase instance using gsyen_ prefix.
-- Auth is handled by Supabase Auth (auth.users); these tables store app data only.

-- ─── Kanban ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gsyen_kanban_tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  col         TEXT        NOT NULL DEFAULT 'todo'
                          CHECK (col IN ('todo', 'progress', 'done')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('high', 'medium', 'low')),
  tag         TEXT        NOT NULL DEFAULT 'Feature',
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gsyen_kanban_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gsyen_kanban_tasks: owner full access"
  ON gsyen_kanban_tasks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gsyen_kanban_tasks_user ON gsyen_kanban_tasks (user_id, col, position);

-- ─── Calendar ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gsyen_calendar_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  time        TEXT        NOT NULL DEFAULT '09:00',  -- HH:MM
  type        TEXT        NOT NULL DEFAULT 'other'
                          CHECK (type IN ('meeting', 'sync', 'development', 'other')),
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gsyen_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gsyen_calendar_events: owner full access"
  ON gsyen_calendar_events FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gsyen_calendar_events_user ON gsyen_calendar_events (user_id, date);

-- ─── Emails ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gsyen_emails (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender        TEXT        NOT NULL,
  sender_email  TEXT        NOT NULL,
  avatar_letter TEXT        NOT NULL DEFAULT 'H',
  subject       TEXT        NOT NULL,
  date          TEXT        NOT NULL,
  body          TEXT        NOT NULL DEFAULT '',
  is_read       BOOLEAN     NOT NULL DEFAULT false,
  is_starred    BOOLEAN     NOT NULL DEFAULT false,
  category      TEXT        NOT NULL DEFAULT 'system'
                            CHECK (category IN ('halfsphere', 'system', 'workspace')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gsyen_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gsyen_emails: owner full access"
  ON gsyen_emails FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gsyen_emails_user ON gsyen_emails (user_id, created_at DESC);

-- ─── updated_at auto-trigger ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION gsyen_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER gsyen_kanban_tasks_updated_at
  BEFORE UPDATE ON gsyen_kanban_tasks
  FOR EACH ROW EXECUTE FUNCTION gsyen_set_updated_at();

CREATE TRIGGER gsyen_calendar_events_updated_at
  BEFORE UPDATE ON gsyen_calendar_events
  FOR EACH ROW EXECUTE FUNCTION gsyen_set_updated_at();
