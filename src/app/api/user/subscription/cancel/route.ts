import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionToDb } from "@/lib/stripe-helpers";
import { createServerSupabaseClient } from "@/lib/supabase";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/user/subscription/cancel
// Cancels the user's active subscription at period end.
// Rate limit: 3 attempts per 10 minutes per user
export async function POST() {
  let session;
  try {
    session = await requireSession(await headers());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`sub-cancel:${session.user.id}`, 3, 10 * 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const db = createServerSupabaseClient();
  const { data: sub, error } = await db
    .from("subscriptions")
    .select("id, user_id, status")
    .eq("user_id", session.user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sub) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  try {
    const updated = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    });
    await syncSubscriptionToDb(updated, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancellation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
