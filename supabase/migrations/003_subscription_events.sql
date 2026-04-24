-- ============================================================
-- Migration 003: public.subscription_events
-- Immutable audit log of every Stripe webhook received.
-- Never UPDATE or DELETE rows in this table.
-- Dependency: 001_users.sql must be applied first.
-- ============================================================

CREATE TABLE public.subscription_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nullable: some events arrive before a user record is linked.
  user_id         text
                                REFERENCES public.users (id)
                                ON DELETE SET NULL,

  -- Stripe guarantees event IDs are globally unique — idempotency key.
  stripe_event_id text        NOT NULL UNIQUE,

  event_type      text        NOT NULL,

  -- Full raw Stripe event payload for replay and debugging.
  payload         jsonb       NOT NULL,

  processed_at    timestamptz NOT NULL DEFAULT now()
);

-- stripe_event_id UNIQUE already creates a btree index — no duplicate needed.

-- All events for a user (support tooling, admin).
CREATE INDEX idx_subscription_events_user_id
  ON public.subscription_events (user_id)
  WHERE user_id IS NOT NULL;

-- Filter by event type for replay or analytics.
CREATE INDEX idx_subscription_events_event_type
  ON public.subscription_events (event_type);

-- Time-range queries (recent webhook dashboard).
CREATE INDEX idx_subscription_events_processed_at
  ON public.subscription_events (processed_at DESC);

-- GIN index: payload search (e.g. find all events referencing a price_id).
CREATE INDEX idx_subscription_events_payload_gin
  ON public.subscription_events USING gin (payload);

-- ── RLS ────────────────────────────────────────────────────
-- No authenticated-role read policy — internal audit data only.
-- Only service role (webhook handler) reads and writes this table.
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
