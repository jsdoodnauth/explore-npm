"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MrrChart,
  ActiveSubsChart,
  SignupsChart,
  StatusBreakdownChart,
} from "@/components/admin/AnalyticsCharts";
import type { AnalyticsOverview, AnalyticsSnapshot } from "@/lib/admin-queries";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMrr(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function Trend({ value, invert = false }: { value: number; invert?: boolean }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">no change</span>;
  const positive = invert ? value < 0 : value > 0;
  return (
    <span className={cn("text-xs font-medium", positive ? "text-emerald-500" : "text-destructive")}>
      {value > 0 ? "+" : ""}
      {value}% vs last 30d
    </span>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-heading text-3xl font-semibold text-foreground">{value}</p>
      {trend}
    </div>
  );
}

// ── Chart card ─────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}

// ── Date range tabs ────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
];

function DateRangeTabs({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setDays(days: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", days);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
      {DATE_RANGES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setDays(value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            String(current) === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Export button ──────────────────────────────────────────────────────────

function ExportButton({
  snapshots,
  signupsByMonth,
}: {
  snapshots: AnalyticsSnapshot[];
  signupsByMonth: { month: string; signups: number }[];
}) {
  function handleExport() {
    const rows = [
      ["Date", "MRR ($)", "Active Subscriptions", "New Signups (snapshot)", "Churned"],
      ...snapshots.map((s) => [
        s.date,
        (s.mrr / 100).toFixed(2),
        s.active_subscriptions,
        s.new_signups,
        s.churned,
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      Export CSV
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface AnalyticsContentProps {
  overview: AnalyticsOverview;
  snapshots: AnalyticsSnapshot[];
  signupsByMonth: { month: string; signups: number }[];
  statusBreakdown: { status: string; count: number }[];
  days: number;
}

export function AnalyticsContent({
  overview,
  snapshots,
  signupsByMonth,
  statusBreakdown,
  days,
}: AnalyticsContentProps) {
  const hasSnapshots = snapshots.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        <DateRangeTabs current={days} />
        <ExportButton snapshots={snapshots} signupsByMonth={signupsByMonth} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="MRR"
          value={formatMrr(overview.mrr)}
          trend={<Trend value={overview.mrrChange} />}
        />
        <StatCard
          label="Active Subscriptions"
          value={overview.activeSubscriptions}
        />
        <StatCard
          label="Total Users"
          value={overview.totalUsers.toLocaleString()}
          trend={<Trend value={overview.userGrowth} />}
        />
        <StatCard
          label="30d Churn Rate"
          value={`${overview.churnRate}%`}
          trend={<Trend value={overview.churnRate} invert />}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={`MRR — last ${days} days`}>
          {hasSnapshots ? (
            <MrrChart snapshots={snapshots} />
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
        <ChartCard title={`Active subscriptions — last ${days} days`}>
          {hasSnapshots ? (
            <ActiveSubsChart snapshots={snapshots} />
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="New signups by month — last 12 months">
          <SignupsChart data={signupsByMonth} />
        </ChartCard>
        <ChartCard title="Subscription status breakdown">
          <StatusBreakdownChart data={statusBreakdown} />
        </ChartCard>
      </div>

      {/* Trialing callout */}
      {overview.trialingSubscriptions > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{overview.trialingSubscriptions}</span>{" "}
          {overview.trialingSubscriptions === 1 ? "user is" : "users are"} currently on a free
          trial.
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      No snapshot data for this range. Analytics snapshots are written by the webhook handler
      daily.
    </div>
  );
}
