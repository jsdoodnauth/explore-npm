# Architecture — Explore NPM

## Data sources

| Purpose | Endpoint | Notes |
|---|---|---|
| Package metadata | `https://registry.npmjs.org/{name}` | Full doc per package. Large — we keep a trimmed projection. |
| Incremental updates | `https://replicate.npmjs.com/_changes?since={seq}&filter=_doc_ids` (or unfiltered stream) | CouchDB change feed. Store `since` cursor; resume on each run. |
| Search (fallback/user search) | `https://registry.npmjs.org/-/v1/search?text=&size=250` | 250/page cap. Used for user-facing search bypass if our index is stale. |
| Download stats (bulk) | `https://api.npmjs.org/downloads/point/last-week/{pkg1},{pkg2},...` | Max 128 packages per call. ~78 calls for 10k. |
| Download stats (range) | `https://api.npmjs.org/downloads/range/{period}/{pkg}` | Historical. Single-package only. Use for backfilling charts. |

Rate limits are soft; be polite (1 req/sec for `_changes`, parallelize download-stats calls 4–8 at a time).

## Database schema (Postgres / Supabase)

```sql
-- Core package record. One row per package ever indexed.
create table packages (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,        -- including scope, e.g. "@babel/core"
  scope           text,                         -- "@babel" or null
  description     text,
  homepage        text,
  repository_url  text,
  latest_version  text,
  license         text,
  author_name     text,
  author_email    text,
  keywords        text[] default '{}',
  dependency_names text[] default '{}',         -- signal for categorization
  first_published_at timestamptz,
  last_published_at  timestamptz,
  readme_excerpt  text,                         -- truncated ~8k chars, for LLM input
  readme_excerpt_updated_at timestamptz,

  -- Latest snapshot (hot path — avoids join on every list view)
  weekly_downloads bigint default 0,
  rank            int,                          -- current download rank among tracked
  wow_growth_pct  real,                         -- week-over-week %, may be negative
  is_new_entrant  boolean default false,        -- set true when first promoted to top-10k

  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz                    -- soft-delete if unpublished
);

create index packages_rank_idx on packages (rank) where rank is not null;
create index packages_wow_idx on packages (wow_growth_pct desc nulls last);
create index packages_new_entrant_idx on packages (is_new_entrant, rank) where is_new_entrant;
create index packages_name_trgm on packages using gin (name gin_trgm_ops);
create index packages_search_idx on packages using gin (
  to_tsvector('english', coalesce(description,'') || ' ' || array_to_string(keywords, ' '))
);

-- Weekly download history, keyed by (package, week_start)
create table download_snapshots (
  package_id  uuid references packages(id) on delete cascade,
  week_start  date not null,
  downloads   bigint not null,
  primary key (package_id, week_start)
);

-- Taxonomy (fixed, seeded — see taxonomy.md)
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  parent_id   uuid references categories(id),  -- allows 2-level nesting later
  sort_order  int default 0
);

create table package_categories (
  package_id  uuid references packages(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  confidence  real,                 -- LLM-reported 0..1
  source      text default 'llm',   -- 'llm' | 'manual' | 'rule'
  assigned_at timestamptz default now(),
  primary key (package_id, category_id)
);

-- Ingestion cursor (single row, pk=1)
create table ingestion_state (
  id               int primary key default 1,
  changes_since    text,             -- last _changes seq we consumed
  last_full_rerank timestamptz,
  last_digest_sent timestamptz,
  constraint singleton check (id = 1)
);

-- User favorites (BetterAuth "user" table provides user id)
create table user_favorites (
  user_id     uuid not null,         -- references public."user"(id)
  package_id  uuid references packages(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, package_id)
);

create table user_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  name        text not null,
  slug        text not null,
  description text,
  is_public   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, slug)
);

create table list_items (
  list_id     uuid references user_lists(id) on delete cascade,
  package_id  uuid references packages(id) on delete cascade,
  position    int,
  notes       text,
  primary key (list_id, package_id)
);

-- Email digest subscriptions (works for logged-in and anonymous)
create table newsletter_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,                           -- null for email-only subs
  email           text not null,
  category_ids    uuid[] default '{}',            -- empty = all categories
  verified_at     timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz default now(),
  unique (email)
);
```

## Ingestion pipeline

### Bootstrap (one-shot, manual trigger)

```
scripts/bootstrap.ts
  1. Stream _changes feed from seq 0, collect all package names (~3M). ~1 hour.
  2. For each chunk of 128 names, call /downloads/point/last-week/{names}. Persist to
     download_snapshots with this week's week_start.
  3. Select top 10k by weekly_downloads. Insert into packages with stub metadata.
  4. For each of the 10k, fetch /{name} and populate full package row.
  5. Save final _changes seq to ingestion_state.changes_since.
```

Run this on a beefier machine (not Vercel). GitHub Actions with 6-hour timeout works. Total runtime estimate: 2–4 hours.

### Daily cron — `_changes` poll (`/api/cron/ingest-changes`)

```
1. Load ingestion_state.changes_since.
2. Fetch _changes?since={seq}&include_docs=false, paginate until caught up.
3. For each change whose id matches a tracked package: refetch /{name}, update row.
4. For changes to packages NOT tracked: ignore (they'll be reconsidered in weekly rerank).
5. Save new seq.
```

### Daily cron — download stats refresh (`/api/cron/download-stats`)

```
1. For all tracked packages, chunk into batches of 128.
2. Call /downloads/point/last-week/{batch}, write to download_snapshots (upsert on
   (package_id, week_start)).
3. Update packages.weekly_downloads with latest value.
```

~78 API calls, parallelism 4–8, fits in 60s Vercel timeout.

### Weekly cron — rerank + trending (`/api/cron/recompute-trending`)

```
1. Compute current rank by weekly_downloads across ALL known packages
   (including ones we don't currently track but have stats for).
2. For packages currently tracked that fell below rank 10k: keep in DB (for historical
   URLs) but set rank = null, is_new_entrant = false.
3. For packages NOW in top 10k but not tracked: fetch metadata, insert, mark
   is_new_entrant = true.
4. For continuing packages: compare this week's downloads to 7 days ago (from
   download_snapshots). Write wow_growth_pct.
5. Queue categorization for any new_entrant rows.
6. Update ingestion_state.last_full_rerank.
```

### Categorization job (`/api/cron/categorize`)

Batch 20 packages per Claude call. Prompt:

> You are classifying an npm package into a fixed taxonomy.
>
> Taxonomy: `[list of {slug, name, description} from categories table]`
>
> Package: `{name}` — `{description}`
> Keywords: `{keywords}`
> Dependencies: `{dependency_names, truncated}`
> README excerpt: `{readme_excerpt, truncated to 2k chars}`
>
> Return JSON: `{"categories": [{"slug": "...", "confidence": 0.0-1.0}]}`
> Select 1–3 categories. If nothing fits, return `[]`.

Model: `claude-haiku-4-5-20251001`. Cost estimate: 10k packages × ~2k input / 50 output tokens ≈ $5 one-time, ≤ $1/week after.

### Weekly digest (`/api/cron/weekly-digest`)

```
1. Query: top 10 trending + top 10 new entrants (optionally filtered by
   subscriber.category_ids).
2. Render React Email template.
3. Send via Resend, batch endpoint, 100 recipients per request.
```

## Page structure

```
src/app/
├── layout.tsx                              — root; theme provider
│
├── (public)/
│   ├── layout.tsx                          — navbar + footer shell
│   ├── page.tsx                            — home: trending + new-entrants + category tiles
│   ├── trending/page.tsx                   — full trending list w/ filters
│   ├── new/page.tsx                        — full new-entrants list
│   ├── categories/
│   │   ├── page.tsx                        — all categories index
│   │   └── [slug]/page.tsx                 — packages within a category
│   ├── packages/[...name]/page.tsx         — [...] handles @scope/name
│   ├── search/page.tsx                     — ?q= search results
│   └── subscribe/page.tsx                  — email digest signup
│
├── (auth)/                                 — keep from template (strip Twitter OAuth)
│   ├── sign-in, sign-up, forgot-password, reset-password
│
├── (app)/                                  — renamed from (protected)
│   ├── layout.tsx                          — requireSession() + shell
│   ├── favorites/page.tsx
│   ├── lists/page.tsx
│   ├── lists/[id]/page.tsx
│   └── settings/page.tsx                   — profile + digest preferences
│
└── api/
    ├── auth/[...all]/route.ts              — keep
    ├── user/
    │   ├── favorites/route.ts              — POST/DELETE
    │   ├── lists/route.ts
    │   └── lists/[id]/items/route.ts
    ├── packages/
    │   ├── search/route.ts                 — used by client-side typeahead
    │   └── [...name]/route.ts              — JSON API for detail (optional)
    ├── subscribe/route.ts                  — newsletter signup + verification
    └── cron/
        ├── ingest-changes/route.ts
        ├── download-stats/route.ts
        ├── recompute-trending/route.ts
        ├── categorize/route.ts
        └── weekly-digest/route.ts
```

Cron routes protect themselves via `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron adds this automatically when `CRON_SECRET` is set).

## Environment variables (delta from template)

**Adds:**
- `ANTHROPIC_API_KEY` — for categorization
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

**Removes:**
- All `STRIPE_*`, `NEXT_PUBLIC_STRIPE_*`
- `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` (Google-only OAuth for MVP)

## File-path references to existing code worth reusing

- `src/lib/auth.ts` — BetterAuth setup; strip Twitter + `admin()` plugin
- `src/lib/session.ts` — `getSession`, `requireSession` keep; drop `requireAdmin`
- `src/lib/supabase.ts` — `createServerSupabaseClient`, `browserSupabaseClient` — reuse as-is
- `src/lib/rate-limit.ts` — reuse for `/api/subscribe` and search endpoints
- `src/components/theme-provider.tsx` + `globals.css` — keep
- `src/app/(auth)/*` — keep flows, strip Twitter buttons from `OAuthButtons.tsx`
- `src/components/dashboard/DashboardShell.tsx` — adapt into `(app)` shell; strip admin nav
