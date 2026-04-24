"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProfileFormProps {
  name: string;
  email: string;
}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [currentName, setCurrentName] = useState(name);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newName = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (!newName || newName === name) return;

    setPending(true);
    setStatus("idle");
    setError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setCurrentName(newName);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Display name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          required
          minLength={1}
          maxLength={80}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="h-9 rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {status === "success" && (
          <span className="text-sm text-emerald-500">Saved.</span>
        )}
        {status === "error" && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    </form>
  );
}
