"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AnalyticsSnapshot } from "@/lib/admin-queries";

// ── Shared tooltip style ───────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--popover-foreground))",
};

// ── MRR Chart ──────────────────────────────────────────────────────────────

interface MrrChartProps {
  snapshots: AnalyticsSnapshot[];
}

export function MrrChart({ snapshots }: MrrChartProps) {
  const data = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    mrr: s.mrr / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toLocaleString()}`}
          width={60}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "MRR"]}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="mrr"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#mrrGradient)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Active Subscriptions Chart ─────────────────────────────────────────────

export function ActiveSubsChart({ snapshots }: MrrChartProps) {
  const data = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    active: s.active_subscriptions,
    churned: s.churned,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="active"
          name="Active"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#activeGradient)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── User Signups Bar Chart ─────────────────────────────────────────────────

interface SignupsChartProps {
  data: { month: string; signups: number }[];
}

export function SignupsChart({ data }: SignupsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={30}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [v, "Signups"]}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
        />
        <Bar
          dataKey="signups"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Subscription Status Pie Chart ──────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(var(--primary))",
  trialing: "hsl(142 76% 36%)",
  past_due: "hsl(var(--destructive))",
  canceled: "hsl(var(--muted-foreground))",
  unpaid: "hsl(25 95% 53%)",
  incomplete: "hsl(var(--muted-foreground))",
  paused: "hsl(var(--muted-foreground))",
};

interface StatusBreakdownProps {
  data: { status: string; count: number }[];
}

export function StatusBreakdownChart({ data }: StatusBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No subscription data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? "hsl(var(--muted-foreground))"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v, name) => [v, String(name).replace(/_/g, " ")]}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
              {value.replace(/_/g, " ")}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
