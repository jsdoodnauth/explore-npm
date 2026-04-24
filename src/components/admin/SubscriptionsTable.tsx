"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminSubscription, SubscriptionsPage, SubSortField, SortDir } from "@/lib/admin-queries";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string, includeTime = false) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUS_STYLES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  canceled: "outline",
  unpaid: "destructive",
  incomplete: "outline",
  paused: "outline",
};

function SubBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_STYLES[status] ?? "outline"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  if (image) return <img src={image} alt={name} className="h-7 w-7 rounded-full object-cover" />;
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
      {initials}
    </span>
  );
}

// ── Sort button ────────────────────────────────────────────────────────────

interface SortButtonProps {
  field: SubSortField;
  currentField: SubSortField;
  currentDir: SortDir;
  onSort: (field: SubSortField) => void;
  children: React.ReactNode;
}

function SortButton({ field, currentField, currentDir, onSort, children }: SortButtonProps) {
  const isActive = currentField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      {children}
      {isActive
        ? currentDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        : <ChevronDown className="h-3 w-3 opacity-30" />}
    </button>
  );
}

// ── Row actions ────────────────────────────────────────────────────────────

function RowActions({ sub, onDone }: { sub: AdminSubscription; onDone: () => void }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doAction(action: string) {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setPending(null);
    }
  }

  const canCancel = ["active", "trialing"].includes(sub.status) && !sub.cancel_at_period_end;
  const canReactivate = sub.cancel_at_period_end && sub.status !== "canceled";
  const canCancelNow = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);

  return (
    <div className="flex items-center gap-1">
      {error && <span className="text-xs text-destructive mr-1">{error}</span>}
      {canReactivate && (
        <Button
          size="sm"
          variant="outline"
          disabled={!!pending}
          onClick={() => void doAction("reactivate")}
          className="h-7 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {pending === "reactivate" ? "…" : "Reactivate"}
        </Button>
      )}
      {canCancel && (
        <Button
          size="sm"
          variant="outline"
          disabled={!!pending}
          onClick={() => void doAction("cancel")}
          className="h-7 text-xs text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          {pending === "cancel" ? "…" : "Cancel"}
        </Button>
      )}
      {canCancelNow && (
        <Button
          size="sm"
          variant="ghost"
          disabled={!!pending}
          onClick={() => void doAction("cancel_immediately")}
          className="h-7 text-xs text-destructive hover:text-destructive"
        >
          {pending === "cancel_immediately" ? "…" : "Cancel now"}
        </Button>
      )}
    </div>
  );
}

// ── Status filter tabs ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Trialing", value: "trialing" },
  { label: "Past due", value: "past_due" },
  { label: "Canceled", value: "canceled" },
];

// ── Main component ─────────────────────────────────────────────────────────

interface SubscriptionsTableProps {
  data: SubscriptionsPage;
  search: string;
  status: string;
  sortField: SubSortField;
  sortDir: SortDir;
}

export function SubscriptionsTable({
  data,
  search,
  status,
  sortField,
  sortDir,
}: SubscriptionsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams]
  );

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
    updateParams({ q, page: "1" });
  }

  function handleSort(field: SubSortField) {
    const newDir: SortDir = sortField === field && sortDir === "asc" ? "desc" : "asc";
    updateParams({ sort: field, dir: newDir, page: "1" });
  }

  function handlePage(p: number) {
    updateParams({ page: String(p) });
  }

  function handleStatus(s: string) {
    updateParams({ status: s, page: "1" });
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className={cn("flex flex-col gap-4", isPending && "opacity-60 pointer-events-none transition-opacity")}>
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search by name, email, or ID…"
              className="h-8 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">Search</Button>
          {search && (
            <Button type="button" size="sm" variant="ghost" onClick={() => updateParams({ q: "", page: "1" })}>
              Clear
            </Button>
          )}
        </form>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value || "all"}
              onClick={() => handleStatus(value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                status === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <p className="text-sm text-muted-foreground">
        {data.total === 0
          ? "No subscriptions found"
          : `${data.total} subscription${data.total === 1 ? "" : "s"}`}
        {status && ` with status "${status.replace(/_/g, " ")}"`}
        {search && ` matching "${search}"`}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-muted-foreground">Customer</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="status" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Status
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="current_period_end" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Renews
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="created_at" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Started
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-muted-foreground">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                data.subscriptions.map((sub) => {
                  const days = daysUntil(sub.current_period_end);
                  const isExpiringSoon = days <= 3 && days >= 0 && sub.status === "active";
                  return (
                    <tr key={sub.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={sub.user_name} image={sub.user_image} />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{sub.user_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{sub.user_email}</p>
                            <p className="text-[10px] text-muted-foreground/60 font-mono truncate">{sub.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <SubBadge status={sub.status} />
                          {sub.cancel_at_period_end && (
                            <span className="text-[10px] text-muted-foreground">cancels at period end</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span>{formatDate(sub.current_period_end)}</span>
                          {isExpiringSoon && (
                            <span className="flex items-center gap-1 text-amber-500 text-[10px]">
                              <AlertCircle className="h-2.5 w-2.5" />
                              {days === 0 ? "today" : `${days}d`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <RowActions sub={sub} onDone={refresh} />
                          <a
                            href={`/admin/users/${sub.user_id}`}
                            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            User
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {data.page} of {data.totalPages}</p>
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="outline" disabled={data.page <= 1} onClick={() => handlePage(1)}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={data.page <= 1} onClick={() => handlePage(data.page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={data.page >= data.totalPages} onClick={() => handlePage(data.page + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={data.page >= data.totalPages} onClick={() => handlePage(data.totalPages)}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
