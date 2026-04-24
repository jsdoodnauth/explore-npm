-- ============================================================
-- Migration 006: public.feature_flags
-- Per-user or global feature flags.
-- user_id IS NULL means the flag applies globally to all users.
-- Dependency: 001_users.sql must be applied first.
-- ============================================================

CREATE TABLE public.feature_flags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Short flag identifier, e.g. 'new_dashboard', 'beta_export'.
  name       text        NOT NULL,

  enabled    boolean     NOT NULL DEFAULT false,

  -- NULL = global flag; non-null scopes the flag to one user.
  user_id    text
                           REFERENCES public.users (id)
                           ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One global row per name; one per-user row per (name, user_id) pair.
  -- NULLS NOT DISTINCT: prevents multiple global rows with the same name.
  -- Requires PostgreSQL 15+ (Supabase default as of 2024).
  CONSTRAINT feature_flags_name_scope_unique
    UNIQUE NULLS NOT DISTINCT (name, user_id)
);

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Lookup: "is flag X enabled globally?" (most common check).
CREATE INDEX idx_feature_flags_name_global
  ON public.feature_flags (name)
  WHERE user_id IS NULL;

-- Lookup: all flags for a specific user.
CREATE INDEX idx_feature_flags_user_id
  ON public.feature_flags (user_id, name)
  WHERE user_id IS NOT NULL;

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Users can read flags scoped to them and all global flags.
CREATE POLICY "feature_flags_select_own_or_global"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (
    user_id IS NULL
    OR user_id = current_setting('app.current_user_id', true)
  );

-- All writes are service role only (admin tooling, server actions).
