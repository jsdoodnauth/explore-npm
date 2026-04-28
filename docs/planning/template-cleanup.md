# Template Cleanup

The repo was bootstrapped from a "Meridian" SaaS template with Stripe billing, an admin console, and Twitter OAuth. Explore NPM is a free public product, so most of that scaffolding becomes dead weight. This doc is the explicit removal list.

**Rule of thumb:** keep auth primitives, theming, and the generic dashboard shell. Delete anything Stripe-, admin-, or billing-adjacent.

## Files to delete outright

### Stripe / billing
- `src/lib/stripe.ts`
- `src/lib/stripe-helpers.ts`
- `src/lib/stripe-products.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/checkout-redirect/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/webhooks/stripe/route.ts` (and empty parent `webhooks/` dir)
- `src/app/api/user/subscription/cancel/route.ts` (and empty `subscription/` dir)
- `src/app/(protected)/dashboard/billing/page.tsx`
- `src/components/dashboard/BillingActions.tsx`
- `src/components/sections/PricingCards.tsx`
- `src/components/sections/PricingSection.tsx`

### Admin
- `src/lib/admin-queries.ts`
- `src/app/api/admin/subscriptions/[id]/route.ts` (and empty `admin/` dir)
- `src/app/(protected)/admin/` — entire folder (`page.tsx`, `analytics/`, `subscriptions/`, `users/`)
- `src/components/admin/` — entire folder (`AnalyticsCharts.tsx`, `AnalyticsContent.tsx`, `SubscriptionAlerts.tsx`, `SubscriptionsTable.tsx`, `UsersTable.tsx`)

### Landing page sections tied to paid product messaging
Keep the landing-page scaffolding but rewrite copy/content later. Delete sections that don't apply to a free tool:
- `src/components/sections/PricingCards.tsx` (listed above)
- `src/components/sections/PricingSection.tsx` (listed above)
- `src/components/sections/MidPageCta.tsx` — replace with new marketing copy
- `src/components/sections/FinalCta.tsx` — replace

Keep & rewrite copy later: `HeroSection`, `HeroVisual`, `FeaturesSection`, `FaqSection`, `FaqAccordion`, `TestimonialsSection` (repurpose as "dev testimonials" or delete).

## Code to modify (not delete)

### `src/lib/auth.ts`
- Remove Twitter provider + env var requirements
- Remove `admin()` plugin import and usage
- Keep Google, email/password, Pool-based Postgres adapter

### `src/lib/session.ts`
- Delete `requireAdmin()`; keep `getSession` + `requireSession`

### `src/app/(protected)/` → rename to `src/app/(app)/`
- The "protected" label was tied to the admin/billing split; "app" fits the new model (account area for logged-in users)
- `layout.tsx` stays but `DashboardShell` loses admin nav
- Delete `(protected)/error.tsx` only if we replace with a simpler version; otherwise keep

### `src/components/dashboard/DashboardShell.tsx` + `SidebarNav.tsx` + `nav-config.ts`
- Strip admin links (users, subscriptions, analytics)
- Replace dashboard/billing/settings nav with: Favorites, Lists, Settings
- Remove role-based rendering (no admin role anymore)

### `src/components/auth/OAuthButtons.tsx`
- Remove Twitter button + handler

### `next.config.ts`
- Remove Stripe-related CSP directives (`https://js.stripe.com`, `https://api.stripe.com`, `https://hooks.stripe.com`)
- Remove Supabase CSP entry **only if** we fully swap off supabase-js — we aren't; keep it

### `package.json` — dependencies to remove
- `stripe`
- `better-auth/plugins` usage removed means no dep change (plugin lives inside `better-auth`)
- (Keep everything else including `pg`, `@supabase/supabase-js`, BetterAuth, Tailwind, lucide, etc.)

### `package.json` — dependencies to add
- `@anthropic-ai/sdk` — categorization
- `resend` — email
- `react-email` + `@react-email/components` — digest templates
- `p-limit` — parallelism control for ingest jobs

### `.env.example` — rewrite
- Remove: all `STRIPE_*`, all `NEXT_PUBLIC_STRIPE_*`, `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`
- Add: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`

### Database migrations
- Drop tables/rows from prior schema: `subscriptions`, `audit_logs`, `subscription_events`, `analytics_snapshots`, and any `stripe_*` columns on the `users` profile table
- Keep BetterAuth's `user`/`session`/`account`/`verification` tables as-is
- Replace `users` app-profile table with whatever minimal fields we still need (likely: just a pointer row or drop entirely since favorites key on BetterAuth user id)

## Order of operations

Two separate commits / PRs keep this reviewable:

1. **Rip-out commit** — delete everything listed above, remove deps, rename `(protected)` → `(app)`, strip admin/billing code. Repo should still build and `npm run dev` should load a broken-but-serving site.
2. **New-schema commit** — apply the Explore NPM migrations from `architecture.md`, seed taxonomy, scaffold cron routes as stubs that 501.

Feature work (data pipeline, UI) starts after both commits land.

## What to verify post-cleanup

- `npm run lint` passes
- `npm run build` passes (TypeScript has no dangling imports from deleted files)
- Dev server starts, home page loads (even if the copy is stale)
- Sign-in with Google still works end-to-end
- No references to `stripe`, `admin`, or `twitter` remain:
  - `rg -i "stripe|twitter|admin" src/` should return only intentional matches (e.g., BetterAuth's `admin` CSS class or unrelated strings)
