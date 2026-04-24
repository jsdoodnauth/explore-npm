import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Server-side Supabase client.
 * Uses the service role key — bypasses Row Level Security.
 * Only use in Server Components, Route Handlers, and Server Actions.
 */
export function createServerSupabaseClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl!, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Browser-side Supabase client singleton.
 * Uses the anon key — respects Row Level Security.
 * Safe to use in Client Components.
 */
export const browserSupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
