# Explore NPM — Product Plan

A discovery surface for the npm registry. The npm search UX ranks by download count and buries everything new or interesting. Explore NPM fixes that by ingesting the top ~10k packages, categorizing them with an LLM, and surfacing **what's trending** and **what just entered the top 10k** alongside a curated category browser.

## Why this exists

Discovery on npmjs.com is broken for the long tail. Existing alternatives:
- **npms.io** — effectively abandoned
- **npmleaderboard.org** — new, thin, not fully functional
- **Socket/Snyk** — security-focused, not discovery
- **npmtrends** — comparison, not discovery

None of them answer the question: *"what's new and interesting in the JS ecosystem this week?"* or *"show me every WebGPU/3D/Electron package worth knowing about."*

## The two core feeds

1. **Trending** — week-over-week weekly-download growth %. Biased toward novelty because established packages have flat growth curves.
2. **New entrants to top 10k** — packages that weren't in our index last week but now are. Pure discovery signal.

These are **separate first-class features** on the homepage, not merged into a single "trending" list.

## MVP scope

**In:**
- Public browse + search over the top ~10k packages
- Trending feed (weekly)
- New-entrants feed (weekly)
- Category browser (~50–100 LLM-assigned categories, fixed taxonomy)
- Package detail pages with metadata + download chart + category tags
- User accounts (sign-in, sign-up, OAuth via Google)
- Save favorites, build personal lists
- Weekly digest email via Resend (opt-in)

**Out (explicitly not MVP):**
- Package comparison view (npmtrends already owns this)
- All of npm beyond top 10k
- Community tagging / user-submitted categorization
- Paid tier / Stripe
- Admin dashboard

## Per-package metadata we capture

From npm registry (`/{package}` and `/-/v1/search`):
- `name`, `scope` (if scoped)
- `description`
- `keywords[]`
- `latest_version`, `versions[]` (we only keep latest + first-published/last-published timestamps)
- `license`
- `author` + `maintainers[]`
- `homepage`, `repository.url`, `bugs.url`
- `readme` (truncated ~10k chars — used for categorization input only; not displayed in full)
- `dependencies`, `devDependencies` (counts + names — names useful as categorization signal, e.g. "depends on three.js → 3D")

From downloads API (`api.npmjs.org/downloads/...`):
- `weekly_downloads` (snapshotted each week)
- Historical `download_snapshots` table drives trending math

Derived:
- `categories[]` (LLM-assigned, 1–3 per package)
- `wow_growth_pct`, `rank`, `new_entrant` flag (recomputed weekly)

## Success signals (what "working" looks like)

- A developer lands on `/categories/3d` and finds 10+ packages they didn't know about
- The trending feed surfaces at least one genuinely obscure-but-interesting package per week
- Weekly digest CTR above 10%
- Returning visitor rate > 30% after 8 weeks

## Tech stack

- **Framework:** Next.js 16 (App Router) — already scaffolded
- **Database:** Supabase Postgres with full-text search (`tsvector`) + `pg_trgm` for fuzzy name search
- **Auth:** BetterAuth (already in template) — email + Google OAuth only (drop Twitter for MVP)
- **LLM categorization:** Anthropic Claude Haiku 4.5 (cheap, fast, good enough for classification)
- **Email:** Resend + React Email
- **Crons:** Vercel Cron for scheduling; heavy jobs (bulk ingest) run as Vercel functions with extended duration

## Open questions for implementation phase

1. **Bootstrap approach for the initial top-10k list.** npm has no "top N by downloads" endpoint. Realistic paths:
   - (a) Replicate the CouchDB `_changes` feed once to get all ~3M package names, then call `/downloads/range/` in batches of 128 to rank. One-time job, runs overnight.
   - (b) Seed from an existing dataset (libraries.io dump, npm's most-depended-on list) and expand. Faster but less current.
   - **Recommendation:** (a) — it's authoritative and runs once.
2. **Cron runtime limits.** Vercel Hobby = 60s function timeout, Pro = 300s. Ingesting 10k package metadata may need chunking + resumable jobs. Alternative: run ingestion on a separate cheap VPS or GitHub Actions.
3. **Taxonomy versioning.** When we rename/split a category, do we re-categorize everything? Plan: categories have stable UUIDs + slugs, renames are cosmetic; splits trigger targeted re-run.

## Directory conventions

- `docs/planning/` — planning docs (this directory)
- `docs/mocks/` — HTML mockups, screenshots, design refs
- `docs/marketing/` — landing-page copy, social posts, launch materials
