import "server-only";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { getTrialDaysForPriceId, PRICING_TIERS } from "@/lib/stripe-products";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkoutSchema, parseBody } from "@/lib/schemas";

// Whitelist of valid price IDs derived from the tier config.
const VALID_PRICE_IDS = new Set(
  Object.values(PRICING_TIERS).flatMap((t) =>
    t.free ? [] : Object.values(t.priceIds)
  )
);

// Rate limit: 5 checkout attempts per 10 minutes per IP
export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const rl = rateLimit(`checkout:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const session = await getSession(await headers());
  if (!session) {
    return Response.json({ error: "Unauthorized", redirect: "/sign-up" }, { status: 401 });
  }
  const { user } = session;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseBody(checkoutSchema, rawBody);
  if (!parsed.success) return parsed.response;
  const { priceId, billingCycle } = parsed.data;

  if (!VALID_PRICE_IDS.has(priceId)) {
    return Response.json({ error: "Invalid priceId" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.name ?? user.email
    );

    const trialDays = getTrialDaysForPriceId(priceId);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { userId: user.id },
        ...(trialDays !== null ? { trial_period_days: trialDays } : {}),
      },
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
    });

    if (!checkoutSession.url) {
      return Response.json({ error: "No checkout URL returned" }, { status: 502 });
    }

    return Response.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[stripe/checkout]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
