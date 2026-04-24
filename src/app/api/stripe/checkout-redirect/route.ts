import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { getTrialDaysForPriceId, PRICING_TIERS } from "@/lib/stripe-products";

const VALID_PRICE_IDS = new Set(
  Object.values(PRICING_TIERS).flatMap((t) =>
    t.free ? [] : Object.values(t.priceIds)
  )
);

export async function GET(request: Request): Promise<Response> {
  const session = await getSession(await headers());
  if (!session) redirect("/sign-in");

  const { searchParams } = new URL(request.url);
  const priceId = searchParams.get("priceId") ?? "";
  const billingCycle = searchParams.get("billingCycle") ?? "monthly";

  if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
    redirect("/dashboard");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { user } = session;

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

    if (!checkoutSession.url) redirect("/dashboard");

    redirect(checkoutSession.url);
  } catch {
    redirect("/dashboard");
  }
}
