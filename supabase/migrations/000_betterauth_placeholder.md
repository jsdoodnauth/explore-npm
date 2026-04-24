# Step 0 — BetterAuth Migration (run before SQL files)

BetterAuth creates its own tables (`user`, `session`, `account`, `verification`)
via its CLI. These must exist before applying 001–006.

```bash
npx @better-auth/cli migrate --config src/lib/auth.ts
```

Or generate SQL to paste into the Supabase SQL editor:

```bash
npx @better-auth/cli generate --config src/lib/auth.ts
```

After Step 0, apply migrations in order:
001_users.sql → 002_subscriptions.sql → 003_subscription_events.sql →
004_audit_logs.sql → 005_analytics_snapshots.sql → 006_feature_flags.sql
