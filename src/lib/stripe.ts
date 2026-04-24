import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error("Missing environment variable: STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(key, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export type { Stripe };
