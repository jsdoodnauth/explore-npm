"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Could not open billing portal");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button size="sm" variant="outline" disabled={pending} onClick={handleClick}>
        {pending ? "Opening…" : "Manage billing"}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}

export function CancelSubscriptionButton() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function handleCancel() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/user/subscription/cancel", { method: "POST" });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Cancellation failed");
      setDone(true);
      setConfirming(false);
      // Reload to reflect updated status
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPending(false);
      setConfirming(false);
    }
  }

  if (done) {
    return <span className="text-sm text-muted-foreground">Subscription will cancel at period end.</span>;
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">Are you sure?</span>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => void handleCancel()}
        >
          {pending ? "Canceling…" : "Yes, cancel"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Never mind
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline transition-colors"
    >
      Cancel subscription
    </button>
  );
}

interface UpgradeButtonProps {
  priceId: string;
  label: string;
}

export function UpgradeButton({ priceId, label }: UpgradeButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Could not start checkout");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button size="sm" disabled={pending} onClick={handleClick}>
        {pending ? "Loading…" : label}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
