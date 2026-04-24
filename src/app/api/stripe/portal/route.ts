import "server-only";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Rate limit: 10 portal sessions per minute per user
export async function POST(_request: Request): Promise<Response> {
  const session = await requireSession(await headers());
  const { user } = session;

  const rl = rateLimit(`portal:${user.id}`, 10, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const db = createServerSupabaseClient();

    const { data: userRow, error } = await db
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (error) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (!userRow?.stripe_customer_id) {
      return Response.json(
        { error: "No Stripe customer found. Please subscribe first." },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return Response.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[stripe/portal]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
