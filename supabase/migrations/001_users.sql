-- ============================================================
-- Migration 001: public.users
-- App-layer profile that extends BetterAuth's public.user.
--
-- IMPORTANT: Run BetterAuth migration first:
--   npx @better-auth/cli migrate --config src/lib/auth.ts
-- That creates public.user (with text id), which this table FKs into.
-- ============================================================

CREATE TABLE public.users (
  -- Mirrors public.user.id exactly (text, not uuid).
  id                      text        PRIMARY KEY
                                        REFERENCES public.user (id)
                                        ON DELETE CASCADE,

  role                    text        NOT NULL
                                        DEFAULT 'user'
                                        CHECK (role IN ('admin', 'user')),

  stripe_customer_id      text        UNIQUE,

  -- Denormalized for fast entitlement checks (synced by webhook handler).
  subscription_status     text
                                        CHECK (subscription_status IN (
                                          'active', 'trialing', 'past_due',
                                          'canceled', 'unpaid'
                                        )),

  subscription_period_end timestamptz,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every row change.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Webhook handler looks up by stripe_customer_id frequently.
CREATE INDEX idx_users_stripe_customer_id
  ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Admin dashboards filter by role.
CREATE INDEX idx_users_role ON public.users (role);

-- Subscription expiry jobs filter by period end.
CREATE INDEX idx_users_subscription_period_end
  ON public.users (subscription_period_end)
  WHERE subscription_period_end IS NOT NULL;

-- ── RLS ────────────────────────────────────────────────────
-- NOTE: auth.uid() is always NULL because BetterAuth replaces Supabase Auth.
-- Server code sets `app.current_user_id` via SET LOCAL before querying
-- with the anon key. All writes use createServerSupabaseClient() (service
-- role) which bypasses RLS entirely — no write policies needed here.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = current_setting('app.current_user_id', true));

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING      (id = current_setting('app.current_user_id', true))
  WITH CHECK (id = current_setting('app.current_user_id', true));
