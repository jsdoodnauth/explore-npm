"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check } from "lucide-react";
import { usePricingToggle } from "@/hooks/usePricingToggle";
import { useCheckout } from "@/hooks/useCheckout";
import { cn } from "@/lib/utils";

// Price IDs are not secret — safe to expose via NEXT_PUBLIC_ vars.
// The server validates them against real Stripe price IDs at checkout time.
const PRICE_IDS = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID ?? "",
  },
} as const;

const tiers = [
  {
    name: "Starter",
    tier: "starter" as const,
    monthlyPrice: 0,
    description: "Perfect for side projects and exploration.",
    features: ["Up to 3 projects", "5GB storage", "Community support", "Basic analytics"],
    cta: "Get started",
    ctaVariant: "outline" as const,
    highlighted: false,
    free: true,
  },
  {
    name: "Pro",
    tier: "pro" as const,
    monthlyPrice: 29,
    description: "For growing teams that need more power.",
    features: ["Unlimited projects", "50GB storage", "Priority support", "Advanced analytics", "Custom domains", "Team collaboration"],
    cta: "Start free trial",
    ctaVariant: "default" as const,
    highlighted: true,
    free: false,
    trialLabel: "14-day free trial",
  },
  {
    name: "Enterprise",
    tier: "enterprise" as const,
    monthlyPrice: 99,
    description: "For large organizations with custom needs.",
    features: ["Everything in Pro", "Unlimited storage", "Dedicated support", "SLA guarantee", "SSO & SAML", "Custom contracts"],
    cta: "Get started",
    ctaVariant: "outline" as const,
    highlighted: false,
    free: false,
  },
];

export function PricingCards() {
  const { isYearly, setIsYearly, getPrice, savingsLabel } = usePricingToggle();
  const { startCheckout, isLoading, error } = useCheckout();

  const billingCycle = isYearly ? "yearly" : "monthly";

  function handleTierClick(tier: typeof tiers[number]) {
    if (tier.free) {
      window.location.href = "/sign-up";
      return;
    }
    const priceId = PRICE_IDS[tier.tier as "pro" | "enterprise"][billingCycle];
    if (!priceId) {
      // Price ID not configured — fall back to sign-up
      window.location.href = `/sign-up?plan=${tier.tier}`;
      return;
    }
    void startCheckout(priceId, billingCycle);
  }

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={cn("text-sm transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
        <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle yearly billing" />
        <span className={cn("text-sm transition-colors", isYearly ? "text-foreground" : "text-muted-foreground")}>Yearly</span>
        {isYearly && (
          <Badge variant="secondary" className="animate-in fade-in duration-200">
            {savingsLabel}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const price = getPrice(tier.monthlyPrice);
          return (
            <Card
              key={tier.name}
              className={cn(
                "relative flex flex-col transition-shadow",
                tier.highlighted && "ring-2 ring-foreground shadow-lg mt-0 overflow-visible"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader className="p-6 pb-0">
                <p className="text-sm font-medium text-muted-foreground">{tier.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span
                    key={isYearly ? `${tier.name}-y` : `${tier.name}-m`}
                    className="animate-in fade-in text-4xl font-heading duration-200"
                  >
                    {price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="mb-1 text-sm text-muted-foreground">/{isYearly ? "yr" : "mo"}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                {"trialLabel" in tier && (
                  <p className="mt-1 text-xs text-muted-foreground">{tier.trialLabel}</p>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6">
                <ul className="mb-8 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.ctaVariant}
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => handleTierClick(tier)}
                >
                  {isLoading && !tier.free ? "Redirecting…" : tier.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
