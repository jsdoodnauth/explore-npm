import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { getAnalyticsOverview } from "@/lib/admin-queries";

function formatMrr(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-heading text-3xl font-semibold text-foreground">{value}</p>
      {href && (
        <a
          href={href}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors w-fit"
        >
          View details →
        </a>
      )}
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin(await headers());
  const overview = await getAnalyticsOverview();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Admin Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform summary and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={overview.totalUsers.toLocaleString()} href="/admin/users" />
        <StatCard label="Active Subscriptions" value={overview.activeSubscriptions} />
        <StatCard label="Trialing" value={overview.trialingSubscriptions} />
        <StatCard label="MRR" value={formatMrr(overview.mrr)} href="/admin/analytics" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <a
          href="/admin/users"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Manage Users →
        </a>
        <a
          href="/admin/analytics"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View Analytics →
        </a>
      </div>
    </div>
  );
}
