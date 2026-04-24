"use client";

import { useState, useCallback } from "react";

export type BillingCycle = "monthly" | "yearly";

interface UseCheckoutReturn {
  startCheckout: (priceId: string, billingCycle: BillingCycle) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useCheckout(): UseCheckoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async (priceId: string, billingCycle: BillingCycle): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId, billingCycle }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string; redirect?: string };
          if (response.status === 401) {
            const params = new URLSearchParams({ priceId, billingCycle });
            window.location.href = `/sign-up?${params.toString()}`;
            return;
          }
          throw new Error(data.error ?? `Request failed: ${response.status}`);
        }

        const { url } = (await response.json()) as { url: string };
        window.location.href = url;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Checkout failed";
        setError(message);
        setIsLoading(false);
      }
    },
    []
  );

  return { startCheckout, isLoading, error };
}
