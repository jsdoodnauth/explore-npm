import "server-only";

export const TRIAL_PERIOD_DAYS = 14;

const proMonthly  = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
const proYearly   = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
const entMonthly  = process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID;
const entYearly   = process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID;

if (!proMonthly)  throw new Error("Missing env: STRIPE_PRO_MONTHLY_PRICE_ID");
if (!proYearly)   throw new Error("Missing env: STRIPE_PRO_YEARLY_PRICE_ID");
if (!entMonthly)  throw new Error("Missing env: STRIPE_ENTERPRISE_MONTHLY_PRICE_ID");
if (!entYearly)   throw new Error("Missing env: STRIPE_ENTERPRISE_YEARLY_PRICE_ID");

export type BillingCycle = "monthly" | "yearly";
export type PaidTierName = "pro" | "enterprise";
export type TierName = "starter" | PaidTierName;

interface FreeTier {
  name: "starter";
  free: true;
}

interface PaidTier {
  name: PaidTierName;
  free: false;
  trialDays: number | null;
  priceIds: Record<BillingCycle, string>;
}

export type TierConfig = FreeTier | PaidTier;

export const PRICING_TIERS: Record<TierName, TierConfig> = {
  starter: { name: "starter", free: true },
  pro: {
    name: "pro",
    free: false,
    trialDays: TRIAL_PERIOD_DAYS,
    priceIds: { monthly: proMonthly, yearly: proYearly },
  },
  enterprise: {
    name: "enterprise",
    free: false,
    trialDays: null,
    priceIds: { monthly: entMonthly, yearly: entYearly },
  },
};

export function getTierForPriceId(priceId: string): TierConfig | undefined {
  return Object.values(PRICING_TIERS).find(
    (t): t is PaidTier => !t.free && Object.values(t.priceIds).includes(priceId)
  );
}

export function getTrialDaysForPriceId(priceId: string): number | null {
  const tier = getTierForPriceId(priceId);
  if (!tier || tier.free) return null;
  return (tier as PaidTier).trialDays;
}
