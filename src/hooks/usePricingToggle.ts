"use client";

import { useState } from "react";

export function usePricingToggle() {
  const [isYearly, setIsYearly] = useState(false);

  function getPrice(monthly: number): number {
    return isYearly ? monthly * 10 : monthly;
  }

  const savingsLabel = "Save 17%";

  return { isYearly, setIsYearly, getPrice, savingsLabel };
}
