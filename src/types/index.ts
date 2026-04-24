import type { Session as BetterAuthSession } from "better-auth";
import type { Stripe } from "stripe";

// ─── User roles ───────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

// ─── Subscription states ──────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid";

// ─── Extended user type ───────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { BetterAuthSession as Session };
export type WebhookEvent = Stripe.Event;
