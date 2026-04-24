-- ============================================================
-- Migration 002: public.subscriptions
-- Full Stripe subscription record, one row per subscription.
-- Dependency: 001_users.sql must be applied first.
-- ============================================================

CREATE TABLE public.subscriptions (
  -- Stripe subscription ID (e.g. "sub_1Abc…").
  id                    text        PRIMARY KEY,

  user_id               text        NOT NULL
                                      REFERENCES public.users (id)
                                      ON DELETE CASCADE,

  stripe_customer_id    text        NOT NULL,

  status                text        NOT NULL
                                      CHECK (status IN (
                                        'active', 'trialing', 'past_due',
                                        'canceled', 'unpaid', 'incomplete',
                                        'incomplete_expired', 'paused'
                                      )),

  price_id              text        NOT NULL,
  product_id            text        NOT NULL,

  current_period_start  timestamptz NOT NULL,
  current_period_end    timestamptz NOT NULL,

  cancel_at_period_end  boolean     NOT NULL DEFAULT false,
  canceled_at           timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Primary access pattern — fetch a user's subscriptions.
CREATE INDEX idx_subscriptions_user_id
  ON public.subscriptions (user_id);

-- Webhook upserts look up by stripe_customer_id.
CREATE INDEX idx_subscriptions_stripe_customer_id
  ON public.subscriptions (stripe_customer_id);

-- Billing jobs query active subs nearing period end.
CREATE INDEX idx_subscriptions_status_period_end
  ON public.subscriptions (status, current_period_end);

-- Product/price analytics.
CREATE INDEX idx_subscriptions_product_id
  ON public.subscriptions (product_id);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users may read their own subscriptions.
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

-- All writes are service role only (webhook handler, server actions).
