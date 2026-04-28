# Explore NPM — Tasks

This file is the **persistent task ledger** across Claude sessions. The in-session `TaskCreate` / `TaskUpdate` tool is per-conversation and doesn't survive a restart — this file does.

**For a fresh Claude session:** read this file first, then `docs/planning/README.md` and `docs/planning/architecture.md` for product/tech context. Pick up from the first task in the **Active** section.

**Workflow rule:** when a task starts, change its status to `in progress`. When it finishes, mark `done` and append the commit SHA or short note. New tasks discovered mid-flight go into **Backlog** (or **Active** if they're the next thing).

Status legend: ✅ done · 🟡 in progress · ⬜ pending · 🚧 blocked

---

## Active

| # | Task | Description | Status |
|---|------|-------------|--------|
| 20 | Verify auth end-to-end | Run `npm run dev`, sign up via email/password and via Google OAuth, confirm DATABASE_URL works for BetterAuth's `pg.Pool` (the seed bypassed it via the JS client; auth itself doesn't have that escape hatch) | ⬜ |
| 21 | Bootstrap script for top-10k packages | One-shot script that streams `https://replicate.npmjs.com/_changes` to collect all package names, batches calls to `api.npmjs.org/downloads/point/last-week/{names}` (128/call), ranks by weekly downloads, inserts top 10k into `packages` with stub metadata, then fetches per-package `/{name}` for full metadata. Runs ~2-4 hours; expect to run on GH Actions or local machine, not Vercel. Persists final `_changes` seq into `ingestion_state.changes_since`. | ⬜ |

## Backlog — Data pipeline

| # | Task | Description | Status |
|---|------|-------------|--------|
| 22 | Cron: `_changes` poll | `/api/cron/ingest-changes` — daily. Reads `ingestion_state.changes_since`, fetches `_changes?since=<seq>`, refetches metadata for any tracked package that changed, writes new seq. | ⬜ |
| 23 | Cron: download stats refresh | `/api/cron/download-stats` — daily. Chunks tracked packages into 128-batches, calls `/downloads/point/last-week/{batch}`, upserts `download_snapshots` and updates `packages.weekly_downloads`. | ⬜ |
| 24 | Cron: weekly rerank + trending | `/api/cron/recompute-trending` — weekly. Recomputes `rank` across all known packages, demotes packages that fell below 10k, ingests packages newly in top 10k (sets `is_new_entrant`), computes `wow_growth_pct` from `download_snapshots`, queues categorization for new entrants. | ⬜ |
| 25 | Cron: LLM categorization | `/api/cron/categorize` — runs against newly-ingested packages. Batches 20 packages per Claude Haiku 4.5 call, prompts to classify into the fixed taxonomy from `categories`, writes 1-3 rows per package into `package_categories`. Add `@anthropic-ai/sdk` dep. | ⬜ |
| 26 | Cron auth | `CRON_SECRET` env var; routes verify `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron sets this header automatically. | ⬜ |
| 27 | `vercel.json` cron schedule | Wire all four crons into `vercel.json` with appropriate cadence (ingest-changes daily, download-stats daily, recompute-trending weekly, categorize daily). | ⬜ |

## Backlog — Public UI

| # | Task | Description | Status |
|---|------|-------------|--------|
| 28 | Rewrite landing-page copy | `HeroSection`, `FaqAccordion`, `TestimonialsSection` still have placeholder Meridian SaaS copy. Rewrite for Explore NPM positioning. Coordinate with `docs/marketing/`. | ⬜ |
| 29 | Home page (real) | Replace `(public)/page.tsx` content (currently the rewritten landing) with the real homepage: trending feed (top 12), new-entrants feed (top 12), category tiles. | ⬜ |
| 30 | Trending feed page | `(public)/trending/page.tsx` — full list, filterable by category. | ⬜ |
| 31 | New-entrants feed page | `(public)/new/page.tsx` — packages newly in top-10k this week. | ⬜ |
| 32 | Categories index | `(public)/categories/page.tsx` — all categories with package counts. | ⬜ |
| 33 | Category detail page | `(public)/categories/[slug]/page.tsx` — packages within a category. | ⬜ |
| 34 | Package detail page | `(public)/packages/[...name]/page.tsx` — supports `@scope/name`. Shows metadata, weekly downloads chart, category tags, links. | ⬜ |
| 35 | Search page + API | `(public)/search/page.tsx` + `/api/packages/search` — uses the `search_vector` tsvector index + trigram fuzzy match on name. | ⬜ |

## Backlog — User features

| # | Task | Description | Status |
|---|------|-------------|--------|
| 36 | Favorites API + page | `POST/DELETE /api/user/favorites`, `(app)/favorites/page.tsx`. | ⬜ |
| 37 | Lists API + pages | `/api/user/lists`, `/api/user/lists/[id]/items`, `(app)/lists/page.tsx`, `(app)/lists/[id]/page.tsx`. | ⬜ |
| 38 | Settings: digest preferences | Extend `(app)/dashboard/settings` to manage newsletter subscription + category filters. | ⬜ |

## Backlog — Email digest

| # | Task | Description | Status |
|---|------|-------------|--------|
| 39 | Newsletter subscribe form | `(public)/subscribe/page.tsx` + `/api/subscribe` — public email signup with optional category filter. Add Resend + React Email deps. Verification flow via `verified_at` column. | ⬜ |
| 40 | Cron: weekly digest | `/api/cron/weekly-digest` — pulls top trending + new-entrants, renders React Email template, batches 100 recipients per Resend call, respects `unsubscribed_at`. | ⬜ |

## Backlog — Cleanup / polish

| # | Task | Description | Status |
|---|------|-------------|--------|
| 41 | Footer social links | Replace placeholder `Twitter` icon link in `Footer.tsx` with project's actual GitHub repo link, or remove. | ⬜ |
| 42 | Pre-existing template lint errors | Fix `<a>` brand links → `next/link`, `Math.random` in `HeroVisual`, unescaped quotes in FAQ/Testimonials, `setState`-in-effect in `theme-toggle`, `require()` in `schemas.ts`. Pre-existing template debt. | ⬜ |
| 43 | Re-add `@better-auth/cli` | Currently we use `npx @better-auth/cli@latest` ad-hoc to dodge the version-skew with `@better-auth/core`. Once the CLI catches up to better-auth's release line, pin it as a dev dep again. | ⬜ |

---

## Done

| # | Task | Notes |
|---|------|-------|
| 1 | Create docs directory scaffold | `docs/planning`, `docs/mocks`, `docs/marketing` |
| 2 | Write product overview planning doc | `docs/planning/README.md` |
| 3 | Write architecture & data pipeline doc | `docs/planning/architecture.md` |
| 4 | Draft starter taxonomy | `docs/planning/taxonomy.md` |
| 5 | Write template cleanup plan | `docs/planning/template-cleanup.md` |
| 6 | Delete Stripe/billing code | All `src/lib/stripe*`, `src/app/api/stripe`, `webhooks`, `user/subscription`, billing page, BillingActions, Pricing/Mid/Final sections |
| 7 | Delete admin code | `src/lib/admin-queries.ts`, `src/app/api/admin`, `src/app/(protected)/admin`, `src/components/admin` |
| 8 | Strip Twitter + admin plugin from auth | `auth.ts`, `session.ts` (no `requireAdmin`), `OAuthButtons.tsx`, sign-in/up forms |
| 9 | Rename `(protected)` → `(app)`; clean shell | DashboardShell, SidebarNav, nav-config, UserMenu, Breadcrumbs |
| 10 | Update config files | `next.config.ts` (Stripe CSP gone), `package.json` (dropped stripe, recharts, @better-auth/cli), `.env.example` (Anthropic/Resend/CRON_SECRET added) |
| 11 | Verify build + lint pass | `npm run build` succeeds with placeholder env. Pre-existing lint errors flagged in task 42. |
| 12 | Write Postgres schema migration | `supabase/migrations/20260424000001_init_explore_npm.sql` |
| 13 | Write canonical taxonomy | `src/lib/taxonomy.ts` (71 categories) |
| 14 | Write seed script + npm script | `scripts/seed-categories.ts`, `npm run seed:categories`, `tsx`+`dotenv` deps |
| 15 | Document migration workflow | `supabase/README.md` |
| 16 | Verify install + typecheck | `npx tsc --noEmit` clean |
| 17 | Re-run seed against new project | 71 categories seeded; switched seed script from raw `pg` to Supabase JS client to bypass DB password-encoding issues |
| 18 | Regenerate BetterAuth schema for current version | `supabase/migrations/20260424000002_betterauth.sql` (idempotent via `IF NOT EXISTS`) |
| 19 | Delete old template migrations | Removed `000_betterauth*`, `001-006_*.sql` |
