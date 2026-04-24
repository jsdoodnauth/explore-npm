import "server-only";
import { stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { SubscriptionStatus } from "@/types/index";
import type { Stripe } from "@/lib/stripe";

// ─── Customer helpers ─────────────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const db = createServerSupabaseClient();

  const { data: userRow, error: fetchError } = await db
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  // PGRST116 = row not found — acceptable if users row doesn't exist yet
  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(`DB fetch error: ${fetchError.message}`);
  }

  if (userRow?.stripe_customer_id) {
    return userRow.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  await db.from("users").upsert({ id: userId, stripe_customer_id: customer.id });

  return customer.id;
}

// ─── Subscription sync ────────────────────────────────────────────────────────

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
  };
  // incomplete, incomplete_expired, paused fall back to 'canceled'
  return statusMap[status] ?? "canceled";
}

export async function syncSubscriptionToDb(
  subscription: Stripe.Subscription,
  userId?: string
): Promise<void> {
  const db = createServerSupabaseClient();

  let resolvedUserId = userId ?? subscription.metadata?.userId;

  if (!resolvedUserId) {
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const { data } = await db
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    resolvedUserId = data?.id;
  }

  if (!resolvedUserId) {
    throw new Error(`Cannot resolve userId for subscription ${subscription.id}`);
  }

  const item = subscription.items.data[0];
  const priceId = item?.price.id ?? null;
  const productId =
    typeof item?.price.product === "string"
      ? item.price.product
      : (item?.price.product as Stripe.Product | undefined)?.id ?? null;

  const mappedStatus = mapStripeStatus(subscription.status);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // In Stripe API >= 2026-02-25.clover, current_period_start/end live on the
  // subscription item, not the subscription root.
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;

  const { error: subError } = await db.from("subscriptions").upsert({
    id: subscription.id,
    user_id: resolvedUserId,
    stripe_customer_id: customerId,
    status: mappedStatus,
    price_id: priceId,
    product_id: productId,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  });

  if (subError) throw new Error(`subscriptions upsert failed: ${subError.message}`);

  const { error: userError } = await db
    .from("users")
    .update({
      subscription_status: mappedStatus,
      subscription_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq("id", resolvedUserId);

  if (userError) throw new Error(`users update failed: ${userError.message}`);
}

// ─── Webhook event logging ────────────────────────────────────────────────────

export type LogResult = "inserted" | "duplicate";

export async function logWebhookEvent(
  stripeEventId: string,
  eventType: string,
  payload: Stripe.Event,
  userId?: string
): Promise<LogResult> {
  const db = createServerSupabaseClient();

  const { error } = await db.from("subscription_events").insert({
    user_id: userId ?? null,
    stripe_event_id: stripeEventId,
    event_type: eventType,
    payload: payload as unknown as Record<string, unknown>,
    processed_at: new Date().toISOString(),
  });

  if (error) {
    // 23505 = unique_violation — event already processed
    if (error.code === "23505") return "duplicate";
    throw new Error(`subscription_events insert failed: ${error.message}`);
  }

  return "inserted";
}

// ─── User lookup ──────────────────────────────────────────────────────────────

export async function resolveUserByCustomerId(
  customerId: string
): Promise<string | null> {
  const db = createServerSupabaseClient();
  const { data } = await db
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id ?? null;
}
