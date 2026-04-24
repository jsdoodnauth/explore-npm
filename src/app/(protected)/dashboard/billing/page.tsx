import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { getUserSubscription, getSubscriptionEvents } from "@/lib/user-queries";
import { Badge } from "@/components/ui/badge";
import {
  ManageBillingButton,
  CancelSubscriptionButton,
  UpgradeButton,
} from "@/components/dashboard/BillingActions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const STATUS_STYLES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  canceled: "outline",
  unpaid: "destructive",
};

function tierLabel(priceId: string): string {
  const id = priceId.toLowerCase();
  if (id.includes("enterprise")) return "Enterprise";
  if (id.includes("pro")) return "Pro";
  return "Paid";
}

function billingCycleLabel(priceId: string): string {
  const id = priceId.toLowerCase();
  if (id.includes("yearly") || id.includes("annual")) return "Yearly";
  return "Monthly";
}

export default async function BillingPage() {
  const session = await requireSession(await headers());
  const userId = session.user.id;

  const [subscription, events] = await Promise.all([
    getUserSubscription(userId),
    getSubscriptionEvents(userId, 10),
  ]);

  const proMonthlyId = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "";
  const proYearlyId = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID ?? "";

  const isActive = subscription && ["active", "trialing"].includes(subscription.status);

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      {/* Current plan */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-muted/40 px-5 py-3 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Current plan
          </h2>
        </div>

        <div className="p-5">
          {subscription ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {tierLabel(subscription.price_id)} — {billingCycleLabel(subscription.price_id)}
                    </p>
                    <Badge variant={STATUS_STYLES[subscription.status] ?? "outline"}>
                      {subscription.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {subscription.status === "trialing" && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Trial ends {formatDate(subscription.current_period_end)}.
                    </p>
                  )}

                  {subscription.status === "active" && !subscription.cancel_at_period_end && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Renews {formatDate(subscription.current_period_end)}.
                    </p>
                  )}

                  {subscription.cancel_at_period_end && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Access until {formatDate(subscription.current_period_end)}, then cancels.
                    </p>
                  )}

                  {subscription.status === "past_due" && (
                    <p className="mt-1 text-sm text-destructive">
                      Payment failed. Please update your payment method.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ManageBillingButton />
                {isActive && !subscription.cancel_at_period_end && (
                  <CancelSubscriptionButton />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-medium text-foreground">Free plan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upgrade to Pro to unlock all features.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {proMonthlyId && (
                  <UpgradeButton priceId={proMonthlyId} label="Upgrade to Pro (monthly)" />
                )}
                {proYearlyId && (
                  <UpgradeButton priceId={proYearlyId} label="Upgrade to Pro (yearly)" />
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Billing history / events */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-muted/40 px-5 py-3 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Billing history
          </h2>
        </div>

        {events.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No billing events yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-foreground capitalize">
                  {evt.event_type.replace(/\./g, " → ").replace(/_/g, " ")}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateShort(evt.processed_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {subscription && (
          <div className="border-t border-border px-5 py-3">
            <ManageBillingButton />
          </div>
        )}
      </section>

      {/* Invoice note */}
      <p className="text-xs text-muted-foreground">
        Full invoices and payment receipts are available in the Stripe billing portal via "Manage
        billing" above.
      </p>
    </div>
  );
}
