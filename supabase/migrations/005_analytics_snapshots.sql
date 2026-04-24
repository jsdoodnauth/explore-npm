-- ============================================================
-- Migration 005: public.analytics_snapshots
-- Daily aggregated metrics — one row per calendar date.
-- No FK dependencies on other app tables.
-- ============================================================

CREATE TABLE public.analytics_snapshots (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One row per day. UNIQUE constraint also creates the btree index.
  date                 date    NOT NULL UNIQUE,

  -- Monthly Recurring Revenue in smallest currency unit (cents).
  -- bigint avoids floating-point rounding errors for money values.
  mrr                  bigint  NOT NULL DEFAULT 0,

  active_subscriptions integer NOT NULL DEFAULT 0,
  new_signups          integer NOT NULL DEFAULT 0,
  churned              integer NOT NULL DEFAULT 0,

  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Time-range queries for charts (last 30/90/365 days).
CREATE INDEX idx_analytics_snapshots_date_desc
  ON public.analytics_snapshots (date DESC);

-- ── RLS ────────────────────────────────────────────────────
-- Only service role reads and writes analytics snapshots.
-- Admin dashboards query through createServerSupabaseClient().
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
