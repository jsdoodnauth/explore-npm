import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionToDb } from "@/lib/stripe-helpers";
import { createServerSupabaseClient } from "@/lib/supabase";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { subscriptionActionSchema, parseBodyNext } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/subscriptions/:id
// Body: { action: "cancel" | "cancel_immediately" | "reactivate" }
// Rate limit: 30 admin actions per minute per admin user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let session;
  try {
    session = await requireAdmin(await headers());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = rateLimit(`admin-sub:${session.user.id}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const { id } = await params;

  if (!id || typeof id !== "string" || !id.startsWith("sub_")) {
    return NextResponse.json({ error: "Invalid subscription ID" }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBodyNext(subscriptionActionSchema, rawBody);
  if (!parsed.success) return parsed.response;
  const { action } = parsed.data;

  // Look up the subscription in our DB first to get user_id
  const db = createServerSupabaseClient();
  const { data: sub, error: dbError } = await db
    .from("subscriptions")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  if (dbError || !sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  try {
    let updated;

    if (action === "cancel") {
      updated = await stripe.subscriptions.update(id, { cancel_at_period_end: true });
    } else if (action === "cancel_immediately") {
      updated = await stripe.subscriptions.cancel(id);
    } else {
      // "reactivate" — only valid if cancel_at_period_end is true
      updated = await stripe.subscriptions.update(id, { cancel_at_period_end: false });
    }

    await syncSubscriptionToDb(updated, sub.user_id);

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
