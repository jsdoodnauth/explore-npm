# Supabase — Migrations & Seed

Schema for Explore NPM lives in `supabase/migrations/`. The category taxonomy seed lives in `scripts/seed-categories.ts` (sourced from `src/lib/taxonomy.ts`).

## Apply the schema

### Option A — Supabase CLI (recommended for ongoing work)

```bash
# One-time: link this project to your Supabase project
supabase link --project-ref <your-project-ref>

# Apply pending migrations to the linked remote DB
supabase db push
```

CLI install: <https://supabase.com/docs/guides/cli>.

### Option B — SQL Editor (one-off / no CLI)

1. Open the Supabase dashboard → **SQL Editor** for your project.
2. Open `supabase/migrations/20260424000001_init_explore_npm.sql`.
3. Paste the contents into a new query and run it.

This is fine for the initial bootstrap. Switch to Option A once you start adding more migrations.

## Seed the category taxonomy

After the schema is applied, populate the `categories` table:

```bash
npm run seed:categories
```

The script reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` and connects via the Supabase JS client (service-role key bypasses RLS). This sidesteps the connection-string / password-encoding pitfalls of connecting via raw `pg`.

It is **idempotent**: re-running it after edits to `src/lib/taxonomy.ts` will update existing rows by `slug` and insert new ones. It does **not** delete categories that have been removed from the source file — that is a manual operation, since deleting a category will cascade to `package_categories` rows.

## BetterAuth tables

BetterAuth's `user`, `session`, `account`, and `verification` tables live in `20260424000002_betterauth.sql`, generated via:

```bash
npx @better-auth/cli@latest generate --yes --output supabase/migrations/<timestamp>_betterauth.sql
```

That file uses `CREATE TABLE IF NOT EXISTS` so re-pushing is a no-op. If you regenerate it, re-add the `IF NOT EXISTS` guards.

BetterAuth's user-id column is `text`, which is why our `user_favorites.user_id`, `user_lists.user_id`, and `newsletter_subscriptions.user_id` columns are `text` (and not `uuid`) and have no foreign key — keeping the two schemas decoupled.
