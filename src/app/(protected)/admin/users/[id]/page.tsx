import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { getAdminUserById, getAuditLogs, getSubscriptionEvents } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string, includeTime = false) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border last:border-0">
      <dt className="w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className="flex-1 text-sm text-foreground">{value}</dd>
    </div>
  );
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
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (image) {
    return <img src={image} alt={name} className="h-14 w-14 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-base font-semibold text-muted-foreground">
      {initials}
    </span>
  );
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  await requireAdmin(await headers());
  const { id } = await params;

  const [user, auditLogs, subEvents] = await Promise.all([
    getAdminUserById(id),
    getAuditLogs(id),
    getSubscriptionEvents(id),
  ]);

  if (!user) notFound();

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Back link */}
      <a
        href="/admin/users"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        ← Back to users
      </a>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar name={user.name} image={user.image} />
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Profile card */}
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Profile
          </h2>
        </div>
        <dl className="px-4">
          <InfoRow label="User ID" value={<code className="text-xs font-mono">{user.id}</code>} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow
            label="Email Verified"
            value={
              user.emailVerified ? (
                <Badge variant="default" className="text-xs">Verified</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Unverified</Badge>
              )
            }
          />
          <InfoRow label="Role" value={<RoleBadge role={user.role} />} />
          <InfoRow label="Joined" value={formatDate(user.createdAt, true)} />
        </dl>
      </section>

      {/* Subscription card */}
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Subscription
          </h2>
        </div>
        <dl className="px-4">
          <InfoRow label="Status" value={<SubBadge status={user.subscription_status} />} />
          <InfoRow
            label="Period End"
            value={
              user.subscription_period_end
                ? formatDate(user.subscription_period_end)
                : <span className="text-xs text-muted-foreground">—</span>
            }
          />
          <InfoRow
            label="Stripe Customer"
            value={
              user.stripe_customer_id ? (
                <code className="text-xs font-mono">{user.stripe_customer_id}</code>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            }
          />
        </dl>
      </section>

      {/* Subscription events */}
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Subscription Events
          </h2>
        </div>
        {subEvents.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No events recorded.</p>
        ) : (
          <div className="divide-y divide-border">
            {subEvents.map((evt) => (
              <div key={evt.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {evt.event_type.replace(/_/g, " ")}
                  </span>
                  <code className="text-xs text-muted-foreground font-mono">{evt.stripe_event_id}</code>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(evt.processed_at, true)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audit logs */}
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Activity Log
          </h2>
        </div>
        {auditLogs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No activity recorded.</p>
        ) : (
          <div className="divide-y divide-border">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {log.action.replace(/_/g, " ")}
                  </span>
                  {log.metadata && Object.keys(log.metadata as object).length > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {JSON.stringify(log.metadata)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(log.created_at, true)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
