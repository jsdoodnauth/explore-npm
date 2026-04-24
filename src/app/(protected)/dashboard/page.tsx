import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — Meridian" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-heading font-medium">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: "$0", change: "—" },
          { label: "Active Users", value: "0", change: "—" },
          { label: "Subscriptions", value: "0", change: "—" },
          { label: "Churn Rate", value: "0%", change: "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-heading font-medium">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
