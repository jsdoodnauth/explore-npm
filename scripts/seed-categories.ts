/**
 * Seed the `categories` table with the canonical taxonomy.
 *
 * Idempotent: upserts by slug. Re-run any time the source-of-truth in
 * src/lib/taxonomy.ts changes; existing rows get name/description/sort_order
 * updated, missing rows get inserted, and rows already in the DB but absent
 * from the source are NOT removed (deletion is a manual operation).
 *
 * Uses the Supabase JS client with the service-role key (bypasses RLS),
 * which sidesteps the connection-string / password-encoding pitfalls of
 * connecting via raw pg.
 *
 * Run with: npm run seed:categories
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "../src/lib/taxonomy";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Did you copy .env.example to .env.local and fill in Supabase credentials?",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main(): Promise<void> {
  const rows = CATEGORIES.map((cat, i) => ({
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    sort_order: i,
  }));

  const { error } = await db.from("categories").upsert(rows, { onConflict: "slug" });

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }

  // Quick verification — fetch back the count.
  const { count, error: countError } = await db
    .from("categories")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.warn(`(Could not verify count: ${countError.message})`);
  } else {
    console.log(`Seeded ${rows.length} categories. Categories table now has ${count} rows.`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
