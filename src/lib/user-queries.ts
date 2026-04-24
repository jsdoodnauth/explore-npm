import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase";

export interface UserSubscription {
  id: string;
  status: string;
  price_id: string;
  product_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
}

export interface UserProfile {
  role: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  subscription_period_end: string | null;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const db = createServerSupabaseClient();

  const { data, error } = await db
    .from("subscriptions")
    .select(
      "id, status, price_id, product_id, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at"
    )
    .eq("user_id", userId)
    .not("status", "in", '("canceled","incomplete","incomplete_expired")')
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch subscription: ${error.message}`);
  return data ?? null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = createServerSupabaseClient();

  const { data, error } = await db
    .from("users")
    .select("role, stripe_customer_id, subscription_status, subscription_period_end")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
  return data ?? null;
}

export async function getSubscriptionEvents(userId: string, limit = 10) {
  const db = createServerSupabaseClient();

  const { data, error } = await db
    .from("subscription_events")
    .select("id, event_type, processed_at, stripe_event_id")
    .eq("user_id", userId)
    .order("processed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch events: ${error.message}`);
  return data ?? [];
}
