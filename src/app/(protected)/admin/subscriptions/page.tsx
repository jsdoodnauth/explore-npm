import { Suspense } from "react";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import {
  getAdminSubscriptions,
  getUpcomingRenewals,
  getFailedPayments,
} from "@/lib/admin-queries";
import { SubscriptionsTable } from "@/components/admin/SubscriptionsTable";
import { SubscriptionAlerts } from "@/components/admin/SubscriptionAlerts";
import type { SubSortField, SortDir } from "@/lib/admin-queries";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
    dir?: string;
  }>;
}

const VALID_SORT_FIELDS: SubSortField[] = ["created_at", "current_period_end", "status", "updated_at"];

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  await requireAdmin(await headers());

  const params = await searchParams;
  const search = params.q ?? "";
  const status = params.status ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sortField: SubSortField = VALID_SORT_FIELDS.includes(params.sort as SubSortField)
    ? (params.sort as SubSortField)
    : "created_at";
  const sortDir: SortDir = params.dir === "asc" ? "asc" : "desc";

  const [data, renewals, failedPayments] = await Promise.all([
    getAdminSubscriptions({ search, status, page, sortField, sortDir }),
    getUpcomingRenewals(7),
    getFailedPayments(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage active subscriptions, renewals, and payment issues.
        </p>
      </div>

      {/* Alerts: upcoming renewals + failed payments */}
      <SubscriptionAlerts renewals={renewals} failedPayments={failedPayments} />

      {/* Full table */}
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <SubscriptionsTable
          data={data}
          search={search}
          status={status}
          sortField={sortField}
          sortDir={sortDir}
        />
      </Suspense>
    </div>
  );
}
