import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase";

export type SortField = "created_at" | "email" | "name" | "subscription_status" | "role";
export type SortDir = "asc" | "desc";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  role: string | null;
  subscription_status: string | null;
  subscription_period_end: string | null;
  stripe_customer_id: string | null;
}

export interface UsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAdminUsers({
  search = "",
  page = 1,
  pageSize = 20,
  sortField = "created_at",
  sortDir = "desc",
}: {
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: SortField;
  sortDir?: SortDir;
}): Promise<UsersPage> {
  const db = createServerSupabaseClient();
  const offset = (page - 1) * pageSize;

  // BetterAuth stores core user data in public."user" (quoted — reserved word).
  // App data (role, subscription) lives in public.users.
  // We LEFT JOIN so users without a profile row still appear.
  let query = db
    .from("user")
    .select(
      `id, name, email, "emailVerified", image, "createdAt",
       users:users!users_id_fkey(role, subscription_status, subscription_period_end, stripe_customer_id)`,
      { count: "exact" }
    )
    .range(offset, offset + pageSize - 1);

  if (search.trim()) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  // Sort by BetterAuth fields directly; subscription fields need special handling
  const betterAuthFields: Record<string, string> = {
    created_at: '"createdAt"',
    email: "email",
    name: "name",
  };

  if (betterAuthFields[sortField]) {
    query = query.order(sortField === "created_at" ? "createdAt" : sortField, {
      ascending: sortDir === "asc",
    });
  } else {
    // For subscription_status and role, default fallback sort
    query = query.order("createdAt", { ascending: false });
  }

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);

  const users: AdminUser[] = (data ?? []).map((row) => {
    const profile = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image ?? null,
      createdAt: row.createdAt,
      role: profile?.role ?? null,
      subscription_status: profile?.subscription_status ?? null,
      subscription_period_end: profile?.subscription_period_end ?? null,
      stripe_customer_id: profile?.stripe_customer_id ?? null,
    };
  });

  const total = count ?? 0;

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminUserById(userId: string): Promise<AdminUser | null> {
  const db = createServerSupabaseClient();

  const { data, error } = await db
    .from("user")
    .select(
      `id, name, email, "emailVerified", image, "createdAt",
       users:users!users_id_fkey(role, subscription_status, subscription_period_end, stripe_customer_id)`
    )
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const profile = Array.isArray(data.users) ? data.users[0] : data.users;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    emailVerified: data.emailVerified,
    image: data.image ?? null,
    createdAt: data.createdAt,
    role: profile?.role ?? null,
    subscription_status: profile?.subscription_status ?? null,
    subscription_period_end: profile?.subscription_period_end ?? null,
    stripe_customer_id: profile?.stripe_customer_id ?? null,
  };
}

export async function getAuditLogs(userId: string, limit = 20) {
  const db = createServerSupabaseClient();

  const { data, error } = await db
    .from("audit_logs")
    .select("id, action, metadata, created_at, actor_id")
    .eq("target_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);
  return data ?? [];
}

export async function getSubscriptionEvents(userId: string, limit = 20) {
  const db = createServerSupabaseClient();

  const { data, error } = await db
    .from("subscription_events")
    .select("id, stripe_event_id, event_type, processed_at")
    .eq("user_id", userId)
    .order("processed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch subscription events: ${error.message}`);
  return data ?? [];
}

// ── Analytics ──────────────────────────────────────────────────────────────

export interface AnalyticsSnapshot {
  date: string;
  mrr: number; // cents
  active_subscriptions: number;
  new_signups: number;
  churned: number;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  mrr: number; // cents — sum of active subscriptions (approximated from snapshots)
  mrrChange: number; // % vs 30 days ago
  userGrowth: number; // % vs 30 days ago
  churnRate: number; // % churned in last 30 days vs active 30 days ago
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const db = createServerSupabaseClient();

  const [usersResult, subsResult, snapshotsResult] = await Promise.all([
    db.from("user").select("id", { count: "exact", head: true }),
    db.from("subscriptions").select("status"),
    db
      .from("analytics_snapshots")
      .select("date, mrr, active_subscriptions, new_signups, churned")
      .order("date", { ascending: false })
      .limit(62), // ~2 months of data
  ]);

  const totalUsers = usersResult.count ?? 0;
  const subs = subsResult.data ?? [];
  const activeSubscriptions = subs.filter((s) => s.status === "active").length;
  const trialingSubscriptions = subs.filter((s) => s.status === "trialing").length;

  const snapshots: AnalyticsSnapshot[] = (snapshotsResult.data ?? []).reverse();
  const latest = snapshots[snapshots.length - 1];
  const thirtyAgo = snapshots.length >= 31 ? snapshots[snapshots.length - 32] : null;

  const mrr = latest?.mrr ?? 0;
  const mrrThirtyAgo = thirtyAgo?.mrr ?? 0;
  const mrrChange =
    mrrThirtyAgo > 0 ? Math.round(((mrr - mrrThirtyAgo) / mrrThirtyAgo) * 100) : 0;

  const activeThirtyAgo = thirtyAgo?.active_subscriptions ?? activeSubscriptions;
  const recentChurned = snapshots
    .slice(-30)
    .reduce((sum, s) => sum + (s.churned ?? 0), 0);
  const churnRate =
    activeThirtyAgo > 0 ? Math.round((recentChurned / activeThirtyAgo) * 100) : 0;

  // User growth: new signups in last 30 days vs prior 30
  const recentSignups = snapshots.slice(-30).reduce((sum, s) => sum + (s.new_signups ?? 0), 0);
  const priorSignups = snapshots
    .slice(-60, -30)
    .reduce((sum, s) => sum + (s.new_signups ?? 0), 0);
  const userGrowth =
    priorSignups > 0 ? Math.round(((recentSignups - priorSignups) / priorSignups) * 100) : 0;

  return {
    totalUsers,
    activeSubscriptions,
    trialingSubscriptions,
    mrr,
    mrrChange,
    userGrowth,
    churnRate,
  };
}

export async function getAnalyticsSnapshots(days = 30): Promise<AnalyticsSnapshot[]> {
  const db = createServerSupabaseClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await db
    .from("analytics_snapshots")
    .select("date, mrr, active_subscriptions, new_signups, churned")
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) throw new Error(`Failed to fetch analytics snapshots: ${error.message}`);
  return data ?? [];
}

export async function getSignupsByMonth(): Promise<{ month: string; signups: number }[]> {
  const db = createServerSupabaseClient();

  // Group BetterAuth user createdAt by month for the last 12 months
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);

  const { data, error } = await db
    .from("user")
    .select("createdAt")
    .gte("createdAt", since.toISOString());

  if (error) throw new Error(`Failed to fetch signups: ${error.message}`);

  const byMonth: Record<string, number> = {};
  for (const row of data ?? []) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }

  // Fill all months even if zero
  const result: { month: string; signups: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    result.push({ month: label, signups: byMonth[key] ?? 0 });
  }

  return result;
}

export async function getSubscriptionStatusBreakdown(): Promise<
  { status: string; count: number }[]
> {
  const db = createServerSupabaseClient();

  const { data, error } = await db.from("subscriptions").select("status");

  if (error) throw new Error(`Failed to fetch subscription statuses: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Subscription Management ────────────────────────────────────────────────

export type SubSortField = "created_at" | "current_period_end" | "status" | "updated_at";

export interface AdminSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  status: string;
  price_id: string;
  product_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  // joined from user + users profile
  user_name: string;
  user_email: string;
  user_image: string | null;
}

export interface SubscriptionsPage {
  subscriptions: AdminSubscription[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAdminSubscriptions({
  search = "",
  status = "",
  page = 1,
  pageSize = 20,
  sortField = "created_at",
  sortDir = "desc",
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortField?: SubSortField;
  sortDir?: SortDir;
}): Promise<SubscriptionsPage> {
  const db = createServerSupabaseClient();
  const offset = (page - 1) * pageSize;

  // Fetch subscriptions with user data via users profile table
  let query = db
    .from("subscriptions")
    .select(
      `id, user_id, stripe_customer_id, status, price_id, product_id,
       current_period_start, current_period_end, cancel_at_period_end,
       canceled_at, created_at, updated_at,
       users!subscriptions_user_id_fkey(stripe_customer_id)`,
      { count: "exact" }
    )
    .range(offset, offset + pageSize - 1)
    .order(sortField, { ascending: sortDir === "asc" });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: subRows, count, error: subError } = await query;
  if (subError) throw new Error(`Failed to fetch subscriptions: ${subError.message}`);

  if (!subRows || subRows.length === 0) {
    return { subscriptions: [], total: 0, page, pageSize, totalPages: 1 };
  }

  // Fetch user details from BetterAuth's user table
  const userIds = [...new Set(subRows.map((r) => r.user_id))];
  const { data: userRows, error: userError } = await db
    .from("user")
    .select(`id, name, email, image`)
    .in("id", userIds);

  if (userError) throw new Error(`Failed to fetch users: ${userError.message}`);

  const userMap = new Map((userRows ?? []).map((u) => [u.id, u]));

  let subscriptions: AdminSubscription[] = subRows.map((row) => {
    const user = userMap.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      stripe_customer_id: row.stripe_customer_id,
      status: row.status,
      price_id: row.price_id,
      product_id: row.product_id,
      current_period_start: row.current_period_start,
      current_period_end: row.current_period_end,
      cancel_at_period_end: row.cancel_at_period_end,
      canceled_at: row.canceled_at ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: user?.name ?? "Unknown",
      user_email: user?.email ?? "",
      user_image: user?.image ?? null,
    };
  });

  // Apply search filter client-side (email/name from joined user table)
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    subscriptions = subscriptions.filter(
      (s) =>
        s.user_email.toLowerCase().includes(q) ||
        s.user_name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.stripe_customer_id.toLowerCase().includes(q)
    );
  }

  const total = count ?? 0;

  return {
    subscriptions,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getUpcomingRenewals(days = 7): Promise<AdminSubscription[]> {
  const db = createServerSupabaseClient();
  const now = new Date().toISOString();
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: subRows, error } = await db
    .from("subscriptions")
    .select(
      `id, user_id, stripe_customer_id, status, price_id, product_id,
       current_period_start, current_period_end, cancel_at_period_end,
       canceled_at, created_at, updated_at`
    )
    .in("status", ["active", "trialing"])
    .gte("current_period_end", now)
    .lte("current_period_end", future)
    .order("current_period_end", { ascending: true });

  if (error) throw new Error(`Failed to fetch renewals: ${error.message}`);
  if (!subRows || subRows.length === 0) return [];

  const userIds = [...new Set(subRows.map((r) => r.user_id))];
  const { data: userRows } = await db
    .from("user")
    .select(`id, name, email, image`)
    .in("id", userIds);

  const userMap = new Map((userRows ?? []).map((u) => [u.id, u]));

  return subRows.map((row) => {
    const user = userMap.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      stripe_customer_id: row.stripe_customer_id,
      status: row.status,
      price_id: row.price_id,
      product_id: row.product_id,
      current_period_start: row.current_period_start,
      current_period_end: row.current_period_end,
      cancel_at_period_end: row.cancel_at_period_end,
      canceled_at: row.canceled_at ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: user?.name ?? "Unknown",
      user_email: user?.email ?? "",
      user_image: user?.image ?? null,
    };
  });
}

export async function getFailedPayments(): Promise<AdminSubscription[]> {
  const db = createServerSupabaseClient();

  const { data: subRows, error } = await db
    .from("subscriptions")
    .select(
      `id, user_id, stripe_customer_id, status, price_id, product_id,
       current_period_start, current_period_end, cancel_at_period_end,
       canceled_at, created_at, updated_at`
    )
    .in("status", ["past_due", "unpaid"])
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch failed payments: ${error.message}`);
  if (!subRows || subRows.length === 0) return [];

  const userIds = [...new Set(subRows.map((r) => r.user_id))];
  const { data: userRows } = await db
    .from("user")
    .select(`id, name, email, image`)
    .in("id", userIds);

  const userMap = new Map((userRows ?? []).map((u) => [u.id, u]));

  return subRows.map((row) => {
    const user = userMap.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      stripe_customer_id: row.stripe_customer_id,
      status: row.status,
      price_id: row.price_id,
      product_id: row.product_id,
      current_period_start: row.current_period_start,
      current_period_end: row.current_period_end,
      cancel_at_period_end: row.cancel_at_period_end,
      canceled_at: row.canceled_at ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: user?.name ?? "Unknown",
      user_email: user?.email ?? "",
      user_image: user?.image ?? null,
    };
  });
}
