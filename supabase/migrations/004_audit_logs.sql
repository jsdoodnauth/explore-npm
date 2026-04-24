-- ============================================================
-- Migration 004: public.audit_logs
-- Admin action log. Append-only — never UPDATE or DELETE rows.
-- Dependency: 001_users.sql must be applied first.
-- ============================================================

CREATE TABLE public.audit_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The admin or system actor who performed the action.
  -- RESTRICT: cannot delete a user with audit log entries.
  actor_id       text        NOT NULL
                               REFERENCES public.users (id)
                               ON DELETE RESTRICT,

  -- The user affected, if any (null for global/system actions).
  target_user_id text
                               REFERENCES public.users (id)
                               ON DELETE SET NULL,

  -- Short action identifier, e.g. 'subscription.cancel', 'user.ban'.
  action         text        NOT NULL,

  -- Structured context: before/after values, IP, user-agent, etc.
  metadata       jsonb       NOT NULL DEFAULT '{}',

  created_at     timestamptz NOT NULL DEFAULT now()
);

-- All actions by a given admin (actor audit trail).
CREATE INDEX idx_audit_logs_actor_id
  ON public.audit_logs (actor_id, created_at DESC);

-- All actions affecting a given user (target audit trail).
CREATE INDEX idx_audit_logs_target_user_id
  ON public.audit_logs (target_user_id, created_at DESC)
  WHERE target_user_id IS NOT NULL;

-- Filter by action type (e.g. all 'subscription.cancel' events).
CREATE INDEX idx_audit_logs_action
  ON public.audit_logs (action, created_at DESC);

-- Time-range scans for the admin dashboard.
CREATE INDEX idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

-- ── RLS ────────────────────────────────────────────────────
-- Only service role accesses audit logs.
-- Admins query through server-side createServerSupabaseClient().
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
