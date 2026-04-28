import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — Explore NPM" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-heading font-medium">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Favorites and lists will live here soon.
        </p>
      </div>
    </div>
  );
}
