import "server-only";
import { stripe } from "@/lib/stripe";
import type { Stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  syncSubscriptionToDb,
  logWebhookEvent,
  resolveUserByCustomerId,
} from "@/lib/stripe-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request): Promise<Response> {
  if (!webhookSecret) {
    return Response.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[stripe webhook] ${event.type} failed:`, message);
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({ received: true }, { status: 200 });
}

async function getCustomerUserId(customerId: string, metadata?: Record<string, string> | null): Promise<string | undefined> {
  return (
    metadata?.userId ??
    (await resolveUserByCustomerId(customerId)) ??
    undefined
  );
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {

    // ── Checkout completed ─────────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const logResult = await logWebhookEvent(event.id, event.type, event);
      if (logResult === "duplicate") return;

      const userId =
        session.metadata?.userId ??
        session.client_reference_id ??
        undefined;

      if (!userId) {
        // Synthetic test events (stripe trigger) have no userId — skip gracefully.
        console.warn(`[stripe] checkout.session.completed: no userId in session ${session.id}, skipping`);
        return;
      }

      if (session.customer) {
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer.id;
        const db = createServerSupabaseClient();
        await db.from("users").upsert({ id: userId, stripe_customer_id: customerId });
      }

      if (session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionToDb(subscription, userId);
      }
      break;
    }

    // ── Subscription updated ───────────────────────────────────────────────
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const userId = await getCustomerUserId(customerId, subscription.metadata);

      const logResult = await logWebhookEvent(event.id, event.type, event, userId);
      if (logResult === "duplicate") return;

      await syncSubscriptionToDb(subscription, userId);
      break;
    }

    // ── Subscription deleted (canceled) ────────────────────────────────────
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const userId = await getCustomerUserId(customerId, subscription.metadata);

      const logResult = await logWebhookEvent(event.id, event.type, event, userId);
      if (logResult === "duplicate") return;

      await syncSubscriptionToDb(subscription, userId);
      break;
    }

    // ── Trial ending soon (3 days before) ─────────────────────────────────
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const userId = await getCustomerUserId(customerId, subscription.metadata);

      const logResult = await logWebhookEvent(event.id, event.type, event, userId);
      if (logResult === "duplicate") return;

      // Log for visibility; email notifications handled by Stripe dashboard settings.
      console.log(`[stripe] trial ending soon for user ${userId ?? customerId}`);
      break;
    }

    // ── Invoice paid (successful renewal) ─────────────────────────────────
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) return;

      const userId = (await resolveUserByCustomerId(customerId)) ?? undefined;

      const logResult = await logWebhookEvent(event.id, event.type, event, userId);
      if (logResult === "duplicate") return;

      // Refresh subscription state from Stripe to ensure DB is in sync.
      // In API version 2026-02-25.clover, subscription lives at invoice.parent.subscription_details.subscription
      const rawSub = invoice.parent?.subscription_details?.subscription;
      if (rawSub) {
        const subId = typeof rawSub === "string" ? rawSub : rawSub.id;
        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionToDb(subscription, userId);
      }
      break;
    }

    // ── Invoice payment failed ─────────────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) return;

      const userId = (await resolveUserByCustomerId(customerId)) ?? undefined;

      const logResult = await logWebhookEvent(event.id, event.type, event, userId);
      if (logResult === "duplicate") return;

      if (userId) {
        const db = createServerSupabaseClient();
        await db
          .from("users")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);
      }
      break;
    }

    default:
      // Unhandled events are acknowledged with 200 (Stripe will not retry).
      console.log(`[stripe] unhandled event type: ${event.type}`);
  }
}
