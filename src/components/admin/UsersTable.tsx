"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminUser, UsersPage, SortField, SortDir } from "@/lib/admin-queries";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function RoleBadge({ role }: { role: string | null }) {
  if (role === "admin") return <Badge variant="default">Admin</Badge>;
  return <Badge variant="outline">User</Badge>;
}

function SubBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const styles: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    trialing: "secondary",
    past_due: "destructive",
    canceled: "outline",
    unpaid: "destructive",
  };
  return <Badge variant={styles[status] ?? "outline"}>{status.replace("_", " ")}</Badge>;
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  if (image) {
    return <img src={image} alt={name} className="h-7 w-7 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
      {initials}
    </span>
  );
}

// ── Sort button ───────────────────────────────────────────────────────────────

interface SortButtonProps {
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
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
      {isActive ? (
        currentDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface UsersTableProps {
  data: UsersPage;
  search: string;
  sortField: SortField;
  sortDir: SortDir;
}

export function UsersTable({ data, search, sortField, sortDir }: UsersTableProps) {
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

  function handleSort(field: SortField) {
    const newDir: SortDir =
      sortField === field && sortDir === "asc" ? "desc" : "asc";
    updateParams({ sort: field, dir: newDir, page: "1" });
  }

  function handlePage(p: number) {
    updateParams({ page: String(p) });
  }

  return (
    <div className={cn("flex flex-col gap-4", isPending && "opacity-60 pointer-events-none transition-opacity")}>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name or email…"
            className="h-8 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">Search</Button>
        {search && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => updateParams({ q: "", page: "1" })}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Stats row */}
      <p className="text-sm text-muted-foreground">
        {data.total === 0 ? "No users found" : `${data.total} user${data.total === 1 ? "" : "s"}`}
        {search && ` matching "${search}"`}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left">
                  <SortButton field="name" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    User
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="role" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Role
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="subscription_status" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Subscription
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="created_at" currentField={sortField} currentDir={sortDir} onSort={handleSort}>
                    Joined
                  </SortButton>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                data.users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </p>
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

function UserRow({ user }: { user: AdminUser }) {
  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} image={user.image} />
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <SubBadge status={user.subscription_status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <a
          href={`/admin/users/${user.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View
        </a>
      </td>
    </tr>
  );
}
