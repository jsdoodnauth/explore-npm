# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

Stripe webhook forwarding (required for billing features in dev):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Generate BetterAuth schema migrations:
```bash
npx @better-auth/cli generate
```

## Environment Setup

Copy `.env.example` to `.env.local`. Required variables:
- **BetterAuth**: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **OAuth**: `GOOGLE_CLIENT_ID/SECRET`, `TWITTER_CLIENT_ID/SECRET`
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all four `STRIPE_*_PRICE_ID` vars

## Architecture

This is a Next.js 16 SaaS starter ("Meridian") with App Router using:
- **BetterAuth** for authentication (email/password + Google + Twitter OAuth)
- **Supabase** as the database (Postgres) — used both via the JS client and direct `pg` pool
- **Stripe** for subscriptions with webhook-driven state sync

### Route Groups

- `(auth)` — public auth pages (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`)
- `(public)` — marketing landing page
- `(protected)` — gated by `requireSession()` in its layout; wraps all dashboard/admin routes
- `api/` — Route Handlers for auth (`[...all]`), Stripe checkout/portal/webhooks, and user profile/password/subscription

### Authentication & Authorization

`src/lib/session.ts` provides three server-only helpers used in Server Components and Route Handlers:
- `getSession(headers)` — returns session or null
- `requireSession(headers)` — redirects to `/sign-in` if unauthenticated
- `requireAdmin(headers)` — redirects to `/dashboard` if not role=`admin`

The `(protected)/layout.tsx` calls `requireSession` and passes the session down to `DashboardShell`.

### Database Split

BetterAuth owns the `user` table (note: quoted in SQL as it's a reserved word). App-specific data lives in a separate `users` table joined by `users_id_fkey`. Admin queries in `src/lib/admin-queries.ts` always LEFT JOIN these two tables.

Supabase clients:
- `createServerSupabaseClient()` — service role key, bypasses RLS; use only server-side
- `browserSupabaseClient` — anon key, respects RLS; safe in Client Components

### Stripe Billing

Tiers are defined in `src/lib/stripe-products.ts`: `starter` (free), `pro`, `enterprise`. Price IDs come from env vars at module load — missing IDs throw at startup.

Webhook handler at `api/webhooks/stripe/route.ts` handles: `checkout.session.completed`, `customer.subscription.updated/deleted/trial_will_end`, `invoice.paid/payment_failed`. All events are idempotency-checked via `logWebhookEvent` before processing.

Subscription state is synced to Supabase via `syncSubscriptionToDb` in `src/lib/stripe-helpers.ts`.

### Rate Limiting

`src/lib/rate-limit.ts` provides in-memory sliding-window rate limiting. It works for single-instance deployments only — replace with Redis (e.g. `@upstash/ratelimit`) for multi-instance/edge deployments.

### UI Stack

- Tailwind CSS v4 with `tw-animate-css`
- shadcn/ui components (config in `components.json`)
- `@base-ui/react` for headless primitives
- `recharts` for analytics charts in the admin panel
- `next-themes` with dark mode as default
- Fonts: Geist Sans (`--font-sans`) + Playfair Display (`--font-heading`)

### `server-only` Imports

Files in `src/lib/` that touch secrets or DB use `import "server-only"` at the top. Never import these from Client Components.
