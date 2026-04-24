import { Suspense } from "react";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { getAdminUsers } from "@/lib/admin-queries";
import { UsersTable } from "@/components/admin/UsersTable";
import type { SortField, SortDir } from "@/lib/admin-queries";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; dir?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdmin(await headers());

  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sortField = (params.sort as SortField) ?? "created_at";
  const sortDir = (params.dir as SortDir) ?? "desc";

  const validSortFields: SortField[] = ["created_at", "email", "name", "subscription_status", "role"];
  const safeSortField: SortField = validSortFields.includes(sortField) ? sortField : "created_at";
  const safeSortDir: SortDir = sortDir === "asc" ? "asc" : "desc";

  const data = await getAdminUsers({
    search,
    page,
    sortField: safeSortField,
    sortDir: safeSortDir,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage and view all registered users.</p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <UsersTable
          data={data}
          search={search}
          sortField={safeSortField}
          sortDir={safeSortDir}
        />
      </Suspense>
    </div>
  );
}
